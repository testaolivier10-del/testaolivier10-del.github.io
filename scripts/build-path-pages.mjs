#!/usr/bin/env node
/* <dir>/path.html for every course: the guided study path's page
   (docs/guided-path.md). Built from the course's own review.html, so the head
   (CSP, fonts, styles, theme), the header and the footer stay whatever that
   course's pages already use; only the page's own scripts and its <main> are
   swapped. assets/site-chrome.js adds the Path tab and loads
   assets/course/path.js, which fills #levlPath.

   node scripts/build-path-pages.mjs          write
   node scripts/build-path-pages.mjs --check  fail when a page is stale */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COURSES } from './lib/courses.mjs';
import { NOINDEX } from './lib/app-pages.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHECK = process.argv.includes('--check');

/* The scripts a course page needs for its chrome and progress; anything else
   on review.html belongs to the review queue. */
const KEEP = /(^|\/)(errors|account|report-question|premium|premium-gates|ochem-premium|hub-progress|chime|site-chrome|[a-z]+-curriculum|curriculum|[a-z]+-core|[a-z]+-nav|nav|ochem-xp)\.js$/;

function build(c) {
  const src = readFileSync(join(ROOT, c.dir, 'review.html'), 'utf8');
  const name = (src.match(/<title>[^—]*— ([^|]*?) \| LevlPrep<\/title>/) || [])[1] || c.name;
  const title = `Your study path — ${name} | LevlPrep`;
  const desc = `Your own path through ${name.replace(/&amp;/g, '&').replace(/^AP® /, '')}: start where you are, add only what you are missing, and follow it at your own pace.`.replace(/&/g, '&amp;');
  let html = src
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${title}"`)
    .replace(/(<meta name="description" content=")[^"]*"/, `$1${desc}"`)
    .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${desc}"`)
    .replace(/review\.html"/g, 'path.html"')
    .replace(/(<span aria-current="page">)Review(<\/span>)/, '$1Your path$2');
  if (!/name="robots"/.test(html)) html = html.replace('</title>', `</title>\n${NOINDEX}`);
  // Page scripts: keep the chrome and progress ones, drop the review queue's.
  html = html.replace(/<script\b([^>]*)\bsrc="([^"]+)"([^>]*)><\/script>\n?/g, (m, a, s) => (KEEP.test(s) ? m : ''));
  html = html.replace(/<script>([\s\S]*?)<\/script>\n?/g, (m, body) => {
    if (/nremt_theme/.test(body)) return m;
    // The section and base settings, and a course object such as Calculus BC's
    // window.ApCalcCourse (which tells the shared AB runtime it is BC).
    if (/^\s*window\.\w+(Section|_SECTION)\s*=\s*'review'/.test(body)) return m.replace(/=\s*'review'/, "= 'path'");
    return '';
  });
  html = html.replace(/(<body[^>]*?)\sdata-(app|runner)="review"/, '$1 data-app="path"');
  const main = `<main id="main" class="r3 lp-view" data-cover="${c.key}" tabindex="-1">
<div class="hwrap"><div id="levlPath"><p class="lp-load">Loading your path…</p></div>
<noscript><p>Your study path needs JavaScript. Every unit is still open from the <a href="index.html">course home</a>.</p></noscript></div>
</main>`;
  if (!/<main[\s\S]*?<\/main>/.test(html)) throw new Error(`${c.dir}/review.html has no <main>`);
  html = html.replace(/<main[\s\S]*?<\/main>/, main);
  // r3.css carries the band colors and grid the path page uses.
  if (!/course\/r3\.css/.test(html)) {
    const depth = '../';
    html = html.replace('</head>', `<link rel="stylesheet" href="${depth}assets/course/r3.css">\n</head>`);
  }
  return html;
}

let stale = 0;
for (const c of COURSES) {
  if (!existsSync(join(ROOT, c.dir, 'review.html'))) throw new Error(`${c.dir}/review.html is missing`);
  const out = build(c), file = join(ROOT, c.dir, 'path.html');
  if (CHECK) {
    if (!existsSync(file) || readFileSync(file, 'utf8') !== out) { console.error(`stale: ${c.dir}/path.html (run node scripts/build-path-pages.mjs)`); stale++; }
  } else { writeFileSync(file, out); console.log(`${c.dir}/path.html`); }
}
if (stale) process.exit(1);
