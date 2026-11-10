/* FRQ coach model: ApHugMath.frqCoach (docs/aphug-architecture.md, "Tools";
   docs/aphug-spec.md sections 3.2 and 6). OWNED BY THIS TOOL ONLY (builder T2):
   no other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/aphug-tool-checks/frq-coach.mjs)
   and the test (scripts/test/aphug-tool-frq-coach.test.mjs) run exactly this code.

   A context (human-geography/data/tools/frq-coach.json) is one short,
   original free-response question: a scenario and three or four lettered
   parts, each with ONE task verb. A part carries its prompt, the rubric line
   (what earns the point), a full-credit sample, and a weak answer that
   misses the verb's demand (slip: identify-only, no-link, one-side,
   no-degree, example, vague), with why. An explain part also carries its
   chain: the cause, the link and the effect, and two wrong links.

     VERBS                 the six task verbs and their demands, the same words as
                           VERBS in scripts/lib/aphug-exams.mjs (the validator
                           checks they match), plus the slip readers see most
     RULES                 the ApHugGrade.flags rules each verb turns on
     flagsFor(part)        the flags spec for the writing box
     generate(r, ctx, type)  a seeded drill:
       part    one part: its verb's demand, which answer earns the point, and
               (explain) the missing link of the chain
       verbs   every part of the question: what its verb demands
       earns   every part: which of two answers earns the point */
