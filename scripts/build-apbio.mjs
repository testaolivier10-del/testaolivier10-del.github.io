/* The AP® Biology course generator (docs/apbio-spec.md, docs/apbio-architecture.md).

   Reads bio/data/ and the course map and writes every page a student reads:
   the course home, learn.html (units and the Skills section), a page per unit,
   a lesson, a notes page and a printable unit sheet, the glossary, the app
   page shells from pages.json, and the JSON the runtime loads (curriculum,
   glossary, the question bank split per unit with its lazy index). Forked
   from scripts/build-anp.mjs (spec decision 1).

   Only topics of PUBLISHED chapters are built (bio/data/published.json), and
   only once they have a lesson, notes and a question file. With no chapter
   published every page is noindex: the course is not live.

   The map: docs/apbio-dependency-map.json; without it, only when
   APBIO_MAP_STUB=1, the test fixture (scripts/lib/apbio-build.mjs). With no
   map at all nothing is generated, and --check fails on any generated file
   left behind.

     node scripts/build-apbio.mjs            write everything
     node scripts/build-apbio.mjs --check    exit 1 if anything on disk is stale
     --out <dir>                              write the bio/ tree there (tests)
     APBIO_PUBLISHED=unit-1,skills-stats     override published.json (tests)

   Nothing it writes is edited by hand. Every served path avoids the token
   "ap" (spec decision 2). */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { courseTitle } from './lib/page-title.mjs';
import { premiumData, lockedLd, courseOffers } from './lib/premium-data.mjs';
import {
  ROOT, SITE, BASE, COURSE_NAME, COURSE_HTML, COURSE_ID, COURSE_KEY, DISCLAIMER, BETA_NOTE, BETA_PILL,
  esc, text, loadMap, loadCourse, isFreeTopic, clampDesc, head, tail, crumbs, orgCrumbs, crumbNav, footer, reportButton,
  termIndex, glossify, figureImg, credit, renderFigures, stimulusBody, stimulusPanel, questionForPage, questionHtml,
  groupSets, hasApToken, stripMark, STIM_KIND,
} from './lib/apbio-build.mjs';

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : join(ROOT, 'bio');
const map = loadMap();
const C = loadCourse(ROOT, { map, published: process.env.APBIO_PUBLISHED !== undefined ? process.env.APBIO_PUBLISHED.split(',').filter(Boolean) : undefined });
const outputs = new Map();
const LABEL = 'AP® Biology';
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
  if (hasApToken(rel)) throw new Error(`build-apbio: output path bio/${rel} contains the token "ap" (spec decision 2)`);
  outputs.set(rel, rel.endsWith('.html') ? wrapTables(content) : content);
};

