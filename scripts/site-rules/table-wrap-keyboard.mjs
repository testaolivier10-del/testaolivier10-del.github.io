/* A&P scrolling table wrappers can be scrolled from the keyboard.

   Guards the audit 2026-10 A&P row "Notes tables: wide tables can't be
   scrolled by keyboard". A .table-wrap scrolls sideways on a phone, and a
   keyboard user can only scroll it if it takes focus: tabindex="0", with
   role="region" and an aria-label so the focus stop has a name.
   (scripts/build-anp.mjs wrapTables writes them.) */
import { readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';

export default function tableWrapKeyboard({ ROOT, fail, htmlFiles }) {
  for (const file of htmlFiles) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (!rel.startsWith('anatomy-physiology/') || rel.startsWith('anatomy-physiology/data/')) continue;
    for (const m of readFileSync(file, 'utf8').matchAll(/<div class="table-wrap"([^>]*)>/g)) {
      const a = m[1];
      if (!/tabindex="0"/.test(a) || !/role="region"/.test(a) || !/aria-label="[^"]+"/.test(a)) {
        fail(`${rel}: <div class="table-wrap"> needs tabindex="0" role="region" aria-label="…" so it can be scrolled by keyboard`);
        break;
      }
    }
  }
}
