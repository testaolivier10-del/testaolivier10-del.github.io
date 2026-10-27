/* The AP® Calculus AB course generator (docs/apcalc-spec.md, docs/apcalc-architecture.md).

   Reads calculus/data/ and the course map and writes every page a student reads:
   the course home, learn.html (units and the Skills section), a page per unit,
   a lesson, a notes page and a printable unit sheet, the glossary, the app
   page shells from pages.json, and the JSON the runtime loads (curriculum,
   glossary, the question bank split per unit with its lazy index). Forked
   from scripts/build-apphys.mjs (spec decision 1), itself from
   build-apchem.mjs; the differences are math (every $...$ in authored data
   rendered to MathML at load by calculus/assets/calc-math.js, so pages
   need no math script to read), graph stimuli plotted from a spec by
   calculus/assets/tools/calc-plot.js, `expr` items and calculator flags
   (carried in the bank and its index), the recurring free-response types
   (9 points each, calculator or not), and tools that load their own model
   file (calculus/assets/tools/math/<slug>.js) and the plot helper.

   Only topics of PUBLISHED chapters are built (calculus/data/published.json), and
   only once they have a lesson, notes and a question file. With no chapter
   published every page is noindex: the course is not live.

   The map: docs/apcalc-dependency-map.json (docs/apcalc-phase0.md); without
   it, only when APCALC_MAP_STUB=1, the test fixture (scripts/lib/apcalc-build.mjs). With no
   map at all nothing is generated, and --check fails on any generated file
   left behind.

     node scripts/build-apcalc.mjs            write everything
     node scripts/build-apcalc.mjs --check    exit 1 if anything on disk is stale
     --out <dir>                              write the calculus/ tree there (tests)
     APCALC_PUBLISHED=unit-1,skills-math      override published.json (tests)
     APCALC_DATA=<dir>                        read authored data from <dir> (tests)

   Nothing it writes is edited by hand. Every served path avoids the token
   "ap" (spec decision 2). */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { courseBanner } from './lib/covers.mjs';
import { apHomeMain } from './lib/course-home.mjs';
import { MCQ_PARTS, FRQ_PARTS, FRQ_TOTAL } from './lib/apcalc-exams.mjs';
import { join, dirname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { Hub } from './lib/hub.mjs';
import { courseTitle } from './lib/page-title.mjs';
import { connectionsWithNext } from './lib/lesson-next.mjs';
import { glossaryJson as sharedGlossaryJson, glossaryMain, glossaryScript } from './lib/glossary.mjs';
import { premiumData, lockedLd, courseOffers } from './lib/premium-data.mjs';
import {
  ROOT, SITE, BASE, COURSE_NAME, COURSE_HTML, COURSE_ID, COURSE_KEY, DISCLAIMER, BETA_NOTE, BETA_PILL,
  esc, text, loadMap, loadCourse, isFreeTopic, clampDesc, head, tail, crumbs, orgCrumbs, crumbNav, footer, reportButton,
  termIndex, glossify, figureImg, credit, renderFigures, stimulusBody, stimulusPanel, questionForPage, questionHtml,
  groupSets, hasApToken, stripMark, STIM_KIND,
} from './lib/apcalc-build.mjs';
import { entryPages } from './lib/apcalc-entry.mjs';
import { applyVideo } from './lib/videos.mjs';
import { r3Reading } from './lib/r3-reading.mjs';
import { dashboardPage, examsPage } from './lib/dashboard-page.mjs';

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : join(ROOT, 'calculus');
const map = loadMap();
// APCALC_DATA points the build at another data folder (tests use the
// placeholder sample in scripts/test/fixtures/apcalc-data, never calculus/data).
/* A definition is plain text with build-time MathML in it (and the <wbr> the
   math renderer puts between formulas): escape the text, keep the math. */
const escKeepMath = (s) => String(s).split(/(<math\b[\s\S]*?<\/math>|<wbr>)/).map((x, i) => i % 2 ? x : esc(x)).join('');
const C = loadCourse(ROOT, { map, data: process.env.APCALC_DATA || undefined, published: process.env.APCALC_PUBLISHED !== undefined ? process.env.APCALC_PUBLISHED.split(',').filter(Boolean) : undefined });
const outputs = new Map();
const LABEL = 'AP® Calculus AB';
const PRELAUNCH = C.published.size === 0;

/* Every table sits in a focusable, named scrolling region (site rule table-wrap-keyboard). */
const tableLabel = inner => {
  const cap = inner.match(/<caption[^>]*>([\s\S]*?)<\/caption>/);
  const heads = [...inner.matchAll(/<th\b[^>]*scope="col"[^>]*>([\s\S]*?)<\/th>/g)].map(x => text(x[1])).filter(Boolean);
  const name = cap ? text(cap[1]) : heads.length ? `Table: ${heads.slice(0, 4).join(', ')}` : 'Table';
  return esc(name.length > 90 ? name.slice(0, 87).replace(/\s+\S*$/, '') + '…' : name);
};
const wrapTables = html => html.replace(/(<div class="table-wrap"[^>]*>\s*)?<table\b([\s\S]*?)<\/table>(\s*<\/div>)?/g,
  (m, open, inner, close) => open && close ? m : `<div class="table-wrap" tabindex="0" role="region" aria-label="${tableLabel(inner)}"><table${inner}</table></div>`);
const put = (rel, content) => {
  if (hasApToken(rel)) throw new Error(`build-apcalc: output path calculus/${rel} contains the token "ap" (spec decision 2)`);
  // Video lessons from docs/videos.json (scripts/lib/videos.mjs).
  outputs.set(rel, rel.endsWith('.html') ? r3Reading(applyVideo(`calculus/${rel}`, wrapTables(content)), { key: 'apcalc', rel: `calculus/${rel}` }) : content);
};

if (map) {
  // A TeX typo in a built topic stops the build; elsewhere the content check lists it.
  const bad = C.mathProblems.filter(m => [...C.built].some(id => m.includes(`/${id}.`)));
  if (bad.length) { console.error(`build-apcalc: math that does not render:\n  ${bad.join('\n  ')}`); process.exit(1); }
  build();
}

function build() {
  // Only published chapters' definitions go out (as A&P decision 63).
  for (const c of map.concepts) {
    const t = map.topicById(c.taughtIn);
    if (C.glossary[c.id] && (!t || !C.published.has(t.chapter))) delete C.glossary[c.id];
  }
  const GLOSS = termIndex(C);
  const topics = map.topics;
  const built = topics.filter(t => C.built.has(t.id));
  const chapterById = id => map.chapterById(id);
  const topicsOf = chId => topics.filter(t => t.chapter === chId);
  const chapterBuilt = ch => topicsOf(ch.id).some(t => C.built.has(t.id));
  const units = map.chapters.filter(c => c.part === 'course');
  const skills = map.chapters.filter(c => c.part !== 'course');
  const topicNo = t => t.ced || null;
  const practiceName = n => (map.practices.find(p => String(p.id) === String(n)) || {}).name || `Practice ${n}`;
  const unitLabel = ch => ch.part === 'course' ? `Unit ${ch.n}` : 'Skills';
  const pos = id => topics.findIndex(t => t.id === id);
  const noindex = PRELAUNCH;
  const freeLd = t => isFreeTopic(map, t) ? { isAccessibleForFree: true } : lockedLd('.calc-ls-card');
  const offers = (() => { try { return premiumData().COURSES[COURSE_KEY] ? courseOffers(COURSE_KEY) : undefined; } catch { return undefined; } })();

  /* Direct prerequisite topics, from concept dependencies. */
  function buildsOn(id) {
    const here = pos(id), out = new Set();
    for (const c of map.concepts.filter(c => c.taughtIn === id)) for (const d of c.dependsOn) {
      const dc = map.concepts.find(x => x.id === d);
      if (dc && dc.taughtIn !== id && pos(dc.taughtIn) < here) out.add(dc.taughtIn);
    }
    return [...out].sort((a, b) => pos(a) - pos(b));
  }
  const topicRef = (id, depth, kind = 'notes') => C.built.has(id)
    ? `<a href="${depth}${kind}/${id}.html">${esc(map.topicById(id).title)}</a>`
    : `<span class="calc-unbuilt">${esc(map.topicById(id).title)}</span>`;
  const nextBuilt = id => topics.slice(pos(id) + 1).find(t => C.built.has(t.id)) || null;
  const prevBuilt = id => topics.slice(0, pos(id)).reverse().find(t => C.built.has(t.id)) || null;
  const bodyOpen = (attrs = '') => `<body class="calc"${attrs}>\n<header id="site-header"></header>\n<div class="course-nav"></div>`;
  /* A stable link, "Share to Google Classroom", Copy link and Print, on every
     lesson, notes page, unit sheet and FRQ (spec section 1, "Teachers"). The
     shared title never carries the mark (it travels in a URL). Copy link and
     Print are wired by calc-nav.js. */
  /* On notes pages (book) the bar is the shared notes action row
     (assets/course/book.css .bk-actions): Copy link and Print as in every
     course, with Share to Google Classroom first (as AP® Chemistry). */
  const shareBar = (path, title, what, book = false) => {
    const url = `${SITE}${BASE}${path}`;
    const gc = `https://classroom.google.com/share?url=${encodeURIComponent(url)}&title=${encodeURIComponent(stripMark(title))}`;
    const [wrap, btn] = book ? ['bk-actions calc-share', 'bk-action'] : ['calc-share', 'calc-share-btn'];
    return `<div class="${wrap} calc-nav-ref" role="group" aria-label="Share or print this ${what}"><a class="${btn}" href="${esc(gc)}" target="_blank" rel="noopener">Share to Google Classroom<span class="sr-only"> (opens in a new tab)</span></a><button type="button" class="${btn}" data-copy="${esc(url)}">Copy link</button><button type="button" class="${btn}" data-print>Print</button></div>`;
  };

  /* Stimuli used by a list of questions, with paths from calculus/ (the runtime
     prefixes the page's base, as it does for the bank). */
  const stimuliFor = (topicId, qs) => {
    const all = (C.questions[topicId] || {}).stimuli || {};
    const out = {};
    for (const q of qs) if (q.stimulus && all[q.stimulus]) out[q.stimulus] = { kind: all[q.stimulus].kind, title: all[q.stimulus].title, html: stimulusBody(C, all[q.stimulus], '') };
    return out;
  };
  const staticQuestions = (qs, stimuli, depth) => groupSets(qs).map(g => {
    const items = g.items.map(q => questionHtml(q, qs.indexOf(q) + 1)).join('');
    const s = g.stimulus && stimuli[g.stimulus];
    return s ? `<div class="calc-set">${stimulusPanel(g.stimulus, s, s.html.replace(/(src|href)="figures\//g, `$1="${depth}figures/`))}${items}</div>` : items;
  }).join('');

  /* ------------------------------------------------------------ lesson */
  /* A lesson's Connections: the authored list, or, when it has none, the
     topics it builds on and the next one, from the map. They name other
     topics, so the list is navigation (calc-nav-ref), not teaching. */
  function connections(id, L) {
    if ((L.connections || []).length) return L.connections;
    const label = t => `${t.title}${t.ced ? ` (${t.ced})` : ''}`;
    const back = buildsOn(id).slice(-2).map(x => map.topicById(x)).map(t => ({ href: `../notes/${t.id}.html`, label: `Back: ${label(t)}` }));
    const nx = nextBuilt(id);
    return [...back, ...(nx ? [{ href: `../notes/${nx.id}.html`, label: `Next: ${label(nx)}` }] : [])];
  }
  const STEP_FIRST_PAINT = `<script>(function(){var s=document.querySelector('.calc-ls'),p=s&&s.querySelectorAll('.calc-step');if(!p||p.length<2)return;var i=0;try{var h=location.hash.slice(1),e=h&&document.getElementById(decodeURIComponent(h)),q=e&&e.closest('.calc-step');if(q)i=[].indexOf.call(p,q);else i=Math.max(0,Math.min((JSON.parse(localStorage.getItem('apcalc_step_'+document.body.getAttribute('data-topic')))||{}).step|0,p.length-1));}catch(x){}for(var k=0;k<p.length;k++)p[k].classList.toggle('is-on',k===i);})();</script>`;

  function lessonPage(id) {
    const t = map.topicById(id), ch = chapterById(t.chapter), L = C.lessons[id];
    const depth = '../', seen = new Set();
    const g = html => glossify(C, html, { depth, topic: id, seen, index: GLOSS });
    const items = C.questions[id].items;
    const byId = new Map(items.map(q => [q.id, q]));
    const check = (L.check || []).map(x => byId.get(x)).filter(Boolean).map(questionForPage);
    const stimuli = stimuliFor(id, check);
    const title = courseTitle(C.descriptions.titles?.[id] || t.title, [`${LABEL} Lesson`, LABEL]);
    const desc = C.descriptions.lessons?.[id] || clampDesc(L.summary, `${t.title}: a calculus lesson taught from scratch, step by step, with exam-style practice questions.`);
    const url = `${SITE}${BASE}lessons/${id}.html`;
    const fig = L.figure && L.figure.figure ? C.figures[L.figure.figure] : null;
    const earlier = buildsOn(id);
    const pageData = {
      topic: id, unit: t.chapter, free: isFreeTopic(map, t),
      prereq: (L.prereq || []).map((p, i) => ({ id: `${id}-pre-${i + 1}`, type: 'single', unit: t.chapter, topic: id, q: p.q, options: p.options, correct: p.correct, why: { correct: p.why, options: p.options.map(() => '') }, reviewHref: C.built.has(p.review) ? `../notes/${p.review}.html` : null, reviewTitle: (map.topicById(p.review) || {}).title || '' })),
      check, stimuli,
    };
    const nx = nextBuilt(id);
    const parts = [
      { id: 'hook', kind: 'Hook', nav: 'Why this matters', h: 'Why this matters', cls: 'calc-hook', html: g(L.hook) },
      earlier.length && { id: 'builds-on', kind: 'Before you start', nav: 'What this builds on', h: 'What this builds on', html: `<nav class="calc-nav-ref" aria-label="Earlier topics"><ul class="calc-links">${earlier.map(x => `<li>${topicRef(x, depth)}</li>`).join('')}</ul></nav>` },
      (L.prereq || []).length && { id: 'prereq', kind: 'Prerequisite check', nav: 'Quick check', h: 'Quick check before you start', html: `<div class="calc-qs" data-set="prereq">${pageData.prereq.map((p, i) => questionHtml(p, i + 1)).join('')}</div>` },
      fig && { id: 'figure', kind: 'See it', nav: 'See it', h: 'See it first', html: `<figure class="calc-figure calc-lesson-fig">${figureImg(C, L.figure.figure, depth, { masks: (fig.labels || []).length > 0 })}<figcaption>${g(L.figure.caption || '')} ${credit(fig, { adapted: (fig.labels || []).length > 0 })}</figcaption></figure>${(fig.labels || []).length ? '<button type="button" class="btn-outline calc-toggle-labels" aria-pressed="false">Hide labels</button>' : ''}` },
      { id: 'chain', kind: 'Step by step', nav: 'How it works', h: 'How it works, step by step', html: `<ol class="calc-chain">${L.chain.map(s => `<li><span class="calc-cause">${g(s.cause)}</span><span class="calc-arrow" aria-hidden="true">→</span><span class="calc-effect">${g(s.effect)}</span></li>`).join('')}</ol>` },
      (L.ideas || []).length && { id: 'ideas', kind: 'Key ideas', nav: 'Key ideas', h: 'Key ideas', html: `<ul class="calc-ideas">${L.ideas.map(x => `<li>${g(x)}</li>`).join('')}</ul>` },
      { id: 'misconception', kind: 'Misconception', nav: 'A common mistake', h: 'A common mistake', cls: 'calc-misconception', html: `<p class="calc-wrong"><b>The wrong idea:</b> ${g(L.misconception.wrong)}</p><p class="calc-right"><b>What actually happens:</b> ${g(L.misconception.right)}</p>` },
      { id: 'check', kind: 'Check yourself', nav: 'Check yourself', h: 'Check yourself', html: `<p class="calc-hint">Exam-style questions. Anything you miss goes into your review queue.</p><div class="calc-qs" data-set="check">${staticQuestions(check, stimuli, depth)}</div>` },
      { id: 'summary', kind: 'Summary', nav: 'Summary', h: 'Summary', html: g(L.summary) },
      { id: 'next', kind: 'Up next', nav: 'What comes next', h: 'What comes next', html: nx ? `<nav class="calc-nav-ref" aria-label="Next topic"><p><a class="btn-press sm" href="${nx.id}.html">${esc(nx.title)} &rarr;</a></p></nav>` : '<p>This is the last topic in the course.</p>' },
      connections(id, L).length && { id: 'connections', kind: 'Connections', nav: 'Connections', h: 'Connections', html: `<ul class="calc-links calc-nav-ref">${connectionsWithNext(connections(id, L), nx).map(c => `<li><a href="${esc(c.href)}">${esc(c.label)}</a></li>`).join('')}</ul>` },
    ].filter(Boolean);
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#lesson`, name: t.title, url, description: desc, learningResourceType: 'Lesson', educationalLevel: 'High school', inLanguage: 'en', ...freeLd(t),
        teaches: map.concepts.filter(c => c.taughtIn === id).slice(0, 12).map(c => ({ '@type': 'DefinedTerm', name: c.term })), isPartOf: { '@id': COURSE_ID }, provider: { '@id': `${SITE}/#org` } },
      crumbs(orgCrumbs([{ name: ch.title, url: `${SITE}${BASE}units/${ch.id}.html` }, { name: t.title, url }])),
    ] };
    const lede = (text(L.summary).match(/^.*?[.!?](?=\s|$)/) || [text(L.summary)])[0];
    const body = `
${bodyOpen(` data-topic="${id}" data-unit="${ch.id}"`)}
<div class="xshell">${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../units/${ch.id}.html` }, { name: t.title }])}</div>
<div class="xshell calc-ls cx-ls${parts.length > 1 ? ' calc-stepped' : ''}" data-course="apcalc"${nx ? ` data-next-title="${esc(nx.title)}" data-next-unit="${nx.chapter}"${isFreeTopic(map, nx) ? ' data-next-free="1"' : ''}` : ''}>
  <aside class="calc-ls-rail calc-nav-ref" aria-label="Lesson parts">
    <p class="calc-ls-k cx-ls-k">${unitLabel(ch)} · ${esc(ch.title)}</p>
    <p class="calc-ls-links"><a href="../units/${ch.id}.html">&larr; Back to the unit</a><a href="../notes/${id}.html">Read the notes</a></p>
    <div class="calc-ls-prog cx-ls-prog"><div class="calc-ls-track"><div class="calc-ls-fill"></div></div><span class="calc-ls-count">Step 1 / ${parts.length}</span></div>
    <button type="button" class="cx-ls-toggle" aria-expanded="false" aria-controls="lesson-steps"><span class="cx-ls-now">Step 1 of ${parts.length}</span><span class="cx-ls-all">All steps</span></button>
    <ol class="calc-ls-steps cx-ls-steps" id="lesson-steps">${parts.map((p, i) => `<li><a href="#${p.id}"><span class="n">${i + 1}</span><span class="t">${p.nav}</span></a></li>`).join('')}</ol>
  </aside>
  <main id="main" class="calc-ls-main calc-lesson">
  <header class="calc-ls-hero">
    <div class="eyebrow">${unitLabel(ch)}${topicNo(t) ? ` · Topic ${esc(t.ced)}` : ''} ${BETA_PILL}</div>
    <h1>${esc(t.title)}</h1>
    <p class="lede">${esc(lede)}</p>
    <p class="calc-tags calc-nav-ref">${(t.practices || []).map(n => `<span class="calc-tag">Practice ${n}: ${esc(practiceName(n))}</span>`).join('')}</p>
  </header>
  <div class="calc-ls-card">
