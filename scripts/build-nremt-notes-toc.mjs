/* Gives nremt/study-notes.html something to be before its chapters arrive.

   THE PROBLEM THIS SOLVES
   -----------------------
   The NREMT study notes are 40 chapters in assets/study-notes.json, fetched
   and rendered by the page's own script. That is the right shape for a reader
   — one page, a rail, a search box over every word — and it left the served
   HTML with no heading and one sentence of content:

     <div id="tbChapter">
       <noscript><p>The notes need JavaScript to load their chapters.</p></noscript>
     </div>

   So a page in the sitemap, asking to be indexed, offered a crawler 57 words
   and no <h1>. Not because the content is thin — it is the longest thing on
   the site — but because none of it is in the file.

   This is the same fix ochem/learn.html already carries (see the TOC block at
   the end of build-notes-pages.mjs) and for the same reason: generate a real
   table of contents into the page from the same data the runtime fetches, and
   let the script replace it the moment it runs. A reader with JavaScript sees
   what they always saw. A reader without one, and a crawler, now get a
   heading and a link to each of the forty chapters.

   WHY TITLES AND NOT THE CHAPTER INTROS
   -------------------------------------
   The first version of this listed each chapter's `intro` under its title,
   which read well and put 2,400 words of real prose in the file. It also put
   5.7 KB gzipped back into a page whose whole point is to be a shell:
   check-weight.mjs budgets study-notes.html at 20 KB precisely because the
   chapters used to be inline, and the note on that budget says that if the
   number ever needs to move, the answer is to move data OUT of the page
   rather than raise it. Putting the intros in was moving data back in.

   So this is one line per chapter, which is what ochem/learn.html's static
   contents already are and for the same reason. The page gains a heading and
   forty crawlable links to the chapters; it does not gain a copy of the book.

   Forty chapter titles is still thin for a page this size, and the honest fix
   for that is the one the ochem prose got: a page per chapter, the way
   ochem/notes/** works. That is a bigger change than a contents list, and it
   creates forty new URLs, so it is noted here rather than done quietly.

     node scripts/build-nremt-notes-toc.mjs            rewrite
     node scripts/build-nremt-notes-toc.mjs --check    fail if stale (CI)
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');

const START = '<!-- notes-toc:start -->';
const END = '<!-- notes-toc:end -->';
const PAGE = join(ROOT, 'nremt', 'study-notes.html');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const data = JSON.parse(readFileSync(join(ROOT, 'nremt', 'assets', 'study-notes.json'), 'utf8'));
const chapters = Array.isArray(data.chapters) ? data.chapters : null;
if (!chapters || !chapters.length) {
  console.error('FAIL: nremt/assets/study-notes.json has no chapters.');
  process.exit(1);
}

/* The anchors are the ones route() already answers to, so a link here lands on
   the chapter rather than at the top of a page that then jumps. */
const items = chapters.map((ch) => (
  `          <li><a href="#ch${ch.num}"><b>${ch.num}</b> ${esc(ch.title)}</a></li>`
)).join('\n');

const sections = chapters.reduce((n, ch) => n + (ch.sections ? ch.sections.length : 0), 0);

const block = `${START}
      <div class="tb-static-toc">
        <h1>NREMT-EMT Study Notes</h1>
        <p>${chapters.length} chapters and ${sections} sections, in course order — the written half of the EMT course, free and with no account needed.</p>
        <ol>
${items}
        </ol>
      </div>
      ${END}`;

const current = readFileSync(PAGE, 'utf8');
const a = current.indexOf(START);
const b = current.indexOf(END);

let next;
if (a !== -1 && b !== -1) {
  next = current.slice(0, a) + block + current.slice(b + END.length);
} else {
  /* First run: the block goes where the noscript paragraph was, inside
     #tbChapter, so the script's own render replaces it exactly as before. */
  const anchor = '<div id="tbChapter">\n      <noscript><p>The notes need JavaScript to load their chapters.</p></noscript>';
  if (!current.includes(anchor)) {
    console.error('FAIL: could not find the #tbChapter placeholder in nremt/study-notes.html.');
    process.exit(1);
  }
  next = current.replace(anchor, `<div id="tbChapter">\n      ${block}`);
}

if (next === current) {
  console.log('OK — the static contents in nremt/study-notes.html are up to date.');
} else if (check) {
  console.error('FAIL: the static contents in nremt/study-notes.html are stale.');
  console.error('Run: node scripts/build-nremt-notes-toc.mjs');
  process.exit(1);
} else {
  writeFileSync(PAGE, next);
  console.log(`Wrote a ${chapters.length}-chapter table of contents into nremt/study-notes.html.`);
}
