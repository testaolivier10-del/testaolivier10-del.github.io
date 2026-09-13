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

const OUT = 'sitemap.xml';
const check = process.argv.includes('--check');

// Same exclusions as the Open Graph tags, for the same reasons: 404.html and
// offline.html each stand in for an unbounded set of URLs, googleb*.html is an
// ownership token, ochem/notes/** are fragments (robots.txt disallows them). The
// thirteen redirect stubs drop out on the meta-refresh test below — their
// canonical points at the real page, which is listed on its own.
const SKIP_DIRS = new Set(['.git', 'node_modules', 'notes']);
const SKIP_FILES = /^(404\.html|offline\.html|googleb[0-9a-f]+\.html)$/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith('.html') && !SKIP_FILES.test(name)) out.push(full);
  }
  return out;
}

/* The priority scheme the hand-written file used, preserved rather than
   reinvented — search engines largely ignore the field, and changing it would
   have made this rewrite look like a ranking decision when it is a
   maintenance one.

   The shape of it: the hub, then the two course homepages, then anything that
   is a section someone navigates to, then the written lessons, then the
   interactive apps and tools — which are a canvas and a few buttons, with
   almost nothing on them for a crawler to read. */
function priorityFor(path) {
  if (path === '/') return '1.0';
  if (path === '/nremt/' || path === '/ochem/') return '0.9';
  if (/^\/ochem\/(lessons|mechanisms)\//.test(path)) return '0.7';
  if (/^\/ochem\/tools\//.test(path)) return '0.6';
  if (/^\/ochem\/(practice|review|mastery)\.html$/.test(path)) return '0.6';
  return '0.8';
}

/* The date of the commit that last touched the file. Falls back to today for
   a page that is new and not yet committed, which is the honest answer for a
   file whose history is "now". */
const today = new Date().toISOString().slice(0, 10);
function lastModified(file) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
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