${parts.map((p, i) => `  <section class="calc-part calc-step${i === 0 ? ' is-on' : ''}" id="${p.id}" aria-labelledby="h-${p.id}">
    <p class="calc-step-k">Part ${i + 1} · ${p.kind}</p>
    <h2 id="h-${p.id}" tabindex="-1">${p.h}</h2>
    <div class="calc-step-body${p.cls ? ` ${p.cls}` : ''}">${p.html}</div>
  </section>`).join('\n')}
    <div class="calc-ls-actions calc-nav-ref"><button type="button" class="calc-ls-back">&larr; Previous</button><button type="button" class="calc-ls-go">Continue &rarr;</button><a class="calc-ls-go" hidden href="${nx ? `${nx.id}.html">Next lesson` : `../units/${ch.id}.html">Back to the unit`} &rarr;</a></div>
  </div>
  <div class="cx-ls-end">
    ${shareBar(`lessons/${id}.html`, `${t.title}: calculus lesson`, 'lesson')}
    <p class="calc-small calc-nav-ref"><a href="../practice.html?topic=${id}">Question set for this topic</a></p>
  </div>
  </main>
</div>
${STEP_FIRST_PAINT}
${footer(depth, `lesson:${id}`)}
<script type="application/json" id="calc-page-data">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
${tail({ depth, section: 'learn', extra: ['calc-questions.js', 'calc-lesson.js'], premium: true, site: ['course/lesson.js'] })}
</body>
</html>
`;
    return head({ title, desc, path: `lessons/${id}.html`, depth, jsonld, noindex, meta: '<link rel="stylesheet" href="../../assets/course/lesson.css">\n' }) + body;
  }

  /* ------------------------------------------------------------ notes */
  function sectionIds(html) {
    const used = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
    const sections = [];
    const out = html.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/g, (m, attrs, inner) => {
      const title = text(inner);
      let hid = (attrs.match(/\bid="([^"]+)"/) || [])[1];
      if (!hid) {
        const b = title.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').split('-').slice(0, 6).join('-') || 'section';
        hid = b; for (let i = 2; used.has(hid); i++) hid = `${b}-${i}`;
        used.add(hid); attrs = ` id="${hid}"${attrs}`;
      }
      sections.push({ id: hid, title });
      return `<h2${attrs}>${inner}</h2>`;
    });
    return { html: out, sections };
  }
  const tocBtn = label => `<button type="button" class="tb-toc-btn" aria-controls="calc-rail" aria-expanded="false">&#9776; ${label}</button>`;
  const chip = id => `<span class="bk-chip" data-chip-topic="${id}">Not practiced</span>`;
  /* Lessons-done progress and the course search box, as on A&P's rail
     (assets/course/book.css); calc-toc.js paints the numbers. */
  const tocProg = (total, label, chId = '') =>
    `<div class="calc-toc-prog" data-toc-prog="${chId}"><div class="tb-progress-row"><span><b>0</b> of ${total} ${label}</span><span class="bk-toc-pct">0%</span></div><div class="tb-progress-track"><div class="tb-progress-fill" style="width:0%"></div></div></div>`;
  const tocSearch = depth => `<form class="bk-toc-search" action="${depth}search.html" method="get" role="search"><input type="search" name="q" class="tb-filter" placeholder="Search the notes&hellip;" aria-label="Search the notes"></form>`;

  /* The whole course in the rail: units, then the Skills section. */
  function courseRail(curId, depth, book = false) {
    const chDir = book ? 'units/' : '';
    const groups = map.parts.map(p => {
      const chs = map.chapters.filter(c => c.part === p.id);
      if (!chs.length) return '';
      return `<p class="bk-toc-group">${esc(p.title)}</p>` + chs.map(ch => {
        const ts = topicsOf(ch.id), cur = ch.id === curId, has = chapterBuilt(ch);
        const inner = `<span class="tb-toc-num">${ch.part === 'course' ? ch.n : 'S'}</span><span class="tb-toc-modtitle">${esc(ch.title)}</span><span class="tb-toc-count" data-toc-ch="${ch.id}">0/${ts.filter(t => C.built.has(t.id)).length}</span>`;
        const headEl = !has ? `<span class="tb-toc-modhead bk-unbuilt">${inner}</span>` : `<a class="tb-toc-modhead" href="${cur ? '#main' : `${chDir}${ch.id}.html`}"${cur ? ' aria-current="page"' : ''}${book ? ` data-book-ch="${ch.id}"` : ''}>${inner}</a>`;
        const tl = (cur || (book && has)) ? `<div class="tb-toc-topics">${ts.filter(t => C.built.has(t.id)).map(t => `<a class="tb-toc-topic" href="${depth}${book ? 'notes' : 'lessons'}/${t.id}.html" data-toc-t="${t.id}"><span class="tb-toc-tick"></span>${esc(t.title)}</a>`).join('')}</div>` : '';
        return `<div class="tb-toc-mod${cur ? ' open' : ''}">${headEl}${tl}</div>`;
      }).join('');
    }).join('');
    return `<aside class="tb-rail calc-nav-ref" id="calc-rail">
    <p class="tb-rail-title">Contents</p>
    ${tocProg(topics.filter(t => C.built.has(t.id)).length, 'lessons done')}
    ${tocSearch(depth)}
    <nav class="tb-contents" aria-label="Course contents">${groups}</nav>
  </aside>`;
  }
  function notesRail(id, sections) {
    const t = map.topicById(id), ch = chapterById(t.chapter);
    const ts = topicsOf(ch.id).filter(x => C.built.has(x.id));
    const onPage = sections.length ? `<div class="bk-toc-onpage"><p>On this page</p>${sections.map(s => `<a href="#${s.id}">${esc(s.title)}</a>`).join('')}</div>` : '';
    const ci = map.chapters.indexOf(ch);
    const other = c => c && chapterBuilt(c) ? `<a class="bk-toc-other" href="../units/${c.id}.html"><span class="bk-toc-n">${c.part === 'course' ? c.n : 'S'}</span>${esc(c.title)}</a>` : '';
    return `<aside class="tb-rail calc-nav-ref bk-rail" id="calc-rail">
    <p class="tb-rail-title">Contents</p>
    ${other(map.chapters[ci - 1])}
    <a class="bk-toc-chap" href="../units/${ch.id}.html"><span class="bk-toc-chap-n">${ch.part === 'course' ? ch.n : 'S'}</span><span><b>${esc(ch.title)}</b><small>${ts.length} topic${ts.length === 1 ? '' : 's'}</small></span></a>
    ${tocProg(ts.length, 'lessons done', ch.id)}
    <nav class="tb-contents" aria-label="Unit contents"><ol class="bk-toc-list">${ts.map(x => x.id === id
      ? `<li class="current" data-toc-t="${x.id}"><a href="#main" aria-current="page"><span class="bk-toc-n">${esc(x.ced || 'S')}</span>${esc(x.title)}</a>${onPage}</li>`
      : `<li data-toc-t="${x.id}"><a href="${x.id}.html"><span class="bk-toc-n">${esc(x.ced || 'S')}</span>${esc(x.title)}</a></li>`).join('')}</ol></nav>
    ${other(map.chapters[ci + 1])}
  </aside>`;
  }

  function notesPage(id) {
    const t = map.topicById(id), ch = chapterById(t.chapter), depth = '../';
    const seen = new Set();
    const { html: withIds, sections } = sectionIds(C.notes[id]);
    const html = glossify(C, renderFigures(C, withIds, depth), { depth, topic: id, seen, index: GLOSS });
    const firstP = [...C.notes[id].matchAll(/<p>([\s\S]*?)<\/p>/g)].slice(0, 2).map(m => m[1]).join(' ') || t.title;
    const minutes = Math.max(1, Math.round(text(C.notes[id]).split(' ').length / 200));
    const title = courseTitle(C.descriptions.titles?.[id] || t.title, [`${LABEL} Notes`]);
    const desc = C.descriptions.notes?.[id] || clampDesc(firstP, `${t.title} explained from scratch: free calculus study notes with figures and worked examples.`);
    const url = `${SITE}${BASE}notes/${id}.html`;
    const pv = prevBuilt(id), nx = nextBuilt(id);
    const link = (x, dir) => x ? `<a class="tb-chapter-link${dir === 'next' ? ' next' : ''}" href="${x.id}.html"><span>${dir === 'next' ? 'Next &rarr;' : '&larr; Previous'}</span><b>${esc(x.title)}</b></a>` : '';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#reading`, name: t.title, url, description: desc, learningResourceType: 'Reading', educationalLevel: 'High school', inLanguage: 'en', isAccessibleForFree: true, keywords: t.searchPhrase, isPartOf: { '@id': COURSE_ID }, provider: { '@id': `${SITE}/#org` } },
      crumbs(orgCrumbs([{ name: ch.title, url: `${SITE}${BASE}units/${ch.id}.html` }, { name: `${t.title}: notes`, url }])),
    ] };
    const body = `
${bodyOpen(` data-topic="${id}" data-unit="${ch.id}"`)}
<div class="tb-shell bk bk-notes">
  ${tocBtn(`${unitLabel(ch)} contents`)}
  ${notesRail(id, sections)}
  <main class="tb-main" id="main">
    ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../units/${ch.id}.html` }, { name: `${t.title}: notes` }])}
    <div class="bk-pillbar"><a class="bk-pill" href="../lessons/${id}.html">Practice this lesson</a></div>
    <header class="bk-head">
      <p class="bk-eyebrow">${unitLabel(ch)}${t.ced ? ` &middot; Topic ${esc(t.ced)}` : ''} ${BETA_PILL}</p>
      <h1 class="bk-title">${esc(t.title)}</h1>
      <p class="bk-meta calc-nav-ref"><span class="bk-small">${minutes} min read &middot; free</span>${chip(id)}</p>
      ${shareBar(`notes/${id}.html`, `${t.title}: calculus notes`, 'notes page', true)}
    </header>
    <article class="calc-prose bk-prose">
