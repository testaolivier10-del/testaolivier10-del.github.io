/* AP® Psychology search-entry pages and exam data
   (docs/appsych-architecture.md, "Exams and entry pages"), written by
   scripts/build-appsych.mjs:

     formula-sheet.html          "Statistics you must know": the exam gives
                                 no formula sheet and allows no calculator
                                 (framework.md section 5), so every statistic
                                 it asks you to compute or read, in our own
                                 words, with when to use it, the classic trap
                                 and where it is taught. Free, indexable. No
                                 score calculator (spec decision 6).
     unit-tests/<unit>.html      a free sample of 12 questions per unit,
                                 readable without JavaScript, with a link
                                 into practice and the timed unit test
     assets/exams/forms.json     the two fixed practice exams, filtered to
                                 forms whose units are all published
     assets/exams/items.json     exam-only questions, served with the forms
     assets/justify.json         the "Make it specific" trainer's prompts

   No path carries the token "ap" (spec decision 2). The helpers come from
   the generator (ctx) so the pages share its head, crumbs, footer and tail. */
import { loadExams, loadJustify, formUnits, FREE_JUSTIFY, JUSTIFY_SKILLS } from './appsych-exams.mjs';
import { renderMath, prepareBank, specificSlots } from './appsych-build.mjs';
import { Stats } from './appsych-mathlib.mjs';
import { r3Inner } from './r3-inner.mjs';

export const SAMPLE_SIZE = 12;

/* The unit test sample: the same choice every build, so the page is
   stable for search. Whole stimulus sets of single-answer items first (at
   most two, from different topics), then standalone items spread over the
   unit's topics, skipping lesson check items (they are already on the free
   lessons) where enough others exist. */
export function unitSample(ch, ctx) {
  const { map, C } = ctx;
  const checks = new Set(Object.values(C.lessons).flatMap(L => L.check || []));
  const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
  const sets = [], singles = [];
  for (const t of topics) {
    const items = C.questions[t.id].items;
    const by = new Map();
    for (const q of items) {
      if (q.stimulus) { if (!by.has(q.stimulus)) by.set(q.stimulus, []); by.get(q.stimulus).push(q); }
      else if (q.type === 'single' || q.type === 'numeric') singles.push(q);
    }
    for (const [sid, qs] of by) {
      const ok = qs.filter(q => q.type === 'single' && !/previous (question|set|calculation)/.test(q.q));
      if (ok.length >= 3 && ok.length === qs.filter(q => q.type === 'single').length) sets.push({ sid, topic: t.id, items: ok.slice(0, 4), checks: ok.filter(q => checks.has(q.id)).length });
    }
  }
  sets.sort((a, b) => a.checks - b.checks || a.sid.localeCompare(b.sid));
  const out = [], usedT = new Set();
  for (const s of sets) { if (out.length >= 8 || usedT.has(s.topic)) continue; if (out.length + s.items.length > 8) continue; out.push(...s.items); usedT.add(s.topic); }
  const pool = singles.filter(q => !checks.has(q.id) && q.level !== 'recall' && !/previous/.test(q.q));
  const byTopic = new Map(); for (const q of pool) { if (!byTopic.has(q.topic)) byTopic.set(q.topic, []); byTopic.get(q.topic).push(q); }
  for (let round = 0; out.length < SAMPLE_SIZE && round < 6; round++) {
    for (const t of topics) {
      if (out.length >= SAMPLE_SIZE) break;
      if (round === 0 && usedT.has(t.id)) continue;
      const q = (byTopic.get(t.id) || [])[round - (usedT.has(t.id) ? 1 : 0)];
      if (q && !out.includes(q)) out.push(q);
    }
  }
  return out;
}

/* The statistics page, "Statistics you must know" (formula-sheet.html, the
   path every AP® course uses for its sheet). The exam gives no formula sheet
   and allows no calculator (framework.md section 5), and Practice 3 asks
   students to calculate and interpret central tendency, variation and
   percentile rank and to interpret significance and effect size. Each row is
   [formula (TeX), what it is, when you use it, the classic trap, 'Unit N' or
   'Research skills you need', topic id, trainers, recipe, worked], in our own
   words; the trainers (tools/<slug>.html) are linked only when live. The
   worked line is [setup TeX, ApPsychStats recipe, unit TeX, decimals]: the
   page prints "setup = answer unit" with the answer computed by ApPsychStats
   at build time, so no worked number is typed by hand, and every worked
   number is small enough to do by hand. Each row is also a card in the
   "Statistics" flashcard deck (assets/formulas.json). */
