/* Adds (or updates) one posted YouTube video in docs/videos.json, makes its
   two thumbnails, and puts it on its pages. The daily long-video run calls
   this once a video is public (docs/video-lessons.md, "When a video goes
   public").

   From the media branch's long/queue.json (the usual way):
     node scripts/add-video.mjs --queue <media>/long/queue.json --item yt-orgo-02-orbitals

     <media> is the media-branch checkout. The item must have a youtube_id.
     Read from the item: youtube_id, course, title, topic_pages, date (posted),
     description_file (chapters), thumb (thumbnail), video (length, by ffprobe).
     Paths in the item are relative to <media>.

   Or by hand (every flag needed, chapters optional):
     node scripts/add-video.mjs --id 1p-L3_POFL0 --course ochem --title "..." \
       --seconds 1163 --posted 2026-10-07 --pages ochem/notes/atomic-structure.html \
       [--chapters <youtube.md>] [--thumb <png or jpg>]

   Pages: a topic's notes page brings its lesson page along when the lesson
   exists, and textbook links are turned into the topic's own pages
   (ochem/learn.html#<topic>, <course>/learn.html#<topic>, and
   nremt/study-notes.html#<section> to that section's chapter page). Without
   --thumb (or a thumb in the queue item) the thumbnail is downloaded once
   from i.ytimg.com here, at build time; a student's browser never fetches it.

   Safety: it stops (exit 1, nothing written) when a topic page cannot be
   placed (--allow-partial places the rest) or when a page already shows
   another video (--replace hands it over). Chapters already listed are kept
   when the description has none. Without the mp4 the length comes from the
   captions file.

   Afterwards: node scripts/build-videos.mjs --check passes, and the PR is the
   data file, two .webp files and the pages. */
import { readFileSync, writeFileSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { ROOT, DATA_FILE, THUMB_DIR, THUMB_WIDTHS, COURSE_DIRS, validate, chaptersFromText } from './lib/videos.mjs';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i === -1 ? null : args[i + 1]; };
const die = (msg) => { console.error(`add-video: ${msg}`); process.exit(1); };

// The media branch's course names, and the registry's own keys.
const COURSE_ALIASES = { orgo: 'ochem', ochem: 'ochem', ap: 'anp', anp: 'anp', nremt: 'nremt', apbio: 'apbio', bio: 'apbio',
  apchem: 'apchem', chem: 'apchem', apphys: 'apphys', physics: 'apphys', apcalc: 'apcalc', calc: 'apcalc',
  apstat: 'apstat', stat: 'apstat', apenv: 'apenv', env: 'apenv', appsych: 'appsych', psy: 'appsych', psych: 'appsych', psychology: 'appsych' };

function fromQueue(queuePath, itemId) {
  const q = JSON.parse(readFileSync(queuePath, 'utf8'));
  const items = Array.isArray(q) ? q : q.items || [];
  const it = items.find((x) => x.id === itemId);
  if (!it) die(`no item ${itemId} in ${queuePath}`);
  if (!it.youtube_id) die(`${itemId} has no youtube_id yet (only public videos go on the site)`);
  const media = dirname(dirname(resolve(queuePath)));
  const at = (p) => (p ? join(media, p) : null);
  let seconds = Number(opt('seconds')) || null;
  const video = at(it.video);
  if (!seconds && video && existsSync(video)) {
    try { seconds = Math.round(Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video]).toString())); } catch { /* below */ }
  }
  // No mp4 at hand: the captions run to the last spoken word, a few seconds
  // before the end card finishes; round up so every chapter fits.
  const srt = at(it.captions || it.id.replace(/^(yt-[a-z]+-\d+).*/, 'long/$1-captions.srt'));
  if (!seconds && srt && existsSync(srt)) {
    const ends = [...readFileSync(srt, 'utf8').matchAll(/--> (\d+):(\d+):(\d+)[,.]\d+/g)];
    if (ends.length) {
      const [, h, m, sec] = ends[ends.length - 1];
      seconds = Number(h) * 3600 + Number(m) * 60 + Number(sec) + 5;
      console.warn(`add-video: length ${seconds}s from the captions (the mp4 was not checked out)`);
    }
  }
  if (!seconds) die(`could not read the length of ${it.video} (sparse-checkout it or its captions, or pass --seconds)`);
  return {
    id: it.youtube_id, course: it.course, title: it.title, seconds,
    posted: it.posted_on || it.date, pages: it.topic_pages || [],
    chaptersFile: at(it.description_file || it.id.replace(/^(yt-[a-z]+-\d+).*/, 'long/$1-youtube.md')),
    thumb: at(it.thumb),
  };
}

