/* Tools v2: the browser checks of AP® Calculus AB Slope fields (docs/tools-v2-calc-slope-fields-brief.md) that a layout
   sweep cannot do: a real touch drag of the leaf (CDP touch events) at 390, a tap on the water, keys (arrows, Shift,
   Page Up, Home, End) with aria-valuetext current, the leaf floating after a drop and the takeaway after it, the picker,
   k and the room, Check with the formula (every formula the tool writes is checked against the model's exact solution
   at many points), "?" filled on a fresh page and following every change, reduced motion (the takeaway at once), Test
   yourself (#quiz, ?seed=, a wrong answer, Show the answer, the tries recorded as slope-fields:<context>:<step>), the
   locked Premium card unchanged without a pass, and no console errors. Light and dark. Premium is unlocked only in the
   browser (a route answers premium.js's has() true), never in a file.
     node scripts/tools-v2/calc-slope-fields-interact.mjs */
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
const BASE = 'http://127.0.0.1:' + server.address().port + '/calculus/tools/slope-fields.html';
const PREMIUM = readFileSync(join(ROOT, 'assets/premium.js'), 'utf8').replace('function has(course) {', 'function has(course) { return true;');
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
const SHOTS = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
let pass = 0; const fails = [];
const ok = (c, m) => { if (c) pass++; else fails.push(m); };
async function open(w, h, theme, o = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', hasTouch: !!o.touch, reducedMotion: o.reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push(e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  if (!o.locked) await page.route('**/assets/premium.js', r => r.fulfill({ body: PREMIUM, contentType: 'application/javascript' }));
  await page.addInitScript(t => { window.LevlToolTest = true; localStorage.setItem('nremt_theme', t); localStorage.setItem('tk2c:apcalc-slope-fields', '1'); }, theme);
  await page.goto(BASE + (o.q || ''), { waitUntil: 'load' });
  await page.waitForTimeout(900);
  ok((await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark')) === (theme === 'dark'), `${w} ${theme}: theme not applied`);
  return { ctx, page, errs };
}
const S = page => page.evaluate(() => { const s = window.ApCalcSlopeFields.st; return { x0: s.x0, y0: s.y0, id: s.id, riding: !!s.ride, took: s.took, cause: document.querySelector('.sf2 .tk2-cause').textContent, ref: document.querySelector('.sf2-ref').textContent }; });
const center = async (page, sel) => { const b = await page.locator(sel).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
const at = (page, x, y) => page.evaluate(([x, y]) => { const T = window.ApCalcSlopeFields, A = T.G().A, r = document.querySelector('.sf2-scene').getBoundingClientRect(), k = r.width / T.G().W; return [r.left + A.sx(x) * k, r.top + A.sy(y) * k]; }, [x, y]);
for (const theme of ['light', 'dark']) {
  { // 390, real touch
    const { ctx, page, errs } = await open(390, 844, theme, { touch: true });
    let s = await S(page);
    ok(s.ref.length > 400 && s.ref.includes('(−2, 2.5)'), `390 ${theme}: "?" is not filled on a fresh page`);
    const [x, y] = await center(page, '.sf2-h .tk2-knob'), to = await at(page, 0, 3.5);
    const cdp = await ctx.newCDPSession(page);
    const tp = (type, px, py) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: px, y: py }] });
    await tp('touchStart', x, y); for (let i = 1; i <= 12; i++) { await tp('touchMove', x + (to[0] - x) * i / 12, y + (to[1] - y) * i / 12); await page.waitForTimeout(20); } await tp('touchEnd');
    await page.waitForTimeout(200);
    s = await S(page);
    ok(Math.abs(s.x0 - 0) < 0.11 && Math.abs(s.y0 - 3.5) < 0.11, `390 ${theme}: touch drag did not move the leaf to (0, 3.5): (${s.x0}, ${s.y0})`);
    ok(s.riding, `390 ${theme}: the leaf did not float after the drop`);
    if (SHOTS && theme === 'light') { await page.waitForTimeout(350); await page.locator('.sf2').screenshot({ path: join(SHOTS, '0390-light-mid-float.png') }); }
    await page.waitForTimeout(2200);
    s = await S(page);
    ok(/One starting point, one solution: y = 2 \+ 1\.5e\^\(x\)\./.test(s.cause), `390 ${theme}: takeaway after the float: ${s.cause}`);
    ok(s.ref.includes('(0, 3.5)'), `390 ${theme}: "?" did not follow the drag`);
    // a tap on the water moves the leaf there
    const tap = await at(page, 1, 1);
    await page.touchscreen.tap(tap[0], tap[1]); await page.waitForTimeout(300);
    s = await S(page); ok(Math.abs(s.x0 - 1) < 0.11 && Math.abs(s.y0 - 1) < 0.11, `390 ${theme}: a tap did not move the leaf: (${s.x0}, ${s.y0})`);
    ok(/y′ = −1|y′ = 1 − 2/.test(s.cause) || s.riding || s.took, `390 ${theme}: cause after the tap: ${s.cause}`);
    await page.waitForTimeout(2200);
    // keys
    await page.focus('.sf2-h .tk2-knob'); await page.keyboard.press('ArrowUp'); await page.waitForTimeout(100);
    s = await S(page); ok(Math.abs(s.y0 - 1.1) < 1e-9 && !s.took, `390 ${theme}: ArrowUp gave y ${s.y0}`);
    await page.keyboard.press('Shift+ArrowRight'); await page.waitForTimeout(100);
    s = await S(page); ok(Math.abs(s.x0 - 2) < 1e-9, `390 ${theme}: Shift+ArrowRight gave x ${s.x0}`);
    await page.keyboard.press('PageUp'); await page.keyboard.press('Home'); await page.waitForTimeout(100);
    s = await S(page); ok(Math.abs(s.y0 - 2.1) < 1e-9 && s.x0 < -2.9, `390 ${theme}: Page Up and Home gave (${s.x0}, ${s.y0})`);
    const vt = await page.getAttribute('.sf2-h .tk2-knob', 'aria-valuetext');
    ok(vt.includes('y = 2.1') && vt.includes('Slope 0.1'), `390 ${theme}: aria-valuetext stale: ${vt}`);
    await page.waitForTimeout(2600);
    ok(errs.length === 0, `390 ${theme}: console: ${errs.join(' | ')}`);
    await ctx.close();
  }
  { // 1440, mouse: the picker, k and the room, Check with the formula
    const { ctx, page, errs } = await open(1440, 900, theme);
    await page.selectOption('.sf2-sel', 'cool'); await page.waitForTimeout(150);
    let s = await S(page); ok(s.id === 'cool' && /T′/.test(s.cause) && s.ref.includes('room'), `1440 ${theme}: the picker did not switch to cooling: ${s.cause}`);
    await page.waitForTimeout(500);
    const mid = await page.evaluate(() => [document.querySelector('.sf2-cmug').textContent, window.ApCalcSlopeFields.st.ride && window.ApCalcSlopeFields.st.ride.pos]);
    ok(mid[1] && mid[0] !== '90 °C', `1440 ${theme}: the mug did not follow the floating leaf (${mid[0]})`);
    if (SHOTS && theme === 'dark') await page.locator('.sf2').screenshot({ path: join(SHOTS, '1440-dark-mid-float-cool.png') });
    await page.waitForTimeout(2400);
    // the k knob (quiet, on the bank) drags; the room knob drags
    const kb = await center(page, '.sf2-k .tk2-knob');
    await page.mouse.move(kb[0], kb[1]); await page.mouse.down(); await page.mouse.move(kb[0] + 400, kb[1], { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(150);
    ok(await page.evaluate(() => window.ApCalcSlopeFields.params.cool.k === 0.2), `1440 ${theme}: k did not drag to 0.2`);
    s = await S(page); ok(/0\.2\(90 − 20\) = −14/.test(s.cause) || s.riding || s.took, `1440 ${theme}: cause after k: ${s.cause}`);
    await page.waitForTimeout(2600);
    const tb = await center(page, '.sf2-ta .tk2-knob');
    await page.mouse.move(tb[0], tb[1]); await page.mouse.down(); await page.mouse.move(tb[0], tb[1] - 400, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(150);
    ok(await page.evaluate(() => window.ApCalcSlopeFields.params.cool.Ta === 40), `1440 ${theme}: the room did not drag to 40`);
    ok(await page.evaluate(() => { const e = document.querySelector('.sf2-eqline'), A = window.ApCalcSlopeFields.G().A; return Math.abs(+e.getAttribute('d').split(' ')[1].replace(/H.*/, '') - A.sy(40)) < 0.6; }), `1440 ${theme}: the calm line did not move to 40`);
    await page.waitForTimeout(2600);
    await page.click('.sf2-check'); await page.waitForTimeout(900);
    ok(await page.evaluate(() => !!document.querySelector('.sf2-exact') && document.querySelector('.sf2-cex').textContent === window.ApCalcSlopeFields.formula()), `1440 ${theme}: Check with the formula drew no labelled line`);
    // every formula the tool writes is the model's exact solution (many points, each equation)
    const bad = await page.evaluate(() => {
      const T = window.ApCalcSlopeFields, out = [], ids = ['y-2', 'xy', 'x/y', 'x+y', 'ky', 'cool'];
      const js = f => f.replace(/^[yT] = /, '').replace(/−/g, '-').replace(/√\(/g, 'Math.sqrt(').replace(/e\^\(/g, 'Math.exp(').replace(/x²/g, '(x*x)').replace(/(\d)Math/g, '$1*Math').replace(/(\d)x/g, '$1*x').replace(/(\d)t/g, '$1*t').replace(/(\d)\(/g, '$1*(').replace(/\)\(/g, ')*(');
      ids.forEach(id => {
        T.setEq(id); const v = T.G().view;
        for (let i = 0; i < 12; i++) {
          const x0 = v.x[0] + (v.x[1] - v.x[0]) * (0.13 + 0.07 * i), y0 = v.y[0] + (v.y[1] - v.y[0]) * (0.9 - 0.07 * i);
          T.set(x0, y0); const st = T.st, f = T.formula(), ex = T.exactFn(); if (!f) continue;
          let g; try { g = new Function('x', 't', 'return ' + js(f)); } catch (e) { out.push(id + ' cannot read ' + f); continue; }
          for (let j = 0; j <= 8; j++) { const x = st.x0 + (j - 4) * 0.15 * (id === 'cool' ? 10 : 1); if (x < ex.lo || x > ex.hi) continue; const a = g(x, x), b = ex.fn(x); if (isFinite(b) && Math.abs(a - b) > 0.006 * Math.max(1, Math.abs(b))) { out.push(id + ' at (' + st.x0 + ', ' + st.y0 + '): ' + f + ' gives ' + a + ' at ' + x + ', the solution ' + b); break; } }
        }
      });
      return out;
    });
    ok(bad.length === 0, `1440 ${theme}: formula mistakes: ${bad.slice(0, 3).join(' | ')}`);
    // "?" follows the equation
    await page.selectOption('.sf2-sel', 'x/y'); await page.waitForTimeout(300);
    s = await S(page); ok(/Separate/.test(s.ref) && /x \/ y/.test(s.ref), `1440 ${theme}: "?" did not follow the picker`);
    // the menu's Start over: back to y′ = y − 2 at (−2, 2.5), the formula's line off
    await page.click('.ls-more'); await page.waitForTimeout(200);
    await page.locator('[role="menu"] >> text=Start over, .ls-menu >> text=Start over').first().click().catch(async () => { await page.getByText('Start over', { exact: true }).first().click(); });
    await page.waitForTimeout(300);
    s = await S(page); ok(s.id === 'y-2' && s.x0 === -2 && s.y0 === 2.5 && !(await page.evaluate(() => window.ApCalcSlopeFields.st.exact)), `1440 ${theme}: Start over gave ${s.id} at (${s.x0}, ${s.y0})`);
    await page.waitForTimeout(2600);
    await page.selectOption('.sf2-sel', 'x/y'); await page.waitForTimeout(300);
    // leaving mid float for Test yourself stops it
    await page.evaluate(() => window.ApCalcSlopeFields.float()); await page.waitForTimeout(250);
    await page.getByRole('button', { name: 'Test yourself' }).first().click().catch(() => page.getByRole('tab', { name: 'Test yourself' }).first().click());
    await page.waitForTimeout(400);
    ok(await page.evaluate(() => !window.ApCalcSlopeFields.riding()), `1440 ${theme}: the float kept running in Test yourself`);
    ok(errs.length === 0, `1440 ${theme}: console: ${errs.join(' | ')}`);
    await ctx.close();
  }
}
{ // reduced motion: no float, the takeaway at once
  const { ctx, page, errs } = await open(768, 1024, 'light', { reduced: true });
  const [x, y] = await center(page, '.sf2-h .tk2-knob');
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 60, y + 40, { steps: 4 }); await page.mouse.up(); await page.waitForTimeout(150);
  const s = await S(page); ok(!s.riding && /One starting point/.test(s.cause), `reduced motion: no takeaway at once (${s.cause})`);
  ok(errs.length === 0, `reduced: console: ${errs.join(' | ')}`);
  await ctx.close();
}
{ // Test yourself: #quiz, a wrong answer, the record id, Show the answer; ?seed= gives the same problem twice
  const { ctx, page, errs } = await open(1024, 900, 'light', { q: '?seed=7#quiz' });
  const text1 = await page.evaluate(() => (document.querySelector('.ls-drill-stage') || document.body).textContent.slice(0, 400));
  ok(await page.evaluate(() => document.querySelector('.ls-root') && document.querySelector('.ls-root').getAttribute('data-mode') === 'quiz'), '#quiz did not open Test yourself');
  const inp = page.locator('form input[type="text"], form input:not([type])').first();
  if (await inp.count()) {
    await inp.fill('999'); await page.locator('form button[type="submit"]').first().click(); await page.waitForTimeout(500);
    ok(await page.evaluate(() => ((document.querySelector('.cd-fb') || {}).textContent || '').length > 0), 'a wrong answer got no feedback');
  } else {
    const opt = page.locator('form input[type="radio"]').first(); await opt.check(); await page.locator('form button[type="submit"]').first().click(); await page.waitForTimeout(500);
    ok(await page.evaluate(() => ((document.querySelector('.cd-fb') || {}).textContent || '').length > 0), 'a choice got no feedback');
  }
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
  ok(await page.evaluate(() => Object.keys(localStorage).some(k => /slope-fields:[a-z]+:[a-zA-Z0-9]+/.test(localStorage.getItem(k) || ''))), 'the tries were not recorded as slope-fields:<context>:<step>');
  const p2 = await ctx.newPage(); await p2.route('**/assets/premium.js', r => r.fulfill({ body: PREMIUM, contentType: 'application/javascript' }));
  await p2.addInitScript(() => { window.LevlToolTest = true; }); await p2.goto(BASE + '?seed=7#quiz'); await p2.waitForTimeout(900);
  const text2 = await p2.evaluate(() => (document.querySelector('.ls-drill-stage') || document.body).textContent.slice(0, 400));
  ok(text1.slice(0, 120) === text2.slice(0, 120), '?seed=7 gave a different problem on a second load');
  ok(errs.length === 0, `quiz: console: ${errs.join(' | ')}`);
  await ctx.close();
}
{ // without a pass: the Premium card, as before, and no Explore
  const { ctx, page, errs } = await open(1024, 800, 'light', { locked: true });
  ok(await page.evaluate(() => /This is part of Premium/.test(document.body.textContent) && !document.querySelector('.sf2')), 'locked: no Premium card, or the tool shows');
  ok(errs.length === 0, `locked: console: ${errs.join(' | ')}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(`Slope fields browser checks: ${pass} passing, ${fails.length} failing`);
fails.forEach(f => console.log('  ' + f));
process.exit(fails.length ? 1 : 0);
