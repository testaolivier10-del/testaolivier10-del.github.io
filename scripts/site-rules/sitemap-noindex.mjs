/* App-state pages are noindex, and no noindex page is in sitemap.xml.

   Audit finding (site audit 2026-10, SEO, sitemap row): dashboards, account
   and search pages were listed and indexable, and nremt/dashboard.html was
   noindex yet listed. The list lives in scripts/lib/app-pages.mjs. */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { APP_STATE_PAGES, isNoindex } from '../lib/app-pages.mjs';

export default function ({ ROOT, fail }) {
  for (const rel of APP_STATE_PAGES) {
    const p = join(ROOT, rel);
    if (!existsSync(p)) { fail(`sitemap-noindex: ${rel} is listed in scripts/lib/app-pages.mjs but does not exist.`); continue; }
    if (!isNoindex(readFileSync(p, 'utf8'))) fail(`sitemap-noindex: ${rel} shows a visitor's own state; give it <meta name="robots" content="noindex, follow">.`);
  }
  const sm = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
  for (const m of sm.matchAll(/<loc>https:\/\/levlprep\.com\/([^<]*)<\/loc>/g)) {
    let rel = decodeURIComponent(m[1]);
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    const p = join(ROOT, rel);
    if (existsSync(p) && isNoindex(readFileSync(p, 'utf8'))) fail(`sitemap-noindex: sitemap.xml lists ${rel}, which is noindex. Run node scripts/build-sitemap.mjs.`);
  }
}