(function(G){
  'use strict';
  var M = G.ApHugMath;
  if(!M) return;

  var VERBS = {
    identify: { name: 'Identify', demand: 'Give the information asked for: a word or short phrase can earn the point, with no reasons needed.',
      slip: 'An answer so general that it names nothing, or a restated prompt.' },
    define: { name: 'Define', demand: 'Give the specific meaning of the term, in your own words, not an example of it.',
      slip: 'An example of the term (or what it is used for) in place of its meaning.' },
    describe: { name: 'Describe', demand: 'Give the relevant characteristics: what it is like, where and how much. A name alone earns nothing.',
      slip: 'A one-word name ("clustered") with no where, what or how much.' },
    explain: { name: 'Explain', demand: 'Say how or why, with every link of the chain: a cause, then because or so, then its effect, tied to the place or data asked about.',
      slip: 'A factor named with no link to the outcome: the because is missing.' },
    compare: { name: 'Compare', demand: 'Give a similarity or a difference and say it about both things, not one.',
      slip: 'Two definitions side by side, or only one side described.' },
    'explain-degree': { name: 'Explain the degree', demand: 'State the degree first (to a high, moderate or low degree), then explain why with evidence.',
      slip: 'A good explanation that never states the degree.' }
  };
  var VERB_ORDER = ['identify', 'define', 'describe', 'explain', 'compare', 'explain-degree'];
  // The ApHugGrade.flags rules the writing box turns on, by verb.
  var RULES = { identify: [], define: [], describe: [], explain: ['mechanism'], compare: ['both'], 'explain-degree': ['degree', 'mechanism'] };
  var SLIPS = ['identify-only', 'no-link', 'one-side', 'no-degree', 'example', 'vague'];
  var SLIP_NAME = { 'identify-only': 'Names it, no more', 'no-link': 'No link', 'one-side': 'One side only', 'no-degree': 'No degree', example: 'An example, not a meaning', vague: 'Too vague' };
  var TYPES = ['part', 'verbs', 'earns'];
  var TYPE_LABEL = { part: 'One part, step by step', verbs: 'What each verb demands', earns: 'Which answer earns the point' };

  function flagsFor(part){
    var w = {};
    (RULES[part.verb] || []).forEach(function(k){ w[k] = true; });
    if(part.scale) w.scale = true;
    return { write: w };
  }
  function partLabel(p){ return 'Part ' + p.label; }
  function promptHtml(p){
    var v = VERBS[p.verb].name, re = new RegExp('^' + v.replace(/ /g, '\\s+'), 'i');
    return String(p.prompt).replace(re, function(m){ return '<b class="hug-fc-verb">' + m + '</b>'; });
  }

  /* ------------------------------------------------------------ steps */
  function demandStep(r, p, key){
    var others = M.shuffle(r, VERB_ORDER.filter(function(v){ return v !== p.verb; })).slice(0, 3);
    var verbs = [p.verb].concat(others);
    var me = VERBS[p.verb];
    return { kind: 'choice', key: key, practice: '1.A',
      label: partLabel(p) + ' says <b>' + me.name + '</b>. What does that verb ask you to do?',
      options: verbs.map(function(v){ return VERBS[v].demand; }), correct: 0,
      why: verbs.map(function(v){ return v === p.verb ? 'Right: ' + me.name.toLowerCase() + ' asks for exactly this.' : 'That is what ' + VERBS[v].name.toLowerCase() + ' asks. ' + me.name + ' asks you to: ' + me.demand.charAt(0).toLowerCase() + me.demand.slice(1); }) };
  }
  function earnsStep(r, p, key){
    return { kind: 'choice', key: key, practice: p.verb === 'compare' ? '1.C' : p.verb === 'explain' || p.verb === 'explain-degree' ? '1.B' : '1.A',
      label: partLabel(p) + ': which answer earns the point?',
      options: [p.sample, p.weak], correct: 0,
      why: ['Right. ' + p.sampleWhy, SLIP_NAME[p.slip] + '. ' + p.weakWhy] };
  }
  function linkStep(r, p, key){
    var c = p.chain;
    return { kind: 'choice', key: key, practice: '1.B',
      label: partLabel(p) + ': complete the chain. "' + c.cause + '" … ? … "' + c.effect + '". Which link goes in the middle?',
      options: [c.link].concat(c.wrong.map(function(w){ return w.text; })), correct: 0,
      why: ['Right: it connects the cause to the effect, so the explanation has every link.'].concat(c.wrong.map(function(w){ return w.why; })) };
  }
  function qText(ctx, only){
    return '<p class="hug-fc-scn">' + ctx.scenario + '</p><ol class="hug-fc-parts">' + ctx.parts.map(function(p){
      return '<li class="hug-fc-part' + (only && only.indexOf(p) < 0 ? ' is-dim' : '') + '"><span class="hug-fc-pl">' + p.label + '</span><span class="hug-fc-pt">' + promptHtml(p) + '</span></li>';
    }).join('') + '</ol>';
  }
  function generate(r, ctx, type){
    type = type || r.pick(TYPES);
    if(TYPES.indexOf(type) < 0) throw new Error('frqCoach: unknown type ' + type);
    var parts = ctx.parts, steps = [], sol = [], only;
    if(type === 'part'){
      var p = r.pick(parts);
      only = [p];
      steps.push(demandStep(r, p, 'demand-' + p.label));
      steps.push(earnsStep(r, p, 'earns-' + p.label));
      if(p.chain) steps.push(linkStep(r, p, 'link-' + p.label));
      sol.push('<b>' + VERBS[p.verb].name + ':</b> ' + VERBS[p.verb].demand);
      sol.push('<b>Rubric line (' + partLabel(p) + '):</b> ' + p.rubric);
      sol.push('<b>Full-credit sample:</b> ' + p.sample);
      if(p.chain) sol.push('<b>The chain:</b> ' + p.chain.cause + ' → ' + p.chain.link + ' → ' + p.chain.effect + '.');
    } else if(type === 'verbs'){
      only = parts;
      parts.forEach(function(p){ steps.push(demandStep(r, p, 'demand-' + p.label)); sol.push('<b>' + partLabel(p) + ', ' + VERBS[p.verb].name + ':</b> ' + VERBS[p.verb].demand); });
    } else {
      only = parts;
      parts.forEach(function(p){ steps.push(earnsStep(r, p, 'earns-' + p.label)); sol.push('<b>' + partLabel(p) + ' (' + VERBS[p.verb].name + '):</b> ' + p.rubric + ' Sample: ' + p.sample); });
    }
    return { type: type, ctx: ctx.id, topic: ctx.topic, parts: only.map(function(p){ return p.label; }), text: qText(ctx, only), steps: steps, solution: sol };
  }

  M.register('frqCoach', {
    VERBS: VERBS, VERB_ORDER: VERB_ORDER, RULES: RULES, SLIPS: SLIPS, SLIP_NAME: SLIP_NAME, TYPES: TYPES, TYPE_LABEL: TYPE_LABEL,
    flagsFor: flagsFor, promptHtml: promptHtml, qText: qText, generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
