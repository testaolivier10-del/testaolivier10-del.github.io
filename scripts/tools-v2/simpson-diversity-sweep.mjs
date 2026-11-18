#!/usr/bin/env node
/* Tools v2 sweep: AP Biology, Simpson's diversity index (docs/tools-v2-builder-brief.md, step 5; the first sweep
   in this folder: copy its pattern for the next tool).
   Every landmark state of Explore, and the Build challenges view, at widths 360 to 1920, light and dark:
     - no sideways scroll; nothing clipped by the stage (trees, gauge, tray, chips, cue, cause line);
     - no overlap of labels and things (gauge and trees, trees and tray, cue and gauge or tray, chips, pills);
     - the plot (the thing acted on) is the largest thing; trees and chips are at least 44 px to tap;
     - phones (640 px and under): the cause line is at most two rows and its height never changes;
   and, frame by frame at 390 and 1440: the words (tray counts, D, the cause line) always match the trees drawn.
   Also (review round 1): a tap or click on every bare patch you can see plants exactly there, with a mouse and with
   real touch; a tap on a tree you can see changes that tree; no bare place is hidden behind a crown; the first visit
   cue covers no tree; an empty plot says "No trees" with no arrow.
   Usage: node scripts/tools-v2/simpson-diversity-sweep.mjs [--width <w>] [--shots <dir>] [--port <n>]
   (one width per process keeps each run short; with no --width all ten widths run, then the frame checks)
   Needs playwright (PW_ROOT names a folder whose node_modules has it) and Chromium (CHROMIUM_PATH). */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, mkdirSync } from 'node:fs';
import { dirname, extname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
let PORT = +arg('--port', 0); const SHOTS = arg('--shots', null);
let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) {
  try { ({ chromium } = createRequire((process.env.PW_ROOT || '/home/claude/testaolivier10-del.github.io') + '/')('playwright')); }
  catch (e2) { console.error('This sweep needs playwright (set PW_ROOT).'); process.exit(0); }
}
const EXE = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome') ? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' : undefined);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const file = resolve(ROOT, '.' + p);
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }); createReadStream(file).pipe(res);
});
await new Promise(ok => server.listen(PORT, ok));
PORT = server.address().port;
const URL0 = `http://localhost:${PORT}/bio/tools/simpson-diversity.html`;
const ALL = [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920], ONE = arg('--width', null);
const WIDTHS = ONE ? [+ONE] : ALL;
/* The landmark states: trees of [oak, pine, birch, maple, cherry]. */
const STATES = [
  { id: 'opening', counts: [16, 4, 4, 0, 0], cause: /^3 species\+mostly oak→pick 2: 50% different species→D = 0\.50$/ },
  { id: 'one-species', counts: [24, 0, 0, 0, 0], cause: /^1 species→any 2 trees match→D = 0$/ },
  { id: 'two-even', counts: [12, 12, 0, 0, 0], cause: /^2 species\+evenly spread→.*50% different species→D = 0\.50$/ },
  { id: 'five-even-full', counts: [8, 7, 7, 7, 7], cause: /^5 species\+evenly spread→.*80% different species→D = 0\.80$/ },
  { id: 'five-dominated', counts: [1, 1, 1, 1, 32], cause: /^5 species\+mostly cherry→.*21% different species→D = 0\.21$/ },
  { id: 'five-uneven', counts: [9, 9, 3, 2, 1], cause: /^5 species\+uneven→/ },
  { id: 'one-tree', counts: [0, 0, 0, 1, 0], cause: /^1 species→/ },
  { id: 'empty', counts: [0, 0, 0, 0, 0], cause: /^No trees→nothing to measure$/ },
];
let pass = 0; const fails = [];
const ok = (c, msg) => { if (c) pass++; else fails.push(msg); };