if (map) build();

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
  const freeLd = t => isFreeTopic(map, t) ? { isAccessibleForFree: true } : lockedLd('.bio-ls-card');
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
    : `<span class="bio-unbuilt">${esc(map.topicById(id).title)}</span>`;
  const nextBuilt = id => topics.slice(pos(id) + 1).find(t => C.built.has(t.id)) || null;
  const prevBuilt = id => topics.slice(0, pos(id)).reverse().find(t => C.built.has(t.id)) || null;
  const bodyOpen = (attrs = '') => `<body class="bio"${attrs}>\n<header id="site-header"></header>\n<div class="course-nav"></div>`;
  /* A stable link, "Share to Google Classroom", Copy link and Print, on every
     lesson, notes page, unit sheet and FRQ (spec section 1, "Teachers"). The
     shared title never carries the mark (it travels in a URL). Copy link and
     Print are wired by bio-nav.js. */
  const shareBar = (path, title, what) => {
    const url = `${SITE}${BASE}${path}`;
    const gc = `https://classroom.google.com/share?url=${encodeURIComponent(url)}&title=${encodeURIComponent(stripMark(title))}`;
    return `<div class="bio-share bio-nav-ref" role="group" aria-label="Share or print this ${what}"><a class="bio-share-btn" href="${esc(gc)}" target="_blank" rel="noopener">Share to Google Classroom<span class="sr-only"> (opens in a new tab)</span></a><button type="button" class="bio-share-btn" data-copy="${esc(url)}">Copy link</button><button type="button" class="bio-share-btn" data-print>Print</button></div>`;
  };

  /* Stimuli used by a list of questions, with paths from bio/ (the runtime
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
    return s ? `<div class="bio-set">${stimulusPanel(g.stimulus, s, s.html.replace(/(src|href)="figures\//g, `$1="${depth}figures/`))}${items}</div>` : items;
  }).join('');

  /* ------------------------------------------------------------ lesson */
  const STEP_FIRST_PAINT = `<script>(function(){var s=document.querySelector('.bio-ls'),p=s&&s.querySelectorAll('.bio-step');if(!p||p.length<2)return;var i=0;try{var h=location.hash.slice(1),e=h&&document.getElementById(decodeURIComponent(h)),q=e&&e.closest('.bio-step');if(q)i=[].indexOf.call(p,q);else i=Math.max(0,Math.min((JSON.parse(localStorage.getItem('apbio_step_'+document.body.getAttribute('data-topic')))||{}).step|0,p.length-1));}catch(x){}for(var k=0;k<p.length;k++)p[k].classList.toggle('is-on',k===i);})();</script>`;

  function lessonPage(id) {
    const t = map.topicById(id), ch = chapterById(t.chapter), L = C.lessons[id];
    const depth = '../', seen = new Set();
    const g = html => glossify(C, html, { depth, topic: id, seen, index: GLOSS });
    const items = C.questions[id].items;
    const byId = new Map(items.map(q => [q.id, q]));
    const check = (L.check || []).map(x => byId.get(x)).filter(Boolean).map(questionForPage);
    const stimuli = stimuliFor(id, check);
    const title = courseTitle(t.title, [`${LABEL} Lesson`, LABEL]);
    const desc = C.descriptions.lessons?.[id] || clampDesc(L.summary, `${t.title}: a biology lesson taught from scratch, step by step, with exam-style practice questions.`);
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
      { id: 'hook', kind: 'Hook', nav: 'Why this matters', h: 'Why this matters', cls: 'bio-hook', html: g(L.hook) },
      earlier.length && { id: 'builds-on', kind: 'Before you start', nav: 'What this builds on', h: 'What this builds on', html: `<nav class="bio-nav-ref" aria-label="Earlier topics"><ul class="bio-links">${earlier.map(x => `<li>${topicRef(x, depth)}</li>`).join('')}</ul></nav>` },
      (L.prereq || []).length && { id: 'prereq', kind: 'Prerequisite check', nav: 'Quick check', h: 'Quick check before you start', html: `<div class="bio-qs" data-set="prereq">${pageData.prereq.map((p, i) => questionHtml(p, i + 1)).join('')}</div>` },
      fig && { id: 'figure', kind: 'See it', nav: 'See it', h: 'See it first', html: `<figure class="bio-figure bio-lesson-fig">${figureImg(C, L.figure.figure, depth, { masks: (fig.labels || []).length > 0 })}<figcaption>${g(L.figure.caption || '')} ${credit(fig, { adapted: (fig.labels || []).length > 0 })}</figcaption></figure>${(fig.labels || []).length ? '<button type="button" class="btn-outline bio-toggle-labels" aria-pressed="false">Hide labels</button>' : ''}` },
      { id: 'chain', kind: 'Step by step', nav: 'How it works', h: 'How it works, step by step', html: `<ol class="bio-chain">${L.chain.map(s => `<li><span class="bio-cause">${g(s.cause)}</span><span class="bio-arrow" aria-hidden="true">→</span><span class="bio-effect">${g(s.effect)}</span></li>`).join('')}</ol>` },
      (L.ideas || []).length && { id: 'ideas', kind: 'Key ideas', nav: 'Key ideas', h: 'Key ideas', html: `<ul class="bio-ideas">${L.ideas.map(x => `<li>${g(x)}</li>`).join('')}</ul>` },
      { id: 'misconception', kind: 'Misconception', nav: 'A common mistake', h: 'A common mistake', cls: 'bio-misconception', html: `<p class="bio-wrong"><b>The wrong idea:</b> ${g(L.misconception.wrong)}</p><p class="bio-right"><b>What actually happens:</b> ${g(L.misconception.right)}</p>` },
      { id: 'check', kind: 'Check yourself', nav: 'Check yourself', h: 'Check yourself', html: `<p class="bio-hint">Exam-style questions. Anything you miss goes into your review queue.</p><div class="bio-qs" data-set="check">${staticQuestions(check, stimuli, depth)}</div>` },
      { id: 'summary', kind: 'Summary', nav: 'Summary', h: 'Summary', html: g(L.summary) },
      { id: 'next', kind: 'Up next', nav: 'What comes next', h: 'What comes next', html: nx ? `<nav class="bio-nav-ref" aria-label="Next topic"><p><a class="btn-press sm" href="${nx.id}.html">${esc(nx.title)} &rarr;</a></p></nav>` : '<p>This is the last topic published so far.</p>' },
      (L.connections || []).length && { id: 'connections', kind: 'Connections', nav: 'Connections', h: 'Connections', html: `<ul class="bio-links">${L.connections.map(c => `<li><a href="${esc(c.href)}">${esc(c.label)}</a></li>`).join('')}</ul>` },
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
<div class="xshell bio-ls${parts.length > 1 ? ' bio-stepped' : ''}">
  <aside class="bio-ls-rail bio-nav-ref" aria-label="Lesson parts">
    <p class="bio-ls-k">${unitLabel(ch)} · ${esc(ch.title)}</p>
    <p class="bio-ls-links"><a href="../units/${ch.id}.html">&larr; Back to the unit</a><a href="../notes/${id}.html">Read the notes</a></p>
    <div class="bio-ls-prog"><div class="bio-ls-track"><div class="bio-ls-fill"></div></div><span class="bio-ls-count">Step 1 / ${parts.length}</span></div>
    <ol class="bio-ls-steps">${parts.map((p, i) => `<li><a href="#${p.id}"><span class="n">${i + 1}</span><span class="t">${p.nav}</span></a></li>`).join('')}</ol>
  </aside>
  <main id="main" class="bio-ls-main bio-lesson">
  <header class="bio-ls-hero">
    <div class="eyebrow">${unitLabel(ch)}${topicNo(t) ? ` · Topic ${esc(t.ced)}` : ''} ${BETA_PILL}</div>
    <h1>${esc(t.title)}</h1>
    <p class="lede">${esc(lede)}</p>
    <p class="bio-tags bio-nav-ref">${(t.practices || []).map(n => `<span class="bio-tag">Practice ${n}: ${esc(practiceName(n))}</span>`).join('')}</p>
    ${shareBar(`lessons/${id}.html`, `${t.title}: biology lesson`, 'lesson')}
    <p class="bio-small bio-nav-ref"><a href="../practice.html?topic=${id}">Question set for this topic</a></p>
  </header>
  <div class="bio-ls-card">
${parts.map((p, i) => `  <section class="bio-part bio-step${i === 0 ? ' is-on' : ''}" id="${p.id}" aria-labelledby="h-${p.id}">
    <p class="bio-step-k">Part ${i + 1} · ${p.kind}</p>
    <h2 id="h-${p.id}" tabindex="-1">${p.h}</h2>
    <div class="bio-step-body${p.cls ? ` ${p.cls}` : ''}">${p.html}</div>
  </section>`).join('\n')}
    <div class="bio-ls-actions bio-nav-ref"><button type="button" class="bio-ls-back">&larr; Previous</button><button type="button" class="bio-ls-go">Continue &rarr;</button><a class="bio-ls-go" hidden href="${nx ? `${nx.id}.html">Next lesson` : `../units/${ch.id}.html">Back to the unit`} &rarr;</a></div>
  </div>
  </main>
</div>
${STEP_FIRST_PAINT}
${footer(depth, `lesson:${id}`)}
<script type="application/json" id="bio-page-data">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
${tail({ depth, section: 'learn', extra: ['bio-questions.js', 'bio-lesson.js'], premium: true })}
</body>
</html>
`;
    return head({ title, desc, path: `lessons/${id}.html`, depth, jsonld, noindex }) + body;
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
  const tocBtn = label => `<button type="button" class="tb-toc-btn" aria-controls="bio-rail" aria-expanded="false">&#9776; ${label}</button>`;
  const chip = id => `<span class="bio-tb-chip" data-chip-topic="${id}">Not practiced</span>`;

  /* The whole course in the rail: units, then the Skills section. */
  function courseRail(curId, depth, book = false) {
    const chDir = book ? 'units/' : '';
    const groups = map.parts.map(p => {
      const chs = map.chapters.filter(c => c.part === p.id);
      if (!chs.length) return '';
      return `<p class="bio-toc-group">${esc(p.title)}</p>` + chs.map(ch => {
        const ts = topicsOf(ch.id), cur = ch.id === curId, has = chapterBuilt(ch);
        const inner = `<span class="tb-toc-num">${ch.part === 'course' ? ch.n : 'S'}</span><span class="tb-toc-modtitle">${esc(ch.title)}</span><span class="tb-toc-count" data-toc-ch="${ch.id}">0/${ts.filter(t => C.built.has(t.id)).length}</span>`;
        const headEl = !has ? `<span class="tb-toc-modhead bio-unbuilt">${inner}</span>` : `<a class="tb-toc-modhead" href="${cur ? '#main' : `${chDir}${ch.id}.html`}"${cur ? ' aria-current="page"' : ''}${book ? ` data-book-ch="${ch.id}"` : ''}>${inner}</a>`;
        const tl = (cur || (book && has)) ? `<div class="tb-toc-topics">${ts.filter(t => C.built.has(t.id)).map(t => `<a class="tb-toc-topic" href="${depth}${book ? 'notes' : 'lessons'}/${t.id}.html" data-toc-t="${t.id}"><span class="tb-toc-tick"></span>${esc(t.title)}</a>`).join('')}</div>` : '';
        return `<div class="tb-toc-mod${cur ? ' open' : ''}">${headEl}${tl}</div>`;
      }).join('');
    }).join('');
    return `<aside class="tb-rail bio-nav-ref" id="bio-rail"><p class="tb-rail-title">Contents</p><nav class="tb-contents" aria-label="Course contents">${groups}</nav></aside>`;
  }
  function notesRail(id, sections) {
    const t = map.topicById(id), ch = chapterById(t.chapter);
    const ts = topicsOf(ch.id).filter(x => C.built.has(x.id));
    const onPage = sections.length ? `<div class="bio-toc-onpage"><p>On this page</p>${sections.map(s => `<a href="#${s.id}">${esc(s.title)}</a>`).join('')}</div>` : '';
    return `<aside class="tb-rail bio-nav-ref bio-notes-rail" id="bio-rail">
    <p class="tb-rail-title">Contents</p>
    <a class="bio-toc-chap" href="../units/${ch.id}.html"><span class="bio-toc-chap-n">${ch.part === 'course' ? ch.n : 'S'}</span><span><b>${esc(ch.title)}</b><small>${ts.length} topic${ts.length === 1 ? '' : 's'}</small></span></a>
    <nav class="tb-contents" aria-label="Unit contents"><ol class="bio-toc-list">${ts.map(x => x.id === id
      ? `<li class="current" data-toc-t="${x.id}"><a href="#main" aria-current="page"><span class="bio-toc-n">${esc(x.ced || 'S')}</span>${esc(x.title)}</a>${onPage}</li>`
      : `<li data-toc-t="${x.id}"><a href="${x.id}.html"><span class="bio-toc-n">${esc(x.ced || 'S')}</span>${esc(x.title)}</a></li>`).join('')}</ol></nav>
  </aside>`;
  }

  function notesPage(id) {
    const t = map.topicById(id), ch = chapterById(t.chapter), depth = '../';
    const seen = new Set();
    const { html: withIds, sections } = sectionIds(C.notes[id]);
    const html = glossify(C, renderFigures(C, withIds, depth), { depth, topic: id, seen, index: GLOSS });
    const firstP = [...C.notes[id].matchAll(/<p>([\s\S]*?)<\/p>/g)].slice(0, 2).map(m => m[1]).join(' ') || t.title;
    const minutes = Math.max(1, Math.round(text(C.notes[id]).split(' ').length / 200));
    const title = courseTitle(t.title, [`${LABEL} Notes`]);
    const desc = C.descriptions.notes?.[id] || clampDesc(firstP, `${t.title} explained from scratch: free biology study notes with figures and worked examples.`);
    const url = `${SITE}${BASE}notes/${id}.html`;
    const pv = prevBuilt(id), nx = nextBuilt(id);
    const link = (x, dir) => x ? `<a class="tb-chapter-link${dir === 'next' ? ' next' : ''}" href="${x.id}.html"><span>${dir === 'next' ? 'Next &rarr;' : '&larr; Previous'}</span><b>${esc(x.title)}</b></a>` : '';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#reading`, name: t.title, url, description: desc, learningResourceType: 'Reading', educationalLevel: 'High school', inLanguage: 'en', isAccessibleForFree: true, keywords: t.searchPhrase, isPartOf: { '@id': COURSE_ID }, provider: { '@id': `${SITE}/#org` } },
      crumbs(orgCrumbs([{ name: ch.title, url: `${SITE}${BASE}units/${ch.id}.html` }, { name: `${t.title}: notes`, url }])),
    ] };
    const body = `
${bodyOpen(` data-topic="${id}" data-unit="${ch.id}"`)}
<div class="tb-shell bio-tb bio-notes">
  ${tocBtn(`${unitLabel(ch)} contents`)}
  ${notesRail(id, sections)}
  <main class="tb-main" id="main">
    ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../units/${ch.id}.html` }, { name: `${t.title}: notes` }])}
    <div class="bio-pillbar"><a class="bio-pill" href="../lessons/${id}.html">Practice this lesson</a></div>
    <header class="bio-notes-head">
      <p class="bio-notes-eyebrow">${unitLabel(ch)}${t.ced ? ` &middot; Topic ${esc(t.ced)}` : ''} ${BETA_PILL}</p>
      <h1 class="bio-notes-title">${esc(t.title)}</h1>
      <p class="bio-tags bio-notes-meta bio-nav-ref"><span class="bio-small">${minutes} min read &middot; free</span>${chip(id)}</p>
      ${shareBar(`notes/${id}.html`, `${t.title}: biology notes`, 'notes page')}
    </header>
    <article class="bio-prose">
