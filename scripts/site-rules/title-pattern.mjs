/* Every indexed page's title reads "{Topic} — {Course} | LevlPrep".

   Audit finding (site audit 2026-10, SEO): about 640 course titles carried no
   "LevlPrep" and three separator styles (—, |, :). Generators now build titles
   with scripts/lib/page-title.mjs; this holds hand-written pages to the same
   shape. Allowed: "… | LevlPrep", or "… — Label" when the brand would push the
   title past 60 characters (a long topic name is worth more than the brand).
   Length and uniqueness are check-site section 33. */
import { readFileSync } from 'node:fs';
import { relative, sep, basename } from 'node:path';
import { decode, titleProblem } from '../lib/page-title.mjs';

const SKIP = /^(404|offline|googleb[0-9a-f]+)\.html$/;

export default function ({ ROOT, fail, htmlFiles }) {
  for (const file of htmlFiles) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (SKIP.test(basename(file)) || rel.startsWith('scripts/') || rel.startsWith('docs/')) continue;
    const html = readFileSync(file, 'utf8');
    if (/<meta http-equiv="refresh"/i.test(html)) continue;
    const t = html.match(/<title>([\s\S]*?)<\/title>/);
    if (!t) continue; // section 33 reports it
    const title = decode(t[1]).trim();
    const why = titleProblem(title);
    if (why) fail(`title-pattern: ${rel} "${title}" ${why}; use "{Topic} — {Course} | LevlPrep" (scripts/lib/page-title.mjs).`);
    const og = html.match(/<meta property="og:title" content="([^"]*)"/);
    if (og && decode(og[1]).trim() !== title) fail(`title-pattern: ${rel} og:title differs from <title>.`);
  }
}
