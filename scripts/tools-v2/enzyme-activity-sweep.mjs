/* Tools v2 layout sweep for AP® Biology Enzyme activity (docs/tools-v2-enzyme-activity-brief.md). Every landmark
   state of the four Explore tabs (both kinds of inhibitor, the way back from a denatured enzyme) and three Test
   yourself challenges, at ten widths. At each state it asserts:
     - nothing drawn or labelled is clipped by the stage (enzymes, labels, the rate bar, the knobs and their tags,
       the inhibitor switch), and every molecule stays in the solution;
     - no two labels overlap each other, the rate bar, the switch or the control's own words;
     - the enzymes are the largest objects in the picture and together at least a set share of the solution;
     - at 2 and 20 mM the share of working sites drawn holding substrate is within 0.15 of the model's S/(Km + S);
     - on a phone the cause line is at most two rows and its box keeps one height;
     - no sideways scroll, no console errors.

     node scripts/tools-v2/enzyme-activity-sweep.mjs [widths, comma separated] [--shots dir]

   Needs Playwright and a Chromium (CHROME or /opt/pw-browsers/chromium-1243/chrome-linux64/chrome). It serves the
   repo itself on a free port, blocks service workers, and unlocks Premium in the test only (premium.js is answered
   with has() returning true; nothing is written). Exit code 1 on any failure. Not part of CI (several minutes). */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const require = createRequire(join(ROOT, 'package.json'));
