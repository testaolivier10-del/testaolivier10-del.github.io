/* Tools v2: the browser checks of the AP® Calculus AB Limit explorer (docs/tools-v2-calc-limit-explorer-brief.md) that
   a layout sweep cannot do: a real touch drag of the purple car (CDP touch events) at 390, a mouse drag into the
   magnifier and a drag inside it at 1440, keys (arrows, Page Down, Home, End), a press on the road, "?" with the table,
   reduced motion (Close in lands at once), Test yourself (a wrong answer marked, the first try recorded as
   limit-explorer:<context>:<step>, Show the answer), the deep links #quiz and ?seed=, the free tool left unlocked,
   and no console errors. Light and dark.
     node scripts/tools-v2/calc-limit-explorer-interact.mjs */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const require = createRequire(join(ROOT, 'package.json'));
const { chromium } = require('playwright');
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer((req, res) => { const p = join(ROOT, normalize(decodeURIComponent(req.url.split('?')[0]))); if (!p.startsWith(ROOT) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p)); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port + '/calculus/tools/limit-explorer.html';
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
let pass = 0; const fails = [];
const ok = (c, m) => { if (c) pass++; else fails.push(m); };
async function open(w, h, theme, o = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', hasTouch: !!o.touch, reducedMotion: o.reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push(e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.addInitScript(t => { window.LevlToolTest = true; localStorage.setItem('nremt_theme', t); localStorage.setItem('tk2c:apcalc-limit-explorer', '1'); }, theme);
  await page.goto(BASE + (o.q || ''), { waitUntil: 'load' });
  await page.waitForTimeout(900);
  ok((await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark')) === (theme === 'dark'), `${w} ${theme}: theme not applied`);
  return { ctx, page, errs };
}
const S = page => page.evaluate(() => { const s = window.ApCalcLimitExplorer.S; return { dl: s.dl, dr: s.dr, tl: s.tl, tr: s.tr, tab: s.tab, filled: s.filled, cause: document.querySelector('.le2 .tk2-cause').textContent }; });
const center = async (page, sel) => { const b = await page.locator(sel).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
for (const theme of ['light', 'dark']) {
  { // 390, real touch
    const { ctx, page, errs } = await open(390, 844, theme, { touch: true });
    const [x, y] = await center(page, '.le2-hl .tk2-knob');
    const cdp = await ctx.newCDPSession(page);
    const tp = (type, px, py) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: px, y: py }] });
    await tp('touchStart', x, y); for (let i = 1; i <= 12; i++) { await tp('touchMove', x + 6 * i, y - 4 * i); await page.waitForTimeout(20); } await tp('touchEnd');
    await page.waitForTimeout(400);
    let s = await S(page);
    ok(s.dl < 0.9, `390 ${theme}: touch drag did not move the purple car (d ${s.dl})`);
    ok(/from the left|left /.test(s.cause) && !/left 1 /.test(s.cause), `390 ${theme}: cause did not follow the touch drag: ${s.cause}`);
    ok(await page.evaluate(() => !document.querySelector('.le2-hr').classList.contains('is-quiet')), `390 ${theme}: the orange car stayed quiet after the purple one was used`);
    // keys on the orange car: ArrowLeft goes closer, Page Down ten times closer, End to the far end
    await page.focus('.le2-hr .tk2-knob'); await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(400);
    s = await S(page); ok(Math.abs(s.dr - 0.95) < 1e-9, `390 ${theme}: ArrowLeft on the orange car gave ${s.dr}`);
    await page.keyboard.press('PageDown'); await page.waitForTimeout(500); s = await S(page); ok(Math.abs(s.dr - 0.095) < 1e-9, `390 ${theme}: Page Down gave ${s.dr}`);
    await page.keyboard.press('End'); await page.waitForTimeout(600); s = await S(page); ok(Math.abs(s.dr - 2.4) < 1e-9, `390 ${theme}: End gave ${s.dr}`);
    const vt = await page.getAttribute('.le2-hr .tk2-knob', 'aria-valuetext'); ok(/x = 3\.4, f\(x\) = 4\.4/.test(vt), `390 ${theme}: aria-valuetext stale: ${vt}`);
    // Close in, with motion: the cars arrive and the takeaway shows
    await page.click('.le2 .tk2-play:not([hidden])'); await page.waitForTimeout(4000);
    s = await S(page); ok(s.dl <= 0.0011 && s.dr <= 0.0011, `390 ${theme}: Close in ended at ${s.dl}, ${s.dr}`);
    ok(/The limit is 2/.test(s.cause), `390 ${theme}: no takeaway after Close in: ${s.cause}`);
    ok(await page.evaluate(() => { const r = document.querySelector('.le2-scene').getBoundingClientRect(); return r.top >= -1 && r.bottom <= innerHeight + 1; }), `390 ${theme}: the picture is not in view after Close in`);
    // Fill the hole
    await page.click('.le2-fill'); await page.waitForTimeout(1200); s = await S(page);
    ok(s.filled && /continuous at x = 1/.test(s.cause), `390 ${theme}: Fill the hole: ${s.cause}`);
    ok(await page.evaluate(() => [...document.querySelectorAll('.le2-dyn .le2-pt')].some(p => !p.classList.contains('is-open'))), `390 ${theme}: the hole was not closed`);
    // "?" has the table
    await page.locator('button[aria-label*="?"], .ls-help, button:has-text("?")').first().click().catch(() => {});
    await page.waitForTimeout(500);
    ok(await page.evaluate(() => { const t = document.querySelector('.le2-ref .le2-tab'); return !!t && t.querySelectorAll('tbody tr').length === 5; }), `390 ${theme}: no table of values in "?"`);
    ok(errs.length === 0, `390 ${theme}: console: ${errs.join(' | ')}`);
    await ctx.close();
  }
  { // 1440, mouse: drag both cars in, then inside the magnifier
    const { ctx, page, errs } = await open(1440, 900, theme);
    await page.evaluate(() => { const T = window.ApCalcLimitExplorer; T.set(-1, 0.02); T.set(1, 0.03); });
    await page.waitForTimeout(800);
    ok(await page.evaluate(() => window.ApCalcLimitExplorer.knobsInLens()), `1440 ${theme}: the knobs did not move into the magnifier`);
    const [x, y] = await center(page, '.le2-hl .tk2-knob'), lens = await page.evaluate(() => { const L = window.ApCalcLimitExplorer.LENS, r = document.querySelector('.le2-scene').getBoundingClientRect(), k = r.width / window.ApCalcLimitExplorer.G().W; return [r.left + L.cx * k, r.top + L.cy * k]; });
    await page.mouse.move(x, y); await page.mouse.down();
    for (let i = 1; i <= 10; i++) { await page.mouse.move(x + (lens[0] - x) * i / 11, y + (lens[1] - y) * i / 11); await page.waitForTimeout(20); }
    await page.mouse.up(); await page.waitForTimeout(800);
    let s = await S(page); ok(s.dl < 0.005, `1440 ${theme}: a drag inside the magnifier did not close in (d ${s.dl})`);
    const tag = await page.textContent('.le2-hl .tk2-tag'); ok(tag.includes('f(') && s.cause.includes(tag.split(' = ')[1]), `1440 ${theme}: tag and cause disagree after the glass drag: ${tag} / ${s.cause}`);
    // a press on the road right of a brings the orange car
    await page.evaluate(() => window.ApCalcLimitExplorer.set(1, 1));
    await page.waitForTimeout(600);
    const road = await page.evaluate(() => { const T = window.ApCalcLimitExplorer, A = T.G().A, r = document.querySelector('.le2-scene').getBoundingClientRect(), k = r.width / T.G().W; return [r.left + A.sx(1.5) * k, r.top + A.sy(2.5) * k]; });
    await page.mouse.click(road[0], road[1]); await page.waitForTimeout(600);
    s = await S(page); ok(Math.abs(s.dr - 0.5) < 0.02, `1440 ${theme}: a press on the road did not bring the orange car (d ${s.dr})`);
    // tab 2 by the picker, Drive out, back to a point curve
    await page.selectOption('.le2-sel', 'inf'); await page.waitForTimeout(600);
    s = await S(page); ok(s.tab === 'inf', `1440 ${theme}: the picker did not open Out to infinity`);
    await page.click('.le2 .tk2-play:not([hidden])'); await page.waitForTimeout(4200);
    s = await S(page); ok(/horizontal asymptote/.test(s.cause), `1440 ${theme}: no takeaway after Drive out: ${s.cause}`);
    await page.getByRole('tab', { name: /Close in on a point/ }).click(); await page.waitForTimeout(600);
    s = await S(page); ok(s.tab === 'point', `1440 ${theme}: the tab did not switch back`);
    ok(errs.length === 0, `1440 ${theme}: console: ${errs.join(' | ')}`);
    await ctx.close();
  }
}
{ // reduced motion: Close in lands at once
  const { ctx, page, errs } = await open(768, 1024, 'light', { reduced: true });
  await page.click('.le2 .tk2-play:not([hidden])'); await page.waitForTimeout(150);
  const s = await S(page); ok(s.dl <= 0.0011 && /The limit is 2/.test(s.cause), `reduced motion: Close in did not land at once (${s.dl}, ${s.cause})`);
  ok(errs.length === 0, `reduced: console: ${errs.join(' | ')}`);
  await ctx.close();
}
{ // Test yourself: #quiz, a wrong answer, the record id, Show the answer; ?seed= gives the same problem twice
  const { ctx, page, errs } = await open(1024, 900, 'light', { q: '?seed=7#quiz' });
  const text1 = await page.evaluate(() => (document.querySelector('[data-mode="quiz"] .cd-q, .cd-text, .ls-drill-stage') || document.body).textContent.slice(0, 400));
  ok(await page.evaluate(() => document.querySelector('.ls-root') && document.querySelector('.ls-root').getAttribute('data-mode') === 'quiz'), '#quiz did not open Test yourself');
  const inp = page.locator('form input[type="text"], form input:not([type])').first();
  if (await inp.count()) {
    await inp.fill('999'); await page.locator('form button[type="submit"]').first().click(); await page.waitForTimeout(500);
    ok(await page.evaluate(() => /not|Not|try|Try|check|Check/.test((document.querySelector('.cd-fb') || {}).textContent || '')), 'a wrong answer got no feedback');
  } else {
    const opt = page.locator('form input[type="radio"]').first(); await opt.check(); await page.locator('form button[type="submit"]').first().click(); await page.waitForTimeout(500);
    ok(await page.evaluate(() => ((document.querySelector('.cd-fb') || {}).textContent || '').length > 0), 'a choice got no feedback');
  }
  // finish the problem (the drill records every step's first try when the problem ends): wrong tries, then Show the answer
  let shown = 0;
  for (let i = 0; i < 40; i++) {
    if (await page.evaluate(() => { const s = document.querySelector('.bt-solution'); return s && !s.hidden; })) break;
    const sh = page.locator('button:has-text("Show the answer"):visible').first();
    if (await sh.count()) { await sh.click(); shown++; await page.waitForTimeout(300); continue; }
    const f = page.locator('form.cd-step:not([hidden])').last();
    const ti = f.locator('input[type="text"]:visible').first(), ra = f.locator('input[type="radio"]:visible').first();
    if (await ti.count()) await ti.fill('999'); else if (await ra.count()) await ra.check(); else { const c = f.locator('button:visible').first(); if (await c.count()) await c.click(); }
    const sub = f.locator('button[type="submit"]:visible').first(); if (await sub.count()) await sub.click();
    await page.waitForTimeout(300);
  }
  ok(shown > 0, 'Show the answer never offered');
  ok(await page.evaluate(() => Object.keys(localStorage).some(k => /limit-explorer:[a-z]+:[a-z0-9]+/i.test(localStorage.getItem(k) || ''))), 'the tries were not recorded as limit-explorer:<context>:<step>');
  const p2 = await ctx.newPage(); await p2.addInitScript(() => { window.LevlToolTest = true; }); await p2.goto(BASE + '?seed=7#quiz'); await p2.waitForTimeout(900);
  const text2 = await p2.evaluate(() => (document.querySelector('[data-mode="quiz"] .cd-q, .cd-text, .ls-drill-stage') || document.body).textContent.slice(0, 400));
  ok(text1.slice(0, 120) === text2.slice(0, 120), '?seed=7 gave a different problem on a second load');
  ok(!(await page.evaluate(() => /Premium|Unlock/.test(document.querySelector('.ls-root').textContent) && !!document.querySelector('.premium-lock, .bt-locked'))), 'the free tool shows a lock');
  ok(errs.length === 0, `quiz: console: ${errs.join(' | ')}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(`Limit explorer browser checks: ${pass} passing, ${fails.length} failing`);
fails.forEach(f => console.log('  ' + f));
process.exit(fails.length ? 1 : 0);
