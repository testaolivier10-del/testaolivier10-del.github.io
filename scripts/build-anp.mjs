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
  head, tail, crumbs, orgCrumbs, crumbNav, footer, termIndex, glossify, teachHref, figureImg, credit, attribution, BETA_PILL,
  renderFigures, questionForPage, questionHtml,
} from './lib/anp-build.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, 'anatomy-physiology');
const CHECK = process.argv.includes('--check');
const C = loadCourse(ROOT);
// Hand-written meta descriptions, for pages whose opening text has no whole
// sentence short enough to be one (clampDesc would fall back to a template).
// Shaped { lessons: {id: text}, notes: {id: text}, chapters: {id: text} }.
const DESC_PATH = join(ROOT, 'anatomy-physiology', 'data', 'descriptions.json');
const DESCRIPTIONS = existsSync(DESC_PATH) ? JSON.parse(readFileSync(DESC_PATH, 'utf8')) : {};
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
// The wrapper is a focusable, named region so a keyboard user can scroll it
// with the arrow keys (audit 2026-10; site rule table-wrap-keyboard). Its name
// is the table's caption, else its column headings.
const tableLabel = (inner) => {
  const cap = inner.match(/<caption[^>]*>([\s\S]*?)<\/caption>/);
  const heads = [...inner.matchAll(/<th\b[^>]*scope="col"[^>]*>([\s\S]*?)<\/th>/g)].map(x => text(x[1]).trim()).filter(Boolean);
  const name = cap ? text(cap[1]).trim() : heads.length ? `Table: ${heads.slice(0, 4).join(', ')}` : 'Table';
  return esc(name.length > 90 ? name.slice(0, 87).replace(/\s+\S*$/, '') + '…' : name);
};
const wrapTables = html => html.replace(/(<div class="table-wrap"[^>]*>\s*)?<table\b([\s\S]*?)<\/table>(\s*<\/div>)?/g,
  (m, open, inner, close) => open && close ? m : `<div class="table-wrap" tabindex="0" role="region" aria-label="${tableLabel(inner)}"><table${inner}</table></div>`);
// "Report a problem" for a page of prose (notes, glossary), using the site's
// report dialog (assets/report-question.js) with its page wording. Audit
// 2026-10: until now only questions had the link.
const reportPage = (pageId) => `<p class="anp-report-page anp-nav-ref">Spot a mistake on this page? <button type="button" class="report-btn" data-report-kind="page" data-report-course="anp" data-report-question="${esc(pageId)}">Report a problem</button></p>`;
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
/* Later topics that build directly on this one: buildsOn() inverted. */
let leadsToIndex;
function leadsTo(id) {
  if (!leadsToIndex) {
    leadsToIndex = new Map();
    for (const u of builtTopics) for (const x of buildsOn(u.id)) {
      if (!leadsToIndex.has(x)) leadsToIndex.set(x, []);
      leadsToIndex.get(x).push(u.id);
    }
  }
  return leadsToIndex.get(id) || [];
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
  const desc = DESCRIPTIONS.lessons?.[id] || clampDesc(`${text(L.summary)}`, `${t.title}: a free anatomy and physiology lesson that builds the mechanism step by step, with practice questions.`);
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
  const nxBuilt = nx && C.built.has(nx.id);
  const fig = L.anatomy && L.anatomy.figure ? C.figures[L.anatomy.figure] : null;
  const earlier = buildsOn(id);
  // The lesson's parts in the spec's order (section 4). A part with nothing
  // in it is left out: Anatomy when the topic has no figure, Key ideas when
  // the chain names everything the lesson uses, Connections when there are
  // none, What this builds on when the topic depends on no earlier one, and
  // the Prerequisite check on the first topic (decision 68). Each part is a step in
  // the stepped view.
  const parts = [
    { id: 'hook', kind: 'Clinical hook', nav: 'Why this matters', h: 'Why this matters', cls: 'anp-hook', html: g(L.hook) },
    earlier.length && { id: 'builds-on', kind: 'Foundations', nav: 'What this builds on', h: 'What this builds on',
      html: `<nav class="anp-nav-ref" aria-label="Earlier topics"><ul class="anp-links">${earlier.map(x => `<li>${topicRef(x, depth)}</li>`).join('')}</ul></nav>` },
    (L.prereq || []).length && { id: 'prereq', kind: 'Prerequisite check', nav: 'Quick check', h: 'Quick check before you start',
      html: `<div class="anp-qs" data-set="prereq">${pageData.prereq.map((p, i) => questionHtml(p, i + 1)).join('')}</div>` },
    fig && { id: 'anatomy', kind: 'Anatomy panel', nav: 'Anatomy', h: 'Anatomy', html: `<figure class="anp-figure anp-anatomy">
        ${figureImg(C, L.anatomy.figure, depth, { topic: id })}
        <figcaption>${g(L.anatomy.caption || '')} ${credit(fig, { adapted: (fig.labels || []).some(l => l.box) })}</figcaption>
      </figure>
      ${(fig.labels || []).some(l => l.box) ? '<button type="button" class="btn-outline anp-toggle-labels" aria-pressed="false">Hide labels</button><p class="anp-hint">With labels hidden, select a box to reveal its label.</p>' : ''}` },
    { id: 'chain', kind: 'Causal chain', nav: 'How it works', h: 'How it works, step by step',
      html: `<ol class="anp-chain">${L.chain.map(s => `<li><span class="anp-cause">${g(s.cause)}</span><span class="anp-arrow" aria-hidden="true">→</span><span class="anp-effect">${g(s.effect)}</span></li>`).join('')}</ol>` },
    (L.ideas || []).length && { id: 'ideas', kind: 'Key ideas', nav: 'Key ideas', h: 'Key ideas',
      html: `<ul class="anp-ideas">${L.ideas.map(x => `<li>${g(x)}</li>`).join('')}</ul>` },
    { id: 'core', kind: 'Core concept', nav: 'Core concepts', h: 'Core concepts',
      html: `<p class="anp-core-tags anp-nav-ref">${t.coreConcepts.map(c => `<a class="anp-core" href="../concepts/${c}.html">${esc(coreById(c).name)}</a>`).join('')}</p>` },
    { id: 'misconception', kind: 'Misconception', nav: 'A common mistake', h: 'A common mistake', cls: 'anp-misconception',
      html: `<p class="anp-wrong"><b>The wrong idea:</b> ${g(L.misconception.wrong)}</p>
    <p class="anp-right"><b>What actually happens:</b> ${g(L.misconception.right)}</p>` },
    { id: 'check', kind: 'Retrieval check', nav: 'Check yourself', h: 'Check yourself',
      html: `<p class="anp-hint">Anything you miss goes into your review queue.</p>
    <div class="anp-qs" data-set="check">${pageData.check.map((q, i) => questionHtml(q, i + 1)).join('')}</div>` },
    { id: 'summary', kind: 'Summary', nav: 'Summary', h: 'Summary', html: g(L.summary) },
    { id: 'next', kind: 'Up next', nav: 'What comes next', h: 'What comes next',
      html: nx ? `<nav class="anp-nav-ref" aria-label="Next topic"><p>${nxBuilt ? `<a class="btn-press sm" href="${nx.id}.html">${esc(nx.title)} &rarr;</a>` : `Next in the course: ${esc(nx.title)} (${esc(chapterById(nx.chapter).title)}).`}</p></nav>` : '<p>This is the last topic in the course.</p>' },
    (L.connections || []).length && { id: 'connections', kind: 'Connections', nav: 'Connections', h: 'Connections',
      html: `<ul class="anp-links">${L.connections.map(c => `<li><a href="${esc(c.href)}">${esc(c.label)}</a></li>`).join('')}</ul>` },
  ].filter(Boolean);
  const later = leadsTo(id);
  const chip = x => C.built.has(x) ? `<a href="${x}.html">${esc(topicById(x).title)}</a>` : `<span class="anp-unbuilt">${esc(topicById(x).title)}</span>`;
  const chipRow = (label, html) => `<div class="anp-ls-row"><span class="anp-ls-label">${label}</span><div class="anp-ls-chips">${html}</div></div>`;
  const lede = (text(L.summary).match(/^.*?[.!?](?=\s|$)/) || [text(L.summary)])[0];
  const body = `
<body data-topic="${id}">
<div id="site-header"></div>
<div class="course-nav"></div>
<div class="xshell">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../chapters/${ch.id}.html` }, { name: t.title }], depth)}
</div>
<div class="xshell anp-ls">
  <aside class="anp-ls-rail anp-nav-ref" aria-label="Lesson parts">
    <p class="anp-ls-k">Chapter ${chapterNumber(ch.id)} · ${esc(ch.title)}</p>
    <p class="anp-ls-links"><a href="../chapters/${ch.id}.html">&larr; Back to the chapter</a><a href="../notes/${id}.html"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/></svg>Read the notes</a></p>
    <div class="anp-ls-prog" hidden><div class="anp-ls-track"><div class="anp-ls-fill"></div></div><span class="anp-ls-count">Step 1 / ${parts.length}</span></div>
    <ol class="anp-ls-steps">${parts.map((p, i) => `<li><a href="#${p.id}"><span class="n">${i + 1}</span><span class="t">${p.nav}</span></a></li>`).join('')}</ol>
  </aside>
  <main id="main" class="anp-ls-main anp-lesson">
  <header class="anp-ls-hero">
    <div class="eyebrow">Chapter ${chapterNumber(ch.id)} · ${esc(ch.title)} · Topic ${topicNumber(id)} ${BETA_PILL}</div>
    <h1>${esc(t.title)}</h1>
    <p class="lede">${esc(lede)}</p>
    <p class="anp-tags anp-nav-ref"><span class="anp-tag">A&amp;P ${t.course}</span><span class="anp-tag">${esc(t.kind)}</span></p>
  </header>
  <div class="anp-ls-card">