${html}
    </article>
    <p class="bio-report-page bio-nav-ref">Spot a mistake on this page? ${reportButton(`notes:${id}`)}</p>
    <nav class="tb-chapter-nav bio-nav-ref" aria-label="Topic navigation">${link(pv, 'prev')}${link(nx, 'next')}</nav>
  </main>
</div>
${footer(depth, `notes:${id}`)}
${tail({ depth, section: 'learn', extra: ['bio-toc.js'] })}
</body>
</html>
`;
    return head({ title, desc, path: `notes/${id}.html`, depth, jsonld, noindex }) + body;
  }

  /* ------------------------------------------------------------- unit */
  function unitPage(chId) {
    const ch = chapterById(chId), depth = '../', ts = topicsOf(chId);
    const isUnit = ch.part === 'course';
    const title = courseTitle(isUnit ? `Unit ${ch.n}: ${ch.title}` : ch.title, [LABEL]);
    const desc = C.descriptions.units?.[chId] || clampDesc(`${ch.title}: ${ts.length} topics in course order, from ${ts[0].title.toLowerCase()} to ${ts[ts.length - 1].title.toLowerCase()}, with lessons, free notes and exam-style practice.`, `${ch.title}: biology lessons, free notes and exam-style practice, in course order.`);
    const url = `${SITE}${BASE}units/${chId}.html`;
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'CollectionPage', '@id': `${url}#unit`, name: ch.title, url, description: desc, isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: ch.title, url }])),
    ] };
    const weight = Array.isArray(ch.weight) ? ` &middot; ${ch.weight[0]}&ndash;${ch.weight[1]}% of the exam` : '';
    const body = `
${bodyOpen(` data-unit="${chId}"`)}
<div class="tb-shell bio-tb bio-unit">
  ${tocBtn('Contents')}
  ${courseRail(chId, depth)}
  <main class="tb-main" id="main">
    ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title }])}
    <header class="tb-chapter-head bio-unit-head">
      <div>
        <p class="tb-chapter-eyebrow">${unitLabel(ch)}${weight} ${BETA_PILL}</p>
        <h1 class="tb-chapter-title">${esc(ch.title)}</h1>
        <p class="tb-chapter-meta">${ts.length} topics &middot; <span data-unit-meta="${chId}">not practiced yet</span></p>
      </div>
      <p class="bio-unit-acts"><a class="bio-tb-btn solid" href="../practice.html?unit=${chId}">Practice this unit</a><a class="bio-tb-btn ghost" href="../unit-sheets/${chId}.html">Unit sheet</a></p>
    </header>
    <h2 class="bio-unit-h" id="h-topics">Topics, in course order</h2>
    <ol class="bio-unit-list" aria-labelledby="h-topics">${ts.map(t => `<li class="bio-unit-row" data-topic="${t.id}"><span class="bio-unit-n">${esc(t.ced || 'S')}</span>${C.built.has(t.id)
      ? `<a class="bio-unit-title" href="../lessons/${t.id}.html">${esc(t.title)}</a>${chip(t.id)}<span class="bio-unit-btns"><a class="bio-tb-btn solid" href="../lessons/${t.id}.html" aria-label="Lesson: ${esc(t.title)}">Lesson</a><a class="bio-tb-btn ghost" href="../notes/${t.id}.html" aria-label="Notes: ${esc(t.title)}">Notes</a></span>`
      : `<span class="bio-unit-title bio-unbuilt">${esc(t.title)}</span><span class="bio-small">Coming soon</span>`}</li>`).join('')}</ol>
  </main>
</div>
${footer(depth, `unit:${chId}`)}
${tail({ depth, section: 'learn', extra: ['bio-toc.js'] })}
</body>
</html>
`;
    return head({ title, desc, path: `units/${chId}.html`, depth, ogType: 'website', jsonld, noindex }) + body;
  }

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
<main id="main" class="xshell bio-sheet">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../units/${chId}.html` }, { name: 'Unit sheet' }])}
  <header class="bio-sheet-head">
    <p class="eyebrow">${unitLabel(ch)} ${BETA_PILL}</p>
    <h1>${esc(ch.title)}: the one-page sheet</h1>
    ${shareBar(`unit-sheets/${chId}.html`, `${ch.title}: biology unit sheet`, 'unit sheet')}
  </header>
  <div class="bio-sheet-grid">${ts.map(t => {
      const L = C.lessons[t.id];
      return `<section class="bio-sheet-topic" aria-labelledby="s-${t.id}"><h2 id="s-${t.id}">${t.ced ? `<span>${esc(t.ced)}</span> ` : ''}${esc(t.title)}</h2>
      <p>${text(L.summary)}</p>
      ${(L.ideas || []).length ? `<ul>${L.ideas.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
      <p class="bio-sheet-chain">${L.chain.map(s => esc(text(s.effect))).join(' <span aria-hidden="true">&rarr;</span> ')}</p>
      ${terms(t).length ? `<dl class="bio-sheet-terms">${terms(t).map(c => `<div><dt>${esc(c.term)}</dt><dd>${esc(C.glossary[c.id].def)}</dd></div>`).join('')}</dl>` : ''}
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
  /* Styles only the glossary page uses, inlined in its <head> so bio.css (on
     every page) does not carry them. The A-Z bar stays under the header while
     the index scrolls; on a phone it is one swipeable row. Letters and terms
     land below the header and the bar. */
  const GLOSSARY_CSS = `.bio-letters-hint{display:none;margin:4px 0 0;}
.bio-letters{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 16px;position:sticky;top:var(--site-header-h,60px);z-index:5;padding:8px 0;background:var(--paper);}
.bio-letters a{min-width:32px;min-height:32px;display:inline-grid;place-items:center;border-radius:8px;background:var(--ctint);color:var(--cink);font:900 13px var(--font-ui);text-decoration:none;}
.bio-letters a.on{background:var(--cink);color:var(--paper);}
@media (max-width:640px){.bio-letters{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding-right:32px;-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 32px),transparent);mask-image:linear-gradient(to right,#000 calc(100% - 32px),transparent);}.bio-letters-hint{display:block;}.bio-letters a{flex:0 0 auto;padding:0 10px;}}
.bio-glossary .bio-letter,.bio-glossary .bio-term,.bio-glossary .bio-term-index li{scroll-margin-top:calc(var(--site-header-h,60px) + 64px);}
.bio-letter{margin:0 0 22px;}
.bio-letter h2{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:0 0 6px;}
.bio-letter > .bio-gl-more{margin:0 0 8px;}
.bio-term-index{list-style:none;margin:0;padding:0;line-height:1.9;}
.bio-term-index li{display:inline;font-weight:700;}
.bio-term-index li:not(:last-child)::after{content:" \\00b7 ";color:var(--muted);}
.bio-gl-more{font:800 13px var(--font-ui);padding:5px 12px;border-radius:999px;border:2px solid var(--line, rgba(0,0,0,0.12));background:var(--white);color:var(--ink);cursor:pointer;}
.bio-gl-more:hover{border-color:var(--cink);}
.bio-terms{margin:0;}
.bio-term{padding:10px 0;border-bottom:1px solid var(--line, rgba(0,0,0,0.08));}
.bio-term:target,.bio-term.hit{background:var(--ctint);border-radius:8px;padding-left:8px;padding-right:8px;}
.bio-term dt{font-weight:900;}
.bio-term dd{margin:3px 0 0;font-weight:600;line-height:1.6;}
.bio-gl-results .bio-small{margin:4px 0 10px;}`;

  /* The page is an index, not the definitions (spec decision 22, A&P decision
     69): every term once, under its letter, as a link to the notes page that
     teaches it, with the #t-<concept> anchor other pages link to.
     bio-glossary-page.js draws a letter's definitions from assets/glossary.json
     when that letter is opened, and the filter searches terms and their
     aliases (data-a). */
  function glossaryPage() {
    const depth = '';
    const entries = map.concepts.filter(c => C.glossary[c.id]).sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));
    const title = courseTitle('Glossary', [LABEL]);
    const desc = clampDesc(`${entries.length.toLocaleString('en-US')} biology terms with plain definitions, each linked to the free notes page that teaches it.`);
    const url = `${SITE}${BASE}glossary.html`;
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'DefinedTermSet', '@id': `${url}#terms`, name: `${COURSE_NAME} glossary`, url, description: desc },
      crumbs(orgCrumbs([{ name: 'Glossary', url }])),
    ] };
    const letters = [...new Set(entries.map(c => c.term[0].toUpperCase()))];
    const body = `
${bodyOpen()}
<main id="main" class="xshell bio-glossary">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Glossary' }])}
  <header class="hero bio-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>Glossary</h1><p class="lede">${entries.length.toLocaleString('en-US')} terms${entries.length ? ' so far' : ''}. Each links to the page that teaches it; open a letter to read its definitions.</p>
    <label class="bio-filter">Find a term <input type="search" id="gl-filter" autocomplete="off" aria-controls="gl-results"></label>
    <p class="bio-small" id="gl-status" role="status" aria-live="polite"></p></header>
  ${letters.length ? `<p class="bio-letters-hint bio-small" aria-hidden="true">Swipe the letters for ${letters[letters.length - 1]} &rarr;</p>
  <nav class="bio-letters" aria-label="Jump to letter">${letters.map(l => `<a href="#l-${l}">${l}</a>`).join('')}</nav>` : ''}
  <div id="gl-results" class="bio-gl-results" hidden></div>
  <div id="gl-index">${letters.map(l => {
      const here = entries.filter(c => c.term[0].toUpperCase() === l);
      return `<section class="bio-letter" id="l-${l}" aria-labelledby="h-${l}"><h2 id="h-${l}">${l} <span class="bio-small">${here.length} term${here.length === 1 ? '' : 's'}</span></h2><ul class="bio-term-index">${here.map(c => {
        const href = C.built.has(c.taughtIn) ? `notes/${c.taughtIn}.html` : null;
        const aliases = c.aliases.filter(a => a.toLowerCase() !== c.term.toLowerCase());
        return `<li id="t-${c.id}"${aliases.length ? ` data-a="${esc(aliases.join('|'))}"` : ''}>${href ? `<a href="${href}">${esc(c.term)}</a>` : esc(c.term)}</li>`;
      }).join('')}</ul></section>`;
    }).join('\n  ') || '<p>Terms appear here as units are published.</p>'}</div>
  <p class="bio-report-page bio-nav-ref">Spot a mistake on this page? ${reportButton('glossary')}</p>
</main>
${footer(depth, 'glossary')}
${tail({ depth, section: 'glossary', extra: ['bio-glossary-page.js'] })}
</body>
</html>
`;
    return head({ title, desc, path: 'glossary.html', depth, ogType: 'website', jsonld, noindex }).replace('</head>', `<style>${GLOSSARY_CSS}</style>\n</head>`) + body;
  }

  /* ------------------------------------------------------------- learn */
  function learnPage() {
    const depth = '';
    const title = courseTitle('All units and skills', [LABEL]);
    const desc = clampDesc(`Every unit of the biology course in framework order, ${units.length} units and ${topics.length} topics, plus the statistics and experimental design skills the exam tests.`);
    const url = `${SITE}${BASE}learn.html`;
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'CollectionPage', '@id': `${url}#learn`, name: 'All units and skills', url, description: desc, isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'All units', url }])),
    ] };
    const section = (chs, h) => `<section class="tb-static-part"><h2>${h}</h2>${chs.map(ch => {
      const ts = topicsOf(ch.id);
      return `<section class="tb-static-chapter"><h3>${ch.part === 'course' ? `Unit ${ch.n}: ` : ''}${esc(ch.title)}</h3><ol>${ts.map(t => `<li>${C.built.has(t.id) ? `<a href="notes/${t.id}.html">${esc(t.title)}</a>` : `<span class="bio-unbuilt">${esc(t.title)}</span>`}${t.ced ? ` <span class="bio-small">${esc(t.ced)}</span>` : ''}</li>`).join('')}</ol>${chapterBuilt(ch) ? '' : '<p class="bio-small">Coming soon.</p>'}</section>`;
    }).join('')}</section>`;
    const body = `
${bodyOpen()}
<div class="tb-shell bio-tb bio-book">
  ${tocBtn('Contents')}
  ${courseRail(null, depth, true)}
  <main class="tb-main" id="main">
    ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'All units' }])}
    <div id="bio-book" aria-live="polite">
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
${tail({ depth, section: 'learn', extra: ['bio-toc.js', 'bio-book.js'] })}
</body>
</html>
`;
    return head({ title, desc, path: 'learn.html', depth, ogType: 'website', jsonld, noindex }) + body;
  }

  /* -------------------------------------------------------------- home */
  function homePage() {
    const depth = '';
    const title = `${LABEL} Course, Free to Start | LevlPrep`;
    const desc = 'Biology exam prep built on the 2025 course framework, in order: lessons from scratch, free notes and harder, data-heavy practice that matches the real exam.';
    const url = `${SITE}${BASE}`;
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Course', '@id': COURSE_ID, name: COURSE_NAME, url, description: desc, inLanguage: 'en', ...(offers ? { offers } : {}),
        provider: { '@id': `${SITE}/#org` }, educationalLevel: 'High school',
        hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: 'Self-paced' },
        syllabusSections: map.chapters.map(c => ({ '@type': 'Syllabus', name: c.title })) },
      crumbs(orgCrumbs([])),
    ] };
    const first = topics.find(t => C.built.has(t.id));
    const unitCard = ch => {
      const n = topicsOf(ch.id).length, has = chapterBuilt(ch);
      const w = Array.isArray(ch.weight) ? `${ch.weight[0]}&ndash;${ch.weight[1]}% of the exam` : '';
      const inner = `<span class="bio-unit-chip">${ch.part === 'course' ? `Unit ${ch.n}` : 'Skills'}</span><b>${esc(ch.title)}</b><small>${n} topic${n === 1 ? '' : 's'}${w ? ` &middot; ${w}` : ''}${has ? '' : ' &middot; coming soon'}</small>`;
      return `<li data-unit="${ch.id}">${has ? `<a href="units/${ch.id}.html">${inner}</a>` : `<div>${inner}</div>`}</li>`;
    };
    const body = `
${bodyOpen()}
<main id="main" class="xshell bio-home">
  <header class="hero bio-home-hero">
    <div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div>
    <h1>${COURSE_HTML}, taught from scratch, in order.</h1>
    <ul class="bio-pos">
      <li><b>Built on the 2025 framework, in order.</b> Every unit and topic in the order the course framework lists them.</li>
      <li><b>Teaches from scratch, for when your class moves too fast.</b> High-school level, slower, with a picture for every process.</li>
      <li><b>Harder, data-heavy practice that matches the real exam.</b> Tables, graphs and experiments, with stimulus sets of four or five questions.</li>
      <li><b>See the process, then answer questions about it.</b> Each lesson walks the cause and effect one step at a time before it asks.</li>
    </ul>
    <p class="bio-review-note">${BETA_PILL} ${esc(BETA_NOTE)}</p>
    <div class="hero-ctas">${first ? `<a class="btn-press" href="lessons/${first.id}.html">Start here</a>` : ''}<a class="link-quiet" href="learn.html">All units &rarr;</a></div>
  </header>

  <section class="xsection" aria-labelledby="h-units">
    <div class="section-head"><h2 id="h-units">The units</h2><p class="section-lede">${units.length} unit${units.length === 1 ? '' : 's'}, each with lessons, free notes, a printable unit sheet and exam-style practice.</p></div>
    <ol class="bio-unit-grid">${units.map(unitCard).join('')}</ol>
  </section>
${skills.length ? `
  <section class="xsection" aria-labelledby="h-skills">
    <div class="section-head"><h2 id="h-skills">Skills</h2><p class="section-lede">The math and experimental design the exam tests, built on the official formula sheet, with answers checked as you type them.</p></div>
    <ol class="bio-unit-grid">${skills.map(unitCard).join('')}</ol>
  </section>` : ''}

  <section class="xsection" aria-labelledby="h-go">
    <div class="section-head"><h2 id="h-go">Practice and study</h2></div>
    <ul class="bio-cards">${(C.pages.apps || []).filter(a => a.card).map(a => `<li><a href="${a.slug}.html"><b>${esc(a.h1)}</b><span>${esc(a.card)}</span></a></li>`).join('')}
      <li><a href="glossary.html"><b>Glossary</b><span>Every term, with a plain definition and where it is taught.</span></a></li>
    </ul>
  </section>

  <section class="xsection" aria-label="About LevlPrep">
    <div class="trust-row">
      <div class="trust-pill">Every notes page free</div>
      <div class="trust-pill">Units 1 and 2 lessons free</div>
      <div class="trust-pill">Unit sheets free to print</div>
      <div class="trust-pill">Progress saved on your device</div>
    </div>
    <p class="bio-disclaimer">${esc(DISCLAIMER)} Figures adapted from OpenStax <i>Biology 2e</i> are credited where they appear; OpenStax does not endorse LevlPrep.</p>
  </section>
</main>
${footer(depth, 'home')}
${tail({ depth, section: 'home' })}
</body>
</html>
`;
    return head({ title, desc, path: '', depth, ogType: 'website', jsonld, noindex }) + body;
  }

  /* --------------------------------------------------- app page shells */
  const STATE_PAGES = new Set(['dashboard', 'review', 'search']);
  function appShell(a) {
    const depth = '', path = `${a.slug}.html`, url = `${SITE}${BASE}${path}`;
    const scriptOk = a.script && existsSync(join(ROOT, 'bio', 'assets', a.script));
    const cssOk = a.css && existsSync(join(ROOT, 'bio', 'assets', a.css));
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebPage', '@id': `${url}#page`, name: a.h1, url, description: a.desc, isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: a.h1, url }])),
    ] };
    const body = `
${bodyOpen(` data-app="${a.slug}"`)}
<main id="main" class="xshell bio-app">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: a.h1 }])}
  <header class="hero bio-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>${esc(a.h1)}</h1><p class="lede">${esc(a.lede || a.desc)}</p></header>
  <div id="app" class="bio-app-mount" data-slug="${a.slug}"${a.premium ? ` data-premium="${a.premium}"` : ''}>${scriptOk
    ? '<noscript><p>This page needs JavaScript. Every notes page works without it.</p></noscript>'
    : `<p class="bio-soon">This page arrives with the first published unit. Meanwhile, read the <a href="learn.html">free notes</a>.</p>`}</div>
</main>
${footer(depth, `page:${a.slug}`)}
${cssOk ? `<link rel="stylesheet" href="assets/${a.css}">\n` : ''}${tail({ depth, section: a.section, extra: ['bio-questions.js', ...(scriptOk ? [a.script] : [])], premium: true, site: a.siteScripts || [] })}
</body>
</html>
`;
    return head({ title: courseTitle(a.title, [LABEL]), desc: a.desc, path, depth, ogType: 'website', jsonld, noindex: noindex || STATE_PAGES.has(a.slug) }) + body;
  }

  /* ------------------------------------------------------------- FRQs */
  /* Free-response questions (data/frq/<id>.json, docs/apbio-architecture.md).
     One goes out when every unit it lists is published and its topics are
     in the map: assets/frq/index.json (the list frq.html and exams.html
     read), assets/frq/<id>.json (the whole question, stimulus rendered) and
     frq/<id>.html, the stable, shareable, printable page. The rubric and the
     sample answer are not in that page's HTML: frq-kit.js fetches them when
     the student asks for them (and prints them only when asked). */
  const FRQ_TYPE_NAME = {
    iee: 'Interpreting and Evaluating Experimental Results', 'iee-graph': 'Interpreting and Evaluating Experimental Results, with Graphing',
    investigation: 'Scientific Investigation', conceptual: 'Conceptual Analysis', model: 'Analyze Model or Visual Representation', data: 'Analyze Data',
  };
  const FRQ_ORDER = Object.keys(FRQ_TYPE_NAME);
  const frqStimulus = f => {
    if (f.stimulus && typeof f.stimulus === 'object') return f.stimulus;
    for (const q of Object.values(C.questions)) if (q.stimuli && q.stimuli[f.stimulus]) return q.stimuli[f.stimulus];
    return null;
  };
  const frqs = Object.values(C.frq)
    .filter(f => f && f.id && FRQ_TYPE_NAME[f.type] && (f.units || []).length && f.units.every(u => C.published.has(u)) && (f.topics || []).every(t => map.topicById(t)) && frqStimulus(f))
    .sort((a, b) => FRQ_ORDER.indexOf(a.type) - FRQ_ORDER.indexOf(b.type) || a.id.localeCompare(b.id));
  const frqTitle = f => f.title || frqStimulus(f).title || FRQ_TYPE_NAME[f.type];
  const frqUnitLabel = f => f.units.map(u => { const c = chapterById(u); return c ? unitLabel(c) + (c.part === 'course' ? '' : `: ${c.title}`) : u; }).join(', ');
  function frqJson(f) {
    const s = frqStimulus(f);
    return {
      id: f.id, type: f.type, typeName: FRQ_TYPE_NAME[f.type], points: f.points, title: frqTitle(f), units: f.units, topics: f.topics, practices: f.practices,
      ...(f.placeholder ? { placeholder: true } : {}),
      stimulus: { kind: s.kind, title: s.title || '', html: stimulusBody(C, s, '') },
      parts: f.parts.map(p => ({ label: p.label, prompt: p.prompt, points: p.points, rubric: p.rubric, sample: p.sample })),
      ...(f.graphSpec ? { graphSpec: f.graphSpec } : {}),
    };
  }
  const frqIndex = () => JSON.stringify(frqs.map(f => ({ id: f.id, type: f.type, points: f.points, title: frqTitle(f), units: f.units, topics: f.topics, practices: f.practices, ...(f.placeholder ? { placeholder: true } : {}) })));
  /* Lined answer space for paper (shown only in print): about six lines a point. */
  const lines = n => `<div class="bio-lines" aria-hidden="true">${'<div></div>'.repeat(n)}</div>`;
  const graphGrid = g => `<div class="bio-frq-grid" role="img" aria-label="Blank grid for your graph${g.x && g.x.label ? `: ${esc(text(g.x.label))} on the x-axis` : ''}${g.y && g.y.label ? `, ${esc(text(g.y.label))} on the y-axis` : ''}"></div>`;
  function frqPage(f) {
    const depth = '../', s = frqStimulus(f), title = frqTitle(f);
    const url = `${SITE}${BASE}frq/${f.id}.html`;
    const desc = clampDesc(`${title}: a ${f.points}-point biology free-response question (${FRQ_TYPE_NAME[f.type].toLowerCase()}) with a point-by-point rubric, a sample answer and a printable answer sheet.`);
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#frq`, name: title, url, description: desc, learningResourceType: 'Free-response question', educationalLevel: 'High school', inLanguage: 'en', isPartOf: { '@id': COURSE_ID }, provider: { '@id': `${SITE}/#org` } },
      crumbs(orgCrumbs([{ name: 'Free-response practice', url: `${SITE}${BASE}frq.html` }, { name: title, url }])),
    ] };
    const g = f.type === 'iee-graph' ? f.graphSpec || {} : null;
    const body = `
${bodyOpen(` data-frq="${f.id}"`)}
<main id="main" class="xshell bio-app bio-frq-page">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: 'Free-response practice', href: '../frq.html' }, { name: title }])}
  <header class="hero bio-hero">
    <div class="eyebrow">Free response &middot; ${esc(frqUnitLabel(f))} ${BETA_PILL}</div>
    <h1>${esc(title)}</h1>
    <p class="lede">${esc(FRQ_TYPE_NAME[f.type])} &middot; ${f.points} points${f.placeholder ? ' &middot; <b>placeholder question</b>, written to test the page and not checked for accuracy' : ''}</p>
    ${shareBar(`frq/${f.id}.html`, `${title}: biology free-response question`, 'question')}
  </header>
  <article class="bio-frq" aria-labelledby="h-frq-q">
    <h2 id="h-frq-q" class="sr-only">The question</h2>
    <p class="bio-frq-print-head">Name: ______________________ &nbsp; Date: ____________ &nbsp; ${esc(title)} (${f.points} points)</p>
    ${stimulusPanel(`frq-${f.id}`, s, stimulusBody(C, s, depth))}
    <ol class="bio-frq-parts">${f.parts.map(p => `<li class="bio-frq-part" data-part="${esc(p.label)}"><p class="bio-frq-prompt"><b class="bio-frq-label">(${esc(p.label)})</b> ${p.prompt} <span class="bio-small">[${p.points} point${p.points === 1 ? '' : 's'}]</span></p>${g && /graph|plot|construct/i.test(text(p.prompt)) ? graphGrid(g) + lines(4) : lines(Math.max(5, p.points * 6))}</li>`).join('')}</ol>
  </article>
  <div id="app" class="bio-app-mount bio-frq-work" data-slug="frq-item" data-frq="${f.id}" data-unit="${esc(f.units[0])}" data-topic="${esc(f.topics[0] || '')}"><noscript><p>Writing your answer, the rubric and the sample answer need JavaScript. The question above prints without it.</p></noscript></div>
</main>
${footer(depth, `frq:${f.id}`)}
<link rel="stylesheet" href="../assets/pages/pages.css">
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
     and no class discount is published (docs/apbio-needs-author.md). */
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
        return `<tr><th scope="row">${esc(t.ced || 'Skill')}</th><td>${b ? link(`lessons/${t.id}.html`, esc(t.title)) : esc(t.title)}</td><td>${b ? `${link(`notes/${t.id}.html`, 'Notes')} &middot; ${link(`practice.html?topic=${t.id}`, 'Question set')}` : '<span class="bio-small">Coming soon</span>'}</td></tr>`;
      }).join('');
      const has = chapterBuilt(ch);
      return `<section class="bio-tc-unit" aria-labelledby="tc-${ch.id}"><h3 id="tc-${ch.id}">${ch.part === 'course' ? `Unit ${ch.n}: ` : ''}${esc(ch.title)}${Array.isArray(ch.weight) ? ` <span class="bio-small">${ch.weight[0]}&ndash;${ch.weight[1]}% of the exam</span>` : ''}</h3>
      ${has ? `<p class="bio-small">${link(`units/${ch.id}.html`, 'Unit page')} &middot; ${link(`unit-sheets/${ch.id}.html`, 'Printable unit sheet')} &middot; ${link(`practice.html?unit=${ch.id}`, 'Question set for the unit')}${ch.part === 'course' ? ` &middot; ${link(`exams.html?unit=${ch.id}`, 'Unit test')}` : ''}</p>` : ''}
      <table class="bio-tc-table"><caption class="sr-only">${esc(ch.title)}: topics in framework order</caption><thead><tr><th scope="col">Topic</th><th scope="col">Lesson</th><th scope="col">Assign</th></tr></thead><tbody>${rows}</tbody></table></section>`;
    };
    const frqList = frqs.length ? `<ul class="bio-links">${frqs.map(f => `<li>${link(`frq/${f.id}.html`, esc(frqTitle(f)))} <span class="bio-small">${esc(FRQ_TYPE_NAME[f.type])}, ${f.points} points${f.placeholder ? ', placeholder' : ''}</span></li>`).join('')}</ul>` : '<p>Free-response questions appear here as units are published.</p>';
    const body = `
