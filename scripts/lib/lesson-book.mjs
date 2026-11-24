/* A lesson inside the textbook, for the two courses whose lessons are not written by the A&P / AP® builders
   (owner, 2026-11-24: "nremt and ochem should be changed as well"). The same page shape lessonBook() gives the
   others (scripts/lib/r3-reading.mjs): the Learn tab's band with the breadcrumb in it, the course contents rail
   with the Read | Interactive switch under "Contents" (assets/course/read-toggle.js draws it), and the lesson in
   the textbook's white card. Styles: the end of assets/course/r3-reading.css (.ls-book). The phone "Contents"
   drawer: assets/course/ls-rail.js.

   - NREMT: scripts/build-nremt-lessons.mjs writes the page and calls lessonBookOpen / LESSON_BOOK_CLOSE.
   - Ochem: the lesson pages are hand-written, so ochemLessonBook() writes the shell between
     <!-- ls-book:start --> ... <!-- ls-book:end --> marks (scripts/build-crumbs.mjs runs it, right after the
     breadcrumb it puts in the band). */
import { learnBandHtml, courseInfo } from './learn-band.mjs';

const esc = (s) => String(s).replace(/&(?!(?:[a-z]+|#\d+);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* The contents rail. groups: [{ num, title, href, open, topics: [{ title, href, on }] }]; only the open chapter
   lists its lessons. Chapter heads go to that chapter's first lesson. */
export function lessonRailHtml({ id, groups }) {
  const mods = groups.map((g) => {
    const head = `<span class="tb-toc-num">${esc(g.num)}</span><span class="tb-toc-modtitle">${esc(g.title)}</span>`;
    const topics = g.open && g.topics.length
      ? `<div class="tb-toc-topics">${g.topics.map((t) => `<a class="tb-toc-topic${t.on ? ' on' : ''}" href="${t.href}"${t.on ? ' aria-current="page"' : ''}><span class="tb-toc-tick"></span>${esc(t.title)}</a>`).join('')}</div>`
      : '';
    return `<div class="tb-toc-mod${g.open ? ' open' : ''}"><a class="tb-toc-modhead" href="${g.href}">${head}</a>${topics}</div>`;
  }).join('');
  return `<aside class="tb-rail" id="${id}">
    <p class="tb-rail-title">Contents</p>
    <nav class="tb-contents" aria-label="Course contents">${mods}</nav>
  </aside>`;
}

/* Band, shell, rail and the opening of the card column. `up` is the way to the site root, `crumb` the page's
   breadcrumb nav, `rail` lessonRailHtml()'s result, `railId` its id. The band's switch links are written for the
   course folder, so from lessons/ they go up one. */
export function lessonBookOpen({ key, up, crumb, rail, railId }) {
  const band = learnBandHtml({ key, active: 'book', up, crumb, sub: '' })
    .replace(/<nav class="lswitch"[\s\S]*?<\/nav>/, (m) => m.replace(/href="/g, 'href="../'));
  return `${band}<div class="tb-shell bk bk-book r3 r3-read lap ls-book" data-cover="${key}">
  <button type="button" class="tb-toc-btn" aria-controls="${railId}" aria-expanded="false">&#9776; Contents</button>
  ${rail}
  <div class="tb-main ls-col">`;
}
export const LESSON_BOOK_CLOSE = '  </div>\n</div>';

/* ---- ochem ---- */
const START = '<!-- ls-book:start -->', END = '<!-- ls-book:end -->';
const BLOCK = /<!-- ls-book:start -->[\s\S]*?<!-- ls-book:end -->\n?/g;

function ochemRail(id) {
  const d = courseInfo('ochem');
  const here = d.topics.find((t) => t.l === `lessons/${id}.html`);
  const groups = d.units.map((u, i) => {
    const ts = d.topics.filter((t) => t.u === i && t.l && /^lessons\//.test(t.l));
    return ts.length ? {
      num: i + 1, title: u.title, open: !!here && here.u === i, href: ts[0].l.replace(/^lessons\//, ''),
      topics: ts.map((t) => ({ title: t.t, href: t.l.replace(/^lessons\//, ''), on: t === here })),
    } : null;
  }).filter(Boolean);
  return lessonRailHtml({ id: 'oc-rail', groups });
}

/* Idempotent: the marked blocks are dropped and written again. A page without the breadcrumb block or the
   .lesson-links nav (every lesson has both) is returned without the shell. */
export function ochemLessonBook(html, file) {
  let out = html.replace(BLOCK, '');
  const crumb = out.match(/<!-- crumb:start -->[\s\S]*?(<nav class="site-crumb"[\s\S]*?<\/nav>)[\s\S]*?<!-- crumb:end -->\n?/);
  const navAt = out.indexOf('<nav class="lesson-links');
  const navEnd = navAt < 0 ? -1 : out.indexOf('</nav>', navAt);
  if (!crumb || navEnd < 0 || !out.includes('<div class="xshell lesson-shell')) return out;
  const id = file.replace(/\.html$/, '');
  const open = `${START}\n${lessonBookOpen({ key: 'ochem', up: '../../', crumb: crumb[1], rail: ochemRail(id), railId: 'oc-rail' })}\n<link rel="stylesheet" href="../../assets/course/book.css">\n${END}\n`;
  const close = `\n${START}\n${LESSON_BOOK_CLOSE}\n<script src="../../assets/course/ls-rail.js" defer></script>\n${END}`;
  const at = crumb.index + crumb[0].length;
  out = out.slice(0, at) + open + out.slice(at);
  const end = out.indexOf('</nav>', out.indexOf('<nav class="lesson-links')) + 6;
  return out.slice(0, end) + close + out.slice(end);
}
