/* Puts each video from docs/videos.json (and each quick answer from
   docs/quick-answers.json) on its pages, and takes it off pages
   that no longer list it.

     node scripts/build-videos.mjs           write the pages
     node scripts/build-videos.mjs --check   fail if the data is wrong or any page is stale (CI)

   Every lesson and notes page of every course is scanned, and every course
   reader (learn.html, nremt/study-notes.html) gets its chapters' cards, so removing a video
   from the data removes it from the site. The course builders and the two
   notes-page generators call the same applyVideo() (scripts/lib/videos.mjs)
   when they write a page, so their own --check agrees with this one.
   docs/video-lessons.md explains the design and how new videos arrive.

   It also writes each course's video lessons page, <course>/videos.html (course redesign r4, decision 4: the
   Learn tab's Textbook / Glossary / Videos switch), built from the course's own glossary page (its head, header,
   course tabs, footer and scripts) with the Learn band and that course's videos, newest first, in the same
   click-to-load card; a course with no video yet gets a short note and stays out of search (noindex). And it keeps
   the Learn band on the two hand-written textbooks, ochem/learn.html and nremt/study-notes.html (the builders'
   textbooks get it from scripts/lib/r3-reading.mjs). Run it after the glossary builders. */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, COURSE_DIRS, READERS, loadVideos, validate, applyVideo, DATA_FILE, videoBlock, START, END } from './lib/videos.mjs';
import { courseInfo, learnBandHtml, learnScript, bookSub } from './lib/learn-band.mjs';
import { courseTitle } from './lib/page-title.mjs';
import { loadQuickAnswers, validateQuickAnswers } from './lib/quick-answers.mjs';

const check = process.argv.includes('--check');
const videos = loadVideos();
const errs = [...validate(videos.data), ...validateQuickAnswers(loadQuickAnswers().data)];
if (errs.length) {
  for (const e of errs) console.error(`FAIL: ${e}`);
  process.exit(1);
}

const stale = [];
let pages = 0;
for (const dir of Object.values(COURSE_DIRS)) {
  for (const sub of ['notes', 'lessons']) {
    const abs = join(ROOT, dir, sub);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs)) {
      if (!f.endsWith('.html')) continue;
      const rel = `${dir}/${sub}/${f}`;
      const html = readFileSync(join(ROOT, rel), 'utf8');
      if (/http-equiv="refresh"/i.test(html)) continue;
      pages++;
      const want = applyVideo(rel, html, videos);
      if (want === html) continue;
      stale.push(rel);
      if (!check) writeFileSync(join(ROOT, rel), want);
    }
  }
}

// The course readers (learn.html, nremt/study-notes.html): each carries its chapters' cards.
for (const rel of Object.values(READERS)) {
  if (!existsSync(join(ROOT, rel))) continue;
  const html = readFileSync(join(ROOT, rel), 'utf8');
  pages++;
  const want = applyVideo(rel, html, videos);
  if (want === html) continue;
  stale.push(rel);
  if (!check) writeFileSync(join(ROOT, rel), want);
}

// The two hand-written textbooks: the Learn band (the builders' textbooks get it in scripts/lib/r3-reading.mjs).
for (const [key, rel] of [['ochem', 'ochem/learn.html'], ['nremt', 'nremt/study-notes.html']]) {
  const html = readFileSync(join(ROOT, rel), 'utf8');
  const want = handBand(html, key, rel);
  pages++;
  if (want === html) continue;
  stale.push(rel);
  if (!check) writeFileSync(join(ROOT, rel), want);
}

// Each course's video lessons page.
for (const course of Object.keys(COURSE_DIRS)) {
  const rel = `${COURSE_DIRS[course]}/videos.html`;
  const want = videosPage(course);
  const have = existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), 'utf8') : '';
  pages++;
  if (want === have) continue;
  stale.push(rel);
  if (!check) writeFileSync(join(ROOT, rel), want);
}

function handBand(html, key, rel) {
  const re = new RegExp(`<div class="r3 r3-(?:read-top r3-learn|learn-top)" data-cover="${key}">[\\s\\S]*?(?=<div class="tb-shell bk bk-book r3 r3-read)`);
  const m = html.match(re);
  if (!m) throw new Error(`${rel}: no textbook band to replace`);
  const crumb = (m[0].match(/<nav class="[^"]*crumb[^"]*" aria-label="Breadcrumb">[\s\S]*?<\/nav>/) || [''])[0];
  const band = learnBandHtml({ key, active: 'book', up: '../', crumb, sub: bookSub(key) }) + learnScript(key, '../');
  let out = html.slice(0, m.index) + band + html.slice(m.index + m[0].length);
  out = out.replace(/<div class="tb-shell bk bk-book r3 r3-read"/, '<div class="tb-shell bk bk-book r3 r3-read lap"');
  return out;
}