async function open(w, dark, opts = {}) {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : w < 1100 ? 1024 : 900 }, serviceWorkers: 'block', hasTouch: opts.touch != null ? opts.touch : w < 500, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  if (dark) await page.addInitScript(() => { try { localStorage.setItem('nremt_theme', 'dark'); } catch (e) {} });
  if (opts.noCue) await page.addInitScript(() => { try { localStorage.setItem('tk2c:apbio-simpson', '1'); } catch (e) {} });
  await page.goto(URL0 + (opts.hash || '')); await page.waitForSelector('.sd2-svg', { timeout: 15000 }); await page.waitForTimeout(600);
  return { browser, page, errs };
}
/* Wait for something on the page (the page's CSP forbids waitForFunction's eval). */
async function until(page, fn, a) { for (let i = 0; i < 100; i++) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(80); } return false; }
/* Bring the plot to the counts, through the tool's own buttons (the tray, then each place). */
async function setCounts(page, counts) {
  await page.evaluate((counts) => {
    const spots = [...document.querySelectorAll('.sd2-spot')].map(g => { const t = g.querySelector('.sd2-tree'); return t ? +t.dataset.sp : -1; });
    const left = counts.slice(), want = spots.map(k => { if (k > -1 && left[k] > 0) { left[k]--; return k; } return null; });
    left.forEach((n, k) => { for (let i = 0; i < want.length && n > 0; i++) if (want[i] === null) { want[i] = k; n--; } });
    const btn = [...document.querySelectorAll('.sd2-spotb')];
    [0, 1, 2, 3, 4, -1].forEach(k => { const todo = want.map((v, i) => (v === null ? -1 : v) === k && spots[i] !== k ? i : -1).filter(i => i > -1); if (!todo.length) return; document.querySelector(`.sd2-chip[data-k="${k}"]`).click(); todo.forEach(i => btn[i].click()); });
  }, counts);
  await until(page, (want) => [...document.querySelectorAll('.sd2-chip-c')].map(e => e.textContent).join() === want && !document.querySelector('.sd2-tree.is-out, .sd2-tree.is-cut'), counts.join());
  await until(page, () => !document.getAnimations().some(a => a.playState === 'running' && a.effect && a.effect.target && a.effect.target.closest('.sd2-plot')));   // the last tree has grown in
  await page.waitForTimeout(120);
}
const geo = (page) => page.evaluate(() => {
  const R = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const q = (s) => document.querySelector(s), qa = (s) => [...document.querySelectorAll(s)];
  const cause = q('.tk2-cause'), stage = q('.sd2');
  return { sw: document.documentElement.scrollWidth, iw: innerWidth, scene: R(q('.sd2-scene')), stage: R(stage), gauge: R(q('.sd2-gauge')), tray: R(q('.sd2-tray')),
    trees: qa('.sd2-tree').map(R), soils: qa('.sd2-soil').map(R), chips: qa('.sd2-chip').map(e => ({ ...R(e), over: e.scrollWidth > e.clientWidth + 1 })),
    chipText: qa('.sd2-chip-n, .sd2-chip-c').map(e => ({ ...R(e), p: R(e.closest('.sd2-chip')) })), cue: q('.tk2-cue') ? R(q('.tk2-cue')) : null,
    gaugeKids: qa('.sd2-g-k, .sd2-g-v, .sd2-g-row, .sd2-g-maxl:not([hidden])').map(R), maxl: q('.sd2-g-maxl').hidden ? null : (() => { const r = document.createRange(); r.selectNodeContents(q('.sd2-g-maxl')); return R(r); })(),
    cause: cause.hidden ? null : { ...R(cause), text: cause.textContent, rows: [...new Set(qa('.tk2-cause .tk2-cz').map(e => Math.round(e.getBoundingClientRect().top)))].length, pills: qa('.tk2-cause .tk2-cz').map(R), take: cause.classList.contains('is-take') },
    cueOnTrees: (() => { const c = q('.tk2-cue'); if (!c) return 0; const r = c.getBoundingClientRect(); c.style.visibility = 'hidden'; let n = 0; for (let x = 0; x <= 6; x++) for (let y = 0; y <= 3; y++) { const e = document.elementFromPoint(r.left + 2 + (r.width - 4) * x / 6, r.top + 2 + (r.height - 4) * y / 3); if (e && e.closest('.sd2-tree')) n++; } c.style.visibility = ''; return n; })(),
    hiddenSoil: qa('.sd2-spot').filter(g => { const s = g.querySelector('.sd2-soil'); if (!s) return false; const r = s.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !e || e.closest('.sd2-spot') !== g; }).map(g => g.dataset.i),
    gaugeText: q('.sd2-g-v').textContent,
    lines: R(q('.sd2-lines')), acts: qa('.sd2-acts button:not([hidden])').map(R), head: q('.tk2-head').hidden ? null : R(q('.tk2-head')),
    n: +stage.dataset.n, s: +stage.dataset.s, d: stage.dataset.d, chipCounts: qa('.sd2-chip-c').map(e => +e.textContent), view: stage.dataset.view };
});
const hit = (a, b, pad = 0) => a.l < b.r - pad && a.r > b.l + pad && a.t < b.b - pad && a.b > b.t + pad;
function check(g, tag, st) {
  const T = (c, m) => ok(c, `${tag}: ${m}`);
  T(g.sw <= g.iw + 1, `sideways scroll (${g.sw} > ${g.iw})`);
  T(g.trees.every(t => t.l >= g.scene.l - 1 && t.r <= g.scene.r + 1 && t.t >= g.scene.t - 1), 'a tree is clipped by the stage');
  T(g.trees.every(t => t.b <= g.tray.t + 1), 'a tree runs under the tray');
  T(g.soils.every(t => t.b <= g.tray.t + 1 && t.l >= g.scene.l && t.r <= g.scene.r), 'bare soil is clipped or under the tray');
  T(!g.trees.some(t => hit(t, g.gauge, 1)), 'a tree overlaps the D gauge');
  T(g.gauge.l >= g.scene.l && g.gauge.r <= g.scene.r && g.gauge.t >= g.scene.t, 'the gauge is clipped');
  T(g.gaugeKids.every(k => k.l >= g.gauge.l - 1 && k.r <= g.gauge.r + 1 && k.b <= g.gauge.b + 1), 'a gauge label is clipped');
  if (g.maxl) T(g.maxl.l >= g.gauge.l + 2 && g.maxl.r <= g.gauge.r - 2, `the "species max" label leaves the gauge (${Math.round(g.maxl.l - g.gauge.l)}, ${Math.round(g.gauge.r - g.maxl.r)})`);
  T(g.chips.every(c => c.l >= g.tray.l - 1 && c.r <= g.tray.r + 1 && c.t >= g.tray.t - 6 && c.b <= g.tray.b + 1), 'a chip leaves the tray');
  T(g.chips.every(c => !c.over), 'a chip clips its text');
  T(g.chipText.every(c => c.l >= c.p.l - 0.5 && c.r <= c.p.r + 0.5), 'chip text leaves its chip');
  T(g.chips.every((c, i) => g.chips.every((d, j) => i === j || !hit(c, d, 0.5))), 'chips overlap');
  T(g.chips.every(c => c.w >= 44 && c.h >= 44), `a chip is under 44 px (${Math.round(Math.min(...g.chips.map(c => c.w)))} x ${Math.round(Math.min(...g.chips.map(c => c.h)))})`);
  T(g.trees.every(t => t.h >= 44), 'a tree is under 44 px tall');
  if (g.cue) { T(g.cue.l >= g.scene.l && g.cue.r <= g.scene.r, 'the cue is clipped'); T(!hit(g.cue, g.gauge) && !hit(g.cue, g.tray), 'the cue covers the gauge or the tray'); T(g.cueOnTrees === 0, `the cue covers a tree (${g.cueOnTrees} points)`); }
  T(!g.hiddenSoil.length, `bare places hidden behind trees: ${g.hiddenSoil.join()}`);
  if (g.n === 0) T(g.gaugeText.trim() === 'No trees', `the empty gauge reads "${g.gaugeText}"`);
  // the plot is the largest thing on the stage
  const others = Math.max(g.lines.h, g.head ? g.head.h : 0);
  T(g.scene.w >= g.stage.w - 2 && g.scene.h >= 2.5 * others && g.scene.h >= 0.6 * (g.stage.h || 1), `the plot is not the largest thing (${Math.round(g.scene.h)} of ${Math.round(g.stage.h)})`);
  if (g.cause) {
    T(g.cause.pills.every(p => p.l >= g.lines.l - 1 && p.r <= g.lines.r + 1), 'a cause pill is clipped');
    T(g.cause.pills.every((p, i) => g.cause.pills.every((r, j) => i === j || !hit(p, r, 0.5))), 'cause pills overlap');
    T(!g.acts.some(a => g.cause.pills.some(p => hit(a, p))), 'a button overlaps the cause line');
    if (g.iw <= 640) T(g.cause.rows <= 2, `the cause line takes ${g.cause.rows} rows`);
    if (st && st.cause && !g.cause.take) T(st.cause.test(g.cause.text), `cause line reads "${g.cause.text}"`);
  }
  if (st) { T(g.n === st.counts.reduce((a, b) => a + b, 0), `N is ${g.n}`); T(g.chipCounts.join() === st.counts.join(), `tray counts ${g.chipCounts.join()}`); }
}

