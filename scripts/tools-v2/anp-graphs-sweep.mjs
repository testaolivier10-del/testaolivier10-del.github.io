#!/usr/bin/env node
/* Sweep test for the A&P Graphs v2 Explore (docs/tools-v2-anp-graphs-brief.md; docs/tools-v2-builder-brief.md step 5).
   Every landmark state of the five drawn screens at ten widths: nothing clipped, no labels overlapping (on the picture
   and on the graph), the first-visit cue covering no label, the drawn part the largest thing on the stage, the cause
   line at most two rows on phones with one constant height, no sideways scroll, no console errors.

   Needs a static server at the repo root and Chromium:
     python3 -m http.server 8923 --bind 127.0.0.1 &
     node scripts/tools-v2/anp-graphs-sweep.mjs [--port 8923] [--shots <dir>] [--dark]
   The tool is Premium: the test (never the page) unlocks it by serving assets/premium.js with has() answering true. */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const PORT = arg('--port', '8923'), SHOTS = arg('--shots', ''), DARK = process.argv.includes('--dark');
const WIDTHS = [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
const STATES = {
  heart: [0.03, 0.12, 0.22, 0.3, 0.45, 0.55, 0.62, 0.75],
  lungs: [2, 4, 9.5, 12, 15, 17, 18, 19.5, 25],
  rbc: [100, 80, 60, 40, 27, 20, 5, 0],
  axon: [0, 1, 2.7, 3.1, 3.47, 3.8, 4.5, 6, 7.5],
  sarcomere: [60, 70, 78, 85, 100, 110, 140, 170, 180]
};
const exe = '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: exe });
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
let fails = 0, checks = 0;
const fail = (m) => { fails++; console.log('FAIL ' + m); };

for (const w of WIDTHS) {
  const h = w < 500 ? 844 : w < 900 ? 1024 : w >= 1900 ? 1080 : 900;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', hasTouch: w < 900 });
  await ctx.route('**/assets/premium.js', (r) => r.fulfill({ contentType: 'application/javascript',
    body: readFileSync(join(ROOT, 'assets/premium.js'), 'utf8').replace('function has(course) {', 'function has(course) { return true;') }));
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await ctx.addInitScript((d) => { try { localStorage.setItem('nremt_theme', d ? 'dark' : 'light'); } catch (e) {} }, DARK);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  await page.goto(`http://127.0.0.1:${PORT}/anatomy-physiology/tools/graphs.html`, { waitUntil: 'load' });
  for (let i = 0; i < 150 && !(await page.evaluate(() => !!(window.AnpGraphExplore && window.AnpGraphExplore.current && document.querySelector('.gx-gsvg text')))); i++) await page.waitForTimeout(100);
  await page.waitForTimeout(500);

  // the first visit cue covers no label or number
  const cue = await page.evaluate(() => {
    const c = document.querySelector('.tk2-cue'); if (!c) return { none: true };
    const r = c.getBoundingClientRect(), hits = [];
    document.querySelectorAll('.gx-cname, .gx-alab, .gx-tick, .gx-hl-t, .gx-band-t, .gx-lab, .gx-num').forEach((e) => {
      const q = e.getBoundingClientRect();
      if (q.width && q.left < r.right - 1 && q.right > r.left + 1 && q.top < r.bottom - 1 && q.bottom > r.top + 1) hits.push(e.textContent.trim());
    });
    return { hits, out: r.left < -1 || r.right > innerWidth + 1 };
  });
  checks++;
  if (cue.none) fail(`${w}: no first-visit cue`);
  else { if (cue.hits.length) fail(`${w}: the cue covers ${cue.hits.join(', ')}`); if (cue.out) fail(`${w}: the cue sticks out of the screen`); }

  const heights = [];
  for (const tab of Object.keys(STATES)) {
    await page.evaluate((t) => window.AnpGraphExplore.current.tab(t), tab);
    await page.waitForTimeout(120);
    for (const x of STATES[tab]) {
      await page.evaluate((v) => { const i = document.querySelector('.gx-plot .tk2-in'); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); }, x);
      await page.waitForTimeout(650);
      const r = await page.evaluate(() => {
        const out = [], box = (e) => e.getBoundingClientRect();
        const inter = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
        const pic = document.querySelector('.gx-pic'), plot = document.querySelector('.gx-plot'), stage = document.querySelector('.gx');
        const pr = box(pic), gr = box(plot);
        // picture labels: inside the picture, apart from each other
        const labs = [...pic.querySelectorAll('.gx-lab rect, .gx-num text')].map((e) => ({ t: e.closest('[data-lab]').getAttribute('data-lab'), r: box(e) }));
        labs.forEach((a) => { if (a.r.left < pr.left - 1 || a.r.right > pr.right + 1 || a.r.top < pr.top - 1 || a.r.bottom > pr.bottom + 1) out.push('clipped label ' + a.t); });
        for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) if (inter(labs[i].r, labs[j].r)) out.push('labels overlap: ' + labs[i].t + ' / ' + labs[j].t);
        // graph text: inside the graph box, apart from each other
        const gt = [...plot.querySelectorAll('.gx-cname, .gx-alab, .gx-tick, .gx-hl-t, .gx-band-t, .gx-reg-t')].map((e) => ({ t: e.textContent, r: box(e) }));
        gt.forEach((a) => { if (a.r.left < gr.left - 1 || a.r.right > gr.right + 1 || a.r.top < gr.top - 1 || a.r.bottom > gr.bottom + 1) out.push('clipped graph text ' + a.t); });
        for (let i = 0; i < gt.length; i++) for (let j = i + 1; j < gt.length; j++) if (inter(gt[i].r, gt[j].r)) out.push('graph text overlaps: ' + gt[i].t + ' / ' + gt[j].t);
        // the drawn part is the largest thing on the stage
        const area = (r) => r.width * r.height;
        [...stage.children].forEach((c) => { if (c.classList.contains('gx-scene') || !c.offsetWidth) return; if (area(box(c)) > area(pr)) out.push('larger than the picture: ' + c.className); });
        if (area(gr) > area(pr) * 1.02) out.push('graph larger than the picture');
        if (stage.scrollWidth > stage.clientWidth + 1) out.push('stage scrolls sideways');
        if (document.documentElement.scrollWidth > innerWidth + 1) out.push('page scrolls sideways');
        const pills = [...document.querySelectorAll('.gx .tk2-cause .tk2-cz')];
        const rows = new Set(pills.map((p) => Math.round(p.getBoundingClientRect().top))).size;
        return { out, rows, lines: Math.round(box(document.querySelector('.gx-lines')).height) };
      });
      checks++;
      r.out.forEach((m) => fail(`${w} ${tab} x=${x}: ${m}`));
      if (w < 640 && r.rows > 2) fail(`${w} ${tab} x=${x}: cause line has ${r.rows} rows`);
      heights.push(r.lines);
    }
    if (SHOTS) await (await page.$('.gx')).screenshot({ path: join(SHOTS, `${tab}-${w}${DARK ? '-dark' : ''}.png`) });
  }
  if (w < 640 && new Set(heights).size > 1) fail(`${w}: cause line height changes (${[...new Set(heights)].join(', ')} px)`);
  errs.forEach((e) => fail(`${w}: console error ${e}`));
  await ctx.close();
}
await browser.close();
console.log(`${checks} states checked at ${WIDTHS.length} widths${DARK ? ' (dark)' : ''}: ${fails ? fails + ' problems' : 'clean'}`);
process.exit(fails ? 1 : 0);