${parts.map((p, i) => `  <section class="anp-part anp-step" id="${p.id}" aria-labelledby="h-${p.id}">
    <p class="anp-step-k">Part ${i + 1} · ${p.kind}</p>
    <h2 id="h-${p.id}" tabindex="-1">${p.h}</h2>
    <div class="anp-step-body${p.cls ? ` ${p.cls}` : ''}">${p.html}</div>
  </section>`).join('\n')}
    <div class="anp-ls-actions anp-nav-ref" hidden><button type="button" class="anp-ls-back">&larr; Previous</button><button type="button" class="anp-ls-go">Continue &rarr;</button><a class="anp-ls-go" hidden href="${nxBuilt ? `${nx.id}.html">Next lesson` : `../chapters/${ch.id}.html">Back to the chapter`} &rarr;</a></div>
  </div>
  <nav class="anp-ls-related anp-nav-ref" aria-label="Related lessons">
    ${chipRow('Read', `<a href="../notes/${id}.html">${esc(t.title)} notes</a>`)}
    ${earlier.length ? chipRow('Builds on', earlier.map(chip).join('')) : ''}
    ${later.length ? chipRow('Leads to', later.slice(0, 6).map(chip).join('') + (later.length > 6 ? `<details><summary>${later.length - 6} more</summary>${later.slice(6).map(chip).join('')}</details>` : '')) : ''}
  </nav>
  ${disclaimer(L.hook + L.summary)}
  </main>
</div>
${footer(depth)}
<script type="application/json" id="anp-page-data">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
<script src="../../assets/report-question.js" defer></script>
${tail({ depth, section: 'learn', extra: ['anp-questions.js', 'anp-lesson.js'], premium: true })}
</body>
</html>
`;
  return head({ title, desc, path: `lessons/${id}.html`, depth, jsonld, meta: `<meta name="anp-topic" content="${id}">\n` }) + body;
}

/* ------------------------------------------- textbook frame (chapter, notes) */

/* Chapter and notes pages share the ochem textbook frame (theme.css tb-*): a
   sticky contents rail beside the page, a "Contents" drawer on a phone. The
   rail is navigation, so it sits in anp-nav-ref (decision 31). anp-toc.js
   fills in progress (lessons done), ticks and mastery chips from AnpCore. */
const partTitle = id => map.parts.find(p => p.id === id).title;
const tocProg = (total, label, chId = '') =>
  `<div class="anp-toc-prog" data-toc-prog="${chId}"><div class="tb-progress-row"><span><b>0</b> of ${total} ${label}</span><span class="anp-toc-pct">0%</span></div><div class="tb-progress-track"><div class="tb-progress-fill" style="width:0%"></div></div></div>`;
const tocBtn = label => `<button type="button" class="tb-toc-btn" aria-controls="anp-rail" aria-expanded="false">&#9776; ${label}</button>`;
const chip = id => `<span class="anp-tb-chip" data-chip-topic="${id}">Not practiced</span>`;

/* The whole course, the current chapter open to its topics (chapter pages).
   With book set (learn.html, depth '') every built chapter carries its topics
   (links to the notes pages, so the rail works without JavaScript), all closed;
   anp-book.js opens the chapter it is showing. */
function courseRail(curId, depth = '../', book = false) {
  const chDir = depth ? '' : 'chapters/';
  const groups = map.parts.map(p => `<p class="anp-toc-group">${esc(p.title)}</p>` + map.chapters.filter(c => c.part === p.id).map(ch => {
    const ts = topicsOf(ch.id), n = chapterNumber(ch.id), cur = ch.id === curId;
    const inner = `<span class="tb-toc-num">${n}</span><span class="tb-toc-modtitle">${esc(ch.title)}</span><span class="tb-toc-count" data-toc-ch="${ch.id}">0/${ts.filter(t => C.built.has(t.id)).length}</span>`;
    const headEl = !chapterBuilt(ch) ? `<span class="tb-toc-modhead anp-unbuilt">${inner}</span>`
      : `<a class="tb-toc-modhead" href="${cur ? '#main' : `${chDir}${ch.id}.html`}"${cur ? ' aria-current="page"' : ''}${book ? ` data-book-ch="${ch.id}"` : ''}>${inner}</a>`;
    const topics = cur || (book && chapterBuilt(ch)) ? `<div class="tb-toc-topics">${ts.filter(t => C.built.has(t.id)).map(t => `<a class="tb-toc-topic" href="${depth}${book ? 'notes' : 'lessons'}/${t.id}.html" data-toc-t="${t.id}"><span class="tb-toc-tick"></span>${esc(t.title)}</a>`).join('')}</div>` : '';
    return `<div class="tb-toc-mod${cur ? ' open' : ''}"${book && ch.part !== 'foundations' ? ` data-course="${ch.course}"` : ''}>${headEl}${topics}</div>`;
  }).join('')).join('');
  return `<aside class="tb-rail anp-nav-ref" id="anp-rail">
    <p class="tb-rail-title">Contents</p>
    ${tocProg(builtTopics.length, 'lessons done')}
    <form class="anp-toc-search" action="${depth}search.html" method="get" role="search"><input type="search" name="q" class="tb-filter" placeholder="Search A&amp;P&hellip;" aria-label="Search A&amp;P"></form>
    ${book ? '<label class="anp-filter">Show <select id="course-filter"><option value="">A&amp;P I and II</option><option value="I">A&amp;P I only</option><option value="II">A&amp;P II only</option></select></label>\n    ' : ''}<nav class="tb-contents" aria-label="Course contents">${groups}</nav>
  </aside>`;
}