for (const dark of [false, true]) for (const w of WIDTHS) {
  const { browser, page, errs } = await open(w, dark);
  const tag0 = `${w}${dark ? ' dark' : ''}`, heights = [];
  check(await geo(page), `${tag0} first visit (cue)`, STATES[0]);
  ok(!!(await geo(page)).cue, `${tag0}: the first visit shows the cue`);
  if (SHOTS && !dark) { mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: join(SHOTS, `sweep-opening-${w}.png`) }); }
  for (const st of STATES) {
    await setCounts(page, st.counts);
    const g = await geo(page); check(g, `${tag0} ${st.id}`, st); heights.push([st.id, g.cause.h]);
    if (SHOTS && (w === 360 || w === 820 || w === 1920) && (!dark || st.id === 'five-even-full')) await page.screenshot({ path: join(SHOTS, `sweep-${st.id}-${w}${dark ? '-dark' : ''}.png`) });
  }
  // Even it out from the opening: the takeaway
  await page.click('.sd2-reset'); await until(page, () => [...document.querySelectorAll('.sd2-chip-c')].map(e => e.textContent).join() === '16,4,4,0,0'); await page.waitForTimeout(500);
  await page.click('.sd2-even'); await until(page, () => document.querySelector('.tk2-cause').classList.contains('is-take')); await page.waitForTimeout(450);
  { const g = await geo(page); check(g, `${tag0} takeaway`, null); ok(g.cause.take && /D rose from 0\.50 to 0\.67/.test(g.cause.text), `${tag0}: takeaway reads "${g.cause.text}"`); heights.push(['takeaway', g.cause.h]); }
  if (w <= 640) ok(new Set(heights.map(h => Math.round(h[1]))).size === 1, `${tag0}: the cause line changes height: ${heights.map(h => h[0] + ' ' + Math.round(h[1])).join(', ')}`);
  // Test yourself, Build a community: the same plot
  await page.evaluate(() => { location.hash = '#build'; }); await page.reload(); await page.waitForSelector('.sd2-svg'); await page.waitForTimeout(700);
  { const g = await geo(page); ok(g.view === 'build' && !g.cause && !g.head, `${tag0} build: the cause line or the purpose line shows`); check(g, `${tag0} build`, STATES[0]);
    if (SHOTS && !dark && (w === 360 || w === 1440)) await page.screenshot({ path: join(SHOTS, `sweep-build-${w}.png`), fullPage: true }); }
  ok(!errs.length, `${tag0}: console errors: ${errs.join(' | ')}`);
  await browser.close();
}

