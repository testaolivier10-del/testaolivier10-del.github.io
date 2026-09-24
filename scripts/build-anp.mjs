/* The A&P course generator.

   Reads anatomy-physiology/data/ and docs/anp-dependency-map.json and writes
   every page a student reads: the course home, learn.html, a page per chapter,
   a lesson page and a notes page per built topic, a page per core concept, the
   glossary, and the JSON the runtime loads (curriculum, glossary, question
   bank, notes index). A topic is built when it has a lesson, notes and a
   question file.

     node scripts/build-anp.mjs           write everything
     node scripts/build-anp.mjs --check   exit 1 if anything on disk is stale

   Nothing it writes is edited by hand; docs/anp-phase1-architecture.md. */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SITE, BASE, COURSE_NAME, COURSE_ID, TEAS_DISCLAIMER, esc, text, loadCourse, clampTitle, clampDesc,
  head, tail, crumbs, orgCrumbs, crumbNav, footer, termIndex, glossify, teachHref, figureImg, credit,
  renderFigures, questionForPage, questionHtml,
} from './lib/anp-build.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, 'anatomy-physiology');
const CHECK = process.argv.includes('--check');
const C = loadCourse(ROOT);
const { map } = C;
// Only published chapters' definitions go out (glossary page, hovers, glossary.json):
// a chapter still being written or audited keeps its glossary on the branch (decision 63).
{
  const pubPath = join(C.data, 'published.json');
  if (existsSync(pubPath)) {
    const pub = new Set(JSON.parse(readFileSync(pubPath, 'utf8')).chapters);
    for (const c of map.concepts) {
      const i = C.topicIndex.get(c.taughtIn);
      if (C.glossary[c.id] && (i === undefined || !pub.has(map.topics[i].chapter))) delete C.glossary[c.id];
    }
  }
}
const INDEX = termIndex(C);
const outputs = new Map(); // relative path -> content
// Every table on a page sits in a scrolling wrapper, so a wide one scrolls
// inside itself instead of widening the page on a phone (check-site).
const wrapTables = html => html.replace(/(<div class="table-wrap">\s*)?<table\b([\s\S]*?)<\/table>(\s*<\/div>)?/g,
  (m, open, inner, close) => open && close ? m : `<div class="table-wrap"><table${inner}</table></div>`);
const put = (rel, content) => outputs.set(rel, rel.endsWith('.html') ? wrapTables(content) : content);

const topicById = id => map.topics[C.topicIndex.get(id)];
const chapterById = id => map.chapters.find(c => c.id === id);
const topicsOf = chId => map.topics.filter(t => t.chapter === chId);
const builtTopics = map.topics.filter(t => C.built.has(t.id));
const coreById = id => map.coreConcepts.find(c => c.id === id);
const chapterBuilt = ch => topicsOf(ch.id).some(t => C.built.has(t.id));
const chapterNumber = chId => map.chapters.findIndex(c => c.id === chId) + 1;
const topicNumber = id => C.topicIndex.get(id) + 1;

/* Direct prerequisite topics, from concept dependencies (spec section 4.2). */
function buildsOn(id) {
  const here = C.topicIndex.get(id);
  const out = new Map();
  for (const c of map.concepts.filter(c => c.taughtIn === id)) for (const d of c.dependsOn) {
    const t = C.concepts.get(d).taughtIn;
    if (t !== id && C.topicIndex.get(t) < here) out.set(t, (out.get(t) || 0) + 1);
  }
  return [...out.keys()].sort((a, b) => C.topicIndex.get(a) - C.topicIndex.get(b));
}
function nextTopic(id) { return map.topics[C.topicIndex.get(id) + 1] || null; }
function prevTopic(id) { return map.topics[C.topicIndex.get(id) - 1] || null; }

/* A topic reference: a link when its page exists, else plain text (spec 7). */
function topicRef(id, depth, kind = 'notes') {
  const t = topicById(id);
  return C.built.has(id)
    ? `<a href="${depth}${kind}/${id}.html">${esc(t.title)}</a>`
    : `<span class="anp-unbuilt" title="Coming in a later part of the course">${esc(t.title)}</span>`;
}

function mentionsTeas(html) { return /\bTEAS\b/.test(text(html)); }
const disclaimer = html => mentionsTeas(html) ? `<p class="anp-disclaimer">${esc(TEAS_DISCLAIMER)}</p>` : '';

/* ------------------------------------------------------------- lesson */

