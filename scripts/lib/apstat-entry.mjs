/* AP® Statistics search-entry pages and exam data (docs/apstat-architecture.md,
   "Exams and entry pages"), written by scripts/build-apstat.mjs:

     formula-sheet.html          "The reference sheet, explained": every
                                 formula on the sheet the exam provides (the
                                 2026 edition), in our own layout, with what
                                 it is, when to use it, where it is taught;
                                 how to read Tables A, B and C; what is not on
                                 the sheet. Free, indexable. No score
                                 calculator (spec decision 6).
     unit-tests/<unit>.html      a free sample of 12 questions per unit,
                                 readable without JavaScript, with a link
                                 into practice and the timed unit test
     assets/exams/forms.json     the two fixed practice exams, filtered to
                                 forms whose units are all published
     assets/exams/items.json     exam-only questions, served with the forms
     assets/justify.json         the justification trainer's prompts

   No path carries the token "ap" (spec decision 2). The helpers come from
   the generator (ctx) so the pages share its head, crumbs, footer and tail. */
import { loadExams, loadJustify, formUnits, FREE_JUSTIFY, JUSTIFY_SKILLS } from './apstat-exams.mjs';
import { renderMath, prepareBank, concludeSlots } from './apstat-build.mjs';

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

/* The formula page, "the reference sheet, explained" (docs/apstat-spec.md
   section 4). The exam provides a reference sheet (formulas and Tables A, B
   and C; the 2026 edition was read in full for Phase 0,
   docs/apstat-research/framework.md section 4). Each row is [formula (TeX),
   what it is, when you use it, 'Unit N', topic id, trainers?], in our own
   words and our own grouping; the trainers (tools/<slug>.html) are linked
   only when live. A test holds the list to the sheet
   (scripts/test/apstat-exams.test.mjs). */
