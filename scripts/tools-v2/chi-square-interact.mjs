#!/usr/bin/env node
/* Tools v2: the chi-square tool used as a student would (docs/tools-v2-chi-square-brief.md, "Checks run"), at 390
   (real touch, through CDP touch events), 768 and 1440 (a mouse), light and dark:
   the opening and its cue; a bug dragged into the other chamber; keys on a chamber (Enter, Delete); Let them wander
   (a dot, the takeaway); 40 to 80 bugs (same shares, twice the χ²); four chambers (df 3, 7.82); Start over; "?" works
   this chamber out; Test yourself: Problems (a wrong and a right answer, the table of critical values), Challenges
   (the first one met with keys, Explore's bugs kept); leaving in the middle of a wander; reduced motion; the deep
   links #practice, ?seed=5 and #goals; no console errors.
   Usage: node scripts/tools-v2/chi-square-interact.mjs   (needs playwright and Chromium, like the sweep) */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) { try { ({ chromium } = createRequire((process.env.PW_ROOT || '/home/claude/testaolivier10-del.github.io') + '/')('playwright')); } catch (e2) { console.error('needs playwright'); process.exit(0); } }
const EXE = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome') ? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' : undefined);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); const f = resolve(ROOT, '.' + p);
  if (!f.startsWith(ROOT) || !existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); createReadStream(f).pipe(res); });
await new Promise(ok => server.listen(0, ok));
const URL0 = `http://localhost:${server.address().port}/bio/tools/chi-square.html`;
let pass = 0; const fails = [];
const ok = (c, m) => { if (c) pass++; else fails.push(m); };
const browser = await chromium.launch({ executablePath: EXE });
async function open(w, dark, hash = '', reduced = false) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : w < 1100 ? 1024 : 900 }, serviceWorkers: 'block', hasTouch: w < 500, isMobile: w < 500, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await ctx.route(u => !u.href.startsWith(URL0.split('/bio/')[0]) && !u.href.startsWith('data:'), r => r.abort());
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  if (dark) await page.addInitScript(() => { try { localStorage.setItem('nremt_theme', 'dark'); } catch (e) {} });
  await page.goto(URL0 + hash); await page.waitForTimeout(1300);
  return { ctx, page, errs };
}
const counts = (page) => page.evaluate(() => window.__cs2.counts());
const settle = async (page) => { for (let i = 0; i < 80; i++) { if (!(await page.evaluate(() => window.__cs2.busy()))) return; await page.waitForTimeout(60); } };
const chi = c => { const n = c.reduce((a, b) => a + b, 0), e = n / c.length; return c.reduce((a, o) => a + (o - e) ** 2 / e, 0); };
async function dragBug(page, w, cdp) {
  const g = await page.evaluate(() => { const G = window.__cs2.G(), r = document.querySelector('.cs2-scene').getBoundingClientRect(); const bs = window.__cs2.bugs().filter(b => window.__cs2.chamberOf(b.x, b.y) === 0).sort((a, b) => Math.hypot(a.x - G.mx, a.y - G.my) - Math.hypot(b.x - G.mx, b.y - G.my)); const t = G.side ? [G.mx + G.bugL * 3, G.my] : [G.mx, G.my + G.bugL * 3]; return { x: r.left + bs[0].x, y: r.top + bs[0].y, tx: r.left + t[0], ty: r.top + t[1] }; });
  const steps = 12;
  if (cdp) {
    const pt = (x, y) => [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(g.x, g.y) });
    for (let i = 1; i <= steps; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(g.x + (g.tx - g.x) * i / steps, g.y + (g.ty - g.y) * i / steps) }); await page.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.mouse.move(g.x, g.y); await page.mouse.down();
    for (let i = 1; i <= steps; i++) { await page.mouse.move(g.x + (g.tx - g.x) * i / steps, g.y + (g.ty - g.y) * i / steps); await page.waitForTimeout(16); }
    await page.mouse.up();
  }
  await settle(page);
}
const toQuiz = (page) => page.evaluate(() => { const b = [...document.querySelectorAll('button, [role="tab"]')].find(b => b.textContent.trim() === 'Test yourself'); b.click(); });
const toExplore = (page) => page.evaluate(() => { const b = [...document.querySelectorAll('button, [role="tab"]')].find(b => b.textContent.trim() === 'Explore'); b.click(); });
const pickPart = (page, v) => page.evaluate((v) => { const sel = [...document.querySelectorAll('select')].find(s => [...s.options].some(o => o.value === v)); sel.value = v; sel.dispatchEvent(new Event('change', { bubbles: true })); }, v);