function lessonPage(id) {
  const t = topicById(id), ch = chapterById(t.chapter), L = C.lessons[id];
  const depth = '../';
  const seen = new Set();
  const g = html => glossify(C, html, { depth, topic: id, seen, index: INDEX });
  const qs = C.questions[id];
  const byId = new Map(qs.map(q => [q.id, q]));
  const check = (L.check || []).map(qid => byId.get(qid)).filter(Boolean);
  const title = clampTitle([
    `${t.title}: Lesson | ${COURSE_NAME}`,
    `${t.title}: Lesson | A&P`,
    `${t.title} | A&P lesson`,
    // Truncated last: the kind goes first so the lesson and notes titles differ.
    `A&P lesson: ${t.title}`,
  ]);
  const desc = clampDesc(`${text(L.summary)}`);
  const url = `${SITE}${BASE}lessons/${id}.html`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LearningResource', '@id': `${url}#lesson`, name: t.title, url, description: desc,
        learningResourceType: 'Lesson', educationalLevel: 'Undergraduate', inLanguage: 'en', isAccessibleForFree: true,
        teaches: map.concepts.filter(c => c.taughtIn === id).slice(0, 12).map(c => ({ '@type': 'DefinedTerm', name: c.term })),
        isPartOf: { '@id': COURSE_ID }, provider: { '@id': `${SITE}/#org` },
        competencyRequired: buildsOn(id).filter(x => C.built.has(x)).map(x => ({ '@type': 'DefinedTerm', name: topicById(x).title, url: `${SITE}${BASE}lessons/${x}.html` })),
      },
      crumbs(orgCrumbs([
        { name: ch.title, url: `${SITE}${BASE}chapters/${ch.id}.html` },
        { name: t.title, url },
      ])),
    ],
  };
  const pageData = {
    topic: id,
    prereq: (L.prereq || []).map((p, i) => ({ id: `${id}-pre-${i + 1}`, type: 'single', q: p.q, options: p.options, correct: p.correct, why: { correct: p.why, options: p.options.map(() => '') }, review: p.review, reviewHref: C.built.has(p.review) ? `../notes/${p.review}.html` : null, reviewTitle: topicById(p.review).title })),
    check: check.map(q => questionForPage(C, q, id)),
  };
  const nx = nextTopic(id);
  const fig = L.anatomy && L.anatomy.figure ? C.figures[L.anatomy.figure] : null;
  const anatomy = fig ? `
    <section class="anp-part" id="anatomy" aria-labelledby="h-anatomy">
      <h2 id="h-anatomy"><span class="anp-part-n">4</span>Anatomy</h2>
      <figure class="anp-figure anp-anatomy">
        ${figureImg(C, L.anatomy.figure, depth, { topic: id })}
        <figcaption>${g(L.anatomy.caption || '')} ${credit(fig)}</figcaption>
      </figure>
      ${(fig.labels || []).some(l => l.box) ? '<button type="button" class="btn-outline anp-toggle-labels" aria-pressed="false">Hide labels</button><p class="anp-hint">With labels hidden, select a box to reveal its label.</p>' : ''}
    </section>` : '';
  const partN = n => fig ? n : n - 1;
  const conn = (L.connections || []).length ? `
    <section class="anp-part" id="connections" aria-labelledby="h-conn">
      <h2 id="h-conn"><span class="anp-part-n">${partN(11)}</span>Connections</h2>
      <ul class="anp-links">${L.connections.map(c => `<li><a href="${esc(c.href)}">${esc(c.label)}</a></li>`).join('')}</ul>
    </section>` : '';
  const body = `
<body data-topic="${id}">
<div id="site-header"></div>
<div class="course-nav"></div>
<main id="main" class="xshell anp-lesson">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../chapters/${ch.id}.html` }, { name: t.title }], depth)}
  <header class="hero anp-hero">
    <div class="eyebrow">Chapter ${chapterNumber(ch.id)} · ${esc(ch.title)} · Topic ${topicNumber(id)}</div>
    <h1>${esc(t.title)}</h1>
    <p class="anp-tags anp-nav-ref"><span class="anp-tag">A&amp;P ${t.course}</span><span class="anp-tag">${esc(t.kind)}</span><a class="anp-tag anp-read" href="../notes/${id}.html">Read the notes</a></p>
  </header>

  <section class="anp-part anp-hook" id="hook" aria-labelledby="h-hook">
    <h2 id="h-hook"><span class="anp-part-n">1</span>Why this matters</h2>
    ${g(L.hook)}
  </section>

  <section class="anp-part" id="builds-on" aria-labelledby="h-builds">
    <h2 id="h-builds"><span class="anp-part-n">2</span>What this builds on</h2>
    ${buildsOn(id).length ? `<nav class="anp-nav-ref" aria-label="Earlier topics"><ul class="anp-links">${buildsOn(id).map(x => `<li>${topicRef(x, depth)}</li>`).join('')}</ul></nav>` : '<p>This is where the course starts. Nothing comes before it.</p>'}
  </section>

  <section class="anp-part" id="prereq" aria-labelledby="h-prereq">
    <h2 id="h-prereq"><span class="anp-part-n">3</span>Quick check before you start</h2>
    ${(L.prereq || []).length ? `<div class="anp-qs" data-set="prereq">${pageData.prereq.map((p, i) => questionHtml(p, i + 1)).join('')}</div>` : '<p>No prerequisites: this topic starts from zero.</p>'}
  </section>
${anatomy}
  <section class="anp-part" id="chain" aria-labelledby="h-chain">
    <h2 id="h-chain"><span class="anp-part-n">${partN(5)}</span>How it works, step by step</h2>
    <ol class="anp-chain">${L.chain.map(s => `<li><span class="anp-cause">${g(s.cause)}</span><span class="anp-arrow" aria-hidden="true">→</span><span class="anp-effect">${g(s.effect)}</span></li>`).join('')}</ol>
  </section>

  <section class="anp-part" id="core" aria-labelledby="h-core">
    <h2 id="h-core"><span class="anp-part-n">${partN(6)}</span>Core concepts</h2>
    <p class="anp-core-tags anp-nav-ref">${t.coreConcepts.map(c => `<a class="anp-core" href="../concepts/${c}.html">${esc(coreById(c).name)}</a>`).join('')}</p>
  </section>

  <section class="anp-part anp-misconception" id="misconception" aria-labelledby="h-mis">
    <h2 id="h-mis"><span class="anp-part-n">${partN(7)}</span>A common mistake</h2>
    <p class="anp-wrong"><b>The wrong idea:</b> ${g(L.misconception.wrong)}</p>
    <p class="anp-right"><b>What actually happens:</b> ${g(L.misconception.right)}</p>
  </section>

  <section class="anp-part" id="check" aria-labelledby="h-check">
    <h2 id="h-check"><span class="anp-part-n">${partN(8)}</span>Check yourself</h2>
    <p class="anp-hint">Anything you miss goes into your review queue.</p>
    <div class="anp-qs" data-set="check">${pageData.check.map((q, i) => questionHtml(q, i + 1)).join('')}</div>
  </section>

  <section class="anp-part" id="summary" aria-labelledby="h-sum">
    <h2 id="h-sum"><span class="anp-part-n">${partN(9)}</span>Summary</h2>
    ${g(L.summary)}
  </section>

  <section class="anp-part" id="next" aria-labelledby="h-next">
    <h2 id="h-next"><span class="anp-part-n">${partN(10)}</span>What comes next</h2>
    ${nx ? `<nav class="anp-nav-ref" aria-label="Next topic"><p>${C.built.has(nx.id) ? `<a class="btn-press sm" href="${nx.id}.html">${esc(nx.title)} &rarr;</a>` : `Next in the course: ${esc(nx.title)} (${esc(chapterById(nx.chapter).title)}).`}</p></nav>` : '<p>This is the last topic in the course.</p>'}
  </section>
