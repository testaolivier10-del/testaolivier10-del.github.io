/* One disclosure marker across the courses.

   Guards the audit 2026-10 visual-system row ("three arrow styles"): a
   <details> marker drawn in CSS must use var(--disclose) from theme.css (the
   one chevron, turned when open), not its own triangle or chevron glyph. The
   rule for arrows and monospace is written at the end of assets/theme.css. */
import { readFileSync } from 'node:fs';
import { relative, sep, join } from 'node:path';

export default function oneDisclosureMarker({ ROOT, fail, walk }) {
  const files = walk(ROOT, ['.css', '.html']).filter((p) => !/\/(docs|scripts)\//.test(p));
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/summary[^{}]*::(before|after)\{[^}]*content:([^;}]+)/g)) {
      const v = m[2].trim();
      if (v !== 'var(--disclose)' && v !== '""' && v !== "''" && v !== 'none') {
        fail(`${relative(ROOT, file).split(sep).join('/')}: a <summary> marker uses content:${v}; use content:var(--disclose)`);
      }
    }
  }
  if (!readFileSync(join(ROOT, 'assets/theme.css'), 'utf8').includes('--disclose:')) fail('assets/theme.css: --disclose is not defined');
}
