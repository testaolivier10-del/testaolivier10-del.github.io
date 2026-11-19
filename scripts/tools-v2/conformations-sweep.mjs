/* Tools v2 layout sweep for the Organic Chemistry Conformation Lab (docs/tools-v2-conformations-brief.md, "Review
   recheck 2"). Fixes had been checked by spot shots and each one broke another width; this is the check that is run
   instead. Every molecule at every landmark (and four angles between), every ring in both chairs and at four points
   of the flip, and four rings of the drill, at ten widths. At each state it asserts:
     - nothing drawn or labelled is clipped by the stage (balls, letters, names, knobs, the inset, the pickers);
     - no two names overlap each other, a box (the inset, the pickers, the end chairs) or a group's letters;
     - the model is the largest object in the picture and at least a set share of the stage;
     - on a phone the line under the picture is at most two rows and its box keeps one height;
     - no sideways scroll, no console errors, a state name is shown;
     - on a first visit the cue is whole and covers no name, number, inset or end chair (both tabs, every width).

     node scripts/tools-v2/conformations-sweep.mjs [widths, comma separated] [--shots dir]

   Needs Playwright and a Chromium (CHROME or /opt/pw-browsers/chromium-1243/chrome-linux64/chrome). It serves the
   repo itself on a free port, blocks service workers, and unlocks Premium in the test only (premium.js is answered
   with has() returning true; nothing is written). Exit code 1 on any failure. Not part of CI (it takes about 4
   minutes); run it after any change to the tool's layout, labels or wording. */
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
const launch = () => chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
async function open(browser, o) {
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, serviceWorkers: 'block', deviceScaleFactor: 1 });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.route('**/assets/premium.js', r => r.fulfill({ body: readFileSync(join(ROOT, 'assets/premium.js'), 'utf8').replace('function has(course) {', 'function has(course) { return true;'), contentType: 'application/javascript' }));
  await page.route(/supabase|umami|api\.levlprep|polar/, r => r.abort());
  if (!o.cue) await page.addInitScript(() => { try { ['tk2c:ochem-conf-turn', 'tk2c:ochem-conf-flip'].forEach(k => localStorage.setItem(k, '1')); } catch (e) {} });
  await page.goto(BASE + '/ochem/tools/conformations.html', { waitUntil: 'load' });
  await page.waitForTimeout(700);
  return { page, errs };
}
const args = process.argv.slice(2), si = args.indexOf('--shots'), SHOTS = si >= 0 ? args[si + 1] : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const shot = (loc, name) => SHOTS ? loc.screenshot({ path: join(SHOTS, name) }) : null;
const WIDTHS = (args[0] && !args[0].startsWith('--') ? args[0] : '360,390,430,600,768,820,1024,1280,1440,1920').split(',').map(Number);
const MOLS = ['ethane', 'propane', 'butane', 'dichloroethane', 'dibromoethane', 'methylbutane', 'difluoroethane', 'ethylene-glycol'];
const RINGS = ['none', 'methyl', 'tbu', 'cis12', 'trans12', 'cis13', 'trans13', 'cis14', 'trans14'];
const b = await launch();
let checks = 0, states = 0; const fails = [], minShare = {};
const probe = (tab) => {
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]');
  const S = R(document.querySelector('.cf2-scene')), out = [];
  const inS = (x, name, tol = 0.6) => { if (x.l < S.l - tol || x.r > S.r + tol || x.t < S.t - tol || x.b > S.b + tol) out.push('clipped: ' + name + ' ' + [x.l - S.l, S.r - x.r, x.t - S.t, S.b - x.b].map(v => v.toFixed(0)).join(',')); };
  const hit = (a, c, g = 0.6) => !(a.r - g <= c.l || c.r - g <= a.l || a.b - g <= c.t || c.b - g <= a.t);
  const q = s => [...document.querySelectorAll(s)].filter(vis);
  const balls = q('.cf2-main .cf2-ball').map(R), thumbs = [...document.querySelectorAll('.cf2-thumb')].filter(vis).map(g => [...g.querySelectorAll('.cf2-ball')].map(R));
  balls.forEach(x => inS(x, 'a ball of the model')); thumbs.flat().forEach(x => inS(x, 'a ball of an end chair'));
  q('.cf2-main .cf2-al').forEach(e => inS(R(e), 'letters "' + e.textContent + '"'));
  [...document.querySelectorAll('.cf2-thumb')].filter(vis).forEach(g => { const bs = [...g.querySelectorAll('.cf2-ball')].map(R); [...g.querySelectorAll('.cf2-al')].forEach(e => { const t = R(e); if (!bs.some(c => t.l >= c.l - 1 && t.r <= c.r + 1)) out.push('letters "' + e.textContent + '" spill off an end chair\'s ball'); }); });
  const labs = q('.cf2-lab').map(e => ({ t: e.textContent, c: e.className, r: R(e) }));
  labs.forEach(x => inS(x.r, 'label "' + x.t + '"'));
  q('.cf2-turn .tk2-dot, .cf2-flip .tk2-dot, .cf2-inset-bg, .cf2-pick, .cf2-marker, .cf2-thumbbox, .cf2-node').forEach(e => inS(R(e), e.className.baseVal || e.className));
  for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) if (hit(labs[i].r, labs[j].r)) out.push('labels overlap: "' + labs[i].t + '" and "' + labs[j].t + '"');
  const boxes = q('.cf2-thumbbox, .cf2-inset-bg, .cf2-pick select, .cf2-thumbhit').map(e => ({ n: e.className.baseVal || e.className || 'picker', r: R(e) }));
  labs.forEach(x => boxes.forEach(c => { if (hit(x.r, c.r)) out.push('label "' + x.t + '" on a box (' + c.n + ')'); }));
  // letters of the big groups are not under a label
  q('.cf2-main .cf2-al:not(.is-h):not(.is-c)').forEach(e => labs.forEach(x => { if (hit(R(e), x.r, 1.5)) out.push('label "' + x.t + '" over the letters "' + e.textContent + '"'); }));
  const uni = a => a.length ? { l: Math.min(...a.map(x => x.l)), t: Math.min(...a.map(x => x.t)), r: Math.max(...a.map(x => x.r)), b: Math.max(...a.map(x => x.b)) } : null;
  const area = u => u ? (u.r - u.l) * (u.b - u.t) : 0, M = uni(balls), share = area(M) / (S.w * S.h);
  const others = thumbs.map(uni).map(area).concat(q('.cf2-inset-bg').map(e => area(R(e))));
  if (!M) out.push('no model drawn'); else if (others.some(a => a >= area(M))) out.push('the model is not the largest object (' + area(M).toFixed(0) + ' against ' + Math.max(...others).toFixed(0) + ')');
  const cz = q('.tk2-cz'), rows = new Set(cz.map(e => Math.round(R(e).t))).size, cause = R(document.querySelector('.tk2-cause'));
  if (innerWidth <= 640 && rows > 2) out.push('cause line is ' + rows + ' rows: ' + document.querySelector('.tk2-cause').innerText.replace(/\n/g, ' '));
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  if (!labs.some(x => /is-state/.test(x.c))) out.push('no state name');
  return { out, share, causeH: Math.round(cause.h), mw: M ? M.r - M.l : 0, sw: S.w };
};
for (const w of WIDTHS) {
  const h = w <= 430 ? 844 : w <= 820 ? 1024 : w >= 1920 ? 1080 : 900;
  // a first visit: the cue is whole, inside the stage, and covers no name, number, inset or end chair (both tabs)
  {
    const c = await open(b, { w, h, cue: true });
    const cueCheck = () => c.page.evaluate(() => { const R = e => e.getBoundingClientRect(), q = document.querySelector('.tk2-cue'); if (!q) return ['no cue shown'];
      const r = R(q), S = R(document.querySelector('.cf2-scene')), out = [];
      if (r.left < S.left || r.right > S.right || r.top < S.top || r.bottom > S.bottom) out.push('the cue is clipped by the stage');
      [...document.querySelectorAll('.cf2-lab, .cf2-inset-bg, .cf2-pick, .cf2-thumbhit')].filter(e => e.getClientRects().length && !e.closest('[hidden]')).forEach(e => { const x = R(e); if (!(r.right <= x.left || x.right <= r.left || r.bottom <= x.top || x.bottom <= r.top)) out.push('the cue covers "' + (e.textContent.trim() || e.className) + '"'); });
      return out; });
    states++; checks += 2; (await cueCheck()).forEach(m => fails.push(`${w} first visit, tab 1: ${m}`));
    await shot(c.page.locator('.cf2-scene'), `${String(w).padStart(4, '0')}-0-cue-1.png`);
    await c.page.getByRole('tab', { name: /Flip a chair/ }).click({ force: true }); await c.page.waitForTimeout(700);
    states++; checks += 2; (await cueCheck()).forEach(m => fails.push(`${w} first visit, tab 2: ${m}`));
    await shot(c.page.locator('.cf2-scene'), `${String(w).padStart(4, '0')}-0-cue-2.png`);
    await c.page.context().close();
  }
  const { page, errs } = await open(b, { w, h });
  const heights = new Set(); let lo = 9;
  const check = async (tab, what) => {
    const r = await page.evaluate(probe, tab); states++; checks += 8;
    r.out.forEach(m => fails.push(`${w} ${what}: ${m}`));
    if (w <= 640) heights.add(r.causeH);
    lo = Math.min(lo, r.share);
    const floor = tab === 1 ? (w <= 640 ? 0.08 : 0.07) : 0.085;
    if (r.share < floor) fails.push(`${w} ${what}: the model is ${(r.share * 100).toFixed(1)}% of the stage (floor ${floor * 100}%)`);
  };
  const setIn = (sel, v) => page.locator(sel).evaluate((el, val) => { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, v);
  for (const m of MOLS) {
    await page.locator('.cf2-pick select').first().selectOption(m); await page.waitForTimeout(520);
    for (let d = 0; d < 360; d += 60) { await setIn('.cf2-turn input', d); await check(1, `${m} ${d}°`); if (m === 'butane' && d === 0) await shot(page.locator('.cf2-scene'), `${String(w).padStart(4, '0')}-1-butane-0.png`); if (m === 'methylbutane' && d === 120) await shot(page.locator('.cf2'), `${String(w).padStart(4, '0')}-2-methylbutane-120.png`); }
    for (const d of [30, 95, 200, 275]) { await setIn('.cf2-turn input', d); await check(1, `${m} ${d}°`); }
  }
  await page.getByRole('tab', { name: /Flip a chair/ }).click(); await page.waitForTimeout(450);
  for (const ringId of RINGS) {
    await page.locator('.cf2-pick select').nth(1).selectOption(ringId); await page.waitForTimeout(430);
    for (const v of [100, 0, 50, 25, 8, 92]) { await setIn('.cf2-flip input', v); await check(2, `${ringId} flip ${v}%`);
      if (ringId === 'methyl' && v === 100) await shot(page.locator('.cf2-scene'), `${String(w).padStart(4, '0')}-3-methyl-eq.png`);
      if (ringId === 'trans12' && (v === 100 || v === 0)) await shot(page.locator('.cf2'), `${String(w).padStart(4, '0')}-4-trans12-${v}.png`); }
  }
  // the drill's ring too (one random ring per width)
  await page.getByRole('button', { name: 'Test yourself' }).click(); await page.waitForTimeout(400);
  await page.locator('select.ls-pick-sel').selectOption('chair'); await page.waitForTimeout(500);
  for (let k = 0; k < 4; k++) {
    const r = await page.evaluate(probe, 2); states++; checks += 8;
    r.out.filter(m => !/no state name|cause line/.test(m)).forEach(m => fails.push(`${w} drill ring ${k}: ${m}`));
    if (k === 0) await shot(page.locator('.cf2-scene'), `${String(w).padStart(4, '0')}-5-drill.png`);
    await page.locator('#cfChalGo').click(); await page.waitForTimeout(150); await page.locator('#cfChalNext').click(); await page.waitForTimeout(250);
  }
  if (w <= 640) { checks++; if (heights.size !== 1) fails.push(`${w}: cause line height not constant: ${[...heights]}`); }
  minShare[w] = (lo * 100).toFixed(1) + '%';
  const real = errs.filter(e => !/ERR_FAILED/.test(e)); checks++; if (real.length) fails.push(`${w}: console ${real.join('|')}`);
  await page.context().close();
}
await b.close();
const uniq = [...new Set(fails)];
console.log(`states ${states}, checks ${checks}, failures ${uniq.length}`); console.log('model share (min):', JSON.stringify(minShare));
const kinds = {}; uniq.forEach(f => { const k = f.replace(/^\d+ [^:]*: /, '').replace(/".*?"/g, '""').replace(/[-\d.,]+/g, '#'); kinds[k] = (kinds[k] || 0) + 1; });
console.log(Object.entries(kinds).sort((a, c) => c[1] - a[1]).slice(0, 25).map(([k, n]) => n + ' x ' + k).join('\n'));
console.log(uniq.slice(0, 25).join('\n'));
server.close();
process.exit(uniq.length ? 1 : 0);