${conn}
  ${disclaimer(L.hook + L.summary)}
</main>
${footer(depth)}
<script type="application/json" id="anp-page-data">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
<script src="../../assets/report-question.js" defer></script>
${tail({ depth, section: 'learn', extra: ['anp-questions.js', 'anp-lesson.js'] })}
</body>
</html>
`;
  return head({ title, desc, path: `lessons/${id}.html`, depth, jsonld, meta: `<meta name="anp-topic" content="${id}">\n` }) + body;
}

/* -------------------------------------------------------------- notes */

function notesPage(id) {
  const t = topicById(id), ch = chapterById(t.chapter);
  const depth = '../';
  const seen = new Set();
  let html = renderFigures(C, C.notes[id], depth, id);
  html = glossify(C, html, { depth, topic: id, seen, index: INDEX });
  const firstP = (C.notes[id].match(/<p>([\s\S]*?)<\/p>/) || [])[1] || t.title;
  const title = clampTitle([
    `${t.title}: Notes | ${COURSE_NAME}`,
    `${t.title}: Notes | A&P`,
    `${t.title} | A&P notes`,
    `A&P notes: ${t.title}`,
  ]);
  const desc = clampDesc(firstP);
  const url = `${SITE}${BASE}notes/${id}.html`;
  const pv = prevTopic(id), nx = nextTopic(id);
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LearningResource', '@id': `${url}#reading`, name: t.title, url, description: desc,
        learningResourceType: 'Reading', educationalLevel: 'Undergraduate', inLanguage: 'en', isAccessibleForFree: true,
        keywords: t.searchPhrase,
        isPartOf: { '@id': COURSE_ID }, provider: { '@id': `${SITE}/#org` },
      },
      crumbs(orgCrumbs([
        { name: ch.title, url: `${SITE}${BASE}chapters/${ch.id}.html` },
        { name: `${t.title}: notes`, url },
      ])),
    ],
  };
  const onward = [
    pv && C.built.has(pv.id) ? `<a class="anp-prevnext anp-prev" href="${pv.id}.html"><span>Previous</span>${esc(pv.title)}</a>` : '',
    nx && C.built.has(nx.id) ? `<a class="anp-prevnext anp-next" href="${nx.id}.html"><span>Next</span>${esc(nx.title)}</a>` : '',
  ].join('');
  const body = `
<body data-topic="${id}">
<div id="site-header"></div>
<div class="course-nav"></div>
<main id="main" class="xshell anp-notes">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../chapters/${ch.id}.html` }, { name: `${t.title}: notes` }], depth)}
  <header class="hero anp-hero">
    <div class="eyebrow">Chapter ${chapterNumber(ch.id)} · ${esc(ch.title)} · Topic ${topicNumber(id)}</div>
    <h1>${esc(t.title)}</h1>
    <p class="anp-tags anp-nav-ref"><span class="anp-tag">A&amp;P ${t.course}</span>${t.coreConcepts.map(c => `<a class="anp-tag" href="../concepts/${c}.html">${esc(coreById(c).name)}</a>`).join('')}<a class="anp-tag anp-read" href="../lessons/${id}.html">Interactive lesson</a></p>
  </header>
  <article class="anp-prose">
${html}
  </article>
  ${disclaimer(html)}
  <nav class="anp-onward anp-nav-ref" aria-label="Topic navigation">${onward}</nav>
</main>
${footer(depth)}
${tail({ depth, section: 'learn' })}
</body>
</html>
`;
  return head({ title, desc, path: `notes/${id}.html`, depth, jsonld, meta: `<meta name="anp-topic" content="${id}">\n` }) + body;
}

/* ------------------------------------------------------------ chapter */

function chapterPage(chId) {
  const ch = chapterById(chId), depth = '../';
  const ts = topicsOf(chId);
  const tools = ch.tools || {};
  const toolList = (kind, label) => (tools[kind] || []).length ? `<h3>${label}</h3><ul class="anp-plain">${tools[kind].map(it => `<li>${it.level ? `<span class="anp-tag">Level ${it.level}</span> ` : ''}${esc(it.title)}</li>`).join('')}</ul>` : '';
  const title = clampTitle([`${ch.title} | ${COURSE_NAME}`, `${ch.title} | A&P`]);
  const desc = clampDesc(`${ch.title}: ${ts.length} topics, from ${ts[0].title.toLowerCase()} to ${ts[ts.length - 1].title.toLowerCase()}, with lessons, notes, practice questions and study tools.`);
  const url = `${SITE}${BASE}chapters/${chId}.html`;
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': `${url}#chapter`, name: ch.title, url, description: desc, isPartOf: { '@id': COURSE_ID } },
    crumbs(orgCrumbs([{ name: ch.title, url }])),
  ] };
  const body = `
<body data-chapter="${chId}">
<div id="site-header"></div>
<div class="course-nav"></div>
<main id="main" class="xshell anp-chapter">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title }], depth)}
  <header class="hero anp-hero">
    <div class="eyebrow">Chapter ${chapterNumber(chId)} · A&amp;P ${ch.course}</div>
    <h1>${esc(ch.title)}</h1>
    <p class="lede">${ts.length} topics. Mastery shows beside each one as you answer questions.</p>
  </header>
  <section class="anp-part" aria-labelledby="h-topics">
    <h2 id="h-topics">Topics</h2>
    <ol class="anp-topic-list">${ts.map(t => `<li data-topic="${t.id}"><span class="anp-topic-n">${topicNumber(t.id)}</span>${C.built.has(t.id)
      ? `<a href="../lessons/${t.id}.html">${esc(t.title)}</a> <a class="anp-small" href="../notes/${t.id}.html">notes</a> <span class="anp-mastery" data-mastery-topic="${t.id}"></span>`
      : `<span class="anp-unbuilt">${esc(t.title)}</span> <span class="anp-small">in a later part of the course</span>`}</li>`).join('')}</ol>
  </section>
  <section class="anp-part" aria-labelledby="h-practice">
    <h2 id="h-practice">Practice this chapter</h2>
    <p><a class="btn-press sm" href="../practice.html?chapter=${chId}">Chapter quiz</a> <a class="btn-outline" href="../exams.html?chapter=${chId}">System exam</a> <a class="btn-outline" href="../tools.html?chapter=${chId}">Tools for this chapter</a></p>
  </section>
  <section class="anp-part anp-chapter-tools" aria-labelledby="h-tools">
    <h2 id="h-tools">In this chapter's tools</h2>
    ${toolList('labSets', 'Lab practical image sets')}${toolList('predictionThemes', 'Prediction scenarios')}${toolList('pathways', 'Pathways')}${toolList('feedbackLoops', 'Feedback loops')}${toolList('graphs', 'Graphs')}${toolList('calculators', 'Calculators')}${toolList('comparisonTables', 'Comparison tables')}
  </section>
</main>
${footer(depth)}
${tail({ depth, section: 'learn', extra: ['anp-chapter.js'] })}
</body>
</html>
`;
  return head({ title, desc, path: `chapters/${chId}.html`, depth, ogType: 'website', jsonld }) + body;
}

