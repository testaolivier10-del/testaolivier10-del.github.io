#!/usr/bin/env node
/* Tools v2: frame times of the Design drills bench (builder brief, "Performance"): a requestAnimationFrame probe
   while the Sample size knob is dragged from 1 to 12 plants and back with a mouse, and while the Fair test items are
   tapped, at 390 px and 1440 px with the CPU throttled four times. Target: median about 16 ms, p95 at or under 50 ms.
   Usage: node scripts/tools-v2/design-drills-perf.mjs [--rate 4]   (needs playwright; PW_ROOT as in the sweep) */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const rI = process.argv.indexOf('--rate'), RATE = rI > 0 ? +process.argv[rI + 1] : 4;
let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) { try { ({ chromium } = createRequire((process.env.PW_ROOT || '/home/claude/testaolivier10-del.github.io') + '/')('playwright')); } catch (e2) { console.error('needs playwright'); process.exit(0); } }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = resolve(ROOT, '.' + p);
  if (!f.startsWith(ROOT) || !existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); createReadStream(f).pipe(res); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const EXE = existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome') ? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' : undefined;
const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
const { loadavg, cpus } = await import('node:os');
console.log(`machine load ${loadavg()[0].toFixed(1)} on ${cpus().length} cores`);
const misses = [];
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith(BASE), r => r.abort());
  const page = await ctx.newPage();
  await page.addInitScript(() => { localStorage.setItem('tk2c:apbio-design-fair', '1'); localStorage.setItem('tk2c:apbio-design-n', '1'); });
  await page.goto(BASE + '/bio/tools/design-drills.html'); await page.waitForSelector('.dd2-svg'); await page.waitForTimeout(1500);
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  const run = async (label, act) => {
    await page.evaluate(() => { window.__f = []; let last = performance.now(); window.__on = true; const loop = t => { window.__f.push(t - last); last = t; if (window.__on) requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
    await act(); await page.waitForTimeout(1600);
    const r = await page.evaluate(() => { window.__on = false; const f = window.__f.slice(1).sort((a, b) => a - b); return { n: f.length, med: f[f.length >> 1], p95: f[Math.min(f.length - 1, Math.floor(f.length * 0.95))], max: f[f.length - 1] }; });
    console.log(`${w} px, CPU x${RATE}, ${label}: median ${r.med.toFixed(1)} ms, p95 ${r.p95.toFixed(1)} ms, max ${r.max.toFixed(0)} ms (${r.n} frames)`);
    if (r.med >= 20 || r.p95 > 50.2) misses.push(`${w} ${label}: median ${r.med.toFixed(1)}, p95 ${r.p95.toFixed(1)}`);
  };
  await run('Fair test, three taps', async () => { for (const j of [0, 2, 1]) { await page.locator('.dd2-scene .tk2-tap').nth(j).click(); await page.waitForTimeout(500); } });
  await page.click('.dd2 .tk2-tab[data-v="n"]'); await page.waitForTimeout(1800);
  await run('Sample size, drag 1 to 12 and back', async () => {
    const tr = await page.locator('.dd2-knob-n .tk2-groove').boundingBox(), k = await page.locator('.dd2-knob-n .tk2-knob').boundingBox(), y = k.y + k.height / 2;
    await page.mouse.move(k.x + k.width / 2, y); await page.mouse.down();
    for (let i = 0; i <= 24; i++) { await page.mouse.move(tr.x + tr.width * i / 24, y); await page.waitForTimeout(16); }
    for (let i = 24; i >= 0; i--) { await page.mouse.move(tr.x + tr.width * i / 24, y); await page.waitForTimeout(16); }
    await page.mouse.up();
  });
  await run('Sample size, New plants', async () => { await page.click('.dd2-new'); });
  await ctx.close();
}
await browser.close(); server.close();
console.log(misses.length ? 'MISSES\n  ' + misses.join('\n  ') : 'all within target');
