/* Turns each prose fragment under ochem/notes/ into a page you can actually
   open, and keeps the prose itself as the one place the words are written.

   THE PROBLEM THIS SOLVES
   -----------------------
   The ochem course's entire written half — 62 sections, about 1.2 MB of
   prose — lived as bare HTML fragments: no <title>, no stylesheet, no
   navigation. learn.html fetched them and injected them into a shell. That
   shell is 142 characters of static HTML, so with JavaScript off, or before
   the fetch lands, or on a crawler that does not execute scripts, the
   textbook was empty. robots.txt disallowed the fragments, the sitemap
   skipped them and build-og-tags.mjs skipped them, all three for the same
   stated reason: indexed alone they would be "a wall of unstyled text with
   no way out".

   That reason was correct and it describes a fixable property of the files
   rather than an argument against the pages existing. This script fixes it:
   each fragment is wrapped in the same shell every other ochem page uses —
   title, description, canonical, stylesheets, navigation, and links onward
   to the interactive lesson, the textbook, and the neighbouring sections. A
   wall of unstyled text with no way out becomes a section of a textbook.

   WHAT IS GENERATED AND WHAT IS NOT
   ---------------------------------
   Everything outside the two markers is generated and will be overwritten.
   Everything between them is the prose, and is never touched:

     <!-- notes:start -->   ... the section's prose ...   <!-- notes:end -->

   So a section is still edited by editing its own file, exactly as before.
   textbook.js reads the same file and takes what is between the markers, so
   the fetched-and-injected path and the standalone page cannot drift: there
   is one copy of the words.

   The <title> and description come from the curriculum and from the prose's
   own opening sentence. Nothing here writes new sentences about chemistry.

     node scripts/build-notes-pages.mjs            rewrite
     node scripts/build-notes-pages.mjs --check    fail if any page is stale (CI)
*/
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { CSP } from './lib/site-config.mjs';
import { courseTitle } from './lib/page-title.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
// Hand-written meta descriptions, for sections whose opening paragraph has no
// whole sentence short enough to be one. { id: text }.
const DESC_PATH = join(ROOT, 'scripts', 'ochem-notes-descriptions.json');
const DESCRIPTIONS = existsSync(DESC_PATH) ? JSON.parse(readFileSync(DESC_PATH, 'utf8')) : {};
const check = process.argv.includes('--check');
const ORIGIN = 'https://levlprep.com';

const START = '<!-- notes:start -->';
const END = '<!-- notes:end -->';

/* The curriculum is a browser script, so it is run in a sandbox rather than
   imported. Same approach the unit tests take. */
function loadModules() {
  const sandbox = { window: {}, localStorage: { getItem: () => null, setItem: () => {} }, document: {} };
  vm.createContext(sandbox);
  vm.runInContext(
    readFileSync(join(ROOT, 'ochem', 'assets', 'curriculum.js'), 'utf8') +
    '\nthis.M = (typeof MODULES !== "undefined") ? MODULES : (window.OchemCurriculum && window.OchemCurriculum.MODULES);',
    sandbox,
  );
  if (!Array.isArray(sandbox.M)) throw new Error('curriculum.js did not yield a MODULES array');
  return sandbox.M;
}

/* Mirrors OchemCurriculum.hasLesson. The curriculum is the source of truth for
   the label text too, so the generated pages and the runtime cannot drift into
   describing the same state two different ways. */
const NOTES_ONLY_LABEL = (() => {
  const sandbox = { window: {}, localStorage: { getItem: () => null, setItem: () => {} }, document: {} };
  vm.createContext(sandbox);
  vm.runInContext(
    readFileSync(join(ROOT, 'ochem', 'assets', 'curriculum.js'), 'utf8') +
    '\nthis.L = window.OchemCurriculum.NOTES_ONLY_LABEL;',
    sandbox,
  );
  if (!sandbox.L) throw new Error('curriculum.js did not yield NOTES_ONLY_LABEL');
  return sandbox.L;
})();

const hasLesson = (topic) => !!(topic && topic.href && !topic.notesOnly);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* The prose is HTML, so its entities have to be turned back into characters
   before the description is re-escaped for the attribute — otherwise a section
   that opens with an em dash ships "&amp;mdash;" into its search snippet,
   which is what a reader sees in the result list. &amp; is decoded last so a
   literal ampersand written as &amp;amp; survives one round trip. */
