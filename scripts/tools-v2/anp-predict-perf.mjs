#!/usr/bin/env node
/* Performance of the A&P Predict the change v2 Explore (docs/tools-v2-anp-predict-brief.md): CPU throttled x4, a slow
   full drag of each screen's knob (end to end and back) while the animation runs; prints median and p95 frame time.
     node scripts/tools-v2/anp-predict-perf.mjs [--port 8931] [--width 1440] */
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const PORT = arg('--port', '8931'), W = +arg('--width', '1440');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 }, serviceWorkers: 'block' });
await ctx.route('**/assets/premium.js', (r) => r.fulfill({ contentType: 'application/javascript', body: readFileSync(join(ROOT, 'assets/premium.js'), 'utf8').replace('function has(course) {', 'function has(course) { return true;') }));
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
const page = await ctx.newPage();
await page.goto(`http://127.0.0.1:${PORT}/anatomy-physiology/tools/predict.html`, { waitUntil: 'load' });
await page.waitForTimeout(2000);
const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
let worst = 0;
for (const t of ['vessel', 'breath', 'adh', 'heart']) {
  await page.evaluate((t) => window.AnpPredictExplore.current.tab(t), t);
  await page.waitForTimeout(500);
  const r = await page.evaluate(async () => {
    const A = window.AnpPredictExplore.current, s = A._scenes.filter((x) => x.id === A.tab())[0].ctl, times = [];
    let last = 0, run = true;
    const f = (ts) => { if (last) times.push(ts - last); last = ts; if (run) requestAnimationFrame(f); };
    requestAnimationFrame(f);
    for (let i = 0; i <= 120; i++) { const u = i <= 60 ? s.min + (s.max - s.min) * i / 60 : s.max - (s.max - s.min) * (i - 60) / 60; A._set(u); await new Promise((res) => setTimeout(res, 25)); }
    await new Promise((res) => setTimeout(res, 800)); run = false;
    times.sort((a, b) => a - b);
    return { med: times[Math.floor(times.length / 2)], p95: times[Math.floor(times.length * 0.95)], n: times.length };
  });
  worst = Math.max(worst, r.p95);
  console.log(`${W} ${t}: median ${r.med.toFixed(1)} ms, p95 ${r.p95.toFixed(1)} ms (${r.n} frames)`);
}
await b.close();