function videosPage(course) {
  const dir = COURSE_DIRS[course];
  const info = courseInfo(course);
  const gl = readFileSync(join(ROOT, dir, 'glossary.html'), 'utf8');
  const list = videos.data.videos.filter((v) => v.course === course).sort((a, b) => (a.posted < b.posted ? 1 : a.posted > b.posted ? -1 : 0));
  const n = list.length;
  const url = `https://levlprep.com/${dir}/videos.html`;
  const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&reg;/g, '®').replace(/\s+/g, ' ').trim();
  const name = strip(info.name);
  const title = courseTitle('Video lessons', [name]);
  const plainName = name.replace(/^AP®\s*/, ''); // the mark goes only in titles (scripts/site-rules/*-trademark.mjs)
  const desc = n
    ? `${plainName} video lessons, ${n} so far, each with its chapters and the notes page it goes with.`
    : `${plainName} video lessons from the LevlPrep YouTube channel, each with the notes page it goes with.`;
  const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  let head = gl.slice(0, gl.indexOf('</head>'));
  head = head
    .replace(/<title>[^<]*<\/title>/, `<title>${attr(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${attr(desc)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${attr(title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${attr(desc)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`)
    .replace(/<meta name="robots" content="[^"]*">\n?/, '')
    .replace(/<link rel="stylesheet" href="[^"]*glossary\.css">\n?/, '');
  if (!n) head = head.replace(/(<meta name="viewport"[^>]*>\n?)/, '$1<meta name="robots" content="noindex, follow">\n');
  const crumbs = [['LevlPrep', 'https://levlprep.com/'], [name, `https://levlprep.com/${dir}/`], ['Video lessons', url]];
  const jsonld = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': `${url}#videos`, name: `${name} video lessons`, url, description: desc },
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map(([nm, item], i) => ({ '@type': 'ListItem', position: i + 1, name: nm, item })) },
  ] }, null, 2);
  head = head.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">\n${jsonld}\n</script>`);
  if (!head.includes('/assets/video/video.css')) head += '<link rel="stylesheet" href="/assets/video/video.css">\n';

  const bodyAt = gl.indexOf('<body');
  const bandAt = gl.indexOf('<div class="r3 r3-learn-top"', bodyAt);
  if (bodyAt < 0 || bandAt < 0) throw new Error(`${dir}/glossary.html: no Learn band (run its builder first)`);
  const top = gl.slice(bodyAt, bandAt);
  const mainEnd = gl.indexOf('</main>', bandAt);
  const tail = gl.slice(mainEnd + 7, gl.lastIndexOf('</body>'))
    .split('\n').filter((l) => !/glossary-(page|tip)\.js/.test(l)).join('\n')
    .replace(/(SECTION|Section)\s*=\s*'glossary'/g, "$1 = 'learn'");
  const crumb = `<nav class="cx-crumb" aria-label="Breadcrumb"><a href="../index.html">LevlPrep</a> <span aria-hidden="true">&rsaquo;</span> <a href="index.html">${info.name.replace(/&(?!amp;)/g, '&amp;')}</a> <span aria-hidden="true">&rsaquo;</span> <span aria-current="page">Video lessons</span></nav>`;
  const sub = n ? `${n} video lesson${n === 1 ? '' : 's'} &middot; the player loads only when you press play` : 'No videos yet &middot; the textbook covers every topic';
  const band = learnBandHtml({ key: course, active: 'videos', up: '../', crumb, sub, h1: true, pageName: 'Video lessons' });
  const noteTitle = (p) => {
    const h = readFileSync(join(ROOT, p), 'utf8').match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/);
    return h ? strip(h[1]) : p;
  };
  const cards = list.map((v) => {
    const block = videoBlock(v, { kind: 'videos' })
      .replace(START + '\n', '').replace('\n' + END + '\n', '')
      .replace(/\n  <link rel="stylesheet"[^>]*>/, '').replace(/\n  <script[^>]*><\/script>/, '');
    const notes = v.pages.filter((p) => /\/notes\//.test(p));
    const links = notes.map((p) => `<a href="${p.slice(dir.length + 1)}">${noteTitle(p)}</a>`).join(' &middot; ');
    return `<article class="lvid">
${block}
${links ? `<p class="lvid-notes">Read the notes: ${links}</p>\n` : ''}</article>`;
  }).join('\n');
  const empty = `<div class="lvid-empty">
  <p class="lvid-empty-h">No video lessons for this course yet.</p>
  <p>Every topic is in the <a href="${info.kind === 'nremt' ? 'study-notes.html' : 'learn.html'}">textbook</a>, free. New videos go up on <a href="https://www.youtube.com/@LevlPrep">our YouTube channel</a>.</p>
</div>`;
  const main = `<main id="main" class="xshell r3 r3-page r3-videos" data-cover="${course}">
<div class="lvids lap">
${n ? cards : empty}
</div>
</main>`;
  const script = n ? '<script src="/assets/video/video.js" defer></script>\n' : '';
  return `${head}</head>\n${top}${band}${main}${tail}${script}</body>\n</html>\n`;
}

const shown = videos.byPage.size;
if (check && stale.length) {
  console.error(`FAIL: ${stale.length} page(s) do not match ${DATA_FILE}, e.g. ${stale.slice(0, 3).join(', ')}. Run: node scripts/build-videos.mjs`);
  process.exit(1);
}
console.log(check
  ? `OK: ${videos.data.videos.length} videos on ${shown} pages; ${pages} pages checked.`
  : `${stale.length} page(s) updated; ${videos.data.videos.length} videos on ${shown} pages.`);
