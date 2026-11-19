#!/usr/bin/env node
/* Sweep test for the A&P Predict the change v2 Explore (docs/tools-v2-anp-predict-brief.md; docs/tools-v2-builder-brief.md
   step 5). Every screen at its usual setting, both ends, points between and moments while a change is still spreading,
   at ten widths and two short laptop screens: nothing clipped, no labels overlapping each other, the knob, its tag, its
   "before" tick or Start over (4 px apart), no rendered text under 11 px, label text fitting its pill, the first-visit
   cue covering no label, tab names fitting, the picture the largest thing and using the stage's width, the cause line
   at most two rows on phones with one constant height and on screen, no sideways scroll, no console errors.

   Needs a static server at the repo root and Chromium:
     python3 -m http.server 8931 --bind 127.0.0.1 &
     node scripts/tools-v2/anp-predict-sweep.mjs [--port 8931] [--shots <dir>] [--dark] [--width 390]
   Run one width per process (--width) for long sweeps. The frame by frame checks of picture against words are in
   anp-predict-frames.mjs. The tool is Premium: the test (never the page) unlocks it by serving assets/premium.js with
   has() answering true. */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const PORT = arg('--port', '8931'), SHOTS = arg('--shots', ''), DARK = process.argv.includes('--dark');
const ALL = ['360', '390', '430', '600', '768', '820', '1024', '1280', '1440', '1920', '1366x768', '1280x720'];
const WIDTHS = arg('--width', '') ? [arg('--width', '')] : ALL;
// settled values, then [from, to, ms] moments of a change still spreading
const STATES = {
  vessel: [1, 0.5, 0.75, 1.3, 1.1, [1, 0.5, 120], [1, 0.5, 400], [1, 0.5, 900], [0.5, 1.3, 300]],
  breath: [12, 8, 10, 16, 24, [12, 24, 200], [12, 24, 700], [12, 8, 500], [24, 8, 1200]],
  adh: [0.35, 0, 0.15, 0.6, 1, [0.35, 1, 300], [0.35, 1, 900], [0.35, 0, 600], [1, 0, 1500]],
  heart: [120, 90, 105, 140, 160, [120, 160, 300], [120, 160, 900], [120, 90, 600], [160, 90, 1500]]
};
const exe = '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: exe });
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
let fails = 0, checks = 0;
const fail = (m) => { fails++; console.log('FAIL ' + m); };

