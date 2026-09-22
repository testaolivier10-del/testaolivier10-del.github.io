/* Gives the seven ochem tool pages a body before JavaScript runs, and the
   structured data every other page on the site already had.

   THE PROBLEM THIS SOLVES
   -----------------------
   A tool page is about 5 KB of head and three empty divs. Everything a reader
   sees — the back link, the tool's name, its one-line promise, the row that
   switches to the other six tools, and the tool itself — is written into
   those divs by tool-shell.js and the tool's own script. That is a reasonable
   way to build a tool. It is a bad way to be a page: with JavaScript off, or
   before the scripts land, or to a crawler that does not run them, these seven
   URLs are blank. They had no <h1> at all, which was not an oversight in the
   markup — there was no markup for one to be missing from.

   The same argument applied to ochem/notes/** a while ago and was answered the
   same way (see the header of build-notes-pages.mjs): the fix is not to hide
   the pages, it is to make them pages. So the shell's first screen is written
   into #tool-top statically, from the same tools-registry.js the runtime reads,
   and tool-shell.js overwrites it with the identical markup the moment it runs.
   A reader with JavaScript sees no difference. A reader without one now gets a
   heading, a sentence saying what the tool does, and six links onward instead
   of nothing.

   WHAT IS GENERATED
   -----------------
   Only what is between the markers, in each of the seven pages:

     <!-- tool-top:start -->  ... static shell ...  <!-- tool-top:end -->
     <!-- tool-ld:start -->   ... JSON-LD ...       <!-- tool-ld:end -->

   The registry is the one place a tool's name and blurb are written, so
   renaming a tool still means one edit, and a tool added to the registry
   appears in all seven switchers the moment this runs.

     node scripts/build-tool-pages.mjs            rewrite
     node scripts/build-tool-pages.mjs --check    fail if stale (CI)
*/
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');
const ORIGIN = 'https://levlprep.com';

const TOP_START = '<!-- tool-top:start -->';
const TOP_END = '<!-- tool-top:end -->';
const LD_START = '<!-- tool-ld:start -->';
const LD_END = '<!-- tool-ld:end -->';

/* The last line of every tool page's head, and so the place the structured
   data is inserted the first time. */
const FONTS_LINK = '<link rel="stylesheet" href="../../assets/fonts/fonts.css">';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* tools-registry.js is a browser IIFE that hangs its list off window, so it is
   run in a sandbox rather than imported — the same approach
   build-notes-pages.mjs takes with curriculum.js. */
function loadTools() {
  const sandbox = { window: {}, document: {} };
  vm.createContext(sandbox);
  vm.runInContext(
    readFileSync(join(ROOT, 'ochem', 'assets', 'tools-registry.js'), 'utf8') +
    '\nthis.T = window.OchemTools;',
    sandbox,
  );
  if (!sandbox.T || !Array.isArray(sandbox.T.ALL)) throw new Error('tools-registry.js did not yield a tool list');
  return sandbox.T.ALL;
}

/* Mirrors tool-shell.js exactly. If the two ever disagree the page would flicker
   from one layout to another as the script lands, which is worse than either
   one alone — so this is the markup to change when that one changes. */
function topHtml(tool, all) {
  const switcher = all.map((t) => (
    `<a href="${esc(t.slug)}.html"${t.slug === tool.slug ? ' class="on" aria-current="page"' : ''}>${esc(t.name)}</a>`
  )).join('');

  return `<a class="tool-back" href="../tools.html">&larr; All tools</a>` +
    `<div class="tool-title">` +
      `<span class="tool-tile__mark"><svg viewBox="0 0 24 24" aria-hidden="true">${tool.icon}</svg></span>` +
      `<h1>${esc(tool.name)}</h1>` +
    `</div>` +
    `<p class="tool-lede">${esc(tool.blurb)}</p>` +
    `<div class="tool-share" id="tool-share"></div>` +
    `<nav class="tool-switch" aria-label="Other tools">${switcher}</nav>`;
}

