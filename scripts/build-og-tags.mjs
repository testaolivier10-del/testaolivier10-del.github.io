/* Writes the Open Graph and Twitter card tags into every page that lacks them.

   A link to a LevlPrep page pasted into a text message, a Discord server or a
   study-group chat is the site's main way of spreading, and 93 of its 110
   pages unfurled as a bare grey URL — every ochem lesson, every mechanism,
   every reaction tool. The hub and the NREMT pages had hand-written tags; the
   rest never got any.

   Hand-writing 93 more would put the same three facts in two places on every
   page and guarantee they drift. Every page already carries a <title>, a
   meta description and a canonical URL, which is exactly what the card needs,
   so this derives the tags from those and leaves the page as the one place a
   fact is written down.

   Idempotent: a page that already has og:title is left alone, including the
   seventeen that were written by hand. Run after adding a page:

     node scripts/build-og-tags.mjs            rewrite
     node scripts/build-og-tags.mjs --check    fail if anything is missing (CI)
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';

const ORIGIN = 'https://testaolivier10-del.github.io';
const check = process.argv.includes('--check');

// Pages that deliberately have no card, and why:
//   404.html          stands in for an unbounded set of URLs; there is no one
//                     page for a card to describe.
//   offline.html      same: served by sw.js at whatever URL could not be
//                     fetched, and never reachable on its own.
//   googleb*.html     Search Console's ownership token, not a page.
//   ochem/notes/**    prose fragments injected into a lesson, never visited.
// The thirteen root-level redirect stubs are skipped by the no-canonical rule
// below rather than by name: they are two lines of meta refresh pointing at
// the real page under /nremt/, and that page carries the card.
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

/* Attribute values on this site are double-quoted without exception, which is
   what makes a regex safe here instead of a parser: the value runs to the next
   double quote and nothing else terminates it. An apostrophe inside a
   description ("Huckel's rule") is just a character. Enforced further down —
   a page that breaks the convention is reported, not silently mangled. */
const pick = (html, re) => {
  const m = html.match(re);
  return m ? m[1].trim() : '';
};

/* Which card image to use. Each course has its own, so an ochem lesson shared
   in a chemistry group does not unfurl with an EMT card on it. */
function imageFor(file) {
  if (file.startsWith('nremt/')) return `${ORIGIN}/nremt/assets/og-image.png`;
  if (file.startsWith('ochem/')) return `${ORIGIN}/ochem/assets/og-image.png`;
  return `${ORIGIN}/assets/og-image.png`;
}

/* Lessons and mechanisms are written pieces; everything else is a tool or an
   index. The distinction is only a hint to the unfurler, but it is free. */
function typeFor(file) {
  return /^ochem\/(lessons|mechanisms)\//.test(file) ? 'article' : 'website';
}

const files = walk('.').map((f) => posix.normalize(f.replace(/\\/g, '/').replace(/^\.\//, '')));
files.sort();

const written = [];   // pages this run added tags to
const hadTags = [];   // pages that already carried a card
const notAPage = [];  // redirect stubs and anything else without a canonical
const problems = [];

for (const file of files) {
  const html = readFileSync(file, 'utf8');

  if (/property=["']og:title["']/.test(html)) { hadTags.push(file); continue; }

  // A redirect stub: two lines of meta refresh pointing at the real page,
  // whose canonical is that page's URL. A card here would advertise a URL
  // that is not this file, and the file it points at has its own.
  if (/<meta\s+http-equiv=["']refresh["']/i.test(html)) { notAPage.push(file); continue; }

  const canonical = pick(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
  // No canonical means no stable URL to advertise: the redirect stubs, and
  // anything else that is not really a page. Not a problem, just not a card.
  if (!canonical) { notAPage.push(file); continue; }

  const title = pick(html, /<title>([\s\S]*?)<\/title>/i);
  const description = pick(html, /<meta\s+name="description"\s+content="([^"]*)"/i);

  if (!title || !description) {
    problems.push(`${file}: has a canonical but ${!title ? 'no <title>' : 'no meta description'}`);
    continue;
  }

  // Both values are lifted straight out of markup that already escaped them,
  // and neither can contain a raw double quote — the description came out of
  // a double-quoted attribute, and no title on the site has one. So they drop
  // into content="..." unchanged. Asserted rather than assumed: a title that
  // did contain one would otherwise close the attribute early and inject
  // markup into every page this touches.
  if (title.includes('"')) {
    problems.push(`${file}: <title> contains a double quote and would break the tag`);
    continue;
  }

  const tags = [
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:type" content="${typeFor(file)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:site_name" content="LevlPrep">`,
    `<meta property="og:image" content="${imageFor(file)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ].join('\n');

  const canonicalTag = html.match(/<link\s+rel="canonical"[^>]*>/i)[0];
  const next = html.replace(canonicalTag, `${canonicalTag}\n${tags}`);
  if (next === html) { problems.push(`${file}: could not place the tags`); continue; }

  written.push(file);
  if (!check) writeFileSync(file, next);
}

if (problems.length) {
  console.error('Open Graph tags could not be written:');
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

if (check) {
  if (written.length) {
    console.error(`${written.length} page(s) are missing Open Graph tags. Run: node scripts/build-og-tags.mjs`);
    for (const f of written) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(`Open Graph tags present on all ${hadTags.length} pages that need them (${notAPage.length} redirect stubs skipped).`);
} else {
  console.log(`${written.length} page(s) updated, ${hadTags.length} already had tags, ${notAPage.length} skipped as not pages.`);
}
