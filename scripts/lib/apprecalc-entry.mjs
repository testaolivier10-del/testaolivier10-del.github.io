/* AP® Precalculus search-entry pages and exam data (docs/apprecalc-architecture.md,
   "Exams and entry pages"), written by scripts/build-apprecalc.mjs:

     formula-sheet.html          the formulas and identities to know (the exam
                                 gives no formula sheet): what each is for,
                                 when to use it, where it is taught; free,
                                 indexable
     unit-tests/<unit>.html      a free sample of 12 questions per exam unit
                                 (none for Unit 4, beyond the exam),
                                 readable without JavaScript, with a link
                                 into practice and the timed unit test
     assets/exams/forms.json     the two fixed practice exams, filtered to
                                 forms whose units are all published
     assets/exams/items.json     exam-only questions, served with the forms
     assets/justify.json         the "Make it specific" trainer's prompts

   No score calculator and no readiness band (docs/apprecalc-spec.md section 1).

   No path carries the token "ap" (spec decision 2). The helpers come from
   the generator (ctx) so the pages share its head, crumbs, footer and tail. */
import { loadExams, loadJustify, formUnits, FREE_JUSTIFY, JUSTIFY_SKILLS } from './apprecalc-exams.mjs';
import { renderMath, prepareBank } from './apprecalc-build.mjs';
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

/* The formula page. The exam gives no formula sheet, so this is our own
   list of what to know, in our own words, grouped our way. Each row is
   [formula (TeX), what it is, when you use it, 'Unit N', topic id,
   trainers?]; the trainers (tools/<slug>.html) that practice it are linked
   only when live. Phase 3 writes the rows (spec section 5); until then the
   page shows its habits and says the guide arrives with the first unit.
   Groups planned: rates of change; polynomials and rational functions;
   transformations; exponentials and logarithms; the unit circle and
   sinusoids; identities; polar coordinates. Unit 4 rows, if any, say
   "beyond the exam". */
const D = String.raw;
void D;
export const EQ = [];
// Easy to forget, and each one costs points every year (framework.md section 7). Phase 3.
export const NOT_ON = [];