/* One chapter, the current topic open to its sections (notes pages). */
function notesRail(id, sections) {
  const t = topicById(id), ch = chapterById(t.chapter), ci = chapterNumber(ch.id) - 1;
  const ts = topicsOf(ch.id).filter(x => C.built.has(x.id));
  const other = c => c && chapterBuilt(c) ? `<a class="anp-toc-other" href="../chapters/${c.id}.html"><span class="anp-toc-n">${chapterNumber(c.id)}</span>${esc(c.title)}</a>` : '';
  const onPage = sections.length ? `<div class="anp-toc-onpage"><p>On this page</p>${sections.map(s => `<a href="#${s.id}">${esc(s.title)}</a>`).join('')}</div>` : '';
  return `<aside class="tb-rail anp-nav-ref anp-notes-rail" id="anp-rail">
    <p class="tb-rail-title">Contents</p>
    ${other(map.chapters[ci - 1])}
    <a class="anp-toc-chap" href="../chapters/${ch.id}.html"><span class="anp-toc-chap-n">${ci + 1}</span><span><b>${esc(ch.title)}</b><small>${ts.length} topics &middot; A&amp;P ${ch.course}</small></span></a>
    ${tocProg(ts.length, 'lessons done', ch.id)}
    <nav class="tb-contents" aria-label="Chapter contents"><ol class="anp-toc-list">${ts.map(x => x.id === id
      ? `<li class="current" data-toc-t="${x.id}"><a href="#main" aria-current="page"><span class="anp-toc-n">${topicNumber(x.id)}</span>${esc(x.title)}</a>${onPage}</li>`
      : `<li data-toc-t="${x.id}"><a href="${x.id}.html"><span class="anp-toc-n">${topicNumber(x.id)}</span>${esc(x.title)}</a></li>`).join('')}</ol></nav>
    ${other(map.chapters[ci + 1])}
  </aside>`;
}

/* -------------------------------------------------------------- notes */

/* Gives every h2 an id (kept if authored) for the "On this page" list. */
function sectionIds(html) {
  const used = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  const sections = [];
  const out = html.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/g, (m, attrs, inner) => {
    const title = text(inner);
    let hid = (attrs.match(/\bid="([^"]+)"/) || [])[1];
    if (!hid) {
      const base = title.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').split('-').slice(0, 6).join('-') || 'section';
      hid = base; for (let i = 2; used.has(hid); i++) hid = `${base}-${i}`;
      used.add(hid);
      attrs = ` id="${hid}"${attrs}`;
    }
    sections.push({ id: hid, title });
    return `<h2${attrs}>${inner}</h2>`;
  });
  return { html: out, sections };
}

function notesPage(id) {
  const t = topicById(id), ch = chapterById(t.chapter);
  const depth = '../';
  const seen = new Set();
  const { html: withIds, sections } = sectionIds(C.notes[id]);
  let html = renderFigures(C, withIds, depth, id);
  html = glossify(C, html, { depth, topic: id, seen, index: INDEX });
  // The opening two paragraphs: the first is often a one-line hook.
  const firstP = [...C.notes[id].matchAll(/<p>([\s\S]*?)<\/p>/g)].slice(0, 2).map(m => m[1]).join(' ') || t.title;
  const minutes = Math.max(1, Math.round(text(C.notes[id]).split(' ').length / 200));
  const title = clampTitle([
    `${t.title}: Notes | ${COURSE_NAME}`,
    `${t.title}: Notes | A&P`,
    `${t.title} | A&P notes`,
    `A&P notes: ${t.title}`,
  ]);
  const desc = DESCRIPTIONS.notes?.[id] || clampDesc(firstP, `${t.title} explained in plain language: free anatomy and physiology study notes with labeled figures.`);
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
  const link = (x, dir) => x && C.built.has(x.id)
    ? `<a class="tb-chapter-link${dir === 'next' ? ' next' : ''}" href="${x.id}.html"><span>${dir === 'next' ? `Topic ${topicNumber(x.id)} &rarr;` : `&larr; Topic ${topicNumber(x.id)}`}</span><b>${esc(x.title)}</b></a>` : '';
  const body = `
<body data-topic="${id}">
<div id="site-header"></div>
<div class="course-nav"></div>
<div class="tb-shell anp-tb anp-notes">
  ${tocBtn(`Chapter ${chapterNumber(ch.id)} contents`)}
  ${notesRail(id, sections)}
  <main class="tb-main" id="main">
    ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../chapters/${ch.id}.html` }, { name: `${t.title}: notes` }], depth)}
    <div class="anp-pillbar"><a class="anp-pill" href="../lessons/${id}.html"><i aria-hidden="true">&#9654;</i>Practice this lesson</a></div>
    <header class="anp-notes-head">
      <p class="anp-notes-eyebrow">Chapter ${chapterNumber(ch.id)} &middot; Topic ${topicNumber(id)} of ${map.topics.length} ${BETA_PILL}</p>
      <h1 class="anp-notes-title">${esc(t.title)}</h1>
      <p class="anp-tags anp-notes-meta anp-nav-ref"><span class="anp-tag">A&amp;P ${t.course}</span>${t.coreConcepts.map(c => `<a class="anp-tag" href="../concepts/${c}.html">${esc(coreById(c).name)}</a>`).join('')}<span class="anp-small">${minutes} min read</span>${chip(id)}</p>
    </header>
    <article class="anp-prose">
${html}
    </article>
    ${disclaimer(html)}
    ${reportPage(`notes:${id}`)}
    <nav class="tb-chapter-nav anp-nav-ref" aria-label="Topic navigation">${link(pv, 'prev')}${link(nx, 'next')}</nav>
  </main>