const D = String.raw;
const SK = 'Research skills you need';
export const EQ = [
  { id: 'center', h: 'Central tendency', rows: [
    [D`\bar{x} = \frac{\text{sum of the scores}}{n}`, 'The mean: the arithmetic average.', 'Describing a typical score when there are no extreme scores.', 'One extreme score (an outlier) pulls the mean toward it; the median does not move much.', SK, 'stats-descriptive', ['stats-lab'], 'mean',
      [D`\frac{4 + 6 + 7 + 7 + 11}{5}`, { fn: 'mean', args: [[4, 6, 7, 7, 11]] }, '', 0]],
    [D`\text{median} = \text{the middle score in order}`, 'The median: half the scores are below it, half above.', 'A typical score when the distribution is skewed (incomes, reaction times).', 'Put the scores in order first; with an even count, average the two middle scores.', SK, 'stats-descriptive', ['stats-lab'], 'median',
      [D`2, 3, \mathbf{5}, 8, 20`, { fn: 'median', args: [[2, 3, 5, 8, 20]] }, '', 0]],
    [D`\text{mode} = \text{the most frequent score}`, 'The mode: the score that occurs most often.', 'Categories (favorite color) or the peak of a distribution.', 'A distribution can have two modes (bimodal); the mode is a score, not how often it occurs.', SK, 'stats-descriptive', ['stats-lab'], 'mode',
      [D`3, 4, 4, 4, 6, 9`, { fn: 'mode', args: [[3, 4, 4, 4, 6, 9]] }, '', 0]],
  ] },
  { id: 'spread', h: 'Variation', rows: [
    [D`\text{range} = \text{highest} - \text{lowest}`, 'The range: the distance from the lowest score to the highest.', 'A quick sense of spread.', 'One outlier makes the range huge; it uses only two scores.', SK, 'stats-descriptive', ['stats-lab'], 'range',
      [D`20 - 2`, { fn: 'range', args: [[2, 3, 5, 8, 20]] }, '', 0]],
    [D`\text{SD} = \sqrt{\frac{\text{sum of }(x - \bar{x})^2}{n}}`, 'The standard deviation: the typical distance of scores from the mean.', 'Comparing how spread out two groups are; reading the normal curve.', 'A larger SD means more spread, not higher scores. The exam asks you to read and interpret it, not to compute it from a long list.', SK, 'stats-descriptive', ['stats-lab'], 'sd',
      [D`\sqrt{\frac{9 + 1 + 1 + 9}{4}}`, { fn: 'sd', args: [[2, 4, 6, 8]] }, '', 2]],
  ] },
  { id: 'normal', h: 'The normal curve and percentiles', rows: [
    [D`z = \frac{x - \bar{x}}{\text{SD}}`, 'A z score: how many standard deviations a score is from the mean.', 'Comparing scores from different tests, or placing a score on the normal curve.', 'Below the mean, z is negative. Subtract the mean first, then divide by the SD.', SK, 'stats-normal', ['stats-lab'], 'z',
      [D`\frac{130 - 100}{15}`, { fn: 'z', args: [130, 100, 15] }, '', 0]],
    [D`68\% \text{ within } 1\text{ SD},\; 95\% \text{ within } 2,\; 99.7\% \text{ within } 3`, 'The 68-95-99.7 rule for a normal distribution.', 'The share of people between two scores, or above or below one.', 'Half of 68% (34%) lies on each side of the mean; the bands are 34, 13.5, 2.35 and 0.15 percent.', SK, 'stats-normal', ['stats-lab'], 'rulePct',
      [D`34 + 34 + 13.5 + 13.5`, { fn: 'rulePct', args: [-2, 2] }, D`\%`, 0]],
    [D`\text{percentile rank} = \text{percent of scores below}`, 'A percentile rank: the percent of a group who scored lower.', 'Interpreting a score: the 84th percentile beats 84% of the group.', 'A percentile is not a percent correct. One SD above the mean is about the 84th percentile (50 + 34).', SK, 'stats-normal', ['stats-lab'], 'percentileRule',
      [D`50 + 34`, { fn: 'percentileRule', args: [1] }, '', 0]],
  ] },
  { id: 'relations', h: 'Correlation and inference', rows: [
    [D`-1 \le r \le +1`, 'The correlation coefficient r: the direction (sign) and strength (closeness to 1 or -1) of a straight-line relationship.', 'Describing a scatterplot or a correlational study.', 'Correlation is not causation: a third variable may explain both. A negative r is as strong as a positive one of the same size.', SK, 'stats-correlation', ['stats-lab'], 'r',
      [D`r \text{ for } (1,2),(2,4),(3,6)`, { fn: 'r', args: [[[1, 2], [2, 4], [3, 6]]] }, '', 0]],
    [D`p < .05`, 'Statistical significance: a difference this large would rarely happen by chance alone if the variables were unrelated.', 'Reading an experiment\'s results: is the difference between groups likely real?', 'Significant does not mean large or important; effect size says how big the difference is.', SK, 'stats-significance', ['stats-lab', 'article-studio'], 'sub',
      [D`\text{mean}_1 - \text{mean}_2 = 14 - 9`, { fn: 'sub', args: [14, 9] }, D`\text{points}`, 0]],
  ] },
];
/* A worked line as TeX: "setup = answer unit", the answer from ApPsychStats
   (to the row's decimals, thousands as {,}). */
