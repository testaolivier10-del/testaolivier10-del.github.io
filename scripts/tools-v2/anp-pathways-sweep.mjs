#!/usr/bin/env node
/* Sweep test for the A&P Pathway tracer v2 Explore (docs/tools-v2-anp-pathways-brief.md; docs/tools-v2-builder-brief.md
   step 5). Every step of the four drawn routes, and each break, at ten widths: nothing clipped, no labels overlapping
   each other, the knob or the buttons on the picture (4 px apart), the first-visit cue covering no label, every tab
   name and step name fitting, the picture the largest thing on the stage, the cause line at most two rows on phones
   with one constant height, no sideways scroll, no console errors.

   Needs a static server at the repo root and Chromium:
     python3 -m http.server 8923 --bind 127.0.0.1 &
     node scripts/tools-v2/anp-pathways-sweep.mjs [--port 8923] [--shots <dir>] [--dark] [--width 390]
   Run one width per process (--width) for long sweeps. The frame by frame checks of picture against words are in
   anp-pathways-frames.mjs. The tool is Premium: the test (never the page) unlocks it by serving assets/premium.js
   with has() answering true. */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const PORT = arg('--port', '8923'), SHOTS = arg('--shots', ''), DARK = process.argv.includes('--dark');
const ALL = [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
const WIDTHS = arg('--width', '') ? [+arg('--width', '')] : ALL;
// every step, the moments between where things change, the end, and each break (b:<id> then the token at the break)
const STATES = {
  heart: [0, 0.6, 1, 2, 2.6, 3, 4, 4.8, 5, 6, 6.6, 7, 8, 8.6, 9, 10, 10.8, 11, 12, 13, 'b:air', 5, 11, 13],
  reflex: [0, 0.5, 1, 2, 3, 3.3, 4, 5, 5.7, 5.8, 6, 'b:dorsal', 'L', 'r', 'b:ventral', 'L'],
  hormone: [0, 1, 1.6, 2, 3, 4, 5, 5.2, 6, 'b:pit', 'L', 'r', 'b:adr', 'L'],
  synapse: [0, 1, 2, 2.6, 3, 4, 4.6, 5, 6, 6.6, 7, 7.2, 7.5, 8, 'b:ca', 'L', 'r', 'b:rec', 'L']
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
  await page.goto(`http://127.0.0.1:${PORT}/anatomy-physiology/tools/pathways.html`, { waitUntil: 'load' });
  for (let i = 0; i < 150 && !(await page.evaluate(() => !!(window.AnpPathExplore && window.AnpPathExplore.current && document.querySelector('.pe-lab')))); i++) await page.waitForTimeout(100);
  await page.waitForTimeout(600);

  // the first visit cue covers no label and stays on screen
  const cue = await page.evaluate(() => {
    const c = document.querySelector('.tk2-cue'); if (!c) return { none: true };
    const r = c.getBoundingClientRect(), hits = [];
    document.querySelectorAll('svg.pe-svg:not(.pe-fade) .pe-lab rect, .pe-reset').forEach((e) => {
      const q = e.getBoundingClientRect();
      if (q.width && q.left < r.right - 1 && q.right > r.left + 1 && q.top < r.bottom - 1 && q.bottom > r.top + 1) hits.push((e.closest('.pe-lab') || e).textContent.trim());
    });
    return { hits, out: r.left < -1 || r.right > innerWidth + 1 };
  });
  checks++;
  if (cue.none) fail(`${w}: no first-visit cue`);
  else { if (cue.hits.length) fail(`${w}: the cue covers ${cue.hits.join(', ')}`); if (cue.out) fail(`${w}: the cue sticks out of the screen`); }

  // every tab name fits inside its tab
  const tabs = await page.evaluate(() => [...document.querySelectorAll('.pe .tk2-tab')].map((b) => {
    const r = b.getBoundingClientRect(), vis = [...b.querySelectorAll('*')].filter((e) => e.offsetWidth && !e.children.length).map((e) => e.getBoundingClientRect());
    const l = Math.min(...vis.map((q) => q.left)), rr = Math.max(...vis.map((q) => q.right));
    return { name: b.innerText.trim(), over: vis.length ? (l < r.left + 4 || rr > r.right - 4) : b.scrollWidth > b.clientWidth + 1 };
  }));
  checks++;
  tabs.forEach((t) => { if (t.over) fail(`${w}: tab "${t.name}" does not fit`); });
  await page.evaluate(() => { const c = document.querySelector('.tk2-cue'); if (c) c.remove(); });

  const heights = [];
  for (const tab of Object.keys(STATES)) {
    await page.evaluate((t) => { window.AnpPathExplore.current.tab(t); window.AnpPathExplore.current._reset(); }, tab);
    await page.waitForTimeout(150);
    const shots = [];
    for (const s of STATES[tab]) {
      if (s === 'L') { await page.evaluate(() => { const A = window.AnpPathExplore.current; A._frame(A._lim()); }); await page.waitForTimeout(120); }
      else if (typeof s === 'string') {
        if (s === 'r') await page.evaluate(() => window.AnpPathExplore.current._reset());
        else await page.evaluate((id) => window.AnpPathExplore.current._break(id), s.slice(2));
        await page.waitForTimeout(350);
        continue;
      } else {
        await page.evaluate((v) => window.AnpPathExplore.current._frame(v), s);
        await page.waitForTimeout(120);
      }
      const r = await page.evaluate(() => {
        const out = { clip: [], over: [], big: null, lines: null, scroll: 0, fit: [] };
        const pic = document.querySelector('.pe-pic').getBoundingClientRect();
        const svg = document.querySelector('.pe-svg');
        const boxes = [];
        document.querySelectorAll('svg.pe-svg:not(.pe-fade) .pe-labs .pe-lab').forEach((g) => {
          const q = g.querySelector('rect').getBoundingClientRect(), t = g.querySelector('text').getBoundingClientRect();
          boxes.push({ n: 'label ' + g.getAttribute('data-lab'), q });
          if (q.left < pic.left - 0.5 || q.right > pic.right + 0.5 || q.top < pic.top - 0.5 || q.bottom > pic.bottom + 0.5) out.clip.push(g.getAttribute('data-lab'));
          if (t.left < q.left - 0.5 || t.right > q.right + 0.5) out.fit.push('label text ' + g.getAttribute('data-lab'));
        });
        document.querySelectorAll('.pe-over > button').forEach((b) => {
          if (b.hidden || !b.offsetWidth) return;
          const q = b.getBoundingClientRect();
          boxes.push({ n: 'button ' + b.textContent.trim(), q });
          if (q.left < pic.left - 0.5 || q.right > pic.right + 0.5 || q.top < pic.top - 0.5 || q.bottom > pic.bottom + 0.5) out.clip.push('button ' + b.textContent.trim());
        });
        const knob = document.querySelector('.pe-pic .tk2-knob');
        if (knob) {
          const q = knob.getBoundingClientRect(), d = knob.querySelector('.tk2-dot').getBoundingClientRect();
          boxes.push({ n: 'knob', q: { left: d.left, right: d.right, top: d.top, bottom: d.bottom } });
          // the knob (its ring) is never cut by the picture's edge
          if (d.left < pic.left - 0.5 || d.right > pic.right + 0.5 || d.top < pic.top - 0.5 || d.bottom > pic.bottom + 0.5) out.clip.push('knob');
        }
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i].q, b = boxes[j].q, g = 4;
          if (a.left < b.right + g && a.right > b.left - g && a.top < b.bottom + g && a.bottom > b.top - g) out.over.push(boxes[i].n + ' / ' + boxes[j].n);
        }
        // the picture is the largest thing on the stage
        const stage = document.querySelector('.pe'), area = (e) => { const q = e.getBoundingClientRect(); return q.width * q.height; };
        const others = [...stage.children].filter((e) => !e.classList.contains('pe-main') && e.offsetWidth).map(area).concat([area(document.querySelector('.pe-rail'))]);
        // the picture uses the stage's width (no column beside it)
        const pr = document.querySelector('.pe-pic').getBoundingClientRect(), sr = stage.getBoundingClientRect();
        out.wide = pr.width / sr.width;
        out.big = area(document.querySelector('.pe-pic')) >= Math.max(...others);
        const ln = document.querySelector('.pe-lines'), pills = [...ln.querySelectorAll('.tk2-cz, .tk2-take')].filter((e) => e.offsetWidth);
        const tops = [...new Set(pills.map((e) => Math.round(e.getBoundingClientRect().top / 6)))];
        out.lines = { h: Math.round(ln.getBoundingClientRect().height), rows: tops.length, t: ln.innerText.replace(/\s+/g, ' ') };
        out.scroll = document.scrollingElement.scrollWidth - innerWidth;
        document.querySelectorAll('.pe-rail .pe-sn, .pe-strip-n').forEach((e) => { if (e.offsetWidth && e.scrollWidth > e.clientWidth + 1) out.fit.push('rail ' + e.textContent); });
        document.querySelectorAll('.pe-over > button span').forEach((e) => { if (e.offsetWidth && e.scrollWidth > e.clientWidth + 1) out.fit.push('button ' + e.textContent); });
        return out;
      });
      checks++;
      const tag = `${w}${DARK ? ' dark' : ''} ${tab} @${s}`;
      if (r.clip.length) fail(`${tag}: clipped ${r.clip.join(', ')}`);
      if (r.over.length) fail(`${tag}: overlap ${r.over.join('; ')}`);
      if (!r.big) fail(`${tag}: the picture is not the largest thing`);
      if (r.wide < (w >= 900 ? 0.82 : 0.95)) fail(`${tag}: the picture uses only ${Math.round(r.wide * 100)}% of the stage width`);
      if (r.scroll > 1) fail(`${tag}: sideways scroll ${r.scroll}px`);
      if (r.fit.length) fail(`${tag}: does not fit ${r.fit.join(', ')}`);
      if (w < 641 && r.lines.rows > 2) fail(`${tag}: cause line ${r.lines.rows} rows (${r.lines.t})`);
      heights.push(r.lines.h); if (r.lines.h > 84) console.log(`  tall line ${tag} ${r.lines.h}px: ${r.lines.t}`);
      if (SHOTS) { const pic = await page.$('.pe-main'); shots.push(await pic.screenshot()); }
    }
    if (SHOTS) {
      // a contact sheet of this screen's states
      const { default: sharp } = await import('sharp').catch(() => ({ default: null }));
      if (sharp && shots.length) {
        const meta = await sharp(shots[0]).metadata(), cols = 4, cw = meta.width, ch = meta.height, rows = Math.ceil(shots.length / cols);
        const comp = shots.map((b, i) => ({ input: b, left: (i % cols) * cw, top: Math.floor(i / cols) * ch }));
        await sharp({ create: { width: cw * cols, height: ch * rows, channels: 3, background: '#ffffff' } }).composite(comp).png().toFile(join(SHOTS, `${tab}-${w}${DARK ? '-dark' : ''}.png`));
      } else shots.forEach((b, i) => { import('fs').then((fs) => fs.writeFileSync(join(SHOTS, `${tab}-${w}${DARK ? '-dark' : ''}-${i}.png`), b)); });
    }
  }
  if (w < 1101 && new Set(heights).size > 1) fail(`${w}: the cause line changes height (${[...new Set(heights)].join(', ')} px)`);
  if (errs.length) fail(`${w}: console errors: ${errs.join(' | ')}`);
  await ctx.close();
}
await browser.close();
console.log(`${checks} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
