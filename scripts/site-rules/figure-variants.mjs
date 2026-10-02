/* Every A&P OpenStax JPG has its AVIF copies, and pages use them.

   Audit finding (site audit 2026-10, performance, "Images" row): 389 JPGs, no
   modern format and no srcset. scripts/build-figure-variants.py writes
   figures/avif/<id>-480.avif, -800.avif (when narrower than the figure) and
   <id>.avif; scripts/lib/anp-build.mjs wraps figures in <picture>. A figure
   added without running the script would ship a <source> pointing at nothing,
   so this fails instead. */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export default function ({ ROOT, fail }) {
  const dir = join(ROOT, 'anatomy-physiology', 'figures');
  const avif = join(dir, 'avif');
  if (!existsSync(avif)) { fail('figure-variants: anatomy-physiology/figures/avif is missing; run python3 scripts/build-figure-variants.py.'); return; }
  const have = new Set(readdirSync(avif));
  const jpgs = readdirSync(dir).filter((f) => f.endsWith('.jpg')).map((f) => f.slice(0, -4));
  const missing = jpgs.filter((id) => !have.has(`${id}.avif`));
  if (missing.length) fail(`figure-variants: ${missing.length} figure(s) have no AVIF copy (${missing.slice(0, 5).join(', ')}); run python3 scripts/build-figure-variants.py.`);
  const ids = new Set(jpgs);
  const orphans = [...have].filter((f) => !ids.has(f.replace(/(-480|-800)?\.avif$/, '')));
  if (orphans.length) fail(`figure-variants: ${orphans.length} AVIF file(s) have no JPG (${orphans.slice(0, 5).join(', ')}).`);
  // Every srcset entry on a built page resolves.
  const sample = join(ROOT, 'anatomy-physiology', 'notes', 'heart-anatomy.html');
  if (existsSync(sample)) {
    const html = readFileSync(sample, 'utf8');
    if (/figures\/[\w.-]+\.jpg/.test(html) && !/<source type="image\/avif"/.test(html)) fail('figure-variants: A&P notes pages no longer wrap figures in <picture> with AVIF.');
    for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
      for (const part of m[1].split(',')) {
        const url = part.trim().split(' ')[0].replace(/^\.\.\//, 'anatomy-physiology/');
        if (!existsSync(join(ROOT, url))) fail(`figure-variants: heart-anatomy.html srcset names ${url}, which does not exist.`);
      }
    }
  }
}
