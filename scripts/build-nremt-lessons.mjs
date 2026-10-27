/* The NREMT interactive lessons (docs/nremt-lessons-spec.md).

   Reads nremt/data/lessons/<id>.json, one lesson per textbook section, and
   writes nremt/lessons/<id>.html: a stepped lesson in the shape the A&P and
   ochem lessons use (why it matters, what you find and what you do, key ideas,
   a common mistake, check yourself, summary, what comes next), in the NREMT
   notes pages' shell. It also writes the section-to-lesson index the reader
   (nremt/study-notes.html, between the nremt-lessons markers) and the chapter
   pages (scripts/build-nremt-notes-pages.mjs) use to link each section to its
   lesson.

   Each lesson's right answers are spread across A to D with a seed taken from
   the lesson, so their position carries no pattern and a rebuild never moves them.

     node scripts/build-nremt-lessons.mjs           write
     node scripts/build-nremt-lessons.mjs --check   exit 1 if anything is stale (CI) */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSP } from './lib/site-config.mjs';
import { loadChapters, chapterSlug } from './lib/nremt-notes.mjs';
import { loadLessons } from './lib/nremt-lessons.mjs';
import { courseTitle } from './lib/page-title.mjs';
import { applyVideo } from './lib/videos.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHECK = process.argv.includes('--check');
const ORIGIN = 'https://levlprep.com';
const OUT = join(ROOT, 'nremt', 'lessons');
const READER = join(ROOT, 'nremt', 'study-notes.html');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const text = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const chapters = loadChapters(ROOT);
const byNum = new Map(chapters.map((c) => [c.num, c]));
const lessons = loadLessons(ROOT, chapters);

const stale = [];
function put(rel, html) {
  const file = join(ROOT, rel);
  const before = existsSync(file) ? readFileSync(file, 'utf8') : null;
  if (before === html) return;
  stale.push(rel);
  if (!CHECK) { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, html); }
}

/* A seeded shuffle (mulberry32 on a string hash), so the order is fixed per question. */
function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
/* Each lesson spreads its right answers across A to D: the slots are dealt in turn (A, B, C, D, A...) and then
   put in an order seeded by the lesson, so no slot is favoured and a rebuild never moves an answer. The wrong
   options fill the other slots in an order seeded by the question. */
function slotsFor(L) {
  const slots = L.check.map((_, i) => i % 4);
  const rnd = seeded(`slots:${L.id}`);
  for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  return slots;
}
function shuffled(q, slot) {
  const rnd = seeded(q.q);
  const wrong = q.options.map((_, i) => i).filter((i) => i !== q.correct);
  for (let i = wrong.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [wrong[i], wrong[j]] = [wrong[j], wrong[i]]; }
  const idx = [...wrong.slice(0, slot), q.correct, ...wrong.slice(slot)];
  return { options: idx.map((i) => q.options[i]), correct: slot };
}

function questionHtml(L, q, n, slot) {
  const s = shuffled(q, slot);
  const qid = `${L.id}-${n}`;
  return `<div class="nl-q" data-qid="${qid}" data-correct="${s.correct}">
      <p class="nl-q-stem"><span class="nl-q-n">${n}</span>${esc(q.q)}</p>
      <div class="nl-q-opts" role="group" aria-label="Answer options for question ${n}">${s.options.map((o, i) => `<button type="button" class="nl-opt" data-i="${i}"><span class="nl-opt-l" aria-hidden="true">${'ABCD'[i]}</span>${esc(o)}</button>`).join('')}</div>
      <p class="nl-q-why" role="status" aria-live="polite" hidden>${esc(q.why)}</p>
    </div>`;
}