</div>
${footer(depth)}
${tail({ depth, section: 'learn', extra: ['anp-toc.js'], site: ['report-question.js'] })}
</body>
</html>
`;
  return head({ title, desc, path: `notes/${id}.html`, depth, jsonld, meta: `<meta name="anp-topic" content="${id}">\n` }) + body;
}

/* ------------------------------------------------------------ chapter */

const TOOL_KINDS = [
  ['labSets', 'Lab practical image sets', 'lab sets'], ['predictionThemes', 'Prediction scenarios', 'prediction scenarios'],
  ['pathways', 'Pathways', 'pathways'], ['feedbackLoops', 'Feedback loops', 'feedback loops'], ['graphs', 'Graphs', 'graphs'],
  ['calculators', 'Calculators', 'calculators'], ['comparisonTables', 'Comparison tables', 'comparison tables'],
];

function chapterPage(chId) {
  const ch = chapterById(chId), depth = '../';
  const ts = topicsOf(chId);
  const tools = ch.tools || {};
  const kinds = TOOL_KINDS.filter(([k]) => (tools[k] || []).length);
  const toolGroups = kinds.map(([k, label]) => `<section class="anp-chap-toolset"><h3>${label} <small>${tools[k].length}</small></h3><ul>${tools[k].map(it => `<li>${it.level ? `<span class="anp-tag">Level ${it.level}</span> ` : ''}${esc(it.title)}</li>`).join('')}</ul></section>`).join('');
  const toolSummary = kinds.map(([k, , few]) => `${tools[k].length} ${few}`).slice(0, 3).join(', ');
  const title = clampTitle([`${ch.title} | ${COURSE_NAME}`, `${ch.title} | A&P`]);
  const desc = DESCRIPTIONS.chapters?.[chId] || clampDesc(`${ch.title}: ${ts.length} topics, from ${ts[0].title.toLowerCase()} to ${ts[ts.length - 1].title.toLowerCase()}, with lessons, notes, practice questions and study tools.`, `${ch.title} in ${ts.length} topics: free anatomy and physiology lessons, notes, practice questions and study tools.`);
  const url = `${SITE}${BASE}chapters/${chId}.html`;
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': `${url}#chapter`, name: ch.title, url, description: desc, isPartOf: { '@id': COURSE_ID } },
    crumbs(orgCrumbs([{ name: ch.title, url }])),
  ] };
  const n = chapterNumber(chId);
  const chLink = (c, dir) => c && chapterBuilt(c)
    ? `<a class="tb-chapter-link${dir === 'next' ? ' next' : ''}" href="${c.id}.html"><span>${dir === 'next' ? `Chapter ${chapterNumber(c.id)} &rarr;` : `&larr; Chapter ${chapterNumber(c.id)}`}</span><b>${esc(c.title)}</b></a>` : '';
  const body = `
<body data-chapter="${chId}">
<div id="site-header"></div>
<div class="course-nav"></div>
<div class="tb-shell anp-tb anp-chapter">
  ${tocBtn('Contents')}
  ${courseRail(chId)}
  <main class="tb-main" id="main">
    ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title }], depth)}
    <header class="tb-chapter-head anp-chap-head">
      <div>
        <p class="tb-chapter-eyebrow">Chapter ${n} of ${map.chapters.length} &middot; ${esc(partTitle(ch.part))}</p>
        <h1 class="tb-chapter-title">${esc(ch.title)}</h1>
        <p class="tb-chapter-meta">${ts.length} topics &middot; A&amp;P ${ch.course} &middot; <span data-chap-meta="${chId}">not practiced yet</span></p>
      </div>
      <p class="anp-chap-acts"><a class="anp-tb-btn solid" href="../practice.html?chapter=${chId}">Chapter quiz</a><a class="anp-tb-btn ghost" href="../exams.html?chapter=${chId}">System exam</a></p>
    </header>
    <h2 class="anp-chap-h" id="h-topics">Topics</h2>
    <ol class="anp-chap-list" aria-labelledby="h-topics">${ts.map(t => `<li class="anp-chap-row" data-topic="${t.id}"><span class="anp-chap-n">${topicNumber(t.id)}</span>${C.built.has(t.id)
      ? `<a class="anp-chap-title" href="../lessons/${t.id}.html">${esc(t.title)}</a>${chip(t.id)}<span class="anp-chap-btns"><a class="anp-tb-btn solid" href="../lessons/${t.id}.html" aria-label="Lesson: ${esc(t.title)}">Lesson</a><a class="anp-tb-btn ghost" href="../notes/${t.id}.html" aria-label="Notes: ${esc(t.title)}">Notes</a></span>`
      : `<span class="anp-chap-title anp-unbuilt">${esc(t.title)}</span><span class="anp-small">In a later part of the course</span>`}</li>`).join('')}</ol>
    <h2 class="anp-chap-h" id="h-practice">Practice this chapter</h2>
    <div class="anp-chap-practice">
      <a class="anp-chap-card" href="../practice.html?chapter=${chId}"><b>Chapter quiz</b><span>Questions from this chapter's ${ts.length} topics.</span></a>
      <a class="anp-chap-card" href="../exams.html?chapter=${chId}"><b>System exam</b><span>A timed exam on the whole chapter, up to 40 questions.</span></a>
      <a class="anp-chap-card" href="../tools.html?chapter=${chId}"><b>Tools for this chapter</b><span>${toolSummary ? `${toolSummary} and more.` : 'Interactive study tools.'}</span></a>
    </div>
    ${toolGroups ? `<h2 class="anp-chap-h" id="h-tools">In this chapter's tools</h2>
    <div class="anp-chap-tools">${toolGroups}</div>` : ''}
    <nav class="tb-chapter-nav anp-nav-ref" aria-label="Chapter navigation">${chLink(map.chapters[n - 2], 'prev')}${chLink(map.chapters[n], 'next')}</nav>
  </main>
</div>
${footer(depth)}
${tail({ depth, section: 'learn', extra: ['anp-chapter.js', 'anp-toc.js'] })}
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
    <p class="lede">Figures marked OpenStax come from J. Gordon Betts et al., <a href="https://openstax.org/details/books/anatomy-and-physiology-2e"><i>Anatomy and Physiology 2e</i></a>, OpenStax, &copy; Rice University, used under <a href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a>. We resize them, and where a figure's printed labels are hidden (lessons, the lab practical, identification questions, and labels a page has not taught yet) its caption says "Adapted: labels hidden". A figure OpenStax credits to another source carries that source's own credit line and license as well. OpenStax and Rice University do not endorse LevlPrep. Every other diagram in the course is drawn for it.</p></header>
  <div class="table-wrap" tabindex="0" role="region" aria-label="Figure credits table"><table class="anp-credit-table"><thead><tr><th scope="col">Figure</th><th scope="col">Used in</th><th scope="col">Credit and license</th><th scope="col">Changes</th></tr></thead><tbody>
  ${rows.map(({ id, f, t }) => {
    const n = (f.openstax && f.openstax.figure) ? `OpenStax Figure ${f.openstax.figure}` : id;
    const changes = (f.labels || []).some(l => l.box) ? 'Resized; labels hidden where shown masked' : 'Resized';
    return `<tr><td>${esc(n)}</td><td><a href="notes/${t.id}.html">${esc(t.title)}</a></td><td>${attribution(f).html}</td><td>${changes}</td></tr>`;
  }).join('\n  ')}
  </tbody></table></div>
</main>
${footer(depth)}
${tail({ depth, section: 'credits' })}
</body>
</html>
`;
  return head({ title, desc, path: 'credits.html', depth, ogType: 'website', jsonld }) + body;
}

/* ----------------------------------------------------------- glossary */

/* Styles only the glossary page uses, inlined in its <head> so the shared
   anp.css (on the critical path of every A&P page) does not carry them. The
   A-Z bar stays under the header while the index scrolls; on a phone it is one
   swipeable row. Letters and terms land below the header and the bar. */
const GLOSSARY_CSS = `.anp-letters-hint{display:none;margin:4px 0 0;}
.anp-letters{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 16px;position:sticky;top:var(--site-header-h,60px);z-index:5;padding:8px 0;background:var(--paper);}
.anp-letters a{padding:4px 9px;border-radius:8px;background:var(--ctint);color:var(--cink);font:900 13px var(--font-ui);text-decoration:none;}
.anp-letters a.on{background:var(--cink);color:var(--paper);}
@media (max-width:640px){.anp-letters{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding-right:32px;-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 32px),transparent);mask-image:linear-gradient(to right,#000 calc(100% - 32px),transparent);}.anp-letters-hint{display:block;}.anp-letters a{flex:0 0 auto;padding:7px 11px;}}
.anp-terms{margin:0;}
.anp-glossary .anp-letter,.anp-glossary .anp-term,.anp-glossary .anp-term-index li{scroll-margin-top:calc(var(--site-header-h,60px) + 64px);}
.anp-letter{margin:0 0 22px;}
.anp-letter > .anp-gl-more{margin:0 0 8px;}
.anp-terms-full{margin:0;}
.anp-letter h2{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:0 0 6px;}
.anp-term-index{list-style:none;margin:0;padding:0;line-height:1.9;}
.anp-term-index li{display:inline;font-weight:700;}
.anp-term-index li:not(:last-child)::after{content:" \\00b7 ";color:var(--muted);}
.anp-gl-more{font:800 13px var(--font-ui);padding:5px 12px;border-radius:999px;border:2px solid var(--line, rgba(0,0,0,0.12));background:var(--white);color:var(--ink);cursor:pointer;}
.anp-gl-more:hover{border-color:var(--cink);}
.anp-term:target,.anp-term.hit{background:var(--ctint);border-radius:8px;padding-left:8px;padding-right:8px;}
.anp-gl-results .anp-small{margin:4px 0 10px;}
.anp-term{padding:10px 0;border-bottom:1px solid var(--line, rgba(0,0,0,0.08));}
.anp-term dt{font-weight:900;}
.anp-term dd{margin:3px 0 0;font-weight:600;line-height:1.6;}
.anp-roots{display:block;color:var(--muted);font-size:13.5px;}
.anp-say{color:var(--muted);font-weight:700;font-size:13.5px;}`;

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
  /* The page is an index, not the definitions. Written out in full, a
     thousand definitions made a 700 KB page about 270,000 px tall on a phone.
     The file carries every term once, under its letter, as a link to the page
     that teaches it (and the anchor #t-<concept> other pages link to);
     anp-glossary-page.js draws a letter's definitions from
     assets/glossary.json when that letter is opened, and the filter searches
     terms and their aliases (data-a). */
  const body = `
<body>
<div id="site-header"></div>
<div class="course-nav"></div>
<main id="main" class="xshell anp-glossary">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Glossary' }], depth)}
  <header class="hero anp-hero"><div class="eyebrow">${COURSE_NAME}</div><h1>Glossary</h1><p class="lede">${entries.length} terms${C.built.size === map.topics.length ? '' : ' so far'}, with plain definitions, word roots and pronunciation. Each one links to the page that teaches it.</p>
    <label class="anp-filter">Find a term <input type="search" id="gl-filter" autocomplete="off" aria-controls="gl-results"></label>
    <p class="anp-small" id="gl-status" role="status" aria-live="polite"></p></header>
  <p class="anp-letters-hint anp-small" aria-hidden="true">Swipe the letters for ${letters[letters.length - 1]} &rarr;</p>
  <nav class="anp-letters" aria-label="Jump to letter">${letters.map(l => `<a href="#l-${l}">${l}</a>`).join('')}</nav>
  <div id="gl-results" class="anp-gl-results" hidden></div>
  <div class="anp-terms" id="gl-index">${letters.map(l => {
    const here = entries.filter(e => e.c.term[0].toUpperCase() === l);
    return `<section class="anp-letter" id="l-${l}" aria-labelledby="h-${l}"><h2 id="h-${l}">${l} <span class="anp-small">${here.length} term${here.length === 1 ? '' : 's'}</span></h2><ul class="anp-term-index">${here.map(({ c }) => {
      const href = C.built.has(c.taughtIn) ? `notes/${c.taughtIn}.html` : null;
      const aliases = c.aliases.filter(a => a.toLowerCase() !== c.term.toLowerCase());
      return `<li id="t-${c.id}"${aliases.length ? ` data-a="${esc(aliases.join('|'))}"` : ''}>${href ? `<a href="${href}">${esc(c.term)}</a>` : esc(c.term)}</li>`;
    }).join('')}</ul></section>`;
  }).join('\n  ')}</div>
  ${reportPage('glossary')}
</main>
${footer(depth)}
${tail({ depth, section: 'glossary', extra: ['anp-glossary-page.js'], site: ['report-question.js'] })}
</body>
</html>
`;
  return head({ title, desc, path: 'glossary.html', depth, ogType: 'website', jsonld }).replace('</head>', `<style>${GLOSSARY_CSS}</style>\n</head>`) + body;
}

