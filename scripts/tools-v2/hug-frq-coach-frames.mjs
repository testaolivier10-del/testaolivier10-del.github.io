#!/usr/bin/env node
/* Frame checks for the AP® Human Geography FRQ coach v2 Explore (docs/tools-v2-hug-frq-coach-brief.md). Every
   animation frame, while the answer writes and erases, the page must agree with itself: the cause line names the verb
   the ladder is on; its quoted words, and the rubric line, show only when the answer drawn is exactly that verb's
   answer; the prompt's verb is the ladder's (or the prompt is mid fade); every written piece is colored exactly when
   the verb needs it; the slider's aria-valuetext names the verb; a word on show never moves. Runs through: a pointer drag up the ladder and back
   down fast, keyboard End and Home, a reversal in the middle of writing, Next question in the middle of writing,
   leaving for Test yourself in the middle of writing (the screen comes back clean), and reduced motion (the result
   at once). At 390 (touch drag) and 1440 (mouse), light.
   Usage: node scripts/tools-v2/hug-frq-coach-frames.mjs [--width 390]   (needs playwright) */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream } from 'node:fs';
import { dirname, extname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const WIDTHS = arg('--width', '') ? [+arg('--width', '')] : [390, 1440];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) { try { ({ chromium } = createRequire((process.env.PW_ROOT || '/opt/npm-tools') + '/')('playwright')); } catch (e2) { console.error('needs playwright'); process.exit(0); } }
const server = createServer((req, res) => { let f = resolve(ROOT, '.' + decodeURIComponent(req.url.split('?')[0])); if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); createReadStream(f).pipe(res); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port, URL = BASE + '/human-geography/tools/frq-coach.html';
const EXE = existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome') ? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' : undefined;
const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
let fails = 0, checks = 0;
const fail = (m) => { fails++; if (fails < 40) console.log('FAIL ' + m); };
const ok = (c, m) => { checks++; if (!c) fail(m); };

const PROBE = () => {
  window.__fx = { n: 0, busy: 0, bad: [] }; window.__fxOn = true;
  const E = window.FrqCoachExplore, F = window.ApHugMath.frqCoach;
  const loop = () => {
    const s = E.state(), v = s.verb, b = window.__fx, inp = document.querySelector('.fcx-drag input');
    b.n++; if (s.drawn !== s.stop) b.busy++;
    const bad = (m) => { if (b.bad.length < 12) b.bad.push(b.n + ': ' + m); };
    if (!s.take) {
      if (s.cause[0] !== F.VERBS[v].name) bad('cause verb ' + s.cause[0] + ' on ' + v);
      if (s.cause.length === 3 && s.drawn !== s.stop) bad('quoted words before the answer is drawn');
      if (s.cause.length === 3 && s.cause[2] !== '“' + E._key() + '”') bad('quoted words not the added piece');
    }
    if (s.rubric && (s.rubricFor !== v || s.drawn !== s.stop || s.rubric !== F.RUBRIC_LINE[v])) bad('rubric line ' + s.rubricFor + ' while ' + v + ' drawn ' + s.drawn);
    if (!document.querySelector('.fcx-prompt.is-swap') && s.promptVerb.replace(/\s+/g, ' ') !== F.VERBS[v].name) bad('prompt verb ' + s.promptVerb + ' on ' + v);
    F.PIECES.forEach((k) => { const p = s.pieces[k]; if (p.shown > 0 && p.on !== F.NEEDED[v].includes(k)) bad(k + ' colored ' + p.on + ' on ' + v); });
    if (inp && inp.getAttribute('aria-valuetext').indexOf(F.VERBS[F.LADDER[+inp.value]].name) !== 0) bad('valuetext');
    if (+inp.value !== s.stop) bad('slider ' + inp.value + ' vs ' + s.stop);
    // a word on show never moves: the first word of every piece with words on show keeps its place frame to frame
    const pos = {};
    document.querySelectorAll('.fcx-p').forEach((el) => { const w = el.querySelector('.fcx-w.is-in'); if (w) { const r = w.getBoundingClientRect(); pos[el.getAttribute('data-role')] = Math.round(r.left) + ',' + Math.round(r.top); } });
    if (b.pos && b.q === E.ctx() && b.w === innerWidth) Object.keys(pos).forEach((k) => { if (b.pos[k] && b.pos[k] !== pos[k]) bad(k + ' moved ' + b.pos[k] + ' to ' + pos[k]); });
    b.pos = pos; b.q = E.ctx(); b.w = innerWidth;
    if (window.__fxOn) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
};
const READ = () => { window.__fxOn = false; return window.__fx; };

for (const w of WIDTHS) {
  for (const reduce of [false, true]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, serviceWorkers: 'block', hasTouch: w < 900, isMobile: w < 500, bypassCSP: true, reducedMotion: reduce ? 'reduce' : 'no-preference' });
    await ctx.route(u => !u.href.startsWith(BASE), r => r.abort());
    await ctx.route('**/assets/premium.js', async r => { const res = await r.fetch(); const body = (await res.text()).replace('function has(course) {', 'function has(course) { return true;'); await r.fulfill({ response: res, body }); });
    await ctx.addInitScript(() => { try { localStorage.setItem('tk2c:aphug-frq-ladder', '1'); localStorage.removeItem('aphug_frqcoach_x1'); localStorage.removeItem('aphug_toolmode_frq-coach'); } catch (e) {} });
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForFunction(() => window.FrqCoachExplore && document.querySelector('.fcx-drag .tk2-knob'), null, { timeout: 20000 });
    await page.waitForTimeout(800);
    const tag = `${w}${reduce ? ' reduced' : ''}`;
    if (reduce) {
      await page.evaluate(() => window.FrqCoachExplore.stop(4));
      await page.waitForTimeout(60);
      ok(await page.evaluate(() => window.FrqCoachExplore.state().drawn === 4), `${tag}: reduced motion does not show the result at once`);
      await page.evaluate(() => window.FrqCoachExplore.stop(1)); await page.waitForTimeout(60);
      ok(await page.evaluate(() => { const s = window.FrqCoachExplore.state(); return s.drawn === 1 && !!document.querySelector('.fcx-ans.is-fade'); }), `${tag}: reduced motion: no short cross fade, or not at once`);
      await ctx.close(); continue;
    }
    await page.evaluate(PROBE);
    // 1. a pointer drag up the ladder and fast back down
    const tr = await page.evaluate(() => { const g = window.FrqCoachExplore._G(), r = document.querySelector('.fcx-scene').getBoundingClientRect(); document.querySelector('.fcx-scene').scrollIntoView({ block: 'start' }); return null; });
    await page.waitForTimeout(200);
    const T = await page.evaluate(() => { const g = window.FrqCoachExplore._G(), r = document.querySelector('.fcx-scene').getBoundingClientRect(); return [r.left + g.track[0], r.top + g.track[1], r.left + g.track[2], r.top + g.track[3]]; });
    const pt = (f) => [T[0] + (T[2] - T[0]) * f, T[1] + (T[3] - T[1]) * f];
    if (w < 900) {
      const cdp = await ctx.newCDPSession(page);
      const touch = async (type, p) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: p[0], y: p[1] }] });
      await touch('touchStart', pt(0));
      for (let i = 1; i <= 20; i++) { await touch('touchMove', pt(i / 20)); await page.waitForTimeout(30); }
      await page.waitForTimeout(500);
      for (let i = 20; i >= 0; i -= 4) { await touch('touchMove', pt(i / 20)); await page.waitForTimeout(16); }
      await touch('touchEnd', pt(0));
    } else {
      await page.mouse.move(...pt(0)); await page.mouse.down();
      for (let i = 1; i <= 20; i++) { await page.mouse.move(...pt(i / 20)); await page.waitForTimeout(30); }
      await page.waitForTimeout(500);
      for (let i = 20; i >= 0; i -= 4) { await page.mouse.move(...pt(i / 20)); await page.waitForTimeout(16); }
      await page.mouse.up();
    }
    await page.waitForTimeout(2600);
    ok(await page.evaluate(() => { const s = window.FrqCoachExplore.state(); return s.stop === 0 && s.drawn === 0; }), `${tag}: the drag did not end on Identify`);
    ok(await page.evaluate(() => window.__fx.busy > 10), `${tag}: no frames caught mid writing`);
    // 2. keyboard End and Home on the slider
    await page.focus('.fcx-drag input'); await page.keyboard.press('End'); await page.waitForTimeout(700); await page.keyboard.press('Home'); await page.waitForTimeout(2200);
    ok(await page.evaluate(() => window.FrqCoachExplore.state().drawn === 0), `${tag}: End then Home did not come back to Identify`);
    // 3. a reversal in the middle of writing
    await page.evaluate(() => window.FrqCoachExplore.stop(4)); await page.waitForTimeout(450);
    ok(await page.evaluate(() => window.FrqCoachExplore.running()), `${tag}: not writing after a jump to the top`);
    await page.evaluate(() => window.FrqCoachExplore.stop(1)); await page.waitForTimeout(2000);
    ok(await page.evaluate(() => window.FrqCoachExplore.state().drawn === 1), `${tag}: the reversal did not settle on Describe`);
    // 4. Next question in the middle of writing
    await page.evaluate(() => window.FrqCoachExplore.stop(3)); await page.waitForTimeout(250);
    const q0 = await page.evaluate(() => window.FrqCoachExplore.ctx());
    await page.evaluate(() => document.querySelector('.fcx-next').click()); await page.waitForTimeout(2600);
    ok(await page.evaluate((q) => { const s = window.FrqCoachExplore.state(); return window.FrqCoachExplore.ctx() !== q && s.drawn === 3; }, q0), `${tag}: Next question mid writing did not settle on Compare`);
    const fx = await page.evaluate(READ);
    ok(!fx.bad.length, `${tag}: frames disagree: ${fx.bad.join(' | ')}`);
    console.log(`${tag}: ${fx.n} frames read, ${fx.busy} while the answer changed`);
    checks += fx.n;
    // 5. leaving for Test yourself mid writing: nothing runs on, and the screen comes back clean
    await page.evaluate(() => window.FrqCoachExplore.stop(4)); await page.waitForTimeout(200);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button, [role="tab"]')].find(x => /^Test yourself$/.test(x.textContent.trim()) && x.offsetParent); b.click(); });
    await page.waitForTimeout(300);
    ok(await page.evaluate(() => !window.FrqCoachExplore.running() && window.FrqCoachExplore.state().drawn === 4), `${tag}: the writing ran on after leaving Explore`);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button, [role="tab"]')].find(x => /^Explore$/.test(x.textContent.trim()) && x.offsetParent); b.click(); });
    await page.waitForTimeout(400);
    ok(await page.evaluate(() => { const s = window.FrqCoachExplore.state(); return s.drawn === 4 && !document.querySelector('.fcx-prompt.is-swap, .fcx-scene.is-turn'); }), `${tag}: Explore did not come back clean`);
    ok(!errs.length, `${tag}: console errors ${errs.join(' | ')}`);
    await ctx.close();
  }
}
await browser.close(); server.close();
console.log(`${fails ? 'FAILED' : 'passed'}: ${checks - fails} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