${bodyOpen(' data-app="teachers"')}
<main id="main" class="xshell bio-app bio-teachers">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: a.h1 }])}
  <header class="hero bio-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>${esc(a.h1)}</h1><p class="lede">${esc(a.lede || a.desc)}</p></header>

  <section class="xsection" aria-labelledby="h-assign">
    <h2 id="h-assign">How to assign it</h2>
    <ul class="bio-tc-list">
      <li><b>Stable links.</b> Each lesson, notes page, unit sheet and free-response question has a permanent address, such as <code>levlprep.com/bio/notes/&lt;topic&gt;.html</code>. Links do not expire and need no account.</li>
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
    <p class="bio-small"><a href="frq.html">All free-response practice</a></p>
  </section>

  <section class="xsection" aria-labelledby="h-align">
    <h2 id="h-align">Alignment with the course framework</h2>
    <p>The units and topics follow the order of the 2025 course framework, mapped to our lessons. Titles and explanations are in our own words; nothing reproduces the framework's text. The course is in Beta: it has not yet been reviewed by an ${COURSE_HTML} teacher.</p>
    ${units.map(unitTable).join('\n    ')}
    ${skills.length ? `<h3 class="bio-tc-skills">Skills</h3><p class="bio-small">Each skills topic sits right after the framework topic it supports.</p>${skills.map(unitTable).join('\n    ')}` : ''}
  </section>

  <p class="bio-disclaimer">Questions are original and never copied from released exams or course materials. ${esc(DISCLAIMER)}</p>
