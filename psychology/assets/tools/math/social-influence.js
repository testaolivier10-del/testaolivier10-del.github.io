/* Social influence model: ApPsychMath.socialInfluence (docs/appsych-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (docs/appsych-briefs/t4.md): no other tool edits
   this file, and this tool edits no shared file. Pure functions, no DOM, so
   the validator (scripts/lib/appsych-tool-checks/social-influence.mjs) and
   the test (scripts/test/appsych-tool-social-influence.test.mjs) run exactly
   this code.

   The classic studies, with the published numbers and what later work found
   (the tool shows each source; nothing here is invented and presented as real):
     ASCH       conformity on the line task by the size of a unanimous
                majority, and with one partner who answers correctly
                (Asch, 1951, 1955, 1956). Later: Franzen and Mader (2023)
                found about the same rate (33%) with 202 students in Bern;
                Bond and Smith's (1996) meta-analysis found conformity higher
                in collectivist cultures and lower in later US studies.
     MILGRAM    the percent who went to the last switch (450 V) in several of
                Milgram's conditions, 40 men each (Milgram, 1963, 1965,
                1974). Later: Burger (2009) stopped at 150 V and found 70%
                continued past it (Milgram's comparable figure 82.5%);
                archive work (Haslam and colleagues, 2014) found obedience
                averaged 43% across 21 conditions, and the ethics would not
                be allowed today.
     DARLEY     the percent who reported the "seizure" before it ended, by
                how many others they believed could hear it (Darley and
                Latane, 1968). Later: Fischer and colleagues (2011, a
                meta-analysis) found the effect real but weaker in clear
                danger; Philpot and colleagues (2020) found someone helped in
                about 9 of 10 real public conflicts caught on camera, more
                often when more people were there.
     FACIL      pool players watched by four onlookers (Michaels and
                colleagues, 1982): good players improved, poor players got worse.
     LOAF       shouting in groups people believed were real (Latane,
                Williams and Harkins, 1979): effort as a percent of shouting alone.

   generate(r, ctx, type) -> one seeded drill problem (every scenario
   invented and labeled; a step about a real study names it and its source):
     conformity   a group pressure scene: predict, then normative or
                  informational influence, then what replications found
     obedience    an order from an authority: predict, the concept, then
                  what later research found
     bystander    an emergency with some number of onlookers: predict, the
                  concept, then the percent who helped in an invented
                  survey (ApPsychStats)
     groups       an easy or hard task, watched or pooled: predict, then
                  social facilitation, social loafing or another group effect
     attribution  someone explains a behavior: the attribution, then the bias
     compliance   a request strategy: the technique, then why it works */
