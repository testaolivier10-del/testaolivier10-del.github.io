/* Site audit 2026-10, analytics.js: Umami's script was loaded from
   cloud.umami.is with no SRI on every page that holds the Supabase session.
   It is now a pinned copy in assets/vendor/. This keeps any site script from
   injecting a <script> from another host unless it is one of the pinned,
   SRI-checked files (scripts/lib/site-config.mjs SCRIPT_PINS). */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SCRIPT_PINS } from '../lib/site-config.mjs';

export default function ({ ROOT, fail, htmlFiles }) {
  const analytics = readFileSync(join(ROOT, 'assets/analytics.js'), 'utf8');
  const url = analytics.match(/var SCRIPT_URL = '([^']+)'/);
  if (!url || !/^\/assets\/vendor\//.test(url[1])) fail('assets/analytics.js: the Umami tracker must be the self-hosted copy in /assets/vendor/');
  else if (!readdirSync(join(ROOT, 'assets/vendor')).includes(url[1].split('/').pop())) fail(`assets/analytics.js: ${url[1]} does not exist`);

  // Every third-party script URL in the shared code is a pinned file.
  for (const f of readdirSync(join(ROOT, 'assets')).filter((n) => n.endsWith('.js'))) {
    const src = readFileSync(join(ROOT, 'assets', f), 'utf8');
    for (const m of src.matchAll(/\.src\s*=\s*'(https:\/\/[^']+)';/g)) {
      if (!SCRIPT_PINS.includes(m[1])) fail(`assets/${f}: loads a third-party script ${m[1]} that is not pinned`);
    }
  }
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/<script[^>]+src="(https?:\/\/[^"]+)"/g)) {
      if (!SCRIPT_PINS.includes(m[1])) fail(`${file.slice(ROOT.length)}: <script src="${m[1]}"> from another host`);
    }
  }
}
