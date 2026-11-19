#!/usr/bin/env node
/* Interaction checks for the A&P Predict the change v2 (docs/tools-v2-anp-predict-brief.md): lands on Explore with the
   cue; a real mouse drag (desktop) or a real touch drag (phone; the page does not scroll) moves the arteriole wall and the
   change spreads (frames caught mid way); the cue leaves; arrow keys and End move the knob; Start over; reduced motion is
   at once with a cross fade; switching to Test yourself mid change stops the loop and coming back resumes it; "?" has
   "Test yourself on this", which opens that screen's scenarios; Test yourself records a right and a wrong answer with
   the old item ids; deep links (#explore/<screen>, ?topic=, ?id=, ?level=); the real locked page shows the Premium card
   and no stage; no console errors.
     node scripts/tools-v2/anp-predict-interact.mjs [--port 8931] [--width 1440] [--dark] [--shots dir] */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const PORT = arg('--port', '8931'), W = +arg('--width', '1440'), DARK = process.argv.includes('--dark'), SHOTS = arg('--shots', '');
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const H = W < 500 ? 844 : W < 900 ? 1024 : 900, TOUCH = W < 900, tagW = `${W}${DARK ? '-dark' : '-light'}`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
let pass = 0, fails = 0;
const ok = (c, m) => { if (c) pass++; else { fails++; console.log('FAIL ' + m); } };
async function open(path, { unlock = true, reduced = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, serviceWorkers: 'block', hasTouch: TOUCH, isMobile: TOUCH, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  if (unlock) await ctx.route('**/assets/premium.js', (r) => r.fulfill({ contentType: 'application/javascript', body: readFileSync(join(ROOT, 'assets/premium.js'), 'utf8').replace('function has(course) {', 'function has(course) { return true;') }));
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await ctx.addInitScript((d) => { try { localStorage.setItem('nremt_theme', d ? 'dark' : 'light'); } catch (e) {} }, DARK);
  const page = await ctx.newPage(); page.errs = [];
  page.on('pageerror', (e) => page.errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) page.errs.push(m.text()); });
  await page.goto(`http://127.0.0.1:${PORT}/anatomy-physiology/tools/${path}`, { waitUntil: 'load' });
  await page.waitForTimeout(1800);
  return { ctx, page };
}
const shot = async (page, n) => { if (SHOTS) await page.screenshot({ path: join(SHOTS, `${n}-${tagW}.png`) }); };
const mode = (page) => page.evaluate(() => { const m = document.querySelector('.ls-root, [data-ls-mode]'); return document.querySelector('.tk2-qs') ? 'quiz' : 'explore'; });

