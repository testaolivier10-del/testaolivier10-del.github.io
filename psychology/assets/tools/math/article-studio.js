/* Article analysis studio model: ApPsychMath.articleStudio (docs/appsych-architecture.md, "Tools";
   docs/appsych-spec.md sections 3.1 and 6). OWNED BY THIS TOOL ONLY (builder T1):
   no other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/appsych-tool-checks/article-studio.mjs)
   and the test (scripts/test/appsych-tool-article-studio.test.mjs) run exactly this code.

   A context (psychology/data/tools/article-studio.json) is one invented study,
   written as the exam lays a study out: introduction (with the hypothesis),
   participants (with a small table), method (design, procedure, the measure,
   the ethical safeguards) and results (a graph). The model turns it into
     study(ctx, variant, r)   the numbers: group means (kind "means") or the
                              scatter points and r (kind "r"), every value
                              from ApPsychStats; variant "support" (the
                              predicted difference, statistically
                              significant), "null" (a small difference, not
                              significant; r near 0) or "reverse" (the
                              opposite difference, significant)
     summary(ctx, st)         the study as sections of HTML, every place an
                              AAQ part is answered tagged <span class="as-hl"
                              data-part="A"> (A method ... F argument)
     parts(ctx, st)           per part: where to look, a full-credit answer
                              and a typical miss with the slip the 2025 Chief
                              Reader Reports name (docs/appsych-research/framework.md
                              section 7)
     generate(r, ctx, type)   a seeded drill: type "full" (every part), "design"
                              (A method, B operational definition), "results"
                              (C the statistic, F the argument) or "ethics"
                              (D a safeguard and how it was applied, E
                              generalizability). Every wrong option names its
                              slip. */
