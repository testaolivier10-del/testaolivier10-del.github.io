/* Accessibility, checked rather than remembered.

   The README argues carefully about three things — the skip link, the answer
   announcements, the reduced-motion rule — and every one of them is defended
   only by whoever last read that section. `check-site.mjs` proves the site is
   WIRED correctly; nothing proved it was USABLE. A colour that fails contrast,
   a button that is an unlabelled icon, a form control with no accessible name,
   a landmark that went missing when a page was copied from another one: none
   of that throws, none of it breaks a link, and all of it is invisible to
   somebody who is not the person it locks out.

   This runs axe-core over a sample of real pages in a real browser, plus three
   checks axe cannot make because they are about this site's own decisions.

   WHAT IT FAILS ON
   ----------------
   Serious and critical violations only. Minor and moderate are reported and do
   not fail, because a rule at that level is often a judgement call and a check
   that cries wolf gets disabled within a month — which costs more than it ever
   caught. Promote one to the failing list by adding its id to MUST_FIX.

   WHY IT IS A SEPARATE CI JOB
   ---------------------------
   It needs a browser. check-site.mjs is deliberately dependency-free and runs
   in seconds on every push; this takes a minute and installs two packages, so
   it runs alongside rather than in front. A slow check bolted onto a fast one
   makes the fast one slow, and the fast one is the one people wait for.

     node scripts/check-a11y.mjs            report everything
     node scripts/check-a11y.mjs --check    exit non-zero on a real violation

   Locally it needs `npm i --no-save playwright axe-core` once (and Chromium,
   via `npx playwright install chromium`). CI does exactly that.
*/
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');
const require = createRequire(import.meta.url);

/* One page per SHAPE of page, not one per page. These thirteen cover every
   template on the site: if a lesson is accessible, all 58 built on the same
   engine are, and a violation in one of them is a violation in the engine. */
const PAGES = [
  ['/', 'the hub'],
  ['/nremt/', 'a course home'],
  ['/nremt/practice.html', 'the question bank'],
  ['/nremt/dashboard.html', 'a dashboard with charts'],
  ['/nremt/study-notes.html', 'a long reading page'],
  ['/nremt/search.html', 'a search page'],
  ['/ochem/', 'the other course home'],
  ['/ochem/learn.html', 'the textbook'],
  ['/ochem/search.html', 'the other search page'],
  ['/ochem/lessons/pka.html', 'a lesson'],
  ['/ochem/mechanisms/e2.html', 'a mechanism walkthrough'],
  ['/ochem/flashcards.html', 'a flashcard deck with filters'],
  // The tools are a template of their own — shared chrome from tool-shell.js,
  // a quiz from tool-quiz.js — and none was on this list. The roadmap stands
  // in for all eight: it renders the shell, the quiz and a page of controls.
  ['/ochem/tools/reagent-roadmap.html', 'an interactive tool'],
  ['/privacy.html', 'a prose page with controls'],
];

/* Rules that fail the build regardless of how axe rates them, because this
   site has already decided they matter. Everything else fails only at serious
   or critical. */
const MUST_FIX = new Set([
  'color-contrast',      // the whole point of having two themes
  'button-name',         // the header is mostly icon buttons
  'link-name',
  'label',
  'aria-allowed-attr',
  'aria-required-attr',
  'html-has-lang',
]);

/* Rules switched off, each with the reason. A disabled rule with no reason is
   how a suite stops meaning anything. */
const OFF = {
  // Every page renders its header into an empty <div> at runtime, so the
  // landmark structure axe sees before that happens is not the page. The
  // "landmarks present" checks below run after the header has rendered and
  // cover the same ground more honestly.
  'region': 'content is placed into runtime-rendered landmarks; checked separately below',
};

/* Advisories that are known, understood and deliberately not fixed. They still
   print on every run — this is a note for whoever reads the output, not a
   silencer.

   landmark-contentinfo-is-top-level
     site-chrome.js marks the page's content wrapper role="main", which is what
     gave 176 pages a main landmark they did not have. On most pages the footer
     sits inside that wrapper, and <main> is not sectioning content, so the
     footer still computes as contentinfo and is now nested inside main. The
     alternative was to move the footer out of the wrapper on every page, which
     is DOM surgery under CSS that was written around the current structure —
     a real risk of breaking layout to fix a moderate advisory, in exchange for
     a main landmark that is unambiguously worth having.

   heading-order / aria-allowed-role
     Pre-existing, moderate, and in content rather than in the chrome. Worth
     fixing, not worth failing a build over. */

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary',
};

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

let chromium, axeSource;
try {
  ({ chromium } = await import('playwright'));
  axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
} catch (e) {
  console.error('This check needs playwright and axe-core:');
  console.error('  npm i --no-save playwright axe-core && npx playwright install chromium');
  console.error(`(${e.message})`);
  // Not a failure. A contributor without them installed should still be able
  // to run everything else; CI installs them and does not take this branch.
  process.exit(0);
}

const PORT = 8731;
const server = await serve(PORT);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});

let failures = 0;
let advisories = 0;

/* Three things axe cannot check, because they are about decisions this site
   made rather than about HTML in general. All three are mounted by
   site-chrome.js, so all three break for every page at once if they break. */