/* ------------------------------------------------------- core concept */

function corePage(coreId) {
  const cc = coreById(coreId), depth = '../';
  const intro = (C.coreText && C.coreText[coreId]) || `<p>${esc(cc.summary)}</p>`;
  const tagged = map.topics.filter(t => t.coreConcepts.includes(coreId));
  const byCh = new Map();
  for (const t of tagged) { if (!byCh.has(t.chapter)) byCh.set(t.chapter, []); byCh.get(t.chapter).push(t); }
  const title = clampTitle([`${cc.name}: a core concept | ${COURSE_NAME}`, `${cc.name} | A&P core concept`]);
  const desc = clampDesc(`${cc.summary} See where it appears in every body system.`);
  const url = `${SITE}${BASE}concepts/${coreId}.html`;
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'LearningResource', '@id': `${url}#concept`, name: cc.name, url, description: desc, learningResourceType: 'Concept overview', isPartOf: { '@id': COURSE_ID } },
    crumbs(orgCrumbs([{ name: 'Core concepts', url: `${SITE}${BASE}concepts/index.html` }, { name: cc.name, url }])),
  ] };
  const body = `
<body data-core="${coreId}">
<div id="site-header"></div>
<div class="course-nav"></div>
<main id="main" class="xshell anp-corepage">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: 'Core concepts', href: 'index.html' }, { name: cc.name }], depth)}
  <header class="hero anp-hero">
    <div class="eyebrow">Core concept</div>
    <h1>${esc(cc.name)}</h1>
    <p class="lede">${esc(cc.summary)}</p>
  </header>
  <section class="anp-part anp-prose">${intro}</section>
  <section class="anp-part" aria-labelledby="h-where">
    <h2 id="h-where">Where it shows up</h2>
    ${[...byCh].map(([chId, ts]) => `<h3>${esc(chapterById(chId).title)}</h3><ul class="anp-plain">${ts.map(t => `<li>${topicRef(t.id, depth, 'lessons')}</li>`).join('')}</ul>`).join('')}
  </section>
  <section class="anp-part" aria-labelledby="h-drill">
    <h2 id="h-drill">Practice it across systems</h2>
    <p><a class="btn-press sm" href="../practice.html?core=${coreId}">Mixed questions on ${esc(cc.name.toLowerCase())}</a> <span class="anp-mastery" data-mastery-core="${coreId}"></span></p>
  </section>
</main>
${footer(depth)}
${tail({ depth, section: 'learn', extra: ['anp-chapter.js'] })}
</body>
</html>
`;
  return head({ title, desc, path: `concepts/${coreId}.html`, depth, jsonld }) + body;
}

function coreIndexPage() {
  const depth = '../';
  const title = `Core concepts of physiology | ${COURSE_NAME}`;
  const desc = 'Eight ideas that explain every body system, from homeostasis to flow down gradients, with every place each one appears in the course.';
  const url = `${SITE}${BASE}concepts/index.html`;
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': `${url}#concepts`, name: 'Core concepts', url, description: desc, isPartOf: { '@id': COURSE_ID } },
    crumbs(orgCrumbs([{ name: 'Core concepts', url }])),
  ] };
  const body = `
<body>
<div id="site-header"></div>
<div class="course-nav"></div>
<main id="main" class="xshell">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: 'Core concepts' }], depth)}
  <header class="hero anp-hero"><div class="eyebrow">${COURSE_NAME}</div><h1>Core concepts</h1><p class="lede">${esc(desc)}</p></header>
  <ul class="anp-cards">${map.coreConcepts.map(c => `<li><a href="${c.id}.html"><b>${esc(c.name)}</b><span>${esc(c.summary)}</span></a> <span class="anp-mastery" data-mastery-core="${c.id}"></span></li>`).join('')}</ul>
</main>
${footer(depth)}
${tail({ depth, section: 'learn', extra: ['anp-chapter.js'] })}
</body>
</html>
`;
  return head({ title, desc, path: 'concepts/index.html', depth, ogType: 'website', jsonld }) + body;
}

/* ------------------------------------------------------------ credits */

