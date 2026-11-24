#!/usr/bin/env node
/* Tools v2: frame times of the AP® Psychology Brain map (docs/tools-v2-brain-map-brief.md), on the pattern of
   scripts/tools-v2/chi-square-perf.mjs: a requestAnimationFrame probe while (1) a student taps eight parts of the
   outside view in a row with "If damaged" on (each colour grows from its pin, each lesion spreads), (2) the same on
   the inside view, and (3) a split-brain flash runs end to end, at 390 px and 1440 px with the CPU throttled four
   times. Target: median about 16 ms and p95 at or under 50 ms. The page's own main thread CPU per frame (from a
   trace) is given too, since a shared machine inflates frame times. The flagship (AP Environmental Science, Water
   pollution: its fertilizer knob dragged end to end and back) is measured in the same run, to compare in the same
   hour.
   Usage: node scripts/tools-v2/brain-map-perf.mjs [--rate 4] [--width 390] [--no-flagship]   (needs playwright) */
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
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', hasTouch: w < 900 });
  await ctx.route(u => !u.href.startsWith(BASE), r => r.abort());
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { localStorage.setItem('tk2c:appsych-brainmap-map', '1'); localStorage.setItem('tk2c:appsych-brainmap-split', '1'); } catch (e) {} });
  for (const view of ['outside', 'inside']) {
    await page.goto(BASE + '/psychology/tools/brain-map.html#view/' + view); await page.reload(); await page.waitForSelector('.tk2-spot'); await page.waitForTimeout(1200);
    const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
    const pts = await page.evaluate(() => [...document.querySelectorAll('.tk2-spots:not([hidden]) .tk2-spot-pin')].slice(0, 8).map((e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2 + 3, r.top + r.height / 2 + 3]; }));
    await page.evaluate(() => window.BrainMapExplore.damage(true));
    await probe(page, `${view}: tap eight parts with If damaged on`, w, async () => {
      for (const p of pts) { if (w < 900) await page.touchscreen.tap(p[0], p[1]); else await page.mouse.click(p[0], p[1]); await page.waitForTimeout(260); }
    }, true);
    await page.evaluate(() => window.BrainMapExplore.damage(false));
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  }
  await page.goto(BASE + '/psychology/tools/brain-map.html#view/split'); await page.reload(); await page.waitForTimeout(1500);
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  await probe(page, 'split brain: one flash end to end', w, async () => { await page.evaluate(() => window.BrainMapExplore.flash('left')); await page.waitForTimeout(3800); }, true);
  if (FLAG) {
    const fp = await ctx.newPage();
    // the flagship is Premium: unlocked for this measurement only (docs/tools-v2-builder-brief.md, step 6)
    await fp.route('**/assets/premium.js', async r => { const res = await r.fetch(); const body = (await res.text()).replace('function has(course) {', 'function has(course) { return true;'); await r.fulfill({ response: res, body }); });
    await fp.goto(BASE + '/environmental-science/tools/water-pollution.html'); await fp.waitForSelector('.tk2-knob', { state: 'attached' }); await fp.waitForTimeout(1500);
    const cdp2 = await ctx.newCDPSession(fp); await cdp2.send('Emulation.setCPUThrottlingRate', { rate: RATE });
    await probe(fp, 'FLAGSHIP water pollution, fertilizer knob end to end and back', w, async () => {
      const k = await fp.evaluate(() => { const e = [...document.querySelectorAll('.tk2-knob')].find(x => x.getBoundingClientRect().width > 0); const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }), x0 = k.x + k.width / 2, y = k.y + k.height / 2, span = Math.min(260, w * 0.3);
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
console.log(misses.length ? 'Brain map perf: main thread work within budget; frame times as above.' : 'Brain map perf: within target.');
