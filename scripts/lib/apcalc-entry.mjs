/* AP® Calculus AB search-entry pages and exam data (docs/apcalc-architecture.md,
   "Exams and entry pages"), written by scripts/build-apcalc.mjs:

     formula-sheet.html          the formulas and theorems to know (the exam
                                 gives no formula sheet): what each is for,
                                 when to use it, where it is taught; free,
                                 indexable
     score-calculator.html       composite estimate from Section I correct
                                 and Section II points (pages/score.js)
     unit-tests/<unit>.html      a free sample of 12 questions per unit,
                                 readable without JavaScript, with a link
                                 into practice and the timed unit test
     assets/exams/forms.json     the two fixed practice exams, filtered to
                                 forms whose units are all published
     assets/exams/items.json     exam-only questions, served with the forms
     assets/justify.json         the justification trainer's prompts

   No path carries the token "ap" (spec decision 2). The helpers come from
   the generator (ctx) so the pages share its head, crumbs, footer and tail. */
import { loadExams, loadJustify, formUnits, FREE_JUSTIFY, JUSTIFY_SKILLS } from './apcalc-exams.mjs';
import { renderMath, prepareBank } from './apcalc-build.mjs';

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

/* The formula page. The exam gives no formula sheet, so this is our own
   list of what to know, in our own words, grouped our way. Each row is
   [formula (TeX), what it is, when you use it, 'Unit N', topic id,
   trainers?]; the trainers (tools/<slug>.html) that practice it are linked
   only when live. Phase 3 writes the rows (docs/apcalc-spec.md, build plan);
   until then the page says the guide arrives with the first unit. */
export const EQ = [];
// Not given anywhere on the exam and easy to forget; Phase 3 fills it.
export const NOT_ON = [];

