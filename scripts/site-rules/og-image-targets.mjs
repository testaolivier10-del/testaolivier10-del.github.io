/* Every og:image (and twitter:image) on the site points at a file that exists.

   Audit finding (site audit 2026-10, SEO): 378 A&P pages pointed og:image at
   anatomy-physiology/assets/og-image.png, which did not exist, so every shared
   A&P link unfurled with no picture. scripts/build-og-images.mjs now renders
   that card with the others. */
import { readFileSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export default function ({ ROOT, fail, htmlFiles }) {
  const missing = new Map();
  for (const file of htmlFiles) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (rel.startsWith('scripts/') || rel.startsWith('docs/')) continue;
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/<meta (?:property="og:image"|name="twitter:image") content="([^"]*)"/g)) {
      const url = m[1];
      if (!url.startsWith('https://levlprep.com/')) { fail(`og-image-targets: ${rel} og:image "${url}" is not an absolute levlprep.com URL.`); continue; }
      const target = url.slice('https://levlprep.com/'.length);
      if (!existsSync(join(ROOT, target))) missing.set(target, (missing.get(target) || 0) + 1);
    }
  }
  for (const [target, n] of missing) fail(`og-image-targets: ${n} page(s) point og:image at ${target}, which does not exist (scripts/build-og-images.mjs renders the cards).`);
}