</main>
${footer(depth, 'page:teachers')}
${tail({ depth, section: '' })}
</body>
</html>
`;
    return head({ title: courseTitle(a.title, [LABEL]), desc: a.desc, path: 'teachers.html', depth, ogType: 'website', jsonld, noindex }) + body;
  }

  /* ------------------------------------------------------------- tools
     Simulators, skills tools and drills (docs/apbio-architecture.md,
     "Tools"): pages.json tools[] gives each tool's shell at tools/<slug>.html;
     its content (data/tools/<slug>.json) is served filtered at
     assets/tool-data/<slug>.json. An item is live when its topic is
     published: the topic's chapter is, and for a skill or drill topic also
     the chapter of the topic it sits after (so Hardy-Weinberg practice waits
     for Unit 7). A scenario that "requires" units waits for them too. */
  const topicLive = id => { const t = map.topicById(id); if (!t || !C.published.has(t.chapter)) return false; const a = t.after && map.topicById(t.after); return !a || C.published.has(a.chapter); };
  const releaseOf = id => { const t = map.topicById(id); if (!t) return null; const a = t.after && map.topicById(t.after); return chapterById(a ? a.chapter : t.chapter); };
  function toolData(entry) {
    const d = JSON.parse(readFileSync(join(C.data, 'tools', `${entry.slug}.json`), 'utf8'));
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
    const rel = releaseOf(d.topic);
    const arrives = rel ? (rel.part === 'course' ? `Unit ${rel.n}` : `the ${rel.title.toLowerCase()} chapter`) : 'its unit';
    const content = ['questions', 'contexts', 'problems', 'datasets', 'scenarios'].reduce((n, k) => n + (out[k] ? out[k].length : 0), 0);
    if (!topicLive(d.topic) || !content) return { slug: d.slug, live: false, arrives };
    out.live = true;
    out.units = Object.fromEntries([...used].filter(t => map.topicById(t)).map(t => [t, map.topicById(t).chapter]));
    return out;
  }
  const toolLive = entry => existsSync(join(C.data, 'tools', `${entry.slug}.json`)) && toolData(entry).live;
  function toolShell(t) {
    const depth = '../', path = `tools/${t.slug}.html`, url = `${SITE}${BASE}${path}`;
    const scriptOk = existsSync(join(ROOT, 'bio', 'assets', 'tools', `${t.slug}.js`));
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebApplication', '@id': `${url}#tool`, name: t.name, url, description: t.desc, applicationCategory: 'EducationalApplication', operatingSystem: 'Any',
        ...(t.premium ? lockedLd('.bio-app-mount') : { isAccessibleForFree: true }), isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'Tools', url: `${SITE}${BASE}tools.html` }, { name: t.name, url }])),
    ] };
    const extra = ['bio-questions.js', 'tools/bio-tool-math.js', ...(t.kind === 'skill' ? ['tools/bio-skill-problems.js'] : []), 'tools/bio-tools.js', ...(scriptOk ? [`tools/${t.slug}.js`] : [])];
    const body = `
${bodyOpen(` data-app="tool-${t.slug}"`)}
<main id="main" class="xshell bio-app">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: 'Tools', href: '../tools.html' }, { name: t.name }])}
  <header class="hero bio-hero"><div class="eyebrow">${COURSE_HTML} ${t.kind === 'simulator' ? 'simulator' : t.kind === 'drill' ? 'drills' : 'skills'} ${BETA_PILL}</div><h1>${esc(t.name)}</h1><p class="lede">${esc(t.blurb)}</p></header>
  <div id="app" class="bio-app-mount" data-slug="${t.slug}" data-src="${depth}assets/tool-data/${t.slug}.json"${t.premium ? ` data-premium="${t.premium}"` : ''}>${scriptOk
    ? '<noscript><p>This tool needs JavaScript. Every notes page works without it.</p></noscript>'
    : `<p class="bio-soon">This tool arrives with its unit. Meanwhile, read the <a href="../learn.html">free notes</a>.</p>`}</div>
</main>
${footer(depth, `tool:${t.slug}`)}
<link rel="stylesheet" href="${depth}assets/tools/bio-tools.css">
${tail({ depth, section: 'tools', extra, premium: true })}
</body>
</html>
`;
    return head({ title: courseTitle(t.title, [LABEL]), desc: t.desc, path, depth, ogType: 'website', jsonld, noindex: noindex || !toolLive(t) }) + body;
  }

  /* ----------------------------------------------------------- runtime */
  function curriculumJs() {
    const data = {
      units: map.chapters.map(c => ({ id: c.id, n: c.n ?? null, title: c.title, part: c.part, weight: c.weight || null, built: chapterBuilt(c) })),
      topics: topics.map((t, i) => ({ id: t.id, ced: t.ced || null, title: t.title, unit: t.chapter, kind: t.kind, practices: t.practices || [], n: i + 1, built: C.built.has(t.id), free: isFreeTopic(map, t), qn: C.built.has(t.id) ? C.questions[t.id].items.length : 0 })),
      practices: map.practices.map(p => ({ id: p.id, name: p.name })),
      parts: map.parts,
      // Built questions per practice: practice mastery is measured against min(20, this).
      practiceCounts: Object.fromEntries(map.practices.map(p => [p.id, built.reduce((n, t) => n + C.questions[t.id].items.filter(q => String(q.practice).split('.')[0] === String(p.id)).length, 0)])),
    };
    const pages = (C.pages.apps || []).map(a => ({ slug: a.slug, h1: a.h1 }));
    const toolList = (C.pages.tools || []).map(t => { const d = toolData(t); return { slug: t.slug, kind: t.kind, name: t.name, blurb: t.blurb, topic: JSON.parse(readFileSync(join(C.data, 'tools', `${t.slug}.json`), 'utf8')).topic, live: !!d.live, ...(d.live ? {} : { arrives: d.arrives }), ...(t.premium ? { premium: 1 } : {}) }; });
    return `/* Generated by scripts/build-apbio.mjs from the course map. Do not edit. */
window.ApBioPages = ${JSON.stringify(pages)};
window.ApBioToolList = ${JSON.stringify(toolList)};
window.ApBioCurriculum = ${JSON.stringify(data)};
`;
  }
  function glossaryJson() {
    const out = {};
    for (const c of map.concepts) if (C.glossary[c.id]) out[c.id] = { t: c.term, d: C.glossary[c.id].def, p: c.taughtIn, b: C.built.has(c.taughtIn) ? 1 : 0 };
    return JSON.stringify(out);
  }
  /* The bank, one pair of files per published chapter: questions and their
     stimulus panels, then explanations (fetched after an answer). */
  function bank() {
    const out = {};
    for (const t of built) {
      const b = out[t.chapter] || (out[t.chapter] = { stimuli: {}, items: [], why: {} });
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
     question, "n.type.level.diff.practice.stimulus" with type, level,
     practice and stimulus as indexes into the lists at the top; the id is
     bio-<topic>-<n>. */
  function bankIndex() {
    const ty = [], lv = [], pr = [], st = [];
    const at = (list, v) => { let i = list.indexOf(v); if (i < 0) { i = list.length; list.push(v); } return i; };
    const t = {};
    for (const topic of built) t[topic.id] = C.questions[topic.id].items.map(q => {
      const m = q.id.match(/^bio-(.+)-(\d+)$/);
      if (!m || m[1] !== topic.id) throw new Error(`bank index: question id ${q.id} is not bio-${topic.id}-<n>`);
      return [m[2], at(ty, q.type), at(lv, q.level), q.diff, at(pr, q.practice), q.stimulus ? at(st, q.stimulus) : ''].join('.');
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
  for (const t of C.pages.tools || []) { put(`tools/${t.slug}.html`, toolShell(t)); put(`assets/tool-data/${t.slug}.json`, JSON.stringify(toolData(t))); }
  put('assets/bio-curriculum.js', curriculumJs());
  put('assets/glossary.json', glossaryJson());
  put('assets/notes-index.json', JSON.stringify(built.map(t => ({ file: `${BASE}notes/${t.id}.html`, title: t.title }))));
  for (const [ch, b] of Object.entries(bank())) {
    put(`assets/bank/${ch}.json`, JSON.stringify({ stimuli: b.stimuli, items: b.items }));
    put(`assets/bank/${ch}-why.json`, JSON.stringify(b.why));
  }
  put('assets/bank/index.json', bankIndex());
}

/* Generated places hold nothing else. With no map, every generated file
   left behind is stale. */
const OWNED_DIRS = ['lessons', 'notes', 'units', 'unit-sheets', 'assets/bank', 'frq', 'assets/frq', 'tools', 'assets/tool-data'];
const OWNED_FILES = ['index.html', 'learn.html', 'glossary.html', 'assets/bio-curriculum.js', 'assets/glossary.json', 'assets/notes-index.json', 'assets/summaries.json',
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
  if (CHECK) { console.log(`stale: bio/${rel}`); bad++; continue; }
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
}
for (const rel of stale) {
  if (CHECK) { console.log(`not generated (remove it): bio/${rel}`); bad++; }
  else unlinkSync(join(OUT, rel));
}
if (CHECK && bad) { console.log(`${bad} AP Biology file(s) out of date. Run: node scripts/build-apbio.mjs`); process.exit(1); }
console.log(map
  ? `AP Biology: ${C.built.size} topics built (${C.published.size ? [...C.published].join(', ') : 'no chapter published'}), ${outputs.size} files ${CHECK ? 'checked' : 'written'}.`
  : 'AP Biology: no course map yet (docs/apbio-dependency-map.json), so nothing is generated.');
