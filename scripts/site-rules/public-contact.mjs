// The site's public contact is hello@levlprep.com (Cloudflare Email Routing).
// The owner's personal address was on every footer, the legal pages, the
// account page and the push VAPID subject until 2026-10; this keeps it off
// anything the site serves or the Worker sends.
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const PERSONAL = /testaolivier10@gmail\.com/i;
// The operator's name stays off the site too (anonymity decision, 2026-10-06).
const NAME = /Olivier\s+Testa/i;

export default function ({ ROOT, fail, walk, htmlFiles }) {
  const files = [
    ...htmlFiles,
    ...walk(join(ROOT, 'assets'), ['.js', '.json']),
    ...walk(join(ROOT, 'worker', 'src'), ['.js']),
    join(ROOT, 'worker', 'wrangler.toml'),
    join(ROOT, 'sw.js'),
  ];
  for (const f of files) {
    if (PERSONAL.test(readFileSync(f, 'utf8'))) {
      fail(`${relative(ROOT, f)}: shows the owner's personal email; use hello@levlprep.com`);
    }
    if (NAME.test(readFileSync(f, 'utf8'))) {
      fail(`${relative(ROOT, f)}: shows the owner's name; the site names no person`);
    }
  }
}
