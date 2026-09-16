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

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
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

/* The meta description is the section's own opening sentence, trimmed to a
   sensible length at a word boundary. Deriving it means it cannot contradict
   the prose, and it means nobody has to write 62 of them. */
function describe(prose, fallback) {
  const firstPara = prose.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  if (!firstPara) return fallback;
  let text = firstPara[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  text = decodeEntities(text).replace(/\s+/g, ' ').trim();
  if (!text) return fallback;
  if (text.length <= 160) return text;
  const cut = text.slice(0, 157);
  return cut.slice(0, cut.lastIndexOf(' ')) + '…';
}

function page({ topic, module: mod, prose, prev, next, index, total }) {
  const title = `${topic.title} — ${mod.title} | Organic Chemistry`;
  const desc = describe(prose, `${topic.title}, from the ${mod.title} chapter of the organic chemistry textbook.`);
  const url = `${ORIGIN}/ochem/notes/${topic.id}.html`;
  /* A notes-only topic's href is this very page, so it gets the shared label
     instead of a link back to itself. hasLesson is the test for "is there a
     lesson", not href — see the header comment in curriculum.js. */
  const lessonLink = hasLesson(topic)
    ? `<a class="notes-onward-cta" href="../${topic.href}">Practice this — interactive lesson</a>`
    : `<p class="notes-onward-soon">${esc(NOTES_ONLY_LABEL)}</p>`;
  const nav = [
    prev ? `<a class="notes-prevnext notes-prev" href="${prev.id}.html"><span>Previous</span>${esc(prev.title)}</a>` : '<span></span>',
    next ? `<a class="notes-prevnext notes-next" href="${next.id}.html"><span>Next</span>${esc(next.title)}</a>` : '<span></span>',
  ].join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<script>try{if(localStorage.getItem("nremt_theme")==="dark")document.documentElement.setAttribute("data-theme","dark");}catch(e){}</script>
<link rel="icon" href="../../assets/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../../assets/icon-180.png">
<link rel="manifest" href="../manifest.json">
<meta name="theme-color" content="#16332E">
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cloud.umami.is; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://bsfcqrczehbcctwhxmrj.supabase.co https://cdn.jsdelivr.net https://*.workers.dev https://cloud.umami.is https://gateway.umami.is; media-src 'self'; base-uri 'self'; object-src 'none'">
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
<link rel="stylesheet" href="../assets/ochem.css">
<link rel="stylesheet" href="../../assets/fonts/fonts.css">
</head>
<body>
<div class="wrap notes-page">
  <nav class="notes-crumb" aria-label="Breadcrumb">
    <a href="../../index.html">LevlPrep</a> <span aria-hidden="true">&rsaquo;</span>
    <a href="../index.html">Organic Chemistry</a> <span aria-hidden="true">&rsaquo;</span>
    <a href="../learn.html">Textbook</a> <span aria-hidden="true">&rsaquo;</span>
    <span>${esc(mod.title)}</span>
  </nav>

  <header class="notes-head">
    <p class="notes-eyebrow">${esc(mod.title)} &middot; Section ${index} of ${total}</p>
    <h1>${esc(topic.title)}</h1>
    ${lessonLink}
  </header>

  <!-- notes-view carries the prose styles (h3, .step-body, .notes-fact and the
       asides); it is the same class the textbook view uses, so a section looks
       identical whether it is read here or inside learn.html. -->
  <article class="notes-body notes-view">
${START}
${prose}
${END}
  </article>

  <nav class="notes-onward" aria-label="Section navigation">${nav}</nav>

  <footer class="notes-foot">
    <p><a href="../learn.html">&larr; All ${total} sections</a></p>
    <p class="privacy-link"><a href="../../privacy.html">Privacy</a> &middot; <a href="../../terms.html">Terms</a> &middot; <a href="../../sources.html">Sources</a></p>
  </footer>
</div>
</body>
</html>
`;
}

const modules = loadModules();
const ordered = [];
for (const mod of modules) for (const topic of mod.topics) ordered.push({ topic, module: mod });

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
    `        <h1>The Organic Chemistry Textbook</h1>\n` +
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
