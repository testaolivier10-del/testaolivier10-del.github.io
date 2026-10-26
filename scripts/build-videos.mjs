/* Puts each video from docs/videos.json (and each quick answer from
   docs/quick-answers.json) on its pages, and takes it off pages
   that no longer list it.

     node scripts/build-videos.mjs           write the pages
     node scripts/build-videos.mjs --check   fail if the data is wrong or any page is stale (CI)

   Every lesson and notes page of every course is scanned, so removing a video
   from the data removes it from the site. The course builders and the two
   notes-page generators call the same applyVideo() (scripts/lib/videos.mjs)
   when they write a page, so their own --check agrees with this one.
   docs/video-lessons.md explains the design and how new videos arrive. */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, COURSE_DIRS, loadVideos, validate, applyVideo, DATA_FILE } from './lib/videos.mjs';
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

const shown = videos.byPage.size;
if (check && stale.length) {
  console.error(`FAIL: ${stale.length} page(s) do not match ${DATA_FILE}, e.g. ${stale.slice(0, 3).join(', ')}. Run: node scripts/build-videos.mjs`);
  process.exit(1);
}
console.log(check
  ? `OK: ${videos.data.videos.length} videos on ${shown} pages; ${pages} pages checked.`
  : `${stale.length} page(s) updated; ${videos.data.videos.length} videos on ${shown} pages.`);
