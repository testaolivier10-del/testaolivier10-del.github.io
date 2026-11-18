/* Tools v2, AP® Biology Enzyme activity: frame by frame checks that the words and the rate bar never run ahead of
   the picture (review round 1, docs/tools-v2-enzyme-activity-brief.md). At one width (default 1440) it records
   every ~40 ms through these changes and asserts on each frame:
     1. Substrate 1, 2, 5, 20 mM: the share of working sites drawn holding substrate is within 0.15 of the model's
        S/(Km + S), sampled over 25 frames.
     2. Cooling 70 -> 37 °C (and Home from 70 °C): while any unfolded chain or fading enzyme is drawn, the cause line
        never says "still folded", "Best temperature", "Warm", "Cool" or "Cold", "Optimum temperature" is not shown,
        and the bar is at most the share of enzymes drawn working (by opacity) plus 0.12. Afterwards "new enzyme" is named.
     3. Heating 37 -> 60 °C: while every enzyme is still drawn folded the bar has not fallen below 0.8 of where it
        started; "no reaction" appears only when the bar is under 0.05.
     4. Competitive inhibitor 0 -> 3 mM: until an inhibitor is drawn docked, no "Inhibitor in active site" and the
        bar has not fallen by more than 0.06.
     5. Reduced motion, Temperature 65 -> 37 °C in one drag: the new enzymes are named "new enzyme" (label and cause
        line), never "still folded".
     6. pH 2 -> 13 in one drag that passes 7: on every frame "new enzyme" is never on an enzyme drawn unfolded, and
        once every enzyme is drawn unfolded the "denatured" label is up.

     node scripts/tools-v2/enzyme-activity-frames.mjs [width]

   Needs Playwright and a Chromium (CHROME or /opt/pw-browsers/chromium-1243/chrome-linux64/chrome). Premium is
   unlocked in the test only. Exit code 1 on any failure. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const require = createRequire(join(ROOT, 'package.json'));
const { chromium } = require('playwright');
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const p = join(ROOT, normalize(decodeURIComponent(req.url.split('?')[0])));
  if (!p.startsWith(ROOT) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port, W = +(process.argv[2] || 1440), H = W <= 430 ? 844 : 900;
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
const fails = []; let frames = 0;
async function open(reduced) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, serviceWorkers: 'block', reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.route('**/assets/premium.js', r => r.fulfill({ body: readFileSync(join(ROOT, 'assets/premium.js'), 'utf8').replace('function has(course) {', 'function has(course) { return true;'), contentType: 'application/javascript' }));
  await page.route(/supabase|umami|api\.levlprep|polar/, r => r.abort());
  await page.goto(BASE + '/bio/tools/enzyme-activity.html', { waitUntil: 'load' }); await page.waitForTimeout(900);
  return { ctx, page, errs };
}
const main = '.ez2 .tk2-drag:not([hidden]):not(.is-quiet) input';
const setIn = (page, v) => page.locator(main).evaluate((el, val) => { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); }, v);
const endIn = page => page.locator(main).evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })));
// one frame of what is drawn and said
const frame = page => page.evaluate(() => {
  const E = [...document.querySelectorAll('.ez2-e')].map(g => ({ i: g.getAttribute('data-i'), st: g.getAttribute('data-st'), sub: g.getAttribute('data-sub'), op: +(g.getAttribute('opacity') || 1),
    fold: +(g.querySelector('.ez2-fold').getAttribute('opacity') || 1), chain: +(g.querySelector('.ez2-tangle').getAttribute('opacity') || 0) }));
  const f = document.querySelector('.ez2-gfill'), t = document.querySelector('.ez2-gtrack');
  const labs = [...document.querySelectorAll('.ez2-lab')].map(l => ({ t: l.textContent, i: l.getAttribute('data-for') }));
  return { E, bar: f && +f.getAttribute('opacity') ? +f.getAttribute('width') / +t.getAttribute('width') : 0, cause: document.querySelector('.tk2-cause').innerText.replace(/\s+/g, ' '),
    labs, term: (document.querySelector('.ez2-term') || {}).textContent || '' };
});
const record = async (page, ms, fn) => { const out = []; const t0 = Date.now(); while (Date.now() - t0 < ms) { const f = await frame(page); out.push(f); frames++; if (fn) fn(f, out.length); await page.waitForTimeout(40); } return out; };
const chainShown = f => f.E.some(e => e.chain > 0.3 || e.op < 0.95);
const drawnWorking = f => f.E.reduce((a, e) => a + (e.fold > 0.9 && e.st === 'ok' && e.chain < 0.1 ? e.op : 0), 0) / f.E.length;   // a new enzyme fading in counts by its opacity

