/* Every footer link row is the one shared list (scripts/lib/footer-links.mjs), same links, same order.

   Consistency audit 2026-11, D3: footers differed on almost every page type (the join and teach pages, the
   certificate, AP® homes, the ochem home, A&P), and course footers never linked Teachers. */
import { readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';
import { FOOTER_LINKS } from '../lib/footer-links.mjs';

const WANT = FOOTER_LINKS.map(([href, label]) => `${href}|${label}`).join(',');

export default function footerLinksRule({ ROOT, fail, htmlFiles }) {
  for (const file of htmlFiles) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (rel.startsWith('scripts/') || rel.startsWith('docs/') || rel.includes('/data/')) continue;
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/<p class="privacy-link">([\s\S]*?)<\/p>/g)) {
      const got = [...m[1].matchAll(/<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)]
        .map(([, href, label]) => `${href.startsWith('mailto:') ? href : href.replace(/^(?:\/|(?:\.\.\/)+)/, '')}|${label}`).join(',');
      if (got !== WANT) fail(`footer-links: ${rel} has a footer link row that is not the shared list (scripts/lib/footer-links.mjs).`);
    }
  }
}
