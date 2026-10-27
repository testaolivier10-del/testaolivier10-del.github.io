/* The video block on lesson and notes pages, from docs/videos.json.

   One function, applyVideo(rel, html), owns everything between the two
   markers below on every page: it removes the block and, when the data file
   lists a video for that page, writes it back in the page's one fixed spot.
   Idempotent, so every script that writes these pages can call it:

     - the course builders (build-anp, build-apbio, ... build-apenv) in put(),
     - build-notes-pages.mjs (ochem notes) and build-nremt-notes-pages.mjs,
     - build-videos.mjs, for the hand-written ochem lessons and to --check all.

   PRIVACY AND SPEED: the block is a facade. Its thumbnail is a WebP served
   from this site (assets/video/thumbs/), its play button and chapter list are
   ordinary links to youtube.com, and nothing in it has a src on a YouTube
   host. Only a tap on play (assets/video/video.js) swaps in the
   www.youtube-nocookie.com player. Without JavaScript the links just open
   the video on YouTube. docs/video-lessons.md has the whole design. */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { applyQuickAnswer } from './quick-answers.mjs';
import { fileURLToPath } from 'node:url';

export const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const DATA_FILE = 'docs/videos.json';
export const START = '<!-- video:start -->';
export const END = '<!-- video:end -->';
export const EMBED_HOST = 'https://www.youtube-nocookie.com';
export const THUMB_DIR = 'assets/video/thumbs';
export const THUMB_WIDTHS = [480, 960];
export const COURSE_DIRS = {
  nremt: 'nremt', ochem: 'ochem', anp: 'anatomy-physiology', apbio: 'bio', apchem: 'chem',
  apphys: 'physics', apcalc: 'calculus', apstat: 'statistics', apenv: 'environmental-science',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* 1163 -> "19:23"; 3725 -> "1:02:05". */
export function clock(s) {
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`;
}
const minutes = (s) => Math.max(1, Math.round(s / 60));

/* Problems with the data, as sentences (empty when it is sound). Pages must
   exist and be a lesson or notes page of the video's own course; ids are the
   11 characters YouTube uses; chapters start at 0, rise, and end before the
   video does; each video has its two thumbnails. */
export function validate(data, root = ROOT) {
  const errs = [];
  if (!data || !Array.isArray(data.videos)) return [`${DATA_FILE}: needs a "videos" list`];
  const seenId = new Set(), seenPage = new Map();
  for (const v of data.videos) {
    const where = `${DATA_FILE} ${v && v.id}`;
    if (!v || !/^[A-Za-z0-9_-]{11}$/.test(v.id || '')) { errs.push(`${where}: id must be an 11-character YouTube id`); continue; }
    if (seenId.has(v.id)) errs.push(`${where}: listed twice`);
    seenId.add(v.id);
    if (!COURSE_DIRS[v.course]) errs.push(`${where}: unknown course "${v.course}"`);
    if (!v.title || typeof v.title !== 'string') errs.push(`${where}: needs a title`);
    if (!(Number.isInteger(v.seconds) && v.seconds > 0)) errs.push(`${where}: seconds must be a whole number above 0`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.posted || '')) errs.push(`${where}: posted must be YYYY-MM-DD`);
    if (!Array.isArray(v.pages) || !v.pages.length) errs.push(`${where}: needs at least one page`);
    for (const p of v.pages || []) {
      const dir = COURSE_DIRS[v.course];
      if (!new RegExp(`^${dir}/(notes|lessons)/[a-z0-9-]+\\.html$`).test(p)) errs.push(`${where}: page ${p} is not a ${dir}/notes or ${dir}/lessons page`);
      else if (!existsSync(join(root, p))) errs.push(`${where}: page ${p} does not exist`);
      if (seenPage.has(p)) errs.push(`${where}: page ${p} already shows ${seenPage.get(p)} (one video per page)`);
      seenPage.set(p, v.id);
    }
    const ch = v.chapters || [];
    if (!Array.isArray(ch)) errs.push(`${where}: chapters must be a list`);
    else if (ch.length) {
      if (ch[0][0] !== 0) errs.push(`${where}: the first chapter must start at 0`);
      ch.forEach((c, i) => {
        if (!Array.isArray(c) || !Number.isInteger(c[0]) || typeof c[1] !== 'string' || !c[1].trim()) errs.push(`${where}: chapter ${i + 1} must be [seconds, "title"]`);
        else if (i && c[0] <= ch[i - 1][0]) errs.push(`${where}: chapter ${i + 1} does not start after the one before`);
        else if (c[0] >= v.seconds) errs.push(`${where}: chapter ${i + 1} starts after the video ends`);
      });
    }
    for (const w of THUMB_WIDTHS) if (!existsSync(join(root, THUMB_DIR, `${v.id}-${w}.webp`))) errs.push(`${where}: missing ${THUMB_DIR}/${v.id}-${w}.webp (scripts/add-video.mjs makes it)`);
  }
  return errs;
}

let cached = null;
export function loadVideos(root = ROOT) {
  if (cached && root === ROOT) return cached;
  const data = JSON.parse(readFileSync(join(root, DATA_FILE), 'utf8'));
  const byPage = new Map();
  for (const v of data.videos || []) for (const p of v.pages || []) byPage.set(p, v);
  const out = { data, byPage };
  if (root === ROOT) cached = out;
  return out;
}

/* The block. `compact` is the lesson-page form: a small card in the lesson's
   header that opens into the full player when played. */
/* The title as the site shows it. The data keeps YouTube's exact title; on
   AP® course pages the mark carries its ® (scripts/site-rules/*-trademark.mjs). */
export function displayTitle(v) {
  // "... | NREMT" is a YouTube search suffix; on the course's own page it is noise.
  const t = v.title.replace(/\s+\|\s+(NREMT|EMT|LevlPrep)$/, '');
  return /^ap/.test(v.course) ? t.replace(/\bAP\b(?!®)/g, 'AP®') : t;
}

/* The class each course's ordering check (scripts/lib/<course>-map.mjs
   stripForScan) treats as navigation: the block points at a video, it does
   not teach, so a chapter called "Next: the elements of life" is not a use
   of a later topic's term. NREMT and ochem have no such check. */
const NAV_REF = { anp: 'anp-nav-ref', apbio: 'bio-nav-ref', apchem: 'chem-nav-ref', apphys: 'phys-nav-ref',
  apcalc: 'calc-nav-ref', apstat: 'stat-nav-ref', apenv: 'env-nav-ref' };

export function videoBlock(v, { compact = false, kind = 'notes' } = {}) {
  v = { ...v, title: displayTitle(v) };
  const watch = `https://www.youtube.com/watch?v=${v.id}`;
  const len = clock(v.seconds);
  const mins = minutes(v.seconds);
  const [y, mo, d] = v.posted.split('-').map(Number);
  const posted = `${d} ${MONTHS[mo - 1]} ${y}`;
  const srcset = THUMB_WIDTHS.map((w) => `/${THUMB_DIR}/${v.id}-${w}.webp ${w}w`).join(', ');
  const sizes = compact ? '(max-width: 600px) 40vw, 200px' : '(max-width: 760px) 100vw, 720px';
  const chapters = (v.chapters || []).length > 1
    ? `\n  <details class="lpv-chapters"><summary>Chapters <span class="lpv-n">${v.chapters.length}</span></summary><ol>${v.chapters.map(([t, name]) =>
      `<li><a href="${watch}&amp;t=${t}s" data-start="${t}"><span class="lpv-t">${clock(t)}</span> ${esc(name)}</a></li>`).join('')}</ol></details>`
    : '';
  return `${START}
<section class="lpv${compact ? ' lpv-compact' : ''}${NAV_REF[v.course] ? ' ' + NAV_REF[v.course] : ''}" data-video="${v.id}" data-video-course="${esc(v.course)}" data-video-kind="${kind}" aria-labelledby="lpv-h-${v.id}">
  <link rel="stylesheet" href="/assets/video/video.css">
  <div class="lpv-frame">
    <a class="lpv-play" href="${watch}" data-start="0" aria-label="Play the video lesson: ${esc(v.title)} (${mins} minutes)">
      <img src="/${THUMB_DIR}/${v.id}-480.webp" srcset="${srcset}" sizes="${sizes}" width="1280" height="720" alt="" decoding="async">
      <span class="lpv-btn" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" focusable="false"><path d="M8 5.5v13l10.5-6.5z"/></svg></span>
      <span class="lpv-len" aria-hidden="true">${len}</span>
    </a>
  </div>
  <div class="lpv-body">
    <p class="lpv-k"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10.5-6.5z"/></svg>Video lesson<span class="lpv-meta"> &middot; ${mins} min</span></p>
    <p class="lpv-title" id="lpv-h-${v.id}">${esc(v.title)}</p>${v.note ? `\n    <p class="lpv-note">${esc(v.note)}</p>` : ''}
    <p class="lpv-fine">Posted ${posted} on <a href="https://www.youtube.com/@LevlPrep">our YouTube channel</a>. The player loads from YouTube only when you press play.</p>
  </div>${chapters}
  <script src="/assets/video/video.js" defer></script>
</section>
${END}
`;
}

/* Where the block goes on each kind of page, as [regex, how]. Every pattern
   matches exactly once on its pages (the test checks all of them).
     notes pages (every course's book layout): after the page header, before
       the prose, so the course books, which read only the prose, never show it;
     NREMT chapter pages: after the chapter header;
     AP and A&P lessons: last thing in the lesson's header, compact;
     ochem lessons: last thing in the hero, compact (inside it, so the rail
       step-back.js adds after first paint cannot reorder it: no shift). */
const SPOTS = [
  { test: /^[a-z-]+\/notes\//, kind: 'notes', compact: false, re: /<header class="bk-head">[\s\S]*?<\/header>\n|<header class="tb-chapter-head">[\s\S]*?<\/header>\n|<!-- r3:head -->\n(?:<p class="bk-lede">[\s\S]*?<\/p>\n)?/, at: 'after' },
  { test: /^ochem\/lessons\//, kind: 'lesson', compact: true, re: /<div class="hero">[\s\S]*?\n(?=  <\/div>\n)/, at: 'after' },
  { test: /^[a-z-]+\/lessons\//, kind: 'lesson', compact: true, re: /<header class="[a-z]+-ls-hero">[\s\S]*?\n(?=[ \t]*<\/header>)/, at: 'after' },
];

const BLOCK_RE = new RegExp(`[ \\t]*${START}[\\s\\S]*?${END}\\n?`, 'g');

/* rel is the page's path from the repo root, e.g. "bio/notes/water.html". */
/* The quick answer box (scripts/lib/quick-answers.mjs) goes through here too,
   after the video, so it sits first under the header and every caller of
   applyVideo writes and checks both. */
export function applyVideo(rel, html, videos = loadVideos()) {
  return applyQuickAnswer(rel, placeReader(rel, placeVideo(rel, html, videos), videos));
}

/* COURSE READERS. The one-page books (each course's learn.html and the NREMT
   reader nremt/study-notes.html) draw their chapters with JavaScript, so the
   card cannot be written into the markup where it shows. Instead the page
   carries, between the two markers below and just before </body>, the cards
   for its own chapters as inline JSON, each with the selector of the header it
   goes under, plus assets/video/reader-video.js, which puts each card in when
   the reader draws that chapter. A video's notes page names its chapter: the
   NREMT chapter of that notes page, or the topic section with the notes
   page's slug. Pages with no video get nothing. */
export const R_START = '<!-- video:reader -->';
export const R_END = '<!-- video:reader-end -->';
const R_RE = new RegExp(`${R_START}[\\s\\S]*?${R_END}\\n?`, 'g');

export const READERS = Object.fromEntries(Object.entries(COURSE_DIRS)
  .map(([course, dir]) => [course, course === 'nremt' ? 'nremt/study-notes.html' : `${dir}/learn.html`]));

let nremtNums = null;
function nremtChapter(slug, root = ROOT) {
  if (!nremtNums) {
    const data = JSON.parse(readFileSync(join(root, 'nremt', 'assets', 'study-notes.json'), 'utf8'));
    const slugOf = (t) => String(t).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    nremtNums = new Map(data.chapters.map((c, i) => [slugOf(c.title), c.num || i + 1]));
  }
  return nremtNums.get(slug);
}

/* The cards one reader shows, in reading order of the data file. */
export function readerCards(rel, videos = loadVideos()) {
  const course = Object.keys(READERS).find((c) => READERS[c] === rel);
  if (!course) return [];
  const dir = COURSE_DIRS[course];
  const out = [];
  for (const v of videos.data.videos || []) {
    if (v.course !== course) continue;
    for (const page of v.pages || []) {
      const m = page.match(new RegExp(`^${dir}/notes/([a-z0-9-]+)\\.html$`));
      if (!m) continue;
      let at;
      if (course === 'nremt') {
        const n = nremtChapter(m[1]);
        if (!n) throw new Error(`${page}: no NREMT chapter has this notes page`);
        at = `[data-chapter="${n}"] > .tb-chapter-head`;
      } else {
        at = `section[id="${m[1]}"] > .bk-sec-head, section[id="${m[1]}"] > .tb-section-head`;
      }
      const html = videoBlock(v, { kind: 'reader' })
        .replace(START + '\n', '').replace('\n' + END + '\n', '')
        .replace(/\n  <link rel="stylesheet"[^>]*>/, '').replace(/\n  <script[^>]*><\/script>/, '');
      out.push({ id: v.id, at, html });
    }
  }
  return out;
}

function placeReader(rel, html, videos) {
  if (!Object.values(READERS).includes(rel)) return html;
  const stripped = html.replace(R_RE, '');
  const cards = readerCards(rel, videos);
  if (!cards.length) return stripped;
  const i = stripped.lastIndexOf('</body>');
  if (i < 0) throw new Error(`${rel}: a reader with no </body>`);
  const json = JSON.stringify(cards).replace(/</g, '\\u003c');
  const block = `${R_START}\n<script type="application/json" id="lpv-reader">${json}</script>\n<script src="/assets/video/reader-video.js" defer></script>\n${R_END}\n`;
  return stripped.slice(0, i) + block + stripped.slice(i);
}

function placeVideo(rel, html, videos) {
  const stripped = html.replace(BLOCK_RE, '');
  const v = videos.byPage.get(rel);
  if (!v) return stripped;
  const spot = SPOTS.find((s) => s.test.test(rel));
  if (!spot) throw new Error(`${rel}: ${DATA_FILE} lists a video for a page that has no video spot`);
  const m = stripped.match(spot.re);
  if (!m) throw new Error(`${rel}: the page has no place for its video (scripts/lib/videos.mjs SPOTS)`);
  const at = m.index + m[0].length;
  return stripped.slice(0, at) + videoBlock(v, { compact: spot.compact, kind: spot.kind }) + stripped.slice(at);
}

/* Chapters from a YouTube description: lines that start with m:ss or h:mm:ss. */
export function chaptersFromText(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    const m = line.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})\s+(.+)$/);
    if (m) out.push([(Number(m[1] || 0) * 3600) + Number(m[2]) * 60 + Number(m[3]), m[4].trim()]);
  }
  return out.length && out[0][0] === 0 ? out : [];
}
