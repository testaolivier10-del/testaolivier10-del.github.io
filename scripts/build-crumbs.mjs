/* Visible breadcrumbs on the NREMT and ochem pages, from each page's own
   BreadcrumbList.

     node scripts/build-crumbs.mjs           write them
     node scripts/build-crumbs.mjs --check   fail if any page is stale (CI)

   Audit 2026-10 (UX row "Breadcrumbs, H1s"): only A&P showed a breadcrumb
   trail. Every NREMT and ochem page already declares its trail for search
   engines in JSON-LD (scripts/build-og-tags.mjs and the page heads), so the
   visible trail is that same list, written between crumb markers right under
   the tab row. One source, so the two can never disagree. The markup and the
   look match A&P's anp-crumb (theme.css styles .anp-crumb, .notes-crumb and
   .site-crumb as one component); links are root-relative.

   Left out: course homes (a trail of "LevlPrep" alone says nothing), redirect
   stubs, ochem/notes (they carry their own notes-crumb) and pages with no
   BreadcrumbList. */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyCrumbs } from './lib/crumbs.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const check = process.argv.includes('--check');
const DIRS = ['nremt', 'ochem', 'ochem/lessons', 'ochem/mechanisms', 'ochem/tools'];
const GENERATED = new Set(['ochem/glossary.html', 'nremt/glossary.html']); // their generators write the shared .cx-crumb row
/* Textbook pages carry their crumb inside the reading column, as A&P and Bio
   do (assets/course/book.css), so they get no row under the tabs. */
const IN_PAGE = new Set(['ochem/learn.html', 'nremt/study-notes.html']);
const stale = [];
for (const dir of DIRS) {
  for (const f of readdirSync(join(ROOT, dir))) {
    if (!f.endsWith('.html') || GENERATED.has(`${dir}/${f}`) || IN_PAGE.has(`${dir}/${f}`)) continue;
    const file = join(ROOT, dir, f);
    const html = readFileSync(file, 'utf8');
    const want = applyCrumbs(html);
    if (want !== html) {
      stale.push(`${dir}/${f}`);
      if (!check) writeFileSync(file, want);
    }
  }
}

if (check && stale.length) {
  console.error(`Breadcrumbs are stale on ${stale.length} page(s), e.g. ${stale.slice(0, 3).join(', ')}. Run node scripts/build-crumbs.mjs`);
  process.exit(1);
}
console.log(check ? 'OK — breadcrumbs match every page\'s BreadcrumbList.' : `${stale.length} page(s) updated.`);
