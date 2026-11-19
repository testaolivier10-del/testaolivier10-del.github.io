/* Tools v2 layout sweep for the Organic Chemistry Resonance tool (docs/tools-v2-resonance-brief.md). Every form of every
   species (reached by tapping it in the forms row, with reduced motion so each lands at once), a held push (an atom at
   ten electrons) for three species, Find every form at its start and when finished, leaving Explore in the middle of a
   two step replay (phenoxide, motion on: Test yourself must start clean and Explore come back settled), Which is more stabilized? before
   and after the call, and a first visit with the cue, at ten widths. At each state it asserts:
     - nothing drawn or named is clipped by the stage (balls, lone pairs, charge badges, names, marks, form cards);
     - names sit at least 4 px clear of each other, of every ball and charge badge, of the picker and Undo;
     - charge badges and lone pairs do not sit on another atom's ball;
     - the real molecule letters each ball as the board does (CH₃ never as "C"; too small to letter: colour only);
     - in the forms row every badge and letter is inside its card and 4 px clear of its tag; letters at least 11 px,
       badges at least 7 px in radius, π lines at least 6 px long;
     - the molecule on the board is the largest object in the picture (bigger than the real molecule and each form);
     - no rendered text under 11 px anywhere in the tool, Test yourself and "?" included;
     - "?" opened on a phone during a replay stops it on a settled form;
     - on a phone the cause line is at most two rows and keeps one height; no sideways scroll; no console errors;
     - on a first visit the cue is whole and covers no ball, name, picker or Undo.

     node scripts/tools-v2/resonance-sweep.mjs [widths, comma separated] [--shots dir]

   Needs Playwright and a Chromium (CHROME or /opt/pw-browsers/chromium-1243/chrome-linux64/chrome). It serves the
   repo itself on a free port and blocks service workers. Exit code 1 on any failure. Not part of CI; run it after any
   change to the tool's layout, labels or wording, one width per process for the full set (each width takes about a
   minute). */
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
const SPECIES = ['acetate-ion', 'formate', 'allyl-cation', 'allyl-anion', 'enolate', 'acetamide', 'nitromethane', 'carbonate', 'benzene', 'phenoxide', 'benzyl-cation', 'nitrate', 'ozone'];
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
async function open(o) {
  const ctx = await b.newContext({ viewport: { width: o.w, height: o.h }, serviceWorkers: 'block', deviceScaleFactor: 1, reducedMotion: o.motion ? 'no-preference' : 'reduce' });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.route(/supabase|umami|api\.levlprep|polar/, r => r.abort());
  if (!o.cue) await page.addInitScript(() => { try { localStorage.setItem('tk2c:ochem-res-push', '1'); } catch (e) {} });
  await page.goto(BASE + '/ochem/tools/resonance.html' + (o.q || ''), { waitUntil: 'load' });
  await page.waitForTimeout(600);
  return { page, errs };
}
const shot = (loc, name) => SHOTS ? loc.screenshot({ path: join(SHOTS, name) }) : null;
let checks = 0, states = 0; const fails = [];
const probe = () => {
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]') && getComputedStyle(e).opacity !== '0';
  const S = R(document.querySelector('.rs2-scene')), out = [];
  const inS = (x, name, tol = 0.6) => { if (x.l < S.l - tol || x.r > S.r + tol || x.t < S.t - tol || x.b > S.b + tol) out.push('clipped: ' + name); };
  const hit = (a, c, g = 0) => !(a.r + g <= c.l || c.r + g <= a.l || a.b + g <= c.t || c.b + g <= a.t);
  const q = s => [...document.querySelectorAll(s)].filter(vis);
  const mainBalls = q('.rs2-mainA .rs2-ball').map(R), hybBalls = q('.rs2-hyb .rs2-ball').map(R);
  mainBalls.concat(hybBalls).forEach(x => inS(x, 'a ball'));
  q('.rs2-mainA .rs2-e, .rs2-mainA .rs2-badge circle, .rs2-hyb .rs2-badge circle, .rs2-dq, .rs2-thumb').forEach(e => inS(R(e), e.getAttribute('class')));
  const labs = q('.rs2-lab').map(e => ({ t: e.textContent, r: R(e) }));
  labs.forEach(x => inS(x.r, 'name "' + x.t + '"'));
  for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) if (hit(labs[i].r, labs[j].r, 4)) out.push('names too close: "' + labs[i].t + '" and "' + labs[j].t + '"');
  const solid = q('.rs2-mainA .rs2-ball, .rs2-mainA .rs2-badge circle, .rs2-hyb .rs2-ball, .rs2-hyb .rs2-badge circle').map(R);
  const ctrls = q('.rs2-pick select, .rs2-undo').map(e => ({ n: e.className || 'picker', r: R(e) }));
  labs.forEach(x => { solid.forEach(c => { if (hit(x.r, c, 4)) out.push('name "' + x.t + '" on a ball or badge'); }); ctrls.forEach(c => { if (hit(x.r, c.r, 4)) out.push('name "' + x.t + '" on the ' + c.n); }); });
  ctrls.forEach(c => mainBalls.concat(hybBalls).forEach(x => { if (hit(c.r, x, 2)) out.push('a ball under the ' + c.n); }));
  // the hybrid's charge marks clear of its balls and of each other
  const dq = q('.rs2-dq').map(e => ({ t: e.textContent, r: R(e) }));
  dq.forEach((d, i) => { hybBalls.forEach(c => { if (hit(d.r, c, 1)) out.push('mark "' + d.t + '" on a ball'); }); dq.slice(i + 1).forEach(o => { if (hit(d.r, o.r, 2)) out.push('marks "' + d.t + '" touch'); }); labs.forEach(x => { if (hit(d.r, x.r, 2)) out.push('mark "' + d.t + '" on "' + x.t + '"'); }); });
  // badges and lone pairs on another atom's ball (main board)
  // (each sits against its own atom, the nearest ball; it must not touch any other)
  const balls = q('.rs2-mainA .rs2-ball').map(bl => { const c = R(bl); return { x: (c.l + c.r) / 2, y: (c.t + c.b) / 2, r: c.w / 2 }; });
  q('.rs2-mainA .rs2-badge circle, .rs2-mainA .rs2-e').forEach(e => { const r = R(e), ex = (r.l + r.r) / 2, ey = (r.t + r.b) / 2;
    const ds = balls.map(c => Math.hypot(ex - c.x, ey - c.y) - c.r).sort((a, c) => a - c);
    if (ds.length > 1 && ds[1] < r.w / 2 - 0.5) out.push('a ' + (e.closest('.rs2-badge') ? 'badge' : 'lone pair') + ' on another atom'); });
  // the forms row: every badge and letter inside its card and 4 px clear of its tag; letters, signs and π lines legible
  const cards = q('.rs2-thumb:not(.is-hid)').map(R), tags = q('.rs2-lab.is-tag').map(R);
  q('.rs2-strip .rs2-badge circle, .rs2-strip .rs2-fal').forEach(e => { const r = R(e), cx = (r.l + r.r) / 2, cy = (r.t + r.b) / 2;
    const what = e.tagName === 'circle' ? 'a form card badge' : 'form card letters "' + e.textContent + '"';
    const c = cards.find(k => cx >= k.l && cx <= k.r && cy >= k.t && cy <= k.b);
    if (!c) { out.push(what + ' outside every card'); return; }
    if (r.l < c.l - 0.5 || r.r > c.r + 0.5 || r.t < c.t - 0.5 || r.b > c.b + 0.5) out.push(what + ' crosses its card edge');
    tags.filter(t => t.l >= c.l - 1 && t.r <= c.r + 1).forEach(t => { if (hit(r, t, 4)) out.push(what + ' within 4 px of its tag'); });
    const fsz = e.tagName === 'circle' ? +e.getAttribute('r') : +e.getAttribute('font-size');
    if (e.tagName === 'circle' ? fsz < 6.9 : fsz < 10.9) out.push(what + ' too small (' + fsz + ')'); });
  q('.rs2-strip .rs2-fpi').forEach(e => { const L = Math.hypot(e.x2.baseVal.value - e.x1.baseVal.value, e.y2.baseVal.value - e.y1.baseVal.value); if (L < 6) out.push('a π line in the forms row is ' + L.toFixed(1) + ' px'); });
  // no rendered text under 11 px anywhere in the tool (picture, cause line, side panel, "?"): SVG text by its size on
  // screen, HTML text by its computed size
  const svgEl = document.querySelector('.rs2-svg'), vb = svgEl.viewBox.baseVal, k = vb && vb.width ? svgEl.getBoundingClientRect().width / vb.width : 1;
  [...document.querySelectorAll('.rs2-svg text')].filter(e => e.textContent.trim() && vis(e) && e.style.visibility !== 'hidden').forEach(e => {
    const px = parseFloat(e.getAttribute('font-size') || getComputedStyle(e).fontSize) * k; if (px < 10.95) out.push('text "' + e.textContent + '" at ' + px.toFixed(1) + ' px'); });
  const roots = [...document.querySelectorAll('.rs2, .rs2-dock, .rs2-ref')];
  roots.forEach(rt => { const w = document.createTreeWalker(rt, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const el = n.parentElement; if (!n.textContent.trim() || !el || el.closest('svg') || !vis(el) || el.closest('.tk2-sr')) continue;
    const r = el.getBoundingClientRect(); if (!r.width) continue; const px = parseFloat(getComputedStyle(el).fontSize); if (px < 10.95) out.push('text "' + n.textContent.trim().slice(0, 24) + '" at ' + px.toFixed(1) + ' px'); } });
  const uni = a => a.length ? { l: Math.min(...a.map(x => x.l)), t: Math.min(...a.map(x => x.t)), r: Math.max(...a.map(x => x.r)), b: Math.max(...a.map(x => x.b)) } : null;
  const area = u => u ? (u.r - u.l) * (u.b - u.t) : 0, M = uni(mainBalls), H = uni(hybBalls);
  const thumbs = q('.rs2-thumb').map(e => area(R(e)));
  const others = [area(H)].concat(thumbs);
  const cmp = document.querySelector('.rs2-scene').classList.contains('is-compare');
  if (!cmp) { if (!M) out.push('no molecule on the board'); else if (others.some(a => a >= area(M))) out.push('the board molecule is not the largest object'); }
  const cz = q('.tk2-cz'), rows = new Set(cz.map(e => Math.round(R(e).t))).size, cel = document.querySelector('.tk2-cause');
  if (innerWidth <= 640 && rows > 2 && !cmp) out.push('cause line is ' + rows + ' rows: ' + cel.innerText.replace(/\n/g, ' '));
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  return { out, causeH: cmp ? null : Math.round(R(cel).h), share: M ? area(M) / (S.w * S.h) : 0 };
};
for (const w of WIDTHS) {
  const h = w <= 430 ? 844 : w <= 820 ? 1024 : w >= 1920 ? 1080 : 900, tag = String(w).padStart(4, '0');
  // first visit: the cue
  {
    const c = await open({ w, h, cue: true });
    const r = await c.page.evaluate(() => { const R = e => e.getBoundingClientRect(), qq = document.querySelector('.tk2-cue'); if (!qq) return ['no cue shown'];
      const r = R(qq), S = R(document.querySelector('.rs2-scene')), out = [];
      if (r.left < S.left || r.right > S.right || r.top < S.top || r.bottom > S.bottom) out.push('the cue is clipped by the stage');
      [...document.querySelectorAll('.rs2-mainA .rs2-ball, .rs2-mainA .rs2-badge circle, .rs2-lab, .rs2-pick select, .rs2-undo')].filter(e => e.getClientRects().length && !e.closest('[hidden]')).forEach(e => { const x = R(e); if (!(r.right <= x.left || x.right <= r.left || r.bottom <= x.top || x.bottom <= r.top)) out.push('the cue covers ' + (e.textContent.trim() || e.getAttribute('class'))); });
      return out; });
    states++; checks += 2; r.forEach(m => fails.push(`${w} first visit: ${m}`));
    await shot(c.page.locator('.rs2-scene'), `${tag}-0-cue.png`);
    await c.page.context().close();
  }
  const { page, errs } = await open({ w, h });
  const heights = new Set(); let lo = 9;
  const check = async (what) => {
    const r = await page.evaluate(probe); states++; checks += 9;
    r.out.forEach(m => fails.push(`${w} ${what}: ${m}`));
    if (w <= 640 && r.causeH != null) heights.add(r.causeH);
    if (r.share) lo = Math.min(lo, r.share);
  };
  for (const id of SPECIES) {
    await page.locator('.rs2-pick select').selectOption(id); await page.waitForTimeout(120);
    const n = await page.locator('.rs2-tb').count();
    await check(`${id} form 1`);
    // the real molecule letters each ball as the board does (a ring CH may read C); a group too small to letter keeps
    // only its colour, never a bare atom (CH₃ as "C")
    { const m = await page.evaluate(() => { const L = s => [...document.querySelectorAll(s + ' .rs2-ball')].map(b => { const t = b.nextElementSibling && b.nextElementSibling.nextElementSibling; return t && t.tagName === 'text' ? t.textContent : ''; });
        const a = L('.rs2-mainA'), h = L('.rs2-hyb'); if (!h.length) return []; if (a.length !== h.length) return ['real molecule has ' + h.length + ' balls, board ' + a.length];
        return h.map((t, i) => (t && a[i] && t !== a[i] && !(a[i] === 'CH' && t === 'C')) ? 'real molecule letters "' + a[i] + '" as "' + t + '"' : null).filter(Boolean); });
      checks++; m.forEach(x => fails.push(`${w} ${id}: ${x}`)); }
    if (id === 'acetate-ion' || id === 'phenoxide') await shot(page.locator('.rs2'), `${tag}-1-${id}-1.png`);
    for (let i = 1; i < n; i++) {
      await page.locator(`.rs2-tb[data-i="${i}"]`).click(); await page.waitForTimeout(60);
      await check(`${id} form ${i + 1}`);
      if (id === 'benzyl-cation' && i === n - 1) await shot(page.locator('.rs2'), `${tag}-2-${id}-${i + 1}.png`);
    }
  }
  // a held push: one atom at ten electrons
  for (const id of ['acetate-ion', 'enolate', 'carbonate']) {
    await page.locator('.rs2-pick select').selectOption(id); await page.waitForTimeout(120);
    const ok = await page.evaluate(() => { const M = OchemResonanceModel, v = M.view, cur = v.S.cur, f = v.S.rk.filter(x => x.key !== M.key(cur))[0]; const ar = M.arrowsBetween(cur, f.st); return ar && ar.length > 1 ? ar[0] : null; });
    if (!ok) continue;
    const pts = await page.evaluate((ar) => { const v = OchemResonanceModel.view, A = v.A, r = document.querySelector('.rs2-svg').getBoundingClientRect(), k = r.width / v.L.W;
      const f = ar.from.startsWith('bond:') ? A.pis[ar.from] : A.lps[ar.from][0], t = ar.to.startsWith('bond:') ? (A.bonds[ar.to] || A.bonds['bond:' + ar.to.slice(5).split('-').reverse().join('-')]) : A.atoms[ar.to];
      const fx = f.mx != null ? f.mx : f.x, fy = f.my != null ? f.my : f.y, tx = t.mx != null ? t.mx : t.x, ty = t.my != null ? t.my : t.y;
      return [r.left + fx * k, r.top + fy * k, r.left + tx * k, r.top + ty * k]; }, ok);
    await page.mouse.move(pts[0], pts[1]); await page.mouse.down();
    for (let i = 1; i <= 8; i++) await page.mouse.move(pts[0] + (pts[2] - pts[0]) * i / 8, pts[1] + (pts[3] - pts[1]) * i / 8);
    await page.mouse.up(); await page.waitForTimeout(80);
    const held = await page.evaluate(() => !!OchemResonanceModel.view.S.pendingSt);
    checks++; if (!held) fails.push(`${w} ${id}: the first of two pushes was not held`);
    await check(`${id} held`);
    if (id === 'acetate-ion') await shot(page.locator('.rs2'), `${tag}-3-held.png`);
    await page.locator('.rs2-undo').click(); await page.waitForTimeout(60);
  }
  // Test yourself: Find every form (start, and finished by "Show me one I'm missing"), Which is more stabilized?
  await page.locator('.rs2-pick select').selectOption('phenoxide'); await page.waitForTimeout(100);
  await page.getByRole('button', { name: 'Test yourself' }).click(); await page.waitForTimeout(250);
  await page.locator('select.ls-pick-sel').selectOption('find'); await page.waitForTimeout(250);
  await check('find, start'); await shot(page.locator('.rs2-scene'), `${tag}-4-find.png`);
  await page.evaluate(() => { const v = OchemResonanceModel.view; v.reveal && v.reveal(); });
  for (let k = 0; k < 6; k++) await page.evaluate(() => OchemResonanceModel.view.reveal());
  await page.waitForTimeout(100);
  await check('find, done'); await shot(page.locator('.rs2-scene'), `${tag}-5-find-done.png`);
  await page.locator('select.ls-pick-sel').selectOption('compare'); await page.waitForTimeout(250);
  await check('compare, before the call');
  await page.locator('.rs2-dock [data-guess="a"]').first().click(); await page.waitForTimeout(150);
  await check('compare, after the call'); await shot(page.locator('.rs2-scene'), `${tag}-6-compare.png`);
  // leaving Explore in the middle of a two step replay: Test yourself starts clean, Explore comes back settled
  {
    const c = await open({ w, h, motion: true });
    await c.page.locator('.rs2-pick select').selectOption('phenoxide'); await c.page.waitForTimeout(300);
    const steps = await c.page.evaluate(() => { const M = OchemResonanceModel, v = M.view; return M.pathTo(v.S.cur, v.S.rk[4].st, v.S.rk.map(x => x.st)).length; });
    await c.page.locator('.rs2-tb[data-i="4"]').click(); await c.page.waitForTimeout(500);
    await c.page.getByRole('button', { name: 'Test yourself' }).click(); await c.page.waitForTimeout(150);
    await c.page.locator('select.ls-pick-sel').selectOption('find'); await c.page.waitForTimeout(2600);
    const r = await c.page.evaluate(() => { const M = OchemResonanceModel, v = M.view, S = v.S;
      return { count: document.querySelector('#rsFindCount').textContent, onStart: M.key(S.cur) === M.key(S.start), fly: document.querySelectorAll('.rs2-fly *').length,
        framedHidden: document.querySelectorAll('.rs2-thumb.is-on.is-hid').length, cause: document.querySelector('.tk2-cause').innerText.replace(/\n/g, ' ') }; });
    states++; checks += 5;
    if (steps < 2) fails.push(`${w} replay leave: phenoxide form 5 is not a multi step path`);
    if (!/^1 of 5/.test(r.count)) fails.push(`${w} replay leave: Find every form counts "${r.count}"`);
    if (!r.onStart || r.fly || r.framedHidden || /minor/.test(r.cause)) fails.push(`${w} replay leave: the replay ran into Test yourself (${JSON.stringify(r)})`);
    await c.page.getByRole('button', { name: 'Explore' }).click(); await c.page.waitForTimeout(800);
    const e = await c.page.evaluate(() => { const M = OchemResonanceModel, v = M.view, S = v.S; return { settled: S.rk.some(f => f.key === M.key(S.cur)), held: !!S.pendingSt, fly: document.querySelectorAll('.rs2-fly *').length }; });
    if (!e.settled || e.held || e.fly) fails.push(`${w} replay leave: Explore came back unsettled (${JSON.stringify(e)})`);
    const real = c.errs.filter(x => !/ERR_FAILED/.test(x)); if (real.length) fails.push(`${w} replay leave: console ${real.join('|')}`);
    await c.page.context().close();
  }
  // "?" opened on a phone (it covers the stage) during a replay: the replay stops on a settled form
  if (w <= 640) {
    const c = await open({ w, h, motion: true });
    await c.page.locator('.rs2-pick select').selectOption('phenoxide'); await c.page.waitForTimeout(300);
    await c.page.locator('.rs2-tb[data-i="4"]').click(); await c.page.waitForTimeout(400);
    await c.page.locator('.ls-bar button[aria-label*="elp"], .ls-bar .ls-help, .ls-bar button[title*="elp"]').first().click().catch(() => c.page.getByRole('button', { name: /help|reference/i }).first().click());
    await c.page.waitForTimeout(200);
    const r = await c.page.evaluate(() => new Promise(res => { let n = 0; const mo = new MutationObserver(m => { n += m.length; }); mo.observe(document.querySelector('.rs2-svg'), { subtree: true, attributes: true, childList: true });
      setTimeout(() => { mo.disconnect(); const M = OchemResonanceModel, S = M.view.S; res({ n, open: document.querySelector('.ls-root').classList.contains('is-sheet'), settled: S.rk.some(f => f.key === M.key(S.cur)), fly: document.querySelectorAll('.rs2-fly *').length }); }, 600); }));
    states++; checks += 3;
    if (!r.open) fails.push(`${w} "?" during a replay: the sheet did not open`);
    if (r.n > 2 || r.fly || !r.settled) fails.push(`${w} "?" during a replay: the replay carried on behind it (${JSON.stringify(r)})`);
    await c.page.context().close();
  }
  if (w <= 640) { checks++; if (heights.size !== 1) fails.push(`${w}: cause line height not constant: ${[...heights]}`); }
  const real = errs.filter(e => !/ERR_FAILED/.test(e)); checks++; if (real.length) fails.push(`${w}: console ${real.join('|')}`);
  console.log(`${w}: board molecule at least ${(lo * 100).toFixed(1)}% of the stage`);
  await page.context().close();
}
await b.close();
const uniq = [...new Set(fails)];
console.log(`states ${states}, checks ${checks}, failures ${uniq.length}`);
const kinds = {}; uniq.forEach(f => { const k = f.replace(/^\d+ [^:]*: /, '').replace(/".*?"/g, '""').replace(/[-\d.,]+/g, '#'); kinds[k] = (kinds[k] || 0) + 1; });
console.log(Object.entries(kinds).sort((a, c) => c[1] - a[1]).slice(0, 25).map(([k, n]) => n + ' x ' + k).join('\n'));
console.log(uniq.slice(0, 40).join('\n'));
server.close();
process.exit(uniq.length ? 1 : 0);
