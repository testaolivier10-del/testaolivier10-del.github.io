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

   Ignoring them was not enough: they are now BLOCKED before they leave the
   browser. The one intermittent failure this check ever produced was two
   lesson pages timing out at page.goto — 'load' waits for every subresource,
   and a third-party script that hangs holds the whole page past 30 s. That
   is exactly the kind of failure the paragraph above says must not fail the
   build, and it did. Aborting cross-origin requests at the route makes the
   run deterministic (every page sees the same "CDN unreachable" it would see
   offline, which every script on the site already tolerates) and faster,
   since no page waits on a network it is not being judged on.

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
    if (name.startsWith('.') || name === 'node_modules' || name === 'scripts') continue; // .git, .claude (agent worktrees)
    const full = join(dir, name);
    // anatomy-physiology/data holds A&P sources (notes are HTML fragments).
    if (statSync(full).isDirectory()) { if (!full.endsWith(join('anatomy-physiology', 'data')) && !full.endsWith(join('bio', 'data'))) walk(full, out); }
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

const PORT = Number(process.env.CHECK_CONSOLE_PORT || process.env.CONSOLE_PORT) || 8732;
const ORIGIN = `http://localhost:${PORT}`;
/* The thirteen redirect stubs at the site root are a <meta http-equiv="refresh">
   and one link, no script at all, and each one's target is itself in this
   list. Loading a stub tested nothing and produced the check's only remaining
   intermittent failure: Playwright's own injected evaluation occasionally
   lands while the meta refresh is navigating away, and Chromium reports it
   as a CSP "unsafe-eval" refusal on a page that contains no JavaScript. */
const isRedirectStub = (f) => /<meta http-equiv="refresh"/i.test(readFileSync(f, 'utf8'));
const pages = walk(ROOT).filter((f) => !isRedirectStub(f)).map((f) => '/' + relative(ROOT, f).split(/[\\/]/).join('/'));
pages.sort();

