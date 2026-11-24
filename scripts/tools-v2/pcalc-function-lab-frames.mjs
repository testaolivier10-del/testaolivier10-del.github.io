/* Frame by frame check for AP® Precalculus Function lab (docs/tools-v2-pcalc-function-lab-brief.md). With motion on,
   a watcher in the page reads every animation frame during each change and asserts that the picture, the labels and
   the cause line agree on that frame (standard rule 14), all read from what is drawn:
     - the square pin's knob sits at the drawn (h, k) and the round pin's knob on its drawn bead;
     - the tags read the drawn parameters; the cause line's a, b, h, k pills say the same numbers as the tags;
     - the wire's label carries the drawn a, h and k;
     - during Show the steps the step named on the cause line is the one moving.
   The changes: a fast pointer drag of each pin and its reversal, a drag of the round pin across h (the flip), a real
   touch drag (CDP), Shift and arrow key jumps, Show the steps from start to end, a new parent (the morph), Back to f,
   and leaving for Test yourself in the middle of Show the steps (every timer stops; Explore comes back clean).
   Shots of mid frames go to --shots dir.

     node scripts/tools-v2/pcalc-function-lab-frames.mjs [width] [--shots dir]   (default 390, then run 1440) */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const require = createRequire(join(ROOT, 'package.json'));