// Every figure the built pages show, with its source, license and where it is
// used (spec section 2: record each figure's license and credit).
function creditsPage() {
  const depth = '';
  const rows = [];
  const figDir = join(C.data, 'figures');
  for (const t of builtTopics) {
    const p = join(figDir, `${t.id}.json`);
    if (!existsSync(p)) continue;
    for (const [id, f] of Object.entries(JSON.parse(readFileSync(p, 'utf8')))) if (f.source === 'openstax') rows.push({ id, f, t });
  }
  const title = `Figure credits | ${COURSE_NAME}`;
  const desc = clampDesc(`The source and license of every figure in the ${COURSE_NAME} course. OpenStax figures are used under CC BY 4.0.`);
  const url = `${SITE}${BASE}credits.html`;
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': `${url}#page`, name: 'Figure credits', url, description: desc, isPartOf: { '@id': COURSE_ID } },
    crumbs(orgCrumbs([{ name: 'Figure credits', url }])),
  ] };
  const body = `
<body>
<div id="site-header"></div>
<div class="course-nav"></div>
<main id="main" class="xshell anp-credits">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Figure credits' }], depth)}
  <header class="hero anp-hero"><div class="eyebrow">${COURSE_NAME}</div><h1>Figure credits</h1>
    <p class="lede">Figures marked OpenStax come from <a href="https://openstax.org/details/books/anatomy-and-physiology-2e">OpenStax <i>Anatomy and Physiology 2e</i></a>, &copy; Rice University, used under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. We resize them, and in lessons and the lab practical we cover some printed labels. OpenStax and Rice University do not endorse LevlPrep. Every other diagram in the course is drawn for it.</p></header>
  <table class="anp-credit-table"><thead><tr><th scope="col">Figure</th><th scope="col">Used in</th><th scope="col">Source</th><th scope="col">License</th></tr></thead><tbody>
  ${rows.map(({ id, f, t }) => {
    const page = f.openstax && f.openstax.page ? `https://openstax.org/books/anatomy-and-physiology-2e/pages/${f.openstax.page}` : 'https://openstax.org/details/books/anatomy-and-physiology-2e';
    return `<tr><td>${esc((f.openstax && f.openstax.figure) ? `OpenStax Figure ${f.openstax.figure}` : id)}</td><td><a href="notes/${t.id}.html">${esc(t.title)}</a></td><td><a href="${page}">openstax.org</a></td><td>${esc(f.license)}</td></tr>`;
  }).join('\n  ')}
  </tbody></table>
</main>
${footer(depth)}
${tail({ depth, section: 'credits' })}
</body>
</html>
`;
  return head({ title, desc, path: 'credits.html', depth, ogType: 'website', jsonld }) + body;
}

/* ----------------------------------------------------------- glossary */

function glossaryPage() {
  const depth = '';
  const entries = map.concepts.filter(c => C.glossary[c.id]).map(c => ({ c, g: C.glossary[c.id] }))
    .sort((a, b) => a.c.term.localeCompare(b.c.term, 'en', { sensitivity: 'base' }));
  const title = `Glossary of anatomy & physiology terms | ${COURSE_NAME}`.length <= 60 ? `Glossary of anatomy & physiology terms | ${COURSE_NAME}` : 'A&P glossary: terms, word roots and definitions';
  const desc = clampDesc(`${entries.length} anatomy and physiology terms with plain definitions, word roots and pronunciation, each linked to the page that teaches it.`);
  const url = `${SITE}${BASE}glossary.html`;
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'DefinedTermSet', '@id': `${url}#terms`, name: `${COURSE_NAME} glossary`, url, description: desc },
    crumbs(orgCrumbs([{ name: 'Glossary', url }])),
  ] };
  const letters = [...new Set(entries.map(e => e.c.term[0].toUpperCase()))];
  const body = `
<body>
<div id="site-header"></div>
<div class="course-nav"></div>
<main id="main" class="xshell anp-glossary">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Glossary' }], depth)}
  <header class="hero anp-hero"><div class="eyebrow">${COURSE_NAME}</div><h1>Glossary</h1><p class="lede">${entries.length} terms so far. Each one links to the page that teaches it.</p>
    <label class="anp-filter">Find a term <input type="search" id="gl-filter" autocomplete="off"></label></header>
  <nav class="anp-letters" aria-label="Jump to letter">${letters.map(l => `<a href="#l-${l}">${l}</a>`).join('')}</nav>
  <dl class="anp-terms">${letters.map(l => `<div class="anp-letter" id="l-${l}"><h2>${l}</h2>${entries.filter(e => e.c.term[0].toUpperCase() === l).map(({ c, g }) => {
    const href = C.built.has(c.taughtIn) ? `notes/${c.taughtIn}.html` : null;
    const roots = (g.roots || []).length ? `<span class="anp-roots">${g.roots.map(r => `<i>${esc(r[0])}</i> ${esc(r[1])}`).join(' · ')}</span>` : '';
    return `<div class="anp-term" id="t-${c.id}" data-terms="${esc([c.term, ...c.aliases].join(' ').toLowerCase())}"><dt>${esc(c.term)}${g.say ? ` <span class="anp-say">(${esc(g.say)})</span>` : ''}</dt><dd>${esc(g.def)} ${roots} <span class="anp-small">Taught in ${href ? `<a href="${href}">${esc(topicById(c.taughtIn).title)}</a>` : esc(topicById(c.taughtIn).title)}.</span></dd></div>`;
  }).join('')}</div>`).join('')}</dl>
</main>
${footer(depth)}
${tail({ depth, section: 'glossary', extra: ['anp-glossary-page.js'] })}
</body>
</html>
`;
  return head({ title, desc, path: 'glossary.html', depth, ogType: 'website', jsonld }) + body;
}

/* -------------------------------------------------------- learn, home */

