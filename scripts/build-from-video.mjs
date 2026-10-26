/* Writes the "From our videos" list (docs/from-video.json) into the homepage.

     node scripts/build-from-video.mjs           write index.html
     node scripts/build-from-video.mjs --check   fail if the data is wrong or the page is stale (CI)

   The homepage draws the card before first paint, only for visitors who
   arrive from TikTok or Instagram, from the list between the from-video
   markers in index.html. docs/from-video.md explains it. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DATA = 'docs/from-video.json';
const PAGE = 'index.html';
const BEGIN = '        // from-video:begin (generated from docs/from-video.json by scripts/build-from-video.mjs; edit there)\n';
const END = '        // from-video:end\n';
const COURSES = ['nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv'];

export function validate(data, root = ROOT) {
  const errs = [];
  if (!data || !Array.isArray(data.videos)) return [`${DATA}: needs a "videos" list`];
  let last = '';
  for (const v of data.videos) {
    const w = `${DATA} ${v && v.date} ${v && v.topic}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date || '')) errs.push(`${w}: date must be YYYY-MM-DD`);
    else if (v.date < last) errs.push(`${w}: keep the list in date order`);
    last = v.date || last;
    if (!COURSES.includes(v.course)) errs.push(`${w}: unknown course "${v.course}"`);
    for (const k of ['topic', 'hook']) {
      if (typeof v[k] !== 'string' || !v[k].trim() || v[k].length > 90) errs.push(`${w}: ${k} must be 1 to 90 characters`);
      else if (/[<>—–]|\s-\s/.test(v[k])) errs.push(`${w}: ${k} must be plain text with no dashes as punctuation`);
    }
    if (!/^[a-z0-9/-]+\.html$/.test(v.page || '') || !existsSync(join(root, v.page))) errs.push(`${w}: page ${v.page} does not exist`);
  }
  return errs;
}

export function render(data) {
  const rows = data.videos.map((v) => '          ' + JSON.stringify({ d: v.date, c: v.course, t: v.topic, h: v.hook, p: '/' + v.page }) + ',\n');
  return BEGIN + '        var V = [\n' + rows.join('') + '        ];\n' + END;
}

const BLOCK_RE = /        \/\/ from-video:begin[^\n]*\n[\s\S]*?        \/\/ from-video:end\n/;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const check = process.argv.includes('--check');
  const data = JSON.parse(readFileSync(join(ROOT, DATA), 'utf8'));
  const errs = validate(data);
  if (errs.length) { for (const e of errs) console.error(`FAIL: ${e}`); process.exit(1); }
  const html = readFileSync(join(ROOT, PAGE), 'utf8');
  if (!BLOCK_RE.test(html)) { console.error(`FAIL: ${PAGE} has no from-video markers`); process.exit(1); }
  const want = html.replace(BLOCK_RE, render(data));
  if (want !== html) {
    if (check) { console.error(`FAIL: ${PAGE} does not match ${DATA}. Run: node scripts/build-from-video.mjs`); process.exit(1); }
    writeFileSync(join(ROOT, PAGE), want);
    console.log(`${PAGE} updated: ${data.videos.length} video topics.`);
  } else console.log(`OK: ${data.videos.length} video topics in ${PAGE}.`);
}
