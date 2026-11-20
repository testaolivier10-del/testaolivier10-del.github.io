#!/usr/bin/env node
/* Tools v2: frame times of the chi-square choice chamber (docs/tools-v2-chi-square-brief.md), on the pattern of
   scripts/tools-v2/hardy-weinberg-perf.mjs: a requestAnimationFrame probe while a bug is dragged across the wall and
   back (a mouse, 24 steps each way, 16 ms apart), then Let them wander with 80 bugs, at 390 px and 1440 px with the
   CPU throttled four times. Target for the drag: median about 16 ms and p95 at or under 50 ms (frames come in 16.7 ms
   steps). The page's own main thread CPU per frame (from a trace) is given too, since a shared machine inflates
   frame times. The flagship (AP Environmental Science, Water pollution: its fertilizer knob dragged end to end and
   back) is measured in the same run, so the two can be compared in the same hour.
   Usage: node scripts/tools-v2/chi-square-perf.mjs [--rate 4] [--width 390] [--no-flagship]   (needs playwright) */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream } from 'node:fs';
import { dirname, extname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const rI = process.argv.indexOf('--rate'), RATE = rI > 0 ? +process.argv[rI + 1] : 4;
const wI = process.argv.indexOf('--width'), ONLY = wI > 0 ? +process.argv[wI + 1] : 0, FLAG = !process.argv.includes('--no-flagship');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) { try { ({ chromium } = createRequire((process.env.PW_ROOT || '/home/claude/testaolivier10-del.github.io') + '/')('playwright')); } catch (e2) { console.error('needs playwright'); process.exit(0); } }
const server = createServer((req, res) => { let f = resolve(ROOT, '.' + decodeURIComponent(req.url.split('?')[0])); if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); createReadStream(f).pipe(res); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const EXE = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome') ? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' : undefined);
const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
const misses = [], fails = [];
const { loadavg, cpus } = await import('node:os');
console.log(`machine load ${loadavg()[0].toFixed(1)} on ${cpus().length} cores`);
async function probe(page, label, w, act, gate) {
  await browser.startTracing(page, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'] });
  await page.evaluate(() => { window.__f = []; let last = performance.now(); window.__on = true; const loop = t => { window.__f.push(t - last); last = t; if (window.__on) requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
  await act(); await page.waitForTimeout(400);
  const r = await page.evaluate(() => { window.__on = false; const f = window.__f.slice(1).sort((a, b) => a - b); if (!f.length) f.push(0); return { n: f.length, med: f[f.length >> 1], p95: f[Math.min(f.length - 1, Math.floor(f.length * 0.95))], max: f[f.length - 1] }; });
  const ev = JSON.parse((await browser.stopTracing()).toString()).traceEvents;
  const mt = ev.find(e => e.name === 'thread_name' && e.args && e.args.name === 'CrRendererMain');
  const tasks = ev.filter(e => mt && e.pid === mt.pid && e.tid === mt.tid && e.ph === 'X' && e.name === 'RunTask' && e.tdur);
  const cpu = tasks.reduce((a, e) => a + e.tdur, 0) / 1000, frames = ev.filter(e => mt && e.pid === mt.pid && e.tid === mt.tid && e.name === 'FireAnimationFrame').length || r.n;
  console.log(`${w} px, CPU x${RATE}, ${label}: frames median ${r.med.toFixed(1)} ms, p95 ${r.p95.toFixed(1)} ms, max ${r.max.toFixed(0)} ms (${r.n} frames); main thread CPU ${(cpu / frames).toFixed(1)} ms a frame`);
  if (gate && (r.med >= 20 || r.p95 > 50.2)) misses.push(`${w} ${label}: median ${r.med.toFixed(1)} ms, p95 ${r.p95.toFixed(1)} ms`);
  if (gate && cpu / frames >= 8) fails.push(`${w} ${label}: ${(cpu / frames).toFixed(1)} ms of main thread work a frame`);
  return r;
}
for (const [w, h] of [[390, 844], [1440, 900]].filter(x => !ONLY || x[0] === ONLY)) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith(BASE), r => r.abort());
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { localStorage.setItem('tk2c:apbio-chi', '1'); } catch (e) {} });
  await page.goto(BASE + '/bio/tools/chi-square.html'); await page.waitForSelector('.cs2-bugs use'); await page.waitForTimeout(900);
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  await probe(page, 'drag a bug across and back', w, async () => {
    const g = await page.evaluate(() => { const G = window.__cs2.G(), r = document.querySelector('.cs2-scene').getBoundingClientRect(); const bs = window.__cs2.bugs().filter(b => window.__cs2.chamberOf(b.x, b.y) === 0).sort((a, b) => Math.hypot(a.x - G.mx, a.y - G.my) - Math.hypot(b.x - G.mx, b.y - G.my)); const far = G.side ? [r.left + G.ix1 - G.bugL * 2, r.top + G.my] : [r.left + G.mx, r.top + G.iy1 - G.bugL * 2]; return { x: r.left + bs[0].x, y: r.top + bs[0].y, tx: far[0], ty: far[1] }; });
    await page.mouse.move(g.x, g.y); await page.mouse.down();
    for (let i = 0; i <= 24; i++) { await page.mouse.move(g.x + (g.tx - g.x) * i / 24, g.y + (g.ty - g.y) * i / 24); await page.waitForTimeout(16); }
    for (let i = 24; i >= 0; i--) { await page.mouse.move(g.x + (g.tx - g.x) * i / 24, g.y + (g.ty - g.y) * i / 24); await page.waitForTimeout(16); }
    await page.mouse.up();
  }, true);
  await page.click('.cs2-nb[data-b="1"]'); await page.waitForTimeout(1500);
  await probe(page, 'Let them wander, 80 bugs', w, async () => { await page.click('.cs2-wander'); await page.waitForTimeout(2600); }, false);
  if (FLAG) {
    const fp = await ctx.newPage();
    await fp.goto(BASE + '/environmental-science/tools/water-pollution.html'); await fp.waitForSelector('.tk2-knob'); await fp.waitForTimeout(900);
    const cdp2 = await ctx.newCDPSession(fp); await cdp2.send('Emulation.setCPUThrottlingRate', { rate: RATE });
    await probe(fp, 'FLAGSHIP water pollution, fertilizer knob end to end and back', w, async () => {
      const k = await fp.locator('.tk2-knob').first().boundingBox(), x0 = k.x + k.width / 2, y = k.y + k.height / 2, span = Math.min(260, w * 0.3);
      await fp.mouse.move(x0, y); await fp.mouse.down();
      for (let i = 0; i <= 24; i++) { await fp.mouse.move(x0 + span * i / 24, y); await fp.waitForTimeout(16); }
      for (let i = 24; i >= 0; i--) { await fp.mouse.move(x0 + span * i / 24, y); await fp.waitForTimeout(16); }
      await fp.mouse.up();
    }, false);
  }
  await ctx.close();
}
await browser.close(); server.close();
if (misses.length) console.log(`Frame target missed with the machine at load ${loadavg()[0].toFixed(1)}:\n  ` + misses.join('\n  '));
if (fails.length) { console.log('FAIL\n  ' + fails.join('\n  ')); process.exit(1); }
console.log(misses.length ? 'Chi-square perf: main thread work within budget; frame times as above.' : 'Chi-square perf: within target.');
