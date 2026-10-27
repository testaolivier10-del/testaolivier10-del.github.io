/* Development model: ApPsychMath.development (docs/appsych-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (docs/appsych-briefs/t4.md): no other tool edits
   this file, and this tool edits no shared file. Pure functions, no DOM, so
   the validator (scripts/lib/appsych-tool-checks/development.mjs) and the
   test (scripts/test/appsych-tool-development.test.mjs) run exactly this code.

   The lifespan, as the CED's topics 3.1, 3.4 and 3.6 teach it
   (docs/appsych-ced-map.json; no psychosexual stages, which the CED excludes):
     PIAGET    the four cognitive stages with their usual ages and hallmarks
     ERIKSON   the eight psychosocial stages with their usual ages
     LANES     the timeline's rows (thinking, identity, relationships, body
               and adolescence to adulthood), each a list of bands
     ATTACH    the four attachment patterns as the strange situation shows them
     PARENT    parenting styles on two dimensions (warmth, demands)
     ADULT     crystallized and fluid intelligence across adulthood, and
               dementia as disease, not normal aging (a relative curve,
               labeled as a sketch of the pattern, not data)
   Ages are the usual textbook ages: children vary, and later research found
   several abilities earlier than Piaget thought (said in the tool's Why).

   generate(r, ctx, type) -> one seeded drill problem:
     piaget      a child's behavior: the stage, then the concept
     erikson     a person's struggle: the psychosocial stage, then the next one
     attachment  a strange-situation reunion: the pattern, then what the
                 evidence does and does not allow you to conclude
     parenting   a parent's rules and warmth: the style, then the claim
     adolescence a teen or young adult: the concept, then Erikson's stage
     adultcog    an adult's thinking: the concept, then the research trend
     methods     a study of age: the design, its weak point, then a mean
                 (ApPsychStats) from its invented data
   Every person is invented, and every study in a drill is invented and says so. */