// 1. landing, drag, spread, keys, Start over, mode switch
{
  const { ctx, page } = await open('predict.html');
  ok(await page.evaluate(() => !!document.querySelector('.px .tk2-cue')), `${tagW}: lands on Explore with the cue`);
  ok((await mode(page)) === 'explore', `${tagW}: lands on Explore`);
  await shot(page, '01-landing');
  const k = await page.$('.px .tk2-handle .tk2-knob'), q = await k.boundingBox();
  const x = q.x + q.width / 2, y = q.y + q.height / 2, sy0 = await page.evaluate(() => scrollY);
  if (TOUCH) {
    const cdp = await ctx.newCDPSession(page);
    const t = (type, yy) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y: yy }] });
    await t('touchStart', y); for (let i = 1; i <= 8; i++) { await t('touchMove', y + i * 4); await page.waitForTimeout(16); } await t('touchEnd');
  } else { await page.mouse.move(x, y); await page.mouse.down(); for (let i = 1; i <= 8; i++) { await page.mouse.move(x, y + i * 4); await page.waitForTimeout(16); } await page.mouse.up(); }
  await page.waitForTimeout(90);
  const mid = await page.evaluate(() => { const A = window.AnpPredictExplore.current, st = A._st(); return { c: st.c, flow: st.v.flow, cause: A._cause(), settled: A._settled() }; });
  await shot(page, '02-mid-drag');
  ok(mid.c < 0.99, `${tagW}: dragging the wall down narrows the arteriole (radius ${mid.c})`);
  ok(!mid.settled, `${tagW}: a frame caught while the change spreads`);
  ok(TOUCH ? (await page.evaluate(() => scrollY)) === sy0 : true, `${tagW}: a touch drag on the knob does not scroll the page`);
  ok(!(await page.evaluate(() => !!document.querySelector('.px .tk2-cue'))), `${tagW}: the cue leaves after the first drag`);
  for (let i = 0; i < 60 && !(await page.evaluate(() => window.AnpPredictExplore.current._settled())); i++) await page.waitForTimeout(100);
  const end = await page.evaluate(() => { const A = window.AnpPredictExplore.current, st = A._st(); return { c: st.c, flow: st.v.flow, cause: A._cause(), res: st.v.res }; });
  ok(end.flow < 1 && end.res > 1 && /flow/.test(end.cause), `${tagW}: settles with resistance up, flow down and the takeaway (${end.cause})`);
  await page.focus('.px .tk2-handle .tk2-knob');
  await page.keyboard.press('End'); await page.waitForTimeout(2500);
  await page.keyboard.press('Home'); await page.waitForTimeout(60);
  const midKey = await page.evaluate(() => window.AnpPredictExplore.current._settled());
  ok(!midKey, `${tagW}: Home tweens (caught mid way)`);
  await page.waitForTimeout(2500);
  ok(Math.abs((await page.evaluate(() => window.AnpPredictExplore.current._st().c)) - 0.5) < 1e-3, `${tagW}: Home goes to the narrowest`);
  await shot(page, '03-narrow');
  await page.keyboard.press('ArrowUp'); await page.waitForTimeout(1600);
  ok(Math.abs((await page.evaluate(() => window.AnpPredictExplore.current._st().c)) - 0.55) < 1e-3, `${tagW}: ArrowUp widens a step`);
  // leave for Test yourself in the middle of a change: the loop stops; coming back resumes
  await page.keyboard.press('End'); await page.waitForTimeout(80);
  await page.click('.ls-modes [data-v="quiz"], .ls-modes button:has-text("Test yourself")');
  await page.waitForTimeout(150);
  ok(!(await page.evaluate(() => window.AnpPredictExplore.current._loop())), `${tagW}: Test yourself stops Explore's animation`);
  ok((await mode(page)) === 'quiz', `${tagW}: Test yourself shows`);
  await shot(page, '06-test-yourself');
  await page.click('.ls-modes [data-v="explore"], .ls-modes button:has-text("Explore")');
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.AnpPredictExplore.current._loop()), `${tagW}: back in Explore the animation runs again`);
  await page.click('.px-reset'); await page.waitForTimeout(400);
  ok(Math.abs((await page.evaluate(() => window.AnpPredictExplore.current._st().c)) - 1) < 1e-3, `${tagW}: Start over brings back the usual radius`);
  // every screen once at an end, for the shots
  for (const [t, v] of [['breath', 24], ['adh', 1], ['heart', 160], ['breath', 8], ['adh', 0], ['heart', 90]]) {
    await page.evaluate(([t, v]) => { const A = window.AnpPredictExplore.current; A.tab(t); A._settle(v); }, [t, v]); await page.waitForTimeout(400);
    await shot(page, `04-${t}-${v}`);
  }
  // "?" -> Test yourself on this
  await page.evaluate(() => window.AnpPredictExplore.current.tab('adh'));
  const opened = await page.evaluate(() => { const b = document.querySelector('.px-ref-q'); if (!b) return false; b.click(); return true; });
  await page.waitForTimeout(700);
  ok(opened && (await mode(page)) === 'quiz', `${tagW}: "Test yourself on this" opens Test yourself`);
  const title = await page.evaluate(() => (document.querySelector('#pc-title') || {}).textContent || '');
  ok(/ADH|desert|tumor/i.test(title), `${tagW}: on that screen's scenarios (${title})`);
  ok(page.errs.length === 0, `${tagW}: no console errors (${page.errs.join(' | ')})`);
  await ctx.close();
}
// 2. reduced motion: at once, with a cross fade, no loop
{
  const { ctx, page } = await open('predict.html#explore/breath', { reduced: true });
  ok(!(await page.evaluate(() => window.AnpPredictExplore.current._loop())), `${tagW}: reduced motion runs no loop`);
  await page.focus('.px .tk2-handle .tk2-knob'); await page.keyboard.press('End'); await page.waitForTimeout(40);
  const r = await page.evaluate(() => ({ s: window.AnpPredictExplore.current._settled(), fade: !!document.querySelector('.px-fade'), ph: window.AnpPredictExplore.current._st().v.ph }));
  ok(r.s && r.fade && r.ph > 7.6, `${tagW}: reduced motion shows the result at once with a cross fade (pH ${r.ph.toFixed(2)})`);
  await ctx.close();
}
// 3. Test yourself records right and wrong with the old ids
{
  const { ctx, page } = await open('predict.html?id=tube-narrows');
  ok((await mode(page)) === 'quiz', `${tagW}: ?id= opens Test yourself`);
  const ans = { 0: 'up', 1: 'down', 2: 'up' };   // the last one is wrong (the gradient does not change)
  for (const [i, v] of Object.entries(ans)) await page.evaluate(([i, v]) => { const g = document.querySelectorAll('.pc-var')[i]; g.querySelector(`.pc-dir button[data-v="${v}"]`).click(); }, [i, v]);
  await page.evaluate(() => document.querySelector('.pc-check').click());
  await page.waitForTimeout(800);
  const q = await page.evaluate(() => { const s = window.AnpCore.load().q; return ['resistance', 'flow', 'gradient'].map((v) => { const r = s['predict:tube-narrows:' + v]; return r ? !!r.right : null; }); });
  ok(q[0] === true && q[1] === true && q[2] === false, `${tagW}: records right, right, wrong under predict:tube-narrows:* (${q})`);
  await shot(page, '07-test-answered');
  ok(page.errs.length === 0, `${tagW}: no console errors in Test yourself (${page.errs.join(' | ')})`);
  await ctx.close();
}
// 4. deep links
for (const [path, want, tab] of [['predict.html#explore/heart', 'explore', 'heart'], ['predict.html?topic=urine-concentration', 'explore', 'adh'], ['predict.html?topic=cardiac-cycle', 'quiz', null], ['predict.html?level=4', 'quiz', null], ['predict.html?chapter=respiratory', 'explore', 'breath']]) {
  const { ctx, page } = await open(path);
  const m = await mode(page), t = await page.evaluate(() => window.AnpPredictExplore.current.tab());
  ok(m === want && (!tab || t === tab), `${tagW}: ${path} opens ${want}${tab ? ' ' + tab : ''} (got ${m} ${t})`);
  await ctx.close();
}
// 5. the real locked state: the Premium card, no stage
{
  const { ctx, page } = await open('predict.html', { unlock: false });
  const r = await page.evaluate(() => ({ stage: !!document.querySelector('.px-pic') && document.querySelector('.px-pic').offsetWidth > 0, gate: /Premium/i.test(document.body.innerText) }));
  ok(!r.stage && r.gate, `${tagW}: locked page shows the Premium card and no stage (${JSON.stringify(r)})`);
  await shot(page, '08-locked');
  await ctx.close();
}
await b.close();
console.log(`${tagW}: ${pass} pass, ${fails} fail`);
process.exit(fails ? 1 : 0);