export function entryPages(ctx) {
  const { map, C, put, head, tail, footer, crumbNav, crumbs, orgCrumbs, esc, text, SITE, BASE, COURSE_ID, COURSE_NAME, COURSE_HTML, BETA_PILL, LABEL, courseTitle, clampDesc, noindex, bodyOpen, questionHtml, questionForPage, groupSets, stimulusPanel, stimulusBody, isFreeTopic, frqs, liveTools } = ctx;
  const units = map.chapters.filter(c => c.part === 'course');
  const built = ch => map.topics.some(t => t.chapter === ch.id && C.built.has(t.id));
  const topicLink = (id, depth) => C.built.has(id) ? `<a href="${depth}notes/${id}.html">${esc(map.topicById(id).title)}</a>` : esc((map.topicById(id) || {}).title || id);
  const out = {};
  // Live trainers that practice an equation (EQ rows' sixth field), as links.
  const trainers = slugs => {
    const live = (slugs || []).map(sl => (liveTools || []).find(t => t.slug === sl)).filter(Boolean);
    return live.length ? `<span class="calc-eq-tools"><span class="calc-small">Practice it:</span> ${live.map(t => `<a href="tools/${t.slug}.html">${esc(t.name)}</a>`).join(', ')}</span>` : '';
  };
  // The first unit with a practice test, or none yet (no link to a page that is not built).
  const firstTest = units.find(built);
  const testLink = (depth, label) => firstTest ? `<a href="${depth}unit-tests/${firstTest.id}.html">${label}</a>` : '';

  /* ------------------------------------------------------- formula sheet */
  {
    const depth = '', path = 'formula-sheet.html', url = `${SITE}${BASE}${path}`;
    const title = courseTitle('Calculus Formulas and Theorems to Know', [LABEL]);
    const desc = 'The calculus formulas and theorems to know by heart, since the exam gives no formula sheet: what each is for, when to use it and where it is taught.';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#sheet`, name: 'Calculus formulas and theorems to know', url, description: desc, learningResourceType: 'Reference', isAccessibleForFree: true, educationalLevel: 'High school', inLanguage: 'en', isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'Formulas to know', url }])),
    ] };
    const R = x => renderMath(x);
    const sections = EQ.map(s => `<section class="xsection calc-eq-sec" aria-labelledby="eq-${s.id}"><h2 id="eq-${s.id}">${esc(s.h)}</h2>
    <div class="table-wrap" tabindex="0" role="region" aria-label="${esc(s.h)}: formulas"><table class="calc-eq"><thead><tr><th scope="col">Formula</th><th scope="col">What it is</th><th scope="col">When you use it</th><th scope="col">Learn it in</th></tr></thead><tbody>${s.rows.map(r => `<tr><th scope="row"><span class="calc-eq-f">${R(`$${r[0]}$`)}</span></th><td>${R(r[1])}</td><td>${R(r[2])}</td><td>${esc(r[3])}<br>${topicLink(r[4], depth)}${trainers(r[5])}</td></tr>`).join('')}</tbody></table></div></section>`).join('\n  ');
    const body = `
${bodyOpen(' data-app="formula-sheet"')}
<main id="main" class="xshell calc-app calc-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Formulas to know' }])}
  <header class="hero calc-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>Formulas and theorems to know</h1>
  <p class="lede">The exam gives no formula sheet. These are the formulas and theorems to know by heart, what each is for and when to use it.</p></header>
  <section class="xsection calc-eq-tips" aria-labelledby="eq-tips"><h2 id="eq-tips">Three habits that save points</h2>
    <ul class="calc-links">
      <li><b>Name the theorem and check its conditions.</b> Before you use the Intermediate Value Theorem, the Mean Value Theorem or the Extreme Value Theorem, say why the function is continuous (and differentiable, for the Mean Value Theorem) on the interval.</li>
      <li><b>Three decimal places, setup first.</b> On a calculator question, write the integral, derivative or equation you solve, then give the answer correct to three decimal places. Keep full precision until the end.</li>
      <li><b>Radian mode.</b> Every angle in calculus is in radians.</li>
    </ul>
  </section>
  ${EQ.length ? sections : '<p class="calc-small">The formula-by-formula guide arrives with the first published unit.</p>'}
  ${NOT_ON.length ? `<section class="xsection" aria-labelledby="eq-not"><h2 id="eq-not">Easy to forget</h2>
    <ul class="calc-eq-not">${NOT_ON.map(r => `<li><b>${R(r[0])}.</b> ${R(r[1])} <span class="calc-small">${topicLink(r[2], depth)}</span></li>`).join('')}</ul>
  </section>` : ''}
  <section class="xsection" aria-labelledby="eq-next"><h2 id="eq-next">Practice with it</h2>
    <p>${[`<a href="score-calculator.html">Estimate your score</a>`, testLink('', 'Free unit practice tests'), `<a href="learn.html">Free notes for every topic</a>`, `<a href="exams.html">Full practice exams</a>`].filter(Boolean).join(' &middot; ')}</p>
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

  /* ----------------------------------------------------- score calculator */
  {
    const depth = '', path = 'score-calculator.html', url = `${SITE}${BASE}${path}`;
    const title = courseTitle('Calculus Score Calculator', [LABEL]);
    const desc = 'Estimate your calculus exam score from multiple-choice questions right and free-response points. The method and its limits are explained on the page.';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebApplication', '@id': `${url}#calc`, name: 'Calculus score calculator', url, description: desc, applicationCategory: 'EducationalApplication', operatingSystem: 'Any', isAccessibleForFree: true, isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'Score calculator', url }])),
    ] };
    const body = `
${bodyOpen(' data-app="score-calculator"')}
<main id="main" class="xshell calc-app calc-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Score calculator' }])}
  <header class="hero calc-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>Score calculator</h1>
  <p class="lede">Enter your multiple-choice and free-response results to get an estimated score from 1 to 5.</p></header>
  <div id="calc-calc" class="calc-app-mount"><noscript><p>The calculator needs JavaScript. The method below lets you work it out by hand.</p></noscript></div>
  <section class="xsection" aria-labelledby="sc-how"><h2 id="sc-how">How the estimate works</h2>
    <p>Use the questions you got right and the points on each free-response question from a practice exam, or from a released one you scored with its rubric.</p>
    <p>The exam has two sections worth half the score each: 42 multiple-choice questions (29 without a calculator, 13 with one), and 6 free-response questions worth 9 points each, 54 in all. So the calculator turns each section into a score out of 50 and adds them:</p>
    <p class="calc-sc-formula"><b>composite = 50 &times; (multiple-choice right &divide; 42) + 50 &times; (free-response points &divide; 54)</b></p>
    <p>A composite of 64 or more is shown as a 5, 48 or more as a 4, 37 or more as a 3, 27 or more as a 2, and anything lower as a 1. There is no penalty for a wrong multiple-choice answer, so a blank and a wrong answer count the same.</p>
    <p class="calc-ex-band-warn"><b>Not calibrated: these cut-offs are placeholders, not official.</b> The College Board sets the real cut-offs after each exam, from how that year's students did, and has published none for the current calculus exam. Ours will be fitted to the published score distributions before the course launches; until then, use the estimate only to see which section has the most room to grow.</p>
  </section>
  <section class="xsection" aria-labelledby="sc-next"><h2 id="sc-next">Raise your score</h2>
    <ul class="calc-links">
      <li><a href="exams.html">Full practice exams</a> in the real format, with this estimate at the end.</li>
      <li><a href="justify.html">The justification trainer</a> for the justification points free response is built on.</li>
      <li><a href="formula-sheet.html">The formulas and theorems to know</a>${firstTest ? `, and ${testLink('', 'free unit practice tests')}` : ''}.</li>
    </ul>
  </section>
</main>
${footer(depth, 'page:score-calculator')}
<link rel="stylesheet" href="assets/pages/pages.css">
<link rel="stylesheet" href="assets/pages/entry.css">
<link rel="stylesheet" href="../assets/course/tool-studio.css">
${tail({ depth, section: 'exams', extra: ['pages/score.js', 'pages/calm-ref.js'], site: ['course/tool-studio.js'] })}
</body>
</html>
`;
    out[path] = head({ title, desc, path, depth, ogType: 'website', jsonld, noindex }) + body;
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
      return s ? `<div class="calc-set">${stimulusPanel(g.stimulus, s, s.html.replace(/(src|href)="figures\//g, `$1="${depth}figures/`))}${items}</div>` : items;
    }).join('');
    const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
    const pageData = { topic: null, unit: ch.id, free: true, sample: true, prereq: [], check: qs, stimuli };
    const others = units.filter(built).map(u => u.id === ch.id ? `<b>Unit ${u.n}</b>` : `<a href="${u.id}.html">Unit ${u.n}</a>`).join(' &middot; ');
    const body = `
${bodyOpen(` data-unit="${ch.id}" data-app="unit-test"`)}
<main id="main" class="xshell calc-app calc-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../units/${ch.id}.html` }, { name: `Unit ${ch.n} practice test` }])}
  <header class="hero calc-hero"><div class="eyebrow">Unit ${ch.n} &middot; ${ch.weight[0]}&ndash;${ch.weight[1]}% of the exam ${BETA_PILL}</div><h1>Unit ${ch.n} practice test: ${esc(ch.title)}</h1>
  <p class="lede">${qs.length} exam-style questions from the unit, free, with an explanation for every option. Most have four answer choices, as on the real exam, and a few ask you to type a value or an expression; sets share one graph or table.</p>
  <p class="calc-small calc-nav-ref">Covers: ${topics.map(t => esc(t.title)).join('; ')}.</p></header>
  <div class="calc-qs" data-set="check">${html}</div>
  <section class="xsection calc-nav-ref" aria-labelledby="ut-more"><h2 id="ut-more">Keep going</h2>
    <div class="calc-cards-row"><a class="btn-press" href="../practice.html?unit=${ch.id}">Practice the whole unit</a><a class="btn-outline" href="../exams.html?unit=${ch.id}">Take a timed unit test</a><a class="btn-outline" href="../unit-sheets/${ch.id}.html">Print the unit sheet</a></div>
    <p class="calc-small">Practice has every question in the unit, with feedback after each one; ${isFreeTopic(map, topics[0]) ? 'this unit\'s lessons are free.' : 'the notes for every topic are free.'} Other units: ${others}.</p>
  </section>
</main>
${footer(depth, `unit-test:${ch.id}`)}
<link rel="stylesheet" href="../assets/pages/pages.css">
<link rel="stylesheet" href="../assets/pages/entry.css">
<script type="application/json" id="calc-page-data">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
${tail({ depth, section: 'exams', extra: ['calc-questions.js', 'pages/sample.js'] })}
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
  out['assets/justify.json'] = JSON.stringify({
    skills: JUSTIFY_SKILLS,
    prompts: renderMath(prompts).map((p, i) => ({ id: p.id, unit: p.unit, topic: p.topic, practice: p.practice, skill: p.skill, title: p.title, context: p.context || '', prompt: p.prompt, checklist: p.checklist, earns: p.earns, misses: p.misses, ...(i < FREE_JUSTIFY ? { free: true } : {}) })),
  });
  return { pages: out, sampleUnits: units.filter(built).map(u => u.id), forms: live.length, prompts: prompts.length };
}
