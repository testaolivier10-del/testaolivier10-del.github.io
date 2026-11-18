/* Tools v2 layout sweep for AP® Chemistry Units and significant figures (docs/tools-v2-units-sig-figs-brief.md),
   after the pattern of the biology sweeps (water-potential-sweep.mjs on its branch). Every landmark state of both
   Explore tabs, the first visit and Test yourself, at ten widths. At each state it asserts:
     - nothing drawn or labelled is clipped by the stage (cards, the tag, the reading, the names, the knob, the
       magnifier);
     - no two labels or cards overlap (a card and its own × aside);
     - the thing acted on is the largest object (tab 1: the board the cards go on; tab 2: the magnifier, which the
       water is dragged in, and the vessel with its knob, each larger than any label);
     - the words agree with the model: the struck units are the chain's cancelled pairs, the tag, the result card
       and the cause line show the chain's value and unit, and the reading shows ApChemMath.units.read's digits;
     - on a phone the cause line is at most two rows and keeps one height in each tab;
     - no sideways scroll, no console errors;
     - on a first visit the cue is whole and covers no card, label or number.

     node scripts/tools-v2/units-sig-figs-sweep.mjs [widths, comma separated] [--shots dir]

   Needs Playwright and a Chromium (CHROME or /opt/pw-browsers/chromium-1243/chrome-linux64/chrome). It serves the
   repo itself on a free port and blocks service workers; the tool is free, so nothing is unlocked. Exit code 1 on
   any failure. Not part of CI (about two minutes). */
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
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
async function open(o) {
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, serviceWorkers: 'block', deviceScaleFactor: 1 });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.addInitScript(cue => { try { if (!cue) { localStorage.setItem('tk2c:apchem-units-sig-figs', '1'); localStorage.setItem('tk2c:apchem-units-sig-figs-read', '1'); } } catch (e) {} }, !!o.cue);
  await page.goto(BASE + '/chem/tools/units-sig-figs.html', { waitUntil: 'load' });
  await page.waitForSelector('.us3-card.is-start');
  await page.waitForTimeout(500);
  return { page, errs };
}
const shot = async (page, name) => { if (!SHOTS) return; const vis = await page.locator('.us3').isVisible(); return vis ? page.locator('.us3').screenshot({ path: join(SHOTS, name) }) : page.screenshot({ path: join(SHOTS, name) }); };
/* Runs in the page. */
const probe = (o) => {
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]');
  const q = s => [...document.querySelectorAll(s)].filter(vis), out = [];
  const S = R(document.querySelector('.us3-scene'));
  const inS = (x, name, tol = 0.6) => { if (x.l < S.l - tol || x.r > S.r + tol || x.t < S.t - tol || x.b > S.b + tol) out.push('clipped: ' + name); };
  const hit = (a, c, g = 0.6) => !(a.r - g <= c.l || c.r - g <= a.l || a.b - g <= c.t || c.b - g <= a.t);
  const area = x => x.w * x.h;
  const M = window.ApChemMath, causeEl = document.querySelector('.us3 .tk2-cause'), cause = causeEl.innerText.replace(/\s+/g, ' ');
  const items = [];
  if (o.tab === 'units') {
    q('.us3-card').forEach(c => { const f = c.querySelector('.us3-face'); items.push({ n: 'card ' + (c.getAttribute('data-f') || c.className), r: R(f || c), grp: c }); });
    q('.us3-x').forEach(x => items.push({ n: 'remove ×', r: R(x.querySelector('span')), grp: x.closest('.us3-card') }));
    q('.us3-op').forEach(x => items.push({ n: 'operator ' + x.textContent, r: R(x), grp: x.closest('.us3-card') }));
    const tag = R(document.querySelector('.us3-tag')); items.push({ n: 'tag', r: tag });
    // the flask's tag sits on the flask
    const board = R(document.querySelector('.us3-boardin')), flask = R(document.querySelector('.us3-glass'));
    if (!(area(board) > area(flask))) out.push('the board is not the largest object');
    items.filter(x => /^card/.test(x.n)).forEach(x => { if (area(x.r) > area(board)) out.push(x.n + ' is larger than the board'); });
    // words agree with the model
    const D = window.__us3data, chain = [...document.querySelectorAll('.us3-card.is-board')].map(c => ({ id: c.getAttribute('data-f'), flip: c.classList.contains('is-flip'), x: R(c).l, y: R(c).t }));
    chain.sort((a, c) => (Math.abs(a.y - c.y) > 10 ? a.y - c.y : a.x - c.x));
    if (D) {
      const F = Object.fromEntries(D.factors.map(f => [f.id, f]));
      const res = M.units.chain(D.start, chain.map(c => ({ top: F[c.id].top, bot: F[c.id].bot, sf: F[c.id].sf, flip: c.flip })));
      const struck = q('.us3-u.is-x').length;
      if (struck !== 2 * res.pairs.length) out.push(`struck ${struck} units, the chain cancels ${res.pairs.length} pairs`);
      const val = M.units.sigText(res.value, res.sf), tagT = document.querySelector('.us3-tag').innerText.replace(/\s+/g, ' ');
      if (!tagT.includes(val)) out.push('tag says ' + tagT + ', the chain gives ' + res.text);
      if (chain.length && !cause.includes(val)) out.push('cause line says ' + cause + ', the chain gives ' + res.text);
      res.pairs.forEach(p => { if (!cause.includes(p.u + ' cancels')) out.push('cause line misses ' + p.u + ' cancels'); });
      if (chain.length && !res.pairs.length && !cause.includes('nothing cancels')) out.push('cause line should say nothing cancels');
    }
  } else {
    const tx = s => q(s).map(e => ({ n: 'text "' + e.textContent + '"', r: R(e) }));
    items.push(...tx('.us3-vname'), ...tx('.us3-oname'), ...tx('.us3-brkt'), ...tx('.us3-was'));
    const dg = q('.us3-dig, .us3-dunit').map(R); if (dg.length) { const u = { l: Math.min(...dg.map(d => d.l)), t: Math.min(...dg.map(d => d.t)), r: Math.max(...dg.map(d => d.r)), b: Math.max(...dg.map(d => d.b)) }; u.w = u.r - u.l; u.h = u.b - u.t; items.push({ n: 'reading', r: u }); }
    q('.us3-count rect').forEach(e => items.push({ n: 'count pill', r: R(e) }));
    q('.us3 .tk2-dot').forEach(e => items.push({ n: 'knob', r: R(e) }));
    q('.us3 .tk2-tap').forEach(e => items.push({ n: 'other vessel', r: R(e) }));
    const lens = q('.us3-rim2')[0], ves = q('.us3-ves.is-main .us3-glassv')[0];
    if (lens) { const L = R(lens); items.push({ n: 'magnifier', r: L, big: true }); inS(L, 'magnifier'); }
    if (ves) { const V = R(ves); inS(V, 'the vessel'); items.filter(x => !x.big).forEach(x => { if (area(x.r) > area(V)) out.push(x.n + ' is larger than the vessel'); }); }
    // the reading agrees with the model
    const v = +document.querySelector('.us3 .tk2-drag input').value, inst = document.querySelector('.us3-vname').textContent === 'Beaker' ? { every: 10 } : { every: 1 };
    const r = M.units.read(v, inst), shown = q('.us3-dig').map(e => e.textContent).join('');
    if (shown !== r.shown.replace(/^0+(?=\d)/, '')) out.push('reading shows ' + shown + ', model ' + r.shown);
    if (!cause.includes(r.sf + ' significant figure') || !cause.includes(r.est + ' estimated')) out.push('cause line disagrees: ' + cause);
    const pill = q('.us3-count text')[0]; if (!pill || !pill.textContent.startsWith(r.sf + ' ')) out.push('count pill disagrees');
  }
  items.forEach(x => inS(x.r, x.n));
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], c = items[j];
    if (a.big || c.big) continue;
    if (a.grp && a.grp === c.grp) continue;
    if (hit(a.r, c.r)) out.push('overlap: ' + a.n + ' and ' + c.n);
  }
  if (o.tab === 'read') { const L = items.find(x => x.big); if (L) items.filter(x => !x.big && x.n !== 'knob').forEach(x => { if (hit(x.r, L.r, 2)) out.push(x.n + ' under the magnifier'); }); }
  const rows = new Set(q('.us3 .tk2-cz').map(e => Math.round(R(e).t))).size;
  if (innerWidth <= 640 && rows > 2) out.push('cause line is ' + rows + ' rows: ' + cause);
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  return { out, causeH: Math.round(R(causeEl).h) };
};
let checks = 0, states = 0; const fails = [];
for (const w of WIDTHS) {
  const h = w <= 430 ? 844 : w <= 820 ? 1024 : w >= 1920 ? 1080 : 900, W4 = String(w).padStart(4, '0');
  for (const tab of ['units', 'read']) { // a first visit: the cue is whole and covers nothing
    const c = await open({ w, h, cue: true });
    if (tab === 'read') { await c.page.click('.tk2-tab[data-v=read]'); await c.page.waitForTimeout(400); }
    const bad = await c.page.evaluate(() => { const R = e => e.getBoundingClientRect(), q = [...document.querySelectorAll('.tk2-cue')].filter(e => e.getClientRects().length)[0]; if (!q) return ['no cue shown'];
      const r = R(q), S = R(document.querySelector('.us3-scene')), out = [];
      if (r.left < S.left || r.right > S.right || r.top < S.top || r.bottom > S.bottom) out.push('the cue is clipped by the stage');
      [...document.querySelectorAll('.us3-face, .us3-card.is-start, .us3-tag, .us3-vname, .us3-oname, .us3-dig, .us3-brkt, .us3-count rect, .us3 .tk2-tap')].filter(e => e.getClientRects().length && !e.closest('[hidden]')).forEach(e => { const x = R(e); if (!(r.right <= x.left || x.right <= r.left || r.bottom <= x.top || x.bottom <= r.top)) out.push('the cue covers ' + (e.textContent || e.getAttribute('aria-label') || e.className.baseVal || e.className).toString().trim().slice(0, 24)); });
      return out; });
    states++; checks += 2; bad.forEach(m => fails.push(`${w} first visit ${tab}: ${m}`));
    await shot(c.page, `${W4}-0-first-visit-${tab}.png`);
    await c.page.context().close();
  }
  const { page, errs } = await open({ w, h });
  await page.evaluate(async () => { const r = await fetch('/chem/assets/tool-data/units-sig-figs.json'); window.__us3data = (await r.json()).explore.convert; });
  const heights = { units: new Set(), read: new Set() };
  const check = async (tab, what) => {
    const r = await page.evaluate(probe, { tab }); states++; checks += 7;
    r.out.forEach(m => fails.push(`${w} ${what}: ${m}`));
    if (w <= 640) heights[tab].add(r.causeH);
  };
  const tapCard = async id => { await page.click(`.us3-card[data-f="${id}"] .us3-face`); await page.waitForTimeout(1250); };
  await check('units', 'empty board'); await shot(page, `${W4}-1-units-empty.png`);
  await tapCard('L'); await check('units', 'mL to L'); await shot(page, `${W4}-1-units-L.png`);
  await tapCard('L'); await check('units', 'L turned over'); await shot(page, `${W4}-1-units-L-flipped.png`);
  await page.click('.us3-card[data-f="L"] .us3-x'); await page.waitForTimeout(1200);
  await tapCard('g'); await tapCard('mol'); await check('units', 'mL to mol');
  await tapCard('n'); await check('units', 'mL to molecules'); await shot(page, `${W4}-1-units-molecules.png`);
  await tapCard('L'); await check('units', 'all four'); await shot(page, `${W4}-1-units-all.png`);
  await page.click('.us3-clear'); await page.waitForTimeout(1200); await check('units', 'cleared');
  await page.click('.tk2-tab[data-v=read]'); await page.waitForTimeout(400);
  const setV = v => page.locator('.us3 .tk2-drag input').evaluate((el, val) => { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, v);
  for (const inst of ['cylinder', 'beaker']) {
    for (const v of [2, 9.6, 33.7, 48]) {
      await setV(v); await page.waitForTimeout(150);
      await check('read', `${inst} at ${v} mL`);
      if (v === 33.7 || v === 2) await shot(page, `${W4}-2-${inst}-${v}.png`);
    }
    if (inst === 'cylinder') { await page.click('.us3 .tk2-tap'); await page.waitForTimeout(1300); }
  }
  // Test yourself: a graded problem and a setup
  await page.click('.ls-root button:has-text("Test yourself")'); await page.waitForTimeout(500);
  const ty = await page.evaluate(() => ({ stem: !!document.querySelector('.us3-qstage .chem-q-stem'), check: !!document.querySelector('.us3-qdock button'), sw: document.documentElement.scrollWidth > innerWidth }));
  checks += 3; if (!ty.stem) fails.push(`${w} Test yourself: no problem on the stage`); if (!ty.check) fails.push(`${w} Test yourself: no answer form`); if (ty.sw) fails.push(`${w} Test yourself: sideways scroll`);
  await shot(page, `${W4}-3-test-problem.png`);
  await page.selectOption('select.ls-pick-sel', 'setup-gas'); await page.waitForTimeout(400);
  const su = await page.evaluate(() => ({ frac: !!document.querySelector('.us3-sstage .us-frac [data-q]'), sw: document.documentElement.scrollWidth > innerWidth }));
  checks += 2; if (!su.frac) fails.push(`${w} Set it up: no quantities on the stage`); if (su.sw) fails.push(`${w} Set it up: sideways scroll`);
  if (w <= 640) for (const t of ['units', 'read']) { checks++; if (heights[t].size > 1) fails.push(`${w}: cause line height not constant in ${t}: ${[...heights[t]]}`); }
  const real = errs.filter(e => !/ERR_FAILED/.test(e)); checks++; if (real.length) fails.push(`${w}: console ${real.join('|')}`);
  await page.context().close();
}
await browser.close();
const uniq = [...new Set(fails)];
console.log(`states ${states}, checks ${checks}, failures ${uniq.length}`);
const kinds = {}; uniq.forEach(f => { const k = f.replace(/^\d+ [^:]*: /, '').replace(/".*?"/g, '""').replace(/[-\d.,]+/g, '#'); kinds[k] = (kinds[k] || 0) + 1; });
console.log(Object.entries(kinds).sort((a, c) => c[1] - a[1]).slice(0, 25).map(([k, n]) => n + ' x ' + k).join('\n'));
console.log(uniq.slice(0, 50).join('\n'));
server.close();
process.exit(uniq.length ? 1 : 0);
