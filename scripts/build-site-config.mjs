/* Writes scripts/lib/site-config.mjs into the site.

     node scripts/build-site-config.mjs           apply
     node scripts/build-site-config.mjs --check   fail if anything is stale (CI)

   1. The Worker's address (API_URL, from worker/src/config.js) into every
      line marked `site-config:API_URL` in the site's own scripts, so moving
      the Worker to api.levlprep.com is one constant and one run of this.
   2. The Content-Security-Policy meta tag on every page: normalized to the
      rules in site-config.mjs (pinned script files, the one Worker host,
      form-action), added to redirect stubs that had none.
   3. The frame-buster on the pages that take payments or refunds.

   Pages that a generator writes (A&P, notes pages, the ochem glossary) get
   the same CSP from the generator, which imports it from site-config.mjs,
   so the generators' own --check and this one agree. */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { API_URL, normalizeCsp, STUB_CSP, FRAMED_PAGES, FRAME_BUSTER } from './lib/site-config.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const check = process.argv.includes('--check');

const API_FILES = ['assets/premium.js', 'assets/account-page.js', 'assets/reminders.js', 'assets/tutor.js', 'sw.js'];
const MARK = /^(.*?)'https:\/\/[^']+'(.*\/\/ site-config:API_URL.*)$/gm;

const SKIP_DIRS = new Set(['node_modules', '.git', '.github', 'scripts', 'docs', 'worker', '.claude']);
function pages(dir = ROOT, out = []) {
  for (const f of readdirSync(dir)) {
    if (SKIP_DIRS.has(f)) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) pages(p, out);
    else if (f.endsWith('.html')) out.push(p);
  }
  return out;
}

const CSP_RE = /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/;

function applyToPage(html, rel) {
  if (!/<head[\s>]/i.test(html)) return html; // a fragment (A&P notes data), not a page
  let out = html;
  const m = out.match(CSP_RE);
  if (m) {
    out = out.replace(CSP_RE, `<meta http-equiv="Content-Security-Policy" content="${normalizeCsp(m[1])}">`);
  } else if (/<meta http-equiv="refresh"/i.test(out)) {
    out = out.replace(/(<meta charset="UTF-8">\n)/i, `$1<meta http-equiv="Content-Security-Policy" content="${STUB_CSP}">\n`);
  }
  if (FRAMED_PAGES.includes(rel) && !out.includes(FRAME_BUSTER)) {
    out = out.replace(/(<meta http-equiv="Content-Security-Policy" content="[^"]*">\n)/, `$1${FRAME_BUSTER}\n`);
  }
  return out;
}

const stale = [];
function put(file, before, after) {
  if (before === after) return;
  stale.push(relative(ROOT, file));
  if (!check) writeFileSync(file, after);
}

for (const rel of API_FILES) {
  const file = join(ROOT, rel);
  const src = readFileSync(file, 'utf8');
  if (!/site-config:API_URL/.test(src)) {
    console.error(`${rel}: no line marked site-config:API_URL`);
    process.exit(1);
  }
  put(file, src, src.replace(MARK, `$1'${API_URL}'$2`));
}

for (const file of pages()) {
  const rel = relative(ROOT, file).split('\\').join('/');
  const html = readFileSync(file, 'utf8');
  put(file, html, applyToPage(html, rel));
}

if (check) {
  if (stale.length) {
    console.error(`${stale.length} file(s) out of step with scripts/lib/site-config.mjs, e.g.:`);
    for (const f of stale.slice(0, 10)) console.error('  ' + f);
    console.error('Run: node scripts/build-site-config.mjs');
    process.exit(1);
  }
  console.log('Worker address and CSP are in step with scripts/lib/site-config.mjs.');
} else {
  console.log(`${stale.length} file(s) updated from scripts/lib/site-config.mjs.`);
}
