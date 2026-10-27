/* Turns each chapter of the NREMT study notes into a page you can open on its
   own, at nremt/notes/<chapter-slug>.html, from the same JSON the reader uses.

   THE PROBLEM THIS SOLVES
   -----------------------
   The forty chapters live in nremt/assets/study-notes.json and are rendered
   by nremt/study-notes.html's own script, one chapter at a time. That is the
   right shape for a reader (one page, a rail, a search box over every word)
   and the wrong one for a search engine: the served HTML is a table of
   contents (scripts/build-nremt-notes-toc.mjs) and none of the chapter text.
   The longest written thing on the site was one URL, and that URL said
   nothing about airway management or bleeding control.

   The ochem prose had the same problem and the same fix
   (scripts/build-notes-pages.mjs): give each piece of the book a page of its
   own, in the same shell as every other page of the course, with a title,
   a description, a canonical URL and links onward. This is that fix for the
   NREMT notes. The reader is unchanged; these pages sit beside it, and each
   one links into the reader at the same chapter.

   ONE COPY OF THE WORDS
   ---------------------
   Nothing here is written by hand. The prose, the section titles, the key
   points and the chapter intro come from study-notes.json. The section and
   topic markup is a port of study-notes.html's sectionHtml() and
   chapterOpenerHtml(), so a chapter looks the same in both places, and the
   page's stylesheet is the reader's own <style> block, read out of
   study-notes.html at build time. The chapter tools and the question-bank
   rules are read out of the same file (CHAPTER_TOOLS, CHAPTER_QUESTIONS),
   so there is no second list to keep in step. The medical disclaimer is the
   reader's footer paragraph, copied verbatim.

   The <title> and description come from the chapter's title and its own
   opening sentences. Nothing here writes new sentences about medicine.

   WHAT IS LEFT OUT
   ----------------
   The reader's review questions are drawn from the bank at runtime, with
   their answer keys and explanations. Those stay where the bank is: a static
   page links to practice instead of printing questions and answers into
   markup a crawler would index. Key terms are filled in here, at build time,
   from nremt/assets/glossary.json with the reader's own matching rule
   (termsInChapter), because a glossary definition is free content either way.

     node scripts/build-nremt-notes-pages.mjs            rewrite
     node scripts/build-nremt-notes-pages.mjs --check    fail if any page is stale (CI)
*/
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { CSP } from './lib/site-config.mjs';
import { loadChapters, chapterSlug } from './lib/nremt-notes.mjs';
import { applyVideo } from './lib/videos.mjs';
import { r3Reading } from './lib/r3-reading.mjs';
import { loadLessons } from './lib/nremt-lessons.mjs';
import { premiumData } from './lib/premium-data.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');
const ORIGIN = 'https://levlprep.com';
const OUT_DIR = join(ROOT, 'nremt', 'notes');
const READER = join(ROOT, 'nremt', 'study-notes.html');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const chapters = loadChapters(ROOT);
const reader = readFileSync(READER, 'utf8');
// Each section's interactive lesson, when built (scripts/build-nremt-lessons.mjs).
const LESSON_BY_SECTION = new Map(loadLessons(ROOT, chapters).map((L) => [L.section, L]));

/* ---- what is read out of the reader page ---------------------------------- */

// The reader's stylesheet: the NREMT-only rules (topics, tables, key points,
// the end matter) on top of assets/course/book.css.
const styleMatch = reader.match(/<style>\n([\s\S]*?)<\/style>/);
if (!styleMatch) fail('nremt/study-notes.html has no <style> block to share.');
const READER_CSS = styleMatch[1].replace(/\n+$/, '');

// The disclaimer: the first paragraph of the reader's footer.
const disclaimerMatch = reader.match(/<footer>\s*(<p>[\s\S]*?<\/p>)/);
if (!disclaimerMatch || /privacy-link/.test(disclaimerMatch[1])) fail('nremt/study-notes.html has no disclaimer paragraph in its footer.');
const DISCLAIMER = disclaimerMatch[1];