/* A tap on what you see acts on it: every visible bare patch plants there (mouse, then real touch), and a tap on a
   tree's crown changes that tree. Points are the centre of what is drawn, read with elementFromPoint. */
async function tapTest(w, touch) {
  const { browser, page, errs } = await open(w, false, { noCue: true, touch });
  const tag = `${w} ${touch ? 'touch' : 'mouse'}`;
  await page.click('.sd2-chip[data-k="4"]');
  const soils = await page.evaluate(() => [...document.querySelectorAll('.sd2-spot')].filter(g => g.querySelector('.sd2-soil')).map(g => +g.dataset.i));
  let planted = 0;
  for (const i of soils) {
    const pt = await page.evaluate((i) => { const g = document.querySelectorAll('.sd2-spot')[i], s = g.querySelector('.sd2-soil'); if (!s) return null; const r = s.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, e = document.elementFromPoint(x, y); return e && e.closest('.sd2-spot') === g ? { x, y } : null; }, i);
    if (!pt) { fails.push(`${tag}: bare place ${i} cannot be seen`); continue; }
    if (touch) await page.touchscreen.tap(pt.x, pt.y); else await page.mouse.click(pt.x, pt.y);
    await page.waitForTimeout(60);
    const got = await page.evaluate((i) => { const t = document.querySelectorAll('.sd2-spot')[i].querySelector('.sd2-tree'); return t ? +t.dataset.sp : -1; }, i);
    if (got === 4) planted++; else fails.push(`${tag}: a tap on bare place ${i} did not plant there`);
  }
  ok(planted === soils.length, `${tag}: ${planted} of ${soils.length} visible bare patches planted where tapped`);
  await page.waitForTimeout(500);
  const sum = await page.evaluate(() => [...document.querySelectorAll('.sd2-chip-c')].map(e => +e.textContent).reduce((a, b) => a + b, 0));
  ok(sum === 24 + soils.length, `${tag}: ${sum} trees after planting every bare place`);
  // trees: pick Birch, tap the crown centre of six trees you can see; each becomes a birch
  await page.click('.sd2-chip[data-k="2"]');
  for (let j = 0; j < 6; j++) {
    const pt = await page.evaluate(() => { for (const g of document.querySelectorAll('.sd2-spot')) { const t = g.querySelector('.sd2-tree'); if (!t || t.dataset.sp === '2') continue; const r = t.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height * 0.3, e = document.elementFromPoint(x, y); if (e && e.closest('.sd2-spot') === g) return { x, y, i: +g.dataset.i }; } return null; });
    if (!pt) break;
    if (touch) await page.touchscreen.tap(pt.x, pt.y); else await page.mouse.click(pt.x, pt.y);
    await page.waitForTimeout(400);
    const got = await page.evaluate((i) => { const t = document.querySelectorAll('.sd2-spot')[i].querySelector('.sd2-tree'); return t ? +t.dataset.sp : -1; }, pt.i);
    ok(got === 2, `${tag}: a tap on tree ${pt.i} did not change that tree (${got})`);
  }
  ok(!errs.length, `${tag}: console errors: ${errs.join(' | ')}`);
  await browser.close();
}
for (const w of WIDTHS) { await tapTest(w, false); await tapTest(w, true); }