for (const w of [390, 768, 1440]) for (const dark of [false, true]) {
  const tag = `${w} ${dark ? 'dark' : 'light'}`;
  const { ctx, page, errs } = await open(w, dark);
  const cdp = w < 500 ? await ctx.newCDPSession(page) : null;
  ok((await counts(page)).join() === '24,16', `${tag}: opens at 24, 16`);
  ok(await page.evaluate(() => !!document.querySelector('.cs2 .tk2-cue')), `${tag}: first visit cue`);
  // drag (touch on the phone)
  await dragBug(page, w, cdp);
  ok((await counts(page)).join() === '23,17', `${tag}: a dragged bug moved to dry (${await counts(page)})`);
  ok(await page.evaluate(() => !document.querySelector('.cs2 .tk2-cue')), `${tag}: the cue left after the first drag`);
  ok(await page.evaluate(() => /χ² = 0\.90/.test(document.querySelector('.cs2 .tk2-cause').textContent)), `${tag}: cause line after the drag`);
  // keys
  await page.focus('.cs2-chb[data-ci="0"]'); await page.keyboard.press('Enter'); await settle(page);
  ok((await counts(page)).join() === '24,16', `${tag}: Enter on Wet brings a bug in`);
  await page.keyboard.press('Delete'); await settle(page);
  ok((await counts(page)).join() === '23,17', `${tag}: Delete on Wet sends a bug out`);
  ok(await page.evaluate(() => /23 bugs/.test(document.querySelector('.cs2-chb[data-ci="0"]').getAttribute('aria-label'))), `${tag}: the chamber's label says the current count`);
  // wander
  await page.click('.cs2-wander'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => window.__cs2.busy()), `${tag}: the bugs walk`);
  await settle(page);
  ok(await page.evaluate(() => window.__cs2.tally().n === 1 && document.querySelectorAll('.cs2-run').length === 1), `${tag}: one chance run, one dot`);
  ok(await page.evaluate(() => /No preference/.test(document.querySelector('.cs2 .tk2-cause').textContent)), `${tag}: the wander takeaway`);
  // 80 bugs: the same shares, twice the χ²
  await page.evaluate(() => window.__cs2.set([26, 14])); const c40 = chi(await counts(page));
  await page.click('.cs2-nb[data-b="1"]'); await settle(page);
  const c80 = await counts(page);
  ok(c80.join() === '52,28' && Math.abs(chi(c80) - 2 * c40) < 1e-9, `${tag}: 80 bugs ${c80}`);
  ok(await page.evaluate(() => /twice the bugs/.test(document.querySelector('.cs2 .tk2-cause').textContent)), `${tag}: the doubling takeaway`);
  await page.click('.cs2-nb[data-b="0"]'); await settle(page);
  ok((await counts(page)).join() === '26,14', `${tag}: back to 40 bugs`);
  // four chambers
  await page.click('.cs2 .tk2-tab:nth-child(2)'); await settle(page);
  ok((await counts(page)).join() === '13,9,11,7', `${tag}: four chambers open at 13, 9, 11, 7`);
  ok(await page.evaluate(() => /7\.82/.test(document.querySelector('.cs2-critl').textContent) && /df 3|curve/.test(document.querySelector('.cs2-gtitle').textContent)), `${tag}: critical value 7.82`);
  await page.click('.cs2-wander'); await settle(page);
  await page.click('.cs2-reset'); await settle(page);
  ok((await counts(page)).join() === '13,9,11,7' && await page.evaluate(() => window.__cs2.tally().n === 0), `${tag}: Start over`);
  await page.click('.cs2 .tk2-tab:nth-child(1)'); await settle(page);
  ok((await counts(page)).join() === '26,14', `${tag}: two chambers keep their bugs`);
  // "?"
  const help = await page.evaluate(() => { const t = document.querySelector('.cs2-ref-live'); return t ? t.textContent : ''; });
  ok(/χ² = Σ \(o − e\)² \/ e/.test(help) && /3\.60/.test(help) && /fail to reject/.test(help), `${tag}: "?" works this chamber out`);
  // leaving in the middle of a wander
  await page.click('.cs2-wander'); await page.waitForTimeout(250); await toQuiz(page); await page.waitForTimeout(300);
  ok(!(await page.evaluate(() => window.__cs2.busy())), `${tag}: Test yourself stops the bugs`);
  const kept = (await counts(page)).join();   // the run ends where the bugs were going
  // Problems: a wrong answer, then the first worked problem right
  await pickPart(page, 'set:0'); await page.waitForTimeout(400);
  const inp = page.locator('.ls-root input[type="text"], .ls-root input[inputmode]').filter({ visible: true }).first();
  await inp.fill('49'); await page.locator('.ls-root .bt-pcheck').filter({ visible: true }).first().click(); await page.waitForTimeout(300);
  ok(await page.evaluate(() => !!document.querySelector('.ls-root .bio-mark.no, .ls-root .bt-fb .no, .ls-root [class*="is-wrong"]')), `${tag}: a wrong expected count is marked`);
  ok(await page.evaluate(() => [...document.querySelectorAll('.cs2-ctab td.is-df, .cs2-ctab td')].length >= 16), `${tag}: the table of critical values beside the problem`);
  await pickPart(page, 'set:1'); await page.waitForTimeout(400);
  await inp.fill('100'); await page.locator('.ls-root .bt-pcheck').filter({ visible: true }).first().click(); await page.waitForTimeout(300);
  ok(await page.evaluate(() => !!document.querySelector('.ls-root .bio-mark.ok, .ls-root [class*="is-right"]')), `${tag}: a right expected count is marked`);
  // Challenges: from the opening; flip the decision with keys
  await pickPart(page, 'goals'); await page.waitForTimeout(500); await settle(page);
  ok((await counts(page)).join() === '24,16', `${tag}: challenges start from the opening`);
  await page.evaluate(() => { try { localStorage.removeItem('tk2c:apbio-chi-goals'); } catch (e) {} });
  for (let i = 0; i < 3; i++) { await page.focus('.cs2-chb[data-ci="0"]'); await page.keyboard.press('Enter'); await settle(page); }
  ok(await page.evaluate(() => /Reject/.test(document.querySelector('.cs2-dock').textContent)), `${tag}: challenge 1 met (${(await counts(page))})`);
  await toExplore(page); await page.waitForTimeout(500); await settle(page);
  ok((await counts(page)).join() === kept, `${tag}: Explore keeps its own bugs (${await counts(page)} vs ${kept})`);
  ok(!errs.length, `${tag}: console errors ${errs.slice(0, 2)}`);
  await ctx.close();
}
// deep links and reduced motion
{
  let { ctx, page, errs } = await open(1440, false, '#practice');
  ok(await page.evaluate(() => !!document.querySelector('.cs2-pfig') && document.querySelector('.cs2-pfig').getBoundingClientRect().width > 0), '#practice opens Problems');
  await ctx.close();
  ({ ctx, page, errs } = await open(1440, false, '?seed=5'));
  ok(await page.evaluate(() => /Problem code\s*5/.test(document.body.textContent)), '?seed=5 opens problem 5');
  await ctx.close();
  ({ ctx, page, errs } = await open(390, false, '#goals'));
  ok(await page.evaluate(() => !!document.querySelector('.cs2-dock') && document.querySelector('.cs2-dock').offsetParent !== null), '#goals opens Challenges');
  await ctx.close();
  ({ ctx, page, errs } = await open(390, false, '', true));
  await page.click('.cs2-wander'); await page.waitForTimeout(80);
  ok(!(await page.evaluate(() => window.__cs2.busy())) && await page.evaluate(() => window.__cs2.tally().n === 1), 'reduced motion: the run lands at once');
  ok(!errs.length, `reduced: console errors ${errs.slice(0, 2)}`);
  await ctx.close();
}
await browser.close(); server.close();
fails.forEach(f => console.log('  FAIL ' + f));
console.log(`chi-square interact: ${pass} passed, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