(function(G){
  'use strict';
  var M = G.ApPsychMath;
  if(!M) return;
  function S(){ return G.ApPsychStats; }

  /* Group size: Asch's mean errors out of 12 critical trials for unanimous
     majorities of 1, 2, 3, 4, 8 and 10 to 15 (Asch, 1951; the last group is
     stored at 16), as a percent of answers; alone (controls) under 1%; one partner who answers correctly
     5.5% (Asch, 1952). Majorities of 5 to 7 were not run; the tool draws
     straight lines between the sizes that were, and says so. */
  var ASCH = {
    source: 'Asch (1951, 1956)',
    sizes: [[0, 0.7], [1, 2.8], [2, 12.8], [3, 33.3], [4, 35], [8, 32], [16, 31.3]],
    errors: { 1: 0.33, 2: 1.53, 3: 4.0, 4: 4.2, 8: 3.84, 16: 3.75 },
    plateau: 36.8,    // majorities of 7 to 9, 123 students (Asch, 1955)
    partner: 5.5,     // one confederate gives the right answer (Asch, 1952)
    everOnce: 74      // gave at least one wrong answer in 12 critical trials (Asch, 1951)
  };
  function aschPct(n, partner){
    if(partner && n > 0) return ASCH.partner;
    var z = ASCH.sizes;
    if(n <= 0) return z[0][1];
    for(var i = 1; i < z.length; i++) if(n <= z[i][0]){ var a = z[i - 1], b = z[i]; return a[1] + (b[1] - a[1]) * (n - a[0]) / (b[0] - a[0]); }
    return z[z.length - 1][1];
  }
  function aschMeasured(n){ return ASCH.sizes.some(function(q){ return q[0] === n; }); }
  var MILGRAM = [
    { id: 'remote', name: 'Learner in another room, silent but for pounding on the wall', short: 'Remote', pct: 65, n: 40, src: 'Milgram (1963)' },
    { id: 'voice', name: 'Learner heard protesting through the wall', short: 'Voice', pct: 62.5, n: 40, src: 'Milgram (1974)' },
    { id: 'proximity', name: 'Learner in the same room', short: 'Same room', pct: 40, n: 40, src: 'Milgram (1974)' },
    { id: 'touch', name: 'Teacher must press the learner\'s hand onto the plate', short: 'Touch', pct: 30, n: 40, src: 'Milgram (1974)' },
    { id: 'phone', name: 'Experimenter gives orders by telephone', short: 'By phone', pct: 22.5, n: 40, src: 'Milgram (1974)' },
    { id: 'office', name: 'Run in a run-down office building, not at Yale', short: 'Office', pct: 47.5, n: 40, src: 'Milgram (1974)' },
    { id: 'peers', name: 'Two other "teachers" (actors) refuse to go on', short: 'Peers rebel', pct: 10, n: 40, src: 'Milgram (1974)' }
  ];
  var DARLEY = { source: 'Darley and Latane (1968)', others: [0, 1, 4], beforeEnd: [85, 62, 31], eventually: [100, 85, 62] };
  var FACIL = { source: 'Michaels and colleagues (1982)', good: [71, 80], poor: [36, 25] };
  var LOAF = { source: 'Latane, Williams and Harkins (1979)', others: [0, 1, 5], effort: [100, 82, 74] };

  var CONCEPTS = {
    normative: { name: 'Normative social influence', why: 'Normative influence is going along to be liked or to avoid standing out, even when you think the group is wrong.' },
    informational: { name: 'Informational social influence', why: 'Informational influence is going along because you believe the group knows better, usually when the answer is unclear.' },
    obedience: { name: 'Obedience', why: 'Obedience is following a direct order from someone seen as an authority.' },
    conformity: { name: 'Conformity', why: 'Conformity is changing your behavior or beliefs to match a group, with no one ordering you to.' },
    diffusion: { name: 'Diffusion of responsibility', why: 'Diffusion of responsibility is each person feeling less responsible to act because others are present.' },
    facilitation: { name: 'Social facilitation', why: 'Social facilitation is doing easy, well-practiced tasks better, and hard or new tasks worse, when others watch.' },
    loafing: { name: 'Social loafing', why: 'Social loafing is putting in less effort when your work is pooled with a group\'s and not judged on its own.' },
    deindividuation: { name: 'Deindividuation', why: 'Deindividuation is losing self-awareness and restraint in a group where you feel anonymous.' },
    polarization: { name: 'Group polarization', why: 'Group polarization is a group\'s views becoming more extreme after discussion.' },
    groupthink: { name: 'Groupthink', why: 'Groupthink is a group seeking harmony so much that it stops weighing other options.' },
    fae: { name: 'Fundamental attribution error', why: 'The fundamental attribution error is blaming another person\'s behavior on their personality and underrating the situation.' },
    actorObserver: { name: 'Actor-observer bias', why: 'The actor-observer bias is explaining your own behavior by the situation but others\' by their personality.' },
    selfServing: { name: 'Self-serving bias', why: 'The self-serving bias is taking credit for success and blaming failure on the situation.' },
    foot: { name: 'Foot-in-the-door technique', why: 'Foot-in-the-door is getting agreement to a small request first, which makes a larger one more likely.' },
    door: { name: 'Door-in-the-face technique', why: 'Door-in-the-face is making a large request that will be refused, then a smaller one that seems reasonable by contrast.' },
    halo: { name: 'Halo effect', why: 'The halo effect is letting one good trait (such as attractiveness) color your judgment of other traits.' },
    reciprocity: { name: 'Reciprocity norm', why: 'The reciprocity norm is the expectation that we return favors.' }
  };

  /* Scenario banks. Each scene carries the structured facts its keys come
     from, so the validator can recompute every key without the model. */
  var CONF_T = [
    { task: 'clear', public: true, text: 'In a class poll by show of hands, the answer to an easy math question is obvious, but the first {n} students all raise their hands for the wrong answer. # raises a hand with them, while privately sure they are wrong.' },
    { task: 'clear', public: true, text: 'At a party, # is asked which of two songs is longer. The answer is obvious, but {n} friends say the shorter one first, laughing. # agrees out loud.' },
    { task: 'unclear', public: false, text: 'On a hike in fog, # is unsure which trail leads back. {n} other hikers confidently take the left fork, so # follows them, believing they must know.' },
    { task: 'unclear', public: false, text: 'New at work, # does not know the dress code for a client visit. Seeing {n} coworkers in blazers, # goes home to change, assuming they know what is expected.' }
  ];
  var CONF_CHANGE = [
    { change: 'partner', text: 'One person in the group gives the correct answer first.', dir: 'lower' },
    { change: 'private', text: 'Everyone writes the answer privately instead of saying it out loud.', dir: 'lower' },
    { change: 'smaller', text: 'Only one other person, not {n}, answers before #.', dir: 'lower' }
  ];
  var OBEY_T = [
    { text: 'A coach tells # to keep running laps after # feels dizzy. # keeps running.', authority: true },
    { text: 'A security guard orders # to move a car from a spot that is not marked as reserved. # moves it.', authority: true },
    { text: 'A manager tells # to stay late and enter data that # suspects is wrong. # does it.', authority: true }
  ];
  var OBEY_CHANGE = [
    { id: 'phone', text: 'The person giving the order leaves and gives it by phone instead.', dir: 'lower' },
    { id: 'peers', text: 'Two coworkers who were given the same order refuse in front of #.', dir: 'lower' },
    { id: 'uniform', text: 'The person giving the order wears an official uniform and badge.', dir: 'higher' }
  ];
  var BY_T = [
    { text: 'A student faints in a crowded hallway with {n} people nearby.', place: 'hallway' },
    { text: 'A cyclist falls on a busy sidewalk where {n} people are walking past.', place: 'sidewalk' },
    { text: 'In a group chat of {n} people, someone posts that they need a ride to the hospital.', place: 'chat' }
  ];
  var GROUP_T = [
    { task: 'easy', setting: 'watched', text: '# is an expert typist. With {n} coworkers watching, # types a familiar report.', concept: 'facilitation', dir: 'better' },
    { task: 'hard', setting: 'watched', text: '# is learning to juggle for the first time. {n} classmates gather to watch.', concept: 'facilitation', dir: 'worse' },
    { task: 'easy', setting: 'watched', text: '# has practiced a piano piece for a year and plays it at a recital for {n} people.', concept: 'facilitation', dir: 'better' },
    { task: 'pooled', setting: 'pooled', text: '# is one of {n} students on a group poster, and the teacher gives one grade to the whole group.', concept: 'loafing', dir: 'worse' },
    { task: 'pooled', setting: 'pooled', text: 'In a tug-of-war team of {n}, no one can tell how hard each person is pulling.', concept: 'loafing', dir: 'worse' }
  ];
  var GROUP_OTHER = [
    { text: 'After an hour of discussing, a jury of {n} people who all leaned toward a large fine agrees on the largest fine allowed.', concept: 'polarization' },
    { text: 'A club board of {n} friends approves a risky plan quickly; one member with doubts stays silent so the meeting stays friendly.', concept: 'groupthink' },
    { text: 'At a costume party with {n} masked guests, # does things # would never do as #self.', concept: 'deindividuation' }
  ];
  var ATTR_T = [
    { text: 'A driver cuts # off on the highway. # mutters, "What a selfish jerk."', concept: 'fae', kind: 'dispositional' },
    { text: 'When # is late, # says, "Traffic was awful." When a classmate is late, # thinks, "So irresponsible."', concept: 'actorObserver', kind: 'both' },
    { text: '# aces a test and says, "I\'m smart." After failing the next one, # says, "The questions were unfair."', concept: 'selfServing', kind: 'both' },
    { text: 'A new coworker is quiet in a meeting. # decides, "She must be shy," without knowing she is new.', concept: 'fae', kind: 'dispositional' }
  ];
  var COMP_T = [
    { text: 'A volunteer asks # to sign a small petition. A week later, the same group asks # to volunteer every Saturday, and # agrees.', concept: 'foot' },
    { text: 'A friend asks # to lend $500. When # says no, the friend asks for $20 instead, and # agrees.', concept: 'door' },
    { text: 'A store gives # a free sample. # then feels obliged to buy something.', concept: 'reciprocity' },
    { text: '# assumes a good-looking job candidate must also be smart and honest.', concept: 'halo' }
  ];
  var CONF_STUDY = {
    right: 'Large replications found about the same rate as Asch; for example, a 2023 study in Switzerland found errors on about 33% of critical trials (Franzen and Mader, 2023).',
    wrongs: [
      ['No one has ever repeated Asch\'s study, so the result is unknown.', 'Not so. It has been repeated many times, including a large 2023 replication.'],
      ['Later studies showed people conform on nearly every trial.', 'No. About a third of answers conformed; about a quarter of people never conformed.'],
      ['Conformity is the same in every culture.', 'No. A meta-analysis (Bond and Smith, 1996) found higher conformity in more collectivist cultures.']
    ]
  };
  var OBEY_STUDY = {
    right: 'A partial replication that stopped at 150 volts found 70% continued past that point, close to Milgram\'s 82.5% (Burger, 2009).',
    wrongs: [
      ['Every participant in every condition went to the last switch.', 'No. Rates ranged widely by condition; across 21 conditions, obedience averaged about 43%.'],
      ['The original study would be approved today without changes.', 'No. Its deception and stress led to stronger protections; full replications are not allowed.'],
      ['Women were found to be far less obedient in every study.', 'No. Milgram\'s women and Burger\'s later sample obeyed at about the same rate as men.']
    ]
  };
  var BY_STUDY = {
    right: 'The effect is real but weaker in clear danger, and in real public conflicts someone usually helps (Fischer and colleagues, 2011; Philpot and colleagues, 2020).',
    wrongs: [
      ['Video of real public fights shows no one ever helps.', 'No. In about 9 of 10 recorded conflicts at least one bystander helped (Philpot and colleagues, 2020).'],
      ['The story that 38 neighbors watched Kitty Genovese and did nothing is fully accurate.', 'No. The newspaper that told it later said the number of witnesses was exaggerated.'],
      ['More bystanders always means the victim is less likely to get any help.', 'No. Each person is less likely to act, but with more people someone may still help.']
    ]
  };

  /* --------------------------------------------------------- helpers */
  var NAMES = [['Maya', 0], ['Leo', 1], ['Jordan', 0], ['Sofia', 0], ['Kai', 1], ['Amara', 0], ['Noah', 1], ['Priya', 0], ['Mateo', 1], ['Zoe', 0], ['Elijah', 1], ['Lina', 0], ['Omar', 1], ['Hana', 0], ['Jonah', 1], ['Diego', 1], ['Mei', 0], ['Theo', 1], ['Nia', 0], ['Samir', 1]];
  var PRON = [['she', 'her', 'her', 'herself'], ['he', 'him', 'his', 'himself']];
  function who(r){ var n = r.pick(NAMES); return [n[0], PRON[n[1]]]; }
  function fill(t, name, pr, n){
    return t.replace(/\{n\}/g, String(n)).replace(/#self/g, pr[3]).replace(/^# /, name + ' ').replace(/([.!?] )# /g, '$1' + name + ' ').replace(/#/g, name);
  }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  function choice(key, label, opts, practice, level){
    var c = -1; opts.forEach(function(o, i){ if(o.ok) c = i; });
    return { key: key, kind: 'choice', label: label, options: opts.map(function(o){ return o.t; }), why: opts.map(function(o){ return (o.ok ? 'Yes. ' : 'Not this one. ') + o.why; }), correct: c, practice: practice || '1.A', level: level || 'apply' };
  }
  function conceptStep(key, label, right, pool, name){
    var opts = [right].concat(pool.filter(function(k){ return k !== right; }).slice(0, 3));
    return choice(key, label, opts.map(function(k){ return { t: CONCEPTS[k].name, ok: k === right, why: CONCEPTS[k].why + (k === right ? '' : ' That is not what happens to ' + name + ' here.') }; }));
  }
  function dirStep(key, label, dir, whyRight, words){
    words = words || ['higher', 'lower', 'about the same'];
    return choice(key, label, words.map(function(w){ return { t: cap(w), ok: w === dir, why: w === dir ? whyRight : 'The research points the other way: ' + whyRight.charAt(0).toLowerCase() + whyRight.slice(1) }; }), '1.A', 'analyze');
  }
  function studyStep(key, label, st){
    return choice(key, label, [{ t: st.right, ok: true, why: 'That is what later research found.' }].concat(st.wrongs.map(function(w){ return { t: w[0], ok: false, why: w[1] }; })), '2.A', 'analyze');
  }

  /* ------------------------------------------------------------ types */
  function genConformity(r, ctx){
    var t = r.pick(CONF_T), n = r.int(3, 6), w = who(r), name = w[0];
    // Answering privately removes normative pressure only; when the answer is
    // unclear (informational influence) it is not a fair prediction.
    var ch = r.pick(CONF_CHANGE.filter(function(x){ return t.task === 'clear' || x.change !== 'private'; }));
    var key = t.task === 'clear' ? 'normative' : 'informational';
    var whyDir = ch.change === 'partner' ? 'One ally breaks the group\'s unanimity; in Asch\'s studies a single partner cut conformity to about a quarter of its usual level.' :
      ch.change === 'private' ? 'Answering in private removes the fear of standing out, so conformity drops, which is why Asch\'s effect is mostly normative.' :
      'With only one other person giving the wrong answer, conformity is far lower: in Asch\'s studies about 3% of answers went along with one person, against about 33% with three, and it leveled off after that.';
    var text = fill(t.text, name, w[1], n);
    return {
      type: 'conformity', ctx: ctx.id, topic: ctx.topic, given: { task: t.task, public: t.public, n: n, change: ch.change, name: name },
      text: '<p>Invented scenario. ' + text + '</p>',
      steps: [conceptStep('concept', 'Which kind of influence explains what ' + name + ' does?', key, ['normative', 'informational', 'obedience', 'groupthink'], name),
        dirStep('predict', 'Now this changes: ' + fill(ch.text, name, w[1], n) + ' Compared with before, conformity will most likely be:', ch.dir, whyDir),
        studyStep('study', 'Asch\'s line studies are the classic test of conformity. What did later research find?', CONF_STUDY)],
      solution: [CONCEPTS[key].why + (key === 'normative' ? ' The answer was clear, and ' + name + ' went along in public.' : ' The situation was unclear, and ' + name + ' believed the others knew better.'), whyDir, CONF_STUDY.right],
      figure: { kind: 'conformity', n: n, partner: ch.change === 'partner', change: ch.change }
    };
  }
  function genObedience(r, ctx){
    var t = r.pick(OBEY_T), w = who(r), name = w[0], ch = r.pick(OBEY_CHANGE);
    var whyDir = ch.id === 'phone' ? 'An authority who is not physically present gets less obedience; in Milgram\'s phone condition about 1 in 5 went to the end, against about 2 in 3 with the experimenter in the room.' :
      ch.id === 'peers' ? 'Seeing others refuse gives permission to disobey; when two actors refused, only 4 of 40 (10%) went to the end.' :
      ch.id === 'touch' ? 'The closer the victim, the lower the obedience; having to touch the learner cut full obedience to 30%.' :
      'Symbols of legitimate authority, such as a uniform, increase obedience.';
    return {
      type: 'obedience', ctx: ctx.id, topic: ctx.topic, given: { change: ch.id, name: name },
      text: '<p>Invented scenario. ' + fill(t.text, name, w[1], 0) + '</p>',
      steps: [conceptStep('concept', 'Which concept best describes what ' + name + ' does?', 'obedience', ['obedience', 'conformity', 'normative', 'foot'], name),
        dirStep('predict', 'Now this changes: ' + fill(ch.text, name, w[1], 0) + ' Compared with before, the chance that ' + name + ' obeys will most likely be:', ch.dir, whyDir),
        studyStep('study', 'Milgram\'s shock studies are the classic test of obedience. What did later research find?', OBEY_STUDY)],
      solution: [CONCEPTS.obedience.why + ' Someone with authority gave ' + name + ' a direct order.', whyDir, OBEY_STUDY.right],
      figure: { kind: 'obedience', cond: ch.id === 'uniform' ? 'voice' : ch.id }
    };
  }
  function genBystander(r, ctx){
    var t = r.pick(BY_T), n = r.int(6, 20), w = who(r), name = w[0];
    var total = r.pick([20, 25, 40, 50]), helped = r.int(Math.round(total * 0.15), Math.round(total * 0.45));
    var pct = S().evaluate({ fn: 'mul', args: [{ fn: 'div', args: [helped, total] }, 100] });
    var cell = M.cell(pct, 0.005, [{ value: S().evaluate({ fn: 'div', args: [helped, total] }), why: 'That is the fraction. Multiply by 100 to get a percent.' }, { value: S().evaluate({ fn: 'sub', args: [100, pct] }), why: 'That is the percent who did not help.' }], 0.051);
    return {
      type: 'bystander', ctx: ctx.id, topic: ctx.topic, given: { n: n, total: total, helped: helped },
      text: '<p>Invented scenario. ' + fill(t.text, name, w[1], n) + ' Everyone notices, but each person waits for someone else to act.</p><p>Invented survey for practice: researchers staged this scene ' + total + ' times; someone helped within one minute in ' + helped + ' of them.</p>',
      steps: [conceptStep('concept', 'Which concept best explains why each person waits?', 'diffusion', ['diffusion', 'loafing', 'deindividuation', 'informational'], 'the onlookers'),
        dirStep('predict', 'If only one person had been nearby, the chance that this one person helps would most likely be:', 'higher', 'Alone, the responsibility is all yours; in Darley and Latane\'s (1968) study, 85% of people who thought they were alone reported the seizure before it ended, against 31% who thought four others heard it.'),
        { key: 'percent', kind: 'num', label: 'In the invented survey, in what percent of the scenes did someone help within one minute?', hint: 'Divide the scenes with help by all the scenes, then multiply by 100.', cell: cell, d: 1, unit: '%', practice: '3.B', level: 'apply' },
        studyStep('study', 'What did later research on the bystander effect find?', BY_STUDY)],
      solution: [CONCEPTS.diffusion.why, 'Alone, a person is more likely to help: 85% alone against 31% with four others in Darley and Latane (1968).', 'Percent = ' + helped + ' / ' + total + ' × 100 = ' + M.fixed(pct, 1) + '%.', BY_STUDY.right],
      figure: { kind: 'bystander', others: n > 4 ? 4 : n }
    };
  }
  function genGroups(r, ctx){
    var w = who(r), name = w[0], n = r.int(3, 8);
    if(r() < 0.75){
      var t = r.pick(GROUP_T);
      var dir = t.dir, words = ['better', 'worse', 'about the same'];
      var whyDir = t.concept === 'facilitation' ? (t.task === 'easy' ? 'An audience raises arousal, which helps on easy, well-practiced tasks; good pool players went from 71% to 80% of shots when watched (Michaels and colleagues, 1982).' : 'An audience raises arousal, which hurts on hard or new tasks; poor pool players went from 36% to 25% of shots when watched (Michaels and colleagues, 1982).') :
        'When effort is pooled and no one is judged alone, people slack; in a shouting study, people shouted at 74% of their solo effort when they thought five others shouted too (Latane, Williams and Harkins, 1979).';
      return {
        type: 'groups', ctx: ctx.id, topic: ctx.topic, given: { task: t.task, setting: t.setting, concept: t.concept },
        text: '<p>Invented scenario. ' + fill(t.text, name, w[1], n) + '</p>',
        steps: [dirStep('predict', t.setting === 'pooled' ? 'Compared with working alone, each person\'s effort will most likely be:' : 'Compared with doing it alone, ' + name + '\'s performance will most likely be:', dir, whyDir, words),
          conceptStep('concept', 'Which concept explains this?', t.concept, ['facilitation', 'loafing', 'deindividuation', 'polarization'], t.setting === 'pooled' ? 'the group' : name)],
        solution: [whyDir, CONCEPTS[t.concept].why],
        figure: { kind: 'groups', setting: t.setting, task: t.task, n: n }
      };
    }
    var o = r.pick(GROUP_OTHER);
    return {
      type: 'groups', ctx: ctx.id, topic: ctx.topic, given: { concept: o.concept },
      text: '<p>Invented scenario. ' + fill(o.text, name, w[1], n) + '</p>',
      steps: [conceptStep('concept', 'Which group effect is this?', o.concept, ['polarization', 'groupthink', 'deindividuation', 'loafing'], 'this group'),
        choice('which', 'Which change would most likely reduce it?', [
          { t: o.concept === 'polarization' ? 'Add members who hold different views before the discussion.' : o.concept === 'groupthink' ? 'Ask one member to argue against the plan and invite outside experts.' : 'Make people identifiable, for example with name tags and no masks.', ok: true, why: o.concept === 'polarization' ? 'Polarization grows when like-minded people discuss; mixed views slow it.' : o.concept === 'groupthink' ? 'A devil\'s advocate and outside views break the pressure for harmony.' : 'Deindividuation depends on feeling anonymous; being identifiable restores self-awareness.' },
          { t: 'Make the group larger and more anonymous.', ok: false, why: 'Anonymity and size usually make these effects stronger, not weaker.' },
          { t: 'Give the group less time and more pressure to agree.', ok: false, why: 'Time pressure and a push to agree feed groupthink and polarization.' },
          { t: 'Let only the most confident member speak.', ok: false, why: 'Silencing other views makes these effects worse.' }
        ], '1.B', 'analyze')],
      solution: [CONCEPTS[o.concept].why, o.concept === 'polarization' ? 'Mixing in different views reduces polarization.' : o.concept === 'groupthink' ? 'A devil\'s advocate and outside experts reduce groupthink.' : 'Being identifiable reduces deindividuation.'],
      figure: { kind: 'groups', setting: o.concept, task: 'none', n: n }
    };
  }
  function genAttribution(r, ctx){
    var t = r.pick(ATTR_T), w = who(r), name = w[0];
    var both = t.concept === 'selfServing' ? 'Both: dispositional for the success, situational for the failure.' : 'Both: situational for ' + name + '\'s own case, dispositional for the other case.';
    var kindKey = t.kind === 'dispositional' ? 'A dispositional attribution: it blames the person\'s character.' : both;
    return {
      type: 'attribution', ctx: ctx.id, topic: ctx.topic, given: { concept: t.concept, kind: t.kind },
      text: '<p>Invented scenario. ' + fill(t.text, name, w[1], 0) + '</p>',
      steps: [choice('kind', 'What kind of explanation does ' + name + ' give' + (t.kind === 'both' ? ' in each case?' : '?'), [
          { t: 'A dispositional attribution: it blames the person\'s character.', ok: t.kind === 'dispositional', why: 'A dispositional attribution points to the person\'s traits.' },
          { t: 'A situational attribution: it blames the circumstances.', ok: false, why: 'A situational attribution points to the circumstances.' },
          { t: both, ok: t.kind === 'both', why: 'Read each explanation on its own: who is being explained, and by what?' },
          { t: 'Neither: it is a statement of fact.', ok: false, why: 'Each explanation gives a cause, so it is an attribution.' }
        ]),
        conceptStep('concept', 'Which bias does this show?', t.concept, ['fae', 'actorObserver', 'selfServing', 'halo'], name)],
      solution: [kindKey, CONCEPTS[t.concept].why],
      figure: { kind: 'attribution' }
    };
  }
  function genCompliance(r, ctx){
    var t = r.pick(COMP_T), w = who(r), name = w[0];
    var why = { foot: 'Agreeing to the small request changes how ' + name + ' sees ' + w[1][3] + ' (as someone who helps), so the big request feels consistent.', door: 'After refusing the big request, the smaller one looks reasonable, and the asker seems to have made a concession that invites one in return.', reciprocity: 'People feel they should return a favor, even an unasked-for one.', halo: 'One positive trait spreads to judgments of unrelated traits.' }[t.concept];
    return {
      type: 'compliance', ctx: ctx.id, topic: ctx.topic, given: { concept: t.concept },
      text: '<p>Invented scenario. ' + fill(t.text, name, w[1], 0) + '</p>',
      steps: [conceptStep('concept', 'Which concept explains this?', t.concept, ['foot', 'door', 'reciprocity', 'halo'], name),
        choice('why', 'Why does it work?', [{ t: why, ok: true, why: 'That is the mechanism.' }].concat([
          ['The person is obeying a direct order from an authority.', 'No one with authority gave an order here.'],
          ['The person is copying a unanimous group.', 'No group is pressuring the person here.'],
          ['The person has lost self-awareness in an anonymous crowd.', 'That is deindividuation; nothing here is anonymous.']
        ].map(function(x){ return { t: x[0], ok: false, why: x[1] }; })), '1.A', 'analyze')],
      solution: [CONCEPTS[t.concept].why, why],
      figure: { kind: 'attribution' }
    };
  }
  var GEN = { conformity: genConformity, obedience: genObedience, bystander: genBystander, groups: genGroups, attribution: genAttribution, compliance: genCompliance };
  var TYPES = Object.keys(GEN);
  function generate(r, ctx, type){
    var t = type || r.pick(ctx.types || TYPES);
    if(!GEN[t]) throw new Error('social-influence: unknown type ' + t);
    return GEN[t](r, ctx);
  }
  function byId(list, id){ return list.filter(function(x){ return x.id === id; })[0]; }

  M.register('socialInfluence', {
    ASCH: ASCH, MILGRAM: MILGRAM, DARLEY: DARLEY, FACIL: FACIL, LOAF: LOAF, CONCEPTS: CONCEPTS,
    CONF_T: CONF_T, OBEY_T: OBEY_T, BY_T: BY_T, GROUP_T: GROUP_T, GROUP_OTHER: GROUP_OTHER, ATTR_T: ATTR_T, COMP_T: COMP_T,
    CONF_STUDY: CONF_STUDY, OBEY_STUDY: OBEY_STUDY, BY_STUDY: BY_STUDY,
    aschPct: aschPct, aschMeasured: aschMeasured, byId: byId, TYPES: TYPES, generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