function chapterList(depth, withProgress) {
  const parts = map.parts.map(p => {
    const chs = map.chapters.filter(c => c.part === p.id);
    return `<section class="anp-partgroup" aria-labelledby="p-${p.id}"><h2 id="p-${p.id}">${esc(p.title)}</h2><ol class="anp-chapters" start="${chapterNumber(chs[0].id)}">${chs.map(ch => {
      const ts = topicsOf(ch.id), b = ts.filter(t => C.built.has(t.id)).length;
      const label = `<b>${esc(ch.title)}</b><span class="anp-small">${ts.length} topics · A&amp;P ${ch.course}${b ? '' : ' · coming in a later part'}</span>`;
      return `<li data-chapter="${ch.id}">${b ? `<a href="${depth}chapters/${ch.id}.html">${label}</a>` : `<div class="anp-unbuilt-ch">${label}</div>`}${withProgress && b ? `<span class="anp-mastery" data-mastery-chapter="${ch.id}"></span>` : ''}</li>`;
    }).join('')}</ol></section>`;
  });
  return parts.join('');
}

function learnPage() {
  const depth = '';
  const title = `All chapters and topics | ${COURSE_NAME}`;
  const desc = clampDesc(`Every chapter of the course in order: ${map.chapters.length} chapters and ${map.topics.length} topics, from orientation to the body through development and inheritance.`);
  const url = `${SITE}${BASE}learn.html`;
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': `${url}#learn`, name: 'All chapters', url, description: desc, isPartOf: { '@id': COURSE_ID } },
    crumbs(orgCrumbs([{ name: 'All chapters', url }])),
  ] };
  const body = `
<body>
<div id="site-header"></div>
<div class="course-nav"></div>
<main id="main" class="xshell anp-learn">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'All chapters' }], depth)}
  <header class="hero anp-hero"><div class="eyebrow">${COURSE_NAME} <span class="anp-beta">Beta</span></div><h1>All chapters</h1><p class="lede">Foundations first, then every body system. Start anywhere: nothing is locked.</p>
    <label class="anp-filter">Show <select id="course-filter"><option value="">A&amp;P I and II</option><option value="I">A&amp;P I only</option><option value="II">A&amp;P II only</option></select></label></header>
  ${chapterList(depth, true)}
</main>
${footer(depth)}
${tail({ depth, section: 'learn', extra: ['anp-chapter.js'] })}
</body>
</html>
`;
  return head({ title, desc, path: 'learn.html', depth, ogType: 'website', jsonld }) + body;
}

function homePage() {
  const depth = '';
  const foundations = map.chapters.filter(c => c.part === 'foundations');
  const nb = builtTopics.length;
  const title = 'Anatomy & Physiology course (Beta) | LevlPrep';
  const desc = 'Free anatomy and physiology course: lessons that build in strict order, mechanism-first physiology, a virtual lab practical and TEAS A&P practice.';
  const url = `${SITE}${BASE}`;
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Course', '@id': COURSE_ID, name: COURSE_NAME, url, description: desc, inLanguage: 'en', isAccessibleForFree: true,
      provider: { '@id': `${SITE}/#org` }, educationalLevel: 'Undergraduate',
      hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: 'Self-paced' },
      syllabusSections: map.chapters.map(c => ({ '@type': 'Syllabus', name: c.title })) },
    crumbs(orgCrumbs([])),
  ] };
  const firstBuilt = map.topics.find(t => C.built.has(t.id));
  const body = `
<body>
<div id="site-header"></div>
<div class="course-nav"></div>
<main id="main" class="xshell anp-home">
  <header class="hero anp-hero">
    <div class="eyebrow">${COURSE_NAME} <span class="anp-beta">Beta</span></div>
    <h1>Anatomy &amp; physiology that builds in order.</h1>
    <p class="lede">Every idea is taught before it is used. Physiology is taught as mechanism: what causes what, step by step. Practice sits inside the reading.</p>
    <div class="hero-ctas">${firstBuilt ? `<a class="btn-press" href="lessons/${firstBuilt.id}.html">Start here</a>` : ''}<a class="btn-outline" href="learn.html">All chapters</a><span class="anp-mastery" data-mastery-overall="1"></span></div>
  </header>

  <section class="anp-part" aria-labelledby="h-covers">
    <h2 id="h-covers">What the course covers</h2>
    <p>${map.chapters.length} chapters and ${map.topics.length} topics: the full scope of a two-semester college A&amp;P course, matched to the OpenStax <i>Anatomy and Physiology 2e</i> textbook, the HAPS learning outcomes and the TEAS&nbsp;7 A&amp;P content areas. Each topic has an interactive lesson and a full notes page.</p>
    <p class="anp-small">In this Beta, ${nb} topics are built: Foundations and the cardiovascular system. The rest are listed so you can see where everything fits; they arrive chapter by chapter.</p>
  </section>

  <section class="anp-part" aria-labelledby="h-how">
    <h2 id="h-how">How to use it</h2>
    <ol class="anp-steps">
      <li><b>Read the lesson.</b> It opens with a patient, checks what you need first, then walks the mechanism one cause at a time.</li>
      <li><b>Answer as you go.</b> Anything you miss goes into your review queue and comes back when you are about to forget it.</li>
      <li><b>Use the tools.</b> Predict what changes, build feedback loops, trace pathways, read graphs and practice for lab practicals.</li>
      <li><b>Check your mastery.</b> Your dashboard shows your weakest topics and core concepts, and what to do next.</li>
    </ol>
  </section>

  <section class="anp-part" aria-labelledby="h-start">
    <h2 id="h-start">Start here: Foundations</h2>
    <p>Recommended, not required. Foundations teaches the vocabulary, chemistry, cells, tissues, signals and feedback that every system chapter builds on.</p>
    <ol class="anp-chapters">${foundations.map(ch => chapterBuilt(ch) ? `<li><a href="chapters/${ch.id}.html"><b>${esc(ch.title)}</b><span class="anp-small">${topicsOf(ch.id).length} topics</span></a><span class="anp-mastery" data-mastery-chapter="${ch.id}"></span></li>` : `<li><div class="anp-unbuilt-ch"><b>${esc(ch.title)}</b><span class="anp-small">${topicsOf(ch.id).length} topics · coming in a later part</span></div></li>`).join('')}</ol>
  </section>

  <section class="anp-part" aria-labelledby="h-go">
    <h2 id="h-go">Practice and study</h2>
    <ul class="anp-cards anp-cards-sm">
      <li><a href="practice.html"><b>Practice</b><span>Topic, system and core concept drills, mixed review and your missed questions.</span></a></li>
      <li><a href="review.html"><b>Review</b><span>Your spaced review queue.</span></a></li>
      <li><a href="exams.html"><b>Exams</b><span>Unit quizzes, system exams and TEAS A&amp;P practice.</span></a></li>
      <li><a href="tools.html"><b>Tools</b><span>Lab practical, predict the change, feedback loops, pathways, graphs, calculators and word roots.</span></a></li>
      <li><a href="flashcards.html"><b>Flashcards</b><span>Spaced-repetition cards from the glossary and comparison tables.</span></a></li>
      <li><a href="glossary.html"><b>Glossary</b><span>Every term, with word roots and where it is taught.</span></a></li>
      <li><a href="concepts/index.html"><b>Core concepts</b><span>Eight ideas that explain every system.</span></a></li>
      <li><a href="mastery.html"><b>Dashboard</b><span>Mastery by topic, system and core concept.</span></a></li>
    </ul>
  </section>

  <section class="anp-part" aria-labelledby="h-all">
    <h2 id="h-all">Chapters</h2>
    ${chapterList(depth, true)}
  </section>
  <p class="anp-disclaimer">${esc(TEAS_DISCLAIMER)} OpenStax is credited as a source of figures and coverage; OpenStax does not endorse LevlPrep.</p>
</main>
${footer(depth)}
${tail({ depth, section: 'home', extra: ['anp-chapter.js'] })}
</body>
</html>
`;
  return head({ title, desc, path: '', depth, ogType: 'website', jsonld }) + body;
}

