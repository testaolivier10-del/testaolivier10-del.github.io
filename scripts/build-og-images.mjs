/* Renders the three link-preview cards.

   These are the 1200x630 images an unfurler shows when a LevlPrep link is
   pasted into a chat. There were two of them, both hand-made and both wrong by
   the time anyone looked: the site card still said "Study Hub", a name the
   site has not used in months, and the NREMT card advertised "978 practice
   questions" against a bank that now holds 2,084. Nothing pointed either fact
   at the thing it described, so neither could go stale loudly.

   Ochem had no card at all, which is what prompted this — 80 of its pages now
   carry og:image tags and they needed something to point at.

   So the cards are generated: the copy lives here next to the numbers it
   quotes, the question count is counted rather than typed, and the design
   comes from the site's own tokens instead of a second copy of the palette.

     node scripts/build-og-images.mjs

   Needs Playwright's Chromium, which is a local tool rather than a CI step —
   the PNGs are committed, and they only change when this file does.
*/
import { readFileSync, writeFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

/* Playwright may be a local dependency or installed globally, and a global
   install is not on the resolution path of a script inside this repo — the
   repo has no package.json and no node_modules. So both are tried, and the
   CommonJS entry point is required by path rather than imported: playwright
   has no named ESM export to destructure. */
const require = createRequire(import.meta.url);
const CANDIDATES = [
  'playwright',
  '/opt/node22/lib/node_modules/playwright/index.js',
  '/usr/lib/node_modules/playwright/index.js',
];
let chromium;
for (const id of CANDIDATES) {
  try { ({ chromium } = require(id)); break; } catch { /* try the next */ }
}
if (!chromium) {
  console.error('Playwright is not installed, so the cards cannot be re-rendered.');
  console.error('The committed PNGs are still valid — this only needs to run when');
  console.error('a card\'s copy or design changes.');
  process.exit(1);
}

// Counted, not quoted. The last card claimed a number that had been wrong for
// a thousand questions.
const questionCount = JSON.parse(
  readFileSync('nremt/assets/questions.json', 'utf8')
).length;
/* Counted off disk rather than out of curriculum.js: that file lists modules
   and topics under the same shape, so matching it counts the eighteen module
   headings as lessons too and the card claims 76 where there are 58. The
   lessons are the pages. */
const lessonCount = readdirSync('ochem/lessons').filter((f) => f.endsWith('.html')).length;

const CARDS = [
  {
    out: 'assets/og-image.png',
    badge: 'Free · No paywall',
    brand: 'LevlPrep',
    title: 'Free practice tools for certification exams',
    sub: 'Real question banks and interactive courses, with honest practice conditions.',
  },
  {
    out: 'nremt/assets/og-image.png',
    badge: 'Free · No account needed',
    brand: 'LevlPrep',
    title: 'NREMT-EMT Practice Exam & Study Tools',
    sub: `${questionCount.toLocaleString('en-US')} practice questions, timed exams, scenarios and a 3D body map — free, right in your browser.`,
  },
  {
    out: 'ochem/assets/og-image.png',
    badge: 'Free · No account needed',
    brand: 'LevlPrep',
    title: 'Organic Chemistry, learned by doing the mechanisms',
    sub: `${lessonCount} interactive lessons where you push the arrows yourself, with instant feedback.`,
  },
];

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/* The card, in the site's own visual language: paper panel, 3px ink outline,
   the hard mint offset that every .card on the site has, on the deep teal the
   header uses. Fonts are the two the site loads, with a system stack behind
   them so a card still renders if Google Fonts is unreachable. */
const page = (c) => `<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=IBM+Plex+Mono:wght@600;700&display=swap">
<style>
  :root{
    --navy:#16332E; --paper:#F2EEE6; --ink:#16241F; --muted:#5F7770;
    --mint:#7FD9C4; --accent-bright:#2C9C8B;
    --ui:"Nunito",system-ui,-apple-system,"Segoe UI",sans-serif;
    --mono:"IBM Plex Mono",ui-monospace,"SFMono-Regular",Menlo,monospace;
  }
  *{box-sizing:border-box;margin:0;}
  body{
    width:1200px;height:630px;background:var(--navy);
    /* The dot grid from the old cards, kept — it is the one piece of them
       that was not a stale fact. */
    background-image:radial-gradient(var(--accent-bright) 1.5px,transparent 1.5px);
    background-size:34px 34px;
    display:flex;align-items:center;justify-content:center;padding:44px;
    font-family:var(--ui);
  }
  .card{
    position:relative;width:100%;height:100%;
    background:var(--paper);border:3px solid var(--ink);border-radius:22px;
    padding:56px 64px;display:flex;flex-direction:column;
    box-shadow:14px 14px 0 var(--mint);
  }
  .badge{
    position:absolute;top:52px;right:60px;
    background:var(--navy);color:var(--mint);
    font:700 17px var(--mono);letter-spacing:.06em;text-transform:uppercase;
    padding:12px 22px;border-radius:999px;
  }
  .brand{display:flex;align-items:center;gap:16px;margin-bottom:30px;}
  .mark{
    width:52px;height:52px;border-radius:14px;background:var(--navy);
    color:var(--mint);font:900 32px var(--ui);
    display:flex;align-items:center;justify-content:center;
  }
  .brand span{font:800 30px var(--ui);color:var(--ink);}
  h1{
    font:900 62px/1.08 var(--ui);color:var(--ink);
    letter-spacing:-.02em;max-width:17ch;margin-bottom:26px;
  }
  p{font:800 25px/1.4 var(--ui);color:var(--muted);max-width:38ch;}
</style></head><body>
  <div class="card">
    <div class="badge">${esc(c.badge)}</div>
    <div class="brand"><div class="mark">+</div><span>${esc(c.brand)}</span></div>
    <h1>${esc(c.title)}</h1>
    <p>${esc(c.sub)}</p>
  </div>
</body></html>`;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
const tab = await ctx.newPage();
const dir = mkdtempSync(join(tmpdir(), 'og-'));

for (const card of CARDS) {
  const file = join(dir, 'card.html');
  writeFileSync(file, page(card));
  await tab.goto(`file://${file}`);
  // Wait for the web fonts, or the card is screenshotted in the fallback
  // stack and the metrics are wrong — the headline wraps somewhere else.
  await tab.evaluate(() => document.fonts.ready);
  await tab.screenshot({ path: card.out, type: 'png' });
  console.log(`${card.out}`);
}

await browser.close();