const server = await serve(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

console.log(`Loading ${pages.length} pages in Chromium.\n`);

/* Pages are independent, so they run several at a time — serially this is four
   minutes, which is long enough that somebody starts skipping it. Eight rather
   than six because the per-page cost is now mostly Chromium's own parse and
   layout rather than waiting on the network, and the CI runner has the cores
   for it. */
const CONCURRENCY = 8;
const results = [];

async function visit(path) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const problems = [];
  const sameOrigin = (url) => url.startsWith(ORIGIN);

  // Everything off this origin is dropped at the route. See the header: the
  // check never judged these requests, and letting them run made it flaky.
  await page.route((url) => !sameOrigin(url.href), (route) => route.abort('blockedbyclient'));

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
    // Deferred scripts and DOMContentLoaded handlers have all run by 'load',
    // and a page that fetches its content has just said so above. What is
    // left is microtask and animation-frame work, which is milliseconds; a
    // quarter second is generous for that, where the full second this used
    // to wait was a third of the whole run spent asleep.
    await page.waitForTimeout(250);
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

/* Flows: a page that loads clean can still fail at the one thing it is for.
   A&P course search once caught its own error and only printed "The search
   engine did not load" (a name collision with site-chrome.js, audit 2026-10
   fix 6), which no listener above sees. So this types a query into the search
   box on the A&P Learn page, follows the form to the course search page and
   requires results there. */
async function flowAnpSearch() {
  const path = '/anatomy-physiology/learn.html → search';
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const problems = [];
  await page.route((url) => !url.href.startsWith(ORIGIN), (route) => route.abort('blockedbyclient'));
  page.on('pageerror', (e) => problems.push(`uncaught exception: ${e.message.split('\n')[0]}`));
  try {
    await page.goto(ORIGIN + '/anatomy-physiology/learn.html', { waitUntil: 'load', timeout: 30000 });
    const box = page.locator('form.anp-toc-search input[name="q"]').first();
    await box.fill('sodium', { force: true });
    await Promise.all([page.waitForURL(/search\.html\?q=sodium/, { timeout: 15000 }), box.press('Enter')]);
    await page.waitForSelector('#anp-sr-results .anp-sr-hit', { timeout: 15000 });
    const status = await page.textContent('#anp-sr-status');
    if (/did not load/i.test(status || '')) problems.push(`search status: ${status}`);
  } catch (e) {
    problems.push(`A&P search returned no results: ${e.message.split('\n')[0]}`);
  }
  await ctx.close();
  return { path, problems };
}
results.push(await flowAnpSearch());

/* A&P Practice, Review and Exams load the bank's index, then only the
   chapters a set draws from, and explanations after an answer (audit 2026-10:
   they fetched 54 files first). Each flow runs the page for real and checks
   both that it works and what it fetched. */
async function anpFlow(name, fn) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const problems = [], bank = [];
  await page.route((url) => !url.href.startsWith(ORIGIN), (route) => route.abort('blockedbyclient'));
  page.on('pageerror', (e) => problems.push(`uncaught exception: ${e.message.split('\n')[0]}`));
  page.on('request', (r) => { const m = r.url().match(/assets\/bank\/([\w-]+\.json)/); if (m) bank.push(m[1]); });
  try { await fn(page, bank, problems); } catch (e) { problems.push(`${name}: ${e.message.split('\n')[0]}`); }
  await ctx.close();
  return { path: name, problems };
}
// Answers whatever the question is (first option, or Check as it stands).
async function answerOne(page) {
  const opt = page.locator('.anp-q .anp-opt').first();
  if (await opt.count()) await opt.click();
  const check = page.locator('.anp-q .anp-check');
  if (await check.count() && await check.isVisible()) await check.click();
}
results.push(await anpFlow('/anatomy-physiology/practice.html (flow)', async (page, bank, problems) => {
  await page.goto(ORIGIN + '/anatomy-physiology/practice.html?topic=blood-composition', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.anp-pr-start:not([disabled])', { timeout: 15000 });
  await page.click('.anp-pr-start');
  await page.waitForSelector('.anp-pr-stage .anp-q', { timeout: 15000 });
  if (bank.some((f) => f.endsWith('-why.json'))) problems.push(`explanations fetched before an answer: ${bank.join(', ')}`);
  await answerOne(page);
  await page.waitForSelector('.anp-q-feedback .anp-verdict', { timeout: 15000 });
  const fb = await page.textContent('.anp-q-feedback');
  if (!fb || fb.replace(/\s+/g, ' ').trim().length < 40) problems.push('no explanation after answering');
  const want = ['blood-why.json', 'blood.json', 'index.json'];
  if (bank.slice().sort().join() !== want.join()) problems.push(`fetched ${bank.join(', ')}; expected only ${want.join(', ')}`);
}));
results.push(await anpFlow('/anatomy-physiology/review.html (flow)', async (page, bank, problems) => {
  // One due miss from the urinary chapter, written the way AnpCore stores it.
  await page.addInitScript(() => {
    const t = Date.now() - 60000;
    localStorage.setItem('anp_progress_v1', JSON.stringify({ v: 1, q: { 'anp-nephron-1': { t: 'nephron', k: [], l: 'r', d: 1, n: 1, c: 0, right: 0, seen: t, due: t, ivl: 0, ease: 2.3, lapses: 1, src: 'q' } }, lessons: {} }));
  });
  await page.goto(ORIGIN + '/anatomy-physiology/review.html', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('#app button[data-n]', { timeout: 15000 });
  await page.click('#app button[data-n]');
  await page.waitForSelector('.anp-pr-stage .anp-q', { timeout: 15000 });
  await answerOne(page);
  await page.waitForSelector('.anp-q-feedback .anp-verdict', { timeout: 15000 });
  const want = ['index.json', 'urinary-why.json', 'urinary.json'];
  if (bank.slice().sort().join() !== want.join()) problems.push(`fetched ${bank.join(', ')}; expected only ${want.join(', ')}`);
}));
results.push(await anpFlow('/anatomy-physiology/exams.html (flow)', async (page, bank, problems) => {
  await page.goto(ORIGIN + '/anatomy-physiology/exams.html', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.anp-ex-setup .anp-pr-start:not([disabled])', { timeout: 15000 });
  await page.click('.anp-ex-setup .anp-pr-start');
  await page.waitForSelector('.anp-ex-run .anp-q', { timeout: 15000 });
  if (bank.some((f) => f.endsWith('-why.json'))) problems.push(`explanations fetched during the exam: ${bank.join(', ')}`);
  if (bank.length > 3) problems.push(`a unit quiz fetched ${bank.length} bank files: ${bank.join(', ')}`);
  await answerOne(page);
  await page.click('.anp-ex-finish');
  const yes = page.locator('.anp-ex-yes');
  if (await yes.isVisible()) await yes.click();
  await page.waitForSelector('.anp-ex-results', { timeout: 15000 });
  if (!/Why:/.test(await page.textContent('.anp-ex-results'))) problems.push('the exam review shows no explanations');
}));
/* AP® Biology Practice, once a unit is published: the first published topic's
   set loads the bank index, then that unit's file, and explanations only
   after an answer. Nothing to run before then (bio/assets/notes-index.json
   is empty), so the flow is data-driven like the course itself. */
{
  const idx = join(ROOT, 'bio', 'assets', 'notes-index.json');
  const first = existsSync(idx) ? JSON.parse(readFileSync(idx, 'utf8'))[0] : null;
  if (first) {
    const topic = String(first.file).replace(/^.*[/]notes[/]/, '').replace(/\.html$/, '');
    results.push(await anpFlow('/bio/practice.html (flow)', async (page, bank, problems) => {
      await page.goto(ORIGIN + '/bio/practice.html?topic=' + topic, { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('.bio-pr-start:not([disabled])', { timeout: 15000 });
      await page.click('.bio-pr-start');
      await page.waitForSelector('.bio-pr-stage .bio-q', { timeout: 15000 });
      if (bank.some((f) => f.endsWith('-why.json'))) problems.push(`explanations fetched before an answer: ${bank.join(', ')}`);
      const opt = page.locator('.bio-pr-stage .bio-q .bio-opt').first();
      if (await opt.count()) await opt.click();
      else await page.locator('.bio-pr-stage .bio-q input').first().fill('1');
      const check = page.locator('.bio-pr-stage .bio-q .bio-check').first();
      if (await check.count() && await check.isVisible()) await check.click();
      await page.waitForSelector('.bio-q-feedback .bio-verdict', { timeout: 15000 });
      if (!bank.includes('index.json')) problems.push(`the bank index was not loaded first: ${bank.join(', ')}`);
    }));
  }
}
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