${html}
    </article>
    <p class="calc-report-page calc-nav-ref">Spot a mistake on this page? ${reportButton(`notes:${id}`)}</p>
    <nav class="tb-chapter-nav calc-nav-ref" aria-label="Topic navigation">${link(pv, 'prev')}${link(nx, 'next')}</nav>
  </main>
</div>
${footer(depth, `notes:${id}`)}
${tail({ depth, section: 'learn', extra: ['calc-toc.js'] })}
</body>
</html>
`;
    return head({ title, desc, path: `notes/${id}.html`, depth, jsonld, noindex, book: true }) + body;
  }

  /* ------------------------------------------------------------- unit */
  function unitPage(chId) {
    const ch = chapterById(chId), depth = '../', ts = topicsOf(chId);
    const isUnit = ch.part === 'course';
    const title = courseTitle(isUnit ? `Unit ${ch.n}: ${ch.title}` : ch.title, [LABEL]);
    const desc = C.descriptions.units?.[chId] || clampDesc(`${ch.title}: ${ts.length} topics in course order, from ${ts[0].title.toLowerCase()} to ${ts[ts.length - 1].title.toLowerCase()}, with lessons, free notes and exam-style practice.`, `${ch.title}: calculus lessons, free notes and exam-style practice, in course order.`);
    const url = `${SITE}${BASE}units/${chId}.html`;
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'CollectionPage', '@id': `${url}#unit`, name: ch.title, url, description: desc, isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: ch.title, url }])),
    ] };
    const weight = Array.isArray(ch.weight) ? ` &middot; ${ch.weight[0]}&ndash;${ch.weight[1]}% of the exam` : '';
    const body = `
${bodyOpen(` data-unit="${chId}"`)}
<div class="tb-shell bk bk-chapter">
  ${tocBtn('Contents')}
  ${courseRail(chId, depth)}
  <main class="tb-main" id="main">
    ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title }])}
    <header class="tb-chapter-head bk-chap-head">
      <div>
        <p class="tb-chapter-eyebrow">${unitLabel(ch)}${weight} ${BETA_PILL}</p>
        <h1 class="tb-chapter-title">${esc(ch.title)}</h1>
        <p class="tb-chapter-meta">${ts.length} topics &middot; <span data-unit-meta="${chId}">not practiced yet</span></p>
      </div>
      <p class="bk-chap-acts"><a class="bk-btn solid" href="../practice.html?unit=${chId}">Practice this unit</a><a class="bk-btn ghost" href="../unit-sheets/${chId}.html">Unit sheet</a></p>
    </header>
    <h2 class="bk-h" id="h-topics">Topics, in course order</h2>
    <ol class="bk-list" aria-labelledby="h-topics">${ts.map(t => `<li class="bk-row" data-topic="${t.id}"><span class="bk-row-n">${esc(t.ced || 'S')}</span>${C.built.has(t.id)
      ? `<a class="bk-row-title" href="../lessons/${t.id}.html">${esc(t.title)}</a>${chip(t.id)}<span class="bk-row-btns"><a class="bk-btn solid" href="../lessons/${t.id}.html" aria-label="Lesson: ${esc(t.title)}">Lesson</a><a class="bk-btn ghost" href="../notes/${t.id}.html" aria-label="Notes: ${esc(t.title)}">Notes</a></span>`
      : `<span class="bk-row-title bk-unbuilt">${esc(t.title)}</span><span class="bk-small">Coming soon</span>`}</li>`).join('')}</ol>
    ${chapterBuilt(ch) ? unitPractice(ch) : ''}
    <nav class="tb-chapter-nav calc-nav-ref" aria-label="Unit navigation">${unitLink(map.chapters[map.chapters.indexOf(ch) - 1], 'prev')}${unitLink(map.chapters[map.chapters.indexOf(ch) + 1], 'next')}</nav>
  </main>
</div>
${footer(depth, `unit:${chId}`)}
${tail({ depth, section: 'learn', extra: ['calc-toc.js'] })}
</body>
</html>
`;
    return head({ title, desc, path: `units/${chId}.html`, depth, ogType: 'website', jsonld, noindex, book: true }) + body;
  }

  /* The unit page's lower half, laid out like an A&P chapter page
     (assets/course/book.css): three "Practice this unit" cards, then the
     unit's tools grouped by kind. A tool belongs to the unit of the topic it
     teaches; a free-response question to every unit it lists. */
  const TOOL_KIND_NAME = { simulator: 'Trainers', skill: 'Skills tools', drill: 'Drills' };
  function unitTools(chId) {
    const live = (C.pages.tools || []).filter(t => toolLive(t) && (map.topicById(t.topic) || {}).chapter === chId);
    const groups = Object.entries(TOOL_KIND_NAME).map(([k, name]) => [name, live.filter(t => t.kind === k).map(t => ({ href: `../tools/${t.slug}.html`, title: t.name }))]);
    groups.push(['Free-response questions', frqs.filter(f => f.units.includes(chId)).map(f => ({ href: `../frq/${f.id}.html`, title: frqTitle(f) }))]);
    return groups.filter(([, items]) => items.length);
  }
  function unitPractice(ch) {
    const groups = unitTools(ch.id);
    const tools = groups.filter(([name]) => name !== 'Free-response questions');
    const n = tools.reduce((a, [, items]) => a + items.length, 0);
    const summary = tools.map(([name, items]) => `${items.length} ${(items.length === 1 ? name.replace(/s$/, '') : name).toLowerCase()}`).join(', ');
    const built = topicsOf(ch.id).filter(t => C.built.has(t.id)).length;
    const cards = [
      `<a class="bk-card" href="../practice.html?unit=${ch.id}"><b>Question set</b><span>Exam-style questions from this ${ch.part === 'course' ? 'unit' : 'chapter'}'s ${built} topic${built === 1 ? '' : 's'}, with an explanation for every option.</span></a>`,
      ch.part === 'course'
        ? `<a class="bk-card" href="../exams.html?unit=${ch.id}"><b>Unit test</b><span>A timed test on the whole unit, every topic weighted equally.</span></a>`
        : `<a class="bk-card" href="../unit-sheets/${ch.id}.html"><b>Unit sheet</b><span>Every topic on one printable page: key ideas, chains and terms.</span></a>`,
      `<a class="bk-card" href="../tools.html"><b>Tools for this ${ch.part === 'course' ? 'unit' : 'chapter'}</b><span>${n ? `${summary}.` : 'Simulators, skills tools and drills for the course.'}</span></a>`,
    ];
    const sets = groups.map(([name, items]) => `<section class="bk-toolset"><h3>${name} <small>${items.length}</small></h3><ul>${items.map(it => `<li><a href="${it.href}">${esc(it.title)}</a></li>`).join('')}</ul></section>`).join('');
    return `<h2 class="bk-h" id="h-practice">Practice this ${ch.part === 'course' ? 'unit' : 'chapter'}</h2>
    <div class="bk-cards">
      ${cards.join('\n      ')}
    </div>
    ${sets ? `<h2 class="bk-h" id="h-tools">In this ${ch.part === 'course' ? 'unit' : 'chapter'}'s tools</h2>
    <div class="bk-tools">${sets}</div>` : ''}`;
  }
  const unitLink = (c, dir) => c && chapterBuilt(c)
    ? `<a class="tb-chapter-link${dir === 'next' ? ' next' : ''}" href="${c.id}.html"><span>${dir === 'next' ? `${unitLabel(c)} &rarr;` : `&larr; ${unitLabel(c)}`}</span><b>${esc(c.title)}</b></a>` : '';

  /* One printable page per unit (spec section 1): each built topic's
     summary, key ideas, the chain in brief and the terms it defines. */
  function unitSheet(chId) {
    const ch = chapterById(chId), depth = '../';
    const ts = topicsOf(chId).filter(t => C.built.has(t.id));
    const title = courseTitle(`${ch.part === 'course' ? `Unit ${ch.n}` : ch.title} summary sheet`, [`${LABEL} Unit Sheet`, LABEL]);
    const desc = clampDesc(`A one-page printable summary of ${ch.title.toLowerCase()}: every topic's key ideas, steps and terms on a single sheet, free to print.`);
    const url = `${SITE}${BASE}unit-sheets/${chId}.html`;
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#sheet`, name: `${ch.title} summary sheet`, url, description: desc, learningResourceType: 'Summary', isAccessibleForFree: true, isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: ch.title, url: `${SITE}${BASE}units/${chId}.html` }, { name: 'Unit sheet', url }])),
    ] };
    const terms = t => map.concepts.filter(c => c.taughtIn === t.id && C.glossary[c.id]);
    const body = `
${bodyOpen(` data-unit="${chId}"`)}
<main id="main" class="xshell calc-sheet">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../units/${chId}.html` }, { name: 'Unit sheet' }])}
  <header class="calc-sheet-head">
    <p class="eyebrow">${unitLabel(ch)} ${BETA_PILL}</p>
    <h1>${esc(ch.title)}: the one-page sheet</h1>
    ${shareBar(`unit-sheets/${chId}.html`, `${ch.title}: calculus unit sheet`, 'unit sheet')}
  </header>
  <div class="calc-sheet-grid">${ts.map(t => {
      const L = C.lessons[t.id];
      return `<section class="calc-sheet-topic" aria-labelledby="s-${t.id}"><h2 id="s-${t.id}">${t.ced ? `<span>${esc(t.ced)}</span> ` : ''}${esc(t.title)}</h2>
      <p>${text(L.summary)}</p>
      ${(L.ideas || []).length ? `<ul>${L.ideas.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
      <p class="calc-sheet-chain">${L.chain.map(s => esc(text(s.effect))).join(' <span aria-hidden="true">&rarr;</span> ')}</p>
      ${terms(t).length ? `<dl class="calc-sheet-terms">${terms(t).map(c => `<div><dt>${esc(c.term)}</dt><dd>${escKeepMath(C.glossary[c.id].def)}</dd></div>`).join('')}</dl>` : ''}
    </section>`;
    }).join('\n  ')}</div>
</main>
${footer(depth, `sheet:${chId}`)}
${tail({ depth, section: 'learn' })}
</body>
</html>
`;
    return head({ title, desc, path: `unit-sheets/${chId}.html`, depth, jsonld, noindex }) + body;
  }

  /* ---------------------------------------------------------- glossary */
  /* The shared glossary page (scripts/lib/glossary.mjs): the opener, filters
     and A-Z rail are here; assets/course/glossary-page.js draws every term
     from assets/glossary.json. #t-<concept> anchors still land on the term. */
  function glossaryChapters() {
    return map.chapters.map(ch => ({ id: ch.id, title: ch.part === 'course' ? `Unit ${ch.n}: ${ch.title}` : ch.title }));
  }
  function glossaryTerms() {
    return map.concepts.filter(c => C.glossary[c.id]).map(c => {
      const t = map.topicById(c.taughtIn);
      return {
        id: c.id, term: c.term, def: C.glossary[c.id].def, topic: c.taughtIn, topicTitle: t ? t.title : '',
        href: C.built.has(c.taughtIn) ? `notes/${c.taughtIn}.html` : '',
        aka: c.aliases.filter(a => a.toLowerCase() !== c.term.toLowerCase()), chapter: t ? t.chapter : '',
      };
    });
  }
  function glossaryPage() {
    const depth = '';
    const terms = glossaryTerms();
    const title = courseTitle('Glossary', [LABEL]);
    const desc = clampDesc(`${terms.length.toLocaleString('en-US')} calculus terms with plain definitions, each linked to the free notes page that teaches it.`);
    const url = `${SITE}${BASE}glossary.html`;
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'DefinedTermSet', '@id': `${url}#terms`, name: `${COURSE_NAME} glossary`, url, description: desc },
      crumbs(orgCrumbs([{ name: 'Glossary', url }])),
    ] };
    const body = `
${bodyOpen()}
<main id="main" class="xshell">
  ${terms.length ? glossaryMain({
    crumbs: [{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Glossary' }],
    courseHtml: COURSE_HTML, beta: true, chapterWord: 'unit',
    lede: `${terms.length.toLocaleString('en-US')} terms${!map.chapters.every(chapterBuilt) ? ' so far' : ''}, in plain words. Each one links to the page that teaches it.`,
    chapters: glossaryChapters(), terms, placeholder: 'e.g. derivative, Riemann sum, concavity', searchHref: 'search.html',
  }) : '<p>Terms appear here as units are published.</p>'}
  <p class="calc-report-page calc-nav-ref">Spot a mistake on this page? ${reportButton('glossary')}</p>
</main>
${footer(depth, 'glossary')}
${tail({ depth, section: 'glossary' })}
${glossaryScript('glossary-page.js', { up: '../', data: 'assets/glossary.json', root: '' })}
</body>
</html>
`;
    return head({ title, desc, path: 'glossary.html', depth, ogType: 'website', jsonld, noindex }).replace('<link rel="stylesheet" href="assets/calc.css">', '<link rel="stylesheet" href="../assets/course/base.css">\n<link rel="stylesheet" href="../assets/course/glossary.css">\n<link rel="stylesheet" href="assets/calc.css">') + body;
  }

  /* ------------------------------------------------------------- learn */
  function learnPage() {
    const depth = '';
    const title = courseTitle('All units and skills', [LABEL]);
    const desc = clampDesc(`Every unit of the calculus course in framework order, ${units.length} units and ${topics.length} topics, plus a math chapter for units, symbols, proportional reasoning, graphs and vector components.`);
    const url = `${SITE}${BASE}learn.html`;
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'CollectionPage', '@id': `${url}#learn`, name: 'All units and skills', url, description: desc, isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'All units', url }])),
    ] };
    const section = (chs, h) => `<section class="tb-static-part"><h2>${h}</h2>${chs.map(ch => {
      const ts = topicsOf(ch.id);
      return `<section class="tb-static-chapter"><h3>${ch.part === 'course' ? `Unit ${ch.n}: ` : ''}${esc(ch.title)}</h3><ol>${ts.map(t => `<li>${C.built.has(t.id) ? `<a href="notes/${t.id}.html">${esc(t.title)}</a>` : `<span class="bk-unbuilt">${esc(t.title)}</span>`}${t.ced ? ` <span class="bk-small">${esc(t.ced)}</span>` : ''}</li>`).join('')}</ol>${chapterBuilt(ch) ? '' : '<p class="bk-small">Coming soon.</p>'}</section>`;
    }).join('')}</section>`;
    const body = `
${bodyOpen()}
<div class="tb-shell bk bk-book">
  ${tocBtn('Contents')}
  ${courseRail(null, depth, true)}
  <main class="tb-main" id="main">
    ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'All units' }])}
    <div id="calc-book" aria-live="polite">
      <div class="tb-static-toc">
        <h1>The ${COURSE_HTML} textbook</h1>
        <p>${units.length} units in framework order, then the skills the exam tests. Each topic is a notes page you can read on its own, free.</p>
        ${section(units, 'Units')}
        ${skills.length ? section(skills, 'Skills') : ''}
      </div>
    </div>
  </main>
</div>
${footer(depth, 'learn')}
${tail({ depth, section: 'learn', extra: ['calc-toc.js', 'calc-book.js'] })}
</body>
</html>
`;
    return head({ title, desc, path: 'learn.html', depth, ogType: 'website', jsonld, noindex, book: true }) + body;
  }

  /* -------------------------------------------------------------- home
     Laid out like the A&P and ochem homes (spec decision 27): a level card
     beside the hero, three "now" cards, the path through the units, the
     simulators band and one real question. The markup is the first-visit
     state and reads on its own without JavaScript; assets/calc-home.js fills
     the level card, the three cards and the path from the runtime. */
  const PART_COLORS = { course: ['#C2305A', '#8C1036'], skills: ['#3E7C8C', '#24525E'] };
  const PART_LABEL = { course: 'Units', skills: 'Math you need' };
  const HOME_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
  // The "Try a step" card: one real question from a free unit's bank, read at
  // build time. Chosen when Unit 1 is written; until then the card is left out
  // (the test fixture's sample topic is 1.2).
  const SAMPLE_Q = { topic: 'limit-notation', id: 'calc-limit-notation-15' };
  const STREAK_SVG = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2c1 4-3 5-3 9a3 3 0 006 0c1.5 1 2 3 2 4.5A5.5 5.5 0 0111.5 21 6 6 0 016 15c0-5 4-6 4-9 0-1.5-.5-2.5-1-3.5C10.5 2 11 2 12 2z" fill="currentColor"/></svg>';

  function homePath(depth) {
    let prevPart = null, skill = 0;
    const nodes = map.chapters.map((ch, i) => {
      const [pc, pcd] = PART_COLORS[ch.part] || PART_COLORS.course;
      const start = ch.part !== prevPart; prevPart = ch.part;
      const n = topicsOf(ch.id).length, built = chapterBuilt(ch);
      const num = ch.part === 'course' ? ch.n : `S${++skill}`;
      const w = Array.isArray(ch.weight) ? ` &middot; ${ch.weight[0]}&ndash;${ch.weight[1]}% of exam` : '';
      const inner = `<span class="ring" aria-hidden="true"><span class="n">${num}</span></span><span class="label">${start ? `<span class="part">${esc(PART_LABEL[ch.part] || ch.part)}</span>` : ''}<b>${ch.part === 'course' ? `<span class="sr-only">Unit ${ch.n}: </span>` : ''}${esc(ch.title)}</b><small>${i === 0 ? 'Start here &middot; ' : ''}${n} topic${n === 1 ? '' : 's'}${w}${built ? '' : ' &middot; coming soon'}</small></span>`;
      // Snake placement for 5, 4 and 3 columns (calc-home.css picks one by width).
      const at = [5, 4, 3].map(k => { const r = Math.floor(i / k), c = r % 2 ? k - (i % k) : (i % k) + 1; return `--r${k}:${r + 1};--c${k}:${c}`; }).join(';');
      return `<li class="node${start ? ' part-start' : ''}${i === 0 ? ' current' : ''}" data-unit="${ch.id}" style="--pc:${pc};--pcd:${pcd};${at}">${built ? `<a href="${depth}units/${ch.id}.html">${inner}</a>` : `<div>${inner}</div>`}</li>`;
    });
    return `<div class="calc-path" id="calcPath"><svg class="path-line" aria-hidden="true" focusable="false"><path class="path-track" d=""/><path class="path-fill" d=""/></svg><ol class="calc-path-list">${nodes.join('')}</ol></div>`;
  }

  function homeSample(depth) {
    const t = map.topicById(SAMPLE_Q.topic);
    const q = t && C.built.has(t.id) && isFreeTopic(map, t) && ((C.questions[t.id] || {}).items || []).find(x => x.id === SAMPLE_Q.id && x.type === 'single' && !x.stimulus);
    if (!q) return '';
    const ch = chapterById(t.chapter);
    // Options and the stem may carry rendered math: placed as HTML, the why as text.
    const opts = q.options.map((o, i) => `<button type="button" class="qopt" data-i="${i}"${q.why.options ? ` data-why="${esc(text(q.why.options[i]))}"` : ''}><span class="letter">${'ABCDEFG'[i]}</span> ${o}</button>`).join('');
    return `
  <section class="xsection" id="sample" aria-labelledby="h-sample">
    <div class="calc-sample-row">
      <div>
        <h2 id="h-sample">Try a step.</h2>
        <p class="section-lede">One real question from the bank. Pick an answer to see why it is right or wrong.</p>
        <ol class="calc-sample-list">
          <li><span class="n" aria-hidden="true">1</span> Read the situation</li>
          <li><span class="n" aria-hidden="true">2</span> Pick the answer you would bet on</li>
          <li><span class="n" aria-hidden="true">3</span> See the cause and effect behind it</li>
        </ol>
      </div>
      <div class="calc-qcard" id="calcSample" data-correct="${q.correct}">
        <span class="tag domain">${esc(unitLabel(ch))} &middot; ${esc(ch.title)}</span> <span class="tag diff">${esc(t.title)}</span>
        <p class="qtext" id="calcSampleQ">${q.q}</p>
        <div class="calc-qopts" role="group" aria-labelledby="calcSampleQ">${opts}</div>
        <p class="why" id="calcSampleWhy" aria-live="polite"></p>
        <details class="calc-sample-key"><summary>Show the answer</summary><p><b>${q.options[q.correct]}</b> ${q.why.correct}</p></details>
        <p class="calc-sample-more"><a class="link-quiet" href="${depth}lessons/${t.id}.html">Open the free lesson on ${esc(t.title.toLowerCase())} &rarr;</a></p>
      </div>
    </div>
  </section>`;
  }


  function homePage() {
    const depth = '';
    const title = `${LABEL} Course, Free to Start | LevlPrep`;
    const desc = 'Calculus AB exam prep in framework order: lessons from scratch, free notes, trainers, typed answers graded by value, and calculator and no-calculator practice.';
    const url = `${SITE}${BASE}`;
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Course', '@id': COURSE_ID, name: COURSE_NAME, url, description: desc, inLanguage: 'en', ...(offers ? { offers } : {}),
        provider: { '@id': `${SITE}/#org` }, educationalLevel: 'High school',
        hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: 'Self-paced' },
        syllabusSections: map.chapters.map(c => ({ '@type': 'Syllabus', name: c.title })) },
      crumbs(orgCrumbs([])),
    ] };
    const first = topics.find(t => C.built.has(t.id));
    const firstCh = first && chapterById(first.chapter);
    const unitTopics = topics.filter(t => chapterById(t.chapter).part === 'course');
    const skillTopics = topics.length - unitTopics.length;
    const nq = built.reduce((n, t) => n + C.questions[t.id].items.length, 0);
    const word = n => HOME_WORDS[n] || String(n);
    // Free units, from the premium data (freeChapters), named in course order.
    const freeUnits = (() => { try { return premiumData().COURSES[COURSE_KEY].freeChapters || []; } catch { return []; } })()
      .map(id => chapterById(id)).filter(c => c && c.part === 'course').sort((a, b) => a.n - b.n);
    const freeUnitsText = freeUnits.length ? `Unit${freeUnits.length === 1 ? '' : 's'} ${freeUnits.map(c => c.n).join(freeUnits.length === 2 ? ' and ' : ', ')}` : '';
    const dailyFree = (() => { try { return premiumData().COURSES[COURSE_KEY].dailyFree || 0; } catch { return 0; } })();
    // The simulators band: every live simulator; the free ones (no premium flag) say so.
    const sims = (C.pages.tools || []).filter(t => t.kind === 'simulator' && toolLive(t));
    const freeSims = sims.filter(t => !t.premium).map(t => t.name.toLowerCase());
    const freeSim = sims.find(t => !t.premium);
    // Free drills (the rule drills) are named too, so the line lists every free tool (launch continuity pass).
    const freeDrills = (C.pages.tools || []).filter(t => t.kind !== 'simulator' && toolLive(t) && !t.premium).map(t => t.name.toLowerCase());
    const andDrills = freeDrills.length ? `, and so ${freeDrills.length === 1 && !/s$/.test(freeDrills[0]) ? 'is' : 'are'} the ${freeDrills.join(' and ')}` : '';
    const freeLine = freeSims.length ? (freeSims.length === 1 ? `The ${freeSims[0]} trainer is free${andDrills}.` : `The ${freeSims.slice(0, -1).join(', ')} and ${freeSims[freeSims.length - 1]} trainers are free${andDrills}.`) : '';
    const partCount = id => map.chapters.filter(c => c.part === id).length;
    const partTopics = id => topics.filter(t => chapterById(t.chapter).part === id).length;
    const bars = map.parts.map(p => `<div class="mini-domain-row"><span>${esc(PART_LABEL[p.id] || p.title)}</span><span class="bar"><i data-part-bar="${p.id}" style="width:0%;--dc:${(PART_COLORS[p.id] || PART_COLORS.course)[0]}"></i></span><span class="pct" data-part-pct="${p.id}">0%</span></div>`).join('');
        const HOME = {
      key: COURSE_KEY, prefix: 'calc', mainClass: 'calc-home', courseHtml: COURSE_HTML, beta: BETA_PILL,
      t2: `one idea at a time.`, lede: `Each topic taught from scratch, in framework order, then practice that grades typed answers and justifications.`, storageKey: 'apcalc_progress_v1',
      first, firstCh, unitLabel, freeUnits, freeUnitsText, dailyFree, chapters: map.chapters, topicsOf, chapterBuilt,
      partLabel: PART_LABEL, nq, apps: C.pages.apps || [], tools: (C.pages.tools || []).filter(toolLive), toolIcon: TOOL_ICON,
      exam: { mcq: MCQ_PARTS.reduce((n, p) => n + p.n, 0), mcqTime: `${MCQ_PARTS.reduce((n, p) => n + p.minutes, 0)} minutes`, frq: FRQ_TOTAL, frqTime: `${FRQ_PARTS.reduce((n, p) => n + p.minutes, 0)} minutes` }, sample: homeSample(depth),
    };
    const body = `
${bodyOpen()}
${apHomeMain(HOME)}
${footer(depth, 'home')}
${tail({ depth, section: 'home', extra: ['calc-home.js'] })}
</body>
</html>
`;
    return head({ title, desc, path: '', depth, ogType: 'website', jsonld, noindex, meta: '<link rel="stylesheet" href="../assets/course/base.css">\n<link rel="stylesheet" href="../assets/course/hub.css">\n<link rel="stylesheet" href="assets/calc-home.css">\n<link rel="stylesheet" href="../assets/course/r3.css">\n' }) + body;
  }

  /* --------------------------------------------------- app page shells */
  // Pages that show one student's own state are never indexed; the cram kit
  // is one (a plan from their exam date and mastery; docs/apbio-spec.md decision 26).
  const STATE_PAGES = new Set(['dashboard', 'review', 'search', 'cram']);
  /* ---- Tools hub (docs/course-shell.md, W-D): every published tool as the
     shared tool card (assets/course/hub.js), grouped by kind, written into
     the page so it reads and links without JavaScript. pages/tools.js adds
     each tool's "Not tried yet" or accuracy and the Premium pills. */
  const HUB_PAGES = new Set(['dashboard', 'search', 'tools']);
  const TOOL_ICON = {
    // The integral sign over a curve and its tangent (docs/apcalc-spec.md decision 6), the same 24-px stroke icon as the hub card.
    simulator: '<path d="M14.5 3.5c-1.3-.7-2.6.1-2.8 1.6l-1.4 13.8c-.2 1.5-1.5 2.3-2.8 1.6"/><path d="M3 17c3 0 4-7 8-8s5 2 6 3" stroke-opacity=".55"/><path d="M15 6l6 4" stroke-dasharray="1.5 2.5"/>',
    skill: '<path d="M4 4v16h16"/><path d="M7 15l4-4 3 3 5-6"/>',
    drill: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
  };

  const TOOL_GROUPS = [
    { kind: 'simulator', h: 'Trainers', p: 'Work through a model or a representation, then answer questions about it.' },
    { kind: 'skill', h: 'Skills tools', p: 'The math and data skills the exam tests, with worked steps.' },
    { kind: 'drill', h: 'Drills', p: 'Seeded, unlimited calculation drills, checked step by step.' },
  ];
  function toolsHub() {
    const live = (C.pages.tools || []).filter(toolLive);
    const topicTitle = t => { const x = map.topicById(t.topic); return x ? x.title : ''; };
    const groups = TOOL_GROUPS.map(g => ({ ...g, tools: live.filter(t => t.kind === g.kind) })).filter(g => g.tools.length);
    return `
  <div class="cx-tools">
  ${groups.map(g => `<div class="cx-tools-h"><h2>${esc(g.h)}</h2><p>${esc(g.p)}</p></div>
  ${Hub.toolGrid(g.tools.map(t => ({
    href: `tools/${t.slug}.html`, name: t.name, desc: t.blurb, icon: TOOL_ICON[t.slug] || TOOL_ICON[t.kind], stroke: true,
    attrs: ` data-tool="${t.slug}"${t.premium ? ' data-premium="1"' : ''}`, foot: esc(topicTitle(t)), status: '',
  })), g.h)}`).join('\n  ')}
  <p class="cx-tools-note">Every tool records what you answer: missed questions go into your <a href="review.html">review queue</a>, and your accuracy shows here and on the <a href="dashboard.html">dashboard</a>.</p>
  </div>
  `;
  }

  function appShell(a) {
    const depth = '', path = `${a.slug}.html`, url = `${SITE}${BASE}${path}`;
    const scriptOk = a.script && existsSync(join(ROOT, 'calculus', 'assets', a.script));
    // css: one file, or a list (a page that adds its own sheet on top of pages.css).
    const cssList = [].concat(a.css || []).filter(f => existsSync(join(ROOT, 'calculus', 'assets', f)));
    const hub = HUB_PAGES.has(a.slug);
    // Practice, Review, Flashcards and Exams: the shared study shell
    // (docs/course-shell.md, W-C), as in the other three courses.
    const study = ['practice', 'review', 'exams', 'flashcards'].includes(a.slug);
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebPage', '@id': `${url}#page`, name: a.h1, url, description: a.desc, isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: a.h1, url }])),
    ] };
    const body = `
${bodyOpen(` data-app="${a.slug}"`)}
<main id="main" class="xshell calc-app">
  ${study || hub ? crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: a.h1 }]).replace('class="calc-crumb', 'class="cx-crumb calc-crumb')
    : crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: a.h1 }])}
  ${study || hub
    ? `<header class="page-head"><div class="eyebrow">${COURSE_HTML} <span class="cx-beta">Beta</span></div><h1>${esc(a.h1)}</h1><p class="lede">${esc(a.lede || a.desc)}</p></header>`
    : `<header class="hero calc-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>${esc(a.h1)}</h1><p class="lede">${esc(a.lede || a.desc)}</p></header>`}
  <div id="app" class="calc-app-mount${study ? ' cx-study' : ''}" data-slug="${a.slug}"${a.premium ? ` data-premium="${a.premium}"` : ''}${a.studio ? ' data-studio="1"' : ''}>${a.slug === 'tools' ? toolsHub() : scriptOk
    ? '<noscript><p>This page needs JavaScript. Every notes page works without it.</p></noscript>'
    : `<p class="calc-soon">This page arrives with the first published unit. Meanwhile, read the <a href="learn.html">free notes</a>.</p>`}</div>