(function(G){
  'use strict';
  var M = G.ApPsychMath;
  if(!M) return;
  function S(){ return G.ApPsychStats; }

  var PIAGET = [
    { id: 'sensorimotor', name: 'Sensorimotor', from: 0, to: 2, short: 'Sensorimotor', hallmark: 'Learns through the senses and actions; object permanence develops.' },
    { id: 'preoperational', name: 'Preoperational', from: 2, to: 7, short: 'Preoperational', hallmark: 'Uses words and pretend play; egocentric; does not yet conserve.' },
    { id: 'concrete', name: 'Concrete operational', from: 7, to: 12, short: 'Concrete', hallmark: 'Thinks logically about real things; conserves quantity.' },
    { id: 'formal', name: 'Formal operational', from: 12, to: 90, short: 'Formal', hallmark: 'Reasons about abstract and hypothetical ideas.' }
  ];
  var ERIKSON = [
    { id: 'trust', name: 'Trust vs. mistrust', from: 0, to: 1, short: 'Trust', q: 'Can I trust the people who care for me?' },
    { id: 'autonomy', name: 'Autonomy vs. shame and doubt', from: 1, to: 3, short: 'Autonomy', q: 'Can I do things myself?' },
    { id: 'initiative', name: 'Initiative vs. guilt', from: 3, to: 6, short: 'Initiative', q: 'Is it OK to plan and start things?' },
    { id: 'competence', name: 'Competence vs. inferiority', from: 6, to: 12, short: 'Competence', q: 'Can I make it in the world of people and things?' },
    { id: 'identity', name: 'Identity vs. role confusion', from: 12, to: 20, short: 'Identity', q: 'Who am I, and what can I be?' },
    { id: 'intimacy', name: 'Intimacy vs. isolation', from: 20, to: 40, short: 'Intimacy', q: 'Can I love and be close to someone?' },
    { id: 'generativity', name: 'Generativity vs. stagnation', from: 40, to: 65, short: 'Generativity', q: 'Can I make my life count for others?' },
    { id: 'integrity', name: 'Integrity vs. despair', from: 65, to: 90, short: 'Integrity', q: 'Has it been a meaningful life?' }
  ];
  /* The timeline's rows. Each band: [from, to, label, short, key]. */
  var LANES = [
    { id: 'think', name: 'Thinking', theory: 'Piaget, then adult intelligence', bands: PIAGET.map(function(p){ return [p.from, p.to === 90 ? 20 : p.to, p.name, p.short, p.id]; }).concat([[20, 90, 'Crystallized grows, fluid slowly declines', 'Adult', 'adult']]) },
    { id: 'self', name: 'Identity', theory: 'Erikson\'s psychosocial stages', bands: ERIKSON.map(function(e){ return [e.from, e.to, e.name, e.short, e.id]; }) },
    { id: 'bond', name: 'Relationships', theory: 'Attachment, play and parenting', bands: [[0, 0.6, 'Bonding begins', 'Bonding', 'bond'], [0.6, 2, 'Attachment; separation anxiety', 'Attachment', 'attach'], [2, 6, 'Parallel, then pretend play', 'Play', 'play'], [6, 12, 'Friendships; parenting style matters', 'Friends', 'friends'], [12, 18, 'Peers matter more', 'Peers', 'peers'], [18, 30, 'Close partners', 'Partners', 'partners'], [30, 65, 'Raising and guiding others', 'Guiding', 'guide'], [65, 90, 'Keeping close ties', 'Ties', 'ties']] },
    { id: 'grow', name: 'Body and roles', theory: 'Adolescence to adulthood', bands: [[0, 10, 'Childhood', 'Childhood', 'child'], [10, 18, 'Puberty and adolescence: imaginary audience, personal fable', 'Adolescence', 'teen'], [18, 25, 'Emerging adulthood', 'Emerging', 'emerging'], [25, 65, 'Adult roles on the social clock', 'Adulthood', 'adult'], [65, 90, 'Later adulthood', 'Later life', 'late']] }
  ];
  var ATTACH = [
    { id: 'secure', name: 'Secure', leave: 'is upset', back: 'goes to the parent for comfort, calms quickly and goes back to playing', play: 'explores the toys, checking back with the parent' },
    { id: 'avoidant', name: 'Avoidant', leave: 'shows little distress', back: 'looks away from the parent and keeps playing, ignoring the return', play: 'plays alone and seldom checks on the parent' },
    { id: 'anxious', name: 'Anxious (ambivalent)', leave: 'is very upset', back: 'reaches for the parent, then pushes away angrily and is hard to soothe', play: 'stays close to the parent and explores little' },
    { id: 'disorganized', name: 'Disorganized', leave: 'reacts in a confused, contradictory way', back: 'walks toward the parent with the head turned away, then freezes', play: 'moves between approaching and avoiding without a clear pattern' }
  ];
  /* Warmth and demands, 0 to 10 each; the quadrant names the style. */
  var PARENT = [
    { id: 'authoritative', name: 'Authoritative', warm: true, demand: true, line: 'High warmth, high demands: clear rules, explained, with room to talk.' },
    { id: 'authoritarian', name: 'Authoritarian', warm: false, demand: true, line: 'Low warmth, high demands: strict rules, obeyed without question.' },
    { id: 'permissive', name: 'Permissive', warm: true, demand: false, line: 'High warmth, few demands: loving, with few rules or limits.' },
    { id: 'uninvolved', name: 'Uninvolved', warm: false, demand: false, line: 'Low warmth, few demands: little guidance or attention. Many textbooks add this fourth style.' }
  ];
  function parentStyle(w, d){ var wm = w >= 5, dm = d >= 5; return PARENT.filter(function(p){ return p.warm === wm && p.demand === dm; })[0]; }
  /* Adult intelligence: a relative sketch of the well-known pattern (fluid
     peaks in the early 20s and declines gradually; crystallized grows into
     late adulthood and declines only late). Index 100 at age 20. */
  function crystallized(age){ age = Math.max(20, Math.min(90, age)); return age <= 65 ? 100 + 30 * (age - 20) / 45 : 130 - 0.12 * (age - 65) * (age - 65) / 2.5; }
  function fluid(age){ age = Math.max(20, Math.min(90, age)); return 100 - 0.9 * (age - 20) - 0.006 * (age - 20) * (age - 20); }

  function stageAt(list, age){ for(var i = 0; i < list.length; i++) if(age >= list[i].from && age < list[i].to) return list[i]; return list[list.length - 1]; }
  function bandAt(lane, age){ for(var i = 0; i < lane.bands.length; i++){ var b = lane.bands[i]; if(age >= b[0] && age < b[1]) return b; } return lane.bands[lane.bands.length - 1]; }
  function byId(list, id){ return list.filter(function(x){ return x.id === id; })[0]; }

  /* The people in a scene: invented names, varied. */
  var NAMES = [['Maya', 0], ['Leo', 1], ['Aiden', 1], ['Sofia', 0], ['Kai', 1], ['Amara', 0], ['Noah', 1], ['Priya', 0], ['Mateo', 1], ['Zoe', 0], ['Elijah', 1], ['Lina', 0], ['Omar', 1], ['Hana', 0], ['Jonah', 1], ['Ava', 0], ['Diego', 1], ['Mei', 0], ['Theo', 1], ['Nia', 0], ['Rafael', 1], ['Ines', 0], ['Samir', 1], ['Grace', 0]];
  var PRON = [['she', 'her', 'her'], ['he', 'him', 'his']];
  /* who(r) -> [name, pronouns]: one draw, so a name always gets its pronouns. */
  function who(r){ var n = r.pick(NAMES); return [n[0], PRON[n[1]]]; }

  /* ------------------------------------------------ piaget concepts */
  var CONCEPTS = {
    'object-permanence': { name: 'Object permanence', why: 'Object permanence is knowing that things still exist when they are out of sight.' },
    conservation: { name: 'Conservation', why: 'Conservation is knowing that an amount stays the same when only its shape or arrangement changes.' },
    egocentrism: { name: 'Egocentrism', why: 'Egocentrism (Piaget\'s sense) is trouble taking another person\'s point of view, not selfishness.' },
    'theory-of-mind': { name: 'Theory of mind', why: 'Theory of mind is understanding that other people have their own thoughts and beliefs, which can be false.' },
    abstract: { name: 'Abstract (hypothetical) reasoning', why: 'Abstract reasoning is thinking about ideas and "what if" possibilities that are not in front of you.' },
    scaffolding: { name: 'Scaffolding', why: 'Scaffolding is support from a more skilled person that is reduced as the learner gains skill (Vygotsky).' },
    pretend: { name: 'Pretend play', why: 'Pretend play uses one thing to stand for another, a sign of symbolic thought.' }
  };
  /* [age range, concept, text (# = name, $ = he/she, % = his/her, ^ = him/her)] */
  var PIAGET_T = [
    [[0.5, 0.7], 'object-permanence', 'A parent hides a rattle under a blanket while # (age @ months) watches. # looks away and does not search for it, as if it no longer exists.', 'has not yet developed object permanence: out of sight is out of mind'],
    [[1, 1.5], 'object-permanence', '# (age @ months) watches a ball roll behind the couch, then crawls around the couch to find it.', 'shows object permanence: the ball still exists when hidden'],
    [[0.75, 1.5], 'object-permanence', 'During peekaboo, # (age @ months) pulls the cloth off the caregiver\'s face, expecting to find it there.', 'shows object permanence: the face is still there under the cloth'],
    [[4, 6], 'conservation', 'Juice from a short, wide glass is poured into a tall, thin glass while # (age @) watches. # says the tall glass now has more juice.', 'does not yet conserve: the taller glass looks like more, though the amount is the same'],
    [[3, 5], 'conservation', 'Two rows have the same number of coins. When one row is spread out, # (age @) says the longer row has more coins.', 'does not yet conserve number: spreading the coins out did not add any'],
    [[8, 10], 'conservation', 'A ball of clay is rolled into a long snake. # (age @) says it is still the same amount of clay because nothing was added or taken away.', 'shows conservation: a change of shape is not a change of amount'],
    [[3, 5], 'egocentrism', 'On a video call, # (age @) holds up a drawing facing $self and asks Grandma, "Do you like it?" sure she can see it.', 'shows egocentrism: assuming Grandma sees what # sees'],
    [[3, 4], 'egocentrism', '# (age @) picks a toy truck as a birthday present for Mom, because # loves trucks.', 'shows egocentrism: choosing from # own point of view, not Mom\'s'],
    [[3, 3.6], 'theory-of-mind', 'A doll puts a marble in a basket and leaves; the marble is moved to a box. Asked where the doll will look, # (age @) points to the box, where the marble really is.', 'has not yet developed theory of mind: # does not see that the doll holds a false belief'],
    [[4.5, 6], 'theory-of-mind', '# (age @) hides a cookie and grins: "Dad thinks it\'s still in the jar, but it\'s not!"', 'shows theory of mind: # knows Dad can hold a false belief'],
    [[13, 17], 'abstract', 'In a debate class, # (age @) argues about what society would be like if no one could ever lie, testing each "what if" in turn.', 'shows abstract, hypothetical reasoning'],
    [[14, 17], 'abstract', 'To find what makes a pendulum swing faster, # (age @) changes one thing at a time: length, then weight, then push.', 'shows abstract reasoning: testing hypotheses one variable at a time'],
    [[5, 7], 'scaffolding', '# (age @) is learning to tie shoes. A parent first ties along with ^, then only gives tips, then just watches.', 'is being scaffolded: help is pulled back as skill grows'],
    [[8, 10], 'scaffolding', 'A tutor helps # (age @) with long division by doing the first step together, then letting # do more of each problem alone.', 'is being scaffolded: help is pulled back as skill grows'],
    [[2, 4], 'pretend', '# (age @) holds a banana to % ear and says, "Hello? Pizza please!"', 'shows pretend play: the banana stands for a phone']
  ];
  /* Which concepts confuse with which (distractors first from these). */
  var CONFUSE = {
    'object-permanence': ['conservation', 'egocentrism', 'theory-of-mind'],
    conservation: ['egocentrism', 'object-permanence', 'abstract'],
    egocentrism: ['theory-of-mind', 'conservation', 'pretend'],
    'theory-of-mind': ['egocentrism', 'object-permanence', 'conservation'],
    abstract: ['conservation', 'egocentrism', 'scaffolding'],
    scaffolding: ['abstract', 'conservation', 'egocentrism'],
    pretend: ['egocentrism', 'object-permanence', 'theory-of-mind']
  };

  /* --------------------------------------------- erikson scenarios */
  var ERIKSON_T = [
    ['trust', [0.3, 0.9], 'When # (age @ months) cries, someone usually comes, and # is starting to settle when picked up.'],
    ['autonomy', [1.5, 2.8], '# (age @) insists, "Me do it!" while trying to put on % own shoes and gets upset when helped.'],
    ['initiative', [4, 5.5], '# (age @) organizes the other kids into a game of "rescue team," assigning everyone a job.'],
    ['competence', [8, 11], '# (age @) compares % grades and soccer skills with classmates and worries about not being as good.'],
    ['identity', [15, 18], '# (age @) tries out different friend groups, styles and future careers, asking "Who am I really?"'],
    ['intimacy', [24, 32], '# (age @) has many coworkers but feels lonely and wonders whether $ can let someone get close.'],
    ['generativity', [45, 58], '# (age @) starts mentoring new employees and coaching a youth team, wanting to give back.'],
    ['integrity', [72, 85], '# (age @) looks through old photos, feeling that, mistakes and all, % life has been worthwhile.']
  ];
  /* ---------------------------------------- adolescence scenarios */
  var TEEN = {
    'imaginary-audience': { name: 'Imaginary audience', why: 'The imaginary audience is the belief that everyone is watching and judging you.' },
    'personal-fable': { name: 'Personal fable', why: 'The personal fable is the belief that you are unique and that bad things will not happen to you.' },
    foreclosure: { name: 'Identity foreclosure', why: 'Foreclosure is committing to an identity without exploring, often one chosen by others.' },
    moratorium: { name: 'Identity moratorium', why: 'Moratorium is actively exploring options without yet committing.' },
    achievement: { name: 'Identity achievement', why: 'Achievement is committing to an identity after exploring.' },
    diffusion: { name: 'Identity diffusion', why: 'Diffusion is neither exploring nor committing.' },
    emerging: { name: 'Emerging adulthood', why: 'Emerging adulthood is the period from about 18 to the mid-20s, between adolescence and settled adult roles, in many cultures today.' },
    'social-clock': { name: 'Social clock', why: 'The social clock is a culture\'s expected timing for life events such as marriage, children or retirement.' }
  };
  var TEEN_T = [
    ['imaginary-audience', [13, 15], '# (age @) refuses to go to school after a bad haircut, sure that everyone will stare at it all day.'],
    ['imaginary-audience', [12, 14], '# (age @) spills a drink at lunch and is convinced the whole cafeteria will remember it for years.'],
    ['personal-fable', [15, 17], '# (age @) texts while driving, saying, "Crashes happen to other people, not me."'],
    ['personal-fable', [14, 16], 'After a breakup, # (age @) says, "No one has ever felt pain like mine. Nobody could understand."'],
    ['foreclosure', [16, 17], '# (age @) has always planned to take over the family bakery and has never considered anything else.'],
    ['moratorium', [19, 21], '# (age @) has switched majors twice and is shadowing a nurse, a teacher and an engineer before deciding.'],
    ['achievement', [21, 24], 'After trying several jobs and classes, # (age @) has chosen social work and feels sure it fits.'],
    ['diffusion', [16, 17], '# (age @) has no plans after graduation and is not looking into any; "I don\'t really care."'],
    ['emerging', [21, 25], '# (age @) has finished college, lives with roommates, changes jobs often and says, "I don\'t feel like a full adult yet."'],
    ['social-clock', [28, 34], '# (age @) feels behind because cousins of the same age are married with kids and # is not.']
  ];
  var PERIOD = {
    child: { name: 'Childhood', why: 'About birth to 10, before puberty begins.' },
    teen: { name: 'Adolescence', why: 'About 10 to 18, from puberty to independence.' },
    emerging: { name: 'Emerging adulthood', why: 'About 18 to 25, exploring before settled adult roles.' },
    adult: { name: 'Adulthood', why: 'About 25 to 65, the years of settled adult roles.' }
  };
  var TEEN_ERIK = { 'imaginary-audience': 'identity', 'personal-fable': 'identity', foreclosure: 'identity', moratorium: 'identity', achievement: 'identity', diffusion: 'identity', emerging: 'identity', 'social-clock': 'intimacy' };
  var TEEN_CONFUSE = {
    'imaginary-audience': ['personal-fable', 'egocentric-child', 'social-clock'],
    'personal-fable': ['imaginary-audience', 'foreclosure', 'emerging'],
    foreclosure: ['achievement', 'moratorium', 'diffusion'],
    moratorium: ['diffusion', 'achievement', 'foreclosure'],
    achievement: ['foreclosure', 'moratorium', 'diffusion'],
    diffusion: ['moratorium', 'foreclosure', 'achievement'],
    emerging: ['moratorium', 'social-clock', 'diffusion'],
    'social-clock': ['emerging', 'imaginary-audience', 'foreclosure']
  };
  TEEN['egocentric-child'] = { name: 'Egocentrism (preoperational)', why: 'Preoperational egocentrism is a young child not taking another view at all; a teen who imagines everyone watching shows the adolescent form called the imaginary audience.' };

  /* ---------------------------------------------- adult cognition */
  var ADULT = {
    crystallized: { name: 'Crystallized intelligence', why: 'Crystallized intelligence is accumulated knowledge and vocabulary; it tends to hold or grow into late adulthood.' },
    fluid: { name: 'Fluid intelligence', why: 'Fluid intelligence is reasoning quickly about new problems; it tends to decline gradually from early adulthood.' },
    dementia: { name: 'Dementia (a disease)', why: 'Dementia is a disease that impairs memory and daily functioning; it is not a normal part of aging.' },
    normal: { name: 'Normal aging', why: 'Normal aging slows processing and recall a little, but daily life stays intact.' }
  };
  var ADULT_T = [
    ['crystallized', [62, 75], '# (age @) beats % grandchildren at a vocabulary game and knows the answers to most history trivia.'],
    ['crystallized', [55, 70], '# (age @), a retired editor, still spots grammar errors faster than anyone in the office.'],
    ['fluid', [65, 78], '# (age @) takes much longer than % teenage grandchild to figure out a brand-new puzzle game with no instructions.'],
    ['fluid', [60, 72], 'On a timed test of new pattern problems, # (age @) scores lower than # did at 25.'],
    ['dementia', [74, 84], '# (age @) has started getting lost on the way home, forgets how to pay bills and no longer recognizes a longtime neighbor.'],
    ['normal', [68, 78], '# (age @) sometimes needs a moment to recall a name, but manages money, drives and keeps up with friends as before.']
  ];
  var ADULT_TREND = {
    crystallized: 'It tends to hold steady or grow until late adulthood.',
    fluid: 'It tends to decline gradually, starting in early adulthood.',
    dementia: 'It is a disease, more common with age, but not a normal part of aging.',
    normal: 'Small slowing is normal; daily functioning stays intact.'
  };
  var TREND_WRONG = [
    'Every mental ability drops sharply at about age 65.',
    'It is the same at every age, so age does not matter.',
    'It peaks in the early teens and declines from then on.'
  ];

  /* --------------------------------------- attachment and parenting */
  var ATTACH_CLAIM_RIGHT = 'Secure attachment is linked with better later relationships, but this is correlational: temperament and the home also differ.';
  var ATTACH_CLAIM_WRONG = [
    ['The parent\'s behavior caused this pattern, because the strange situation is an experiment.', 'No. The strange situation is a structured observation: no one was randomly assigned to a parent, so it cannot show cause.'],
    ['This pattern is fixed for life and will not change.', 'No. Attachment patterns can change, for example when the caregiving situation changes.'],
    ['The child has a psychological disorder.', 'No. An attachment pattern describes a relationship, not a diagnosis.']
  ];
  var PARENT_T = [
    ['authoritative', '#\'s parents set a 10 p.m. curfew, explain why, and listen when # (age @) asks to change it for a special event.'],
    ['authoritative', 'When # (age @) breaks a rule, % parent talks through why it matters and agrees on a fair consequence together.'],
    ['authoritarian', '#\'s father sets strict rules about grades and chores, and when # (age @) asks why, he says, "Because I said so."'],
    ['authoritarian', '# (age @) is punished for questioning any household rule; % parents expect obedience without discussion.'],
    ['permissive', '#\'s parents are warm and affectionate but let # (age @) set % own bedtime and skip homework whenever # likes.'],
    ['permissive', '# (age @) gets hugs and praise at home but almost no rules; % mother says, "I just want to be your friend."'],
    ['uninvolved', '#\'s parents are rarely home and seldom ask about school, friends or rules; # (age @) mostly raises % self.']
  ];
  var PARENT_CLAIM_RIGHT = 'Authoritative parenting is linked with higher social competence, but the link is correlational and differs across cultures.';
  var PARENT_CLAIM_WRONG = [
    ['Studies prove authoritarian parenting causes high grades in every culture.', 'No. These are correlational studies, and the links vary across cultures.'],
    ['The child\'s temperament plays no role in how parents behave.', 'No. Children\'s temperament can shape parenting too: the influence runs both ways.'],
    ['Permissive parenting is linked with the most self-control.', 'No. Permissive parenting is linked with less self-control on average.']
  ];

  /* -------------------------------------------------------- methods */
  var METHOD_T = [
    { design: 'cross', topic: 'vocabulary', text: 'A researcher gives a vocabulary test to groups of 20-, 40- and 60-year-olds, all tested in the same week.' },
    { design: 'cross', topic: 'reaction time', text: 'To study reaction time and age, a lab tests 30 people in each of five age groups on the same day.' },
    { design: 'long', topic: 'vocabulary', text: 'A researcher gives the same group of people a vocabulary test at ages 20, 40 and 60.' },
    { design: 'long', topic: 'reaction time', text: 'A team measures the reaction time of the same 200 children every two years from age 6 to age 18.' }
  ];
  var METHODS = {
    cross: { name: 'Cross-sectional study', why: 'A cross-sectional study compares different age groups at one time.' },
    long: { name: 'Longitudinal study', why: 'A longitudinal study follows the same people over time.' },
    exp: { name: 'Experiment', why: 'An experiment needs a manipulated variable and random assignment; age cannot be assigned.' },
    case: { name: 'Case study', why: 'A case study is an in-depth look at one person or a few people.' }
  };
  var LIMIT = {
    cross: { right: 'A cohort effect: the age groups grew up in different times (schooling, technology), not just at different ages.', wrongs: ['Participants dropping out over the years.', 'Practice effects from taking the same test many times.', 'The study takes decades to finish.'] },
    long: { right: 'People drop out over the years (attrition), and it takes a long time and costs a lot.', wrongs: ['A cohort effect between the age groups compared.', 'No one can be followed over time in this design.', 'Age was randomly assigned, so results cannot generalize.'] }
  };

  /* --------------------------------------------------------- helpers */
  function fill(t, name, pr, age){
    var ageText = age < 2 ? String(Math.round(age * 12)) : String(Math.round(age));
    return t.replace(/@/g, ageText).replace(/\$self/g, pr[0] === 'she' ? 'herself' : 'himself').replace(/#/g, name).replace(/\$/g, pr[0]).replace(/\^/g, pr[1]).replace(/%/g, pr[2]);
  }
  function ageIn(r, a){ var lo = a[0], hi = a[1]; if(hi - lo < 1) return M.round(lo + r() * (hi - lo), 2); return r.int(Math.ceil(lo), Math.floor(hi)); }
  function choice(key, label, opts, practice, level){
    // opts: [{ t, why, ok }]; the right one first in authoring, the page shuffles.
    var c = -1; opts.forEach(function(o, i){ if(o.ok) c = i; });
    return { key: key, kind: 'choice', label: label, options: opts.map(function(o){ return o.t; }), why: opts.map(function(o){ return (o.ok ? 'Yes. ' : 'Not this one. ') + o.why; }), correct: c, practice: practice || '1.A', level: level || 'apply' };
  }
  function ageWords(age){ return age < 2 ? Math.round(age * 12) + ' months' : Math.round(age) + (Math.round(age) === 1 ? ' year' : ' years'); }

  /* ------------------------------------------------------------ types */
  function genPiaget(r, ctx){
    var t = r.pick(PIAGET_T), age = ageIn(r, t[0]), w = who(r), name = w[0], pr = w[1], concept = t[1];
    var st = stageAt(PIAGET, age), text = fill(t[2], name, pr, age);
    var stageOpts = PIAGET.map(function(p){ return { t: p.name, ok: p.id === st.id, why: p.id === st.id ? 'At ' + ageWords(age) + ', ' + name + ' is in the ' + p.name.toLowerCase() + ' stage (about ' + p.from + ' to ' + (p.to === 90 ? 'adulthood' : p.to) + ' years). ' + p.hallmark : 'The ' + p.name.toLowerCase() + ' stage is about ' + p.from + ' to ' + (p.to === 90 ? 'adulthood' : p.to + ' years') + '; ' + name + ' is ' + ageWords(age) + '. ' + p.hallmark }; });
    var pool = [concept].concat(CONFUSE[concept]).slice(0, 4);
    var conOpts = pool.map(function(k){ return { t: CONCEPTS[k].name, ok: k === concept, why: CONCEPTS[k].why + (k === concept ? '' : ' That is not what ' + name + ' shows here.') }; });
    var shows = fill(t[3], name, pr, age).replace(name + ' own', pr[2] + ' own');
    return {
      type: 'piaget', ctx: ctx.id, topic: ctx.topic, given: { age: age, name: name, concept: concept, stage: st.id },
      text: '<p>' + text + '</p><p>Place ' + name + ' on the lifespan, then name what the behavior shows.</p>',
      steps: [choice('stage', 'Which of Piaget\'s stages is ' + name + ' in?', stageOpts), choice('concept', 'Which concept is this behavior about?', conOpts)],
      solution: ['At ' + ageWords(age) + ', ' + name + ' is in the ' + st.name.toLowerCase() + ' stage (usual ages; children vary).', name + ' ' + shows + '. ' + CONCEPTS[concept].why],
      figure: { kind: 'life', age: age, name: name, lane: 'think' }
    };
  }
  function genErikson(r, ctx){
    var t = r.pick(ERIKSON_T), age = ageIn(r, t[1]), w = who(r), name = w[0], pr = w[1], st = byId(ERIKSON, t[0]);
    var i = ERIKSON.indexOf(st), near = ERIKSON.filter(function(e, k){ return k !== i; }).sort(function(a, b){ return Math.abs(ERIKSON.indexOf(a) - i) - Math.abs(ERIKSON.indexOf(b) - i) || ERIKSON.indexOf(a) - ERIKSON.indexOf(b); }).slice(0, 3);
    var opts = [st].concat(near).map(function(e){ return { t: e.name, ok: e === st, why: e === st ? 'The question here is "' + e.q + '", the crisis of about ages ' + e.from + ' to ' + (e.to === 90 ? 'the end of life' : e.to) + '.' : e.name + ' asks "' + e.q + '" (about ages ' + e.from + ' to ' + (e.to === 90 ? 'the end of life' : e.to) + ').' }; });
    var nx = ERIKSON[i + 1];
    var step2;
    if(nx){
      var others = ERIKSON.filter(function(e){ return e !== nx; }).sort(function(a, b){ return Math.abs(ERIKSON.indexOf(a) - i - 1) - Math.abs(ERIKSON.indexOf(b) - i - 1) || ERIKSON.indexOf(a) - ERIKSON.indexOf(b); }).slice(0, 3);
      step2 = choice('next', 'Which crisis does Erikson place next in ' + name + '\'s life?', [nx].concat(others).map(function(e){ return { t: e.name, ok: e === nx, why: e === nx ? 'The stages come in a fixed order; after ' + st.short.toLowerCase() + ' comes ' + nx.name.toLowerCase() + '.' : e === st ? 'That is the crisis ' + name + ' is in now.' : ERIKSON.indexOf(e) < i ? 'That crisis comes earlier in life.' : 'That crisis comes later, not next.' }; }));
    } else {
      var prev = ERIKSON[i - 1], others2 = ERIKSON.filter(function(e){ return e !== prev; }).sort(function(a, b){ return Math.abs(ERIKSON.indexOf(a) - i + 1) - Math.abs(ERIKSON.indexOf(b) - i + 1) || ERIKSON.indexOf(a) - ERIKSON.indexOf(b); }).slice(0, 3);
      step2 = choice('next', 'Which crisis came just before this one in Erikson\'s order?', [prev].concat(others2).map(function(e){ return { t: e.name, ok: e === prev, why: e === prev ? 'Before integrity comes generativity vs. stagnation, in middle adulthood.' : e === st ? 'That is the crisis ' + name + ' is in now.' : 'That crisis comes earlier than middle adulthood.' }; }));
    }
    return {
      type: 'erikson', ctx: ctx.id, topic: ctx.topic, given: { age: age, name: name, stage: st.id },
      text: '<p>' + fill(t[2], name, pr, age) + '</p><p>Which psychosocial crisis is ' + name + ' working through?</p>',
      steps: [choice('stage', 'Which of Erikson\'s stages fits?', opts), step2],
      solution: [name + ' is asking "' + st.q + '": ' + st.name.toLowerCase() + ' (about ages ' + st.from + ' to ' + (st.to === 90 ? 'the end of life' : st.to) + ').', nx ? 'Next comes ' + nx.name.toLowerCase() + '. The eight stages come in order across the whole lifespan.' : 'Just before it comes generativity vs. stagnation. The eight stages come in order across the whole lifespan.'],
      figure: { kind: 'life', age: age, name: name, lane: 'self' }
    };
  }
  function genAttachment(r, ctx){
    var a = r.pick(ATTACH), w = who(r), name = w[0], pr = w[1], months = r.int(12, 20);
    var text = 'In a laboratory playroom (the strange situation), # (age ' + months + ' months) ' + a.play + '. When the parent leaves, # ' + a.leave + '. When the parent returns, # ' + a.back + '.';
    text = fill(text, name, pr, months / 12);
    var opts = ATTACH.map(function(x){ return { t: x.name, ok: x === a, why: x.name + ' attachment: when the parent leaves, the child ' + x.leave + '; on reunion, the child ' + x.back + '.' + (x === a ? '' : ' ' + name + '\'s reunion does not look like that.') }; });
    var claims = [{ t: ATTACH_CLAIM_RIGHT, ok: true, why: 'The strange situation observes; it does not assign children to parents, so a link is not proof of cause.' }].concat(ATTACH_CLAIM_WRONG.map(function(w){ return { t: w[0], ok: false, why: w[1] }; }));
    return {
      type: 'attachment', ctx: ctx.id, topic: ctx.topic, given: { age: months / 12, name: name, style: a.id },
      text: '<p>' + text + '</p>',
      steps: [choice('style', 'Which attachment pattern does ' + name + ' show?', opts), choice('claim', 'Which conclusion does the evidence on attachment support?', claims, '2.A', 'analyze')],
      solution: ['The reunion is the key moment: ' + name + ' ' + a.back + '. That is ' + a.name.toLowerCase() + ' attachment.', 'The strange situation is an observation, so attachment research shows links, not causes; temperament and the home differ too.'],
      figure: { kind: 'life', age: months / 12, name: name, lane: 'bond' }
    };
  }
  function genParenting(r, ctx){
    var t = r.pick(PARENT_T), age = r.int(13, 16), w = who(r), name = w[0], pr = w[1], st = byId(PARENT, t[0]);
    var opts = PARENT.map(function(p){ return { t: p.name, ok: p === st, why: p.line + (p === st ? '' : ' That does not match ' + name + '\'s home.') }; });
    var claims = [{ t: PARENT_CLAIM_RIGHT, ok: true, why: 'Parenting studies are mostly correlational: parents are not randomly assigned a style, and cultures differ.' }].concat(PARENT_CLAIM_WRONG.map(function(w){ return { t: w[0], ok: false, why: w[1] }; }));
    return {
      type: 'parenting', ctx: ctx.id, topic: ctx.topic, given: { age: age, name: name, style: st.id },
      text: '<p>' + fill(t[1], name, pr, age) + '</p>',
      steps: [choice('style', 'Which parenting style is this?', opts), choice('claim', 'Which statement about parenting research is accurate?', claims, '2.A', 'analyze')],
      solution: ['Rate the two dimensions: warmth and demands. ' + st.line, 'Parenting research is mostly correlational and varies by culture, so it shows links, not causes.'],
      figure: { kind: 'parent', warm: st.warm ? 8 : 2, demand: st.demand ? 8 : 2, name: name, age: age }
    };
  }
  function genTeen(r, ctx){
    var t = r.pick(TEEN_T), age = ageIn(r, t[1]), w = who(r), name = w[0], pr = w[1], k = t[0];
    var pool = [k].concat(TEEN_CONFUSE[k]).slice(0, 4);
    var opts = pool.map(function(x){ return { t: TEEN[x].name, ok: x === k, why: TEEN[x].why + (x === k ? '' : ' That is not what ' + name + ' shows.') }; });
    var grow = LANES[3], per = bandAt(grow, age), perOpts = grow.bands.slice(0, 4).map(function(b){ return { t: PERIOD[b[4]].name, ok: b === per, why: PERIOD[b[4]].why + (b === per ? '' : ' ' + name + ' is ' + Math.round(age) + '.') }; });
    return {
      type: 'adolescence', ctx: ctx.id, topic: ctx.topic, given: { age: age, name: name, concept: k, period: per[4] },
      text: '<p>' + fill(t[2], name, pr, age) + '</p>',
      steps: [choice('concept', 'Which concept best explains this?', opts), choice('period', 'At ' + Math.round(age) + ', which period of life is ' + name + ' in?', perOpts)],
      solution: [TEEN[k].why, 'At ' + Math.round(age) + ', ' + name + ' is in ' + PERIOD[per[4]].name.toLowerCase() + ' (' + PERIOD[per[4]].why.toLowerCase().replace(/\.$/, '') + ').'],
      figure: { kind: 'life', age: age, name: name, lane: 'grow' }
    };
  }
  function genAdult(r, ctx){
    var t = r.pick(ADULT_T), age = ageIn(r, t[1]), w = who(r), name = w[0], pr = w[1], k = t[0];
    var opts = ['crystallized', 'fluid', 'dementia', 'normal'].map(function(x){ return { t: ADULT[x].name, ok: x === k, why: ADULT[x].why + (x === k ? '' : ' That is not what ' + name + ' shows.') }; });
    var trend = [{ t: ADULT_TREND[k], ok: true, why: k === 'dementia' ? 'Dementia is more common in later life but is caused by disease; most older adults never develop it.' : k === 'normal' ? 'Some slowing is part of normal aging; losing the ability to manage daily life is not.' : 'This is the usual pattern in studies of adults; people vary a lot.' }].concat(TREND_WRONG.map(function(w){ return { t: w, ok: false, why: 'Abilities change gradually and differently; there is no single drop at one age, and they do not peak in the early teens.' }; }));
    return {
      type: 'adultcog', ctx: ctx.id, topic: ctx.topic, given: { age: age, name: name, concept: k },
      text: '<p>' + fill(t[2], name, pr, age) + '</p>',
      steps: [choice('concept', 'Which concept does this describe?', opts), choice('trend', 'What does research show about this with age?', trend)],
      solution: [ADULT[k].why, ADULT_TREND[k]],
      figure: { kind: 'adult', age: age, name: name, concept: k }
    };
  }
  function genMethods(r, ctx){
    var t = r.pick(METHOD_T), n = r.int(5, 7), base = r.int(t.topic === 'vocabulary' ? 30 : 250, t.topic === 'vocabulary' ? 40 : 300);
    var spread = t.topic === 'vocabulary' ? 6 : 40;
    var data = M.repeat(n, function(){ return base + r.int(-spread, spread); });
    var group = t.design === 'cross' ? r.pick(['the 60-year-old group', 'the 40-year-old group', 'the oldest group']) : r.pick(['the first testing', 'the last testing']);
    var mean = S().evaluate({ fn: 'mean', args: [data] });
    var median = S().evaluate({ fn: 'median', args: [data] }), sum = S().evaluate({ fn: 'sum', args: [data] });
    var unit = t.topic === 'vocabulary' ? 'words correct' : 'milliseconds';
    var methodOpts = ['cross', 'long', 'exp', 'case'].map(function(k){ return { t: METHODS[k].name, ok: k === t.design, why: METHODS[k].why + (k === t.design ? '' : ' That is not this design.') }; });
    var L = LIMIT[t.design];
    var limitOpts = [{ t: L.right, ok: true, why: t.design === 'cross' ? 'Different age groups are also different generations (cohorts).' : 'Following the same people for years means some drop out, and it is slow and costly.' }].concat(L.wrongs.map(function(w){ return { t: w, ok: false, why: t.design === 'cross' ? 'That is a problem for following the same people over time, not for comparing age groups at one time.' : 'That is not a weakness of following the same people over time.' }; }));
    var cell = M.cell(mean, 0.005, [{ value: sum, why: 'That is the sum. Divide it by the number of scores (' + n + ').' }, { value: median, why: 'That is the median (the middle score in order). The mean adds the scores and divides by how many there are.' }], 0.051);
    return {
      type: 'methods', ctx: ctx.id, topic: ctx.topic, given: { design: t.design, data: data, unit: unit, group: group },
      text: '<p>' + t.text + '</p><p>Invented study for practice. Scores for ' + group + ' (' + unit + '): <b>' + data.join(', ') + '</b>.</p>',
      steps: [choice('method', 'Which research design is this?', methodOpts, '2.A'), choice('limit', 'Which is the main weakness of this design?', limitOpts, '2.A', 'analyze'),
        { key: 'mean', kind: 'num', label: 'What is the mean score for ' + group + '? Round to one decimal place.', hint: 'Add the ' + n + ' scores, then divide by ' + n + '.', cell: cell, d: 1, practice: '3.B', level: 'apply' }],
      solution: [METHODS[t.design].why, L.right, 'Mean = (' + data.join(' + ') + ') / ' + n + ' = ' + sum + ' / ' + n + ' = ' + M.fixed(mean, 1) + ' ' + unit + '.'],
      figure: { kind: 'design', design: t.design, data: data, unit: unit }
    };
  }
  var GEN = { piaget: genPiaget, erikson: genErikson, attachment: genAttachment, parenting: genParenting, adolescence: genTeen, adultcog: genAdult, methods: genMethods };
  var TYPES = Object.keys(GEN);
  function generate(r, ctx, type){
    var t = type || r.pick(ctx.types || TYPES);
    if(!GEN[t]) throw new Error('development: unknown type ' + t);
    return GEN[t](r, ctx);
  }

  M.register('development', {
    PIAGET: PIAGET, ERIKSON: ERIKSON, LANES: LANES, ATTACH: ATTACH, PARENT: PARENT,
    CONCEPTS: CONCEPTS, TEEN: TEEN, PERIOD: PERIOD, ADULT: ADULT, METHODS: METHODS,
    PIAGET_T: PIAGET_T, ERIKSON_T: ERIKSON_T, TEEN_T: TEEN_T, ADULT_T: ADULT_T, PARENT_T: PARENT_T, METHOD_T: METHOD_T,
    stageAt: stageAt, bandAt: bandAt, byId: byId, parentStyle: parentStyle, crystallized: crystallized, fluid: fluid, ageWords: ageWords,
    TYPES: TYPES, generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