/* -------------------------------------------------------- learn, home */

/* learn.html, the Learn tab: the course as one textbook, like ochem's Learn.
   The contents rail lists every chapter and topic; anp-book.js shows the
   chosen chapter in the main column, each topic's notes one after another,
   fetched from the notes pages. Without JavaScript the main column is a plain
   table of contents linking to every notes page. */
function learnPage() {
  const depth = '';
  const title = `All chapters and topics | ${COURSE_NAME}`;
  const desc = clampDesc(`Every chapter of the course in order: ${map.chapters.length} chapters and ${map.topics.length} topics, from orientation to the body through development and inheritance.`);
  const url = `${SITE}${BASE}learn.html`;
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': `${url}#learn`, name: 'All chapters', url, description: desc, isPartOf: { '@id': COURSE_ID } },
    crumbs(orgCrumbs([{ name: 'All chapters', url }])),
  ] };
  const toc = map.chapters.map(ch => {
    const ts = topicsOf(ch.id).filter(t => C.built.has(t.id));
    return `<section class="tb-static-chapter"><h2>${chapterNumber(ch.id)}. ${esc(ch.title)}</h2>${ts.length ? `<ol>${ts.map(t => `<li><a href="notes/${t.id}.html">${esc(t.title)}</a></li>`).join('')}</ol>` : '<p>In a later part of the course.</p>'}</section>`;
  }).join('\n        ');
  const body = `
<body>
<div id="site-header"></div>
<div class="course-nav"></div>
<div class="tb-shell anp-tb anp-book">
  ${tocBtn('Contents')}
  ${courseRail(null, depth, true)}
  <main class="tb-main" id="main">
    ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'All chapters' }], depth)}
    <div id="anp-book" aria-live="polite">
      <div class="tb-static-toc">
        <h1>The Anatomy &amp; Physiology textbook</h1>
        <p>${map.chapters.length} chapters and ${builtTopics.length} topics, Foundations first, then every body system. Every topic below is a page you can read on its own.</p>
        ${toc}
      </div>
    </div>
  </main>
</div>
${footer(depth)}
${tail({ depth, section: 'learn', extra: ['anp-toc.js', 'anp-book.js'] })}
</body>
</html>
`;
  return head({ title, desc, path: 'learn.html', depth, ogType: 'website', jsonld }) + body;
}

/* The course home. Laid out like ochem's home: a hero with the level card,
   three "what now" cards, the chapter path, the tools panel, one real question
   to try, and the links to every study page. The markup is the first-visit
   state and reads on its own without JavaScript; assets/anp-home.js fills the
   level card, the three cards and the path from the runtime. */
const PART_COLORS = { foundations: ['#2C9C8B', '#1F7A6C'], api: ['#E8776A', '#B04A3F'], apii: ['#C9973A', '#8A6420'] };
const HOME_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
// The "Try a step" card: one real question from the bank, read at build time.
const SAMPLE_Q = { topic: 'gradients-flow', id: 'anp-gradients-flow-3' };
const STREAK_SVG = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2c1 4-3 5-3 9a3 3 0 006 0c1.5 1 2 3 2 4.5A5.5 5.5 0 0111.5 21 6 6 0 016 15c0-5 4-6 4-9 0-1.5-.5-2.5-1-3.5C10.5 2 11 2 12 2z" fill="currentColor"/></svg>';

function homePath(depth) {
  let prevPart = null;
  const nodes = map.chapters.map((ch, i) => {
    const [pc, pcd] = PART_COLORS[ch.part] || PART_COLORS.foundations;
    const start = ch.part !== prevPart; prevPart = ch.part;
    const part = map.parts.find(p => p.id === ch.part);
    const n = topicsOf(ch.id).length, built = chapterBuilt(ch);
    const inner = `<span class="ring" aria-hidden="true"><span class="n">${i + 1}</span></span><span class="label">${start ? `<span class="part">${esc(part.title)}</span>` : ''}<b>${esc(ch.title)}</b><small>${i === 0 ? 'Start here · ' : ''}${n} topics${built ? '' : ' · coming in a later part'}</small></span>`;
    // Snake placement for 5, 4 and 3 columns (anp.css picks one by width).
    const at = [5, 4, 3].map(k => { const r = Math.floor(i / k), c = r % 2 ? k - (i % k) : (i % k) + 1; return `--r${k}:${r + 1};--c${k}:${c}`; }).join(';');
    return `<li class="node${start ? ' part-start' : ''}${i === 0 ? ' current' : ''}" data-chapter="${ch.id}" style="--pc:${pc};--pcd:${pcd};${at}">${built ? `<a href="${depth}chapters/${ch.id}.html">${inner}</a>` : `<div>${inner}</div>`}</li>`;
  });
  return `<div class="anp-path anp-nav-ref" id="anpPath"><svg class="path-line" aria-hidden="true" focusable="false"><path class="path-track" d=""/><path class="path-fill" d=""/></svg><ol class="anp-path-list">${nodes.join('')}</ol></div>`;
}

function homeSample(depth) {
  const t = topicById(SAMPLE_Q.topic);
  const q = C.built.has(SAMPLE_Q.topic) && (C.questions[SAMPLE_Q.topic] || []).find(x => x.id === SAMPLE_Q.id);
  if (!q) return '';
  const ch = chapterById(t.chapter);
  const opts = q.options.map((o, i) => `<button type="button" class="qopt" data-i="${i}"${q.why.options ? ` data-why="${esc(q.why.options[i])}"` : ''}><span class="letter">${'ABCDEFG'[i]}</span> ${esc(o)}</button>`).join('');
  return `
  <section class="xsection" id="sample" aria-labelledby="h-sample">
    <div class="anp-sample-row">
      <div>
        <h2 id="h-sample">Try a step.</h2>
        <p class="section-lede">One real question from the bank. Pick an answer to see why it is right or wrong.</p>
        <ol class="anp-sample-list">
          <li><span class="n" aria-hidden="true">1</span> Read what changed</li>
          <li><span class="n" aria-hidden="true">2</span> Pick the answer you would bet on</li>
          <li><span class="n" aria-hidden="true">3</span> See the cause and effect behind it</li>
        </ol>
      </div>
      <div class="anp-qcard" id="anpSample" data-correct="${q.correct}">
        <span class="tag domain">${esc(ch.title)}</span> <span class="tag diff">${esc(t.title)}</span>
        <p class="qtext" id="anpSampleQ">${esc(q.q)}</p>
        <div class="anp-qopts" role="group" aria-labelledby="anpSampleQ">${opts}</div>
        <p class="why" id="anpSampleWhy" aria-live="polite"></p>
        <details class="anp-sample-key"><summary>Show the answer</summary><p><b>${esc(q.options[q.correct])}.</b> ${esc(q.why.correct)}</p></details>
        <p class="anp-sample-more"><a class="link-quiet" href="${depth}lessons/${t.id}.html">Open the lesson on ${esc(t.title.toLowerCase())} &rarr;</a></p>
      </div>
    </div>
  </section>`;
}

