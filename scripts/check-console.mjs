/* Does the page actually work when a browser runs it?

   Everything else in CI reads the files. check-site.mjs proves a path resolves,
   check-weight.mjs proves a page is small, check-a11y.mjs proves the rendered
   DOM is usable. None of them proves the page RUNS. A typo'd property, a module
   that throws on load, a JSON fetch pointed at a file that moved, a listener
   bound to an element a refactor renamed: all of it parses, all of it passes
   every check here, and all of it is a dead page in front of a student.

   The site already knows this. errors.js exists precisely because "the errors
   worth hearing about are the ones early enough to stop a page working" — but
   it reports them from production, after somebody has already hit one. This is
   the same question asked before the commit lands.

   WHAT IT FAILS ON
   ----------------
     - an uncaught exception during load
     - anything written to console.error
     - a same-origin request that 404s or fails
     - the same id on two elements once the page has rendered

   The last one is here because this site builds most of its interactive DOM
   from template strings at runtime, where a duplicated id is invisible to any
   static scan and makes getElementById return the wrong element — silently,
   and only for whichever control lost.

   WHAT IT IGNORES, AND WHY
   ------------------------
   Cross-origin requests. The Supabase SDK and the analytics script come off
   third-party hosts, and whether those resolve says something about the CI
   runner's network rather than about this commit. A check that fails when
   somebody else's CDN has a bad afternoon gets switched off within a month,
   and then it is not checking anything. Same-origin is this repo's to get
   right, so same-origin is what is enforced.

   EVERY page, not one per shape. check-a11y.mjs samples twelve templates
   because accessibility is a property of a template. A runtime error is a
   property of one page's own inline bootstrap, which is exactly where this
   site puts its per-page wiring — so sampling would look at the one file that
   cannot be wrong.

     node scripts/check-console.mjs            report everything
     node scripts/check-console.mjs --check    exit non-zero on a real failure

   Locally it needs `npm i --no-save playwright` once (and Chromium, via
   `npx playwright install chromium`). CI does exactly that for check-a11y.mjs
   and this reuses it. CHROMIUM_PATH overrides the browser binary.
*/
import { createServer } from 'node:http';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');

/* Known-noisy pages, each with the reason. An entry with no reason is how a
   suite stops meaning anything — and an entry that no longer matches anything
   is the same rot one step later, so an unused one fails this check rather
   than sitting here implying a problem that was fixed years ago.

   Empty, deliberately: every page on the site currently loads clean. */
const IGNORE = new Map([]);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary',
  '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.ico': 'image/x-icon',
};

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules' || name === 'scripts') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (extname(name) === '.html') out.push(full);
  }
  return out;
}

function serve(port) {
  const server = createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = resolve(ROOT, '.' + p);
    // A path that escapes the repo is a bug in this script, not a request to
    // honour — this server is only ever pointed at the working tree.
    if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise((ok) => server.listen(port, () => ok(server)));
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch (e) {
  console.error('This check needs playwright:');
  console.error('  npm i --no-save playwright && npx playwright install chromium');
  console.error(`(${e.message})`);
  // Not a failure. A contributor without it installed should still be able to
  // run everything else; CI installs it and does not take this branch.
  process.exit(0);
}

const PORT = 8732;
const ORIGIN = `http://localhost:${PORT}`;
const pages = walk(ROOT).map((f) => '/' + relative(ROOT, f).split(/[\\/]/).join('/'));
pages.sort();

const server = await serve(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

console.log(`Loading ${pages.length} pages in Chromium.\n`);

/* Pages are independent, so they run several at a time — serially this is four
   minutes, which is long enough that somebody starts skipping it. */
const CONCURRENCY = 6;
const results = [];

async function visit(path) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const problems = [];
  const sameOrigin = (url) => url.startsWith(ORIGIN);

  page.on('pageerror', (e) => problems.push(`uncaught exception: ${e.message.split('\n')[0]}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    // "Failed to load resource" is the console's echo of a request that the
    // network listeners below already judge on origin. Reporting it here too
    // would fail the build for a third-party host being down.
    if (/Failed to load resource/i.test(text)) return;
    problems.push(`console.error: ${text.slice(0, 200)}`);
  });
  page.on('requestfailed', (r) => {
    if (sameOrigin(r.url())) problems.push(`request failed: ${r.url().slice(ORIGIN.length)} (${r.failure()?.errorText})`);
  });
  page.on('response', (r) => {
    if (sameOrigin(r.url()) && r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url().slice(ORIGIN.length)}`);
  });

  try {
    await page.goto(ORIGIN + path, { waitUntil: 'load', timeout: 30000 });
    // Deferred scripts have run by 'load', but this site's per-page bootstraps
    // wait for DOMContentLoaded and then render. Give that work a moment to
    // throw before deciding the page is clean.
    // Same reason as scripts/check-a11y.mjs: a page whose content is fetched
    // says when it has arrived, and an error thrown while rendering it would
    // otherwise land after this check had stopped listening.
    await page.waitForFunction(
      () => !document.documentElement.hasAttribute('data-content-async') ||
            document.documentElement.hasAttribute('data-content-ready'),
      null,
      { timeout: 15000 }
    ).catch(() => {});
    await page.waitForTimeout(1000);
    const dups = await page.evaluate(() => {
      const counts = {};
      for (const el of document.querySelectorAll('[id]')) counts[el.id] = (counts[el.id] || 0) + 1;
      return Object.entries(counts).filter(([, n]) => n > 1).map(([id, n]) => `${id} (${n}x)`);
    });
    if (dups.length) problems.push(`duplicate id after render: ${dups.join(', ')}`);
  } catch (e) {
    problems.push(`navigation: ${e.message.split('\n')[0]}`);
  }

  await ctx.close();
  return { path, problems };
}

const queue = pages.slice();
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
    results.push(await visit(next));
  }
}));
results.sort((a, b) => a.path.localeCompare(b.path));

let failures = 0;
let ignored = 0;
const fired = new Set();
for (const { path, problems } of results) {
  if (!problems.length) continue;
  const reason = IGNORE.get(path);
  if (reason) {
    ignored++;
    fired.add(path);
    console.log(`[skip] ${path}`);
    console.log(`       ${reason}`);
    for (const p of problems) console.log(`       - ${p}`);
    continue;
  }
  failures++;
  console.log(`[FAIL] ${path}`);
  for (const p of problems) console.log(`       - ${p}`);
}

await browser.close();
server.close();

/* An ignore entry that stopped matching means the problem it describes is
   gone. Leaving it behind is how the next reader concludes a page is broken
   when it is not. */
for (const [path, reason] of IGNORE) {
  if (fired.has(path)) continue;
  failures++;
  console.log(`[FAIL] ${path} is on the ignore list but loaded clean.`);
  console.log(`       Remove the entry — "${reason}" no longer applies.`);
}

const clean = results.length - failures - ignored;
console.log(`\n${clean} of ${results.length} pages loaded clean` + (ignored ? `, ${ignored} ignored with a reason` : '') + '.');

if (failures) {
  console.error(`\n${failures} page(s) reported a runtime problem.`);
  if (check) process.exit(1);
} else {
  console.log('No runtime errors, failed same-origin requests or duplicate ids.');
}