function fromFlags() {
  const pages = (opt('pages') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const v = { id: opt('id'), course: opt('course'), title: opt('title'), seconds: Number(opt('seconds')), posted: opt('posted'),
    pages, chaptersFile: opt('chapters'), thumb: opt('thumb') };
  for (const k of ['id', 'course', 'title', 'posted']) if (!v[k]) die(`--${k} is required`);
  if (!v.seconds) die('--seconds is required');
  return v;
}

const unplaced = [];
/* A topic page as the site has it: notes and lesson pages of the course. */
function resolvePages(course, list) {
  const dir = COURSE_DIRS[course];
  const out = [];
  unplaced.length = 0;
  const add = (p) => { if (existsSync(join(ROOT, p)) && !out.includes(p)) out.push(p); };
  for (const raw of list) {
    const [pathQ, hash] = raw.replace(/^https?:\/\/[^/]+\//, '').replace(/^\/+/, '').split('#');
    const path = pathQ.split('?')[0];
    let topic = null;
    if (new RegExp(`^${dir}/(notes|lessons)/([a-z0-9-]+)\\.html$`).test(path)) topic = path.match(/\/([a-z0-9-]+)\.html$/)[1];
    else if (path === `${dir}/learn.html` && hash) topic = hash;
    if (topic) {
      add(`${dir}/notes/${topic}.html`);
      add(`${dir}/lessons/${topic}.html`);
      continue;
    }
    if (course === 'nremt' && hash) {
      // nremt/study-notes.html#ch1-history: the chapter page holding that section.
      const notesDir = join(ROOT, 'nremt', 'notes');
      const hit = readdirSync(notesDir).find((f) => readFileSync(join(notesDir, f), 'utf8').includes(` id="${hash}"`));
      if (hit) { add(`nremt/notes/${hit}`); continue; }
    }
    unplaced.push(raw);
  }
  return out;
}

async function thumbnails(id, source) {
  const dest = join(ROOT, THUMB_DIR);
  let src = source && existsSync(source) ? source : null;
  if (!src) {
    const tmp = mkdtempSync(join(tmpdir(), 'lpv-'));
    for (const name of ['maxresdefault.jpg', 'sddefault.jpg', 'hqdefault.jpg']) {
      const r = await fetch(`https://i.ytimg.com/vi/${id}/${name}`);
      if (!r.ok) continue;
      src = join(tmp, name);
      writeFileSync(src, Buffer.from(await r.arrayBuffer()));
      break;
    }
    if (!src) die(`no thumbnail: pass --thumb, or the video ${id} is not public yet`);
  }
  for (const w of THUMB_WIDTHS) {
    const out = join(dest, `${id}-${w}.webp`);
    // ffmpeg is always present where the pipeline runs; ImageMagick as a fallback.
    try {
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vf', `scale=${w}:-2:flags=lanczos`, '-quality', '82', '-compression_level', '6', out]);
    } catch {
      execFileSync('convert', [src, '-resize', `${w}x`, '-strip', '-quality', '82', '-define', 'webp:method=6', out]);
    }
  }
}

const src = opt('queue') ? fromQueue(opt('queue'), opt('item') || die('--item is required with --queue')) : fromFlags();
const course = COURSE_ALIASES[src.course] || (COURSE_DIRS[src.course] ? src.course : null);
if (!course) die(`unknown course "${src.course}"`);
const pages = resolvePages(course, src.pages);
if (unplaced.length && !args.includes('--allow-partial')) die(`cannot place ${unplaced.join(', ')} (not a notes, lesson or textbook link of the course). Fix topic_pages, or pass --allow-partial to place the rest.`);
if (!pages.length) die('none of the topic pages exists on the site');

const file = join(ROOT, DATA_FILE);
const data = JSON.parse(readFileSync(file, 'utf8'));
const old = data.videos.find((v) => v.id === src.id);

let chapters = [];
if (src.chaptersFile && existsSync(src.chaptersFile)) chapters = chaptersFromText(readFileSync(src.chaptersFile, 'utf8')).filter(([t]) => t < src.seconds);
if (!chapters.length) {
  console.warn(`add-video: no chapters found${src.chaptersFile ? ` in ${src.chaptersFile}` : ''} (lines starting 0:00)${old && old.chapters && old.chapters.length ? '; keeping the ones already listed' : ''}`);
  if (old && old.chapters) chapters = old.chapters.filter(([t]) => t < src.seconds);
}

// A page shows one video. Another video already on one of these pages is
// replaced only when asked, so a wrong topic_pages can never swap one silently.
const taken = data.videos.filter((v) => v.id !== src.id && v.pages.some((p) => pages.includes(p)));
if (taken.length && !args.includes('--replace')) {
  die(`these pages already show another video: ${taken.map((v) => `${v.id} "${v.title}" on ${v.pages.filter((p) => pages.includes(p)).join(', ')}`).join('; ')}. Pass --replace if the new video should take them over.`);
}
for (const v of taken) {
  console.warn(`add-video: ${v.id} loses ${v.pages.filter((p) => pages.includes(p)).join(', ')}`);
  v.pages = v.pages.filter((p) => !pages.includes(p));
}
data.videos = data.videos.filter((v) => v.pages.length);
const entry = { id: src.id, course, title: src.title, seconds: src.seconds, posted: src.posted, pages, chapters };
const i = data.videos.findIndex((v) => v.id === src.id);
if (i === -1) data.videos.push(entry);
else data.videos[i] = { ...data.videos[i], ...entry };
data.videos.sort((a, b) => a.posted.localeCompare(b.posted));
// Everything but the thumbnails first; they are written only once the rest is sound.
const errs = validate(data).filter((e) => !(e.includes(src.id) && e.includes('missing assets/video/thumbs/')));
if (errs.length) die(errs.join('\n'));
try { await thumbnails(src.id, src.thumb); }
catch (e) { die(`could not make the thumbnails: ${e.message.split('\n')[0]} (needs ffmpeg with libwebp, or ImageMagick)`); }
const after = validate(data);
if (after.length) die(after.join('\n'));
writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
execFileSync('node', [join(ROOT, 'scripts', 'build-videos.mjs')], { stdio: 'inherit' });
// The course home's "Watch the lessons" strip (scripts/lib/r3-home.mjs) comes from the home's builder.
const HOME_BUILDER = { nremt: 'build-course-homes.mjs', ochem: 'build-course-homes.mjs', anp: 'build-anp.mjs' };
execFileSync('node', [join(ROOT, 'scripts', HOME_BUILDER[course] || `build-${course}.mjs`)], { stdio: 'inherit' });
console.log(`add-video: ${src.id} "${src.title}" on ${pages.join(', ')} (${chapters.length} chapters).`);
