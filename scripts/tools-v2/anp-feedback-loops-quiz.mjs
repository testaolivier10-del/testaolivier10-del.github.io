#!/usr/bin/env node
/* Test yourself checks for the A&P Feedback loops v2 page (docs/tools-v2-anp-feedback-loops-brief.md, review round 1):
   reached the usual way (land on Explore, press "Test yourself") and by a direct ?id= link, Watch it work draws its
   gauge, drawing and ring with no word under 11 px, at every width, and again after a resize; Build it shows its slots.
     python3 -m http.server 8987 --bind 127.0.0.1 &
     node scripts/tools-v2/anp-feedback-loops-quiz.mjs [--port 8987] [--width 1024] */
import { chromium } from 'playwright';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const PORT = arg('--port', '8987'), WIDTHS = arg('--width', '') ? [+arg('--width', '')] : [360, 390, 768, 820, 1024, 1280, 1440];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
let fails = 0, checks = 0;
const fail = (m) => { fails++; console.log('FAIL ' + m); };
const minText = (page) => page.evaluate(() => {
  const els = [...document.querySelectorAll('.fl-ring text, .fl-scene text, .fl-gauge text')].filter((t) => t.getBoundingClientRect().width && t.textContent.trim());
  return els.length ? Math.min(...els.map((t) => parseFloat(getComputedStyle(t).fontSize) * t.getScreenCTM().a)) : 0;
});
for (const w of WIDTHS) {
  const h = w < 500 ? 844 : w < 1100 ? 1024 : 900;
  for (const via of ['button', 'link']) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', hasTouch: w < 900 });
    await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
    await ctx.addInitScript(() => { try { localStorage.setItem('tk2c:anp-loops', '1'); } catch (e) {} });
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/anatomy-physiology/tools/feedback-loops.html${via === 'link' ? '?id=temperature-hot' : ''}`);
    for (let i = 0; i < 100 && !(await page.evaluate(() => !!(window.AnpLoopExplore && window.AnpLoopExplore.current && document.querySelector('.fe-lab')))); i++) await page.waitForTimeout(100);
    await page.waitForTimeout(500);
    if (via === 'button') await page.click('.ls-modes button:has-text("Test yourself")');
    await page.waitForTimeout(900);
    let m = await minText(page); checks++;
    if (!(m >= 10.95)) fail(`${w} via ${via}: Watch it work's smallest word ${m.toFixed(1)} px`);
    await page.setViewportSize({ width: w + 1, height: h }); await page.waitForTimeout(700);
    m = await minText(page); checks++;
    if (!(m >= 10.95)) fail(`${w} via ${via} after a resize: smallest word ${m.toFixed(1)} px`);
    await page.click('.fl-subb[data-v="test"]'); await page.waitForTimeout(300);
    const slots = await page.evaluate(() => [...document.querySelectorAll('.fl-slot')].filter((e) => e.offsetWidth).length); checks++;
    if (slots !== 7) fail(`${w} via ${via}: Build it shows ${slots} slots`);
    await ctx.close();
  }
}
await browser.close();
console.log(`${checks} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
