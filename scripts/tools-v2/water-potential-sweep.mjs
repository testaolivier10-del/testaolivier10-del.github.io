/* Tools v2 layout sweep for AP® Biology Water potential (docs/tools-v2-water-potential-brief.md), after the pattern
   of conformations-sweep.mjs. Every landmark setting (pressure 0, 2, 4.9, 7 and 9.8 bar against 0, 0.20, 0.40,
   0.70 and 1.0 M outside), the first visit and two practice problems (before and after the last part), at ten
   widths. At each state it asserts:
     - nothing drawn or labelled is clipped by the stage (the cell, the sums, the words, the knobs and their tags);
     - no two labels overlap, and the water arrows cross no sum;
     - the cell (the thing acted on) is the largest object in the picture and at least a set share of the stage;
     - every particle is inside the solution and none is under a sum;
     - the numbers add up, and the words, the arrows and the cause line say what the numbers say;
     - on a phone the cause line is at most two rows and keeps one height;
     - no sideways scroll, no console errors;
     - on a first visit the cue is whole and covers no label, number or the other knob.

     node scripts/tools-v2/water-potential-sweep.mjs [widths, comma separated] [--shots dir]

   Needs Playwright and a Chromium (CHROME or /opt/pw-browsers/chromium-1243/chrome-linux64/chrome). It serves the
   repo itself on a free port and blocks service workers; the tool is free, so nothing is unlocked. Exit code 1 on
   any failure. Not part of CI (about a minute); run it after any change to the tool's layout, labels or wording. */
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
  if (!o.cue) await page.addInitScript(() => { try { localStorage.setItem('tk2c:apbio-water-potential', '1'); localStorage.setItem('tk2h:apbio-wp-pressure', '1'); } catch (e) {} });
  await page.goto(BASE + '/bio/tools/water-potential.html' + (o.q || ''), { waitUntil: 'load' });
  await page.waitForSelector('.wp2-svg .wp2-card');
  await page.waitForTimeout(500);
  return { page, errs };
}
const shot = (page, name) => SHOTS ? page.locator('.wp2').screenshot({ path: join(SHOTS, name) }) : null;
/* Runs in the page. explore: check the numbers against the knobs. */
const probe = (mode) => {
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]');
  const q = s => [...document.querySelectorAll(s)].filter(vis), out = [];
  const S = R(document.querySelector('.wp2-scene')), liq = R(document.querySelector('.wp2-sol'));
  const inS = (x, name, tol = 0.6) => { if (x.l < S.l - tol || x.r > S.r + tol || x.t < S.t - tol || x.b > S.b + tol) out.push('clipped: ' + name); };
  const hit = (a, c, g = 0.6) => !(a.r - g <= c.l || c.r - g <= a.l || a.b - g <= c.t || c.b - g <= a.t);
  const area = x => x.w * x.h;
  const cell = R(document.querySelector('.wp2-wall')); inS(cell, 'the cell');
  if (cell.l < liq.l || cell.r > liq.r || cell.t < liq.t - 1 || cell.b > liq.b) out.push('the cell is not inside the solution');
  const cards = q('.wp2-cardbg').map(e => ({ n: 'sum ' + e.parentNode.getAttribute('data-card'), k: e.parentNode.getAttribute('data-card'), r: R(e) }));
  const words = q('.wp2-word rect').map(e => ({ n: 'word "' + e.parentNode.textContent + '"', k: e.closest('.wp2-word').getAttribute('data-word'), r: R(e) }));
  const pills = q('.wp2-pill rect').filter(e => !e.closest('.wp2-word')).map(e => ({ n: 'label "' + e.parentNode.textContent + '"', r: R(e) }));
  const tags = q('.wp2 .tk2-tag').map(e => ({ n: 'tag "' + e.textContent + '"', r: R(e) }));
  const knobs = q('.wp2 .tk2-dot').map(e => ({ n: 'knob', r: R(e) }));
  const texts = q('.wp2-end, .wp2-markt').map(e => ({ n: 'text "' + e.textContent + '"', r: R(e) }));
  const all = [...cards, ...words, ...pills, ...tags, ...knobs, ...texts];
  all.forEach(x => inS(x.r, x.n));
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], c = all[j];
    if (a.k && c.k && a.k === c.k) continue;                     // a sum and the word that hangs from it
    if (hit(a.r, c.r)) out.push('overlap: ' + a.n + ' and ' + c.n);
  }
  // every text of a sum is inside its box, and the name does not run into a number
  q('.wp2-card').forEach(g => { const b = R(g.querySelector('.wp2-cardbg')), ts = [...g.querySelectorAll('text')].map(R); ts.forEach(t => { if (t.l < b.l + 2 || t.r > b.r - 2 || t.t < b.t || t.b > b.b + 1) out.push('a sum’s text leaves its box (' + g.getAttribute('data-card') + ')'); });
    for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) if (hit(ts[i], ts[j], 1.5)) out.push('texts collide inside a sum (' + g.getAttribute('data-card') + ')'); });
  // the cell's own sum may sit in its vacuole; the other labels stay off the cell
  [...cards.filter(c => c.k === 'out'), ...words.filter(c => c.k === 'out'), ...tags, ...texts].forEach(x => { if (hit(x.r, cell, 2)) out.push(x.n + ' on the cell'); });
  const flow = q('.wp2-flowg path, .wp2-flowg circle').map(R);
  flow.forEach(f => { inS(f, 'a water arrow'); cards.forEach(c => { if (hit(f, c.r, 1)) out.push('a water arrow crosses ' + c.n); }); [...tags, ...knobs].forEach(c => { if (hit(f, c.r, 1)) out.push('a water arrow under ' + c.n); }); });
  q('.wp2-push, .wp2-push-h').map(R).forEach(f => { if (f.l < cell.l - 1 || f.r > cell.r + 1 || f.t < cell.t - 1 || f.b > cell.b + 1) out.push('a push arrow leaves the cell'); });
  // particles: in the solution, and never under a sum or a label
  const dots = q('.wp2-dots circle').map(R), solid = [...cards, ...words, ...pills, ...tags];
  let stray = 0, under = 0;
  dots.forEach(d => { if (d.l < liq.l - 0.5 || d.r > liq.r + 0.5 || d.t < liq.t - 0.5 || d.b > liq.b + 0.5) stray++; if (solid.some(c => hit(d, c.r, 1))) under++; });
  if (stray) out.push(stray + ' particles outside the solution'); if (under) out.push(under + ' particles under a label');
  // the cell is the largest object and a real share of the stage
  const share = area(cell) / area(S), big = Math.max(...cards.map(c => area(c.r)));
  if (big >= area(cell)) out.push('the cell is not the largest object');
  // numbers, words, arrows and the cause line agree
  const num = t => parseFloat(String(t).replace('−', '-')), v = (c, k) => { const e = document.querySelector('[data-card="' + c + '"] [data-v="' + k + '"]'); return e ? e.textContent : ''; };
  const cz = q('.wp2 .tk2-cz'), causeEl = document.querySelector('.wp2 .tk2-cause'), causeVis = vis(causeEl), cause = causeVis ? causeEl.innerText.replace(/\n/g, ' ') : '';
  const fg = q('.wp2-flowg')[0], dir = fg ? fg.getAttribute('data-dir') : null, w1 = words.find(x => x.k === 'cell'), w2 = words.find(x => x.k === 'out');
  const ct = num(v('cell', 'total')), ot = num(v('out', 'total'));
  if (mode === 'explore' || mode === 'checked') {
    const want = Math.abs(ct - ot) < 0.005 ? 'none' : ot > ct ? 'in' : 'out';
    if (dir !== want) out.push('arrows say ' + dir + ', numbers say ' + want);
    if (!cause.includes(want === 'in' ? 'water moves in' : want === 'out' ? 'water moves out' : 'no net water movement')) out.push('cause line disagrees: ' + cause);
    if (!w1 || !w2 || w1.n !== 'word "' + (want === 'none' ? 'equal' : want === 'in' ? 'lower' : 'higher') + '"' || w2.n !== 'word "' + (want === 'none' ? 'equal' : want === 'in' ? 'higher' : 'lower') + '"') out.push('the words disagree with the numbers');
  }
  if (mode === 'explore') {
    const p = +document.querySelector('.wp2-kp input').value, cs = num(v('cell', 's')), cp = num(v('cell', 'p'));
    if (Math.abs(cp - p) > 0.001) out.push('pressure shown ' + cp + ', knob ' + p);
    if (Math.abs(cs + cp - ct) > 0.001) out.push('the cell’s sum does not add up');
    if (Math.abs(num(v('out', 's')) - ot) > 0.001) out.push('the outside sum does not add up');
  }
  if (mode === 'new') { if (dir) out.push('arrows before the answer'); if (words.length) out.push('a word before the answer'); if (causeVis) out.push('cause line before the answer'); }
  const rows = new Set(cz.map(e => Math.round(R(e).t))).size;
  if (causeVis && innerWidth <= 640 && rows > 2) out.push('cause line is ' + rows + ' rows: ' + cause);
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  return { out, share, causeH: causeVis ? Math.round(R(causeEl).h) : null };
};
let checks = 0, states = 0; const fails = [], minShare = {};
const setIn = (page, sel, v) => page.locator(sel).evaluate((el, val) => { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, v);
for (const w of WIDTHS) {
  const h = w <= 430 ? 844 : w <= 820 ? 1024 : w >= 1920 ? 1080 : 900, W4 = String(w).padStart(4, '0');
  { // a first visit: the cue is whole and covers no label, number or the other knob
    const c = await open({ w, h, cue: true });
    const bad = await c.page.evaluate(() => { const R = e => e.getBoundingClientRect(), q = document.querySelector('.tk2-cue'); if (!q) return ['no cue shown'];
      const r = R(q), S = R(document.querySelector('.wp2-scene')), out = [];
      if (r.left < S.left || r.right > S.right || r.top < S.top || r.bottom > S.bottom) out.push('the cue is clipped by the stage');
      [...document.querySelectorAll('.wp2-cardbg, .wp2-pill rect, .wp2 .tk2-tag, .wp2-end, .wp2-ks .tk2-dot')].filter(e => e.getClientRects().length && !e.closest('[hidden]')).forEach(e => { const x = R(e); if (!(r.right <= x.left || x.right <= r.left || r.bottom <= x.top || x.bottom <= r.top)) out.push('the cue covers ' + (e.textContent || e.parentNode.textContent || 'the solute knob').trim().slice(0, 24)); });
      return out; });
    states++; checks += 2; bad.forEach(m => fails.push(`${w} first visit: ${m}`));
    await shot(c.page, `${W4}-0-first-visit.png`);
    await c.page.context().close();
  }
  const { page, errs } = await open({ w, h });
  const heights = new Set(); let lo = 9;
  const check = async (mode, what) => {
    const r = await page.evaluate(probe, mode); states++; checks += 9;
    r.out.forEach(m => fails.push(`${w} ${what}: ${m}`));
    if (w <= 640 && r.causeH != null) heights.add(r.causeH);
    lo = Math.min(lo, r.share);
    const floor = w <= 640 ? 0.1 : mode === 'explore' ? 0.09 : 0.08;
    if (r.share < floor) fails.push(`${w} ${what}: the cell is ${(r.share * 100).toFixed(1)}% of the stage (floor ${floor * 100}%)`);
  };
  for (const p of [2, 0, 4.9, 7, 9.8]) for (const c of [0.2, 0, 0.4, 0.7, 1]) {
    await setIn(page, '.wp2-kp input', p); await setIn(page, '.wp2-ks input', c); await page.waitForTimeout(650);
    await check('explore', `pressure ${p}, solute ${c}`);
    if ((p === 2 && c === 0.2) || (p === 4.9 && c === 0.2) || (p === 9.8 && c === 1) || (p === 0 && c === 0.7) || (p === 9.8 && c === 0)) await shot(page, `${W4}-1-p${p}-c${c}.png`);
  }
  // Test yourself: a problem of each kind (the first two of the worked set and its third), before and after
  await page.getByRole('button', { name: 'Test yourself' }).click(); await page.waitForTimeout(500);
  for (const pick of ['set:0', 'set:2']) {
    await page.locator('select.ls-pick-sel').selectOption(pick); await page.waitForTimeout(500);
    await check('new', `problem ${pick}, new`);
    for (let i = 0; i < 6; i++) {
      const part = page.locator('.ls-dock .bt-part:not(.is-right):not(.is-shown)').first();
      if (!(await part.count())) break;
      const txt = part.locator('input[type=text]');
      if (await txt.count()) { await txt.fill('-3'); if (i === 0) { await page.waitForTimeout(120); await check('typed', `problem ${pick}, a typed value`); } }
      else await part.locator('input[type=radio]').first().check({ force: true });
      await part.locator('.bt-pcheck').click(); await page.waitForTimeout(120);
      const show = page.locator('.ls-dock button:has-text("Show the answer")');
      if (await show.count()) { await show.first().click(); await page.waitForTimeout(120); }
    }
    await page.waitForTimeout(w <= 640 ? 2600 : 900);
    await check('checked', `problem ${pick}, checked`);
    await shot(page, `${W4}-2-problem-${pick.replace(':', '')}.png`);
  }
  if (w <= 640) { checks++; if (heights.size !== 1) fails.push(`${w}: cause line height not constant: ${[...heights]}`); }
  minShare[w] = (lo * 100).toFixed(1) + '%';
  const real = errs.filter(e => !/ERR_FAILED/.test(e)); checks++; if (real.length) fails.push(`${w}: console ${real.join('|')}`);
  await page.context().close();
}
await browser.close();
const uniq = [...new Set(fails)];
console.log(`states ${states}, checks ${checks}, failures ${uniq.length}`); console.log('cell share of the stage (min):', JSON.stringify(minShare));
const kinds = {}; uniq.forEach(f => { const k = f.replace(/^\d+ [^:]*: /, '').replace(/".*?"/g, '""').replace(/[-\d.,]+/g, '#'); kinds[k] = (kinds[k] || 0) + 1; });
console.log(Object.entries(kinds).sort((a, c) => c[1] - a[1]).slice(0, 25).map(([k, n]) => n + ' x ' + k).join('\n'));
console.log(uniq.slice(0, 40).join('\n'));
server.close();
process.exit(uniq.length ? 1 : 0);