{ // 1, 2, 3, 4, 6 with motion
  const { ctx, page, errs } = await open(false);
  for (const v of [1, 2, 5, 20]) {
    await setIn(page, v); await endIn(page); await page.waitForTimeout(2500);
    let a = 0, n = 0; await record(page, 1100, f => { f.E.forEach(e => { if (e.sub !== '-') { n++; if (e.sub === '1') a++; } }); });
    const want = v / (2 + v), got = a / Math.max(1, n);
    if (Math.abs(got - want) > 0.15) fails.push(`substrate ${v} mM: ${got.toFixed(2)} of working sites drawn full, the model's share is ${want.toFixed(2)}`);
    console.log(`substrate ${v} mM: drawn ${got.toFixed(2)}, model ${want.toFixed(2)}`);
  }
  await page.getByRole('tab', { name: /Temp/ }).click(); await page.waitForTimeout(500);
  for (const how of ['drag back to 37', 'Home']) {
    await setIn(page, 70); await endIn(page); await page.waitForTimeout(2200);
    if (how === 'Home') { await page.locator(main).focus(); await page.keyboard.press('Home'); } else { for (const v of [60, 50, 42, 37]) await setIn(page, v); await endIn(page); }
    let named = false;
    await record(page, 3200, (f, k) => {
      if (/new enzyme/.test(f.cause) || f.labs.some(l => l.t === 'new enzyme')) named = true;
      if (!chainShown(f)) return;
      if (/still folded|Best temperature|Warm|Cool|Cold/.test(f.cause)) fails.push(`${how} from 70 °C, frame ${k}: unfolded enzymes drawn but the cause line says "${f.cause}"`);
      if (f.term) fails.push(`${how} from 70 °C, frame ${k}: "${f.term}" while unfolded enzymes are drawn`);
      if (f.bar > drawnWorking(f) + 0.12) fails.push(`${how} from 70 °C, frame ${k}: the bar is ${f.bar.toFixed(2)} with ${drawnWorking(f).toFixed(2)} of the enzymes drawn working`);
    });
    if (!named) fails.push(`${how} from 70 °C: "new enzyme" never named`);
  }
  await page.locator(main).focus(); await setIn(page, 37); await endIn(page); await page.waitForTimeout(3500);
  const f0 = await frame(page);
  await setIn(page, 60); await endIn(page);
  await record(page, 2000, (f, k) => {
    const allFolded = f.E.every(e => e.fold > 0.9 && e.chain < 0.1);
    if (allFolded && f.bar < 0.8 * f0.bar) fails.push(`heating to 60 °C, frame ${k}: every enzyme still drawn folded but the bar fell from ${f0.bar.toFixed(2)} to ${f.bar.toFixed(2)}`);
    if (/no reaction/.test(f.cause) && f.bar >= 0.05) fails.push(`heating to 60 °C, frame ${k}: "no reaction" with the bar at ${f.bar.toFixed(2)}`);
  });
  // 6: pH 2 -> 13 in one drag
  await page.getByRole('tab', { name: /pH/ }).click(); await page.waitForTimeout(500);
  await setIn(page, 2); await endIn(page); await page.waitForTimeout(2200);
  for (let v = 3; v <= 13; v++) { await setIn(page, v); await page.waitForTimeout(60); }
  await endIn(page);
  let allDen = 0;
  await record(page, 4500, (f, k) => {
    f.labs.filter(l => l.t === 'new enzyme').forEach(l => { const e = f.E.find(x => x.i === l.i); if (e && (e.st === 'den' || e.chain > 0.5)) fails.push(`pH 2 to 13, frame ${k}: "new enzyme" on an unfolded chain`); });
    if (f.E.every(e => e.st === 'den' && e.op > 0.95)) { allDen++; if (allDen > 3 && !f.labs.some(l => l.t === 'denatured')) fails.push(`pH 2 to 13, frame ${k}: every enzyme drawn unfolded and no "denatured" label`); }
  });
  if (!allDen) fails.push('pH 2 to 13: the enzymes never all unfolded');
  // 4: competitive inhibitor
  await page.getByRole('tab', { name: /Inhibitor/ }).click(); await page.waitForTimeout(600);
  const g0 = (await frame(page)).bar;
  await setIn(page, 3); await endIn(page);
  await record(page, 2200, (f, k) => {
    const docked = f.E.some(e => e.st === 'inh');
    if (!docked && /Inhibitor in active site/.test(f.cause)) fails.push(`competitive inhibitor, frame ${k}: "Inhibitor in active site" before any inhibitor is drawn docked`);
    if (!docked && f.bar < g0 - 0.06) fails.push(`competitive inhibitor, frame ${k}: the bar fell from ${g0.toFixed(2)} to ${f.bar.toFixed(2)} before any inhibitor docked`);
  });
  if (errs.length) fails.push('console: ' + errs.join(' | '));
  await ctx.close();
}
{ // 5: reduced motion, 65 -> 37 °C in one drag
  const { ctx, page, errs } = await open(true);
  await page.getByRole('tab', { name: /Temp/ }).click(); await page.waitForTimeout(400);
  await setIn(page, 65); await endIn(page); await page.waitForTimeout(500);
  for (const v of [60, 55, 50, 45, 40, 37]) { await setIn(page, v); await page.waitForTimeout(50); }
  await endIn(page); await page.waitForTimeout(400);
  const f = await frame(page);
  if (!f.labs.some(l => l.t === 'new enzyme')) fails.push('reduced motion, 65 to 37 °C: no "new enzyme" label on the replaced enzymes');
  if (!/new enzyme/.test(f.cause) || /still folded/.test(f.cause)) fails.push(`reduced motion, 65 to 37 °C: the cause line says "${f.cause}"`);
  if (errs.length) fails.push('console (reduced): ' + errs.join(' | '));
  await ctx.close();
}
await b.close(); server.close();
const uniq = [...new Set(fails)];
console.log(`width ${W}: ${frames} frames, failures ${uniq.length}`); console.log(uniq.slice(0, 40).join('\n'));
process.exit(uniq.length ? 1 : 0);