const D = String.raw;
export const EQ = [
  { id: 'describe', h: 'I. Descriptive statistics', rows: [
    [D`\bar{x} = \frac{1}{n}\sum x_i = \frac{\sum x_i}{n}`, 'The sample mean: add the values and divide by how many there are.', 'The center of quantitative data, when the distribution is roughly symmetric with no outliers.', 'Unit 1', 'summary-statistics', ['data-explorer']],
    [D`s_x = \sqrt{\frac{1}{n - 1}\sum \left(x_i - \bar{x}\right)^2} = \sqrt{\frac{\sum \left(x_i - \bar{x}\right)^2}{n - 1}}`, 'The sample standard deviation: a typical distance of the values from their mean. Note $n - 1$, not $n$.', 'The spread of quantitative data, alongside the mean.', 'Unit 1', 'summary-statistics', ['data-explorer']],
    [D`\hat{y} = a + bx`, 'A regression line: $a$ is the intercept and $b$ the slope; $\hat{y}$ is a predicted value of the response.', 'Predicting the response from the explanatory variable, inside the range of the data.', 'Unit 5', 'linear-models', ['regression-lab']],
  ] },
  { id: 'probability', h: 'II. Probability and distributions', rows: [
    [D`P(A \cup B) = P(A) + P(B) - P(A \cap B)`, 'The addition rule: the probability that A or B (or both) happens.', 'Any "or" probability; subtract the overlap so it is not counted twice.', 'Unit 2', 'independence-unions', ['probability-trees']],
    [D`P(A \mid B) = \frac{P(A \cap B)}{P(B)}`, 'Conditional probability: the probability of A given that B happened.', 'A "given" probability, often from one row or column of a two-way table.', 'Unit 2', 'conditional-probability', ['probability-trees']],
    [D`\mu_X = E(X) = \sum x_i \cdot P(x_i)`, 'The mean (expected value) of a discrete random variable: each value weighted by its probability.', 'The long-run average value of a random variable.', 'Unit 2', 'random-variable-parameters'],
    [D`\sigma_X = \sqrt{\sum \left(x_i - \mu_X\right)^2 \cdot P(x_i)}`, 'The standard deviation of a discrete random variable.', 'How much the random variable typically varies from its mean.', 'Unit 2', 'random-variable-parameters'],
    [D`P(X = x) = \binom{n}{x} p^x (1 - p)^{n - x}`, 'The binomial probability of exactly $x$ successes in $n$ independent trials with success probability $p$, for $x = 0, 1, 2, \ldots, n$.', 'A count of successes in a binomial setting. Name the distribution and its $n$ and $p$ first.', 'Unit 2', 'binomial-distribution', ['distribution-areas']],
    [D`\mu_X = np, \quad \sigma_X = \sqrt{np(1 - p)}`, 'The mean and standard deviation of a binomial random variable.', 'The center and spread of a binomial count, without listing the whole distribution.', 'Unit 2', 'binomial-distribution', ['distribution-areas']],
  ] },
  { id: 'inference', h: 'III. Sampling distributions and inferential statistics', rows: [
    [D`\text{standardized test statistic} = \frac{\text{statistic} - \text{parameter}}{\text{standard error of the statistic}}`, 'The shape of every z and t test statistic in the course. In a test, the parameter is its null value.', 'Any significance test: write the general form, then substitute.', 'Unit 3', 'test-one-proportion', ['p-value-explorer']],
    [D`\text{statistic} \pm (\text{critical value})(\text{standard error of the statistic})`, 'The shape of every confidence interval in the course. The product is the margin of error.', 'Any confidence interval: name the procedure, then substitute.', 'Unit 3', 'ci-one-proportion', ['ci-capture']],
    [D`\chi^2 = \sum \frac{(\text{observed} - \text{expected})^2}{\text{expected}}`, 'The chi-square statistic, summed over every cell of a two-way table.', 'Tests for homogeneity or independence. Expected count = row total times column total over the table total.', 'Unit 3', 'chi-square-test', ['chi-square-lab']],
  ] },
  { id: 'proportions', h: 'III (continued). Sampling distributions for proportions', rows: [
    [D`\mu_{\hat{p}} = p, \quad \sigma_{\hat{p}} = \sqrt{\frac{p(1 - p)}{n}}`, 'The center and spread of the sampling distribution of a sample proportion.', 'Probabilities about $\hat{p}$ when $p$ is known, and in a test, where $p$ is the null value $p_0$.', 'Unit 3', 'sampling-dist-proportion', ['sampling-distributions']],
    [D`\text{SE}_{\hat{p}} = \sqrt{\frac{\hat{p}(1 - \hat{p})}{n}}`, 'The standard error: the same formula with $\hat{p}$ in place of the unknown $p$.', 'A one-proportion confidence interval (a test uses $p_0$ instead).', 'Unit 3', 'ci-one-proportion', ['ci-capture']],
    [D`\mu_{\hat{p}_1 - \hat{p}_2} = p_1 - p_2, \quad \sigma_{\hat{p}_1 - \hat{p}_2} = \sqrt{\frac{p_1(1 - p_1)}{n_1} + \frac{p_2(1 - p_2)}{n_2}}`, 'The center and spread of the sampling distribution of the difference of two independent sample proportions.', 'Probabilities about a difference of sample proportions.', 'Unit 3', 'sampling-dist-two-proportions', ['sampling-distributions']],
    [D`\text{SE}_{\hat{p}_1 - \hat{p}_2} = \sqrt{\frac{\hat{p}_1(1 - \hat{p}_1)}{n_1} + \frac{\hat{p}_2(1 - \hat{p}_2)}{n_2}}`, 'The standard error of a difference of sample proportions.', 'A two-proportion confidence interval.', 'Unit 3', 'ci-two-proportions', ['ci-capture']],
    [D`\text{SE} = \sqrt{p_c(1 - p_c)\left(\frac{1}{n_1} + \frac{1}{n_2}\right)}, \quad p_c = \frac{n_1\hat{p}_1 + n_2\hat{p}_2}{n_1 + n_2}`, 'The standard error when $p_1 = p_2$ is assumed, with $p_c$ the combined proportion of successes in both samples.', 'A two-proportion test, where the null hypothesis says $p_1 = p_2$.', 'Unit 3', 'test-two-proportions-setup', ['p-value-explorer']],
  ] },
  { id: 'means', h: 'III (continued). Sampling distributions for means', rows: [
    [D`\mu_{\bar{x}} = \mu, \quad \sigma_{\bar{x}} = \frac{\sigma}{\sqrt{n}}`, 'The center and spread of the sampling distribution of a sample mean.', 'Probabilities about $\bar{x}$ when $\mu$ and $\sigma$ are known.', 'Unit 4', 'sampling-dist-mean', ['sampling-distributions']],
    [D`\text{SE}_{\bar{x}} = \frac{s}{\sqrt{n}}`, 'The standard error of a sample mean, with $s$ in place of the unknown $\sigma$.', 'One-sample and paired t intervals and tests (for paired data, $s$ is the SD of the differences).', 'Unit 4', 'ci-one-mean'],
    [D`\mu_{\bar{x}_1 - \bar{x}_2} = \mu_1 - \mu_2, \quad \sigma_{\bar{x}_1 - \bar{x}_2} = \sqrt{\frac{\sigma_1^2}{n_1} + \frac{\sigma_2^2}{n_2}}`, 'The center and spread of the sampling distribution of the difference of two independent sample means.', 'Probabilities about a difference of sample means.', 'Unit 4', 'sampling-dist-two-means', ['sampling-distributions']],
    [D`\text{SE}_{\bar{x}_1 - \bar{x}_2} = \sqrt{\frac{s_1^2}{n_1} + \frac{s_2^2}{n_2}}`, 'The standard error of a difference of sample means. It is never pooled.', 'Two-sample t intervals and tests.', 'Unit 4', 'ci-two-means'],
  ] },
];
// Not on the sheet: students must know these (framework.md section 4; reader-report errors in section 6).
export const NOT_ON = [
  ['$z = \\frac{x - \\mu}{\\sigma}$', 'A z-score: how many standard deviations a value is from the mean.', 'comparing-distributions'],
  ['$1.5 \\times \\text{IQR}$', 'The outlier rule: a value more than $1.5 \\times \\text{IQR}$ below $Q_1$ or above $Q_3$ is an outlier.', 'summary-statistics'],
  ['The empirical rule', 'In a normal distribution, about 68%, 95% and 99.7% of values fall within 1, 2 and 3 standard deviations of the mean.', 'normal-distribution'],
  ['Conditions', 'Random sample or random assignment; the 10% condition when sampling without replacement; large counts (at least 10 successes and 10 failures) for proportions; a normal population or a large sample for means; expected counts at least 5 for chi-square.', 'sampling-dist-proportion'],
  ['Degrees of freedom', '$n - 1$ for one-sample and paired t; technology df (or the smaller $n - 1$) for two-sample t; $(\\text{rows} - 1)(\\text{columns} - 1)$ for chi-square.', 'chi-square-test'],
  ['Slope and correlation', 'The 2026 sheet gives only $\\hat{y} = a + bx$: read $a$, $b$, $r$, $r^2$ and $s$ from computer output, and interpret each in context.', 'least-squares-regression'],
];
// How to read the three tables on the sheet (our own generated tables are in the trainers).
export const TABLES = [
  ['Table A: standard normal probabilities', 'The area to the left of $z$, for $z$ from $-3.4$ to $3.4$ in steps of 0.01. Round $z$ to two decimal places, find the row for the first decimal and the column for the second. For an area to the right, subtract from 1.'],
  ['Table B: t critical values', 'One row per degrees of freedom (1 to 30, then 40, 50, 60, 80, 100, 1000 and infinity); columns are upper-tail probabilities from 0.25 to 0.0005, with confidence levels from 50% to 99.9% along the bottom. When your df is not a row, use the next lower row. A t statistic between two columns gives a range for the p-value.'],
  ['Table C: chi-square critical values', 'One row per degrees of freedom (1 to 30, then 40, 50, 60, 80 and 100); columns are the same upper-tail probabilities as Table B, from 0.25 to 0.0005. A statistic between two columns gives a range for the p-value, such as "between 0.025 and 0.05".'],
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
    return live.length ? `<span class="stat-eq-tools"><span class="stat-small">Practice it:</span> ${live.map(t => `<a href="tools/${t.slug}.html">${esc(t.name)}</a>`).join(', ')}</span>` : '';
  };
  // The first unit with a practice test, or none yet (no link to a page that is not built).
  const firstTest = units.find(built);
  const testLink = (depth, label) => firstTest ? `<a href="${depth}unit-tests/${firstTest.id}.html">${label}</a>` : '';

  /* ------------------------------------------------------- formula sheet */
  {
    const depth = '', path = 'formula-sheet.html', url = `${SITE}${BASE}${path}`;
    const title = courseTitle('The Statistics Reference Sheet, Explained', [LABEL]);
    const desc = 'Every formula on the statistics exam reference sheet in plain words: what it means, when to use it, how to read the tables, and what is not on it.';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#sheet`, name: 'The statistics reference sheet, explained', url, description: desc, learningResourceType: 'Reference', isAccessibleForFree: true, educationalLevel: 'High school', inLanguage: 'en', isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'The reference sheet, explained', url }])),
    ] };
    const R = x => renderMath(x);
    const sections = EQ.map(s => `<section class="xsection stat-eq-sec" aria-labelledby="eq-${s.id}"><h2 id="eq-${s.id}">${esc(s.h)}</h2>
    <div class="table-wrap" tabindex="0" role="region" aria-label="${esc(s.h)}: formulas"><table class="stat-eq"><thead><tr><th scope="col">Formula</th><th scope="col">What it is</th><th scope="col">When you use it</th><th scope="col">Learn it in</th></tr></thead><tbody>${s.rows.map(r => `<tr><th scope="row"><span class="stat-eq-f">${R(`$${r[0]}$`)}</span></th><td>${R(r[1])}</td><td>${R(r[2])}</td><td>${esc(r[3])}<br>${topicLink(r[4], depth)}${trainers(r[5])}</td></tr>`).join('')}</tbody></table></div></section>`).join('\n  ');
    const body = `
${bodyOpen(' data-app="formula-sheet"')}
<main id="main" class="xshell stat-app stat-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'The reference sheet, explained' }])}
  <header class="hero stat-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>The reference sheet, explained</h1>
  <p class="lede">The exam gives you a reference sheet: the formulas below and three tables. Knowing what each formula means, and when to use it, is what earns the points. Written in our own words and layout.</p></header>
  <section class="xsection stat-eq-tips" aria-labelledby="eq-tips"><h2 id="eq-tips">Three habits that save points</h2>
    <ul class="stat-links">
      <li><b>Show the expression, then the numbers, then the answer.</b> Write the formula's structure, substitute the values, then give the result. A calculator result alone is not work.</li>
      <li><b>Name the distribution or the procedure.</b> "X is binomial with $n = 10$ and $p = 0.3$", "a one-sample z test for a proportion", with the boundary and the direction.</li>
      <li><b>Table or technology, both count.</b> A p-value from Table B written as a range and the same p-value from a calculator are both right; keep full precision until the end.</li>
    </ul>
  </section>
  ${EQ.length ? sections : '<p class="stat-small">The formula-by-formula guide arrives with the first published unit.</p>'}
  <section class="xsection" aria-labelledby="eq-tables"><h2 id="eq-tables">Reading the tables</h2>
    <ul class="stat-eq-not">${TABLES.map(r => `<li><b>${esc(r[0])}.</b> ${R(r[1])}</li>`).join('')}</ul>
  </section>
  ${NOT_ON.length ? `<section class="xsection" aria-labelledby="eq-not"><h2 id="eq-not">Not on the sheet: know these</h2>
    <ul class="stat-eq-not">${NOT_ON.map(r => `<li><b>${R(r[0])}.</b> ${R(r[1])} <span class="stat-small">${topicLink(r[2], depth)}</span></li>`).join('')}</ul>
  </section>` : ''}
  <section class="xsection" aria-labelledby="eq-next"><h2 id="eq-next">Practice with it</h2>
    <p>${[testLink('', 'Free unit practice tests'), `<a href="learn.html">Free notes for every topic</a>`, `<a href="exams.html">Full practice exams</a>`].filter(Boolean).join(' &middot; ')}</p>
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
      return s ? `<div class="stat-set">${stimulusPanel(g.stimulus, s, s.html.replace(/(src|href)="figures\//g, `$1="${depth}figures/`))}${items}</div>` : items;
    }).join('');
    const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
    const pageData = { topic: null, unit: ch.id, free: true, sample: true, prereq: [], check: qs, stimuli };
    const others = units.filter(built).map(u => u.id === ch.id ? `<b>Unit ${u.n}</b>` : `<a href="${u.id}.html">Unit ${u.n}</a>`).join(' &middot; ');
    const body = `
${bodyOpen(` data-unit="${ch.id}" data-app="unit-test"`)}
<main id="main" class="xshell stat-app stat-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../units/${ch.id}.html` }, { name: `Unit ${ch.n} practice test` }])}
  <header class="hero stat-hero"><div class="eyebrow">Unit ${ch.n} &middot; ${ch.weight[0]}&ndash;${ch.weight[1]}% of the exam ${BETA_PILL}</div><h1>Unit ${ch.n} practice test: ${esc(ch.title)}</h1>
  <p class="lede">${qs.length} exam-style questions from the unit, free, with an explanation for every option. Most have four answer choices, as on the real exam, and a few ask you to type a value, an interval or the setup; sets share one data set, plot or table.</p>
  <p class="stat-small stat-nav-ref">Covers: ${topics.map(t => esc(t.title)).join('; ')}.</p></header>
  <div class="stat-qs" data-set="check">${html}</div>
  <section class="xsection stat-nav-ref" aria-labelledby="ut-more"><h2 id="ut-more">Keep going</h2>
    <div class="stat-cards-row"><a class="btn-press" href="../practice.html?unit=${ch.id}">Practice the whole unit</a><a class="btn-outline" href="../exams.html?unit=${ch.id}">Take a timed unit test</a><a class="btn-outline" href="../unit-sheets/${ch.id}.html">Print the unit sheet</a></div>
    <p class="stat-small">Practice has every question in the unit, with feedback after each one; ${isFreeTopic(map, topics[0]) ? 'this unit\'s lessons are free.' : 'the notes for every topic are free.'} Other units: ${others}.</p>
  </section>