/* Frame by frame: at every frame the tray's counts equal the trees drawn, and D and the cause line are the ones
   for those trees (no word runs ahead of the picture, none lags once a tree is in). */
for (const w of [390, 1440].filter(w => !ONE || +ONE === w)) {
  const { browser, page, errs } = await open(w, false, { noCue: true });
  const frames = await page.evaluate(async () => {
    const log = [], q = (s) => document.querySelector(s), qa = (s) => [...document.querySelectorAll(s)];
    let on = true;
    const snap = (what) => { const c = [0, 0, 0, 0, 0]; qa('.sd2-tree').forEach(t => c[+t.dataset.sp]++); const N = c.reduce((a, b) => a + b, 0), S = c.filter(Boolean).length, D = N ? 1 - c.reduce((a, n) => a + (n / N) * (n / N), 0) : null;
      log.push({ what, drawn: c.join(), tray: qa('.sd2-chip-c').map(e => e.textContent).join(), dText: q('.sd2-g-v b').textContent, dWant: D == null ? 'No trees' : 'D = ' + D.toFixed(2), cause: q('.tk2-cause').textContent, S, moving: qa('.sd2-tree.is-out, .sd2-tree.is-cut').length }); };
    const loop = (what) => new Promise(done => { const t0 = performance.now(); const f = () => { snap(what); if (performance.now() - t0 < 900) requestAnimationFrame(f); else done(); }; f(); });
    const btn = qa('.sd2-spotb'), kind = (i) => { const t = qa('.sd2-spot')[i].querySelector('.sd2-tree'); return t ? +t.dataset.sp : -1; };
    const first = (k) => btn.findIndex((b, i) => kind(i) === k);
    q('.sd2-chip[data-k="3"]').click(); btn[first(0)].click(); await loop('replace an oak with a maple');
    btn[first(-1)].click(); await loop('plant a maple on bare soil');
    q('.sd2-chip[data-k="-1"]').click(); btn[first(1)].click(); await loop('cut a pine');
    q('.sd2-chip[data-k="4"]').click(); [0, 1, 2].forEach(() => btn[first(0)].click()); await loop('three quick taps');
    q('.sd2-even').click(); await loop('even it out'); await loop('even it out, end');
    return log;
  });
  let bad = 0, mid = 0;
  frames.forEach(f => { if (f.moving) mid++; const fine = f.drawn === f.tray && f.dText === f.dWant && (f.cause.startsWith('Same trees') || f.cause.startsWith(f.S ? f.S + ' species' : 'No trees')); if (!fine && bad++ < 3) fails.push(`${w} frames (${f.what}): drawn ${f.drawn}, tray ${f.tray}, ${f.dText} (want ${f.dWant}), "${f.cause}"`); });
  ok(bad === 0, `${w} frames: ${bad} of ${frames.length} frames where the words and the trees disagree`);
  ok(mid > 5, `${w} frames: no frame caught a tree mid change (${mid})`);
  ok(!errs.length, `${w} frames: console errors: ${errs.join(' | ')}`);
  console.log(`frames at ${w}: ${frames.length} checked, ${mid} with a tree mid change`);
  await browser.close();
}
/* Reduced motion: the result at once, with a short cross fade. */
if (!ONE || ONE === '390') { const { browser, page, errs } = await open(390, false, { reduced: true, noCue: true });
  const r = await page.evaluate(() => { document.querySelector('.sd2-chip[data-k="3"]').click(); document.querySelectorAll('.sd2-spotb')[0].click(); const t = document.querySelector('.sd2-tree.is-fade');
    return { tray: [...document.querySelectorAll('.sd2-chip-c')].map(e => e.textContent).join(), anim: t ? getComputedStyle(t).animationName : '', dur: t ? getComputedStyle(t).animationDuration : '' }; });
  ok(r.tray === '15,4,4,1,0' && r.anim === 'sd2-fade' && parseFloat(r.dur) <= 0.3, `reduced motion: ${JSON.stringify(r)}`);
  ok(!errs.length, 'reduced motion: console errors'); await browser.close(); }

server.close();
console.log(`${pass} passed, ${fails.length} failed`);
fails.slice(0, 60).forEach(f => console.log('  FAIL ' + f));
process.exit(fails.length ? 1 : 0);
