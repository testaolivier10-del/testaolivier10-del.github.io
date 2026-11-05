// Consistency audit 2026-11, B14: no course has a unit-tests/index.html, so nothing may link the bare
// folder (`unit-tests/` or `unit-tests/index.html`); every link names one unit's test, unit-tests/unit-N.html.
// A course that adds an index page passes again on its own.
import { readFileSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

export default function ({ ROOT, fail, htmlFiles }) {
  const LINK = /href="([^"#?:]*unit-tests\/(?:index\.html)?)(?:[#?][^"]*)?"/g;
  for (const f of htmlFiles) {
    const html = readFileSync(f, 'utf8');
    for (const m of html.matchAll(LINK)) {
      const target = join(dirname(f), m[1].replace(/index\.html$/, ''), 'index.html');
      if (!existsSync(target)) fail(`${relative(ROOT, f)}: links the unit-tests folder (${m[1]}), which has no index page; link one unit's test instead`);
    }
  }
}