</main>
${footer(depth, `unit-test:${ch.id}`)}
<link rel="stylesheet" href="../assets/pages/pages.css">
<link rel="stylesheet" href="../assets/pages/entry.css">
<script type="application/json" id="stat-page-data">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
${tail({ depth, section: 'exams', extra: ['stat-questions.js', 'pages/sample.js'] })}
</body>
</html>
`;
    out[path] = head({ title, desc, path, depth, ogType: 'article', jsonld, noindex }) + body;
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

  /* ---------------------------------------------------- justification data */
  const prompts = loadJustify(C.data, map).filter(p => C.published.has(p.unit));
  /* The conclusion builder for a prompt whose answer has components: the
     slots in order (a test's decision slot generated from p and alpha, first),
     option text raw (shown as plain text in a select, ApStatTex.plain), each
     why rendered as math. */
  const builder = Cn => {
    const sl = concludeSlots(Cn), order = [...(sl.decision ? ['decision'] : []), ...Object.keys(sl).filter(k => k !== 'decision')];
    return { mode: Cn.mode, slots: Object.fromEntries(order.map(k => [k, { options: sl[k].options, correct: sl[k].correct, why: renderMath(sl[k].why || {}) }])) };
  };
  out['assets/justify.json'] = JSON.stringify({
    skills: JUSTIFY_SKILLS,
    // "answer" is a raw key for questions (never TeX), so the model answers are rendered on their own.
    prompts: prompts.map((raw, i) => { const p = renderMath(raw), R1 = s => renderMath([s])[0]; return { id: p.id, unit: p.unit, topic: p.topic, practice: p.practice, skill: p.skill, title: p.title, context: p.context || '', prompt: p.prompt, checklist: p.checklist, earns: { answer: R1(raw.earns.answer), why: p.earns.why }, misses: { answer: R1(raw.misses.answer), why: p.misses.why }, ...(raw.conclude ? { conclude: builder(raw.conclude) } : {}), ...(i < FREE_JUSTIFY ? { free: true } : {}) }; }),
  });
  return { pages: out, sampleUnits: units.filter(built).map(u => u.id), forms: live.length, prompts: prompts.length };
}