async function siteChecks(page, label) {
  const found = [];

  const skip = await page.evaluate(() => {
    const link = document.querySelector('a.skip-link, .skip-link');
    if (!link) return { ok: false, why: 'no skip link' };
    const target = document.querySelector(link.getAttribute('href') || '#nope');
    if (!target) return { ok: false, why: 'the skip link points at nothing: ' + link.getAttribute('href') };
    // display:none is not focusable, which is why it is parked off-screen with
    // a transform instead — a skip link that cannot receive focus can never be
    // revealed by the focus that is supposed to reveal it.
    const hidden = getComputedStyle(link).display === 'none' || getComputedStyle(link).visibility === 'hidden';
    if (hidden) return { ok: false, why: 'the skip link is display:none or visibility:hidden, so it can never take focus' };
    // Landing on an element with no tabindex moves the viewport but leaves the
    // keyboard in the header, so the next Tab returns to the first nav tab —
    // the exact loop the link exists to break.
    if (!target.hasAttribute('tabindex')) {
      return { ok: false, why: 'the skip link target has no tabindex="-1", so focus stays in the header' };
    }
    return { ok: true };
  });
  if (!skip.ok) found.push(skip.why);

  const landmarks = await page.evaluate(() => ({
    main: !!document.querySelector('main, [role="main"]'),
    nav: !!document.querySelector('nav, [role="navigation"]'),
    // Only a course page has section tabs. The hub, the privacy policy and the
    // other standalone pages carry a header of one brand link and a theme
    // toggle, and declaring that a navigation landmark would add an entry to
    // a screen reader's landmark list that leads nowhere — landmark noise is
    // its own accessibility problem, so the check does not ask for one.
    hasTabs: !!document.querySelector('.course-nav'),
  }));
  if (!landmarks.main) found.push('no <main> landmark after the header rendered');
  if (landmarks.hasTabs && !landmarks.nav) found.push('section tabs rendered, but no <nav> landmark around them');

  const lang = await page.evaluate(() => document.documentElement.lang);
  if (!lang) found.push('<html> has no lang attribute');

  if (found.length) {
    failures += found.length;
    console.log(`\n  SITE CHECKS FAILED on ${label}:`);
    for (const f of found) console.log(`    - ${f}`);
  }
  return found.length === 0;
}

console.log(`Checking ${PAGES.length} page shapes with axe-core.\n`);

for (const [path, what] of PAGES) {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  try {
    await page.goto(`http://127.0.0.1:${PORT}${path}`, { waitUntil: 'domcontentloaded' });

    /* Wait for the chrome to actually be there rather than for a number of
       milliseconds. The header, the skip link, the tutor and the announcer all
       mount after load, and a page that fetches a megabyte on the way (either
       search page) can still be assembling itself when a fixed timeout
       expires — which showed up exactly once in four runs as a page "failing"
       for a landmark that appeared a moment later. A check that fails one run
       in four is a check that gets ignored, and an accessibility suite nobody
       trusts is worse than none. */
    await page.waitForFunction(
      () => document.querySelector('.skip-link') &&
            document.querySelector('main, [role="main"]'),
      null,
      { timeout: 15000 }
    ).catch(() => { /* genuinely missing: the site checks below will say so */ });

    /* A page whose content arrives over the network says so, and says when it
       has arrived. study-notes.html is the first: its forty chapters are a
       fetched JSON file now, and without this the 400 ms below would sometimes
       audit a "Loading the notes…" paragraph instead of the notes. Waiting on
       the page's own signal beats guessing at a longer timeout. */
    await page.waitForFunction(
      () => !document.documentElement.hasAttribute('data-content-async') ||
            document.documentElement.hasAttribute('data-content-ready'),
      null,
      { timeout: 15000 }
    ).catch(() => { /* audit whatever did render, and report on that */ });

    // A short settle for anything mounted in the same tick as the above.
    await page.waitForTimeout(400);

    await page.addScriptTag({ content: axeSource });
    const results = await page.evaluate(async (off) => {
      const rules = {};
      Object.keys(off).forEach((id) => { rules[id] = { enabled: false }; });
      return await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
        rules,
        resultTypes: ['violations'],
      });
    }, OFF);

    const hard = results.violations.filter(
      (v) => MUST_FIX.has(v.id) || v.impact === 'serious' || v.impact === 'critical');
    const soft = results.violations.filter((v) => !hard.includes(v));

    const ok = await siteChecks(page, path);
    const mark = hard.length ? 'FAIL' : ok ? ' ok ' : 'FAIL';
    console.log(`[${mark}] ${path.padEnd(32)} ${what}`);

    for (const v of hard) {
      failures++;
      console.log(`\n  ${v.impact.toUpperCase()}: ${v.id} — ${v.help}`);
      console.log(`    ${v.helpUrl}`);
      for (const node of v.nodes.slice(0, 3)) {
        console.log(`    at  ${node.target.join(' ')}`);
        const detail = (node.failureSummary || '').split('\n').filter(Boolean).slice(1, 3);
        for (const d of detail) console.log(`        ${d.trim()}`);
      }
      if (v.nodes.length > 3) console.log(`    ...and ${v.nodes.length - 3} more`);
    }
    for (const v of soft) {
      advisories++;
      console.log(`  (advisory) ${v.id}: ${v.help} — ${v.nodes.length} element(s)`);
    }

    // A page that throws on load is broken in a way that makes every other
    // result here meaningless, so it is worth saying out loud even though it
    // is not an accessibility finding.
    if (pageErrors.length) {
      console.log(`  (page errors) ${pageErrors.slice(0, 2).join(' | ')}`);
    }
  } catch (e) {
    failures++;
    console.log(`[FAIL] ${path.padEnd(32)} could not be checked: ${e.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
server.close();

console.log('');
for (const [id, why] of Object.entries(OFF)) console.log(`Rule "${id}" is off: ${why}`);
if (advisories) console.log(`\n${advisories} advisory finding(s) — reported, not failing.`);

if (failures) {
  console.error(`\n${failures} accessibility failure(s).`);
  if (check) process.exit(1);
} else {
  console.log(`\nNo serious or critical accessibility violations across ${PAGES.length} page shapes.`);
}
