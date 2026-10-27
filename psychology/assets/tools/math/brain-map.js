/* Brain map model: ApPsychMath.brainMap (docs/appsych-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T2, docs/appsych-briefs/t2.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions
   and tables, no DOM, so the validator (scripts/lib/appsych-tool-checks/
   brain-map.mjs) and the test (scripts/test/appsych-tool-brain-map.test.mjs)
   run exactly this code. The drawing (paths) lives in the page script.

   The science (CED 1.4), kept in one place so the picture, the words and the
   drills agree:
     REGIONS     every structure the map can select: its name, the view it is
                 drawn in (outside = the left hemisphere seen from the left;
                 inside = the right hemisphere's inner surface, the brain cut
                 down the middle), what it does, what damage to it does, and
                 a real case where one fits
     METHODS     EEG, fMRI, case studies and lesioning: what each measures
     splitBrain(field, cut)
                 the classic split-brain test: a word flashed to one visual
                 field reaches the opposite hemisphere first; speech is
                 usually in the left hemisphere; each hand is controlled by
                 the opposite hemisphere; with the corpus callosum cut, what
                 one hemisphere sees stays there
                 -> { first, left, right, says, leftHand, rightHand }
     contra(side) the opposite side (contralateral control)
   No myths: hemispheres specialize, but every person uses both, and the
   page never sorts people into "left-brained" or "right-brained".
   Drills
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, given, figure }
     types: lesion (a damage case: name the region, then what else fits),
     imaging (choose the method, then read where the activity is), split
     (a split-brain trial: which hemisphere, what the patient says, which
     hand finds the object), contra (a one-sided stroke: which side of the
     body, which region), locate (a highlighted structure: name it, then its
     job). */