export function entryPages(ctx) {
  const { map, C, put, head, tail, footer, crumbNav, crumbs, orgCrumbs, esc, text, SITE, BASE, COURSE_ID, COURSE_NAME, COURSE_HTML, BETA_PILL, LABEL, courseTitle, clampDesc, noindex, bodyOpen, questionHtml, questionForPage, groupSets, stimulusPanel, stimulusBody, isFreeTopic, frqs, liveTools } = ctx;
  // Exam units only: Unit 4 (beyond the exam) gets no unit test (spec decision 7).
  const units = map.chapters.filter(c => c.part === 'course' && !c.beyondExam);
  const built = ch => map.topics.some(t => t.chapter === ch.id && C.built.has(t.id));
  const topicLink = (id, depth) => C.built.has(id) ? `<a href="${depth}notes/${id}.html">${esc(map.topicById(id).title)}</a>` : esc((map.topicById(id) || {}).title || id);
  const out = {};
  // Live trainers that practice an equation (EQ rows' sixth field), as links.
  const trainers = slugs => {
    const live = (slugs || []).map(sl => (liveTools || []).find(t => t.slug === sl)).filter(Boolean);
    return live.length ? `<span class="pcalc-eq-tools"><span class="pcalc-small">Practice it:</span> ${live.map(t => `<a href="tools/${t.slug}.html">${esc(t.name)}</a>`).join(', ')}</span>` : '';
  };
  // The first unit with a practice test, or none yet (no link to a page that is not built).
  const firstTest = units.find(built);
  const testLink = (depth, label) => firstTest ? `<a href="${depth}unit-tests/${firstTest.id}.html">${label}</a>` : '';

  /* ------------------------------------------------------- formula sheet */
  {
    const depth = '', path = 'formula-sheet.html', url = `${SITE}${BASE}${path}`;
    const title = courseTitle('Precalculus Formulas and Identities to Know', [LABEL]);
    const desc = 'The precalculus formulas and identities to know by heart, since the exam gives no formula sheet: what each is for, when to use it and where it is taught.';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#sheet`, name: 'Precalculus formulas and identities to know', url, description: desc, learningResourceType: 'Reference', isAccessibleForFree: true, educationalLevel: 'High school', inLanguage: 'en', isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'Formulas to know', url }])),
    ] };
    const R = x => renderMath(x);
    const sections = EQ.map(s => `<section class="xsection pcalc-eq-sec" aria-labelledby="eq-${s.id}"><h2 id="eq-${s.id}">${esc(s.h)}</h2>
    <div class="table-wrap" tabindex="0" role="region" aria-label="${esc(s.h)}: formulas"><table class="pcalc-eq"><thead><tr><th scope="col">Formula</th><th scope="col">What it is</th><th scope="col">When you use it</th><th scope="col">Learn it in</th></tr></thead><tbody>${s.rows.map(r => `<tr><th scope="row"><span class="pcalc-eq-f">${R(`$${r[0]}$`)}</span></th><td>${R(r[1])}</td><td>${R(r[2])}</td><td>${esc(r[3])}<br>${topicLink(r[4], depth)}${trainers(r[5])}</td></tr>`).join('')}</tbody></table></div></section>`).join('\n  ');
    const body = `
${bodyOpen(' data-app="formula-sheet"')}
<main id="main" class="xshell pcalc-app pcalc-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Formulas to know' }])}
  <header class="hero pcalc-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>Formulas and identities to know</h1>
  <p class="lede">The exam gives no formula sheet. These are the formulas and identities to know by heart, what each is for and when to use it.</p></header>
  <section class="xsection pcalc-eq-tips" aria-labelledby="eq-tips"><h2 id="eq-tips">Three habits that save points</h2>
    <ul class="pcalc-links">
      <li><b>Use the numbers you are given.</b> A reason earns the point when it cites specific values of the function (two inputs with the same output), not a rule such as "it fails the horizontal line test".</li>
      <li><b>Three decimal places, never partway.</b> On a calculator question, write the equation you solve, store every value, and round or truncate only the final answer, to three places after the decimal point.</li>
      <li><b>Radian mode and exact values.</b> Every angle is in radians. Without a calculator, give exact values (fractions, roots, π, e, logarithms) and combine to one logarithm or one trigonometric term when asked.</li>
    </ul>
  </section>
  ${EQ.length ? sections : '<p class="pcalc-small">The formula-by-formula guide arrives with the first published unit.</p>'}
  ${NOT_ON.length ? `<section class="xsection" aria-labelledby="eq-not"><h2 id="eq-not">Easy to forget</h2>
    <ul class="pcalc-eq-not">${NOT_ON.map(r => `<li><b>${R(r[0])}.</b> ${R(r[1])} <span class="pcalc-small">${topicLink(r[2], depth)}</span></li>`).join('')}</ul>
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
      return s ? `<div class="pcalc-set">${stimulusPanel(g.stimulus, s, s.html.replace(/(src|href)="figures\//g, `$1="${depth}figures/`))}${items}</div>` : items;
    }).join('');
    const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
    const pageData = { topic: null, unit: ch.id, free: true, sample: true, prereq: [], check: qs, stimuli };
    const others = units.filter(built).map(u => u.id === ch.id ? `<b>Unit ${u.n}</b>` : `<a href="${u.id}.html">Unit ${u.n}</a>`).join(' &middot; ');
    const body = `
${bodyOpen(` data-unit="${ch.id}" data-app="unit-test"`)}
<main id="main" class="xshell pcalc-app pcalc-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../units/${ch.id}.html` }, { name: `Unit ${ch.n} practice test` }])}
  <header class="hero pcalc-hero"><div class="eyebrow">Unit ${ch.n} &middot; ${ch.weight[0]}&ndash;${ch.weight[1]}% of the exam ${BETA_PILL}</div><h1>Unit ${ch.n} practice test: ${esc(ch.title)}</h1>
  <p class="lede">${qs.length} exam-style questions from the unit, free, with an explanation for every option. Most have four answer choices, as on the real exam, and a few ask you to type a value or an expression; sets share one graph or table.</p>
  <p class="pcalc-small pcalc-nav-ref">Covers: ${topics.map(t => esc(t.title)).join('; ')}.</p></header>
  <div class="pcalc-qs" data-set="check">${html}</div>
  <section class="xsection pcalc-nav-ref" aria-labelledby="ut-more"><h2 id="ut-more">Keep going</h2>
    <div class="pcalc-cards-row"><a class="btn-press" href="../practice.html?unit=${ch.id}">Practice the whole unit</a><a class="btn-outline" href="../exams.html?unit=${ch.id}">Take a timed unit test</a><a class="btn-outline" href="../unit-sheets/${ch.id}.html">Print the unit sheet</a></div>
    <p class="pcalc-small">Practice has every question in the unit, with feedback after each one; ${isFreeTopic(map, topics[0]) ? 'this unit\'s lessons are free.' : 'the notes for every topic are free.'} Other units: ${others}.</p>
  </section>
</main>
${footer(depth, `unit-test:${ch.id}`)}
<link rel="stylesheet" href="../assets/pages/pages.css">
<link rel="stylesheet" href="../assets/pages/entry.css">
<script type="application/json" id="pcalc-page-data">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
${tail({ depth, section: 'exams', extra: ['pcalc-questions.js', 'pages/sample.js'] })}
</body>
</html>
`;
    out[path] = r3Inner(head({ title, desc, path, depth, ogType: 'article', jsonld, noindex }) + body, { key: 'apprecalc', slug: 'unit-test', up: '../../' });
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

  /* ---------------------------------------------- "Make it specific" data */
  const prompts = loadJustify(C.data, map).filter(p => C.published.has(p.unit));
  /* The builder for a prompt whose answer has parts (carried from AP®
     Psychology): the slots in order, option text raw (shown as plain text in
     a select), each why rendered as math. */
  const builder = S => ({ slots: Object.fromEntries(Object.entries(S.slots || {}).map(([k, sl]) => [k, { label: sl.label, options: sl.options, correct: sl.correct, why: renderMath(sl.why || {}) }])) });
  out['assets/justify.json'] = JSON.stringify({
    skills: JUSTIFY_SKILLS,
    // "answer" is a raw key for questions (never TeX), so the model answers are rendered on their own.
    prompts: prompts.map((raw, i) => { const p = renderMath(raw), R1 = s => renderMath([s])[0]; return { id: p.id, unit: p.unit, topic: p.topic, practice: p.practice, skill: p.skill, title: p.title, context: p.context || '', prompt: p.prompt, checklist: p.checklist, earns: { answer: R1(raw.earns.answer), why: p.earns.why }, misses: { answer: R1(raw.misses.answer), why: p.misses.why }, ...(raw.specific ? { specific: builder(raw.specific) } : {}), ...(i < FREE_JUSTIFY ? { free: true } : {}) }; }),
  });
  return { pages: out, sampleUnits: units.filter(built).map(u => u.id), forms: live.length, prompts: prompts.length };
}
