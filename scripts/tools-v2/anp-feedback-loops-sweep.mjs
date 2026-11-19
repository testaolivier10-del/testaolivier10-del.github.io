#!/usr/bin/env node
/* Sweep test for the A&P Feedback loops v2 Explore (docs/tools-v2-anp-feedback-loops-brief.md; docs/tools-v2-builder-brief.md
   step 5). Every landmark of the three screens (the rest state, a held push, each of the seven parts, the response,
   the end; both directions for temperature and glucose; every turn, birth and after for childbirth) at ten widths and
   two short laptop screens: nothing clipped (labels, the value pill, the knob's ring, Start over), labels 4 px clear of
   each other, of the knob, of Start over, of the monitor and of the scale's numbers; no rendered text under 11 px; the
   first visit cue covering no label or number; every tab name fitting; the picture the largest thing and at least 80%
   of the stage width on a desktop (85% upright tablet, 95% phone); the cause line at most two rows on phones with one
   constant height and on screen; no sideways scroll; no console errors.

   Needs a static server at the repo root and Chromium:
     python3 -m http.server 8987 --bind 127.0.0.1 &
     node scripts/tools-v2/anp-feedback-loops-sweep.mjs [--port 8987] [--shots <dir>] [--dark] [--width 390]
   Run one width per process (--width) for long sweeps. Frame by frame checks of picture against words:
   anp-feedback-loops-frames.mjs. */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const PORT = arg('--port', '8987'), SHOTS = arg('--shots', ''), DARK = process.argv.includes('--dark');
const ALL = ['360', '390', '430', '600', '768', '820', '1024', '1280', '1440', '1920', '1366x768', '1280x720'];
const WIDTHS = arg('--width', '') ? [arg('--width', '')] : ALL;
// [push, t] ; 'idle' the rest state, ['hold', v] a push still held
const NEG_T = [0, 0.4, 1.1, 1.9, 2.6, 3.4, 3.9, 4.6, 5.6, 'end'];
const STATES = {
  temperature: ['idle', ['hold', 38.3]].concat(NEG_T.map((t) => [38.5, t])).concat(NEG_T.map((t) => [35.5, t])),
  glucose: ['idle', ['hold', 150]].concat(NEG_T.map((t) => [160, t])).concat(NEG_T.map((t) => [55, t])),
  childbirth: ['idle', ['hold', 0.3]].concat([0, 0.25, 0.6, 1.3, 1.8, 2.4, 2.8, 4, 6, 8, 9.5, 10.6, 11.3, 11.9, 'end'].map((t) => [0.35, t]))
};
const exe = '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: exe });
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
let fails = 0, checks = 0;
const fail = (m) => { fails++; console.log('FAIL ' + m); };