(function(G){
  'use strict';
  var M = G.ApPsychMath;
  if(!M) return;

  /* group: lobe | area (a part of the cortex) | deep (limbic and
     diencephalon) | stem (hindbrain and brainstem) | link */
  var REGIONS = {
    frontal: { name: 'Frontal lobe', view: 'both', group: 'lobe', does: 'Planning, decisions, judgment and personality; it also starts voluntary movement and, on the left, produces speech.', damage: 'Changes in personality and judgment, trouble planning, and on the motor strip weakness on the opposite side of the body.' },
    parietal: { name: 'Parietal lobe', view: 'both', group: 'lobe', does: 'Touch and body sensation, and knowing where things are in space.', damage: 'Numbness on the opposite side; damage on the right can cause neglect, ignoring the left side of space.' },
    temporal: { name: 'Temporal lobe', view: 'outside', group: 'lobe', does: 'Hearing; on the left, understanding language; on its underside, recognizing faces.', damage: 'Trouble understanding speech (left side), and damage on the underside can cause prosopagnosia, trouble recognizing faces.' },
    occipital: { name: 'Occipital lobe', view: 'both', group: 'lobe', does: 'Vision: the visual cortex at the back of the brain processes what the eyes send.', damage: 'Loss of part of the visual field even though the eyes work; some patients show blindsight.' },
    prefrontal: { name: 'Prefrontal cortex', view: 'outside', group: 'area', parent: 'frontal', does: 'Executive functions: planning, judgment, impulse control and working memory.', damage: 'Impulsive behavior, poor judgment and personality change.' },
    motor: { name: 'Motor cortex', view: 'outside', group: 'area', parent: 'frontal', does: 'Starts voluntary movement. Each side controls the muscles on the opposite side of the body.', damage: 'Weakness or paralysis on the opposite side of the body.' },
    somatosensory: { name: 'Somatosensory cortex', view: 'outside', group: 'area', parent: 'parietal', does: 'Receives touch, temperature, pain and body position. Each side feels the opposite side of the body.', damage: 'Numbness on the opposite side of the body.' },
    broca: { name: 'Broca’s area', view: 'outside', group: 'area', parent: 'frontal', does: 'Producing speech: planning the movements of talking. In most people it is in the left hemisphere.', damage: 'Broca’s aphasia: slow, halting, effortful speech, while understanding stays mostly intact.' },
    wernicke: { name: 'Wernicke’s area', view: 'outside', group: 'area', parent: 'temporal', does: 'Understanding language. In most people it is in the left hemisphere.', damage: 'Wernicke’s aphasia: fluent speech that makes little sense, and trouble understanding others.' },
    auditory: { name: 'Auditory cortex', view: 'outside', group: 'area', parent: 'temporal', does: 'Processes sound from the ears.', damage: 'Trouble recognizing sounds, even though the ears work.' },
    visual: { name: 'Visual cortex', view: 'both', group: 'area', parent: 'occipital', does: 'The first stop for vision in the cortex, at the very back of the brain.', damage: 'Blindness in part of the visual field.' },
    cerebellum: { name: 'Cerebellum', view: 'both', group: 'stem', does: 'Coordination, balance and the timing of movement; also learning motor skills (procedural memory).', damage: 'Clumsy, unsteady movement and poor balance; trouble learning new motor skills.' },
    medulla: { name: 'Medulla', view: 'both', group: 'stem', does: 'Keeps you alive without thinking: heartbeat, breathing and blood pressure.', damage: 'Breathing and heart rate fail: damage here is often fatal.' },
    pons: { name: 'Pons', view: 'both', group: 'stem', does: 'Part of the brainstem: relays messages between the cortex and the cerebellum, and helps regulate sleep and breathing.', damage: 'Problems with movement, sleep and breathing.' },
    ras: { name: 'Reticular activating system', view: 'inside', group: 'stem', does: 'A network running through the brainstem that controls arousal and alertness, sleep and waking, and filters what reaches awareness.', damage: 'Severe damage can leave a person in a coma.' },
    thalamus: { name: 'Thalamus', view: 'inside', group: 'deep', does: 'The sensory relay station: sends information from every sense except smell on to the cortex.', damage: 'Loss or distortion of sensation, and problems with alertness.' },
    hypothalamus: { name: 'Hypothalamus', view: 'inside', group: 'deep', does: 'Keeps the body in balance: hunger, thirst, body temperature and sex drive. It controls the pituitary gland.', damage: 'Disrupted eating, drinking, body temperature and hormones.' },
    pituitary: { name: 'Pituitary gland', view: 'inside', group: 'deep', does: 'The “master gland” of the endocrine system: under the hypothalamus’s control, it releases hormones such as growth hormone and oxytocin.', damage: 'Hormone problems, such as abnormal growth.' },
    hippocampus: { name: 'Hippocampus', view: 'inside', group: 'deep', deep: true, does: 'Forms new long-term memories of facts and events (explicit memory), and helps with spatial memory.', damage: 'Anterograde amnesia: new facts and events are no longer stored, while old memories and motor skills mostly remain.' },
    amygdala: { name: 'Amygdala', view: 'inside', group: 'deep', deep: true, does: 'Emotion, especially fear and aggression, and remembering emotional events.', damage: 'Less fear: a person may not recognize danger or fear in faces.' },
    reward: { name: 'Reward center', view: 'inside', group: 'deep', deep: true, does: 'Dopamine pathways deep in the brain (including the nucleus accumbens) that make things feel rewarding and drive motivation; central to addiction.', damage: 'Less motivation and pleasure from rewards.' },
    callosum: { name: 'Corpus callosum', view: 'inside', group: 'link', does: 'A thick band of axons that connects the two hemispheres so they share information.', damage: 'When it is cut (split-brain surgery for severe epilepsy), each hemisphere keeps what it alone sees.' }
  };
  var ORDER = Object.keys(REGIONS);
  var METHODS = {
    eeg: { name: 'EEG', long: 'Electroencephalogram (EEG)', does: 'Electrodes on the scalp record the brain’s electrical activity, millisecond by millisecond (great timing, poor location).' },
    fmri: { name: 'fMRI', long: 'Functional MRI (fMRI)', does: 'Tracks blood oxygen to show which areas become more active during a task (good location, slower timing).' },
    case: { name: 'Case study', long: 'Case study', does: 'Studies one person, often with rare brain damage, in depth.' },
    lesion: { name: 'Lesioning', long: 'Lesioning', does: 'Destroys or removes a small brain area (in animals, or as surgery for a medical reason) and observes what changes.' }
  };

  /* --------------------------------------------- hemispheres and sides */
  function contra(side){ return side === 'left' ? 'right' : 'left'; }
  /* A word flashed to one visual field; cut: the corpus callosum is cut. */
  function splitBrain(field, cut){
    var first = contra(field), has = { left: first === 'left' || !cut, right: first === 'right' || !cut };
    return { field: field, cut: !!cut, first: first, left: has.left, right: has.right,
      says: has.left, leftHand: has.right, rightHand: has.left };
  }

  /* ------------------------------------------------------------ cases */
  var LESIONS = [
    { id: 'gage', region: 'prefrontal', real: 'Phineas Gage (Harlow, 1868)', text: 'In 1848, an iron rod shot through the front of railroad foreman Phineas Gage’s skull. He survived, but accounts describe him as impulsive and rude, with poor judgment afterward (historians debate how much he changed).', also: ['frontal'] },
    { id: 'hm', region: 'hippocampus', real: 'Henry Molaison, “H.M.” (Scoville & Milner, 1957)', text: 'After surgery removed parts of both medial temporal lobes to stop his seizures, Henry Molaison (“H.M.”) could no longer form new memories of facts or events, yet he could still learn a new motor skill such as mirror drawing.' },
    { id: 'sm', region: 'amygdala', real: 'Patient S.M. (Feinstein et al., 2011)', text: 'Patient S.M. has damage to a small almond-shaped structure on both sides of her brain. She approaches snakes and spiders without fear and has trouble recognizing fear in other people’s faces.' },
    { id: 'broca', region: 'broca', text: 'After a stroke, Mr. Lee understands questions well, but he speaks slowly in short, effortful phrases: “Walk... dog... park.”', also: ['frontal'] },
    { id: 'wernicke', region: 'wernicke', text: 'After a stroke, Ms. Ortiz speaks quickly and fluently, but her sentences make little sense, and she cannot follow simple spoken instructions.', also: ['temporal'] },
    { id: 'ataxia', region: 'cerebellum', text: 'A tumor at the back of the brain, below the occipital lobe, leaves a patient unsteady on his feet and clumsy when he reaches for a cup. His thinking and speech comprehension are fine.' },
    { id: 'breath', region: 'medulla', text: 'A severe injury to the lowest part of the brainstem, where it joins the spinal cord, causes the patient’s breathing and heart rate to fail.' },
    { id: 'coma', region: 'ras', text: 'Damage to a network of neurons running through the core of the brainstem leaves a patient in a coma: she cannot be woken, although her cortex is not damaged.' },
    { id: 'hunger', region: 'hypothalamus', text: 'In a classic line of research, rats with damage to one small area below the thalamus overate until they became obese; damage to a neighboring spot made them stop eating.', also: [] },
    { id: 'visual', region: 'occipital', text: 'After a stroke at the very back of his brain, a patient cannot see anything on one side, although an eye exam shows that both eyes work normally.', also: ['visual'] },
    { id: 'neglect', region: 'parietal', text: 'After a stroke in her right hemisphere, a patient eats only the food on the right half of her plate and draws only the right half of a clock. She is not blind on the left; she ignores that side of space.' },
    { id: 'faces', region: 'temporal', text: 'After an injury to the underside of the brain toward the back, a man can describe a face’s eyes, nose and mouth, but he cannot recognize his own wife until she speaks.' },
    { id: 'gland', region: 'pituitary', text: 'A small tumor on the gland that hangs below the hypothalamus releases too much growth hormone, and a teenager grows to over seven feet tall.' },
    { id: 'relay', region: 'thalamus', text: 'A small stroke deep in the middle of the brain, in the structure that relays signals from the senses to the cortex, leaves a patient with numbness and odd sensations on one side of her body.' },
    { id: 'olds', region: 'reward', real: 'Olds & Milner (1954)', text: 'Rats with an electrode deep in the brain pressed a lever thousands of times an hour to get a small electrical stimulation there, ignoring food.' }
  ];
  var IMAGING = [
    { id: 'sleep', method: 'eeg', text: 'A sleep researcher wants to see when a sleeper’s brain waves change from one stage to the next, moment by moment, through the night.' },
    { id: 'faces-fmri', method: 'fmri', text: 'A researcher wants to know which brain areas become more active when participants look at faces than when they look at houses.' },
    { id: 'seizure', method: 'eeg', text: 'A neurologist records the electrical activity of a patient’s brain through electrodes on the scalp to catch the exact moment a seizure begins.' },
    { id: 'decision', method: 'fmri', text: 'A team tracks changes in blood oxygen in the brain while participants decide between two gambles, to find which areas work hardest.' },
    { id: 'rare', method: 'case', text: 'A psychologist studies one patient in great depth for years after a rare injury destroyed a small part of her brain.' },
    { id: 'rats', method: 'lesion', text: 'Researchers destroy a tiny area in the brains of rats and compare their behavior to rats with the area intact.' }
  ];
  var ACTIVE = [
    { id: 'music', region: 'auditory', task: 'listen to music' },
    { id: 'pictures', region: 'visual', task: 'look at a flashing checkerboard' },
    { id: 'tap', region: 'motor', task: 'tap the fingers of their right hand', side: 'left' },
    { id: 'touch', region: 'somatosensory', task: 'have their left hand brushed with a feather', side: 'right' },
    { id: 'fear', region: 'amygdala', task: 'see photos of snarling dogs' },
    { id: 'plan', region: 'prefrontal', task: 'plan their moves in a puzzle and hold rules in mind' },
    { id: 'talk', region: 'broca', task: 'say words out loud', side: 'left' },
    { id: 'listen', region: 'wernicke', task: 'listen to sentences and decide whether they make sense', side: 'left' },
    { id: 'balance', region: 'cerebellum', task: 'learn to balance on a wobble board' }
  ];
  var OBJECTS = ['key', 'spoon', 'pencil', 'ball', 'cup', 'coin', 'comb', 'fork'];

  /* ----------------------------------------------------------- drills */
  var SK = { region: '1.A', also: '1.A', method: '2.A', where: '3.A', hemi: '1.A', says: '1.A', hand: '1.A', side: '1.A', name: '3.A', job: '1.A' };
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '1.A' }; for(var k in o) s[k] = o[k]; return s; }
  function choice(key, label, opts){
    return step(key, label, { kind: 'choice', options: opts.map(function(x){ return x[0]; }), why: opts.map(function(x){ return x[1]; }), correct: 0 });
  }
  function nm(k){ return REGIONS[k].name; }
  function lc(s){ return s.charAt(0).toLowerCase() + s.slice(1); }
  /* Three distractors a student would confuse with the key. */
  var NEAR = {
    prefrontal: ['motor', 'hippocampus', 'amygdala', 'parietal'], frontal: ['parietal', 'temporal', 'occipital'],
    hippocampus: ['amygdala', 'cerebellum', 'thalamus', 'prefrontal'], amygdala: ['hippocampus', 'hypothalamus', 'thalamus', 'reward'],
    broca: ['wernicke', 'motor', 'auditory'], wernicke: ['broca', 'auditory', 'prefrontal'],
    cerebellum: ['medulla', 'motor', 'pons', 'occipital'], medulla: ['pons', 'cerebellum', 'hypothalamus', 'ras'],
    ras: ['medulla', 'thalamus', 'hypothalamus', 'cerebellum'], hypothalamus: ['thalamus', 'pituitary', 'amygdala', 'hippocampus'],
    occipital: ['temporal', 'parietal', 'thalamus'], parietal: ['occipital', 'temporal', 'frontal'],
    temporal: ['occipital', 'parietal', 'frontal'], pituitary: ['hypothalamus', 'thalamus', 'medulla'],
    thalamus: ['hypothalamus', 'somatosensory', 'ras', 'hippocampus'], reward: ['amygdala', 'hypothalamus', 'hippocampus', 'thalamus'],
    auditory: ['visual', 'wernicke', 'somatosensory'], visual: ['auditory', 'somatosensory', 'parietal'],
    motor: ['somatosensory', 'cerebellum', 'prefrontal'], somatosensory: ['motor', 'thalamus', 'parietal'],
    callosum: ['thalamus', 'hippocampus', 'medulla'], pons: ['medulla', 'cerebellum', 'thalamus']
  };
  function regionChoice(r, key, why){
    var wrong = M.shuffle(r, NEAR[key]).slice(0, 3);
    return [[nm(key), 'Right. ' + why]].concat(wrong.map(function(k){ return [nm(k), 'The ' + lc(nm(k)) + ': ' + lc(REGIONS[k].does) + ' That does not fit this case.']; }));
  }

  function genLesion(r, c){
    var pool = LESIONS.filter(function(x){ return !c.cases || c.cases.indexOf(x.id) > -1; }), cs = r.pick(pool), key = cs.region;
    var steps = [choice('region', 'Damage to which structure best explains this?', regionChoice(r, key, 'The ' + lc(nm(key)) + ': ' + lc(REGIONS[key].does)))];
    var m = cs.real ? 'case' : r.pick(['case', 'case', 'lesion']);
    if(cs.real || cs.id === 'hunger'){
      var isLes = cs.id === 'hunger';
      steps.push(choice('also', 'What research method is this?', isLes ? [
        ['Lesioning: damaging a brain area on purpose in animals and watching what changes.', 'Right. The researchers destroyed a small area in rats’ brains and compared their eating.'],
        ['A case study of one patient.', 'Many rats were studied, and the damage was made on purpose: lesioning.'],
        ['An fMRI study of brain activity.', 'fMRI shows activity in a working brain. Here an area was destroyed: lesioning.'],
        ['An EEG recording.', 'An EEG records electrical activity from the scalp. Here an area was destroyed: lesioning.']
      ] : cs.id === 'olds' ? [
        ['An experiment with electrical stimulation of the brain in animals.', 'Right. Olds and Milner stimulated an area through an electrode and measured lever pressing.'],
        ['A case study of one patient’s brain injury.', 'There was no injury: the rats’ brains were stimulated.'],
        ['An EEG recording from the scalp.', 'The electrode delivered stimulation deep in the brain; it did not record scalp activity.'],
        ['A survey.', 'Rats cannot answer questions; their lever pressing was measured.']
      ] : [
        ['A case study: one person with rare brain damage, studied in depth.', 'Right. Cases like ' + cs.real.replace(/ \(.*/, '') + ' show what a region does, but one person may not generalize to everyone.'],
        ['An experiment with random assignment.', 'No one was assigned to brain damage. This is one person, studied in depth: a case study.'],
        ['Lesioning in animals.', 'Lesioning destroys an area on purpose in animals. This is a human patient: a case study.'],
        ['A correlational study of many people.', 'This is one person, not many: a case study.']
      ]));
    } else {
      var side = /right hemisphere/.test(cs.text) ? 'right' : null;
      steps.push(choice('also', 'What else would you expect from damage to the ' + lc(nm(key)) + '?', alsoOpts(r, key)));
    }
    var sol = ['The ' + lc(nm(key)) + ': ' + lc(REGIONS[key].does), 'Damage there: ' + lc(REGIONS[key].damage)];
    return { ctx: c.id, topic: c.topic, type: 'lesion', text: '<p>' + (c.lead ? c.lead + ' ' : '') + cs.text + (cs.real ? ' (A real case: ' + cs.real + '.)' : '') + '</p>', steps: steps, solution: sol,
      given: { case: cs.id, region: key }, figure: { kind: 'brain', view: REGIONS[key].view === 'inside' ? 'inside' : 'outside', region: key, show: 'after' } };
  }
  function alsoOpts(r, key){
    var right = REGIONS[key].damage;
    var others = M.shuffle(r, NEAR[key]).slice(0, 3);
    return [[right, 'Right. ' + nm(key) + ': ' + lc(REGIONS[key].does)]].concat(others.map(function(k){ return [REGIONS[k].damage, 'That fits damage to the ' + lc(nm(k)) + ', not the ' + lc(nm(key)) + '.']; }));
  }

  function genImaging(r, c){
    var cs = r.pick(IMAGING.filter(function(x){ return !c.cases || c.cases.indexOf(x.id) > -1; })), m = cs.method;
    var why = { eeg: 'EEG records electrical activity with millisecond timing, but it cannot pinpoint deep structures.', fmri: 'fMRI tracks blood oxygen to show where activity rises during a task.', case: 'A case study looks closely at one person.', lesion: 'Lesioning destroys an area on purpose and observes the change.' };
    var slip = {
      eeg: { fmri: 'fMRI shows where activity is, but blood oxygen changes over seconds. Moment-by-moment electrical changes need an EEG.', case: 'A case study is one person in depth, not a recording method.', lesion: 'Nothing is destroyed here; the brain’s electrical activity is recorded.' },
      fmri: { eeg: 'EEG has great timing but cannot show which areas are active with much precision. Blood oxygen in specific areas is fMRI.', case: 'A case study is one person in depth; here many participants are scanned.', lesion: 'Nothing is destroyed; activity is measured in healthy brains.' },
      case: { eeg: 'No recording method is named; the key is one person, studied in depth.', fmri: 'Scanning may be part of it, but studying one person in depth is a case study.', lesion: 'The damage was not made by researchers; they study a person who already has it.' },
      lesion: { eeg: 'Nothing is recorded from the scalp; an area is destroyed.', fmri: 'fMRI measures activity in an intact brain. Destroying an area is lesioning.', case: 'Many animals are compared, and the damage is made on purpose: lesioning.' }
    }[m];
    var steps = [choice('method', 'Which method fits best?', [[METHODS[m].name, 'Right. ' + why[m]]].concat(Object.keys(METHODS).filter(function(k){ return k !== m; }).map(function(k){ return [METHODS[k].name, slip[k]]; })))];
    var a = r.pick(ACTIVE), key = a.region;
    steps.push(choice('where', 'In an fMRI study, participants ' + a.task + '. Which area should become most active?', regionChoice(r, key, 'The ' + lc(nm(key)) + (a.side ? ' (in the ' + a.side + ' hemisphere)' : '') + ': ' + lc(REGIONS[key].does))));
    var sol = [METHODS[m].long + ': ' + METHODS[m].does, 'To ' + a.task + ', the ' + lc(nm(key)) + ' works hardest' + (a.side ? ', in the ' + a.side + ' hemisphere' + (a.region === 'motor' || a.region === 'somatosensory' ? ' (the opposite side from the hand)' : ' for most people') : '') + '.'];
    return { ctx: c.id, topic: c.topic, type: 'imaging', text: '<p>' + (c.lead ? c.lead + ' ' : '') + cs.text + '</p>', steps: steps, solution: sol,
      given: { case: cs.id, method: m, task: a.id, region: key }, figure: { kind: 'brain', view: REGIONS[key].view === 'inside' ? 'inside' : 'outside', region: key, show: 'after', glow: true } };
  }

  function genSplit(r, c){
    var field = r.pick(['left', 'right']), obj = r.pick(OBJECTS), cut = c.cut != null ? c.cut : true, sb = splitBrain(field, cut);
    var hemi = sb.first, other = contra(hemi), H = function(s){ return s === 'left' ? 'Left hemisphere' : 'Right hemisphere'; };
    var text = '<p>' + (c.lead ? c.lead + ' ' : '') + 'A patient whose corpus callosum ' + (cut ? 'was cut to stop severe seizures' : 'is intact') + ' stares at a dot. The word “' + obj + '” flashes briefly in the ' + field + ' visual field (to the ' + field + ' of the dot).</p>';
    var steps = [
      choice('hemi', 'Which hemisphere receives the word first?', [
        [H(hemi), 'Right. Each visual field goes to the opposite hemisphere: the ' + field + ' visual field to the ' + hemi + ' hemisphere.'],
        [H(field), 'Not the same side: the ' + field + ' visual field is sent to the opposite, ' + hemi + ', hemisphere.'],
        ['Both hemispheres equally, at once', 'Each visual field goes first to one hemisphere, the opposite one; only the corpus callosum shares it.'],
        ['Neither: the word is too fast to see', 'A brief flash still reaches the opposite hemisphere; what matters is where it can go next.']
      ]),
      choice('says', 'When asked what they saw, what does the patient say?', sb.says ? [
        ['“A ' + obj + '.”', field === 'right' ? 'Right. The word went to the left hemisphere, which usually controls speech.' : 'Right. The word reached the right hemisphere first, then crossed the intact corpus callosum to the speaking left hemisphere.'],
        ['“Nothing.”', field === 'right' ? 'The left hemisphere, which usually controls speech, received the word directly.' : 'With the corpus callosum intact, the right hemisphere shares the word with the left, which can say it.'],
        ['The patient cannot speak at all.', 'Speech is not damaged; only the connection between hemispheres is ' + (cut ? 'cut' : 'in question') + '.'],
        ['A random word, by guessing.', 'The speaking left hemisphere has the word, so the patient names it.']
      ] : [
        ['“Nothing” (or a guess).', 'Right. The word reached only the right hemisphere. With the corpus callosum cut, it cannot pass to the left hemisphere, which usually controls speech.'],
        ['“A ' + obj + '.”', 'To say it, the left hemisphere (speech) needs the word, but the cut corpus callosum keeps it in the right hemisphere.'],
        ['The patient cannot speak at all.', 'The patient can speak; the left hemisphere simply never got the word.'],
        ['The word, but only after a long delay.', 'Without the corpus callosum the word never reaches the speaking hemisphere, however long the patient waits.']
      ])
    ];
    var hand = r.pick(['left', 'right']), handOk = hand === 'left' ? sb.leftHand : sb.rightHand, ctl = contra(hand);
    steps.push(choice('hand', 'Reaching behind a screen with the ' + hand + ' hand only, can the patient pick out the ' + obj + ' by touch?', handOk ? [
      ['Yes: the ' + hand + ' hand is controlled by the ' + ctl + ' hemisphere, which has the word.', 'Right. Each hand is controlled by the opposite hemisphere, and the ' + ctl + ' hemisphere knows what was shown.'],
      ['No: the hand cannot find something the patient cannot name.', 'Naming and finding are separate: the ' + ctl + ' hemisphere controls this hand and has the word' + (sb.says ? '.' : ', even if the speaking hemisphere does not.')],
      ['Yes, because each hand is controlled by the hemisphere on the same side.', 'Control is contralateral: the ' + hand + ' hand is controlled by the ' + ctl + ' hemisphere.'],
      ['No: touch goes to both hemispheres equally.', 'Touch from one hand goes to the opposite hemisphere, the ' + ctl + ', which has the word.']
    ] : [
      ['No: the ' + hand + ' hand is controlled by the ' + ctl + ' hemisphere, which never got the word.', 'Right. Each hand is controlled by the opposite hemisphere; the ' + ctl + ' one was cut off from the word.'],
      ['Yes: any hand can find what the eyes saw.', 'Only the ' + hemi + ' hemisphere saw the word, and it controls the ' + contra(hemi) + ' hand, not the ' + hand + ' one.'],
      ['Yes, because each hand is controlled by the hemisphere on the same side.', 'Control is contralateral: the ' + hand + ' hand is controlled by the ' + ctl + ' hemisphere.'],
      ['Yes, by asking the speaking hemisphere.', 'With the corpus callosum cut, the hemispheres cannot share the word.']
    ]));
    var sol = ['The ' + field + ' visual field goes to the ' + hemi + ' hemisphere. ' + (cut ? 'With the corpus callosum cut, the word stays there.' : 'The intact corpus callosum shares it with the ' + other + ' hemisphere.'),
      'Speech is usually in the left hemisphere, so the patient ' + (sb.says ? 'can name the ' + obj + '.' : 'cannot name it.') + ' The ' + hand + ' hand is run by the ' + ctl + ' hemisphere, so it ' + (handOk ? 'can' : 'cannot') + ' find the ' + obj + ' by touch.',
      'Split-brain research (Sperry and Gazzaniga) shows that the hemispheres specialize; in an intact brain they share everything through the corpus callosum.'];
    return { ctx: c.id, topic: c.topic, type: 'split', text: text, steps: steps, solution: sol,
      given: { field: field, cut: cut, object: obj, hand: hand }, figure: { kind: 'split', field: field, cut: cut, object: obj, hand: hand } };
  }

  function genContra(r, c){
    var area = r.pick(c.areas || ['motor', 'somatosensory']), side = r.pick(['left', 'right']), body = contra(side);
    var sym = area === 'motor' ? r.pick(['cannot lift', 'has weakness in']) : r.pick(['cannot feel touch on', 'feels numbness in']);
    var limb = r.pick(['arm', 'hand', 'leg']);
    var text = '<p>' + (c.lead ? c.lead + ' ' : '') + 'A stroke damages a strip of cortex in the ' + side + ' hemisphere, ' + (area === 'motor' ? 'just in front of' : 'just behind') + ' the central sulcus (the groove between the frontal and parietal lobes).</p>';
    var steps = [
      choice('side', 'Which side of the body is affected?', [
        ['The ' + body + ' side', 'Right. Each hemisphere controls and feels the opposite side of the body (contralateral control).'],
        ['The ' + side + ' side', 'Control crosses over: a ' + side + ' hemisphere stroke affects the ' + body + ' side.'],
        ['Both sides equally', 'One hemisphere’s strip serves only the opposite side of the body.'],
        ['Neither: the other hemisphere takes over at once', 'Plasticity can help over months of recovery, but right after the stroke the ' + body + ' side is affected.']
      ]),
      choice('region', 'The patient ' + sym + ' the ' + body + ' ' + limb + '. Which area was damaged?', area === 'motor' ? [
        ['Motor cortex', 'Right. Losing movement points to the motor cortex, the strip in front of the central sulcus.'],
        ['Somatosensory cortex', 'The somatosensory cortex, behind the central sulcus, is for touch. Losing movement is the motor cortex.'],
        ['Cerebellum', 'The cerebellum coordinates movement and balance; it does not start voluntary movement on one side.'],
        ['Occipital lobe', 'The occipital lobe is for vision.']
      ] : [
        ['Somatosensory cortex', 'Right. Losing touch points to the somatosensory cortex, the strip behind the central sulcus.'],
        ['Motor cortex', 'The motor cortex, in front of the central sulcus, starts movement. Losing touch is the somatosensory cortex.'],
        ['Thalamus', 'The thalamus relays touch, but this damage is a strip of cortex behind the central sulcus.'],
        ['Temporal lobe', 'The temporal lobe is mainly for hearing and language.']
      ])
    ];
    var sol = ['Control is contralateral: the ' + side + ' hemisphere serves the ' + body + ' side of the body.', area === 'motor' ? 'The motor cortex (in front of the central sulcus) starts voluntary movement.' : 'The somatosensory cortex (behind the central sulcus) receives touch.',
      'With time and practice, plasticity lets other areas take over some lost functions, especially in children.'];
    return { ctx: c.id, topic: c.topic, type: 'contra', text: text, steps: steps, solution: sol,
      given: { area: area, side: side, limb: limb }, figure: { kind: 'brain', view: 'outside', region: area, show: 'after', side: side } };
  }

  var LOCATE = ['frontal', 'parietal', 'temporal', 'occipital', 'cerebellum', 'medulla', 'broca', 'wernicke', 'motor', 'somatosensory', 'prefrontal', 'thalamus', 'hypothalamus', 'pituitary', 'callosum', 'hippocampus', 'amygdala'];
  function genLocate(r, c){
    var key = r.pick(c.regions || LOCATE), view = REGIONS[key].view === 'inside' ? 'inside' : REGIONS[key].view === 'both' ? r.pick(['outside', 'inside']) : 'outside';
    if(key === 'callosum' || key === 'thalamus' || key === 'hypothalamus' || key === 'pituitary' || key === 'hippocampus' || key === 'amygdala') view = 'inside';
    var steps = [choice('name', 'Name the highlighted structure.', [[nm(key), 'Right. That is the ' + lc(nm(key)) + '.']].concat(M.shuffle(r, NEAR[key]).slice(0, 3).map(function(k){ return [nm(k), 'The ' + lc(nm(k)) + ' is ' + where(k) + '. The highlighted one is the ' + lc(nm(key)) + ', ' + where(key) + '.']; })))];
    var others = M.shuffle(r, NEAR[key]).slice(0, 3);
    steps.push(choice('job', 'What does the ' + lc(nm(key)) + ' do?', [[REGIONS[key].does, 'Right.']].concat(others.map(function(k){ return [REGIONS[k].does, 'That is the ' + lc(nm(k)) + '.']; }))));
    var sol = ['The ' + lc(nm(key)) + ', ' + where(key) + '.', REGIONS[key].does];
    return { ctx: c.id, topic: c.topic, type: 'locate', text: '<p>' + (c.lead ? c.lead + ' ' : '') + (view === 'inside' ? 'The brain, cut down the middle and seen from the inside. Front is on the left.' : 'The left side of the brain, seen from the outside. Front is on the left.') + '</p>', steps: steps, solution: sol,
      given: { region: key, view: view }, figure: { kind: 'brain', view: view, region: key, show: 'before' } };
  }
  var WHERE = {
    frontal: 'at the front of the brain, ahead of the central sulcus', parietal: 'on top toward the back, behind the central sulcus', temporal: 'on the side, below the lateral fissure', occipital: 'at the very back',
    prefrontal: 'at the front of the frontal lobe', motor: 'the strip just in front of the central sulcus', somatosensory: 'the strip just behind the central sulcus', broca: 'in the left frontal lobe, just above the lateral fissure',
    wernicke: 'in the left temporal lobe, at the back of the lateral fissure', auditory: 'in the temporal lobe, along the lateral fissure', visual: 'at the very back, in the occipital lobe',
    cerebellum: 'below the back of the brain, behind the brainstem', medulla: 'the lowest part of the brainstem, joining the spinal cord', pons: 'the bulge in the brainstem above the medulla', ras: 'running through the core of the brainstem',
    thalamus: 'in the middle of the brain, on top of the brainstem', hypothalamus: 'just below the thalamus', pituitary: 'hanging below the hypothalamus', hippocampus: 'deep in the temporal lobe, curving back from the amygdala',
    amygdala: 'deep in the front of the temporal lobe, in front of the hippocampus', reward: 'deep at the base of the frontal lobe', callosum: 'the arch of white matter joining the two hemispheres'
  };
  function where(k){ return WHERE[k]; }

  var GEN = { lesion: genLesion, imaging: genImaging, split: genSplit, contra: genContra, locate: genLocate };
  M.register('brainMap', {
    REGIONS: REGIONS, ORDER: ORDER, METHODS: METHODS, WHERE: WHERE, NEAR: NEAR,
    LESIONS: LESIONS, IMAGING: IMAGING, ACTIVE: ACTIVE, OBJECTS: OBJECTS, LOCATE: LOCATE,
    contra: contra, splitBrain: splitBrain,
    TYPES: Object.keys(GEN),
    generate: function(r, ctx, type){
      var types = ctx.types || Object.keys(GEN);
      var ty = type && types.indexOf(type) > -1 ? type : r.pick(types);
      return GEN[ty](r, ctx);
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