for (const ws of WIDTHS) {
  const w = +String(ws).split('x')[0], h = String(ws).includes('x') ? +String(ws).split('x')[1] : w < 500 ? 844 : w < 900 ? 1024 : w >= 1900 ? 1080 : 900;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', hasTouch: w < 900 });
  await ctx.route('**/assets/premium.js', (r) => r.fulfill({ contentType: 'application/javascript',
    body: readFileSync(join(ROOT, 'assets/premium.js'), 'utf8').replace('function has(course) {', 'function has(course) { return true;') }));
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await ctx.addInitScript((d) => { try { localStorage.setItem('nremt_theme', d ? 'dark' : 'light'); } catch (e) {} }, DARK);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  await page.goto(`http://127.0.0.1:${PORT}/anatomy-physiology/tools/predict.html`, { waitUntil: 'load' });
  for (let i = 0; i < 150 && !(await page.evaluate(() => !!(window.AnpPredictExplore && window.AnpPredictExplore.current && document.querySelector('.px-lab')))); i++) await page.waitForTimeout(100);
  await page.waitForTimeout(700);

  // the first visit cue covers no label, the knob's tag or Start over, and stays on screen
  const cue = await page.evaluate(() => {
    const c = document.querySelector('.tk2-cue'); if (!c) return { none: true };
    const r = c.getBoundingClientRect(), hits = [];
    document.querySelectorAll('.px-pic > svg.px-fxsvg .px-lab rect, .px-reset, .px .tk2-handle .tk2-tag:not([hidden])').forEach((e) => {
      const q = e.getBoundingClientRect();
      if (q.width && q.left < r.right - 1 && q.right > r.left + 1 && q.top < r.bottom - 1 && q.bottom > r.top + 1) hits.push((e.closest('.px-lab') || e).textContent.trim());
    });
    const pic = document.querySelector('.px-pic').getBoundingClientRect();
    return { hits, out: r.left < pic.left - 1 || r.right > pic.right + 1 };
  });
  checks++;
  if (cue.none) fail(`${ws}: no first-visit cue`);
  else { if (cue.hits.length) fail(`${ws}: the cue covers ${cue.hits.join(', ')}`); if (cue.out) fail(`${ws}: the cue sticks out of the picture`); }
  const tabs = await page.evaluate(() => [...document.querySelectorAll('.px .tk2-tab')].map((b) => {
    const r = b.getBoundingClientRect(), vis = [...b.querySelectorAll('*')].filter((e) => e.offsetWidth && !e.children.length).map((e) => e.getBoundingClientRect());
    const l = Math.min(...vis.map((q) => q.left)), rr = Math.max(...vis.map((q) => q.right));
    return { name: b.innerText.trim(), over: vis.length ? (l < r.left + 4 || rr > r.right - 4) : b.scrollWidth > b.clientWidth + 1 };
  }));
  checks++;
  tabs.forEach((t) => { if (t.over) fail(`${ws}: tab "${t.name}" does not fit`); });
  await page.evaluate(() => { const c = document.querySelector('.tk2-cue'); if (c) c.remove(); });

  const heights = [];
  for (const tab of Object.keys(STATES)) {
    await page.evaluate((t) => window.AnpPredictExplore.current.tab(t), tab);
    await page.waitForTimeout(200);
    const shots = [];
    for (const s of STATES[tab]) {
      if (Array.isArray(s)) await page.evaluate((a) => window.AnpPredictExplore.current._frame(a[0], a[1], a[2]), s);
      else await page.evaluate((v) => window.AnpPredictExplore.current._settle(v), s);
      await page.waitForTimeout(120);
      const r = await page.evaluate(() => {
        const out = { clip: [], over: [], fit: [], small: [] };
        const pic = document.querySelector('.px-pic').getBoundingClientRect();
        const boxes = [];
        const inPic = (q) => q.left >= pic.left - 0.5 && q.right <= pic.right + 0.5 && q.top >= pic.top - 0.5 && q.bottom <= pic.bottom + 0.5;
        document.querySelectorAll('.px-pic > svg.px-fxsvg .px-labs .px-lab').forEach((g) => {
          const q = g.querySelector('rect').getBoundingClientRect(), t = g.querySelector('text').getBoundingClientRect();
          const n = 'label ' + g.getAttribute('data-lab');
          boxes.push({ n, q });
          if (!inPic(q)) out.clip.push(n);
          if (t.left < q.left - 0.5 || t.right > q.right + 0.5) out.fit.push(n);
          const fs = parseFloat(getComputedStyle(g.querySelector('text')).fontSize) * (document.querySelector('svg.px-svg').getBoundingClientRect().width / document.querySelector('svg.px-svg').viewBox.baseVal.width);
          if (fs < 10.95) out.small.push(n + ' ' + fs.toFixed(1) + 'px');
        });
        const reset = document.querySelector('.px-reset');
        if (reset && reset.offsetWidth) { const q = reset.getBoundingClientRect(); boxes.push({ n: 'Start over', q }); if (!inPic(q)) out.clip.push('Start over'); }
        const knob = document.querySelector('.px-pic .tk2-knob .tk2-dot');
        if (knob) { const q = knob.getBoundingClientRect(); boxes.push({ n: 'knob', q }); if (!inPic(q)) out.clip.push('knob'); }
        document.querySelectorAll('.px-pic .tk2-handle .tk2-tag, .px-pic .tk2-handle .tk2-before').forEach((e) => {
          if (e.hidden || !e.offsetWidth) return;
          const q = e.getBoundingClientRect(), n = e.classList.contains('tk2-tag') ? 'tag' : 'before';
          boxes.push({ n, q });
          if (!inPic(q)) out.clip.push(n);
          const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 10.95 && e.textContent.trim()) out.small.push(n + ' ' + fs + 'px');
        });
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i].q, b = boxes[j].q, g = 4;
          if ((boxes[i].n === 'knob' && boxes[j].n === 'before') || (boxes[i].n === 'before' && boxes[j].n === 'knob')) continue;   // the tick sits under the knob when the value is back at the start
          if (a.left < b.right + g && a.right > b.left - g && a.top < b.bottom + g && a.bottom > b.top - g) out.over.push(boxes[i].n + ' / ' + boxes[j].n);
        }
        const stage = document.querySelector('.px'), area = (e) => { const q = e.getBoundingClientRect(); return q.width * q.height; };
        const others = [...stage.children].filter((e) => !e.classList.contains('px-main') && e.offsetWidth).map(area);
        const pr = document.querySelector('.px-pic').getBoundingClientRect(), sr = stage.getBoundingClientRect();
        out.wide = pr.width / sr.width;
        out.big = area(document.querySelector('.px-pic')) >= Math.max(...others);
        const ln = document.querySelector('.px-lines'), cz = ln.querySelector('.tk2-cause');
        let rows;
        if (cz.classList.contains('is-take')) { const rg = document.createRange(); rg.selectNodeContents(cz); rows = new Set([...rg.getClientRects()].filter((q) => q.width > 1).map((q) => Math.round(q.top / 6))).size; }
        else { const pills = [...ln.querySelectorAll('.tk2-cz')].filter((e) => e.offsetWidth); rows = new Set(pills.map((e) => Math.round(e.getBoundingClientRect().top / 6))).size; }
        out.lines = { h: Math.round(ln.getBoundingClientRect().height), rows, t: ln.innerText.replace(/\s+/g, ' ') };
        out.scroll = document.scrollingElement.scrollWidth - innerWidth;
        out.lineOff = ln.getBoundingClientRect().bottom + scrollY - innerHeight;
        return out;
      });
      checks++;
      const tag = `${ws}${DARK ? ' dark' : ''} ${tab} @${JSON.stringify(s)}`;
      if (r.clip.length) fail(`${tag}: clipped ${r.clip.join(', ')}`);
      if (r.over.length) fail(`${tag}: overlap ${r.over.join('; ')}`);
      if (r.fit.length) fail(`${tag}: text does not fit ${r.fit.join(', ')}`);
      if (r.small.length) fail(`${tag}: text under 11 px ${r.small.join(', ')}`);
      if (!r.big) fail(`${tag}: the picture is not the largest thing`);
      if (r.wide < (w >= 900 ? 0.8 : w >= 500 ? 0.85 : 0.95)) fail(`${tag}: the picture uses only ${Math.round(r.wide * 100)}% of the stage width`);
      if (r.scroll > 1) fail(`${tag}: sideways scroll ${r.scroll}px`);
      if (r.lineOff > 1) fail(`${tag}: the cause line ends ${Math.round(r.lineOff)} px below the screen`);
      if (w < 641 && r.lines.rows > 2) fail(`${tag}: cause line ${r.lines.rows} rows (${r.lines.t})`);
      heights.push(r.lines.h);
      if (SHOTS) { const m = await page.$('.px-main'); shots.push(await m.screenshot()); }
    }
    if (SHOTS) shots.forEach((b, i) => writeFileSync(join(SHOTS, `${tab}-${ws}${DARK ? '-dark' : ''}-${i}.png`), b));
  }
  if (w < 1101 && new Set(heights).size > 1) fail(`${ws}: the cause line changes height (${[...new Set(heights)].join(', ')} px)`);
  if (errs.length) fail(`${ws}: console errors: ${errs.join(' | ')}`);
  await ctx.close();
}
await browser.close();
console.log(`${checks} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
