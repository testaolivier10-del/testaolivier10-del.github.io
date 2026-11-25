/* Tools v2: the browser checks of the AP® Calculus AB Riemann sums tool (docs/tools-v2-calc-riemann-sums-brief.md)
   that a layout sweep cannot do: a real touch drag of the strips' knob (CDP touch events) at 390, a mouse drag at 1440,
   keys (arrows, Page Up doubles, Page Down halves, Home, End) with aria-valuetext current, a tap on a column read
   from what is drawn under the finger (a tap above a column, in the gap to the curve, selects nothing), the four sums,
   tab 2, a table (the knob hides, midpoint off for an even count), "?" with the strip table, reduced motion (Fill one
   by one lands at once), Test yourself (a wrong answer marked, the first tries recorded as riemann-sums:<context>:
   <step>, Show the answer), the deep links #quiz and ?seed=, the locked Premium card when not unlocked (as before), and
   no console errors. Light and dark. The Premium unlock is for this test only (assets/premium.js routed).
     node scripts/tools-v2/calc-riemann-sums-interact.mjs */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const require = createRequire(join(ROOT, 'package.json'));
const { chromium } = require('playwright');
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
let UNLOCK = true;
const server = createServer((req, res) => { const p = join(ROOT, normalize(decodeURIComponent(req.url.split('?')[0]))); if (!p.startsWith(ROOT) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  let body = readFileSync(p); if (UNLOCK && p.endsWith(join('assets', 'premium.js'))) body = String(body).replace('function has(course) {', 'function has(course) { return true;');
  res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(body); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port + '/calculus/tools/riemann-sums.html';
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
let pass = 0; const fails = [];
const ok = (c, m) => { if (c) pass++; else fails.push(m); };
async function open(w, h, theme, o = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', hasTouch: !!o.touch, reducedMotion: o.reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push(e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.addInitScript(t => { window.LevlToolTest = true; localStorage.setItem('nremt_theme', t); localStorage.setItem('tk2c:apcalc-riemann-sums', '1'); localStorage.setItem('tk2c:apcalc-riemann-sums-2', '1'); }, theme);
  await page.goto(BASE + (o.q || ''), { waitUntil: 'load' });
  await page.waitForTimeout(900);
  ok((await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark')) === (theme === 'dark'), `${w} ${theme}: theme not applied`);
  return { ctx, page, errs };
}
const S = page => page.evaluate(() => { const T = window.ApCalcRiemannSums, s = T.S; return { n1: s.n1, n2: s.n2, n: s.ps.length, kind: s.kind, tab: s.tab, sel: s.sel, fill: s.fill, cause: document.querySelector('.rs2 .tk2-cause').textContent, take: document.querySelector('.rs2 .tk2-cause').classList.contains('is-take') }; });
const center = async (page, sel) => { const b = await page.locator(sel).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
for (const theme of ['light', 'dark']) {
  { // 390, real touch
    const { ctx, page, errs } = await open(390, 844, theme, { touch: true });
    const [x, y] = await center(page, '.rs2 .rs2-knob .tk2-knob');
    const cdp = await ctx.newCDPSession(page);
    const tp = (type, px, py) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: px, y: py }] });
    await tp('touchStart', x, y); for (let i = 1; i <= 12; i++) { await tp('touchMove', x + 8 * i, y + (i % 2)); await page.waitForTimeout(20); } await tp('touchEnd');
    await page.waitForTimeout(600);
    let s = await S(page);
    ok(s.n1 > 8 && s.n === s.n1, `390 ${theme}: touch drag did not add strips (n ${s.n1}, drawn ${s.n})`);
    ok(s.cause.startsWith(s.n1 + ' strips'), `390 ${theme}: cause did not follow the touch drag: ${s.cause}`);
    // keys: ArrowLeft one fewer, Page Up doubles, Page Down halves, Home, End
    await page.focus('.rs2 .rs2-knob .tk2-knob');
    const n0 = s.n1; await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(450); s = await S(page); ok(s.n1 === n0 - 1, `390 ${theme}: ArrowLeft gave ${s.n1} from ${n0}`);
    await page.keyboard.press('Home'); await page.keyboard.press('PageUp'); await page.keyboard.press('PageUp'); await page.waitForTimeout(450); s = await S(page); ok(s.n1 === 4, `390 ${theme}: Home, Page Up twice gave ${s.n1}`);
    await page.keyboard.press('PageDown'); await page.waitForTimeout(450); s = await S(page); ok(s.n1 === 2, `390 ${theme}: Page Down gave ${s.n1}`);
    await page.keyboard.press('End'); await page.waitForTimeout(800); s = await S(page); ok(s.n1 === 100 && s.take && /With 100 strips/.test(s.cause), `390 ${theme}: End: ${s.n1}, ${s.cause}`);
    const vt = await page.getAttribute('.rs2 .rs2-knob .tk2-knob', 'aria-valuetext'); ok(vt === '100 strips', `390 ${theme}: aria-valuetext stale: ${vt}`);
    await page.keyboard.press('Home'); await page.waitForTimeout(300); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(600);
    // Fill one by one with motion: the tank empties, the columns pour, the takeaway; the picture in view
    await page.click('.rs2 .tk2-play'); await page.waitForTimeout(600);
    s = await S(page); ok(s.fill != null && s.fill < 4, `390 ${theme}: Fill did not start (${s.fill})`);
    await page.waitForTimeout(4200); s = await S(page);
    ok(s.take && /Poured together, the 4 columns hold 134\.7 L/.test(s.cause), `390 ${theme}: no takeaway after Fill (or a wrong amount): ${s.cause}`);
    ok(await page.evaluate(() => { const r = document.querySelector('.rs2-scene').getBoundingClientRect(); return r.top >= -1 && r.bottom <= innerHeight + 1; }), `390 ${theme}: the picture is not in view after Fill`);
    // a tap on the third column (its middle) reads its term
    const col = await page.evaluate(() => { const T = window.ApCalcRiemannSums, G = T.G(), p = T.S.ps[2], r = document.querySelector('.rs2-scene').getBoundingClientRect(); return [r.left + G.sx((p.x0 + p.x1) / 2), r.top + (G.sy(p.h) + G.y0) / 2]; });
    await tp('touchStart', col[0], col[1]); await tp('touchEnd'); await page.mouse.click(col[0], col[1]); await page.waitForTimeout(500);
    s = await S(page); ok(s.sel === 2 && /^strip 3/.test(s.cause), `390 ${theme}: a tap on a column did not read its term: ${s.sel} ${s.cause}`);
    // "?" has the strip table, one row per strip
    await page.locator('button[aria-label*="?"], .ls-help, button:has-text("?")').first().click().catch(() => {});
    await page.waitForTimeout(600);
    ok(await page.evaluate(() => { const t = document.querySelector('.rs2-ref .rs-tbl'); return !!t && t.querySelectorAll('tbody tr').length === window.ApCalcRiemannSums.S.ps.length; }), `390 ${theme}: no strip table in "?"`);
    ok(errs.length === 0, `390 ${theme}: console: ${errs.join(' | ')}`);
    await ctx.close();
  }
  { // 1440, mouse
    const { ctx, page, errs } = await open(1440, 900, theme);
    const [x, y] = await center(page, '.rs2 .rs2-knob .tk2-knob');
    await page.mouse.move(x, y); await page.mouse.down();
    for (let i = 1; i <= 12; i++) { await page.mouse.move(x + 20 * i, y); await page.waitForTimeout(20); }
    await page.mouse.up(); await page.waitForTimeout(600);
    let s = await S(page); ok(s.n1 > 8, `1440 ${theme}: a mouse drag did not add strips (${s.n1})`);
    const tag = await page.textContent('.rs2 .rs2-knob .tk2-tag'); ok(tag === s.n1 + ' strips', `1440 ${theme}: tag ${tag} with n ${s.n1}`);
    await page.evaluate(() => window.ApCalcRiemannSums.setN(4)); await page.waitForTimeout(500);
    // a click above the last column, in the gap to the curve (missed area), is not a column
    const gap = await page.evaluate(() => { const T = window.ApCalcRiemannSums, G = T.G(), p = T.S.ps[3], xm = (p.x0 + p.x1) * 0.5 + p.w * 0.3, r = document.querySelector('.rs2-scene').getBoundingClientRect(); return [r.left + G.sx(xm), r.top + G.sy(p.h) - 16]; });
    await page.mouse.click(gap[0], gap[1]); await page.waitForTimeout(400);
    s = await S(page); ok(s.sel === -1, `1440 ${theme}: a click above a column selected strip ${s.sel}`);
    // the four sums
    for (const k of ['right', 'mid', 'trap', 'left']) { await page.click(`.rs2-seg [data-k="${k}"]`); await page.waitForTimeout(450); s = await S(page); ok(s.kind === k && (k !== 'left' || /left sum/.test(s.cause)), `1440 ${theme}: the ${k} button: ${s.kind} ${s.cause}`); }
    // tab 2: the rule in the cause line
    await page.getByRole('tab', { name: /Over or under/ }).click(); await page.waitForTimeout(600);
    s = await S(page); ok(s.tab === 'ou' && /r increasing.*left tops below r.*underestimate/.test(s.cause), `1440 ${theme}: tab 2 on the pump: ${s.cause}`);
    ok(await page.evaluate(() => window.ApCalcRiemannSums.knob().el.classList.contains('is-quiet')), `1440 ${theme}: the knob is not quiet in tab 2`);
    await page.click('.rs2-seg [data-k="trap"]'); await page.waitForTimeout(500); s = await S(page);
    ok(/concave up.*above r.*overestimate/.test(s.cause), `1440 ${theme}: tab 2 trapezoid: ${s.cause}`);
    // a table: the knob hides, midpoint is off for six points
    await page.selectOption('.rs2-sel', { label: 'A cyclist slowing down' }); await page.waitForTimeout(600);
    ok(await page.evaluate(() => window.ApCalcRiemannSums.knob().el.hidden), `1440 ${theme}: the knob shows for a table`);
    ok(await page.evaluate(() => document.querySelector('.rs2-seg [data-k="mid"]').disabled), `1440 ${theme}: midpoint is on for a six point table`);
    // inflow (t = 0, 2, 5, 7, 12): 2 and 7 are not the middles of their pairs, so no midpoint sum either
    await page.selectOption('.rs2-sel', { label: 'Inflow, unequal widths' }); await page.waitForTimeout(500);
    ok(await page.evaluate(() => document.querySelector('.rs2-seg [data-k="mid"]').disabled), `1440 ${theme}: midpoint is on for the inflow table`);
    await page.selectOption('.rs2-sel', { label: 'A cyclist slowing down' }); await page.waitForTimeout(500);
    await page.getByRole('tab', { name: /More strips/ }).click(); await page.waitForTimeout(500);
    s = await S(page); ok(/5 strips/.test(s.cause) && /table/.test(s.cause), `1440 ${theme}: the table's cause line: ${s.cause}`);
    ok(errs.length === 0, `1440 ${theme}: console: ${errs.join(' | ')}`);
    await ctx.close();
  }
}
{ // reduced motion: Fill one by one lands at once
  const { ctx, page, errs } = await open(768, 1024, 'light', { reduced: true });
  await page.click('.rs2 .tk2-play'); await page.waitForTimeout(150);
  const s = await S(page); ok(s.fill === 4 && /Poured together/.test(s.cause), `reduced motion: Fill did not land at once (${s.fill}, ${s.cause})`);
  ok(errs.length === 0, `reduced: console: ${errs.join(' | ')}`);
  await ctx.close();
}
{ // Test yourself: #quiz, a wrong answer, the record id, Show the answer; ?seed= gives the same problem twice
  const { ctx, page, errs } = await open(1024, 900, 'light', { q: '?seed=7#quiz' });
  const text1 = await page.evaluate(() => (document.querySelector('[data-mode="quiz"] .cd-q, .cd-text, .ls-drill-stage') || document.body).textContent.slice(0, 400));
  ok(await page.evaluate(() => document.querySelector('.ls-root') && document.querySelector('.ls-root').getAttribute('data-mode') === 'quiz'), '#quiz did not open Test yourself');
  let shown = 0, marked = false;
  for (let i = 0; i < 40; i++) {
    if (await page.evaluate(() => { const s = document.querySelector('.bt-solution'); return s && !s.hidden; })) break;
    const sh = page.locator('button:has-text("Show the answer"):visible').first();
    if (await sh.count()) { await sh.click(); shown++; await page.waitForTimeout(300); continue; }
    const f = page.locator('form.cd-step:not([hidden])').last();
    const ti = f.locator('input[type="text"]:visible, input[inputmode]:visible').first(), ra = f.locator('input[type="radio"]:visible').first();
    if (await ti.count()) await ti.fill('999'); else if (await ra.count()) await ra.check(); else { const c = f.locator('button:visible').first(); if (await c.count()) await c.click(); }
    const sub = f.locator('button[type="submit"]:visible').first(); if (await sub.count()) await sub.click();
    await page.waitForTimeout(300);
    if (!marked) marked = await page.evaluate(() => ((document.querySelector('.cd-fb') || {}).textContent || '').length > 0);
  }
  ok(marked, 'a wrong answer got no feedback');
  ok(shown > 0, 'Show the answer never offered');
  ok(await page.evaluate(() => Object.keys(localStorage).some(k => /riemann-sums:[a-z]+:[a-z0-9]+/i.test(localStorage.getItem(k) || ''))), 'the tries were not recorded as riemann-sums:<context>:<step>');
  const p2 = await ctx.newPage(); await p2.addInitScript(() => { window.LevlToolTest = true; }); await p2.goto(BASE + '?seed=7#quiz'); await p2.waitForTimeout(900);
  const text2 = await p2.evaluate(() => (document.querySelector('[data-mode="quiz"] .cd-q, .cd-text, .ls-drill-stage') || document.body).textContent.slice(0, 400));
  ok(text1.slice(0, 120) === text2.slice(0, 120), '?seed=7 gave a different problem on a second load');
  ok(errs.length === 0, `quiz: console: ${errs.join(' | ')}`);
  await ctx.close();
}
{ // locked (no unlock): the Premium card, as before
  UNLOCK = false;
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 }, serviceWorkers: 'block' });
  const page = await ctx.newPage(); await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(1200);
  const st = await page.evaluate(() => ({ lock: !!document.querySelector('.premium-lock'), stage: !!document.querySelector('.rs2-scene') && document.querySelector('.rs2-scene').getBoundingClientRect().width > 0 }));
  ok(st.lock && !st.stage, `locked: Premium card ${st.lock}, stage shown ${st.stage}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(`Riemann sums browser checks: ${pass} passing, ${fails.length} failing`);
fails.forEach(f => console.log('  ' + f));
process.exit(fails.length ? 1 : 0);