function lessonPage(L, i) {
  const ch = byNum.get(L.chapter);
  const sec = ch.sections.find((s) => s.id === L.section);
  const si = ch.sections.indexOf(sec);
  const notesHref = `../notes/${chapterSlug(ch)}.html#${L.section}`;
  const url = `${ORIGIN}/nremt/lessons/${L.id}.html`;
  // "{Topic} — {Course} | LevlPrep" (scripts/lib/page-title.mjs), at most 60 characters.
  const title = courseTitle(L.title, ['NREMT-EMT Lesson', 'NREMT Lesson', 'EMT Lesson']);
  // The summary's first sentence when it fits a search result; otherwise a plain description of the lesson.
  const first = (text(L.summary).match(/^.*?[.!?](?=\s|$)/) || [''])[0];
  const desc = first && first.length <= 158 ? first : `${L.title}: an NREMT-EMT interactive lesson, step by step, with a common mistake and practice questions.`;
  const next = lessons[i + 1];
  const parts = [
    { id: 'why', nav: 'Why this matters', h: 'Why this matters', html: L.hook },
    { id: 'how', nav: 'What you find, what you do', h: 'What you find, and what you do', html: `<ol class="nl-chain">${L.steps.map((s) => `<li><span class="nl-find"><b>You find</b>${esc(s.find)}</span><span class="nl-act"><b>You do</b>${esc(s.act)}</span></li>`).join('')}</ol>` },
    { id: 'ideas', nav: 'Key ideas', h: 'Key ideas', html: `<ul class="nl-ideas">${L.ideas.map((x) => `<li>${x}</li>`).join('')}</ul>` },
    { id: 'mistake', nav: 'A common mistake', h: 'A common mistake', html: `<p class="nl-wrong"><b>The wrong idea:</b> ${esc(L.misconception.wrong)}</p><p class="nl-right"><b>What is actually true:</b> ${esc(L.misconception.right)}</p>` },
    { id: 'check', nav: 'Check yourself', h: 'Check yourself', html: `<div class="nl-qs">${(() => { const slots = slotsFor(L); return L.check.map((q, n) => questionHtml(L, q, n + 1, slots[n])).join('\n    '); })()}</div><noscript><p>The questions need JavaScript. Everything this lesson teaches is in the <a href="${notesHref}">chapter notes</a>.</p></noscript>` },
    { id: 'summary', nav: 'Summary', h: 'Summary', html: L.summary },
    { id: 'next', nav: 'What comes next', h: 'What comes next', html: next ? `<p><a class="nl-next" href="${next.id}.html">${esc(next.title)} &rarr;</a></p>` : `<p>That is the last lesson built so far. <a href="../study-notes.html">Back to the textbook</a>.</p>` },
  ];
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#lesson`, name: L.title, url, description: desc, learningResourceType: 'Lesson', educationalLevel: 'Professional certification', inLanguage: 'en', isAccessibleForFree: true, isPartOf: { '@id': `${ORIGIN}/nremt/#course` }, provider: { '@id': `${ORIGIN}/#org` } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'LevlPrep', item: `${ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'NREMT-EMT Prep', item: `${ORIGIN}/nremt/` },
        { '@type': 'ListItem', position: 3, name: ch.title, item: `${ORIGIN}/nremt/notes/${chapterSlug(ch)}.html` },
        { '@type': 'ListItem', position: 4, name: L.title, item: url },
      ] },
    ],
  };
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
<link rel="stylesheet" href="../assets/nremt-lesson.css">
<!-- levlprep-structured-data -->
<script type="application/ld+json">
${JSON.stringify(ld).replace(/<\//g, '<\\/')}
</script>
</head>
<body>
  <header id="site-header"></header>
<div class="course-nav"></div>
<div class="nl r3" data-cover="nremt" data-lesson="${L.id}">
  <aside class="nl-rail" aria-label="Lesson parts">
    <p class="nl-k">Chapter ${ch.num} &middot; ${esc(ch.title)}</p>
    <p class="nl-links"><a href="${notesHref}">Read this section in the textbook</a></p>
    <div class="nl-prog" hidden><div class="nl-track"><div class="nl-fill"></div></div><span class="nl-count">Step 1 / ${parts.length}</span></div>
    <ol class="nl-steps">${parts.map((p, k) => `<li><a href="#${p.id}"><span class="n">${k + 1}</span><span class="t">${p.nav}</span></a></li>`).join('')}</ol>
  </aside>
  <main id="main" class="nl-main">
    <nav class="cx-crumb" aria-label="Breadcrumb"><a href="../../index.html">LevlPrep</a> <span aria-hidden="true">&rsaquo;</span> <a href="../index.html">NREMT-EMT</a> <span aria-hidden="true">&rsaquo;</span> <a href="../notes/${chapterSlug(ch)}.html">${esc(ch.title)}</a> <span aria-hidden="true">&rsaquo;</span> <span aria-current="page">Lesson</span></nav>
    <header class="nremt-ls-hero">
      <p class="nl-eyebrow">Interactive lesson &middot; Chapter ${ch.num}.${si + 1}</p>
      <h1>${esc(L.title)}</h1>
    </header>
    <div class="nl-card">
${parts.map((p, k) => `      <section class="nl-part${k === 0 ? ' is-on' : ''}" id="${p.id}" aria-labelledby="h-${p.id}">
        <p class="nl-part-k">Part ${k + 1} of ${parts.length}</p>
        <h2 id="h-${p.id}" tabindex="-1">${p.h}</h2>
        <div class="nl-body">${p.html}</div>
      </section>`).join('\n')}
      <div class="nl-actions" hidden><button type="button" class="nl-back">&larr; Previous</button><span class="nl-hint" aria-live="polite"></span><button type="button" class="nl-go">Continue &rarr;</button></div>
    </div>
    <p class="nl-disclaimer">For exam study only. Follow your local protocols and medical direction.</p>
  </main>
</div>
<div class="xshell">
  <footer>
    <p class="privacy-link"><a href="../../privacy.html">Privacy</a> &middot; <a href="../../terms.html">Terms</a> &middot; <a href="../../about.html">About</a> &middot; <a href="../../sources.html">Sources</a> &middot; <a href="../../changelog.html">What&rsquo;s new</a> &middot; <a href="../../premium.html">Premium</a> &middot; <a href="../../account.html">Account</a> &middot; <a href="mailto:hello@levlprep.com">Contact</a></p>
  </footer>
</div>
<script>
  window.NREMT_BASE = '../';
  window.NREMT_PAGE = 'study-notes.html';
</script>
<script src="../assets/nav.js" defer></script>
<script src="../assets/nremt-lesson.js" defer></script>
</body>
</html>
`;
}

// A video lesson for the page, if docs/videos.json lists one (scripts/lib/videos.mjs).
lessons.forEach((L, i) => { const rel = `nremt/lessons/${L.id}.html`; put(rel, applyVideo(rel, lessonPage(L, i))); });

// Pages for lessons that no longer exist would stay in the sitemap.
if (existsSync(OUT)) {
  const want = new Set(lessons.map((L) => `${L.id}.html`));
  for (const f of readdirSync(OUT).filter((f) => f.endsWith('.html') && !want.has(f))) {
    stale.push(`nremt/lessons/${f} (no lesson)`);
    if (!CHECK) unlinkSync(join(OUT, f));
  }
}

/* The reader links each section that has a lesson (study-notes.html, sectionHtml). */
{
  const reader = readFileSync(READER, 'utf8');
  const map = Object.fromEntries(lessons.map((L) => [L.section, { href: `lessons/${L.id}.html`, title: L.title }]));
  const block = `<!-- nremt-lessons:start (scripts/build-nremt-lessons.mjs) -->\n<script>window.NREMT_LESSONS = ${JSON.stringify(map)};</script>\n<!-- nremt-lessons:end -->`;
  const re = /<!-- nremt-lessons:start[\s\S]*?<!-- nremt-lessons:end -->/;
  if (!re.test(reader)) { console.error('FAIL: nremt/study-notes.html has no nremt-lessons markers.'); process.exit(1); }
  const after = reader.replace(re, block);
  if (after !== reader) { stale.push('nremt/study-notes.html'); if (!CHECK) writeFileSync(READER, after); }
}

if (CHECK) {
  if (stale.length) { console.error(`build-nremt-lessons: stale (run node scripts/build-nremt-lessons.mjs):\n  ${stale.join('\n  ')}`); process.exit(1); }
  console.log(`build-nremt-lessons: ${lessons.length} lessons up to date`);
} else {
  console.log(stale.length ? `build-nremt-lessons: wrote ${stale.join(', ')}` : 'build-nremt-lessons: nothing to change');
}