/* ---------------------------------------------------- apps and tools */

const PAGES = JSON.parse(readFileSync(join(C.data, 'pages.json'), 'utf8'));

/* The shell of an app or tool page. The page's behavior is its script, which
   mounts into #app; the static text here is what a reader without JavaScript
   (or a search engine) sees. */
function appShell(entry, { path, depth, h1, eyebrow, lede, section, extraScripts, isTool }) {
  const url = `${SITE}${BASE}${path}`;
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    isTool
      ? { '@type': 'WebApplication', '@id': `${url}#tool`, name: entry.name, url, description: entry.desc, applicationCategory: 'EducationalApplication', operatingSystem: 'Any', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, isPartOf: { '@id': COURSE_ID } }
      : { '@type': 'WebPage', '@id': `${url}#page`, name: h1, url, description: entry.desc, isPartOf: { '@id': COURSE_ID } },
    crumbs(orgCrumbs(isTool ? [{ name: 'Tools', url: `${SITE}${BASE}tools.html` }, { name: entry.name, url }] : [{ name: h1, url }])),
  ] };
  const crumbItems = isTool
    ? [{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: 'Tools', href: '../tools.html' }, { name: entry.name }]
    : [{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: h1 }];
  const teas = /\bTEAS\b/.test(entry.desc + ' ' + (lede || '')) || entry.slug === 'exams';
  const body = `
<body data-app="${entry.slug}">
<div id="site-header"></div>
<div class="course-nav"></div>
<main id="main" class="xshell anp-app">
  ${crumbNav(crumbItems, depth)}
  <header class="hero anp-hero"><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(h1)}</h1><p class="lede">${esc(lede)}</p></header>
  <div id="app" class="anp-app-mount" data-slug="${entry.slug}"${entry.data ? ` data-src="${depth}assets/tool-data/${entry.data}"` : ''}><noscript><p>This ${isTool ? 'tool' : 'page'} needs JavaScript. The lessons and notes pages work without it.</p></noscript></div>
  ${teas ? `<p class="anp-disclaimer">${esc(TEAS_DISCLAIMER)}</p>` : ''}
</main>
${footer(depth)}
<link rel="stylesheet" href="${depth}assets/${entry.css}">
<script src="${depth}../assets/report-question.js" defer></script>
${tail({ depth, section, extra: ['anp-questions.js', ...(extraScripts || []), entry.script] })}
</body>
</html>
`;
  return head({ title: entry.title, desc: entry.desc, path, depth, ogType: 'website', jsonld }) + body;
}

for (const a of PAGES.apps) put(`${a.slug}.html`, appShell(a, { path: `${a.slug}.html`, depth: '', h1: a.h1, eyebrow: COURSE_NAME, lede: a.desc, section: a.section }));
for (const t of PAGES.tools) put(`tools/${t.slug}.html`, appShell(t, { path: `tools/${t.slug}.html`, depth: '../', h1: t.name, eyebrow: 'A&P tool', lede: t.blurb, section: 'tools', isTool: true }));

/* ------------------------------------------------------------ runtime */

function curriculumJs() {
  const data = {
    chapters: map.chapters.map(c => ({ id: c.id, title: c.title, part: c.part, course: c.course, teas: c.teas, n: chapterNumber(c.id) })),
    topics: map.topics.map((t, i) => ({ id: t.id, title: t.title, chapter: t.chapter, course: t.course, kind: t.kind, core: t.coreConcepts, n: i + 1, built: C.built.has(t.id), qn: C.built.has(t.id) ? C.questions[t.id].length : 0 })),
    core: map.coreConcepts.map(c => ({ id: c.id, name: c.name })),
    // How many built questions each core concept has: mastery of a concept
    // is measured against min(20, this), so it cannot read 100% off a few.
    coreCounts: Object.fromEntries(map.coreConcepts.map(c => [c.id, builtTopics.reduce((n, t) => n + C.questions[t.id].filter(q => (q.core || []).includes(c.id)).length, 0)])),
    parts: map.parts,
  };
  return `/* Generated by scripts/build-anp.mjs from docs/anp-dependency-map.json. Do not edit. */
window.AnpCurriculum = ${JSON.stringify(data)};
`;
}