const ENTITIES = {
  nbsp: ' ', mdash: '\u2014', ndash: '\u2013', hellip: '\u2026',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201c', rdquo: '\u201d',
  alpha: '\u03b1', beta: '\u03b2', gamma: '\u03b3', delta: '\u03b4',
  pi: '\u03c0', sigma: '\u03c3', mu: '\u03bc', deg: '\u00b0',
  rarr: '\u2192', larr: '\u2190', harr: '\u2194', rlhar: '\u21cc',
  times: '\u00d7', minus: '\u2212', plusmn: '\u00b1', middot: '\u00b7',
  sup2: '\u00b2', sup3: '\u00b3', frac12: '\u00bd',
  lt: '<', gt: '>', quot: '"'
};

function decodeEntities(text) {
  let out = text.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
                .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
                .replace(/&([a-z][a-z0-9]*);/gi, (whole, name) => {
                  const hit = ENTITIES[name] ?? ENTITIES[name.toLowerCase()];
                  return hit === undefined ? whole : hit;
                });
  return out.replace(/&amp;/g, '&');
}

/* The meta description is the section's own opening sentences, as many whole
   ones as fit in 160 characters. Deriving it means it cannot contradict the
   prose, and it means nobody has to write 121 of them. It never ends
   mid-sentence: 118 of them used to, cut at a word boundary with "…", which
   reads as broken in a result list. When not even one sentence fits, or what
   fits is too short to say anything, the fallback names the topic instead. */
