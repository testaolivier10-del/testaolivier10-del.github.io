/* Frame by frame check of the Reaction Predictor (docs/tools-v2-reaction-predictor-brief.md): every animation frame of
   a set of runs, read in the page on each requestAnimationFrame, against what is drawn at that frame:
     - the names on the picture show only while the picture holds still (a pause, or the end), never while it moves,
       and then sit clear of every ball;
     - the cause line names a result, and the tray shows products, only once the run has ended;
     - bromide's minus badge shows only after its bond to carbon has mostly gone, and a carbocation's plus only once
       bromide has left (the charge words agree with the bonds drawn);
     - no two balls sit on each other in any frame (in between the key states too), and nothing leaves the stage;
     - a change made in the middle of a run starts the new run at once (no frame of the old flask after it).
   Runs: E2 (2-bromobutane, NaOEt), Hofmann E2 (2-bromo-2-methylbutane, KOtBu), SN2 (bromomethane, NaOH), SN1 and E1
   (tert-butyl bromide, water, then heat), SN2 on the ring (bromocyclohexane, NaCN), no reaction (neopentyl bromide),
   E1 with a solvent base (2-bromo-2-methylbutane, NaI, heat), at 390 and 1440.

     node scripts/tools-v2/reaction-predictor-frames.mjs [widths]   (default 390,1440) */
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
const RUNS = process.env.RUNS ? JSON.parse(process.env.RUNS) : [['bubr2', 'oet', 0], ['mebubr', 'otbu', 0], ['mebr', 'oh', 0], ['tbubr', 'h2o', 0], ['tbubr', 'h2o', 1], ['cyhexbr', 'cn', 0], ['neopentyl', 'oet', 0], ['mebubr', 'i', 1]];
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
const fails = []; let frames = 0;
// in the page: watch every frame until the run settles
const watch = () => new Promise(res => {
  const V = window.OchemReactionPredictor.view, scene = document.querySelector('.rp2-scene'), S0 = scene.getBoundingClientRect();
  const labs = document.querySelector('.rs2-labs'), out = [], seen = { n: 0 };
  const num = (e, a) => +(e.getAttribute(a) || 0);
  function opa(e){ if (!e) return 0; const s = e.style; if (s.display === 'none') return 0; return s.opacity === '' ? 1 : +s.opacity; }
  let lastBalls = null, still = 0;
  function f(){
    seen.n++;
    const settled = V.settled();
    const balls = [...document.querySelectorAll('.rp2-a')].filter(g => opa(g) > 0.5).map(g => { const m = /translate\(([-\d.]+) ([-\d.]+)\) scale\(([\d.]+)\)/.exec(g.getAttribute('transform') || ''); const r = num(g.querySelector('circle'), 'r'); return m ? { k: g.getAttribute('data-k'), x: +m[1], y: +m[2], r: r * +m[3] } : null; }).filter(Boolean);
    const sig = balls.map(q => q.x.toFixed(1) + ',' + q.y.toFixed(1)).join(';');
    const moving = lastBalls !== null && sig !== lastBalls; lastBalls = sig;
    const named = !labs.classList.contains('is-wait') && labs.children.length && getComputedStyle(labs).opacity !== '0';
    if (named && moving) out.push('names shown while the molecule moves');
    // a name shown in a pause sits clear of every ball (4 px), as in the sweep's still states
    if (named) { const sr = scene.getBoundingClientRect();
      [...labs.children].filter(e => e.style.display !== 'none').forEach(e => { const r = e.getBoundingClientRect(), L = { l: r.left - sr.left, r: r.right - sr.left, t: r.top - sr.top, b: r.bottom - sr.top };
        balls.forEach(q => { if (!(L.r + 3.5 <= q.x - q.r || q.x + q.r + 3.5 <= L.l || L.b + 3.5 <= q.y - q.r || q.y + q.r + 3.5 <= L.t)) out.push('name "' + e.textContent + '" on ball ' + q.k); }); }); }
    const cause = document.querySelector('.rp2 .tk2-cause').textContent;
    if (!settled && /wins|→ *(SN1|SN2|E1|E2)|no reaction/.test(cause)) out.push('the cause line names a result mid run: ' + cause);
    if (!settled && document.querySelectorAll('.rp2-card').length) out.push('tray shows products mid run');
    // bromide's charge and its bond
    const st = [...document.querySelectorAll('.rp2-bo line.rs2-sig')].find(l => l.getAttribute('data-b') === 'a|lg' || l.getAttribute('data-b') === 'lg|a');
    const neg = document.querySelector('.rp2-ch .rs2-badge[data-k="lg"][data-t="n"]');
    if (opa(neg) > 0.5 && st && opa(st) > 0.5) out.push('Br⁻ badge while the C–Br bond is still drawn');
    const pos = document.querySelector('.rp2-ch .rs2-badge[data-k="a"][data-t="p"]');
    if (opa(pos) > 0.5 && st && opa(st) > 0.5) out.push('carbocation + while bromine is still bonded');
    for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) if (Math.hypot(balls[i].x - balls[j].x, balls[i].y - balls[j].y) < balls[i].r + balls[j].r - 3) out.push('balls ' + balls[i].k + ' and ' + balls[j].k + ' overlap');
    balls.forEach(q => { if (q.x - q.r < -1 || q.x + q.r > S0.width + 1 || q.y - q.r < -1 || q.y + q.r > S0.height + 1) out.push('ball ' + q.k + ' off the stage'); });
    if (settled) still++;
    if (still > 3) { res({ n: seen.n, out: [...new Set(out)] }); return; }
    requestAnimationFrame(f);
  }
  requestAnimationFrame(f);
});
for (const w of WIDTHS) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 641 ? 844 : 900 }, serviceWorkers: 'block' });
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.route(/supabase|umami|api\.levlprep|polar/, r => r.abort());
  await page.route(/assets\/premium\.js/, r => r.fulfill({ body: PREMIUM, contentType: 'application/javascript' }));
  await page.addInitScript(() => { try { localStorage.setItem('tk2c:ochem-rp-reagent', '1'); } catch (e) {} });
  await page.goto(BASE + '/ochem/tools/reaction-predictor.html', { waitUntil: 'load' });
  await page.waitForFunction(() => window.OchemReactionPredictor.view.settled(), null, { timeout: 30000 });
  for (const [sub, rgt, heat] of RUNS) {
    await page.evaluate(([sub, rgt, heat]) => { const V = window.OchemReactionPredictor.view; V.state.sub = window.OchemReactionPredictor.SUBSTRATES.find(x => x.id === sub); V.state.rgt = window.OchemReactionPredictor.REAGENTS.find(x => x.id === rgt); V.state.heat = !!heat; }, [sub, rgt, heat]);
    await page.evaluate(() => window.OchemReactionPredictor.view.play());
    const r = await page.evaluate(watch);
    frames += r.n;
    r.out.forEach(x => fails.push(`${w} ${sub}+${rgt}${heat ? ' heat' : ''}: ${x}`));
  }
  // a change mid run: the old flask's frames stop at once
  await page.evaluate(() => window.OchemReactionPredictor.view.play());
  await page.waitForTimeout(1800);
  await page.selectOption('#rpRgtSel', 'cn');
  const after = await page.evaluate(() => new Promise(res => requestAnimationFrame(() => res(window.OchemReactionPredictor.view.S().m.atoms.filter(a => a.rg === 'r').map(a => a.lab).join('')))));
  if (!/CN|^C/.test(after)) fails.push(w + ': after a change mid run the picture still shows ' + after);
  if (errs.length) fails.push(w + ': ' + errs.join(' | '));
  await ctx.close();
}
await b.close(); server.close();
console.log(frames + ' frames checked');
if (fails.length) { console.log(fails.join('\n')); process.exit(1); }
console.log('OK');