const { chromium } = require('playwright');
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const p = join(ROOT, normalize(decodeURIComponent(req.url.split('?')[0])));
  if (!p.startsWith(ROOT) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const args = process.argv.slice(2), si = args.indexOf('--shots'), SHOTS = si >= 0 ? args[si + 1] : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const W = args[0] && !args[0].startsWith('--') ? +args[0] : 390, H = { 360: 740, 390: 844, 768: 1024, 1024: 768, 1280: 800, 1440: 900 }[W] || 900;
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, serviceWorkers: 'block', deviceScaleFactor: 1, hasTouch: true, reducedMotion: 'no-preference' });
const page = await ctx.newPage(), errs = [];
page.on('console', m => { if (m.type() === 'error' && !/net::ERR_FAILED/.test(m.text())) errs.push(m.text()); });
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
await page.addInitScript(() => { window.LevlToolTest = true; try { ['tk2c:apprecalc-function-lab', 'tk2h:apprecalc-function-lab-hk', 'tk2h:apprecalc-function-lab-drag'].forEach(k => localStorage.setItem(k, '1')); } catch (e) {} });
await page.goto(BASE + '/precalculus/tools/function-lab.html', { waitUntil: 'load' });
await page.waitForSelector('.fl2-svg .fl2-wire-h'); await page.waitForTimeout(500);
// the watcher: one check per animation frame
await page.evaluate(() => {
  const T = window.ApPrecalcFunctionLab, num = v => String(+(+v).toFixed(2)).replace('-', '−');
  const W = window.__flw = { frames: 0, bad: [], on: false, steps: new Set() };
  function check() {
    if (!W.on) return;
    W.frames++;
    const G = T.G(), D = T.D, S = T.S, P = T.shownP(), sc = document.querySelector('.fl2-scene').getBoundingClientRect(), k = sc.width / G.W;
    const out = [], Fa = T.FL.FAMILIES[S.fam], kp = Fa.keys[Fa.shape];
    const at = n => { const r = document.querySelector('.fl2-' + n + ' .tk2-knob').getBoundingClientRect(); return [(r.left + r.width / 2 - sc.left) / k, (r.top + r.height / 2 - sc.top) / k]; };
    const hk = at('hk'), ab = at('ab'), wh = [G.sx(D.h), G.sy(D.k)], wa = [G.sx(kp[0] * D.sx + D.h), G.sy(kp[1] * D.sy + D.k)];
    if (Math.hypot(hk[0] - wh[0], hk[1] - wh[1]) > 1.5) out.push('square pin off the drawn (h, k) by ' + Math.hypot(hk[0] - wh[0], hk[1] - wh[1]).toFixed(1));
    if (Math.hypot(ab[0] - wa[0], ab[1] - wa[1]) > 1.5) out.push('round pin off its drawn bead by ' + Math.hypot(ab[0] - wa[0], ab[1] - wa[1]).toFixed(1));
    const tg = document.querySelector('.fl2-hk .tk2-tag').textContent, ta = document.querySelector('.fl2-ab .tk2-tag').textContent;
    if (tg !== 'h = ' + num(P.h) + ', k = ' + num(P.k)) out.push('square tag ' + tg + ' vs drawn h = ' + P.h + ', k = ' + P.k);
    if (!ta.startsWith('a = ' + num(P.a) + ', b = ')) out.push('round tag ' + ta + ' vs drawn a = ' + P.a);
    const c = document.querySelector('.fl2 .tk2-cause'), ct = c.textContent;
    if (!c.classList.contains('is-take')) {
      const m = (re) => { const x = ct.match(re); return x ? x[1] : null; };
      const ch = m(/h = ([−\d.]+)/), ck = m(/k = ([−\d.]+)/), ca = m(/a = ([−\d.]+)/), cb = m(/b = ([−\d./]+)/);
      if (ch != null && ch !== num(P.h)) out.push('cause h ' + ch + ' vs drawn ' + P.h);
      if (ck != null && ck !== num(P.k)) out.push('cause k ' + ck + ' vs drawn ' + P.k);
      if (ca != null && ca !== num(Math.abs(P.a)) && ca !== num(P.a)) out.push('cause a ' + ca + ' vs drawn ' + P.a);
      if (cb != null && !ta.includes('b = ' + cb) && !ta.includes('b = −' + cb)) out.push('cause b ' + cb + ' vs tag ' + ta);
      const st = ct.match(/Step (\d) of/); if (st) W.steps.add(st[1]);
    }
    const gl = document.querySelector('.fl2-lab.is-g');
    if (gl && gl.style.display !== 'none') { const t = gl.textContent;
      if (Math.abs(P.h) > 1e-9 && !t.includes(num(Math.abs(P.h)))) out.push('label lacks drawn h ' + P.h + ': ' + t);
      if (Math.abs(P.k) > 1e-9 && !t.includes(num(Math.abs(P.k)))) out.push('label lacks drawn k ' + P.k + ': ' + t); }
    out.forEach(x => { if (W.bad.length < 60) W.bad.push(W.tag + ': ' + x); });
    requestAnimationFrame(check);
  }
  W.start = tag => { W.tag = tag; if (!W.on) { W.on = true; requestAnimationFrame(check); } };
  W.stop = () => { W.on = false; };
});
const watch = (tag) => page.evaluate(t => window.__flw.start(t), tag);
const shot = n => SHOTS ? page.locator('.fl2').screenshot({ path: join(SHOTS, `${String(W).padStart(4, '0')}-${n}.png`) }) : null;
const knob = async n => { const b = await page.locator('.fl2-' + n + ' .tk2-knob').boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
const u = await page.evaluate(() => window.ApPrecalcFunctionLab.G().u);
let n = 0; const fails = [];
// 1 a fast drag of the square pin and back
await watch('square pin drag');
let [x, y] = await knob('hk');
await page.mouse.move(x, y); await page.mouse.down();
for (let i = 1; i <= 6; i++) await page.mouse.move(x - i * u * 0.5, y - i * u * 0.3);
await shot('a-hk-mid');
for (let i = 5; i >= 0; i--) await page.mouse.move(x - i * u * 0.5, y - i * u * 0.3);
await page.mouse.up(); await page.waitForTimeout(250);
// 2 the round pin up (a), then across h (b flips), and reversed
await watch('round pin drag');
[x, y] = await knob('ab');
await page.mouse.move(x, y); await page.mouse.down();
for (let i = 1; i <= 8; i++) { await page.mouse.move(x, y - i * u * 0.15); await page.waitForTimeout(8); }
for (let i = 1; i <= 10; i++) { await page.mouse.move(x - i * u * 0.3, y - 1.2 * u); await page.waitForTimeout(8); }
await page.waitForTimeout(90); await shot('b-flip-mid'); await page.waitForTimeout(400);
for (let i = 9; i >= 0; i--) { await page.mouse.move(x - i * u * 0.3, y - 1.2 * u); }
await page.mouse.up(); await page.waitForTimeout(500);
n++; { const p = await page.evaluate(() => window.ApPrecalcFunctionLab.S.p); if (!(p.b > 0 && p.a > 1)) fails.push('round pin drag did not end with a > 1, b > 0: ' + JSON.stringify(p)); }
// 3 a real touch drag of the square pin (CDP)
await watch('touch drag');
[x, y] = await knob('hk');
const cdp = await ctx.newCDPSession(page);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + i * u * 0.12, y: y + i * u * 0.1 }] });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await page.waitForTimeout(300);
n++; { const p = await page.evaluate(() => window.ApPrecalcFunctionLab.S.p); if (Math.abs(p.h - 2) < 0.05 && Math.abs(p.k + 1) < 0.05) fails.push('the touch drag did not move the square pin'); }
// 4 keys: Shift jumps and plain steps on both pins
await watch('keys');
await page.focus('.fl2-hk .tk2-knob'); await page.keyboard.press('Shift+ArrowLeft'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('Shift+ArrowUp');
await page.focus('.fl2-ab .tk2-knob'); await page.keyboard.press('Shift+ArrowUp'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowRight');
await page.waitForTimeout(500);
// 5 Show the steps, start to end
await page.evaluate(() => window.ApPrecalcFunctionLab.set({ a: -2, b: 2, h: 1, k: 1 }, 'quadratic'));
await watch('show the steps');
await page.click('.fl2 .tk2-play');
for (const t of [300, 1500, 3000]) { await page.waitForTimeout(t === 300 ? 300 : 1200); await shot('c-steps-' + t); }
{ let end = false; for (let i = 0; i < 40 && !end; i++) { await page.waitForTimeout(500); end = await page.evaluate(() => document.querySelector('.fl2 .tk2-cause').classList.contains('is-take')); } if (!end) fails.push('Show the steps did not end on the takeaway'); }
await shot('d-steps-end');
n++; { const s = await page.evaluate(() => [...window.__flw.steps].sort().join(',')); if (s !== '1,2,3,4,5') fails.push('steps named: ' + s + ' (want 1 to 5)'); }
// 6 a new parent (the morph) and Back to f
await watch('new parent');
await page.selectOption('.fl2-sel', 'reciprocal'); await page.waitForTimeout(140); await shot('e-morph-mid'); await page.waitForTimeout(500);
await watch('back to f');
await page.click('.fl2-reset'); await page.waitForTimeout(150); await shot('f-reset-mid'); await page.waitForTimeout(500);
n++; { const p = await page.evaluate(() => window.ApPrecalcFunctionLab.S.p); if (p.a !== 1 || p.b !== 1 || p.h !== 0 || p.k !== 0) fails.push('Back to f left ' + JSON.stringify(p)); }
await page.evaluate(() => window.__flw.stop());
// 7 leave for Test yourself in the middle of Show the steps: every loop stops; Explore comes back clean
await page.evaluate(() => window.ApPrecalcFunctionLab.set({ a: 2, b: 1, h: 2, k: -1 }, 'quadratic'));
await page.click('.fl2 .tk2-play'); await page.waitForTimeout(700);
await page.click('.bt-mode[data-m="quiz"], .ls-root [data-m="quiz"]').catch(async () => { await page.getByRole('button', { name: 'Test yourself' }).first().click(); });
await page.waitForTimeout(400);
n++; { const r = await page.evaluate(() => ({ busy: window.ApPrecalcFunctionLab.busy(), playing: window.ApPrecalcFunctionLab.steps.playing() })); if (r.busy || r.playing) fails.push('a loop still runs in Test yourself: ' + JSON.stringify(r)); }
await page.getByRole('button', { name: 'Explore' }).first().click(); await page.waitForTimeout(500);
n++; { const r = await page.evaluate(() => { const T = window.ApPrecalcFunctionLab, D = T.D, p = T.S.p; return { same: Math.abs(D.sy - p.a) < 1e-9 && Math.abs(D.h - p.h) < 1e-9 && Math.abs(D.k - p.k) < 1e-9 && Math.abs(D.sx - 1 / p.b) < 1e-9, take: document.querySelector('.fl2 .tk2-cause').classList.contains('is-take') }; }); if (!r.same) fails.push('Explore came back mid change'); }
await shot('g-back');
const W2 = await page.evaluate(() => ({ frames: window.__flw.frames, bad: window.__flw.bad }));
await browser.close(); server.close();
const all = fails.concat(W2.bad, errs);
console.log(`${W}: ${W2.frames} frames watched, ${n} end checks, ${all.length} failures`);
if (all.length) { console.log(all.slice(0, 60).join('\n')); process.exit(1); }