function describe(prose, fallback) {
  const firstPara = prose.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  if (!firstPara) return fallback;
  let text = firstPara[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  text = decodeEntities(text).replace(/\s+/g, ' ').trim();
  if (!text) return fallback;
  if (text.length <= 160) return text.length >= 70 ? text : fallback;
  let out = '';
  for (const sentence of text.split(/(?<=[.!?])\s+(?=[A-Z0-9(])/)) {
    const next = out ? `${out} ${sentence}` : sentence;
    if (next.length > 160) break;
    out = next;
  }
  return out.length >= 70 ? out : fallback;
}

/* Titles are picked from a list of candidates rather than built from one
   template, for two reasons that pull in opposite directions.

   The first is that a notes page and its lesson used to ship the SAME title,
   character for character — "pKa — Acids & Bases | Organic Chemistry" was both
   ochem/lessons/pka.html and ochem/notes/pka.html. Two pages on the same site,
   about the same topic, with one title between them is the state a search
   engine resolves by picking one and discounting the other. Which one it drops
   is not ours to choose, so the two are told apart here instead: every notes
   title ends in a word the lesson's never does.

   The second is length. A title over about 60 characters is cut off in the
   result list, and the chapter name in the middle is what pushed 59 of these
   over — "Kinetic vs thermodynamic control — Conjugation & Pericyclic
   Reactions | Organic Chemistry" is 89 characters, of which the reader sees
   roughly the first two thirds. The chapter is the most droppable part: it is
   in the breadcrumb, the eyebrow and the h1 of the page itself, whereas
   "Organic Chemistry" is the phrase someone actually searches for.

   So: keep the chapter when it fits, drop it when it doesn't, and never let
   the subject fall off the end. */
const TITLE_MAX = 60;


/* "On this page": the prose's h3 headings, with an id for each. The ids are
   not written into the prose (it stays exactly as authored, between the
   markers); the article carries them in data-bk-ids and assets/course/book.js
   sets them on the headings in order, so the rail's links land. */
function sectionHeads(prose) {
  const used = new Set();
  return [...prose.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/g)].map((m) => {
    const title = decodeEntities(m[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
    const base = title.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      .split('-').slice(0, 6).join('-') || 'section';
    let id = base;
    for (let i = 2; used.has(id); i++) id = `${base}-${i}`;
    used.add(id);
    return { id, title };
  });
}

function page({ topic, module: mod, modIndex, modules, numbers, prose, prev, next, index, total }) {
  // "{Topic} — {Course} | LevlPrep" (scripts/lib/page-title.mjs).
  const title = courseTitle(decodeEntities(topic.title), ['Organic Chemistry', 'Organic Chem', 'OChem'].map((c) => `${c} Notes`));
  const desc = DESCRIPTIONS[topic.id] || describe(prose, `${topic.title} explained step by step: free organic chemistry notes from the ${mod.title} chapter.`);
  const url = `${ORIGIN}/ochem/notes/${topic.id}.html`;
  const chN = modIndex + 1; // the rail badge is a number, not prose
  const heads = sectionHeads(prose);
  const words = decodeEntities(prose.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ')).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  /* A notes-only topic's href is this very page, so it gets the shared label
     instead of a link to a lesson. hasLesson is the test for "is there a
     lesson", not href — see the header comment in curriculum.js. */
  const lessonLink = hasLesson(topic)
    ? `<div class="bk-pillbar"><a class="bk-pill" href="../${topic.href}"><i aria-hidden="true">&#9654;</i>Practice this lesson</a></div>`
    : '';
  const soon = hasLesson(topic) ? '' : `\n      <p class="bk-soon">${esc(NOTES_ONLY_LABEL)}</p>`;
  const link = (t, dir) => t
    ? `<a class="tb-chapter-link${dir === 'next' ? ' next' : ''}" href="${t.id}.html"><span>${dir === 'next' ? `Section ${index + 1} &rarr;` : `&larr; Section ${index - 1}`}</span><b>${esc(t.title)}</b></a>`
    : '';
  /* The contents rail, as on A&P and Bio notes pages (assets/course/book.css):
     the neighbouring chapters, this chapter with its sections, the current
     section open to its headings. Chapters open in the textbook (learn.html). */
  const other = (m, i) => m ? `<a class="bk-toc-other" href="../learn.html#m-${m.id}"><span class="bk-toc-n">${i + 1}</span>${esc(m.title)}</a>` : '';
  const onPage = heads.length ? `<div class="bk-toc-onpage"><p>On this page</p>${heads.map((h) => `<a href="#${h.id}">${esc(h.title)}</a>`).join('')}</div>` : '';
  const items = mod.topics.map((t) => t.id === topic.id
    ? `<li class="current" data-toc-t="${t.id}"><a href="#main" aria-current="page"><span class="bk-toc-n">${numbers[t.id]}</span>${esc(t.title)}</a>${onPage}</li>`
    : `<li data-toc-t="${t.id}"><a href="${t.id}.html"><span class="bk-toc-n">${numbers[t.id]}</span>${esc(t.title)}</a></li>`).join('');
  const rail = `<aside class="tb-rail bk-rail" id="oc-rail" data-bk-read="ochem_textbook_read">
    <p class="tb-rail-title">Contents</p>
    ${other(modules[modIndex - 1], modIndex - 1)}
    <a class="bk-toc-chap" href="../learn.html#m-${mod.id}"><span class="bk-toc-chap-n">${chN}</span><span><b>${esc(mod.title)}</b><small>${mod.topics.length} section${mod.topics.length === 1 ? '' : 's'}</small></span></a>
    <div class="bk-toc-prog" data-bk-prog><div class="tb-progress-row"><span><b>0</b> of ${mod.topics.length} sections read</span><span class="bk-toc-pct">0%</span></div><div class="tb-progress-track"><div class="tb-progress-fill" style="width:0%"></div></div></div>
    <nav class="tb-contents" aria-label="Chapter contents"><ol class="bk-toc-list">${items}</ol></nav>
    ${other(modules[modIndex + 1], modIndex + 1)}
  </aside>`;

  /* Every other page on the site carries structured data; these 121 did not,
     which made the written half of the course the one part a search engine had
     to infer from the markup alone. The shape is the lesson pages' — the same
     @ids for the course and the organisation, so the graph joins up across the
     two rather than describing two unrelated sites — with two differences that
     are true of a notes page and not of a lesson.

     learningResourceType is "Reading" rather than "Lesson": there is nothing
     to do here, it is the prose. And where a lesson declares what it teaches,
     a notes page also declares which lesson it belongs beside, via
     isBasedOn/relatedLink, so the pair reads as one topic in two forms instead
     of two competing answers to the same query. That is the same duplicate
     problem the titles above solve, stated where a machine will read it. */
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LearningResource',
        '@id': `${url}#notes`,
        name: topic.title,
        url,
        description: desc,
        learningResourceType: 'Reading',
        educationalLevel: 'Undergraduate',
        inLanguage: 'en',
        isAccessibleForFree: true,
        teaches: { '@type': 'DefinedTerm', name: topic.title },
        isPartOf: { '@id': `${ORIGIN}/ochem/#course` },
        provider: { '@id': `${ORIGIN}/#org` },
        position: index,
        ...(hasLesson(topic)
          ? { relatedLink: `${ORIGIN}/ochem/${topic.href}` }
          : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'LevlPrep', item: `${ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Organic Chemistry', item: `${ORIGIN}/ochem/` },
          { '@type': 'ListItem', position: 3, name: mod.title, item: `${ORIGIN}/ochem/learn.html#m-${mod.id}` },
          { '@type': 'ListItem', position: 4, name: topic.title, item: url },
        ],
      },
    ],
  };
  /* Emitted compact rather than indented. Nobody reads this block — it is for
     machines — and the indentation is not free: hybridization.html is the
     largest notes page and pretty-printing its graph pushed it over the weight
     budget check-weight.mjs holds these pages to.

     JSON.stringify escapes nothing that matters inside a <script> block except
     a literal "</script>" in the prose-derived description, which would end the
     block early. */
  const ldJson = JSON.stringify(ld).replace(/<\//g, '<\\/');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<script>try{var t=localStorage.getItem("nremt_theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.setAttribute("data-theme","dark");}catch(e){}</script>
<link rel="preload" href="/assets/fonts/nunito-variable-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="icon" href="../../assets/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../../assets/icon-180.png">
<link rel="manifest" href="../manifest.json">
<meta name="theme-color" content="#16332E">
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="LevlPrep">
<meta property="og:image" content="${ORIGIN}/ochem/assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="../../assets/theme.css">
<script src="../../assets/errors.js" defer></script>
<script src="../../assets/account.js" defer></script>
<script src="../../assets/hub-progress.js" defer></script>
<script src="../../assets/chime.js" defer></script>
<script src="../../assets/site-chrome.js" defer></script>
<script src="../assets/ochem-xp.js" defer></script>
<script src="../../assets/course/glossary-tip.js" data-glossary="../assets/glossary.json" data-course-root="../" defer></script>
<link rel="stylesheet" href="../../assets/course/base.css">
<link rel="stylesheet" href="../../assets/course/book.css">
<link rel="stylesheet" href="../assets/ochem.css">
<link rel="stylesheet" href="../../assets/fonts/fonts.css">
<!-- levlprep-structured-data -->
<script type="application/ld+json">
${ldJson}
</script>
</head>
<body>
<header id="site-header"></header>
<div class="course-nav"></div>
<div class="tb-shell bk bk-notes">
  <button type="button" class="tb-toc-btn" data-bk-toggle aria-controls="oc-rail" aria-expanded="false">&#9776; Contents</button>
  ${rail}
  <main class="tb-main" id="main">
    <nav class="cx-crumb" aria-label="Breadcrumb"><a href="../../index.html">LevlPrep</a> <span aria-hidden="true">&rsaquo;</span> <a href="../index.html">Organic Chemistry</a> <span aria-hidden="true">&rsaquo;</span> <a href="../learn.html#m-${mod.id}">${esc(mod.title)}</a> <span aria-hidden="true">&rsaquo;</span> <span aria-current="page">${esc(topic.title)}: notes</span></nav>
    ${lessonLink}
    <header class="bk-head">
      <p class="bk-eyebrow"><span data-bk-chapter="${mod.id}">${esc(mod.title)}</span> &middot; Section ${index} of ${total}</p>
      <h1 class="bk-title">${esc(topic.title)}</h1>
      <p class="bk-meta"><span class="bk-small">${minutes} min read &middot; free</span>${topic.mechanism ? `<a class="bk-tag" href="../${topic.mechanism}">Draw the mechanism</a>` : ''}</p>${soon}
      <div class="bk-actions" role="group" aria-label="Share or print this notes page"><button type="button" class="bk-action" data-copy="${url}">Copy link</button><button type="button" class="bk-action" data-print>Print</button></div>
    </header>
    <!-- notes-view carries the prose styles (h3, .step-body, .notes-fact and the
         asides); it is the same class the textbook view uses, so a section looks
         identical whether it is read here or inside learn.html. -->
    <article class="notes-body notes-view bk-prose" data-glossary-topic="${topic.id}" data-bk-ids="${heads.map((h) => h.id).join(' ')}">
${START}
${prose}
${END}
    </article>
    <nav class="tb-chapter-nav" aria-label="Section navigation">${link(prev, 'prev')}${link(next, 'next')}</nav>
  </main>
</div>
<div class="xshell">
  <footer>
    <p class="privacy-link"><a href="../../privacy.html">Privacy</a> &middot; <a href="../../terms.html">Terms</a> &middot; <a href="../../about.html">About</a> &middot; <a href="../../sources.html">Sources</a> &middot; <a href="../../changelog.html">What&rsquo;s new</a> &middot; <a href="../../premium.html">Premium</a> &middot; <a href="../../account.html">Account</a> &middot; <a href="mailto:hello@levlprep.com">Contact</a></p>
  </footer>
</div>
<script src="../assets/curriculum.js" defer></script>
<script>
  window.OCHEM_SECTION = 'learn';
  window.OCHEM_BASE = '../';
</script>
<script src="../assets/ochem-nav.js" defer></script>
<script src="../../assets/course/book.js" defer></script>
</body>
</html>
`;
}

const modules = loadModules();
const ordered = [];
const numbers = {};
modules.forEach((mod, modIndex) => mod.topics.forEach((topic) => { ordered.push({ topic, module: mod, modIndex }); numbers[topic.id] = ordered.length; }));

let written = 0;
const stale = [];
const missing = [];

ordered.forEach((entry, i) => {
  const file = join(ROOT, 'ochem', 'notes', `${entry.topic.id}.html`);
  if (!existsSync(file)) { missing.push(entry.topic.id); return; }
  const current = readFileSync(file, 'utf8');

  // First run: the whole file is prose. After that, take what is between the
  // markers so the shell can be regenerated without touching the words.
  let prose = current;
  const a = current.indexOf(START);
  const b = current.indexOf(END);
  if (a !== -1 && b !== -1) prose = current.slice(a + START.length, b);
  prose = prose.replace(/^\n+|\n+$/g, '');

  const next = page({
    topic: entry.topic,
    module: entry.module,
    modIndex: entry.modIndex,
    modules,
    numbers,
    prose,
    prev: i > 0 ? ordered[i - 1].topic : null,
    next: i + 1 < ordered.length ? ordered[i + 1].topic : null,
    index: i + 1,
    total: ordered.length,
  });

  if (next === current) return;
  if (check) { stale.push(entry.topic.id); return; }
  writeFileSync(file, next);
  written++;
});

/* learn.html is a shell that fetches its chapters, so with JavaScript off it
   showed one sentence saying so. It now carries a real table of contents,
   generated here from the same curriculum the rail is built from, linking to
   each section's own page. Readers with JavaScript never see it: textbook.js
   replaces the contents of #tbChapter as soon as it runs. */
const TOC_START = '<!-- toc:start -->';
const TOC_END = '<!-- toc:end -->';
const learnPath = join(ROOT, 'ochem', 'learn.html');
if (existsSync(learnPath)) {
  const current = readFileSync(learnPath, 'utf8');
  const a = current.indexOf(TOC_START);
  const b = current.indexOf(TOC_END);
  if (a === -1 || b === -1) {
    console.error('FAIL: ochem/learn.html has no <!-- toc:start --> / <!-- toc:end --> markers.');
    process.exit(1);
  }
  const notesOnlyCount = modules.reduce((a, m) => a + m.topics.filter((t) => !hasLesson(t)).length, 0);
  const notesOnlyNote = notesOnlyCount
    ? ` ${notesOnlyCount} of them ${notesOnlyCount === 1 ? 'is' : 'are'} written notes only — the interactive lesson is still being built.`
    : '';
  let n = 0;
  const toc = modules.map((mod) => {
    const items = mod.topics.map((t) => {
      n += 1;
      const flag = hasLesson(t) ? '' : ` <span class="tb-static-flag">${esc(NOTES_ONLY_LABEL)}</span>`;
      return `          <li><a href="notes/${t.id}.html">${esc(t.title)}</a>${flag}</li>`;
    }).join('\n');
    return `        <section class="tb-static-chapter">\n` +
           `          <h2>${esc(mod.title)}</h2>\n` +
           `          <ol>\n${items}\n          </ol>\n` +
           `        </section>`;
  }).join('\n');

  const block = `${TOC_START}\n` +
    `      <div class="tb-static-toc">\n` +
    `        <h1>The Organic Chemistry textbook</h1>\n` +
    `        <p class="step-body">${modules.length} chapters, ${n} sections. Every section below is a page you can read on its own.${notesOnlyNote}</p>\n` +
    `${toc}\n` +
    `      </div>\n` +
    `      ${TOC_END}`;

  const nextLearn = current.slice(0, a) + block + current.slice(b + TOC_END.length);
  if (nextLearn !== current) {
    if (check) {
      console.error('FAIL: ochem/learn.html\'s static contents are stale. Run: node scripts/build-notes-pages.mjs');
      process.exit(1);
    }
    writeFileSync(learnPath, nextLearn);
    console.log('Rewrote the static contents in ochem/learn.html.');
  }
}

if (missing.length) {
  console.error(`FAIL: the curriculum lists topics with no notes fragment: ${missing.join(', ')}`);
  process.exit(1);
}

if (check) {
  if (stale.length) {
    console.error(`FAIL: ${stale.length} notes page(s) are stale: ${stale.slice(0, 8).join(', ')}${stale.length > 8 ? ', …' : ''}`);
    console.error('Run: node scripts/build-notes-pages.mjs');
    process.exit(1);
  }
  console.log(`OK — all ${ordered.length} notes pages are up to date.`);
} else {
  console.log(`Wrote ${written} of ${ordered.length} notes pages.`);
}
