/* Tools v2 layout sweep for the Organic Chemistry Arrow Pusher (docs/tools-v2-arrow-pusher-brief.md). At ten widths:
   every state of every Explore mechanism (reached by tapping its card, with reduced motion so each lands at once),
   the held push of each concerted step (dragged with a real mouse), the seven Draw each step challenges at their start,
   after a wrong check and solved (every answer arrow dragged, then Check), all eighteen Any molecule molecules and
   one step on one of them, Check yourself, leaving Explore in the middle of a two step replay (motion on: Test
   yourself must start clean and Explore come back settled), "?" opened on a phone during a replay, and a first visit
   with the cue. At each state it asserts:
     - nothing drawn or named is clipped by the stage (balls, lone pairs, charge badges, names, cards);
     - names sit at least 4 px clear of each other, of every ball and charge badge, of the picker and Undo;
     - charge badges and lone pairs do not sit on another atom's ball;
     - in the steps row every badge and letter is inside its card and 4 px clear of its tag; π lines at least 6 px;
     - the molecule on the board is the largest object in the picture (bigger than each card);
     - no rendered text under 11 px anywhere in the tool, Test yourself and "?" included;
     - names and the cause line wait (is-wait) while electrons are moving, and the words after a step name what is
       drawn (the species on the board);
     - on a phone the cause line is at most two rows and keeps one height; no sideways scroll; no console errors;
     - on a first visit the cue is whole and covers no ball, name, picker or Undo.

     node scripts/tools-v2/arrow-pusher-sweep.mjs [widths, comma separated] [--shots dir]

   Needs Playwright and a Chromium (CHROME or /opt/pw-browsers/chromium-1243/chrome-linux64/chrome). It serves the
   repo itself on a free port and blocks service workers. Exit code 1 on any failure. Not part of CI; run it after any
   change to the tool's layout, labels or wording, one width per process for the full set. */
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
async function open(o) {
  const ctx = await b.newContext({ viewport: { width: o.w, height: o.h }, serviceWorkers: 'block', deviceScaleFactor: 1, reducedMotion: o.motion ? 'no-preference' : 'reduce' });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.route(/supabase|umami|api\.levlprep|polar/, r => r.abort());
  if (!o.cue) await page.addInitScript(() => { try { localStorage.setItem('tk2c:ochem-ap-push', '1'); } catch (e) {} });
  await page.goto(BASE + '/ochem/tools/arrow-pusher.html' + (o.q || ''), { waitUntil: 'load' });
  await page.waitForTimeout(600);
  return { page, errs };
}
const shot = (loc, name) => SHOTS ? loc.screenshot({ path: join(SHOTS, name) }) : null;
let checks = 0, states = 0; const fails = [];
const probe = () => {
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]') && getComputedStyle(e).opacity !== '0';
  const S = R(document.querySelector('.ap2-scene')), out = [];
  const inS = (x, name, tol = 0.6) => { if (x.l < S.l - tol || x.r > S.r + tol || x.t < S.t - tol || x.b > S.b + tol) out.push('clipped: ' + name); };
  const hit = (a, c, g = 0) => !(a.r + g <= c.l || c.r + g <= a.l || a.b + g <= c.t || c.b + g <= a.t);
  const q = s => [...document.querySelectorAll(s)].filter(vis);
  const mainBalls = q('.rs2-mainA .rs2-ball').map(R);
  mainBalls.forEach(x => inS(x, 'a ball'));
  q('.rs2-mainA .rs2-e, .rs2-mainA .rs2-badge circle, .rs2-thumb').forEach(e => inS(R(e), e.getAttribute('class')));
  const labs = q('.rs2-lab').map(e => ({ t: e.textContent, r: R(e) }));
  labs.forEach(x => inS(x.r, 'name "' + x.t + '"'));
  for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) if (hit(labs[i].r, labs[j].r, 4)) out.push('names too close: "' + labs[i].t + '" and "' + labs[j].t + '"');
  const solid = q('.rs2-mainA .rs2-ball, .rs2-mainA .rs2-badge circle').map(R);
  const ctrls = q('.rs2-pick select, .rs2-undo').map(e => ({ n: e.className || 'picker', r: R(e) }));
  labs.forEach(x => { solid.forEach(c => { if (hit(x.r, c, 4)) out.push('name "' + x.t + '" on a ball or badge'); }); ctrls.forEach(c => { if (hit(x.r, c.r, 4)) out.push('name "' + x.t + '" on the ' + c.n); }); });
  ctrls.forEach(c => mainBalls.forEach(x => { if (hit(c.r, x, 2)) out.push('a ball under the ' + c.n); }));
  // badges and lone pairs on another atom's ball
  const balls = mainBalls.map(c => ({ x: (c.l + c.r) / 2, y: (c.t + c.b) / 2, r: c.w / 2 }));
  q('.rs2-mainA .rs2-badge circle, .rs2-mainA .rs2-e').forEach(e => { const r = R(e), ex = (r.l + r.r) / 2, ey = (r.t + r.b) / 2;
    const ds = balls.map(c => Math.hypot(ex - c.x, ey - c.y) - c.r).sort((a, c) => a - c);
    if (ds.length > 1 && ds[1] < r.w / 2 - 0.5) out.push('a ' + (e.closest('.rs2-badge') ? 'badge' : 'lone pair') + ' on another atom'); });
  // two balls on top of each other (pieces that moved must not land on one another)
  for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) if (Math.hypot(balls[i].x - balls[j].x, balls[i].y - balls[j].y) < (balls[i].r + balls[j].r) * 0.9) out.push('two balls overlap');
  // the steps row: every badge and letter inside its card and 4 px clear of its tag
  const cards = q('.rs2-thumb:not(.is-hid)').map(R), tags = q('.rs2-lab.is-tag').map(R);
  q('.rs2-strip .rs2-badge circle, .rs2-strip .rs2-fal').forEach(e => { const r = R(e), cx = (r.l + r.r) / 2, cy = (r.t + r.b) / 2;
    const what = e.tagName === 'circle' ? 'a card badge' : 'card letters "' + e.textContent + '"';
    const c = cards.find(k => cx >= k.l && cx <= k.r && cy >= k.t && cy <= k.b);
    if (!c) { out.push(what + ' outside every card'); return; }
    if (r.l < c.l - 0.5 || r.r > c.r + 0.5 || r.t < c.t - 0.5 || r.b > c.b + 0.5) out.push(what + ' crosses its card edge');
    tags.filter(t => t.l >= c.l - 1 && t.r <= c.r + 1).forEach(t => { if (hit(r, t, 4)) out.push(what + ' within 4 px of its tag'); }); });
  q('.rs2-strip .rs2-fpi').forEach(e => { const L = Math.hypot(e.x2.baseVal.value - e.x1.baseVal.value, e.y2.baseVal.value - e.y1.baseVal.value); if (L < 6) out.push('a π line in the row is ' + L.toFixed(1) + ' px'); });
  // no rendered text under 11 px anywhere in the tool
  const svgEl = document.querySelector('.ap2-svg'), vb = svgEl.viewBox.baseVal, k = vb && vb.width ? svgEl.getBoundingClientRect().width / vb.width : 1;
  [...document.querySelectorAll('.ap2-svg text')].filter(e => e.textContent.trim() && vis(e) && e.style.visibility !== 'hidden').forEach(e => {
    const px = parseFloat(e.getAttribute('font-size') || getComputedStyle(e).fontSize) * k; if (px < 10.95) out.push('text "' + e.textContent + '" at ' + px.toFixed(1) + ' px'); });
  [...document.querySelectorAll('.ap2, .ap2-dock, .ap2-ref, .ls-dock')].forEach(rt => { const w = document.createTreeWalker(rt, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const el = n.parentElement; if (!n.textContent.trim() || !el || el.closest('svg') || !vis(el) || el.closest('.tk2-sr')) continue;
    const r = el.getBoundingClientRect(); if (!r.width) continue; const px = parseFloat(getComputedStyle(el).fontSize); if (px < 10.95) out.push('text "' + n.textContent.trim().slice(0, 24) + '" at ' + px.toFixed(1) + ' px'); } });
  const uni = a => a.length ? { l: Math.min(...a.map(x => x.l)), t: Math.min(...a.map(x => x.t)), r: Math.max(...a.map(x => x.r)), b: Math.max(...a.map(x => x.b)) } : null;
  const area = u => u ? (u.r - u.l) * (u.b - u.t) : 0, M = uni(mainBalls);
  const thumbs = q('.rs2-thumb').map(e => area(R(e)));
  if (!M) out.push('no molecule on the board'); else if (thumbs.some(a => a >= area(M))) out.push('the board molecule is not the largest object');
  const cz = q('.tk2-cz'), rows = new Set(cz.map(e => Math.round(R(e).t))).size, cel = document.querySelector('.tk2-cause');
  if (innerWidth <= 640 && rows > 2) out.push('cause line is ' + rows + ' rows: ' + cel.innerText.replace(/\n/g, ' '));
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  // the words name what is drawn: every species named on the board is one of the board's species
  const v = window.OchemArrowModel.view, st = v.S.pendingSt || v.S.cur, sp = window.OchemArrowModel.speciesOf(st);
  q('.rs2-lab.is-sp').forEach(e => { if (sp.indexOf(e.textContent) < 0) out.push('name "' + e.textContent + '" is not a species on the board'); });
  if (q('.rs2-labs.is-wait, .tk2-cause.is-wait').length) out.push('names or cause line still waiting after the change');
  return { out, causeH: Math.round(R(cel).h), share: M ? area(M) / (S.w * S.h) : 0 };
};
// drag one arrow with a real mouse, from its source to its target, as drawn now
async function pushArrow(page, ar) {
  await page.evaluate(() => { const r = document.querySelector('.ap2-scene').getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) document.querySelector('.ap2-scene').scrollIntoView({ block: 'center' }); });
  const pts = await page.evaluate((ar) => {
    const v = window.OchemArrowModel.view, A = v.A, r = document.querySelector('.ap2-svg').getBoundingClientRect(), k = r.width / v.L.W;
    const rev = s => 'bond:' + s.slice(5).split('-').reverse().join('-');
    let f;
    if (ar.from.startsWith('bond:')) { const st = v.S.cur, bk = ar.from.slice(5).split('-'), bd = st.bonds.find(x => (x.a === bk[0] && x.b === bk[1]) || (x.a === bk[1] && x.b === bk[0]));
      const key = 'bond:' + bd.a + '-' + bd.b; f = bd.order > 1 ? A.pis[key] : A.bonds[key]; f = { x: f.mx, y: f.my }; }
    else f = A.lps[ar.from][0];
    let t = ar.to.startsWith('bond:') ? (A.bonds[ar.to] || A.bonds[rev(ar.to)]) : A.atoms[ar.to];
    t = { x: t.mx != null ? t.mx : t.x, y: t.my != null ? t.my : t.y };
    return [r.left + f.x * k, r.top + f.y * k, r.left + t.x * k, r.top + t.y * k];
  }, ar);
  await page.mouse.move(pts[0], pts[1]); await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(pts[0] + (pts[2] - pts[0]) * i / 8, pts[1] + (pts[3] - pts[1]) * i / 8);
  await page.mouse.up(); await page.waitForTimeout(90);
}
// Check, or a failure when the arrows pushed did not register (the button stays off)
async function checkStep(page, what) {
  const on = await page.evaluate(() => { const b = document.querySelector('.ap2-check'); return b && !b.disabled && !b.hidden; });
  if (!on) { fails.push(what + ': the pushed arrows did not register (Check is off)'); return false; }
  await page.locator('.ap2-check').click(); return true;
}
const part = async (page, v) => { await page.locator('select.ls-pick-sel').selectOption(v); await page.waitForTimeout(220); };
for (const w of WIDTHS) {
  const h = w <= 430 ? 844 : w <= 820 ? 1024 : w >= 1920 ? 1080 : 900, tag = String(w).padStart(4, '0');
  // first visit: the cue
  {
    const c = await open({ w, h, cue: true });
    const r = await c.page.evaluate(() => { const R = e => e.getBoundingClientRect(), qq = document.querySelector('.tk2-cue'); if (!qq) return ['no cue shown'];
      const r = R(qq), S = R(document.querySelector('.ap2-scene')), out = [];
      if (r.left < S.left || r.right > S.right || r.top < S.top || r.bottom > S.bottom) out.push('the cue is clipped by the stage');
      [...document.querySelectorAll('.rs2-mainA .rs2-ball, .rs2-mainA .rs2-badge circle, .rs2-lab, .rs2-pick select, .rs2-undo')].filter(e => e.getClientRects().length && !e.closest('[hidden]') && !e.hidden).forEach(e => { const x = R(e); if (!(r.right <= x.left || x.right <= r.left || r.bottom <= x.top || x.bottom <= r.top)) out.push('the cue covers ' + (e.textContent.trim() || e.getAttribute('class'))); });
      return out; });
    states++; checks += 2; r.forEach(m => fails.push(`${w} first visit: ${m}`));
    await shot(c.page.locator('.ap2-scene'), `${tag}-0-cue.png`);
    await c.page.context().close();
  }
  const { page, errs } = await open({ w, h });
  const heights = new Set(); let lo = 9;
  const check = async (what) => {
    const r = await page.evaluate(probe); states++; checks += 12;
    r.out.forEach(m => fails.push(`${w} ${what}: ${m}`));
    if (w <= 640) heights.add(r.causeH);
    if (r.share) lo = Math.min(lo, r.share);
  };
  const MECHS = await page.evaluate(() => window.OchemArrowModel.MECHS.map(m => ({ id: m.id, steps: m.steps })));
  for (const m of MECHS) {
    await page.locator('.rs2-pick select').selectOption(m.id); await page.waitForTimeout(120);
    await check(`${m.id} start`);
    const n = await page.locator('.rs2-tb').count();
    for (let i = 1; i < n; i++) {
      await page.locator(`.rs2-tb[data-i="${i}"]`).click(); await page.waitForTimeout(80);
      await check(`${m.id} state ${i}`);
      if (i === n - 1) await shot(page.locator('.ap2'), `${tag}-1-${m.id}-${i}.png`);
    }
    // the held push of each step with two arrows: the first arrow alone, then the second completes it
    for (let s = 0; s < m.steps.length; s++) {
      if (m.steps[s].length < 2) continue;
      await page.locator(`.rs2-tb[data-i="${s}"]`).click(); await page.waitForTimeout(80);
      await pushArrow(page, { from: m.steps[s][0][0], to: m.steps[s][0][1] });
      const held = await page.evaluate(() => !!window.OchemArrowModel.view.S.pendingSt);
      checks++; if (!held) fails.push(`${w} ${m.id} step ${s + 1}: the first of two pushes was not held`);
      await check(`${m.id} step ${s + 1} held`);
      if (s === 0 && m.id === 'sn2-bromoethane') await shot(page.locator('.ap2'), `${tag}-2-held.png`);
      await pushArrow(page, { from: m.steps[s][1][0], to: m.steps[s][1][1] });
      const on = await page.evaluate((s) => { const v = window.OchemArrowModel.view; return !v.S.pendingSt && window.OchemArrowModel.sameStructure(v.S.cur, v.S.row[s + 1].st); }, s);
      checks++; if (!on) fails.push(`${w} ${m.id} step ${s + 1}: the two pushes did not make the next state`);
      await check(`${m.id} step ${s + 1} pushed`);
    }
  }
  // a push that cannot happen springs back: a carbon with no lone pair dragged onto a hydrogen
  await page.locator('.rs2-pick select').selectOption('sn2-bromoethane'); await page.waitForTimeout(120);
  {
    const p = await page.evaluate(() => { const v = window.OchemArrowModel.view, A = v.A, r = document.querySelector('.ap2-svg').getBoundingClientRect(), k = r.width / v.L.W; return [r.left + A.atoms.c2.x * k, r.top + A.atoms.c2.y * k, r.left + A.atoms.nucO.x * k, r.top + A.atoms.nucO.y * k]; });
    await page.mouse.click(p[0], p[1]); await page.waitForTimeout(60);
    const t = await page.evaluate(() => document.querySelector('.tk2-cause').innerText);
    checks++; if (!/no lone pair/.test(t)) fails.push(`${w} a carbon tapped: the cause line says "${t}"`);
  }
  // Test yourself 1: Draw each step
  await page.getByRole('button', { name: 'Test yourself' }).click(); await page.waitForTimeout(250);
  await part(page, 'chal');
  const CH = await page.evaluate(() => window.OchemArrowChallenge.CHALLENGES.map(c => ({ id: c.id, steps: c.steps })));
  for (const c of CH) {
    await page.locator('.rs2-pick select').selectOption(c.id); await page.waitForTimeout(150);
    await check(`challenge ${c.id} start`);
    // a wrong check: the second arrow alone (or for a one arrow step, an arrow from the wrong source)
    const wrong = c.steps[0].length > 1 ? c.steps[0][1] : null;
    if (wrong) { await pushArrow(page, { from: wrong[0], to: wrong[1] }); await checkStep(page, `${w} challenge ${c.id} wrong`); await page.waitForTimeout(120);
      const say = await page.evaluate(() => document.querySelector('#apChalSay').innerText);
      checks++; if (!/Not this step yet/.test(say)) fails.push(`${w} challenge ${c.id}: a wrong check said "${say.slice(0, 60)}"`);
      await check(`challenge ${c.id} wrong`);
      if (c.id === 'sn2') await shot(page.locator('.ls-root'), `${tag}-3-chal-wrong.png`);
      if (await page.locator('.rs2-undo').isEnabled()) await page.locator('.rs2-undo').click(); await page.waitForTimeout(80); }
    for (let s = 0; s < c.steps.length; s++) {
      for (const a of c.steps[s]) await pushArrow(page, { from: a[0], to: a[1] });
      if (!(await checkStep(page, `${w} challenge ${c.id} step ${s + 1}`))) break;
      await page.waitForTimeout(150);
      await check(`challenge ${c.id} step ${s + 1} checked`);
    }
    const solved = await page.evaluate(() => !!document.querySelector('.ls-donew:not([hidden])'));
    checks++; if (!solved) fails.push(`${w} challenge ${c.id}: the right arrows did not solve it`);
    if (c.id === 'acyl') await shot(page.locator('.ls-root'), `${tag}-4-chal-solved.png`);
  }
  // Test yourself 2: Any molecule, every molecule at its start, and one step
  await part(page, 'any');
  const ANY = await page.evaluate(() => window.OchemArrowModel.GROUPS.reduce((a, g) => a.concat(g.picks.map(p => p.id)), []));
  for (const id of ANY) { await page.locator('.rs2-pick select').selectOption(id); await page.waitForTimeout(100); await check(`any ${id}`); }
  await page.locator('.rs2-pick select').selectOption('acetic-acid'); await page.waitForTimeout(100);
  await pushArrow(page, { from: 'bond:o2-h', to: 'o2' });
  checks++; if (!(await page.evaluate(() => window.OchemArrowModel.view.S.hist.length === 1))) fails.push(`${w} any: breaking the O–H bond was not a step`);
  await check('any acetic acid, one step'); await shot(page.locator('.ls-root'), `${tag}-5-any.png`);
  // Test yourself 3: Check yourself
  await part(page, 'check');
  await check('check yourself');
  // "?" (the reference) with the formal charge table
  await page.getByRole('button', { name: 'Explore' }).click(); await page.waitForTimeout(200);
  const real0 = errs.filter(x => !/ERR_FAILED/.test(x)); checks++; if (real0.length) fails.push(`${w}: console ${real0.join('|')}`);
  if (w <= 640) { checks++; if (heights.size !== 1) fails.push(`${w}: cause line height not constant: ${[...heights]}`); }
  console.log(`${w}: board molecule at least ${(lo * 100).toFixed(1)}% of the stage`);
  await page.context().close();
  // leaving Explore in the middle of a two step replay: Test yourself starts clean, Explore comes back settled; and
  // while it moves, the names and the cause line wait
  {
    const c = await open({ w, h, motion: true });
    await c.page.locator('.rs2-pick select').selectOption('acetyl-chloride-nu'); await c.page.waitForTimeout(300);
    await c.page.locator('.rs2-tb[data-i="2"]').click(); await c.page.waitForTimeout(450);
    const mid = await c.page.evaluate(() => ({ wait: !!document.querySelector('.tk2-cause.is-wait') && !!document.querySelector('.rs2-labs.is-wait'), fly: document.querySelectorAll('.rs2-fly *').length }));
    states++; checks += 2;
    if (!mid.wait) fails.push(`${w} replay: the words did not wait while electrons moved`);
    if (!mid.fly) fails.push(`${w} replay: nothing was moving 450 ms in`);
    // while the pieces slide (after the electrons, about 1.3 s in) the words still wait
    await c.page.waitForTimeout(850);
    const glide = await c.page.evaluate(() => ({ wait: !!document.querySelector('.tk2-cause.is-wait') && !!document.querySelector('.rs2-labs.is-wait'), moving: document.querySelectorAll('.rs2-mainA [data-p][transform]').length }));
    checks++; if (glide.moving && !glide.wait) fails.push(`${w} replay: the words did not wait while the pieces slid`);
    await c.page.getByRole('button', { name: 'Test yourself' }).click(); await c.page.waitForTimeout(2600);
    const r = await c.page.evaluate(() => { const v = window.OchemArrowModel.view, S = v.S; return { ctx: S.ctx, fly: document.querySelectorAll('.rs2-fly *').length, arrows: document.querySelectorAll('.rs2-arrows .is-run').length, onStart: window.OchemArrowModel.sameStructure(S.cur, S.start) }; });
    states++; checks += 3;
    if (r.fly || r.arrows || !r.onStart) fails.push(`${w} replay leave: the replay ran into Test yourself (${JSON.stringify(r)})`);
    await c.page.getByRole('button', { name: 'Explore' }).click(); await c.page.waitForTimeout(800);
    const e = await c.page.evaluate(() => { const v = window.OchemArrowModel.view, S = v.S; return { settled: S.row.some(x => window.OchemArrowModel.sameStructure(x.st, S.cur)), held: !!S.pendingSt, fly: document.querySelectorAll('.rs2-fly *').length, wait: !!document.querySelector('.tk2-cause.is-wait') }; });
    if (!e.settled || e.held || e.fly || e.wait) fails.push(`${w} replay leave: Explore came back unsettled (${JSON.stringify(e)})`);
    const real = c.errs.filter(x => !/ERR_FAILED/.test(x)); if (real.length) fails.push(`${w} replay leave: console ${real.join('|')}`);
    await c.page.context().close();
  }
  // "?" opened on a phone (it covers the stage) during a replay: the replay stops on a settled state
  if (w <= 640) {
    const c = await open({ w, h, motion: true });
    await c.page.locator('.rs2-pick select').selectOption('acetyl-chloride-nu'); await c.page.waitForTimeout(300);
    await c.page.locator('.rs2-tb[data-i="2"]').click(); await c.page.waitForTimeout(400);
    await c.page.locator('.ls-bar button[aria-label*="elp"], .ls-bar .ls-help, .ls-bar button[title*="elp"]').first().click().catch(() => c.page.getByRole('button', { name: /help|reference/i }).first().click());
    await c.page.waitForTimeout(200);
    const r = await c.page.evaluate(() => new Promise(res => { let n = 0; const mo = new MutationObserver(m => { n += m.length; }); mo.observe(document.querySelector('.ap2-svg'), { subtree: true, attributes: true, childList: true });
      setTimeout(() => { mo.disconnect(); const v = window.OchemArrowModel.view, S = v.S; res({ n, open: document.querySelector('.ls-root').classList.contains('is-sheet'), settled: S.row.some(x => window.OchemArrowModel.sameStructure(x.st, S.cur)), fly: document.querySelectorAll('.rs2-fly *').length }); }, 600); }));
    states++; checks += 3;
    if (!r.open) fails.push(`${w} "?" during a replay: the sheet did not open`);
    if (r.n > 2 || r.fly || !r.settled) fails.push(`${w} "?" during a replay: the replay carried on behind it (${JSON.stringify(r)})`);
    await c.page.context().close();
  }
}
await b.close();
const uniq = [...new Set(fails)];
console.log(`states ${states}, checks ${checks}, failures ${uniq.length}`);
const kinds = {}; uniq.forEach(f => { const k = f.replace(/^\d+ [^:]*: /, '').replace(/".*?"/g, '""').replace(/[-\d.,]+/g, '#'); kinds[k] = (kinds[k] || 0) + 1; });
console.log(Object.entries(kinds).sort((a, c) => c[1] - a[1]).slice(0, 25).map(([k, n]) => n + ' x ' + k).join('\n'));
console.log(uniq.slice(0, 60).join('\n'));
server.close();
process.exit(uniq.length ? 1 : 0);
