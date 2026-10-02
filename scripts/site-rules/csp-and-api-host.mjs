/* Site audit 2026-10, "All pages' CSP" and "Worker hostname in one
   constant": every page carries a Content-Security-Policy that names the two
   exact third-party script files (not all of cdn.jsdelivr.net), the one
   Worker host (not *.workers.dev), no third-party script host for analytics,
   and form-action; the account page (refunds) has its frame-buster; and every
   file that calls the Worker uses the one address in worker/src/config.js.
   Fix with `node scripts/build-site-config.mjs`. */
import { readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import {
  API_URL, API_ORIGIN, SCRIPT_PINS, FRAMED_PAGES, FRAME_BUSTER,
} from '../lib/site-config.mjs';

const CSP_RE = /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/;
const API_FILES = ['assets/premium.js', 'assets/account-page.js', 'assets/reminders.js', 'assets/tutor.js', 'sw.js'];

export default function ({ ROOT, fail, htmlFiles }) {
  for (const file of htmlFiles) {
    const rel = relative(ROOT, file).split(sep).join('/');
    const html = readFileSync(file, 'utf8');
    if (!/<head[\s>]/i.test(html)) continue; // a verification token or a fragment, not a page
    const m = html.match(CSP_RE);
    if (!m) { fail(`${rel}: no Content-Security-Policy meta tag (run node scripts/build-site-config.mjs)`); continue; }
    const dirs = Object.fromEntries(m[1].split(';').map((d) => d.trim().split(/\s+/)).filter((d) => d[0]).map((d) => [d[0], d.slice(1)]));
    const all = Object.values(dirs).flat();
    if (all.some((v) => v.includes('*.workers.dev'))) fail(`${rel}: CSP allows any *.workers.dev; name the one Worker (${API_ORIGIN})`);
    if (all.includes('https://cdn.jsdelivr.net')) fail(`${rel}: CSP allows all of cdn.jsdelivr.net; name the exact files`);
    const scripts = dirs['script-src'] || [];
    if (scripts.some((v) => /umami/.test(v))) fail(`${rel}: CSP lets Umami serve a script; the tracker is self-hosted`);
    for (const v of scripts) {
      if (/^https:/.test(v) && !SCRIPT_PINS.includes(v)) fail(`${rel}: CSP script source ${v} is not one of the pinned files in scripts/lib/site-config.mjs`);
    }
    for (const v of dirs['connect-src'] || []) {
      if (/workers\.dev|^https:\/\/api\./.test(v) && v !== API_ORIGIN) fail(`${rel}: CSP connect-src ${v} is not the Worker in worker/src/config.js`);
    }
    if (!dirs['form-action']) fail(`${rel}: CSP has no form-action`);
    if (FRAMED_PAGES.includes(rel) && !html.includes(FRAME_BUSTER)) fail(`${rel}: takes payments or refunds but has no frame-buster`);
  }

  for (const rel of API_FILES) {
    const src = readFileSync(join(ROOT, rel), 'utf8');
    const marked = src.split('\n').filter((l) => l.includes('site-config:API_URL'));
    if (!marked.length) fail(`${rel}: no line marked site-config:API_URL`);
    for (const line of marked) {
      if (!line.includes(`'${API_URL}'`)) fail(`${rel}: Worker address is not ${API_URL} (run node scripts/build-site-config.mjs)`);
    }
    const stray = src.match(/https:\/\/[a-z0-9.-]+\.workers\.dev/g) || [];
    for (const host of stray) {
      if (host !== API_URL && !/your-worker\.workers\.dev/.test(host)) fail(`${rel}: hard-coded Worker ${host}; use the marked API_URL line`);
    }
  }
}