// CHAPTER_TOOLS and CHAPTER_QUESTIONS are plain literals in the reader's
// script, so they are evaluated in a sandbox rather than retyped here.
function literal(name, open, close) {
  const re = new RegExp(`const ${name} = \\${open}([\\s\\S]*?)\\n\\${close};`);
  const m = reader.match(re);
  if (!m) fail(`could not find ${name} in nremt/study-notes.html.`);
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`this.out = ${open}${m[1]}\n${close};`, sandbox);
  return sandbox.out;
}
const CHAPTER_TOOLS = literal('CHAPTER_TOOLS', '[', ']');
const CHAPTER_QUESTIONS = literal('CHAPTER_QUESTIONS', '{', '}');

const glossary = JSON.parse(readFileSync(join(ROOT, 'nremt', 'assets', 'glossary.json'), 'utf8'));

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

/* ---- ported from study-notes.html ----------------------------------------- */

const topicText = (t) => t.heading + ' ' + (t.paragraphs ? t.paragraphs.join(' ') : stripTags(t.html));
const topicId = (sec, i) => sec.id + '--' + (i + 1);
const sectionNumber = (ch, i) => ch.num + '.' + (i + 1);
const chapterText = (ch) => ch.sections.map((s) => s.title + ' ' + s.topics.map(topicText).join(' ') + ' ' + (s.takeaways || []).map(stripTags).join(' ')).join(' ');

function termsInChapter(ch) {
  const text = chapterText(ch).toLowerCase();
  return glossary.terms.filter((t) => {
    const w = t.term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|[^a-z])' + w + 's?([^a-z]|$)').test(text);
  });
}

/* The reader numbers tables after render; here it is done in the markup.
   Every table in the data sits in a .table-wrap (check-site section 16), so
   the caption goes in front of the wrapper, as numberTables() puts it. */
function captionTables(html, chNum, heading, counter) {
  return html.replace(/<div class="table-wrap"/g, (m) => {
    counter.k += 1;
    return `<p class="tb-caption"><b>Table ${chNum}.${counter.k}</b>${esc(heading)}</p>${m}`;
  });
}

/* The prose is written for nremt/study-notes.html, so a relative link in it
   ("reference-cards.html") is relative to nremt/. These pages sit one level
   down. */