for (const ws of WIDTHS) {
  const w = +String(ws).split('x')[0], h = String(ws).includes('x') ? +String(ws).split('x')[1] : w < 500 ? 844 : w < 900 ? 1024 : w >= 1900 ? 1080 : 900;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', hasTouch: w < 900 });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await ctx.addInitScript((d) => { try { localStorage.setItem('nremt_theme', d ? 'dark' : 'light'); } catch (e) {} }, DARK);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  await page.goto(`http://127.0.0.1:${PORT}/anatomy-physiology/tools/feedback-loops.html`, { waitUntil: 'load' });
  for (let i = 0; i < 150 && !(await page.evaluate(() => !!(window.AnpLoopExplore && window.AnpLoopExplore.current && document.querySelector('.fe-lab')))); i++) await page.waitForTimeout(100);
  await page.waitForTimeout(700);

  // the first visit cue covers no label, number or the knob's ring, and stays on screen
  const cue = await page.evaluate(() => {
    const c = document.querySelector('.tk2-cue'); if (!c) return { none: true };
    const r = c.getBoundingClientRect(), hits = [];
    document.querySelectorAll('svg.fe-svg:not(.fe-fade) .fe-lab rect, svg.fe-svg:not(.fe-fade) text, .fe-reset').forEach((e) => {
      const q = e.getBoundingClientRect();
      if (q.width && q.left < r.right - 1 && q.right > r.left + 1 && q.top < r.bottom - 1 && q.bottom > r.top + 1) hits.push((e.closest('.fe-lab') || e).textContent.trim());
    });
    return { hits, out: r.left < -1 || r.right > innerWidth + 1 };
  });
  checks++;
  if (cue.none) fail(`${ws}: no first-visit cue`);
  else { if (cue.hits.length) fail(`${ws}: the cue covers ${cue.hits.join(', ')}`); if (cue.out) fail(`${ws}: the cue sticks out of the screen`); }
  const tabs = await page.evaluate(() => [...document.querySelectorAll('.fe .tk2-tab')].map((b) => {
    const r = b.getBoundingClientRect(), vis = [...b.querySelectorAll('*')].filter((e) => e.offsetWidth && !e.children.length).map((e) => e.getBoundingClientRect());
    const l = Math.min(...vis.map((q) => q.left)), rr = Math.max(...vis.map((q) => q.right));
    return { name: b.innerText.trim(), over: vis.length ? (l < r.left + 4 || rr > r.right - 4) : b.scrollWidth > b.clientWidth + 1 };
  }));
  checks++;
  tabs.forEach((t) => { if (t.over) fail(`${ws}: tab "${t.name}" does not fit`); });
  await page.evaluate(() => { const c = document.querySelector('.tk2-cue'); if (c) c.remove(); });

  const heights = [];
  for (const tab of Object.keys(STATES)) {
    await page.evaluate((t) => window.AnpLoopExplore.current.tab(t), tab);
    await page.waitForTimeout(200);
    const shots = [];
    for (const s of STATES[tab]) {
      await page.evaluate((s) => {
        const A = window.AnpLoopExplore.current;
        document.querySelector('.fe-reset').click();
        if (s === 'idle') return;
        if (s[0] === 'hold') { A._push(s[1], true); return; }
        A._push(s[0]);
        A._seek(s[1] === 'end' ? A._end() : s[1]);
      }, s);
      await page.waitForTimeout(140);
      await page.evaluate(() => document.querySelectorAll('.fe-pic .fe-fade').forEach((e) => e.remove()));
      const r = await page.evaluate(() => {
        const out = { clip: [], over: [], small: [], fit: [] };
        const pic = document.querySelector('.fe-pic').getBoundingClientRect();
        const svgEl = document.querySelector('svg.fe-svg:not(.fe-fade)');
        const boxes = [];
        svgEl.querySelectorAll('.fe-labs .fe-lab').forEach((g) => {
          const q = g.querySelector('rect').getBoundingClientRect(), t = g.querySelector('text').getBoundingClientRect();
          boxes.push({ n: 'label ' + g.getAttribute('data-lab'), q });
          if (q.left < pic.left - 0.5 || q.right > pic.right + 0.5 || q.top < pic.top - 0.5 || q.bottom > pic.bottom + 0.5) out.clip.push(g.getAttribute('data-lab'));
          if (t.left < q.left - 0.5 || t.right > q.right + 0.5) out.fit.push('label text ' + g.getAttribute('data-lab'));
        });
        // the numbers drawn on the scale and the monitor (never covered by a label)
        svgEl.querySelectorAll('.fe-ttxt, .fe-mtick').forEach((t) => { const q = t.getBoundingClientRect(); if (q.width) boxes.push({ n: 'number ' + t.textContent, q, num: true }); });
        const mon = svgEl.querySelector('.fe-mbez'); if (mon) { const q = mon.getBoundingClientRect(); boxes.push({ n: 'monitor', q, mon: true }); if (q.left < pic.left - 0.5 || q.right > pic.right + 0.5 || q.top < pic.top - 0.5 || q.bottom > pic.bottom + 0.5) out.clip.push('monitor'); }
        const reset = document.querySelector('.fe-reset'); if (reset && reset.offsetWidth) { const q = reset.getBoundingClientRect(); boxes.push({ n: 'Start over', q }); if (q.left < pic.left - 0.5 || q.right > pic.right + 0.5 || q.top < pic.top - 0.5) out.clip.push('Start over'); }
        const knob = document.querySelector('.fe-pic .tk2-handle:not([hidden]) .tk2-knob');
        if (knob && knob.style.visibility !== 'hidden') {
          const d = knob.querySelector('.tk2-dot').getBoundingClientRect();
          boxes.push({ n: 'knob', q: { left: d.left, right: d.right, top: d.top, bottom: d.bottom }, knob: true });
          if (d.left < pic.left - 0.5 || d.right > pic.right + 0.5 || d.top < pic.top - 0.5 || d.bottom > pic.bottom + 0.5) out.clip.push('knob');
        }
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
          const A = boxes[i], B = boxes[j];
          if ((A.knob && B.num) || (B.knob && A.num)) { const a = A.q, b = B.q; if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) out.over.push(A.n + ' / ' + B.n); continue; }
          if (!/^label/.test(A.n) && !/^label/.test(B.n)) continue;   // only labels against everything
          if ((A.mon && B.num) || (B.mon && A.num)) continue;
          const a = A.q, b = B.q, g = 4;
          if (a.left < b.right + g && a.right > b.left - g && a.top < b.bottom + g && a.bottom > b.top - g) out.over.push(A.n + ' / ' + B.n);
        }
        // the monitor's and the scale's own words never run into each other
        const tx = [...svgEl.querySelectorAll('.fe-mon text, .fe-ttxt')].map((t) => ({ t: t.textContent, q: t.getBoundingClientRect(), mon: !!t.closest('.fe-mon') })).filter((x) => x.q.width);
        for (let i = 0; i < tx.length; i++) for (let j = i + 1; j < tx.length; j++) { const a = tx[i].q, b = tx[j].q; if (a.left < b.right + 2 && a.right > b.left - 2 && a.top < b.bottom && a.bottom > b.top) out.over.push('text ' + tx[i].t + ' / ' + tx[j].t); }
        const mb = svgEl.querySelector('.fe-mbez'); if (mb) { const m = mb.getBoundingClientRect(); tx.filter((x) => x.mon).forEach((x) => { if (x.q.left < m.left || x.q.right > m.right || x.q.top < m.top || x.q.bottom > m.bottom) { if (x.q.top >= m.top - 1 && x.q.top <= m.bottom) out.clip.push('monitor text ' + x.t); } }); }
        // every drawn word and number is inside the picture
        svgEl.querySelectorAll('text').forEach((t) => { const q = t.getBoundingClientRect(); if (q.width && t.textContent.trim() && (q.left < pic.left - 0.5 || q.right > pic.right + 0.5 || q.top < pic.top - 0.5 || q.bottom > pic.bottom + 0.5)) out.clip.push('text ' + t.textContent.trim()); });
        // smallest rendered text: every svg text and the words on the stage
        svgEl.querySelectorAll('text').forEach((t) => { const fs = parseFloat(getComputedStyle(t).fontSize) * (svgEl.getBoundingClientRect().width / svgEl.viewBox.baseVal.width); if (t.textContent.trim() && fs < 10.95) out.small.push(t.textContent.trim().slice(0, 18) + ' ' + fs.toFixed(1)); });
        document.querySelectorAll('.fe-rail span, .fe .tk2-cause *, .fe .tk2-tab *, .fe .tk2-head *').forEach((e) => { if (e.offsetWidth && e.textContent.trim() && !e.children.length) { const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 10.95) out.small.push(e.textContent.trim().slice(0, 18) + ' ' + fs); } });
        const stage = document.querySelector('.fe'), area = (e) => { const q = e.getBoundingClientRect(); return q.width * q.height; };
        const others = [...stage.children].filter((e) => !e.classList.contains('fe-main') && e.offsetWidth).map(area).concat([area(document.querySelector('.fe-rail'))]);
        out.wide = document.querySelector('.fe-pic').getBoundingClientRect().width / stage.getBoundingClientRect().width;
        out.big = area(document.querySelector('.fe-pic')) >= Math.max(...others);
        const ln = document.querySelector('.fe-lines'), pills = [...ln.querySelectorAll('.tk2-cz, .tk2-take')].filter((e) => e.offsetWidth);
        const tops = [...new Set(pills.map((e) => Math.round(e.getBoundingClientRect().top / 6)))];
        out.lines = { h: Math.round(ln.getBoundingClientRect().height), rows: tops.length, t: ln.innerText.replace(/\s+/g, ' ') };
        out.scroll = document.scrollingElement.scrollWidth - innerWidth;
        out.lineOff = ln.getBoundingClientRect().bottom + scrollY - innerHeight;
        document.querySelectorAll('.fe-rn, .fe-rt, .fe-reset span').forEach((e) => { if (e.offsetWidth && e.textContent.trim() && e.scrollWidth > e.clientWidth + 1) out.fit.push('text ' + e.textContent); });
        return out;
      });
      checks++;
      const tag = `${ws}${DARK ? ' dark' : ''} ${tab} @${JSON.stringify(s)}`;
      if (r.clip.length) fail(`${tag}: clipped ${r.clip.join(', ')}`);
      if (r.over.length) fail(`${tag}: overlap ${r.over.join('; ')}`);
      if (r.small.length) fail(`${tag}: text under 11 px: ${r.small.slice(0, 4).join('; ')}`);
      if (!r.big) fail(`${tag}: the picture is not the largest thing`);
      if (r.wide < (w >= 900 ? 0.8 : w >= 500 ? 0.85 : 0.95)) fail(`${tag}: the picture uses only ${Math.round(r.wide * 100)}% of the stage width`);
      if (r.scroll > 1) fail(`${tag}: sideways scroll ${r.scroll}px`);
      if (r.fit.length) fail(`${tag}: does not fit ${r.fit.join(', ')}`);
      if (r.lineOff > 1) fail(`${tag}: the cause line ends ${Math.round(r.lineOff)} px below the screen`);
      if (w < 641 && r.lines.rows > 2) fail(`${tag}: cause line ${r.lines.rows} rows (${r.lines.t})`);
      heights.push(r.lines.h);
      if (SHOTS) { const el = await page.$('.fe-main'); shots.push(await el.screenshot()); }
    }
    if (SHOTS) {
      const { default: sharp } = await import('sharp').catch(() => ({ default: null }));
      if (sharp && shots.length) {
        const meta = await sharp(shots[0]).metadata(), cols = 4, cw = meta.width, ch = meta.height, rows = Math.ceil(shots.length / cols);
        const comp = shots.map((b, i) => ({ input: b, left: (i % cols) * cw, top: Math.floor(i / cols) * ch }));
        await sharp({ create: { width: cw * cols, height: ch * rows, channels: 3, background: '#ffffff' } }).composite(comp).png().toFile(join(SHOTS, `${tab}-${ws}${DARK ? '-dark' : ''}.png`));
      } else shots.forEach((b, i) => writeFileSync(join(SHOTS, `${tab}-${ws}${DARK ? '-dark' : ''}-${i}.png`), b));
    }
  }
  if (w < 1101 && new Set(heights).size > 1) fail(`${ws}: the cause line changes height (${[...new Set(heights)].join(', ')} px)`);
  if (errs.length) fail(`${ws}: console errors: ${errs.join(' | ')}`);
  await ctx.close();
}
await browser.close();
console.log(`${checks} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