export function workedValue(w) { return Stats.evaluate(w[1]); }
export function workedTex(w) {
  const v = workedValue(w), d = Math.max(0, w[3] || 0);
  const num = Number(v.toFixed(d)).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/,/g, '{,}');
  return `${w[0]} = ${w[4] || ''}${num}${w[2] ? `\\,${w[2]}` : ''}`;
}
/* The "Statistics" flashcard deck (assets/formulas.json, read by
   pages/flashcards.js): one card per row, front "what it is" and the cue,
   back the formula, its worked line and the trap; card id eq:<recipe>. */
export function formulaCards() {
  return EQ.flatMap(s => s.rows.map(r => ({ id: `eq:${r[7]}`, group: s.h, topic: r[5], front: renderMath([r[1]])[0], cue: renderMath([r[2]])[0],
    formula: renderMath([`$${r[0]}$`])[0], worked: renderMath([`$${workedTex(r[8])}$`])[0], trap: renderMath([r[3]])[0] })));
}

// Not formulas, but ideas the exam expects you to read off a study.
export const NOT_ON = [
  ['Skew', 'In a positively skewed distribution (a long tail to the right) the mean is pulled above the median; in a negatively skewed one, below it.', 'stats-descriptive'],
  ['Scatterplots', 'Points rising left to right show a positive correlation; falling, a negative one; a round cloud, little or none.', 'stats-correlation'],
  ['Effect size', 'How large a difference or relationship is, separate from whether it is statistically significant. A big sample can make a tiny effect significant.', 'stats-significance'],
  ['Read the graph first', 'On the article analysis question, the statistic part asks what a difference between groups means for these participants. Name the groups, the direction and what it shows.', 'stats-significance'],
];
// Exam-day facts (framework.md section 5).
export const TABLES = [
  ['No calculator', 'The AP® Psychology exam allows no calculator. Every number it asks for (a mean, a median, a range, a share under the normal curve) can be worked out by hand.'],
  ['No formula sheet', 'Nothing on this page is printed in Bluebook: know what each statistic means and how to read it from a table or graph.'],
];