function homePage() {
  const depth = '';
  const nb = builtTopics.length;
  const title = 'Free Anatomy & Physiology Course | LevlPrep';
  const desc = 'Free anatomy and physiology course: lessons that build in strict order, mechanism-first physiology, a virtual lab practical and TEAS A&P practice.';
  const url = `${SITE}${BASE}`;
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Course', '@id': COURSE_ID, name: COURSE_NAME, url, description: desc, inLanguage: 'en', isAccessibleForFree: true,
      provider: { '@id': `${SITE}/#org` }, educationalLevel: 'Undergraduate',
      hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: 'Self-paced' },
      syllabusSections: map.chapters.map(c => ({ '@type': 'Syllabus', name: c.title })) },
    crumbs(orgCrumbs([])),
  ] };
  const first = map.topics.find(t => C.built.has(t.id));
  const firstCh = first && chapterById(first.chapter);
  const partCount = id => map.chapters.filter(c => c.part === id).length;
  const tools = PAGES.tools;
  const bars = map.parts.map(p => `<div class="mini-domain-row"><span>${esc(p.title)}</span><span class="bar"><i data-part-bar="${p.id}" style="width:0%;--dc:${PART_COLORS[p.id][0]}"></i></span><span class="pct" data-part-pct="${p.id}">0%</span></div>`).join('');
  const body = `
<body>
<div id="site-header"></div>
<div class="course-nav"></div>
<main id="main" class="xshell anp-home">
  <header class="hero anp-home-hero">
    <div>
      <div class="eyebrow">${COURSE_NAME} ${BETA_PILL}</div>
      <h1>Anatomy &amp; physiology that builds in order.</h1>
      <p class="lede">${HOME_WORDS[map.chapters.length] || map.chapters.length} chapters and ${map.topics.length} topics, each taught before it is used. Physiology is taught as mechanism: what causes what, one step at a time. Practice sits inside the reading.</p>
      <div class="hero-ctas">${first ? `<a class="btn-press" id="heroPrimaryCta" href="lessons/${first.id}.html">Start here</a><script>try{var d=JSON.parse(localStorage.getItem('anp_progress_v1')||'null');if(d&&(Object.keys(d.lessons||{}).length||Object.keys(d.q||{}).length))heroPrimaryCta.classList.add('cta-pending')}catch(e){}</script>` : ''}<a class="link-quiet" href="learn.html">All chapters &rarr;</a><a class="link-quiet" href="tools/predict.html">Predict the change &rarr;</a></div>
    </div>
    <div class="anp-level-card" id="anpLevel">
      <div class="anp-level-top">
        <div class="anp-level-chip"><div class="level-ring" id="anpLvRing">L1</div><div class="t"><b id="anpLvTitle">Cell Scout</b><span id="anpLvSub">Level 1 &middot; 0 XP</span></div></div>
        <div class="streak-chip" id="anpStreak" hidden title="Day streak, across every subject">${STREAK_SVG}<span id="anpStreakN">0</span></div>
      </div>
      <div class="xp-track"><div class="xp-fill" id="anpXpFill" style="width:0%"></div></div>
      <div class="xp-label" id="anpXpLabel">0 / 100 XP to Level 2</div>
      <div class="anp-part-bars">${bars}</div>
    </div>
  </header>

  <section class="xsection" aria-label="What to do now">
    <div class="anp-now-row">
      <div class="anp-now-card" id="anpStart">
        <div class="k">Start here</div>
        ${first ? `<h2>${esc(first.title)}</h2>
        <p>Foundations &middot; ${esc(firstCh.title)}. Foundations is recommended, not required: nothing is locked.</p>
        <a class="btn-press" href="lessons/${first.id}.html">Start the first lesson</a>` : `<h2>Pick any chapter</h2><p>Nothing is locked.</p>`}
      </div>
      <div class="anp-now-card" id="anpReview">
        <div class="k">Review queue</div>
        <h2>Missed questions come back</h2>
        <p>Anything you miss returns when you are about to forget it, not on a fixed date.</p>
        <a class="link-quiet" href="review.html">Open review &rarr;</a>
      </div>
      <div class="anp-now-card" id="anpGoal">
        <div class="k">Today&rsquo;s goal</div>
        <h2>A little every day</h2>
        <p>Questions, cards and tool steps count toward a daily goal and a streak shared across every LevlPrep subject.</p>
        <a class="link-quiet" href="practice.html">Practice now &rarr;</a>
      </div>
    </div>
  </section>

  <section class="xsection" aria-labelledby="h-path">
    <div class="section-head">
      <h2 id="h-path">The path through the course</h2>
      <p class="section-lede">Foundations first, then A&amp;P I and A&amp;P II. Each chapter leans on the last. Tap one to open it.</p>
    </div>
    <div class="anp-path-legend">${map.parts.map(p => `<span style="--c:${PART_COLORS[p.id][0]}"><i></i>${esc(p.title)} &middot; ${partCount(p.id)} chapters</span>`).join('')}</div>
    ${homePath(depth)}
  </section>

  <section class="xsection anp-home-about" aria-label="About the course">
    <div>
      <h2 id="h-covers">What the course covers</h2>
      <p>${map.chapters.length} chapters and ${map.topics.length} topics: the full scope of a two-semester college A&amp;P course, matched to the OpenStax <i>Anatomy and Physiology 2e</i> textbook, the HAPS learning outcomes and the TEAS&nbsp;7 A&amp;P content areas. Each topic has an interactive lesson and a full notes page.</p>
      <p class="anp-small">${nb === map.topics.length ? `All ${nb} topics are built, each with its lesson, notes and questions.` : `So far, ${nb} of ${map.topics.length} topics are built. The rest are listed so you can see where everything fits; they arrive chapter by chapter.`}</p>
    </div>
    <div>
      <h2 id="h-how">How to use it</h2>
      <ol class="anp-sample-list anp-how">
        <li><span class="n" aria-hidden="true">1</span><span><b>Read the lesson.</b> It opens with a patient, checks what you need first, then walks the mechanism one cause at a time.</span></li>
        <li><span class="n" aria-hidden="true">2</span><span><b>Answer as you go.</b> Anything you miss goes into your review queue and comes back when you are about to forget it.</span></li>
        <li><span class="n" aria-hidden="true">3</span><span><b>Use the tools.</b> Predict what changes, build feedback loops, trace pathways, read graphs and practice for lab practicals.</span></li>
        <li><span class="n" aria-hidden="true">4</span><span><b>Check your mastery.</b> Your dashboard shows your weakest topics and core concepts, and what to do next.</span></li>
      </ol>
    </div>
  </section>

  <section class="xsection" aria-labelledby="h-tools">
    <div class="anp-feature">
      <div class="icon-circle" aria-hidden="true">
        <svg viewBox="0 0 170 170" fill="none" focusable="false">
          <path d="M85 128s-40-24-40-54a22 22 0 0 1 40-13 22 22 0 0 1 40 13c0 30-40 54-40 54z" stroke="#fff" stroke-opacity=".9" stroke-width="3.5" stroke-linejoin="round"/>
          <path d="M58 80h14l7-14 10 28 7-14h16" stroke="#fff" stroke-opacity=".9" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="132" cy="44" r="6" fill="#F2B9A9"/><path d="M127.5 48.5L112 64" stroke="#F2B9A9" stroke-width="3" stroke-linecap="round"/>
          <path d="M38 138l10-10M38 128l10 10" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </div>
      <div>
        <h2 id="h-tools">${HOME_WORDS[tools.length] || tools.length} tools that make you do the physiology.</h2>
        <p>Predict what rises and falls, close a feedback loop, trace a pathway step by step, and name structures on real figures before the lab practical does.</p>
        <div class="anp-tool-chips">${tools.map(t => `<a href="tools/${t.slug}.html">${esc(t.name)}</a>`).join('')}</div>
        <a class="btn-press alt" href="tools.html">See all tools</a>
      </div>
    </div>
  </section>
${homeSample(depth)}
  <section class="xsection" aria-labelledby="h-go">
    <div class="section-head"><h2 id="h-go">Practice and study</h2></div>
    <ul class="anp-cards">
      <li><a href="practice.html"><b>Practice</b><span>Topic, system and core concept drills, mixed review and your missed questions.</span></a></li>
      <li><a href="review.html"><b>Review</b><span>Your spaced review queue.</span></a></li>
      <li><a href="exams.html"><b>Exams</b><span>Unit quizzes, system exams, A&amp;P I and II cumulative finals and TEAS A&amp;P practice.</span></a></li>
      <li><a href="tools.html"><b>Tools</b><span>Lab practical, predict the change, feedback loops, pathways, graphs, calculators and word roots.</span></a></li>
      <li><a href="flashcards.html"><b>Flashcards</b><span>Spaced-repetition cards from the glossary and comparison tables.</span></a></li>
      <li><a href="glossary.html"><b>Glossary</b><span>Every term, with word roots and where it is taught.</span></a></li>
      <li><a href="concepts/index.html"><b>Core concepts</b><span>${HOME_WORDS[map.coreConcepts.length] || map.coreConcepts.length} ideas that explain every system.</span></a></li>
      <li><a href="dashboard.html"><b>Dashboard</b><span>Mastery by topic, system and core concept.</span></a></li>
    </ul>
  </section>

  <section class="xsection" aria-label="About LevlPrep">
    <div class="trust-row">
      <div class="trust-pill">Every lesson and notes page free</div>
      <div class="trust-pill">Progress saved on your device</div>
      <div class="trust-pill">No account required</div>
    </div>
    <p class="anp-disclaimer anp-home-legal">${esc(TEAS_DISCLAIMER)} OpenStax is credited as a source of figures and coverage; OpenStax does not endorse LevlPrep.</p>
  </section>
</main>
${footer(depth)}
${tail({ depth, section: 'home', extra: ['anp-home.js'] })}
</body>
</html>
`;
  return head({ title, desc, path: '', depth, ogType: 'website', jsonld, meta: '<link rel="stylesheet" href="assets/anp-home.css">\n' }) + body;
}