function glossaryJson() {
  const out = {};
  for (const c of map.concepts) {
    const g = C.glossary[c.id];
    if (!g) continue;
    out[c.id] = { t: c.term, d: g.def, r: g.roots || [], s: g.say || '', p: c.taughtIn, b: C.built.has(c.taughtIn) ? 1 : 0 };
  }
  return JSON.stringify(out);
}

/* The question bank, one pair of files per published chapter
   (assets/bank/<chapter>.json for stems, options and keys; <chapter>-why.json
   for explanations, fetched after). One file for the whole course would pass
   400 KB gzipped by the time every chapter is written, and every edit to one
   chapter would invalidate all of it in the cache. AnpCore.loadBank fetches the
   chapters a page needs. */
function bankJson() {
  const out = {};
  for (const t of builtTopics) {
    const ch = t.chapter;
    const b = out[ch] || (out[ch] = { core: [], why: {} });
    for (const q of C.questions[t.id]) {
      const p = questionForPage(C, q, t.id);
      b.why[p.id] = { why: p.why, variables: p.variables };
      const { why: _w, ...rest } = p;
      if (rest.variables) rest.variables = rest.variables.map(v => ({ name: v.name, answer: v.answer }));
      b.core.push(rest);
    }
  }
  return out;
}

function notesIndexJson() {
  return JSON.stringify(builtTopics.map(t => ({ file: `${BASE}notes/${t.id}.html`, title: t.title })));
}

/* ------------------------------------------------------------- output */

// Core concept intros, if authored.
const coreTextPath = join(C.data, 'core-concepts.json');
C.coreText = existsSync(coreTextPath) ? JSON.parse(readFileSync(coreTextPath, 'utf8')) : null;

put('index.html', homePage());
put('learn.html', learnPage());
put('glossary.html', glossaryPage());
put('credits.html', creditsPage());
put('concepts/index.html', coreIndexPage());
for (const c of map.coreConcepts) put(`concepts/${c.id}.html`, corePage(c.id));
// A chapter page exists once the chapter has a built topic: no "coming soon"
// pages (spec section 19, decision 1).
for (const ch of map.chapters.filter(chapterBuilt)) put(`chapters/${ch.id}.html`, chapterPage(ch.id));
for (const t of builtTopics) { put(`lessons/${t.id}.html`, lessonPage(t.id)); put(`notes/${t.id}.html`, notesPage(t.id)); }
put('assets/anp-curriculum.js', curriculumJs().replace('window.AnpCurriculum = ', `window.AnpTools = ${JSON.stringify(PAGES.tools.map(t => ({ slug: t.slug, name: t.name, blurb: t.blurb })))};\nwindow.AnpCurriculum = `));
put('assets/glossary.json', glossaryJson());
put('assets/notes-index.json', notesIndexJson());
for (const [ch, b] of Object.entries(bankJson())) {
  put(`assets/bank/${ch}.json`, JSON.stringify(b.core));
  put(`assets/bank/${ch}-why.json`, JSON.stringify(b.why));
}

/* Tool data as served: only items whose topic is built, so a chapter's tool
   items go live with its pages and not before (spec decision 53). The source
   files in data/tools/ hold every chapter, published or not, and are what the
   content check validates; the tool pages read these filtered copies. */
function publishedTool(file) {
  const d = JSON.parse(readFileSync(join(C.data, 'tools', file), 'utf8'));
  const live = (x) => !x.topic || C.built.has(x.topic);
  for (const k of Object.keys(d)) if (Array.isArray(d[k]) && d[k].some(x => x && typeof x === 'object' && 'topic' in x)) d[k] = d[k].filter(live);
  if (file === 'lab-practical.json') {
    for (const set of d.sets) set.stations = set.stations.filter(live);
    d.sets = d.sets.filter(set => set.stations.length);
    const used = new Set(d.sets.flatMap(set => set.stations.map(st => st.figure)));
    d.figures = Object.fromEntries(Object.entries(d.figures).filter(([id]) => used.has(id)));
  }
  if (file === 'calculators.json') d.groups = d.groups.filter(g => d.calculators.some(c => c.group === g.id));
  if (file === 'word-roots.json') {
    const used = new Set(d.terms.flatMap(t => t.segs.map(sg => sg[1])));
    d.parts = d.parts.filter(pt => used.has(pt.id));
  }
  return JSON.stringify(d);
}
for (const f of readdirSync(join(C.data, 'tools')).filter(f => f.endsWith('.json')).sort()) put(`assets/tool-data/${f}`, publishedTool(f));

// Generated folders hold nothing else: a page for a topic that lost its data
// would otherwise live on, unlinked and stale.
const OWNED_DIRS = ['lessons', 'notes', 'chapters', 'concepts', 'tools', 'assets/tool-data', 'assets/bank'];
const stale = [];
for (const d of OWNED_DIRS) {
  const dir = join(OUT, d);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) if (!outputs.has(`${d}/${f}`)) stale.push(`${d}/${f}`);
}

let bad = 0;
for (const [rel, content] of outputs) {
  const p = join(OUT, rel);
  const cur = existsSync(p) ? readFileSync(p, 'utf8') : null;
  if (cur === content) continue;
  if (CHECK) { console.log(`stale: anatomy-physiology/${rel}`); bad++; continue; }
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
}
for (const rel of stale) {
  if (CHECK) { console.log(`not generated (remove it): anatomy-physiology/${rel}`); bad++; }
  else unlinkSync(join(OUT, rel));
}
if (CHECK && bad) { console.log(`${bad} A&P file(s) out of date. Run: node scripts/build-anp.mjs`); process.exit(1); }
console.log(`A&P: ${builtTopics.length} topics built, ${outputs.size} files ${CHECK ? 'checked' : 'written'}.`);