</main>
${footer(depth, `page:${a.slug}`)}
${hub ? '<link rel="stylesheet" href="../assets/course/base.css">\n<link rel="stylesheet" href="../assets/course/hub.css">\n<script src="../assets/course/hub.js" defer></script>\n' : ''}${cssList.map(f => `<link rel="stylesheet" href="assets/${f}">\n`).join('')}${a.studio ? '<link rel="stylesheet" href="../assets/course/tool-studio.css">\n' : ''}${tail({ depth, section: a.section, extra: ['calc-questions.js', ...(scriptOk ? [a.script] : [])], premium: true, site: [...(study ? ['course/study.js'] : []), ...(['practice', 'review', 'exams', 'dashboard'].includes(a.slug) ? ['course/flags.js'] : []), ...(a.studio ? ['course/tool-studio.js'] : []), ...(a.siteScripts || [])] })}
</body>
</html>
`;
    const page = head({ title: courseTitle(a.title, [LABEL]), desc: a.desc, path, depth, ogType: 'website', jsonld, noindex: noindex || STATE_PAGES.has(a.slug) }) + body;
    // Progress page: the redesigned opener and its sheet (scripts/lib/dashboard-page.mjs).
    if (a.slug === 'dashboard') return dashboardPage(page, 'apcalc');
    const out = study ? page.replace('<link rel="stylesheet" href="assets/calc.css">',
      '<link rel="stylesheet" href="../assets/course/base.css">\n<link rel="stylesheet" href="../assets/course/study.css">\n<link rel="stylesheet" href="assets/calc.css">') : page;
    return a.slug === 'exams' ? examsPage(out, 'apcalc', map) : out;
  }

  /* ------------------------------------------------------------- FRQs */
  /* Free-response questions (data/frq/<id>.json, docs/apcalc-architecture.md).
     One goes out when every unit it lists is published and its topics are
     in the map: assets/frq/index.json (the list frq.html and exams.html
     read), assets/frq/<id>.json (the whole question, stimulus rendered) and
     frq/<id>.html, the stable, shareable, printable page. The rubric and the
     sample answer are not in that page's HTML: frq-kit.js fetches them when
     the student asks for them (and prints them only when asked). */
  // The recurring free-response types (docs/apcalc-research/framework.md,
  // section 5), 9 points each; f.calc puts a question in Part A (calculator)
  // or Part B (no calculator).
  const FRQ_TYPE_NAME = { table: 'Rate in context from a table', model: 'Modeling with a given function', motion: 'Particle motion', area: 'Area and volume', de: 'Differential equation and slope field', graph: 'Graph of f\u2032 or graphical FTC', implicit: 'Implicit differentiation and related rates', fg: 'Table of f, g and their derivatives' };
  const FRQ_ORDER = Object.keys(FRQ_TYPE_NAME);
  const frqStimulus = f => {
    if (f.stimulus && typeof f.stimulus === 'object') return f.stimulus;
    for (const q of Object.values(C.questions)) if (q.stimuli && q.stimuli[f.stimulus]) return q.stimuli[f.stimulus];
    return null;
  };
  const frqs = Object.values(C.frq)
    .filter(f => f && f.id && FRQ_TYPE_NAME[f.type] && (f.units || []).length && f.units.every(u => C.published.has(u)) && (f.topics || []).every(t => map.topicById(t)) && frqStimulus(f))
    .sort((a, b) => FRQ_ORDER.indexOf(a.type) - FRQ_ORDER.indexOf(b.type) || a.id.localeCompare(b.id));
  const frqTitle = f => text(f.title || frqStimulus(f).title) || FRQ_TYPE_NAME[f.type];
  const frqUnitLabel = f => f.units.map(u => { const c = chapterById(u); return c ? unitLabel(c) + (c.part === 'course' ? '' : `: ${c.title}`) : u; }).join(', ');
  function frqJson(f) {
    const s = frqStimulus(f);
    return {
      id: f.id, type: f.type, typeName: FRQ_TYPE_NAME[f.type], points: f.points, calc: !!f.calc, title: frqTitle(f), units: f.units, topics: f.topics, practices: f.practices,
      ...(f.placeholder ? { placeholder: true } : {}),
      stimulus: { kind: s.kind, title: s.title || '', html: stimulusBody(C, s, '') },
      parts: f.parts.map(p => ({ label: p.label, prompt: p.prompt, points: p.points, rubric: p.rubric, sample: p.sample, ...(p.space ? { space: p.space } : {}) })),
      ...(f.graphSpec ? { graphSpec: f.graphSpec } : {}),
    };
  }
  const frqIndex = () => JSON.stringify(frqs.map(f => ({ id: f.id, type: f.type, points: f.points, calc: !!f.calc, title: frqTitle(f), units: f.units, topics: f.topics, practices: f.practices, ...(f.placeholder ? { placeholder: true } : {}) })));
  /* Lined answer space for paper (shown only in print): about six lines a point. */
  const lines = n => `<div class="calc-lines" aria-hidden="true">${'<div></div>'.repeat(n)}</div>`;
  const graphGrid = g => `<div class="calc-frq-grid" role="img" aria-label="Blank grid for your graph${g.x && g.x.label ? `: ${esc(text(g.x.label))} on the x-axis` : ''}${g.y && g.y.label ? `, ${esc(text(g.y.label))} on the y-axis` : ''}"></div>`;
  /* Which answer space a part gets on paper: its own "space" ("graph" or
     "lines"), else a blank grid when the FRQ has a graphSpec and the prompt
     asks for a sketch. */
  const partSpace = (f, p) => p.space || (f.graphSpec && /sketch|graph|draw/i.test(text(p.prompt)) ? 'graph' : 'lines');
  function frqPage(f) {
    const depth = '../', s = frqStimulus(f), title = frqTitle(f);
    const url = `${SITE}${BASE}frq/${f.id}.html`;
    const desc = clampDesc(`${title}: a ${f.points}-point calculus free-response question (${FRQ_TYPE_NAME[f.type].toLowerCase()}, ${f.calc ? 'calculator' : 'no calculator'}) with a point-by-point rubric, a sample answer and a printable answer sheet.`);
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#frq`, name: title, url, description: desc, learningResourceType: 'Free-response question', educationalLevel: 'High school', inLanguage: 'en', isPartOf: { '@id': COURSE_ID }, provider: { '@id': `${SITE}/#org` } },
      crumbs(orgCrumbs([{ name: 'Free-response practice', url: `${SITE}${BASE}frq.html` }, { name: title, url }])),
    ] };
    const g = f.graphSpec || null;
    const body = `
${bodyOpen(` data-frq="${f.id}"`)}
<main id="main" class="xshell calc-app calc-frq-page">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: 'Free-response practice', href: '../frq.html' }, { name: title }])}
  <header class="hero calc-hero">
    <div class="eyebrow">Free response &middot; ${esc(frqUnitLabel(f))} ${BETA_PILL}</div>
    <h1>${esc(title)}</h1>
    <p class="lede">${esc(FRQ_TYPE_NAME[f.type])} &middot; ${f.calc ? 'Part A: graphing calculator allowed' : 'Part B: no calculator'} &middot; ${f.points} points${f.placeholder ? ' &middot; <b>placeholder question</b>, written to test the page and not checked for accuracy' : ''}</p>
    ${shareBar(`frq/${f.id}.html`, `${title}: calculus free-response question`, 'question')}
  </header>
  <article class="calc-frq" aria-labelledby="h-frq-q">
    <h2 id="h-frq-q" class="sr-only">The question</h2>
    <p class="calc-frq-print-head">Name: ______________________ &nbsp; Date: ____________ &nbsp; ${esc(title)} (${f.points} points)</p>
    ${stimulusPanel(`frq-${f.id}`, s, stimulusBody(C, s, depth))}
    <ol class="calc-frq-parts">${f.parts.map(p => `<li class="calc-frq-part" data-part="${esc(p.label)}"><p class="calc-frq-prompt"><b class="calc-frq-label">(${esc(p.label)})</b> ${p.prompt} <span class="calc-small">[${p.points} point${p.points === 1 ? '' : 's'}]</span></p>${partSpace(f, p) === 'graph' && g ? graphGrid(g) + lines(4) : lines(Math.max(5, p.points * 6))}</li>`).join('')}</ol>
  </article>
  <div id="app" class="calc-app-mount calc-frq-work" data-slug="frq-item" data-frq="${f.id}" data-unit="${esc(f.units[0])}" data-topic="${esc(f.topics[0] || '')}"><noscript><p>Writing your answer, the rubric and the sample answer need JavaScript. The question above prints without it.</p></noscript></div>
</main>
${footer(depth, `frq:${f.id}`)}
<link rel="stylesheet" href="../assets/pages/pages.css">
<link rel="stylesheet" href="../../assets/course/reading.css">
${tail({ depth, section: 'exams', extra: ['pages/frq-kit.js', 'pages/frq.js'], premium: true })}
</body>
</html>
`;
    return head({ title: courseTitle(title, [`${LABEL} Free Response`, LABEL]), desc, path: `frq/${f.id}.html`, depth, jsonld, noindex }) + body;
  }

  /* ---------------------------------------------------------- teachers */
  /* For teachers (spec section 1, "Teachers and under-18s"): generated,
     indexable once the course is live, not an app. The framework order with
     our lessons, how to assign (stable links, question sets, FRQs, printing,
     Google Classroom), access, privacy. Nothing here that is not true of the
     site today: no instructor sign-up flow exists, so access is by email,
     and no class discount is published (docs/apcalc-needs-author.md). */
  function teachersPage(a) {
    const depth = '', url = `${SITE}${BASE}teachers.html`;
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebPage', '@id': `${url}#page`, name: a.h1, url, description: a.desc, audience: { '@type': 'EducationalAudience', educationalRole: 'teacher' }, isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: a.h1, url }])),
    ] };
    const link = (href, label) => `<a href="${href}">${label}</a>`;
    const unitTable = ch => {
      const ts = topicsOf(ch.id);
      const rows = ts.map(t => {
        const b = C.built.has(t.id);
        return `<tr><th scope="row">${esc(t.ced || 'Skill')}</th><td>${b ? link(`lessons/${t.id}.html`, esc(t.title)) : esc(t.title)}</td><td>${b ? `${link(`notes/${t.id}.html`, 'Notes')} &middot; ${link(`practice.html?topic=${t.id}`, 'Question set')}` : '<span class="calc-small">Coming soon</span>'}</td></tr>`;
      }).join('');
      const has = chapterBuilt(ch);
      return `<section class="calc-tc-unit" aria-labelledby="tc-${ch.id}"><h3 id="tc-${ch.id}">${ch.part === 'course' ? `Unit ${ch.n}: ` : ''}${esc(ch.title)}${Array.isArray(ch.weight) ? ` <span class="calc-small">${ch.weight[0]}&ndash;${ch.weight[1]}% of the exam</span>` : ''}</h3>
      ${has ? `<p class="calc-small">${link(`units/${ch.id}.html`, 'Unit page')} &middot; ${link(`unit-sheets/${ch.id}.html`, 'Printable unit sheet')} &middot; ${link(`practice.html?unit=${ch.id}`, 'Question set for the unit')}${ch.part === 'course' ? ` &middot; ${link(`exams.html?unit=${ch.id}`, 'Unit test')}` : ''}</p>` : ''}
      <table class="calc-tc-table"><caption class="sr-only">${esc(ch.title)}: topics in framework order</caption><thead><tr><th scope="col">Topic</th><th scope="col">Lesson</th><th scope="col">Assign</th></tr></thead><tbody>${rows}</tbody></table></section>`;
    };
    const frqList = frqs.length ? `<ul class="calc-links">${frqs.map(f => `<li>${link(`frq/${f.id}.html`, esc(frqTitle(f)))} <span class="calc-small">${esc(FRQ_TYPE_NAME[f.type])}, ${f.calc ? 'calculator' : 'no calculator'}, ${f.points} points${f.placeholder ? ', placeholder' : ''}</span></li>`).join('')}</ul>` : '<p>Free-response questions appear here as units are published.</p>';
    const body = `
${bodyOpen(' data-app="teachers"')}
<main id="main" class="xshell calc-app calc-teachers">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: a.h1 }])}
  <header class="hero calc-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>${esc(a.h1)}</h1><p class="lede">${esc(a.lede || a.desc)}</p></header>

  <section class="xsection" aria-labelledby="h-assign">
    <h2 id="h-assign">How to assign it</h2>
    <ul class="calc-tc-list">
      <li><b>Stable links.</b> Each lesson, notes page, unit sheet and free-response question has a permanent address, such as <code>levlprep.com/calculus/<wbr>notes/&lt;topic&gt;.html</code>. Links do not expire and need no account.</li>
      <li><b>Question sets.</b> <code>practice.html?topic=&lt;topic&gt;</code> opens practice on one topic, <code>practice.html?unit=unit-1</code> on a whole unit. Students get feedback and an explanation for every option. The practice page can also print a set as a worksheet.</li>
      <li><b>Free-response questions.</b> Each has its own page with the prompt, the data and a printable answer sheet with lined space. Students write, then reveal the rubric and score themselves point by point. Nothing is graded by AI.</li>
      <li><b>Printing.</b> Each lesson, notes page, unit sheet and free-response question has a Print button. A lesson prints all its parts in one run; a free-response question prints with lined answer space, and its rubric can print on a separate page.</li>
      <li><b>Google Classroom.</b> The "Share to Google Classroom" button on each of those pages posts the link to your class.</li>
    </ul>
  </section>

  <section class="xsection" aria-labelledby="h-students">
    <h2 id="h-students">No login for students</h2>
    <p>Students open a link and start. They need no account, and nothing they do leaves their device unless they choose to sign in. Progress, answers and scores are stored in their own browser, and typed free-response answers stay on the device they were written on.</p>
    <p>Privacy, in short: no ads, no cookies, no tracking across other sites, and no new personal data collected from students. The site uses cookieless analytics and sends a short report when a page breaks. Details are on the <a href="../privacy.html#schools">privacy page</a>.</p>
  </section>

  <section class="xsection" aria-labelledby="h-access">
    <h2 id="h-access">Access for teachers and classes</h2>
    <p>Every notes page, the glossary and the unit sheets are free. Teachers can ask for free access to the rest of the course: email <a href="mailto:hello@levlprep.com">hello@levlprep.com</a> from your school address. Ask about discounts for classes at the same address.</p>
  </section>

  <section class="xsection" aria-labelledby="h-frq">
    <h2 id="h-frq">Free-response questions</h2>
    ${frqList}
    <p class="calc-small"><a href="frq.html">All free-response practice</a></p>
  </section>

  <section class="xsection" aria-labelledby="h-align">
    <h2 id="h-align">Alignment with the course framework</h2>
    <p>The units and topics follow the order of the course framework (Calculus AB topics only; the BC-only topics are left out), mapped to our lessons. Titles and explanations are in our own words; nothing reproduces the framework's text. The course is in Beta: it has not yet been reviewed by an ${COURSE_HTML} teacher.</p>
    ${units.map(unitTable).join('\n    ')}
    ${skills.length ? `<h3 class="calc-tc-skills">Skills</h3><p class="calc-small">Each math topic sits right before the framework topic that first needs it.</p>${skills.map(unitTable).join('\n    ')}` : ''}
  </section>

  <p class="calc-disclaimer">Questions are original and never copied from released exams or course materials. ${esc(DISCLAIMER)}</p>
</main>
${footer(depth, 'page:teachers')}
${tail({ depth, section: '' })}
</body>
</html>
`;
    return head({ title: courseTitle(a.title, [LABEL]), desc: a.desc, path: 'teachers.html', depth, ogType: 'website', jsonld, noindex }) + body;
  }

  /* ------------------------------------------------------------- tools
     The ten trainers (docs/apcalc-architecture.md, "Tools") are all
     pre-registered in pages.json tools[], each with its context `topic`. A
     tool is built (tools/<slug>.html and assets/tool-data/<slug>.json) only
     when its data file data/tools/<slug>.json exists AND its context topic
     is published, so four authors can add tools in parallel without a tool
     appearing half-made. Inside a live tool, an item is served when its own
     topic is published (for a skill topic also its anchor's chapter); a
     scenario that "requires" units waits for them too. The page loads the
     shared calc-tool-math.js, then the tool's own model file
     assets/tools/math/<slug>.js (ApCalcMath.<camelSlug>), then the shared
     framework, the plot helper (calc-plot.js, ApCalcPlot) and the tool's
     script. */
  const anchorOf = t => { const id = t.after || t.before; return id ? map.topicById(id) : null; };
  const topicLive = id => { const t = map.topicById(id); if (!t || !C.published.has(t.chapter)) return false; const a = anchorOf(t); return !a || C.published.has(a.chapter); };
  const releaseOf = id => { const t = map.topicById(id); if (!t) return null; const a = anchorOf(t); return chapterById(a ? a.chapter : t.chapter); };
  const toolFile = entry => join(C.data, 'tools', `${entry.slug}.json`);
  const arrivesOf = topicId => { const rel = releaseOf(topicId); return rel ? (rel.part === 'course' ? `Unit ${rel.n}` : `the ${rel.title.toLowerCase()} chapter`) : 'its unit'; };
  function toolData(entry) {
    if (!existsSync(toolFile(entry))) return { slug: entry.slug, live: false, arrives: arrivesOf(entry.topic) };
    const d = JSON.parse(readFileSync(toolFile(entry), 'utf8'));
    if (d.topic !== entry.topic) throw new Error(`build-apcalc: calculus/data/tools/${entry.slug}.json has topic "${d.topic}", pages.json says "${entry.topic}"`);
    const live = x => (!x.topic || topicLive(x.topic)) && (!x.requires || x.requires.every(u => C.published.has(u)));
    const used = new Set();
    const walk = v => {
      if (Array.isArray(v)) return v.filter(x => !(x && typeof x === 'object' && !Array.isArray(x)) || live(x)).map(walk);
      if (v && typeof v === 'object') { if (typeof v.topic === 'string') used.add(v.topic); return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])); }
      return v;
    };
    const out = walk(d);
    for (const t of Object.values(d.partTopics || {})) used.add(t);
    delete out.about;
    const arrives = arrivesOf(d.topic);
    const content = ['questions', 'contexts', 'problems', 'datasets', 'scenarios'].reduce((n, k) => n + (out[k] ? out[k].length : 0), 0);
    if (!topicLive(d.topic) || !content) return { slug: d.slug, live: false, arrives };
    out.live = true;
    out.units = Object.fromEntries([...used].filter(t => map.topicById(t)).map(t => [t, map.topicById(t).chapter]));
    return out;
  }
  const toolLive = entry => existsSync(toolFile(entry)) && topicLive(entry.topic) && toolData(entry).live;
  function toolShell(t) {
    const depth = '../', path = `tools/${t.slug}.html`, url = `${SITE}${BASE}${path}`;
    const scriptOk = existsSync(join(ROOT, 'calculus', 'assets', 'tools', `${t.slug}.js`));
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebApplication', '@id': `${url}#tool`, name: t.name, url, description: t.desc, applicationCategory: 'EducationalApplication', operatingSystem: 'Any',
        ...(t.premium ? lockedLd('.calc-app-mount') : { isAccessibleForFree: true }), isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'Tools', url: `${SITE}${BASE}tools.html` }, { name: t.name, url }])),
    ] };
    // Shared helpers, then this tool's own model (ApCalcMath.<camelSlug>),
    // then the framework and the tool (docs/apcalc-architecture.md, Tools).
    const lib = f => existsSync(join(ROOT, 'calculus', 'assets', f)) ? [f] : [];
    const extra = ['calc-questions.js', ...lib('tools/calc-tool-math.js'), ...lib(`tools/math/${t.slug}.js`), 'tools/calc-tools.js', ...lib('tools/calc-plot.js'), ...(scriptOk ? [`tools/${t.slug}.js`] : [])];
    const body = `
${bodyOpen(` data-app="tool-${t.slug}"`)}
<main id="main" class="xshell calc-app">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: 'Tools', href: '../tools.html' }, { name: t.name }])}
  <header class="hero calc-hero"><div class="eyebrow">${COURSE_HTML} ${t.kind === 'simulator' ? 'trainer' : t.kind === 'drill' ? 'drills' : 'skills'} ${BETA_PILL}</div><h1>${esc(t.name)}</h1><p class="lede">${esc(t.lede || t.blurb)}</p></header>
  <div id="app" class="calc-app-mount" data-slug="${t.slug}" data-src="${depth}assets/tool-data/${t.slug}.json"${t.premium ? ` data-premium="${t.premium}"` : ''}${t.studio ? ' data-studio="1"' : ''}>${scriptOk
    ? '<noscript><p>This tool needs JavaScript. Every notes page works without it.</p></noscript>'
    : `<p class="calc-soon">This tool arrives with its unit. Meanwhile, read the <a href="../learn.html">free notes</a>.</p>`}</div>
</main>
${footer(depth, `tool:${t.slug}`)}
<link rel="stylesheet" href="${depth}assets/tools/calc-tools.css">${existsSync(join(ROOT, 'calculus', 'assets', 'tools', `${t.slug}.css`)) ? `\n<link rel="stylesheet" href="${depth}assets/tools/${t.slug}.css">` : ''}${t.studio ? `\n<link rel="stylesheet" href="${depth}../assets/course/tool-studio.css">` : ''}
${tail({ depth, section: 'tools', extra, premium: true, site: t.studio ? ['course/tool-studio.js'] : [] })}
</body>
</html>
`;
    return head({ title: courseTitle(t.title, [LABEL]), desc: t.desc, path, depth, ogType: 'website', jsonld, noindex: noindex || !toolLive(t) }) + body;
  }

  /* ----------------------------------------------------------- runtime */
  function curriculumJs() {
    const data = {
      units: map.chapters.map(c => ({ id: c.id, n: c.n ?? null, title: c.title, part: c.part, weight: c.weight || null, built: chapterBuilt(c) })),
      topics: topics.map((t, i) => ({ id: t.id, ced: t.ced || null, title: t.title, unit: t.chapter, kind: t.kind, practices: t.practices || [], n: i + 1, built: C.built.has(t.id), free: isFreeTopic(map, t), qn: C.built.has(t.id) ? C.questions[t.id].items.length : 0, ...(bankFile(t) !== t.chapter ? { bank: bankFile(t) } : {}) })),
      practices: map.practices.map(p => ({ id: p.id, name: p.name })),
      parts: map.parts,
      // Built questions per practice: practice mastery is measured against min(20, this).
      practiceCounts: Object.fromEntries(map.practices.map(p => [p.id, built.reduce((n, t) => n + C.questions[t.id].items.filter(q => String(q.practice).split('.')[0] === String(p.id)).length, 0)])),
    };
    const pages = (C.pages.apps || []).map(a => ({ slug: a.slug, h1: a.h1 }));
    const toolList = (C.pages.tools || []).map(t => { const live = toolLive(t); return { slug: t.slug, kind: t.kind, name: t.name, blurb: t.blurb, topic: t.topic, live, ...(live ? {} : { arrives: arrivesOf(t.topic) }), ...(t.premium ? { premium: 1 } : {}) }; });
    return `/* Generated by scripts/build-apcalc.mjs from the course map. Do not edit. */
window.ApCalcPages = ${JSON.stringify(pages)};
window.ApCalcToolList = ${JSON.stringify(toolList)};
window.ApCalcCurriculum = ${JSON.stringify(data)};
`;
  }
  function glossaryJson() {
    return sharedGlossaryJson({ chapters: glossaryChapters(), terms: glossaryTerms() });
  }
  /* The bank, one pair of files per published chapter: questions and their
     stimulus panels, then explanations (fetched after an answer). */
  /* Which bank file a topic's questions go in: its unit, or, when the unit's
     questions would pass BANK_GZ gzipped (MathML and plotted stimuli make
     calculus items heavy), <unit>-a, <unit>-b, ... packed in course order, so
     no file outgrows its weight budget (check-weight.mjs: split a unit rather
     than raise the budget). The curriculum carries it as topics[].bank for
     the runtime; explanations follow the same split. */
  const BANK_GZ = 44 * 1024;
  let plan = null;
  const cores = new Map();
  function coreOf(t) {
    if (cores.has(t.id)) return cores.get(t.id);
    const qf = C.questions[t.id], stimuli = {}, items = [];
    for (const [sid, s] of Object.entries(qf.stimuli || {})) stimuli[sid] = { kind: s.kind, title: s.title, html: stimulusBody(C, s, '') };
    for (const q of qf.items) {
      const { why: _w, ...rest } = questionForPage(q);
      if (rest.variables) rest.variables = rest.variables.map(v => ({ name: v.name, answer: v.answer }));
      items.push(rest);
    }
    cores.set(t.id, { stimuli, items });
    return cores.get(t.id);
  }
  function bankPlan() {
    if (plan) return plan;
    plan = new Map();
    const gz = parts => gzipSync(JSON.stringify({ stimuli: Object.assign({}, ...parts.map(p => p.stimuli)), items: parts.flatMap(p => p.items) })).length;
    for (const ch of [...new Set(built.map(t => t.chapter))]) {
      const ts = built.filter(t => t.chapter === ch), groups = [];
      let cur = [];
      for (const t of ts) {
        const next = [...cur, t];
        if (cur.length && gz(next.map(coreOf)) > BANK_GZ) { groups.push(cur); cur = [t]; } else cur = next;
      }
      groups.push(cur);
      groups.forEach((g, i) => g.forEach(t => plan.set(t.id, groups.length === 1 ? ch : `${ch}-${'abcdefgh'[i]}`)));
    }
    return plan;
  }
  function bankFile(t) {
    return bankPlan().get(t.id) || t.chapter;
  }
  function bank() {
    const out = {};
    for (const t of built) {
      const f = bankFile(t);
      const b = out[f] || (out[f] = { stimuli: {}, items: [], why: {} });
      const qf = C.questions[t.id];
      for (const [sid, s] of Object.entries(qf.stimuli || {})) b.stimuli[sid] = { kind: s.kind, title: s.title, html: stimulusBody(C, s, '') };
      for (const q of qf.items) {
        const p = questionForPage(q);
        b.why[p.id] = { why: p.why, ...(p.variables ? { variables: p.variables } : {}) };
        const { why: _w, ...rest } = p;
        if (rest.variables) rest.variables = rest.variables.map(v => ({ name: v.name, answer: v.answer }));
        b.items.push(rest);
      }
    }
    return out;
  }
  /* Every question's id, type, level, difficulty, practice and stimulus,
     compact enough to fetch first (A&P decision 76). Per topic, one entry per
     question, "n.type.level.diff.practice.stimulus.calc" with type, level,
     practice and stimulus as indexes into the lists at the top, then "1"
     for a calculator item (exam Part B); the id is calc-<topic>-<n>. */
  function bankIndex() {
    const ty = [], lv = [], pr = [], st = [];
    const at = (list, v) => { let i = list.indexOf(v); if (i < 0) { i = list.length; list.push(v); } return i; };
    const t = {};
    for (const topic of built) t[topic.id] = C.questions[topic.id].items.map(q => {
      const m = q.id.match(/^calc-(.+)-(\d+)$/);
      if (!m || m[1] !== topic.id) throw new Error(`bank index: question id ${q.id} is not calc-${topic.id}-<n>`);
      return [m[2], at(ty, q.type), at(lv, q.level), q.diff, at(pr, q.practice), q.stimulus ? at(st, q.stimulus) : '', q.calc ? '1' : ''].join('.');
    }).join(',');
    return JSON.stringify({ v: 1, ty, lv, pr, st, t });
  }

  /* ------------------------------------------------------------ output */
  put('index.html', homePage());
  put('learn.html', learnPage());
  put('glossary.html', glossaryPage());
  for (const ch of map.chapters.filter(chapterBuilt)) { put(`units/${ch.id}.html`, unitPage(ch.id)); put(`unit-sheets/${ch.id}.html`, unitSheet(ch.id)); }
  for (const t of built) { put(`lessons/${t.id}.html`, lessonPage(t.id)); put(`notes/${t.id}.html`, notesPage(t.id)); }
  for (const a of C.pages.apps || []) put(`${a.slug}.html`, a.static ? teachersPage(a) : appShell(a));
  put('assets/frq/index.json', frqIndex());
  for (const f of frqs) { put(`assets/frq/${f.id}.json`, JSON.stringify(frqJson(f))); put(`frq/${f.id}.html`, frqPage(f)); }
  put('assets/summaries.json', JSON.stringify(Object.fromEntries(built.map(t => [t.id, text(C.lessons[t.id].summary)]))));
  for (const t of (C.pages.tools || []).filter(toolLive)) { put(`tools/${t.slug}.html`, toolShell(t)); put(`assets/tool-data/${t.slug}.json`, JSON.stringify(toolData(t))); }
  put('assets/calc-curriculum.js', curriculumJs());
  put('assets/glossary.json', glossaryJson());
  put('assets/notes-index.json', JSON.stringify(built.map(t => ({ file: `${BASE}notes/${t.id}.html`, title: t.title }))));
  for (const [ch, b] of Object.entries(bank())) {
    put(`assets/bank/${ch}.json`, JSON.stringify({ stimuli: b.stimuli, items: b.items }));
    put(`assets/bank/${ch}-why.json`, JSON.stringify(b.why));
  }
  put('assets/bank/index.json', bankIndex());
  /* The free search-entry pages, the practice exams' data and the
     justification trainer's prompts (scripts/lib/apcalc-entry.mjs). */
  const entry = entryPages({ map, C, head, tail, footer, crumbNav, crumbs, orgCrumbs, esc, text, SITE, BASE, COURSE_ID, COURSE_NAME, COURSE_HTML, BETA_PILL, LABEL,
    courseTitle, clampDesc, noindex, bodyOpen, questionHtml, questionForPage, groupSets, stimulusPanel, stimulusBody, isFreeTopic, frqs, liveTools: (C.pages.tools || []).filter(toolLive).map(t => ({ slug: t.slug, name: t.name })) });
  for (const [rel, content] of Object.entries(entry.pages)) put(rel, content);
}