(function(G){
  'use strict';
  var M = G.ApPsychMath;
  if(!M) return;
  function S(){ return G.ApPsychStats; }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function cap(s){ s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
  function low(s){ s = String(s); return s.charAt(0).toLowerCase() + s.slice(1); }
  function fx(v, d){ return M.fixed(v, d || 0); }
  function rtxt(v){ return M.minus(M.fixed(v, 2)).replace(/^(−?)0\./, '$1.'); }

  var TYPES = ['full', 'design', 'results', 'ethics'];
  var TYPE_LABEL = { full: 'The whole AAQ', design: 'Method and variable (A, B)', results: 'Statistic and argument (C, F)', ethics: 'Ethics and generalizing (D, E)' };
  var PARTS = [
    { k: 'A', name: 'Research method', short: 'Method', pts: 1, skill: '2.A' },
    { k: 'B', name: 'Operational definition', short: 'Variable', pts: 1, skill: '2.B' },
    { k: 'C', name: 'Statistic', short: 'Statistic', pts: 1, skill: '3.B' },
    { k: 'D', name: 'Ethical guideline', short: 'Ethics', pts: 1, skill: '2.D' },
    { k: 'E', name: 'Generalizability', short: 'Generalize', pts: 1, skill: '2.A' },
    { k: 'F', name: 'Argumentation', short: 'Argue', pts: 2, skill: '4.B' }
  ];
  /* The research methods a student may name (framework.md section 7: the wrong
     method, several methods, or a hybrid lose part A). */
  var METHODS = {
    experiment: 'An experiment',
    correlational: 'A correlational study',
    naturalistic: 'Naturalistic observation',
    case: 'A case study',
    survey: 'A survey',
    meta: 'A meta-analysis',
    hybrid: 'An experimental correlation'
  };
  /* Ethical safeguards (research-ethics topic), each with its general
     definition: a definition alone does not say how THIS study applied it. */
  var GUIDE = {
    consent: { name: 'Informed consent', def: 'Participants agree to take part after being told what the study involves.' },
    parent: { name: 'Parental consent', def: 'A parent or guardian agrees before a minor takes part.' },
    assent: { name: 'Informed assent', def: 'A child agrees in words the child can understand.' },
    withdraw: { name: 'The right to withdraw', def: 'Participants may stop at any time without a penalty.' },
    confidential: { name: 'Confidentiality', def: 'What participants share is kept private.' },
    debrief: { name: 'Debriefing', def: 'Participants are told the true purpose of the study afterward.' },
    irb: { name: 'Review by an institutional review board', def: 'A committee checks that a study is ethical before it begins.' },
    harm: { name: 'Protection from harm', def: 'Researchers keep physical and psychological risk to a minimum.' }
  };
  var VARIANTS = ['support', 'null', 'reverse'];

  /* ------------------------------------------------------------ numbers */
  /* A context may limit its results (ctx.variants): a reversed result is not
     offered where it would teach a false fact (caffeine helping sleep). */
  function variantOf(r, ctx){
    var u = r(), v = u < 0.6 ? 'support' : u < 0.85 ? 'null' : 'reverse', ok = (ctx && ctx.variants) || VARIANTS;
    return ok.indexOf(v) > -1 ? v : ok[0];
  }
  function study(ctx, variant, r){
    variant = variant || 'support';
    r = r || M.rng(7);
    return ctx.kind === 'r' ? corrStudy(ctx, variant, r) : meansStudy(ctx, variant, r);
  }
  function meansStudy(ctx, variant, r){
    var dv = ctx.dv, d = dv.dec || 0, step = Math.pow(10, -d), G2 = ctx.groups.length;
    var hi = ctx.predict[0], lo = ctx.predict[1];
    var base = M.round(r.between(dv.base[0], dv.base[1], 6), d);
    var gap = variant === 'null' ? M.round(r.between(dv.nullGap[0], dv.nullGap[1], 6), d) : M.round(r.between(dv.gap[0], dv.gap[1], 6), d);
    if(gap < step) gap = step;
    var means = [];
    for(var i = 0; i < G2; i++) means.push(null);
    var up = variant === 'reverse' ? lo : hi, down = variant === 'reverse' ? hi : lo;
    means[down] = base;
    means[up] = M.round(base + gap, d);
    // A third group sits between the two the hypothesis compares.
    for(var k = 0; k < G2; k++) if(means[k] == null) means[k] = M.round(base + gap * r.between(0.3, 0.7, 4), d);
    var n = ctx.participants.n, per = Math.floor(n / G2);
    var diff = S().evaluate({ fn: 'abs', args: [{ fn: 'sub', args: [means[hi], means[lo]] }] });
    return { kind: 'means', variant: variant, means: means, hi: hi, lo: lo, per: per, n: per * G2, diff: diff, dec: d,
      sig: variant !== 'null', higher: means[hi] > means[lo] ? hi : lo };
  }
  function corrStudy(ctx, variant, r){
    var X = ctx.x, Y = ctx.y, n = ctx.participants.n, pts, rv, guard = 0;
    var dir = variant === 'reverse' ? -ctx.direction : ctx.direction;
    var xm = (X.range[0] + X.range[1]) / 2, ym = (Y.range[0] + Y.range[1]) / 2, k = (Y.range[1] - Y.range[0]) / (X.range[1] - X.range[0]);
    do {
      pts = [];
      for(var i = 0; i < n; i++){
        var x = M.round(r.between(X.range[0], X.range[1], 6), X.dec || 0);
        var noise = M.normal(r, 0, (Y.range[1] - Y.range[0]) * (variant === 'null' ? 0.22 : 0.13));
        var y = variant === 'null' ? ym + noise : ym + dir * 0.75 * k * (x - xm) + noise;
        y = Math.min(Y.range[1], Math.max(Y.range[0], M.round(y, Y.dec || 0)));
        pts.push([x, y]);
      }
      try{ rv = S().evaluate({ fn: 'r', args: [pts] }); }catch(e){ rv = NaN; }
      guard++;
    } while(guard < 400 && !(variant === 'null' ? Math.abs(rv) < 0.09 : (rv * dir >= 0.35 && rv * dir <= 0.88)));
    var r2 = M.round(rv, 2);
    return { kind: 'r', variant: variant, points: pts, r: rv, r2: r2, n: n, dir: Math.abs(r2) < 0.1 ? 0 : r2 > 0 ? 1 : -1,
      slope: S().evaluate({ fn: 'slope', args: [pts] }), intercept: S().evaluate({ fn: 'intercept', args: [pts] }), describe: S().describe(r2) };
  }

  /* ------------------------------------------------------------ the summary */
  function hl(part, html){ return '<span class="as-hl" data-part="' + part + '">' + html + '</span>'; }
  function meanText(ctx, st, i){ return ctx.dv.res.replace('{g}', ctx.groups[i].name).replace('{m}', fx(st.means[i], st.dec)); }
  function resultsHtml(ctx, st){
    if(st.kind === 'r'){
      return 'The correlation between ' + ctx.x.name + ' and ' + ctx.y.name + ' was <i>r</i> = ' + rtxt(st.r2) + ' (' + st.n + ' participants; each dot in the graph is one participant).';
    }
    var parts = ctx.groups.map(function(g, i){ return meanText(ctx, st, i); });
    var list = parts.length === 2 ? parts.join(', and ') : parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];
    var cmp = ctx.groups[st.hi].name + ' and ' + ctx.groups[st.lo].name;
    return cap(list) + '. The difference between ' + cmp + ' was ' + (st.sig ? '<b>statistically significant</b> (<i>p</i> &lt; .05)' : '<b>not statistically significant</b> (<i>p</i> &gt; .05)') + '.';
  }
  function summary(ctx, st){
    var P = ctx.participants;
    var table = '<table class="as-ptable"><caption>Participants</caption><tbody>' + P.table.map(function(row){ return '<tr><th scope="row">' + row[0] + '</th><td>' + row[1] + '</td></tr>'; }).join('') +
      (st.kind === 'means' ? '<tr><th scope="row">Per group</th><td>' + st.per + '</td></tr>' : '') + '</tbody></table>';
    var measure = hl('B', ctx.dv.sentence);
    var ethics = ctx.ethics.map(function(e){ return hl('D', e.how); }).join(' ');
    return [
      { k: 'introduction', title: 'Introduction', html: '<p>' + ctx.intro + ' ' + hl('F', 'The researchers hypothesized that ' + ctx.hypothesis + '.') + '</p>' },
      { k: 'participants', title: 'Participants', html: '<p>' + hl('E', P.html) + '</p>' + table },
      { k: 'method', title: 'Method', html: '<p>' + hl('A', ctx.design) + ' ' + ctx.procedure + ' ' + measure + '</p><p>' + ethics + '</p>' },
      { k: 'results', title: 'Results', html: '<p>' + hl('C', resultsHtml(ctx, st)) + '</p>' }
    ];
  }

  /* ------------------------------------------------------------ the parts, in words */
  function supportsWord(st){ return st.variant === 'support' ? 'Supports' : st.variant === 'null' ? 'Does not support' : 'Refutes'; }
  function statRight(ctx, st){
    if(st.kind === 'r'){
      if(st.dir === 0) return '<i>r</i> = ' + rtxt(st.r2) + ' is ' + st.describe + ': in this sample ' + ctx.x.name + ' and ' + ctx.y.name + ' were not related.';
      return '<i>r</i> = ' + rtxt(st.r2) + ' is ' + st.describe + ': participants who ' + ctx.x.more + ' tended to ' + (st.dir > 0 ? ctx.y.up : ctx.y.down) + '. A correlation does not show that one causes the other.';
    }
    var A = ctx.groups[st.higher].name, B = ctx.groups[st.higher === st.hi ? st.lo : st.hi].name;
    var mA = st.means[st.higher], mB = st.means[st.higher === st.hi ? st.lo : st.hi];
    return cap(A) + ' ' + ctx.dv.more + ' on average (' + fx(mA, st.dec) + ') than ' + B + ' (' + fx(mB, st.dec) + '). ' +
      (st.sig ? 'The difference is statistically significant, so it is unlikely to be due to chance alone.' : 'The difference is not statistically significant, so it could plausibly be due to chance.');
  }
  function argueRight(ctx, st){
    var w = supportsWord(st);
    if(st.kind === 'r'){
      var rr = '<i>r</i> = ' + rtxt(st.r2);
      if(st.variant === 'support') return w + ': ' + rr + ' shows that participants who ' + ctx.x.more + ' tended to ' + (ctx.direction > 0 ? ctx.y.up : ctx.y.down) + ', the relationship the hypothesis predicts.';
      if(st.variant === 'null') return w + ': ' + rr + ' is close to 0, so ' + ctx.x.name + ' and ' + ctx.y.name + ' were not related in this sample.';
      return w + ': ' + rr + ' runs the opposite way: participants who ' + ctx.x.more + ' tended to ' + (ctx.direction > 0 ? ctx.y.down : ctx.y.up) + '.';
    }
    var H = ctx.groups[st.hi].name, L = ctx.groups[st.lo].name, mH = fx(st.means[st.hi], st.dec), mL = fx(st.means[st.lo], st.dec);
    if(st.variant === 'support') return w + ': ' + H + ' ' + ctx.dv.more + ' (' + mH + ') than ' + L + ' (' + mL + '), a statistically significant difference in the direction the hypothesis predicts.';
    if(st.variant === 'null') return w + ': ' + H + ' (' + mH + ') and ' + L + ' (' + mL + ') differed by only ' + fx(st.diff, st.dec) + ', and the difference was not statistically significant, so it could be due to chance.';
    return w + ': ' + L + ' ' + ctx.dv.more + ' (' + mL + ') than ' + H + ' (' + mH + '), a statistically significant difference opposite to the prediction.';
  }
  function parts(ctx, st){
    var g = ctx.generalize[0], e = ctx.ethics[0];
    return {
      A: { where: 'how people ended up in each condition.', earns: METHODS[ctx.method] + '. ' + ctx.methodWhy,
        misses: METHODS[ctx.method === 'experiment' ? 'correlational' : 'experiment'] + ', or two methods at once.', slip: 'The readers saw the wrong method, several methods, or a hybrid such as "an experimental correlation". Name one method, and only if the design fits it.' },
      B: { where: 'the sentence that says what was counted or scored, and when.', earns: cap(ctx.dv.what) + ' ' + ctx.dv.how + '.',
        misses: cap(ctx.dv.vague) + '.', slip: 'Describing the concept in general, not how this study measured it. Say what was counted or scored, on what scale, and when.' },
      C: { where: 'the numbers for each group (or r), and whether the difference was statistically significant.', earns: statRight(ctx, st),
        misses: st.kind === 'r' ? 'The correlation was ' + rtxt(st.r2) + '.' : 'The mean of ' + ctx.groups[st.hi].name + ' was ' + fx(st.means[st.hi], st.dec) + ' and the mean of ' + ctx.groups[st.lo].name + ' was ' + fx(st.means[st.lo], st.dec) + '.',
        slip: 'Restating the numbers without saying what they show for these groups, reversing the direction, or defining "mean" or "significant" in general.' },
      D: { where: 'the sentences about consent, withdrawal, review or debriefing.', earns: GUIDE[e.g].name + ': ' + e.how,
        misses: GUIDE[ctx.ethicsAbsent[0]].name + ' (the summary never mentions it), or random assignment (a design feature, not an ethical guideline).', slip: 'Naming a guideline the summary never describes, or not saying how the researchers applied it.' },
      E: { where: 'age, place, culture and how they were recruited.', earns: cap(g.key) + ', for ' + g.pop + ': ' + g.because,
        misses: 'No, only ' + ctx.participants.n + ' people took part.', slip: 'Arguing from sample size or a design flaw instead of who the participants were. Name the population and the trait that matters.' },
      F: { where: 'the hypothesis in the Introduction, then the finding in the Results.', earns: argueRight(ctx, st),
        misses: 'It proves that ' + ctx.hypothesis + '.', slip: 'Evidence with no explanation, an explanation with no result, misreading the result, or saying a study "proves" an idea.' }
    };
  }

  /* ------------------------------------------------------------ drills */
  function opt(t, why, key){ return { t: t, why: why, key: !!key }; }
  function choice(r, key, label, opts, practice, hint){
    var o = M.shuffle(r, opts), c = -1;
    o.forEach(function(x, i){ if(x.key) c = i; });
    var s = { kind: 'choice', key: key, label: label, options: o.map(function(x){ return x.t; }), why: o.map(function(x){ return x.why; }), correct: c, practice: practice, level: 'apply' };
    if(hint) s.hint = hint;
    return s;
  }
  function pickN(r, list, n){ return M.shuffle(r, list).slice(0, n); }

  function stepMethod(r, ctx){
    var key = ctx.method, pool = Object.keys(METHODS).filter(function(m){ return m !== key && m !== 'hybrid'; });
    var why = function(m){
      if(m === 'hybrid') return 'There is no such method. A study is an experiment (a variable is manipulated and participants are randomly assigned) or a correlational study (variables are only measured), never both. The readers refuse hybrids.';
      if(key === 'experiment' && m === 'correlational') return 'The researchers manipulated ' + ctx.iv + ' and assigned participants to conditions at random. A correlational study only measures variables as they are.';
      if(key === 'experiment') return METHODS[m] + ' does not fit: the researchers manipulated ' + ctx.iv + ' and assigned participants at random, which makes it an experiment.';
      if(key === 'correlational' && m === 'experiment') return 'Nothing was manipulated and no one was assigned to a condition: the researchers measured ' + ctx.x.name + ' and ' + ctx.y.name + ' as they were. That is a correlational study.';
      if(key === 'correlational' && m === 'survey') return 'A questionnaire was one tool, but the study\'s design measures two variables and relates them with r. Name the method, not the tool: a correlational study.';
      if(key === 'correlational') return METHODS[m] + ' does not fit: the researchers measured two variables in each person and computed r, the design of a correlational study.';
      if(key === 'naturalistic' && m === 'experiment') return 'Comparing two groups is not enough for an experiment. No one was assigned to a group and nothing was manipulated: the researchers watched behavior where it happens.';
      if(key === 'naturalistic') return METHODS[m] + ' does not fit: the researchers watched and recorded behavior in its natural setting without stepping in.';
      return METHODS[m] + ' does not fit this design.';
    };
    // The method most often confused with this one, a hybrid half the time,
    // then others: three distractors in all.
    var near = key === 'experiment' ? 'correlational' : key === 'correlational' ? 'experiment' : 'experiment';
    var ds = [near].concat(r() < 0.5 ? ['hybrid'] : []);
    M.shuffle(r, pool).forEach(function(m){ if(ds.length < 3 && ds.indexOf(m) < 0) ds.push(m); });
    var opts = [opt(METHODS[key], 'Right. ' + ctx.methodWhy, true)].concat(ds.map(function(m){ return opt(METHODS[m], why(m)); }));
    return choice(r, 'method', '<b>Part A.</b> Identify the research method used in the study.', opts, '2.A', 'Read the Method: how did people end up in each condition?');
  }
  function stepWhat(r, ctx){
    var dv = ctx.dv;
    var opts = [
      opt(cap(dv.what), 'Right: this is what the researchers counted or scored for ' + dv.name + '.', true),
      opt(cap(dv.vague), 'That describes ' + dv.name + ' in general. An operational definition says how this study measured it: what was counted or scored.'),
      opt(cap(ctx.ivWhat), ctx.method === 'experiment' ? 'That is the independent variable, the one the researchers manipulated. Part B asks how the outcome, ' + dv.name + ', was measured.' : 'That is how the other variable, ' + ctx.iv + ', was measured. This part asks about ' + dv.name + '.'),
      opt(cap(dv.near), 'The summary never measured this. Use the measure the Method describes.')
    ];
    return choice(r, 'what', '<b>Part B.</b> Build the operational definition of ' + dv.name + '. First: what did the researchers count or score?', opts, '2.B', 'The Method names the measure.');
  }
  function stepHow(r, ctx){
    var dv = ctx.dv;
    var opts = [
      opt(cap(dv.how), 'Right: the scale and the timing make the definition measurable and repeatable.', true),
      opt(cap(dv.howNear), 'Check the Method again: it says ' + dv.how + '.'),
      opt('Using a rating scale', 'Naming a scale without saying what was rated, on what range, or when does not make the variable measurable. The readers refuse "a Likert scale" alone.'),
      opt('At some point during the study', 'Too vague: an operational definition says when the measure was taken, so another researcher could repeat it.')
    ];
    return choice(r, 'how', 'Now finish it: how or when was it measured?', opts, '2.B', 'Look for the scale, the count and the moment of measurement.');
  }
  function stepDiff(ctx, st){
    var H = ctx.groups[st.hi].name, L = ctx.groups[st.lo].name, d = st.dec, step = Math.pow(10, -d);
    var mistakes = [
      { value: S().evaluate({ fn: 'add', args: [st.means[st.hi], st.means[st.lo]] }), why: 'You added the two means. The difference is the larger mean minus the smaller.' },
      { value: -st.diff, why: 'Subtract the smaller mean from the larger: here the difference is a positive number.' }
    ];
    if(ctx.groups.length > 2){
      var other = [0, 1, 2].filter(function(i){ return i !== st.hi && i !== st.lo; })[0];
      var wrong = S().evaluate({ fn: 'abs', args: [{ fn: 'sub', args: [st.means[other], st.means[st.lo]] }] });
      mistakes.push({ value: wrong, why: 'That compares ' + ctx.groups[other].name + ' with ' + L + '. The hypothesis compares ' + H + ' with ' + L + '.' });
    }
    return { kind: 'num', key: 'diff', label: 'By how much did the means of ' + H + ' and ' + L + ' differ (the larger minus the smaller)?', hint: 'Read both means in the Results. No calculator: subtract by hand.' + (d ? ' Give one decimal.' : ''),
      cell: M.cell(st.diff, 0, mistakes, step / 10), d: d, practice: '3.B', level: 'apply' };
  }
  function stepStat(r, ctx, st){
    var right = statRight(ctx, st), opts = [opt(right, 'Right: it names the groups, the direction and what the result shows' + (st.kind === 'r' ? ', without claiming cause.' : ', including what the significance means.'), true)];
    if(st.kind === 'r'){
      var rr = '<i>r</i> = ' + rtxt(st.r2), dirW = st.dir > 0 ? ctx.y.up : ctx.y.down, other = st.dir > 0 ? ctx.y.down : ctx.y.up;
      if(st.dir !== 0){
        opts.push(opt(rr + ' shows that ' + ctx.x.name + ' causes participants to ' + dirW + '.', 'A correlation cannot show cause: a third variable or the reverse direction could explain it. Say what r shows: how the two variables go together.'));
        opts.push(opt(rr + ' shows that participants who ' + ctx.x.more + ' tended to ' + other + '.', 'The direction is reversed. A ' + (st.dir > 0 ? 'positive' : 'negative') + ' r means the two rise ' + (st.dir > 0 ? 'together' : 'and fall in opposite directions') + '.'));
        opts.push(opt(rr + ' means ' + M.fixed(Math.abs(st.r2) * 100, 0) + '% of the participants ' + dirW.replace(/^tended to /, '') + '.', 'r is not a percent of people. It runs from −1 to 1 and gives the direction and strength of a relationship.'));
      } else {
        opts.push(opt(rr + ' shows a strong relationship between ' + ctx.x.name + ' and ' + ctx.y.name + '.', 'An r this close to 0 is little or no correlation. Strength is how far r is from 0.'));
        opts.push(opt(rr + ' shows that ' + ctx.x.name + ' has no effect on anything.', 'Too far: the study looked at ' + ctx.y.name + ' only, and a correlational study cannot test effects. Say what r shows for these two variables.'));
        opts.push(opt('The correlation coefficient is a number between −1 and 1.', 'That defines r in general. The point is for what r shows in this study.'));
      }
    } else {
      var H = ctx.groups[st.higher].name, otherI = st.higher === st.hi ? st.lo : st.hi, Lw = ctx.groups[otherI].name;
      var mH = fx(st.means[st.higher], st.dec), mL = fx(st.means[otherI], st.dec);
      opts.push(opt(cap(Lw) + ' ' + ctx.dv.more + ' on average (' + mL + ') than ' + H + ' (' + mH + ').', 'The direction is reversed: ' + H + ' had the higher mean. Read the Results again.'));
      opts.push(opt('The mean of ' + H + ' was ' + mH + ' and the mean of ' + Lw + ' was ' + mL + '.', 'This restates the numbers. Part C needs what they show: which group was higher, and whether the difference is likely due to chance.'));
      if(st.sig) opts.push(opt('Statistically significant means the difference is large and important.', 'Significance is not size. It means the difference is unlikely to be due to chance alone; and the answer must be about these groups.'));
      else opts.push(opt(cap(H) + ' ' + ctx.dv.more + ', so ' + ctx.groups[st.higher].short + ' made a real difference.', 'Not statistically significant means the difference could plausibly be due to chance, so it is not evidence of a real difference.'));
    }
    return choice(r, st.kind === 'r' ? 'rstat' : 'stat', '<b>Part C.</b> Explain what the result' + (st.kind === 'r' ? ' (<i>r</i>)' : '') + ' shows for these participants.', opts, st.kind === 'r' ? '3.A' : '3.C', st.kind === 'r' ? 'Sign gives the direction; distance from 0 gives the strength.' : 'Which group was higher, and was the difference statistically significant?');
  }
  function stepEthics(r, ctx){
    var e = ctx.ethics[Math.floor(r() * ctx.ethics.length)];
    var absent = pickN(r, ctx.ethicsAbsent, 2);
    var opts = [opt(GUIDE[e.g].name, 'Right: the Method describes it.', true)]
      .concat(absent.map(function(a){ return opt(GUIDE[a].name, 'The summary never mentions ' + low(GUIDE[a].name) + '. Part D asks for a guideline the summary describes.'); }))
      .concat([opt('Random assignment to groups', 'Random assignment is a design feature that controls for differences between groups. It is not an ethical guideline.')]);
    return { step: choice(r, 'ethics', '<b>Part D.</b> Identify an ethical guideline the summary says the researchers followed.', opts, '2.D', 'Read the end of the Method.'), e: e };
  }
  function stepEthicsHow(r, ctx, e){
    var others = ctx.ethics.filter(function(x){ return x.g !== e.g; });
    var opts = [opt(e.how, 'Right: that is how this study applied ' + low(GUIDE[e.g].name) + '.', true),
      opt(GUIDE[e.g].def, 'That is the general definition. Part D needs how these researchers applied it, from the summary.'),
      opt('They made sure the study was ethical and safe for everyone.', 'Too vague to score: describe the specific step the researchers took.')];
    if(others.length) opts.push(opt(others[0].how, 'True, but that is how they applied ' + low(GUIDE[others[0].g].name) + ', not ' + low(GUIDE[e.g].name) + '.'));
    else opts.push(opt('They randomly assigned participants to the conditions.', 'That is a design feature, not how an ethical guideline was applied.'));
    return choice(r, 'ehow', 'Describe how the researchers applied ' + low(GUIDE[e.g].name) + '.', opts, '2.D');
  }
  var VERDICT = { yes: 'Yes', no: 'No', partly: 'Partly' };
  function stepGeneral(r, ctx){
    var g = ctx.generalize[Math.floor(r() * ctx.generalize.length)], P = ctx.participants;
    var other = g.key === 'no' ? 'yes' : 'no';
    var opts = [opt(VERDICT[g.key] + ': ' + g.because, 'Right: it names the population and argues from who the participants were.', true),
      opt(VERDICT[other] + ': ' + g.because, 'The trait you cite points the other way. Match the verdict to the participants\' characteristics.'),
      opt(g.key === 'yes' ? 'No: only ' + P.n + ' people took part, too few to generalize.' : 'Yes: ' + P.n + ' participants is a large enough sample to generalize.', 'Sample size is not the point here. Generalizability is argued from participant characteristics (age, place, culture), not from how many took part.'),
      opt((g.key === 'no' ? 'Partly' : 'No') + ': ' + ctx.flaw, 'That is a design flaw, not a participant characteristic. Part E is about who was studied.')];
    return { step: choice(r, 'gen', '<b>Part E.</b> Could the results generalize to ' + g.pop + '? Support your answer with the participants\' characteristics.', opts, '2.A', 'Read the Participants: age, place, culture, recruitment.'), g: g };
  }
  function stepArgue(r, ctx, st){
    var right = argueRight(ctx, st), w = supportsWord(st);
    var wrongW = w === 'Supports' ? 'Does not support' : 'Supports';
    var opts = [opt(right, 'Right: it uses a specific, accurately read result and says whether it fits the hypothesis.', true),
      opt('It proves the hypothesis: the study shows that ' + ctx.hypothesis + '.', 'A study supports or refutes a hypothesis; it never proves it. Name the result and say whether it fits.'),
      opt(w + ': ' + low(ctx.concept) + ' predicts that ' + ctx.hypothesis + '.', 'This names a concept but cites no result from the study. Part F needs a specific result from the Results and what it means for the hypothesis.')];
    if(st.kind === 'r') opts.push(opt(wrongW + ': ' + (st.variant === 'support' ? 'r is not 1, so there is no relationship at all.' : 'any r at all shows the predicted effect.'), st.variant === 'support' ? 'r does not have to be 1. A clear ' + (st.dir > 0 ? 'positive' : 'negative') + ' r fits the predicted relationship.' : 'The size and sign of r matter: this r does not show the predicted relationship.'));
    else opts.push(opt(wrongW + ': ' + (st.variant === 'support' ? 'the difference of ' + fx(st.diff, st.dec) + ' is too small to matter.' : ctx.groups[st.hi].name + ' had a mean of ' + fx(st.means[st.hi], st.dec) + '.'), st.variant === 'support' ? 'The difference is statistically significant and in the predicted direction, so the result supports the hypothesis.' : 'One mean alone is not a comparison, and it misreads the result. Compare both groups and use the significance.'));
    return choice(r, 'argue', '<b>Part F.</b> Does the result support the hypothesis that ' + ctx.hypothesis + '? Use a specific result.', opts, '4.B', 'Pick the answer that cites a result AND says what it means for the hypothesis.');
  }

  function generate(r, ctx, type){
    type = type || 'full';
    if(TYPES.indexOf(type) < 0) throw new Error('articleStudio: unknown type ' + type);
    var variant = variantOf(r, ctx), st = study(ctx, variant, r), steps = [], solution = [], extra = {};
    var A = type === 'full' || type === 'design', C = type === 'full' || type === 'results', D = type === 'full' || type === 'ethics';
    if(A){
      steps.push(stepMethod(r, ctx));
      steps.push(stepWhat(r, ctx));
      steps.push(stepHow(r, ctx));
      solution.push('<b>A.</b> ' + METHODS[ctx.method] + '. ' + ctx.methodWhy);
      solution.push('<b>B.</b> ' + cap(ctx.dv.name) + ' was operationally defined as ' + ctx.dv.what + ' ' + ctx.dv.how + '.');
    }
    if(C){
      if(st.kind === 'means'){
        steps.push(stepDiff(ctx, st));
        var big = Math.max(st.means[st.hi], st.means[st.lo]), small = Math.min(st.means[st.hi], st.means[st.lo]);
        solution.push('The difference of the means: ' + fx(big, st.dec) + ' − ' + fx(small, st.dec) + ' = ' + fx(st.diff, st.dec) + '.');
      }
      steps.push(stepStat(r, ctx, st));
      solution.push('<b>C.</b> ' + statRight(ctx, st));
    }
    if(D){
      var de = stepEthics(r, ctx); steps.push(de.step); steps.push(stepEthicsHow(r, ctx, de.e));
      var ge = stepGeneral(r, ctx); steps.push(ge.step);
      extra.ethic = de.e.g; extra.pop = ge.g.pop;
      solution.push('<b>D.</b> ' + GUIDE[de.e.g].name + ': ' + de.e.how);
      solution.push('<b>E.</b> ' + VERDICT[ge.g.key] + ', for ' + ge.g.pop + ': ' + ge.g.because);
    }
    if(C){
      steps.push(stepArgue(r, ctx, st));
      solution.push('<b>F.</b> ' + argueRight(ctx, st));
    }
    var text = '<p><b>' + esc(ctx.title) + '.</b> Read the study, then answer ' + (type === 'full' ? 'each part as the AAQ asks' : 'the parts below') + '.</p>';
    return { type: type, ctx: ctx.id, topic: ctx.topic, text: text, steps: steps, solution: solution, study: st,
      given: { variant: variant, kind: st.kind, means: st.means, hi: st.hi, lo: st.lo, points: st.points, r: st.r, ethic: extra.ethic, pop: extra.pop } };
  }

  M.register('articleStudio', {
    TYPES: TYPES, TYPE_LABEL: TYPE_LABEL, PARTS: PARTS, METHODS: METHODS, GUIDE: GUIDE, VARIANTS: VARIANTS, VERDICT: VERDICT,
    variantOf: variantOf, study: study, summary: summary, parts: parts, statRight: statRight, argueRight: argueRight, supportsWord: supportsWord,
    rtxt: rtxt, generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