const rebase = (html) => String(html).replace(/(\s(?:href|src)=")(?![a-z]+:|#|\/)/g, '$1../');

function sectionHtml(sec, si, ch, counter) {
  const topicsHtml = sec.topics.map((t, ti) => {
    let body = t.paragraphs ? t.paragraphs.map((p) => `<p>${p}</p>`).join('') : (t.html || '');
    body = rebase(captionTables(body, ch.num, t.heading, counter));
    return `<div class="topic" id="${topicId(sec, ti)}" data-heading="${esc(t.heading)}">
      <h3>${t.heading}</h3>
      ${t.sub ? `<p class="sub">${t.sub}</p>\n      ` : ''}${body}
    </div>`;
  }).join('\n');
  const takeaways = (sec.takeaways && sec.takeaways.length) ? `
    <div class="takeaways">
      <div class="tk-title">Key points · ${sectionNumber(ch, si)}</div>
      <ul>${sec.takeaways.map((k) => `<li>${rebase(k)}</li>`).join('')}</ul>
    </div>` : '';
  const L = LESSON_BY_SECTION.get(sec.id);
  // The Read | Interactive switch (assets/course/read-toggle.js) reads the section's lesson from data-lesson.
  const lessonAttrs = L ? ` data-lesson="../lessons/${L.id}.html"${premiumData().COURSES.nremt.freeChapters.includes(`ch${L.chapter}`) ? '' : ' data-lesson-premium="1"'}` : ' data-lesson=""';
  return `<section class="section bk-sec" id="${sec.id}"${lessonAttrs} data-num="${sectionNumber(ch, si)}" data-title="${esc(sec.title)}">
    <div class="bk-sec-head">
      <h2><span class="bk-toc-n">${sectionNumber(ch, si)}</span>${sec.title}</h2>
      ${sec.domain ? `<span class="domain-tag">${sec.domain} domain</span>` : ''}
    </div>
    ${sec.note ? `<p class="section-note">${rebase(sec.note)}</p>\n    ` : ''}<div class="bk-prose" data-glossary-topic="">${topicsHtml}</div>${takeaways}
  </section>`;
}

function toolsHtml(ch) {
  const hit = CHAPTER_TOOLS.find((t) => t.match.test(ch.title));
  if (!hit) return '';
  return `
    <section class="book-tools" aria-label="Practice this">
      <div class="chapter-tools">
        <span class="chapter-tools__k">Practice this</span>
        ${hit.tools.map((t) => `<a href="../${t.href}">${t.label} <small>${t.why}</small></a>`).join('')}
      </div>
    </section>`;
}

/* ---- title and description ------------------------------------------------ */

/* "<Chapter>: NREMT-EMT Study Notes | LevlPrep", at most 60 characters, which
   is where check-site section 33 cuts. Labels shorten before the chapter
   does; a chapter title too long for even the shortest label loses its last
   clause, then is written with "&". SHORT names a chapter the way a reader
   would where cutting clauses would read badly. */
const TITLE_MAX = 60;
const LABELS = ['NREMT-EMT Study Notes', 'NREMT-EMT Notes', 'EMT Study Notes', 'EMT Notes'];
const SHORT = {
  'Emergencies for Patients with Special Challenges': 'Patients with Special Challenges',
  'Hazardous Materials, MCIs, and Incident Management': 'Hazardous Materials and MCIs',
};

/* Shortenings of a chapter title, most complete first: the whole title, then
   with its last clause dropped, and so on. Each level is offered as written
   and with "and" as "&". */
function topicLevels(title) {
  const levels = [];
  const add = (t) => {
    t = t.replace(/[\s,]+$/, '');
    if (t && !levels.some((l) => l[0] === t)) levels.push([...new Set([t, t.replace(/,? and /g, ' & ')])]);
  };
  add(title);
  if (SHORT[title]) add(SHORT[title]);
  let t = title;
  for (;;) {
    const cut = Math.max(t.lastIndexOf(' and '), t.lastIndexOf(', '));
    if (cut <= 0) break;
    t = t.slice(0, cut);
    add(t);
  }
  return levels;
}

/* The most complete title first; within one level, the label that keeps
   "NREMT" before the spelling that keeps "and". */
function titleFor(ch) {
  for (const spellings of topicLevels(ch.title)) {
    for (const label of LABELS) {
      for (const topic of spellings) {
        const t = `${topic}: ${label} | LevlPrep`;
        if (t.length <= TITLE_MAX) return t;
      }
    }
  }
  fail(`chapter ${ch.num} "${ch.title}" has no title that fits ${TITLE_MAX} characters; add it to SHORT.`);
}

/* As many whole sentences of the chapter's own intro as fit in 160
   characters; if not even one fits, the first paragraph of its first topics.
   Never cut mid-sentence. */
function sentencesUpTo(text, max) {
  let out = '';
  for (const s of text.split(/(?<=[.!?])\s+(?=[A-Z0-9(])/)) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > max) break;
    out = next;
  }
  return out;
}
const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
  .replace(/&rarr;/g, '→').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&');

function describe(ch) {
  const candidates = [ch.intro || ''];
  for (const sec of ch.sections) for (const t of sec.topics) {
    const p = (t.html || '').match(/<p[^>]*>([\s\S]*?)<\/p>/);
    if (p) candidates.push(p[1]);
  }
  for (const c of candidates) {
    const text = decode(stripTags(c));
    const d = sentencesUpTo(text, 160);
    if (d.length >= 70 && /[.!?]$/.test(d)) return d;
  }
  fail(`chapter ${ch.num} "${ch.title}": no opening sentence fits a 160-character description.`);
}

/* ---- the page ------------------------------------------------------------- */

const SLUGS = chapters.map(chapterSlug);
if (new Set(SLUGS).size !== SLUGS.length) fail('two chapters share a slug; rename one.');

function page(ch, i) {
  const slug = SLUGS[i];
  const url = `${ORIGIN}/nremt/notes/${slug}.html`;
  const title = titleFor(ch);
  const desc = describe(ch);
  const prev = chapters[i - 1], next = chapters[i + 1];
  const total = chapters.length;
  const domains = [...new Set(ch.sections.map((s) => s.domain).filter(Boolean))];
  const topics = ch.sections.reduce((n, s) => n + s.topics.length, 0);
  const minutes = Math.max(1, Math.round(chapterText(ch).split(/\s+/).length / 200));
  const meta = [
    `${ch.sections.length} section${ch.sections.length === 1 ? '' : 's'}`,
    `${topics} topic${topics === 1 ? '' : 's'}`,
    `about ${minutes} min`,
    'free',
  ].join(' · ');
  const readerHref = `../study-notes.html#chapter-${ch.num}`;
  const rule = CHAPTER_QUESTIONS[ch.num];
  const practiceHref = rule && rule.domain ? `../practice.html?domain=${encodeURIComponent(rule.domain)}` : '../practice.html';

  const counter = { k: 0 };
  const sections = ch.sections.map((s, si) => sectionHtml(s, si, ch, counter)).join('\n');

  const terms = termsInChapter(ch);
  const termsHtml = terms.length ? `
    <section class="book-terms" aria-labelledby="bookTermsH">
      <h2 class="book-end__title" id="bookTermsH">Key terms <small>in this chapter</small></h2>
      <dl>${terms.map((t) => `<div><dt><a href="../glossary.html#t-${esc(t.id)}">${esc(t.term)}</a></dt><dd>${esc(t.def)}</dd></div>`).join('')}</dl>
      <p class="book-terms__all"><a href="../glossary.html">The full glossary &rarr;</a></p>
    </section>` : '';
  const reviewHtml = rule ? `
    <section class="book-review" aria-labelledby="bookReviewH">
      <h2 class="book-end__title" id="bookReviewH">Check your understanding</h2>
      <p class="book-end__lede">The question bank covers the ground this chapter does. Answer questions with explanations in practice, or open this chapter in the reader for five drawn from the bank.</p>
      <p class="book-review__foot"><a href="${practiceHref}">Practice ${rule.domain ? 'this domain' : 'the bank'} &rarr;</a> <a href="${readerHref}">Open in the reader &rarr;</a></p>
    </section>` : '';

  const rail = `<aside class="tb-rail bk-rail" id="nr-rail">
    <p class="tb-rail-title">Contents</p>
    ${prev ? `<a class="bk-toc-other" href="${SLUGS[i - 1]}.html"><span class="bk-toc-n">${prev.num}</span>${esc(prev.title)}</a>` : ''}
    <a class="bk-toc-chap" href="#main"><span class="bk-toc-chap-n">${ch.num}</span><span><b>${esc(ch.title)}</b><small>${ch.sections.length} section${ch.sections.length === 1 ? '' : 's'}</small></span></a>
    <nav class="tb-contents" aria-label="Chapter contents"><ol class="bk-toc-list">${ch.sections.map((s, si) => `<li><a href="#${s.id}"><span class="bk-toc-n">${sectionNumber(ch, si)}</span>${s.title}</a></li>`).join('')}</ol></nav>
    ${next ? `<a class="bk-toc-other" href="${SLUGS[i + 1]}.html"><span class="bk-toc-n">${next.num}</span>${esc(next.title)}</a>` : ''}
    <p class="tb-filter-hint" style="margin-top:14px"><a href="../study-notes.html">All ${total} chapters, with search</a></p>
  </aside>`;

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LearningResource',
        '@id': `${url}#notes`,
        name: `${ch.title}: NREMT-EMT study notes`,
        url,
        description: desc,
        learningResourceType: 'Reading',
        educationalLevel: 'Professional certification',
        inLanguage: 'en',
        isAccessibleForFree: true,
        isPartOf: { '@id': `${ORIGIN}/nremt/#course` },
        provider: { '@id': `${ORIGIN}/#org` },
        position: ch.num,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'LevlPrep', item: `${ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'NREMT-EMT Prep', item: `${ORIGIN}/nremt/` },
          { '@type': 'ListItem', position: 3, name: 'NREMT-EMT study notes', item: `${ORIGIN}/nremt/study-notes.html` },
          { '@type': 'ListItem', position: 4, name: ch.title, item: url },
        ],
      },
    ],
  };
  const ldJson = JSON.stringify(ld).replace(/<\//g, '<\\/');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<script>try{var t=localStorage.getItem("nremt_theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.setAttribute("data-theme","dark");}catch(e){}</script>
<link rel="preload" href="/assets/fonts/nunito-variable-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="manifest" href="../manifest.json">
<link rel="icon" href="../assets/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../../assets/icon-180.png">
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
<meta property="og:image" content="${ORIGIN}/nremt/assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="../../assets/theme.css">
<script src="../../assets/errors.js" defer></script>
<script src="../../assets/account.js" defer></script>
<script src="../../assets/hub-progress.js" defer></script>
<script src="../../assets/chime.js" defer></script>
<script src="../../assets/site-chrome.js" defer></script>
<link rel="stylesheet" href="../../assets/fonts/fonts.css">
<link rel="stylesheet" href="../../assets/course/base.css">
<link rel="stylesheet" href="../../assets/course/book.css">
<!-- The reader's own styles, copied from nremt/study-notes.html by
     scripts/build-nremt-notes-pages.mjs so a chapter looks the same here. -->
<style>
${READER_CSS}
</style>
<!-- levlprep-structured-data -->
<script type="application/ld+json">
${ldJson}
</script>
</head>
<body>
  <header id="site-header"></header>
<div class="course-nav"></div>
  <noscript><div class="site-nav-fallback" style="max-width:1120px;margin:0 auto;padding:14px clamp(20px,4vw,56px)"><a href="../index.html">Home</a> · <a href="../study-notes.html">Learn</a> · <a href="../practice.html">Practice</a> · <a href="../review.html">Review</a> · <a href="../exams.html">Exams</a> · <a href="../glossary.html">Glossary</a> · <a href="../tools.html">Tools</a> · <a href="../dashboard.html">Dashboard</a></div></noscript>
<div class="tb-shell bk bk-book">
  <button type="button" class="tb-toc-btn" data-bk-toggle aria-controls="nr-rail" aria-expanded="false">&#9776; Contents</button>
  ${rail}
  <main class="tb-main" id="main">
    <nav class="cx-crumb" aria-label="Breadcrumb"><a href="../../index.html">LevlPrep</a> <span aria-hidden="true">&rsaquo;</span> <a href="../index.html">NREMT-EMT</a> <span aria-hidden="true">&rsaquo;</span> <a href="../study-notes.html">Study notes</a> <span aria-hidden="true">&rsaquo;</span> <span aria-current="page">${esc(ch.title)}</span></nav>
    <div class="bk-pillbar"><a class="bk-pill" href="${readerHref}"><i aria-hidden="true">&#9654;</i>Open in the interactive reader</a> <a class="bk-pill" href="${practiceHref}">Practice questions</a> <a class="bk-pill" href="../index.html">NREMT-EMT course home</a></div>
    <div data-chapter="${ch.num}">
    <header class="tb-chapter-head">
      <p class="tb-chapter-eyebrow">Chapter ${ch.num} of ${total}${domains.length ? ' · ' + esc(domains.join(', ')) + ' domain' : ''}</p>
      <h1 class="tb-chapter-title">${esc(ch.title)}</h1>
      <div class="tb-chapter-meta">
        <span>${meta}</span>
        <div class="bk-actions" role="group" aria-label="Share or print this chapter"><button type="button" class="bk-action" data-copy="${url}">Copy link</button><button type="button" class="bk-action" data-print>Print this chapter</button></div>
      </div>
      ${ch.intro ? `<p class="bk-lede">${esc(ch.intro)}</p>` : ''}
    </header>
${sections}
    <div class="book-end">${termsHtml}${reviewHtml}${toolsHtml(ch)}
    </div>
    <nav class="tb-chapter-nav" aria-label="Chapter navigation">
      ${prev ? `<a class="tb-chapter-link prev" href="${SLUGS[i - 1]}.html"><span>&larr; Chapter ${prev.num}</span><b>${esc(prev.title)}</b></a>` : '<span></span>'}
      ${next ? `<a class="tb-chapter-link next" href="${SLUGS[i + 1]}.html"><span>Chapter ${next.num} &rarr;</span><b>${esc(next.title)}</b></a>` : `<a class="tb-chapter-link next" href="../study-notes.html"><span>All chapters &rarr;</span><b>NREMT-EMT study notes</b></a>`}
    </nav>
    </div>
  </main>
</div>
<div class="xshell">
  <footer>
    ${DISCLAIMER}
    <p class="privacy-link"><a href="../../privacy.html">Privacy</a> &middot; <a href="../../terms.html">Terms</a> &middot; <a href="../../about.html">About</a> &middot; <a href="../../sources.html">Sources</a> &middot; <a href="../../changelog.html">What&rsquo;s new</a> &middot; <a href="../../premium.html">Premium</a> &middot; <a href="../../account.html">Account</a> &middot; <a href="mailto:hello@levlprep.com">Contact</a></p>
  </footer>
</div>
<script>
  // nav.js builds the course tabs relative to nremt/; this page is one level
  // down, and it belongs under Learn.
  window.NREMT_BASE = '../';
  window.NREMT_PAGE = 'study-notes.html';
</script>
<script src="../../assets/course/glossary-tip.js" data-glossary="../assets/glossary.json" data-course-root="../" defer></script>
<script src="../../assets/course/book.js" defer></script>
<script src="../assets/nav.js" defer></script>
<script src="../../assets/course/read-toggle.js" data-rt="book" data-rt-course="nremt" data-rt-root="../" defer></script>
</body>
</html>
`;
}

/* ---- write ---------------------------------------------------------------- */

if (!existsSync(OUT_DIR)) {
  if (check) fail('nremt/notes/ does not exist. Run: node scripts/build-nremt-notes-pages.mjs');
  mkdirSync(OUT_DIR, { recursive: true });
}

let written = 0;
const stale = [];
const wanted = new Set();
chapters.forEach((ch, i) => {
  const name = `${SLUGS[i]}.html`;
  wanted.add(name);
  const file = join(OUT_DIR, name);
  // The video lesson block, if docs/videos.json lists one (scripts/lib/videos.mjs).
  const html = r3Reading(applyVideo(`nremt/notes/${name}`, page(ch, i)), { key: 'nremt', rel: `nremt/notes/${name}` });
  const current = existsSync(file) ? readFileSync(file, 'utf8') : null;
  if (current === html) return;
  if (check) { stale.push(name); return; }
  writeFileSync(file, html);
  written++;
});

// A chapter renamed or removed leaves its old page behind; that page would
// still be in the sitemap and still claim to be the chapter.
const orphans = readdirSync(OUT_DIR).filter((f) => f.endsWith('.html') && !wanted.has(f));
if (orphans.length) {
  if (check) stale.push(...orphans.map((f) => `${f} (no longer a chapter)`));
  else orphans.forEach((f) => unlinkSync(join(OUT_DIR, f)));
}

if (check) {
  if (stale.length) {
    console.error(`FAIL: ${stale.length} NREMT chapter page(s) are stale: ${stale.slice(0, 8).join(', ')}${stale.length > 8 ? ', …' : ''}`);
    console.error('Run: node scripts/build-nremt-notes-pages.mjs');
    process.exit(1);
  }
  console.log(`OK, all ${chapters.length} NREMT chapter pages are up to date.`);
} else {
  console.log(`Wrote ${written} of ${chapters.length} NREMT chapter pages${orphans.length ? `, removed ${orphans.length} old one(s)` : ''}.`);
}
