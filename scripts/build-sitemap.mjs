/* Generates sitemap.xml from the pages actually on disk.

   It used to be hand-maintained, which meant two failure modes that both fail
   quietly. Every <lastmod> said the same date — the day someone last did a
   find-and-replace across the file — so the dates were decoration rather than
   information. And a page added without a matching hand-edit here simply
   never got submitted; nothing would have said so.

   Each page's own canonical tag is the URL — the same string the page already
   advertises to a crawler — and git is the authority on when the file last
   changed, so neither fact is retyped here.

     node scripts/build-sitemap.mjs            rewrite
     node scripts/build-sitemap.mjs --check    fail if stale (CI)
*/
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, posix } from 'node:path';
import { isNoindex } from './lib/app-pages.mjs';

const OUT = 'sitemap.xml';
const check = process.argv.includes('--check');

// Same exclusions as the Open Graph tags, for the same reasons: 404.html and
// offline.html each stand in for an unbounded set of URLs, googleb*.html is an
// ownership token. The thirteen redirect stubs drop out on the meta-refresh
// test below — their canonical points at the real page, which is listed on
// its own.
//
// ochem/notes/** used to be skipped here as bare fragments. They are full
// pages now (scripts/build-notes-pages.mjs) and robots.txt no longer
// disallows them, so they are listed like anything else — they are the only
// form in which the ochem prose is readable without JavaScript.
// 'scripts' holds build tooling and files meant to be pasted into a
// dashboard (SQL, auth email templates) — none of it is a published page, so
// none of it needs an OG tag or a sitemap entry. check-site.mjs has always
// skipped it; these two now agree.
const SKIP_DIRS = new Set(['.git', 'node_modules', 'scripts']);
const SKIP_FILES = /^(404\.html|offline\.html|googleb[0-9a-f]+\.html)$/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name.startsWith('.')) continue; // .git, .claude (agent worktrees)
    const full = join(dir, name);
    // anatomy-physiology/data holds the A&P sources (notes are HTML
    // fragments); build-anp.mjs turns them into the pages listed here.
    if (statSync(full).isDirectory()) { if (!full.endsWith(join('anatomy-physiology', 'data'))) walk(full, out); }
    else if (name.endsWith('.html') && !SKIP_FILES.test(name)) out.push(full);
  }
  return out;
}

/* Priorities say which pages matter most to a searcher (site audit 2026-10:
   529 of 671 entries shared 0.8, which says nothing). Search engines weigh the
   field lightly, but it should at least rank the site's own pages honestly:
   the hub and course homes; the pages people search for by name (practice
   tests, exams, the textbook, the exam guide, Premium); the notes, which are
   the pages written to be read from a search; lessons and mechanisms; tools,
   which are mostly a canvas and a few buttons; then legal and credits. */
function priorityFor(path) {
  if (path === '/') return '1.0';
  if (/^\/(nremt|ochem|anatomy-physiology)\/$/.test(path)) return '0.9';
  if (/^\/(premium|(nremt|ochem|anatomy-physiology)\/(practice|exams|learn|study-notes|exam-day|glossary|flashcards|how-to-study|skillsheets|tools))\.html$/.test(path)) return '0.8';
  if (/^\/(ochem\/notes|anatomy-physiology\/(notes|chapters))\//.test(path)) return '0.7';
  if (/^\/nremt\/[^/]+\.html$/.test(path)) return '0.7';
  if (/^\/(ochem\/(lessons|mechanisms)|anatomy-physiology\/(lessons|concepts))\//.test(path)) return '0.6';
  if (/^\/(ochem|anatomy-physiology)\/tools\//.test(path)) return '0.5';
  if (/^\/(privacy|terms|changelog|sources)\.html$|credits\.html$/.test(path)) return '0.3';
  return '0.5';
}

/* The date of the commit that last touched the file. Falls back to today for
   a page that is new and not yet committed, which is the honest answer for a
   file whose history is "now". The author date (%as), not the committer date:
   a rebase or cherry-pick rewrites the committer date of every commit it
   moves, which would stamp untouched pages with the day of the merge. */
const today = new Date().toISOString().slice(0, 10);
function lastModified(file) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%as', '--', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out || today;
  } catch {
    return today;
  }
}

const entries = [];
const problems = [];

for (const raw of walk('.')) {
  const file = posix.normalize(raw.replace(/\\/g, '/').replace(/^\.\//, ''));
  const html = readFileSync(file, 'utf8');

  if (/<meta\s+http-equiv=["']refresh["']/i.test(html)) continue;
  // A noindex page (dashboards, account, search, review: scripts/lib/app-pages.mjs)
  // asks not to be indexed, so submitting it would contradict itself.
  if (isNoindex(html)) continue;

  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
  if (!m) {
    problems.push(`${file}: no canonical, so there is no URL to submit`);
    continue;
  }
  entries.push({ loc: m[1], path: new URL(m[1]).pathname, lastmod: lastModified(file) });
}

if (problems.length) {
  console.error('Sitemap could not be built:');
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

// Ordered by priority, then by URL: stable across runs, so a rebuild that
// changes nothing produces no diff.
entries.sort((a, b) => {
  const d = Number(priorityFor(b.path)) - Number(priorityFor(a.path));
  return d !== 0 ? d : a.loc.localeCompare(b.loc);
});

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  entries
    .map(
      (e) =>
        '  <url>\n' +
        `    <loc>${e.loc}</loc>\n` +
        `    <lastmod>${e.lastmod}</lastmod>\n` +
        `    <priority>${priorityFor(e.path)}</priority>\n` +
        '  </url>\n'
    )
    .join('') +
  '</urlset>\n';

if (check) {
  let current = '';
  try { current = readFileSync(OUT, 'utf8'); } catch { /* missing counts as stale */ }
  // Only the URL set is compared, not the dates: <lastmod> is derived from
  // commit history, so a checkout whose history differs from the committing
  // one would fail a byte comparison over something no one got wrong. A page
  // added or removed without regenerating is the failure worth catching.
  const locs = (s) => (s.match(/<loc>[^<]*<\/loc>/g) || []).sort().join('\n');
  if (locs(current) !== locs(xml)) {
    console.error(`${OUT} is out of date. Run: node scripts/build-sitemap.mjs`);
    const before = new Set((current.match(/<loc>([^<]*)<\/loc>/g) || []));
    const after = new Set((xml.match(/<loc>([^<]*)<\/loc>/g) || []));
    for (const l of after) if (!before.has(l)) console.error(`  missing: ${l.replace(/<\/?loc>/g, '')}`);
    for (const l of before) if (!after.has(l)) console.error(`  stale:   ${l.replace(/<\/?loc>/g, '')}`);
    process.exit(1);
  }
  console.log(`${OUT} lists all ${entries.length} pages.`);
} else {
  writeFileSync(OUT, xml);
  console.log(`${entries.length} URLs -> ${OUT}`);
}