const { chromium } = require('playwright');
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const p = join(ROOT, normalize(decodeURIComponent(req.url.split('?')[0])));
  if (!p.startsWith(ROOT) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const args = process.argv.slice(2), si = args.indexOf('--shots'), SHOTS = si >= 0 ? args[si + 1] : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const WIDTHS = (args[0] && !args[0].startsWith('--') ? args[0] : '360,390,430,600,768,820,1024,1280,1440,1920').split(',').map(Number);
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
let checks = 0, states = 0; const fails = [], minShare = {};
const probe = (quiz) => {
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]');
  const q = s => [...document.querySelectorAll(s)].filter(vis);
  const S = R(document.querySelector('.ez2-scene')), L = R(document.querySelector('.ez2-liq')), out = [];
  const inB = (x, B, name, tol = 0.8) => { if (x.l < B.l - tol || x.r > B.r + tol || x.t < B.t - tol || x.b > B.b + tol) out.push('clipped: ' + name + ' ' + [x.l - B.l, B.r - x.r, x.t - B.t, B.b - x.b].map(v => v.toFixed(0)).join(',')); };
  const hit = (a, c, g = 0.6) => !(a.r - g <= c.l || c.r - g <= a.l || a.b - g <= c.t || c.b - g <= a.t);
  const area = x => x.w * x.h;
  // the enzymes: the folded body, or the unfolded chain
  const enz = q('.ez2-e').map(g => { const den = g.getAttribute('data-st') === 'den'; return R(g.querySelector(den ? '.ez2-chain-e' : '.ez2-body')); });
  enz.forEach(x => inB(x, L, 'an enzyme'));
  q('.ez2-parts use').forEach(e => { if (+e.getAttribute('opacity') > 0.3) inB(R(e), L, 'a molecule', 1.5); });
  const labs = q('.ez2-lab rect, .ez2-term rect').map(e => ({ t: e.parentNode.textContent, r: R(e) }));
  labs.forEach(x => inB(x.r, L, 'label "' + x.t + '"'));
  const boxes = q('.ez2-gbg, .ez2-type').map(e => ({ t: e.getAttribute('class'), r: R(e) }));
  boxes.forEach(x => inB(x.r, S, x.t));
  const ctl = q('.ez2-ctlname rect, .ez2-end, .ez2 .tk2-tag, .ez2 .tk2-dot').map(e => ({ t: (e.textContent || e.parentNode.textContent || e.getAttribute('class')).trim() || 'knob', r: R(e) }));
  ctl.forEach(x => inB(x.r, S, 'control "' + x.t + '"'));
  const all = labs.concat(boxes);
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (hit(all[i].r, all[j].r)) out.push('labels overlap: "' + all[i].t + '" and "' + all[j].t + '"');
  const words = q('.ez2-ctlname rect, .ez2-end, .ez2 .tk2-tag, .ez2-type, .ez2 .tk2-drag.is-quiet .tk2-dot').map(e => ({ t: (e.textContent || e.parentNode.textContent).trim() || 'quiet knob', r: R(e) }));
  for (let i = 0; i < words.length; i++) for (let j = i + 1; j < words.length; j++) if (hit(words[i].r, words[j].r)) out.push('control words overlap: "' + words[i].t + '" and "' + words[j].t + '"');
  const cueEl = q('.tk2-cue')[0];
  if (cueEl) words.concat(labs).forEach(x => { if (hit(R(cueEl), x.r)) out.push('the cue covers "' + x.t + '"'); });
  const big = Math.max(...all.filter(x => !/ez2-type/.test(x.t)).map(x => area(x.r)), ...q('.ez2-parts use').map(e => area(R(e))), 0), small = Math.min(...enz.map(area));
  if (!enz.length) out.push('no enzymes drawn'); else if (big >= small) out.push('an enzyme is not larger than every other thing (' + small.toFixed(0) + ' against ' + big.toFixed(0) + ')');
  const share = enz.reduce((a, x) => a + area(x), 0) / area(L);
  if (!quiz) {
    const cz = q('.tk2-cz'), rows = new Set(cz.map(e => Math.round(R(e).t))).size;
    if (innerWidth <= 640 && rows > 2) out.push('cause line is ' + rows + ' rows: ' + document.querySelector('.tk2-cause').innerText.replace(/\n/g, ' '));
    if (!cz.length) out.push('no cause line');
  }
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  const c = document.querySelector('.tk2-cause');
  return { out, share, causeH: c ? Math.round(R(c).h) : 0 };
};
for (const w of WIDTHS) {
  const h = w <= 430 ? 844 : w <= 820 ? 1024 : w >= 1920 ? 1080 : 900;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', deviceScaleFactor: 1 });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.route('**/assets/premium.js', r => r.fulfill({ body: readFileSync(join(ROOT, 'assets/premium.js'), 'utf8').replace('function has(course) {', 'function has(course) { return true;'), contentType: 'application/javascript' }));
  await page.route(/supabase|umami|api\.levlprep|polar/, r => r.abort());
  await page.goto(BASE + '/bio/tools/enzyme-activity.html', { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const heights = new Set(); let lo = 9;
  const W4 = String(w).padStart(4, '0');
  const check = async (what, quiz, shot) => {
    const r = await page.evaluate(probe, !!quiz); states++; checks += 7;
    r.out.forEach(m => fails.push(`${w} ${what}: ${m}`));
    if (w <= 640 && !quiz) heights.add(r.causeH);
    lo = Math.min(lo, r.share);
    if (r.share < 0.2) fails.push(`${w} ${what}: the enzymes are ${(r.share * 100).toFixed(1)}% of the solution (floor 20%)`);
    if (SHOTS && shot) await page.locator('.ez2').screenshot({ path: join(SHOTS, `${W4}-${shot}.png`) });
  };
  const main = '.ez2 .tk2-drag:not([hidden]):not(.is-quiet) input', quiet = '.ez2 .tk2-drag.is-quiet:not([hidden]) input';
  const setIn = (sel, v) => page.locator(sel).evaluate((el, val) => { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, v);
  const run = async (tab, list, wait) => { for (const [v, shot] of list) { await setIn(main, v); await page.waitForTimeout(wait); await check(`${tab} ${v}`, false, shot); } };
  await check('opening (with the cue)', false, '1-open');
  await run('substrate', [[0, '1-sub-0'], [0.5], [2], [8], [20, '1-sub-20']], 700);
  // saturation is drawn: the share of working sites holding substrate follows the model's S/(Km + S)
  for (const v of [2, 20]) {
    await setIn(main, v); await page.waitForTimeout(2200); let a = 0, n = 0;
    for (let k = 0; k < 15; k++) { const r = await page.evaluate(() => [...document.querySelectorAll('.ez2-e')].map(g => g.getAttribute('data-sub'))); r.forEach(x => { if (x !== '-') { n++; if (x === '1') a++; } }); await page.waitForTimeout(70); }
    checks++; const want = v / (2 + v), got = a / Math.max(1, n);
    if (Math.abs(got - want) > 0.15) fails.push(`${w} substrate ${v} mM: ${got.toFixed(2)} of working sites drawn full, the model's share is ${want.toFixed(2)}`);
  }
  await page.getByRole('tab', { name: /Temperature/ }).click(); await page.waitForTimeout(500);
  await run('temperature', [[37], [0, '2-temp-0'], [20], [41, '2-temp-41'], [45], [50, '2-temp-50'], [60], [70, '2-temp-70'], [20, '2-temp-back']], 1250);
  await page.getByRole('tab', { name: /pH/ }).click(); await page.waitForTimeout(500);
  await run('pH', [[7, '3-ph-7'], [5.5], [5, '3-ph-5'], [3], [1, '3-ph-1'], [7, '3-ph-back'], [9], [11], [13, '3-ph-13']], 1250);
  await page.getByRole('tab', { name: /Inhibitor/ }).click(); await page.waitForTimeout(500);
  for (const kind of ['Competitive', 'Noncompetitive']) {
    await page.getByRole('button', { name: kind, exact: true }).click(); await page.waitForTimeout(400);
    await setIn(quiet, 5);
    await run(kind, [[0, kind === 'Competitive' ? '4-inh-0' : null], [1], [3, '4-' + kind.toLowerCase() + '-3'], [5]], 1400);
    await setIn(main, 2); await setIn(quiet, 20); await page.waitForTimeout(1400); await check(kind + ' 2, substrate 20', false, '4-' + kind.toLowerCase() + '-s20');
    await setIn(quiet, 0); await page.waitForTimeout(700); await check(kind + ' 2, substrate 0');
  }
  if (w <= 640) { checks++; if (heights.size !== 1) fails.push(`${w}: cause line height not constant: ${[...heights]}`); }
  await page.getByRole('button', { name: 'Test yourself' }).click(); await page.waitForTimeout(900);
  for (let k = 0; k < 3; k++) {
    await check('challenge ' + k + ' before', true, k === 0 ? '5-quiz' : null);
    await page.locator('.ez2-predict input[type=radio]').first().check({ force: true });
    await page.locator('.ez-do').click(); await page.waitForTimeout(2300);
    await check('challenge ' + k + ' after', true);
    await page.locator('.os-next').click(); await page.waitForTimeout(600);
  }
  minShare[w] = (lo * 100).toFixed(1) + '%';
  const real = errs.filter(e => !/ERR_FAILED/.test(e)); checks++; if (real.length) fails.push(`${w}: console ${real.join('|')}`);
  await ctx.close();
}
await b.close();
const uniq = [...new Set(fails)];
console.log(`states ${states}, checks ${checks}, failures ${uniq.length}`); console.log('enzyme share of the solution (min):', JSON.stringify(minShare));
const kinds = {}; uniq.forEach(f => { const k = f.replace(/^\d+ [^:]*: /, '').replace(/".*?"/g, '""').replace(/[-\d.,]+/g, '#'); kinds[k] = (kinds[k] || 0) + 1; });
console.log(Object.entries(kinds).sort((a, c) => c[1] - a[1]).slice(0, 25).map(([k, n]) => n + ' x ' + k).join('\n'));
console.log(uniq.slice(0, 40).join('\n'));
server.close();
process.exit(uniq.length ? 1 : 0);
