/* Frame times of the Reaction Predictor (docs/tools-v2-reaction-predictor-brief.md) with the CPU throttled four times,
   next to the flagship's (AP® Environmental Science Water pollution, "Watch it happen") measured in the same run, so
   machine load affects both alike. For each width: three full runs of the tool (E2 on 2-bromobutane, SN1 then E1 on
   tert-butyl bromide, SN2 on bromomethane), each started by the reagent picker as a student would, and one flagship
   play. Prints median and p95 frame times (ms) from requestAnimationFrame.

     node scripts/tools-v2/reaction-predictor-perf.mjs [widths]   (default 390,1440) */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
let chromium;
try { ({ chromium } = createRequire(join(ROOT, 'package.json'))('playwright')); }
catch (e) { ({ chromium } = createRequire('/opt/npm-tools/package.json')('playwright')); }
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const p = join(ROOT, normalize(decodeURIComponent(req.url.split('?')[0])));
  if (!p.startsWith(ROOT) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const PREMIUM = readFileSync(join(ROOT, 'assets/premium.js'), 'utf8').replace('function has(course) {', 'function has(course) { return true;');
const WIDTHS = (process.argv[2] || '390,1440').split(',').map(Number);
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
const stats = a => { const s = a.slice().sort((x, y) => x - y); return { n: s.length, med: +s[Math.floor(s.length / 2)].toFixed(1), p95: +s[Math.floor(s.length * 0.95)].toFixed(1), max: +s[s.length - 1].toFixed(1) }; };
async function page(w, path) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 641 ? 844 : 900 }, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  await p.route(/supabase|umami|api\.levlprep|polar/, r => r.abort());
  await p.route(/assets\/premium\.js/, r => r.fulfill({ body: PREMIUM, contentType: 'application/javascript' }));
  await p.addInitScript(() => { try { localStorage.setItem('tk2c:ochem-rp-reagent', '1'); localStorage.setItem('tk2c:apenv-wp-fert', '1'); } catch (e) {} });
  await p.goto(BASE + path, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  return { ctx, p };
}
const frames = (p, ms) => p.evaluate(ms => new Promise(res => { const out = []; let last = performance.now(); const t0 = last;
  (function f(t){ out.push(t - last); last = t; if (t - t0 < ms) requestAnimationFrame(f); else res(out.slice(2)); })(last); requestAnimationFrame(t => { last = t; }); }), ms);
for (const w of WIDTHS) {
  const { ctx, p } = await page(w, '/ochem/tools/reaction-predictor.html?sub=mebr&rgt=h2o');
  const all = [];
  for (const [sub, rgt, ms] of [['bubr2', 'oet', 6500], ['tbubr', 'h2o', 9500], ['mebr', 'oh', 6000]]) {
    await p.selectOption('#rpSubSel', sub);
    await p.waitForFunction(() => window.OchemReactionPredictor.view.settled(), null, { timeout: 30000 }).catch(() => {});
    const go = frames(p, ms);
    await p.selectOption('#rpRgtSel', rgt);
    all.push(...await go);
  }
  console.log(w + ' reaction predictor (3 runs): ' + JSON.stringify(stats(all)));
  await ctx.close();
  const f = await page(w, '/environmental-science/tools/water-pollution.html');
  const btn = f.p.locator('button', { hasText: 'Watch it happen' }).first();
  const go = frames(f.p, 6000);
  await btn.click().catch(() => {});
  console.log(w + ' flagship (Watch it happen): ' + JSON.stringify(stats(await go)));
  await f.ctx.close();
}
await b.close(); server.close();