/* A tool is a thing you use, not a thing you read, so it is a WebApplication
   rather than the LearningResource the lessons and notes declare — with
   learningResourceType saying what kind of use it is. The course and the
   organisation carry the same @ids the rest of the site uses, so the graph
   joins up instead of describing a second, unrelated site.

   `teaches` and the lesson links come from the registry's `topic` field, which
   is checked against curriculum.js by check-curriculum.mjs — so the tool's
   structured data cannot point at a lesson that does not exist. */
function ldJson(tool) {
  const url = `${ORIGIN}/ochem/tools/${tool.slug}.html`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['WebApplication', 'LearningResource'],
        '@id': `${url}#tool`,
        name: tool.name,
        url,
        description: tool.blurb,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        learningResourceType: 'Interactive Tool',
        educationalLevel: 'Undergraduate',
        inLanguage: 'en',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        teaches: tool.teaches.split(/,\s*/).map((name) => ({ '@type': 'DefinedTerm', name })),
        isPartOf: { '@id': `${ORIGIN}/ochem/#course` },
        provider: { '@id': `${ORIGIN}/#org` },
        relatedLink: tool.topic.map((id) => `${ORIGIN}/ochem/notes/${id}.html`),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'LevlPrep', item: `${ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Organic Chemistry', item: `${ORIGIN}/ochem/` },
          { '@type': 'ListItem', position: 3, name: 'Tools', item: `${ORIGIN}/ochem/tools.html` },
          { '@type': 'ListItem', position: 4, name: tool.name, item: url },
        ],
      },
    ],
  };
  return JSON.stringify(ld, null, 2).replace(/<\//g, '<\\/');
}

/* Replaces what is between a pair of markers, inserting the pair after an
   anchor line the first time. Everything outside them is the page's own. */
function splice(html, start, end, body, anchor) {
  const a = html.indexOf(start);
  const b = html.indexOf(end);
  const block = `${start}\n${body}\n${end}`;
  if (a !== -1 && b !== -1) return html.slice(0, a) + block + html.slice(b + end.length);
  const at = html.indexOf(anchor);
  if (at === -1) return null;
  return html.slice(0, at + anchor.length) + '\n' + block + html.slice(at + anchor.length);
}

const tools = loadTools();
const stale = [];
const broken = [];
let written = 0;

for (const tool of tools) {
  const file = join(ROOT, 'ochem', 'tools', `${tool.slug}.html`);
  if (!existsSync(file)) { broken.push(`${tool.slug}: no page`); continue; }
  const current = readFileSync(file, 'utf8');

  const ldBlock = `<!-- levlprep-structured-data -->\n<script type="application/ld+json">\n${ldJson(tool)}\n</script>`;
  let next = splice(current, LD_START, LD_END, ldBlock, FONTS_LINK);
  if (next === null) { broken.push(`${tool.slug}: no place to put the structured data`); continue; }

  next = splice(next, TOP_START, TOP_END, topHtml(tool, tools), '<div class="tool-top" id="tool-top">');
  if (next === null) { broken.push(`${tool.slug}: no <div id="tool-top">`); continue; }

  if (next === current) continue;
  if (check) { stale.push(tool.slug); continue; }
  writeFileSync(file, next);
  written++;
}

if (broken.length) {
  console.error('FAIL:');
  for (const b of broken) console.error(`  ${b}`);
  process.exit(1);
}

if (check) {
  if (stale.length) {
    console.error(`FAIL: ${stale.length} tool page(s) are stale: ${stale.join(', ')}`);
    console.error('Run: node scripts/build-tool-pages.mjs');
    process.exit(1);
  }
  console.log(`OK — all ${tools.length} tool pages are up to date.`);
} else {
  console.log(`Wrote ${written} of ${tools.length} tool pages.`);
}
