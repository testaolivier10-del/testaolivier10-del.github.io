/* The Learn tab's small band (course redesign round 4, decisions 3 and 4; docs/course-redesign-r4.md, mockup
   docs/redesign-r4/mockups/Learn.dc.html). One band for the three pages under Learn in every course: the textbook
   (learn.html, NREMT study-notes.html), the glossary and the video lessons page. It carries the issue line with the
   course name, the title "Learn", one sub line, the switch Textbook / Glossary / Videos (each its own URL; the
   switch only links between them) and the small course drawing. No buttons (decision 3).

   Part A owns the look of `.band.short` and `.lap` (assets/course/r3.css); the switch and the sub line are styled
   in assets/course/book.css (`.r3-learn-top`, `.lswitch`). Callers put `lap` on the first content container under
   the band so it overlaps the band's bottom edge.

   Used by scripts/lib/r3-reading.mjs (learn and glossary pages, from every course builder) and by
   scripts/build-videos.mjs (the videos pages, and the band on the two hand-written readers, ochem/learn.html and
   nremt/study-notes.html). */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const esc = (s) => String(s).replace(/&(?!(?:[a-z]+|#\d+);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* The course's path file (scripts/build-paths.mjs) names it, gives its folder and its units. */
const PATHS = new Map();
export function courseInfo(key) {
  if (!PATHS.has(key)) PATHS.set(key, JSON.parse(readFileSync(join(ROOT, 'assets', 'path', `${key}.json`), 'utf8')));
  return PATHS.get(key);
}

/* The page that is each course's textbook. */
export const bookFile = (key) => (key === 'nremt' ? 'study-notes.html' : 'learn.html');

/* "8 units and 2 skills tracks · every notes page is free" (AP®); "25 chapters · ..." (the others). NREMT's path
   groups its 40 chapters in five stretches, so its count is its topics (one per chapter). */
export function bookSub(key) {
  const d = courseInfo(key);
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  let count;
  if (d.kind === 'nremt') count = plural(d.topics.length, 'chapter');
  else {
    const skills = d.units.filter((u) => u.label === 'Skills').length;
    const main = d.units.length - skills;
    count = d.kind === 'ap'
      ? `${plural(main, 'unit')}${skills ? ` and ${skills} skills track${skills === 1 ? '' : 's'}` : ''}`
      : plural(main, 'chapter');
  }
  return `${count} &middot; every notes page is free`;
}

const ICON = {
  book: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/></svg>',
  terms: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 6h16M4 12h10M4 18h7"/></svg>',
  video: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/></svg>',
};

/* The switch. `active` is 'book', 'glossary' or 'videos'; links are relative to the course folder. */
export function learnSwitch(key, active) {
  const items = [['book', bookFile(key), 'Textbook'], ['glossary', 'glossary.html', 'Glossary'], ['videos', 'videos.html', 'Videos']];
  return `<nav class="lswitch" aria-label="Learn">${items.map(([id, href, label]) =>
    `<a href="${href}"${id === active ? ' aria-current="page"' : ''}>${ICON[id === 'book' ? 'book' : id === 'glossary' ? 'terms' : 'video']}<span>${label}</span></a>`).join('')}</nav>`;
}

/* The band. `crumb` is the page's breadcrumb nav (kept: audit 2026-10 added visible breadcrumbs), `sub` the sub
   line (HTML), `h1` true when the band holds the page's h1 (glossary, videos; the textbook's h1 is its chapter's,
   drawn by the reader), `up` the way back to the site root. The title reads "Learn"; with an h1 the page's own
   name follows for screen readers and the outline. */
export function learnBandHtml({ key, active, up, crumb = '', sub = '', h1 = false, pageName = '' }) {
  const d = courseInfo(key);
  const title = h1
    ? `<h1 class="deck" id="r3Title">Learn${pageName ? `<span class="sr-only">: ${esc(pageName)}</span>` : ''}</h1>`
    : '<p class="deck">Learn</p>';
  return `<div class="r3 r3-learn-top" data-cover="${key}">
<section class="band short r3-lband" aria-label="${esc(d.name)}: Learn"><div class="hwrap"><div>
${crumb ? crumb + '\n' : ''}<p class="issue">${esc(d.name)} <i></i></p>
${title}
${sub ? `<p class="sub">${sub}</p>\n` : ''}${learnSwitch(key, active)}
</div><div class="art" aria-hidden="true"><img src="${up}assets/covers/art/${key}.svg" alt="" width="640" height="400" decoding="async"></div></div></section>
</div>
`;
}

/* The reader's own "last unit/chapter opened" key, which assets/course/learn.js respects. */
export function readerLastKey(key) {
  if (key === 'ochem') return 'ochem_textbook_last';
  if (key === 'nremt') return 'nremt_notes_last';
  return `${key}_book_last`;
}

/* The script that opens the textbook at the student's topic. Plain (not deferred) and placed before the reader's
   own scripts, so it sets the address before the reader routes. */
export function learnScript(key, up) {
  const classroom = /^ap/.test(key) ? ' data-classroom="1"' : '';
  return `<script src="${up}assets/course/learn.js" data-course="${key}" data-last="${readerLastKey(key)}"${classroom}></script>
<script src="${up}assets/course/more-menu.js" defer></script>
`;
}