/* ---------------------------------------------------- apps and tools */

const PAGES = JSON.parse(readFileSync(join(C.data, 'pages.json'), 'utf8'));

/* The shell of an app or tool page. The page's behavior is its script, which
   mounts into #app; the static text here is what a reader without JavaScript
   (or a search engine) sees. */
function appShell(entry, { path, depth, h1, eyebrow, lede, section, extraScripts, isTool, hero, mount }) {
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
  ${hero
    ? `<header class="hero anp-hero ${hero.cls}"><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(hero.h1)}</h1><p class="lede">${hero.ledeHtml}</p></header>`
    : `<header class="hero anp-hero"><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(h1)}</h1><p class="lede">${esc(lede)}</p></header>`}
  <div id="app" class="anp-app-mount" data-slug="${entry.slug}"${entry.premium ? ` data-premium="${entry.premium}"` : ''}${entry.data ? ` data-src="${depth}assets/tool-data/${entry.data}"` : ''}>${mount || `<noscript><p>This ${isTool ? 'tool' : 'page'} needs JavaScript. The lessons and notes pages work without it.</p></noscript>`}</div>
  ${teas ? `<p class="anp-disclaimer">${esc(TEAS_DISCLAIMER)}</p>` : ''}
</main>
${footer(depth)}
<link rel="stylesheet" href="${depth}assets/${entry.css}">
<script src="${depth}../assets/report-question.js" defer></script>
${(entry.siteScripts || []).map(f => `<script src="${depth}../assets/${f}" defer></script>\n`).join('')}${tail({ depth, section, extra: ['anp-questions.js', ...(extraScripts || []), entry.script], premium: true })}
</body>
</html>
`;
  return head({ title: entry.title, desc: entry.desc, path, depth, ogType: 'website', jsonld }) + body;
}

/* ---- Tools hub and practice page (redesign) ----
   The tools hub is rendered here in full (featured lab practical banner, then
   a card per other tool), so it reads and links without JavaScript;
   apps/tools-hub.js adds each tool's live status and the ?chapter= filter.
   Item counts come from the published tool data, per chapter as well. */
const HUB_SKILL = {
  'lab-practical': 'Anatomy', predict: 'Physiology: predict', 'feedback-loops': 'Physiology: homeostasis',
  pathways: 'Sequences', graphs: 'Physiology: graphs', calculators: 'Quantitative', 'word-roots': 'Terminology',
};
const HUB_ICON = {
  predict: '<path d="M7 17V7M7 7l-3 3M7 7l3 3M17 7v10M17 17l-3-3M17 17l3-3"/>',
  'feedback-loops': '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4.5h-4.5"/>',
  pathways: '<circle cx="5" cy="6" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="18" r="2"/><path d="M6.5 7.5l4 3M13.5 13.5l4 3"/>',
  graphs: '<path d="M4 4v16h16"/><path d="M6.5 15c3-7 6-9 12-9"/>',
  calculators: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7.5h7M8.5 12h2M13.5 12h2M8.5 16h2M13.5 16h2"/>',
  'word-roots': '<path d="M4 7h9M4 12h6M4 17h9"/><path d="M15 10l5 2-5 2"/>',
};
// Which array holds a tool's items, and what one is called.
const HUB_ITEMS = {
  predict: ['scenarios', 'scenario'], 'feedback-loops': ['loops', 'loop'], pathways: ['pathways', 'pathway'],
  graphs: ['graphs', 'graph'], calculators: ['calculators', 'calculator'], 'word-roots': ['terms', 'term'],
};
// Tools whose page reads ?chapter= (the hub passes the filter on to these).
const HUB_CHAPTER_AWARE = new Set(['lab-practical', 'predict', 'feedback-loops', 'pathways', 'graphs']);
const LAB_MODES = [
  { key: 'explore', label: 'Explore', blurb: 'Labels shown. Tap any structure.', icon: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>' },
  { key: 'study', label: 'Study', blurb: 'Labels hidden. Reveal at your pace.', icon: '<path d="M4 6h16v12H4z"/><path d="M8 10h8M8 14h5"/>' },
  { key: 'quiz', label: 'Quiz', blurb: 'Name it, or point to it. Scored.', icon: '<path d="M9 9a3 3 0 1 1 4 2.8c-.7.3-1 .9-1 1.7V15"/><path d="M12 18.5v.01"/>' },
  { key: 'practical', label: 'Timed', blurb: 'Bell-ringer stations, 30 s to 2 min each.', icon: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M10 3h4"/>' },
];
const NUM_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
const numWord = n => NUM_WORDS[n] || String(n);
const chCounts = o => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(',');

function hubToolCounts(slug) {
  const d = JSON.parse(publishedTool(`${slug}.json`));
  const by = {};
  if (slug === 'lab-practical') {
    for (const set of d.sets) by[set.chapter] = (by[set.chapter] || 0) + set.stations.length;
    return { n: d.sets.reduce((n, set) => n + set.stations.length, 0), by, sets: d.sets, figures: d.figures };
  }
  const items = d[HUB_ITEMS[slug][0]];
  for (const x of items) {
    const ch = x.topic && topicById(x.topic) ? topicById(x.topic).chapter : null;
    if (ch) by[ch] = (by[ch] || 0) + 1;
  }
  return { n: items.length, by };
}

/* The featured banner's figure: a real lab practical station with every label
   masked (numbered, as in quiz mode) and one highlighted. Covered labels
   (later concepts, decision 30) stay painted over with no number. */
function hubFigure(lab) {
  const sets = lab.sets.filter(s => !s.histology);
  const pick = sets.find(s => s.stations.some(st => st.figure === 'os-19-9')) || sets.find(s => s.stations.some(st => st.labels.length >= 8)) || sets[0];
  if (!pick) return '';
  const st = pick.stations.find(x => x.figure === 'os-19-9') || pick.stations.find(x => x.labels.length >= 8) || pick.stations[0];
  const f = lab.figures[st.figure];
  const at = ([x, y, w, h]) => `left:${(x / f.w * 100).toFixed(2)}%;top:${(y / f.h * 100).toFixed(2)}%;width:${(w / f.w * 100).toFixed(2)}%;height:${(h / f.h * 100).toFixed(2)}%`;
  const on = Math.min(14, st.labels.length - 1);
  const masks = (st.covered || []).map(c => `<span class="anp-hub-mask" style="${at(c.box)}"></span>`).join('') +
    st.labels.map((l, i) => `<span class="anp-hub-mask${i === on ? ' is-on' : ''}" style="${at(l.box)}">${i + 1}</span>`).join('');
  return `<div class="anp-hub-feat-art" aria-hidden="true">
      <div class="anp-hub-fig">
        <div class="anp-hub-fig-img"><img src="${esc(f.src)}" width="${f.w}" height="${f.h}" alt="" decoding="async">${masks}</div>
        <div class="anp-hub-fig-q"><span class="anp-hub-fig-n">${on + 1}</span><span class="anp-hub-fig-inp">Name the highlighted structure&hellip;</span></div>
      </div>
      <p class="anp-hub-fig-cap">${esc(pick.title)} &middot; ${st.labels.length} labels</p>
    </div>`;
}

function toolsHubMount() {
  const tools = PAGES.tools;
  const lab = tools.find(t => t.slug === 'lab-practical');
  const labData = hubToolCounts('lab-practical');
  const figN = Object.keys(labData.figures).length;
  const feat = `<section class="anp-hub-feat" aria-labelledby="anp-hub-feat-h" data-tool="lab-practical" data-n="${labData.n}" data-ch="${chCounts(labData.by)}" data-unit="station,stations" data-chq="1"${lab.premium ? ' data-premium="1"' : ''}>
    <div class="anp-hub-feat-text">
      <p class="anp-hub-feat-kick"><span class="anp-hub-dot" aria-hidden="true"></span>Featured tool &middot; ${esc(HUB_SKILL['lab-practical'])}</p>
      <h2 id="anp-hub-feat-h">${esc(lab.name)}</h2>
      <p class="anp-hub-feat-tag">${esc(lab.tag || '')}</p>
      <p class="anp-hub-feat-blurb">${esc(lab.blurb)} Every structure tells you what it does and which lesson teaches it.</p>
      <ul class="anp-hub-modes" aria-label="Modes">${LAB_MODES.map(m => `<li><a class="anp-hub-mode${m.key === 'quiz' ? ' is-on' : ''}" href="tools/lab-practical.html#${m.key}" data-hash="${m.key}"><b><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${m.icon}</svg>${esc(m.label)}</b><span>${esc(m.blurb)}</span></a></li>`).join('')}</ul>
      <div class="anp-hub-feat-row">
        <a class="anp-hub-cta" href="tools/lab-practical.html">Start the lab practical <span aria-hidden="true">&rarr;</span></a>
        <span class="anp-hub-feat-stats"><b>${figN}</b> figures &middot; <b>${labData.sets.length}</b> sets &middot; <span class="anp-hub-count"><b>${labData.n}</b> stations</span></span>
      </div>
      <p class="anp-hub-status anp-hub-feat-status" aria-live="polite"></p>
    </div>
    ${hubFigure(labData)}
  </section>`;
  const others = tools.filter(t => t.slug !== 'lab-practical');
  const cards = others.map(t => {
    const c = hubToolCounts(t.slug);
    const [pl, sg] = HUB_ITEMS[t.slug];
    return `<li><a class="anp-hub-card" href="tools/${t.slug}.html" data-tool="${t.slug}" data-n="${c.n}" data-ch="${chCounts(c.by)}" data-unit="${sg},${pl}"${HUB_CHAPTER_AWARE.has(t.slug) ? ' data-chq="1"' : ''}${t.premium ? ' data-premium="1"' : ''}>
      <span class="anp-hub-top"><span class="anp-hub-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">${HUB_ICON[t.slug] || '<circle cx="12" cy="12" r="7"/>'}</svg></span><span class="anp-hub-skill">${esc(HUB_SKILL[t.slug] || '')}</span></span>
      <span class="anp-hub-name">${esc(t.name)}</span>
      <span class="anp-hub-tag">${esc(t.tag || '')}</span>
      <span class="anp-hub-blurb">${esc(t.blurb)}</span>
      <span class="anp-hub-status"></span>
      <span class="anp-hub-foot"><span class="anp-hub-count"><b>${c.n}</b> ${c.n === 1 ? sg : pl}</span><span class="anp-hub-go">Open <span aria-hidden="true">&rarr;</span></span></span>
    </a></li>`;
  }).join('\n    ');
  return `
  <div class="anp-hub-filter" hidden></div>
  ${feat}
  <div class="anp-hub-more-h"><h2>${numWord(others.length)} more ways to practice</h2><p>Physiology, numbers and words.</p></div>
  <ul class="anp-hub" aria-label="More tools">
    ${cards}
  </ul>
  <p class="anp-hub-note">Every tool records what you answer: missed items go into your <a href="review.html">review queue</a>, and your accuracy shows here and on the <a href="dashboard.html">dashboard</a>. Want cards instead? Try the <a href="flashcards.html">flashcards</a>.</p>
  `;
}

// Per-app extras for appShell: a hero shaped for the page and, for the tools
// hub, the static page body. Other app pages keep the default hero.
const APP_EXTRAS = {
  tools: () => ({
    hero: { cls: 'anp-hero-hub', h1: `${numWord(PAGES.tools.length)} tools. Start at the lab bench.`,
      ledeHtml: 'Name structures on real figures, then work the physiology: predict, build, trace, read and calculate. Every tool explains its answers, and what you miss goes into your <a href="review.html">review queue</a>.' },
    mount: toolsHubMount(),
  }),
  practice: () => ({
    hero: { cls: 'anp-hero-compact', h1: 'Practice', ledeHtml: 'Build a set: pick what to drill, how many, and go.' },
  }),
};

for (const a of PAGES.apps) put(`${a.slug}.html`, appShell(a, { path: `${a.slug}.html`, depth: '', h1: a.h1, eyebrow: COURSE_NAME, lede: a.desc, section: a.section, ...(APP_EXTRAS[a.slug] ? APP_EXTRAS[a.slug]() : {}) }));
// Old URLs of renamed pages: a stub that forwards the query string and hash.
// mastery.html became dashboard.html when every course's progress tab became
// "Dashboard".
const RENAMED = { mastery: 'dashboard' };
for (const [from, to] of Object.entries(RENAMED)) put(`${from}.html`, `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<script>location.replace("${to}.html" + location.search + location.hash);</script>
<meta http-equiv="refresh" content="0; url=${to}.html">
<link rel="canonical" href="${SITE}${BASE}${to}.html">
<title>Redirecting…</title>
</head>
<body>
<p>This page has moved. <a href="${to}.html">Continue to ${to}.html</a></p>
</body>
</html>
`);
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
put('assets/anp-curriculum.js', curriculumJs().replace('window.AnpCurriculum = ', `window.AnpTools = ${JSON.stringify(PAGES.tools.map(t => ({ slug: t.slug, name: t.name, blurb: t.blurb, ...(t.premium ? { premium: 1 } : {}) })))};\nwindow.AnpCurriculum = `));
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
    // The full credit line from the figure's own data (the lab practical
    // always hides printed labels, so every figure there is adapted).
    for (const [id, f] of Object.entries(d.figures)) if (C.figures[id]) f.attribution = attribution(C.figures[id], { adapted: true }).html;
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