export function entryPages(ctx) {
  const { map, C, put, head, tail, footer, crumbNav, crumbs, orgCrumbs, esc, text, SITE, BASE, COURSE_ID, COURSE_NAME, COURSE_HTML, BETA_PILL, LABEL, courseTitle, clampDesc, noindex, bodyOpen, questionHtml, questionForPage, groupSets, stimulusPanel, stimulusBody, isFreeTopic, frqs, liveTools } = ctx;
  const units = map.chapters.filter(c => c.part === 'course');
  const built = ch => map.topics.some(t => t.chapter === ch.id && C.built.has(t.id));
  const topicLink = (id, depth) => C.built.has(id) ? `<a href="${depth}notes/${id}.html">${esc(map.topicById(id).title)}</a>` : esc((map.topicById(id) || {}).title || id);
  const out = {};
  // Live trainers that practice an equation (EQ rows' sixth field), as links.
  const trainers = slugs => {
    const live = (slugs || []).map(sl => (liveTools || []).find(t => t.slug === sl)).filter(Boolean);
    return live.length ? `<span class="psy-eq-tools"><span class="psy-small">Practice it:</span> ${live.map(t => `<a href="tools/${t.slug}.html">${esc(t.name)}</a>`).join(', ')}</span>` : '';
  };
  // The first unit with a practice test, or none yet (no link to a page that is not built).
  const firstTest = units.find(built);
  const testLink = (depth, label) => firstTest ? `<a href="${depth}unit-tests/${firstTest.id}.html">${label}</a>` : '';

  /* ------------------------------------------------------- formula sheet */
  {
    const depth = '', path = 'formula-sheet.html', url = `${SITE}${BASE}${path}`;
    const title = courseTitle('Psychology Statistics You Must Know', [LABEL]);
    const desc = 'Every statistic the psychology exam asks you to compute by hand or read from a study: what it means, when to use it and the classic trap.';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#sheet`, name: 'Statistics you must know', url, description: desc, learningResourceType: 'Reference', isAccessibleForFree: true, educationalLevel: 'High school', inLanguage: 'en', isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'Statistics you must know', url }])),
    ] };
    const R = x => renderMath(x);
    const sections = EQ.map(s => `<section class="xsection psy-eq-sec" aria-labelledby="eq-${s.id}"><h2 id="eq-${s.id}">${esc(s.h)}</h2>
    <div class="table-wrap" tabindex="0" role="region" aria-label="${esc(s.h)}: formulas"><table class="psy-eq"><thead><tr><th scope="col">Formula and a worked line</th><th scope="col">What it is and when to use it</th><th scope="col">The trap</th><th scope="col">Learn it in</th></tr></thead><tbody>${s.rows.map(r => `<tr><th scope="row"><span class="psy-eq-f">${R(`$${r[0]}$`)}</span><span class="psy-eq-w"><span class="psy-small">Worked:</span> ${R(`$${workedTex(r[8])}$`)}</span></th><td>${R(r[1])} <span class="psy-small">${R(r[2])}</span></td><td>${R(r[3])}</td><td>${esc(r[4])}<br>${topicLink(r[5], depth)}${trainers(r[6])}</td></tr>`).join('')}</tbody></table></div></section>`).join('\n  ');
    const body = `
${bodyOpen(' data-app="formula-sheet"')}
<main id="main" class="xshell psy-app psy-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Statistics you must know' }])}
  <header class="hero psy-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>Statistics you must know</h1>
  <p class="lede">The exam gives you no formula sheet and no calculator. These are the statistics it asks you to work out by hand or read from a study, in our own words: what each means, when to use it, and the trap that costs points.</p></header>
  <section class="xsection psy-eq-tips" aria-labelledby="eq-tips"><h2 id="eq-tips">Three habits that save points</h2>
    <ul class="psy-links">
      <li><b>Interpret, do not define.</b> "The mean is the average" earns nothing; "the group that slept 8 hours recalled 5 more words on average" does.</li>
      <li><b>Name the direction.</b> Say which group was higher, or whether r is positive or negative, and what that means for these participants.</li>
      <li><b>Correlation is not causation.</b> Only an experiment with random assignment supports a cause-and-effect claim.</li>
    </ul>
  </section>
  ${sections}
  <section class="xsection" aria-labelledby="eq-not"><h2 id="eq-not">Ideas to read off a study</h2>
    <ul class="psy-eq-not">${NOT_ON.map(r => `<li><b>${R(r[0])}.</b> ${R(r[1])} <span class="psy-small">${topicLink(r[2], depth)}</span></li>`).join('')}</ul>
  </section>
  <section class="xsection" aria-labelledby="eq-tables"><h2 id="eq-tables">On exam day</h2>
    <ul class="psy-eq-not">${TABLES.map(r => `<li><b>${esc(r[0])}.</b> ${R(r[1])}</li>`).join('')}</ul>
  </section>
  <section class="xsection" aria-labelledby="eq-next"><h2 id="eq-next">Practice with it</h2>
    <p>${[testLink('', 'Free unit practice tests'), `<a href="flashcards.html?deck=formulas">Statistics flashcards</a>`, `<a href="flashcards.html?unit=skills-research">Research terms flashcards</a>`, `<a href="learn.html">Free notes for every topic</a>`, `<a href="exams.html">Full practice exams</a>`].filter(Boolean).join(' &middot; ')}</p>
  </section>
</main>
${footer(depth, 'page:formula-sheet')}
<link rel="stylesheet" href="assets/pages/pages.css">
<link rel="stylesheet" href="assets/pages/entry.css">
<link rel="stylesheet" href="../assets/course/tool-studio.css">
${tail({ depth, section: 'exams', extra: ['pages/calm-ref.js'], site: ['course/tool-studio.js'] })}
</body>
</html>
`;
    out[path] = head({ title, desc, path, depth, ogType: 'article', jsonld, noindex }) + body;
  }

  /* The "Statistics" flashcard deck: free, always served (the statistics page is). */
  out['assets/formulas.json'] = JSON.stringify(formulaCards());

  /* ---------------------------------------------------- unit practice tests */
  const stimFor = q => { const s = ((C.questions[q.topic] || {}).stimuli || {})[q.stimulus]; return s; };
  for (const ch of units.filter(built)) {
    const depth = '../', path = `unit-tests/${ch.id}.html`, url = `${SITE}${BASE}${path}`;
    const qs = unitSample(ch, ctx).map(questionForPage);
    const title = courseTitle(`Unit ${ch.n} Practice Test: ${ch.title}`, [LABEL]);
    const desc = clampDesc(`A free ${qs.length}-question practice test for Unit ${ch.n}, ${ch.title.toLowerCase()}, with the answer and an explanation for every option.`);
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Quiz', '@id': `${url}#quiz`, name: `Unit ${ch.n} practice test: ${ch.title}`, url, description: desc, isAccessibleForFree: true, educationalLevel: 'High school', inLanguage: 'en', about: ch.title, isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: ch.title, url: `${SITE}${BASE}units/${ch.id}.html` }, { name: `Unit ${ch.n} practice test`, url }])),
    ] };
    const stimuli = {};
    for (const q of qs) if (q.stimulus) { const s = stimFor(q); if (s) stimuli[q.stimulus] = { kind: s.kind, title: s.title, html: stimulusBody(C, s, '') }; }
    const html = groupSets(qs).map(g => {
      const items = g.items.map(q => questionHtml(q, qs.indexOf(q) + 1)).join('');
      const s = g.stimulus && stimuli[g.stimulus];
      return s ? `<div class="psy-set">${stimulusPanel(g.stimulus, s, s.html.replace(/(src|href)="figures\//g, `$1="${depth}figures/`))}${items}</div>` : items;
    }).join('');
    const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
    const pageData = { topic: null, unit: ch.id, free: true, sample: true, prereq: [], check: qs, stimuli };
    const others = units.filter(built).map(u => u.id === ch.id ? `<b>Unit ${u.n}</b>` : `<a href="${u.id}.html">Unit ${u.n}</a>`).join(' &middot; ');
    const body = `
${bodyOpen(` data-unit="${ch.id}" data-app="unit-test"`)}
<main id="main" class="xshell psy-app psy-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../units/${ch.id}.html` }, { name: `Unit ${ch.n} practice test` }])}
  <header class="hero psy-hero"><div class="eyebrow">Unit ${ch.n} &middot; ${ch.weight[0]}&ndash;${ch.weight[1]}% of the exam ${BETA_PILL}</div><h1>Unit ${ch.n} practice test: ${esc(ch.title)}</h1>
  <p class="lede">${qs.length} exam-style questions from the unit, free, with an explanation for every option. Most have four answer choices, as on the real exam, and a few ask for a number you can work out by hand; sets share one study summary, data table, graph or figure.</p>
  <p class="psy-small psy-nav-ref">Covers: ${topics.map(t => esc(t.title)).join('; ')}.</p></header>
  <div class="psy-qs" data-set="check">${html}</div>
  <section class="xsection psy-nav-ref" aria-labelledby="ut-more"><h2 id="ut-more">Keep going</h2>
    <div class="psy-cards-row"><a class="btn-press" href="../practice.html?unit=${ch.id}">Practice the whole unit</a><a class="btn-outline" href="../exams.html?unit=${ch.id}">Take a timed unit test</a><a class="btn-outline" href="../unit-sheets/${ch.id}.html">Print the unit sheet</a></div>
    <p class="psy-small">Practice has every question in the unit, with feedback after each one; ${isFreeTopic(map, topics[0]) ? 'this unit\'s lessons are free.' : 'the notes for every topic are free.'} Other units: ${others}.</p>
  </section>