/* Generated places hold nothing else. With no map, every generated file
   left behind is stale. */
const OWNED_DIRS = ['lessons', 'notes', 'units', 'unit-sheets', 'assets/bank', 'frq', 'assets/frq', 'tools', 'assets/tool-data', 'unit-tests', 'assets/exams'];
const OWNED_FILES = ['index.html', 'learn.html', 'glossary.html', 'assets/calc-curriculum.js', 'assets/glossary.json', 'assets/notes-index.json', 'assets/summaries.json',
  'formula-sheet.html', 'score-calculator.html', 'assets/justify.json',
  ...(C.pages.apps || []).map(a => `${a.slug}.html`)];
const stale = [];
for (const d of OWNED_DIRS) {
  const dir = join(OUT, d);
  if (existsSync(dir)) for (const f of readdirSync(dir)) if (!outputs.has(`${d}/${f}`)) stale.push(`${d}/${f}`);
}
for (const f of OWNED_FILES) if (!outputs.has(f) && existsSync(join(OUT, f))) stale.push(f);

let bad = 0;
for (const [rel, content] of outputs) {
  const p = join(OUT, rel);
  const cur = existsSync(p) ? readFileSync(p, 'utf8') : null;
  if (cur === content) continue;
  if (CHECK) { console.log(`stale: calculus/${rel}`); bad++; continue; }
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
}
for (const rel of stale) {
  if (CHECK) { console.log(`not generated (remove it): calculus/${rel}`); bad++; }
  else unlinkSync(join(OUT, rel));
}
if (CHECK && bad) { console.log(`${bad} AP Calculus AB file(s) out of date. Run: node scripts/build-apcalc.mjs`); process.exit(1); }
console.log(map
  ? `AP Calculus AB: ${C.built.size} topics built (${C.published.size ? [...C.published].join(', ') : 'no chapter published'}), ${outputs.size} files ${CHECK ? 'checked' : 'written'}.`
  : 'AP Calculus AB: no course map yet (docs/apcalc-dependency-map.json), so nothing is generated.');