</main>
${footer(depth, `unit-test:${ch.id}`)}
<link rel="stylesheet" href="../assets/pages/pages.css">
<link rel="stylesheet" href="../assets/pages/entry.css">
<script type="application/json" id="psy-page-data">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
${tail({ depth, section: 'exams', extra: ['psy-questions.js', 'pages/sample.js'] })}
</body>
</html>
`;
    out[path] = r3Inner(head({ title, desc, path, depth, ogType: 'article', jsonld, noindex }) + body, { key: 'appsych', slug: 'unit-test', up: '../../' });
  }

  /* ---------------------------------------------------------- exam data */
  const ex = loadExams(C.data);
  // Exam-only items and their stimuli get the same math rendering as the bank.
  ex.items = prepareBank(renderMath({ items: ex.items }), 'exams').items;
  ex.stimuli = renderMath(ex.stimuli);
  const bank = new Map(); for (const t of map.topics) for (const q of ((C.questions[t.id] || {}).items || [])) bank.set(q.id, q);
  const examItems = new Map(ex.items.map(q => [q.id, q]));
  const frqById = Object.fromEntries(frqs.map(f => [f.id, f]));
  const live = ex.forms.filter(f => formUnits(f, { bank, examItems, frqs: frqById }).every(u => C.published.has(u)) && (f.frq || []).every(id => frqById[id]));
  const usedOwn = new Set(live.flatMap(f => f.mcq.flat()).filter(id => examItems.has(id)));
  const ownStim = {};
  for (const id of usedOwn) { const s = examItems.get(id).stimulus; if (s && ex.stimuli[s]) ownStim[s] = { kind: ex.stimuli[s].kind, title: ex.stimuli[s].title, html: stimulusBody(C, ex.stimuli[s], '') }; }
  out['assets/exams/forms.json'] = JSON.stringify(live.map(f => ({ id: f.id, title: f.title, mcq: f.mcq, frq: f.frq })));
  out['assets/exams/items.json'] = JSON.stringify({ stimuli: ownStim, items: [...usedOwn].map(id => questionForPage(examItems.get(id))) });

  /* --------------------------------------------- "Make it specific" data */
  const prompts = loadJustify(C.data, map).filter(p => C.published.has(p.unit));
  /* The builder for a prompt whose answer has components: the slots in
     order, option text raw (shown as plain text in a select, ApPsychTex.plain),
     each why rendered as math. */
  const builder = S => {
    const sl = specificSlots(S);
    return { slots: Object.fromEntries(Object.keys(sl).map(k => [k, { label: sl[k].label, options: sl[k].options, correct: sl[k].correct, why: renderMath(sl[k].why || {}) }])) };
  };
  out['assets/justify.json'] = JSON.stringify({
    skills: JUSTIFY_SKILLS,
    // "answer" is a raw key for questions (never TeX), so the model answers are rendered on their own.
    prompts: prompts.map((raw, i) => { const p = renderMath(raw), R1 = s => renderMath([s])[0]; return { id: p.id, unit: p.unit, topic: p.topic, practice: p.practice, skill: p.skill, title: p.title, context: p.context || '', prompt: p.prompt, checklist: p.checklist, earns: { answer: R1(raw.earns.answer), why: p.earns.why }, misses: { answer: R1(raw.misses.answer), why: p.misses.why }, ...(raw.specific ? { specific: builder(raw.specific) } : {}), ...(i < FREE_JUSTIFY ? { free: true } : {}) }; }),
  });
  return { pages: out, sampleUnits: units.filter(built).map(u => u.id), forms: live.length, prompts: prompts.length };
}
