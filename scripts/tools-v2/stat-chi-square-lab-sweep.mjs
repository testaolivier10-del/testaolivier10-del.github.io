#!/usr/bin/env node
/* Tools v2 sweep: AP Statistics, Chi-square lab (docs/tools-v2-stat-chi-square-lab-brief.md; pattern of
   scripts/tools-v2/stat-ci-capture-sweep.mjs).
   Landmark states of Explore (the first visit with its cue; each study as it opens; a stack at its top and at its
   lowest; a cell in the last column at its top; a chance table; α = 0.01; a takeaway; an expected count under 5) and a
   Test yourself view, at widths 360 to 1920, light and dark:
     - no sideways scroll; nothing clipped by the scene (labels, pills, the knob, the cue);
     - labels never overlap each other (4 px) and keep clear of the drawn stacks, the expected lines, the curve, the
       cutoff and the χ² marker, the parts bar, the axis and the knob;
     - no rendered text under 11 px; phones: the cause line at most two rows, constant height;
     - the stacks' table is the largest part; the knob, the picture and the cause line show together at 390 x 844,
       1024 x 768, 1280 x 800 and the short phones 375 x 667 and 360 x 740, with no inner scroll;
     - every number agrees with the stacks AS DRAWN (AGREE: each count is read back from its stack's drawn height;
       the totals, every expected line and number, the parts bar, the marker, the pill, the shaded p-value's key and
       the cause line are recomputed from those counts and checked);
     - the first visit cue sits beside the knob and covers no number or label.
   --frames (390 and 1440): AGREE after every animation frame through a real pointer drag of the knob up and back, a
   press on another cell's stack and a drag, keys, a reversal mid change, Chance table, Start over, a study change,
   leaving to Test yourself mid change and coming back, a real touch drag at 390, and reduced motion.
   --perf: CPU x4 frame times of a knob drag and a chance table at 390 and 1440, beside the flagship's fertilizer drag.
   --shots <dir>: a picture of every state.
   Usage: node scripts/tools-v2/stat-chi-square-lab-sweep.mjs [--width <px>] [--frames] [--perf] [--shots <dir>]
   With no flag it runs each of the ten widths in its own process, then the frame checks.
   Needs playwright (PW_ROOT names a folder whose node_modules has it) and Chromium (CHROMIUM_PATH). */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, readFileSync, mkdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const WIDTHS = [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
const ONE = arg('--width', null), FRAMES = process.argv.includes('--frames'), PERF = process.argv.includes('--perf'), SHOTS = arg('--shots', null);
const DARKS = arg('--theme', 'both');

if (!ONE && !FRAMES && !PERF) {
  let pass = 0, fail = 0, bad = false;
  const runs = WIDTHS.map(w => ['--width', String(w)]).concat([['--frames']]);
  for (const a of runs) {
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...a, ...(SHOTS ? ['--shots', SHOTS] : [])], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
    process.stdout.write(r.stdout);
    const m = /(\d+) passed, (\d+) failed/.exec(r.stdout || '');
    if (m) { pass += +m[1]; fail += +m[2]; } else bad = true;
  }
  console.log(`\nstat-chi-square-lab sweep, all runs: ${pass} passed, ${fail} failed${bad ? ' (a run did not finish)' : ''}`);
  process.exit(fail || bad ? 1 : 0);
}

let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) {
  const roots = [process.env.PW_ROOT, '/opt/npm-tools', '/home/claude/testaolivier10-del.github.io'].filter(Boolean);
  for (const r of roots) { try { ({ chromium } = createRequire(r + '/')('playwright')); break; } catch (e2) {} }
  if (!chromium) { console.error('This sweep needs playwright (set PW_ROOT).'); process.exit(0); }
}
const EXE = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome') ? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' : undefined);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const file = resolve(ROOT, '.' + p);
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  // Premium is unlocked in this test only (never committed): has() answers yes
  if (p === '/assets/premium.js') { res.writeHead(200, { 'Content-Type': MIME['.js'] }); res.end(readFileSync(file, 'utf8').replace('function has(course) {', 'function has(course) { return true;')); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }); createReadStream(file).pipe(res);
});
await new Promise(ok => server.listen(0, ok));
const PORT = server.address().port;
const URL0 = `http://localhost:${PORT}/statistics/tools/chi-square-lab.html`;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

let pass = 0; const fails = [];
const ok = (c, msg) => { if (c) pass++; else fails.push(msg); };

async function open(w, h, dark, opts = {}) {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', hasTouch: w < 600, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.addInitScript(([dark, noCue, frames]) => {
    window.LevlToolTest = 1;
    try { if (dark) localStorage.setItem('nremt_theme', 'dark'); if (noCue) localStorage.setItem('tk2c:apstat-chi-square-lab', '1'); } catch (e) {}
    if (frames) {
      // after every animation frame callback, check the picture against itself
      const raf = window.requestAnimationFrame.bind(window);
      window.__fr = { n: 0, bad: [] };
      window.requestAnimationFrame = (cb) => raf((t) => { cb(t); if (window.__rows) window.__rows.add([...document.querySelectorAll('.cs2-tots .cs2-tot')].slice(0, window.ApStatChiSquareLab.S.T.length).map(e => e.textContent).join('|')); if (window.__AGREE && window.ApStatChiSquareLab) { window.__fr.n++; const b = window.__AGREE(); if (b.length && window.__fr.bad.length < 20) window.__fr.bad.push(b.join('; ')); } });
    }
  }, [dark, !!opts.noCue, !!opts.frames]);
  await page.goto(URL0 + (opts.hash || ''));
  if (!opts.hash) await page.waitForSelector('.cs2-scene .cs2-stk', { timeout: 20000 });
  await page.waitForTimeout(600);
  if (opts.frames) await page.evaluate(`window.__AGREE = ${AGREE.toString()}`);
  return { browser, page, errs };
}
async function until(page, fn, a) { for (let i = 0; i < 200; i++) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(50); } return false; }
const still = (page) => until(page, () => !window.ApStatChiSquareLab.busy());

/* Read the counts back from the stacks as drawn and check every number against them (runs in the page). */
const AGREE = () => {
  const X = window.ApStatChiSquareLab, G = X.G(), Ce = X.Ce(), Pe = X.Pe(), PL = X.PL(), out = [], D = window.ApStatDist, fx = window.ApStatMath.fixed;
  if (!G || !Ce.length) return ['no picture'];
  if (!document.querySelector('.cs2-scene').getBoundingClientRect().width) return [];   // Explore is hidden (Test yourself)
  const R = Ce.length, C = Ce[0].length, O = [];
  for (let i = 0; i < R; i++) { O.push([]); for (let j = 0; j < C; j++) {
    const h = +Ce[i][j].base.getAttribute('height'), y = +Ce[i][j].base.getAttribute('y'), v = Math.round(h / G.pxc);
    if (Math.abs(h - v * G.pxc) > 0.12) out.push(`stack ${i},${j} height ${h} is not a whole count`);
    if (Math.abs(y + h - G.rows[i].sBot) > 0.12) out.push(`stack ${i},${j} does not stand on its counter`);
    O[i].push(v);
    if (Ce[i][j].o.textContent !== String(v)) out.push(`count ${i},${j} reads ${Ce[i][j].o.textContent}, drawn ${v}`);
  } }
  const rows = O.map(r => r.reduce((a, b) => a + b, 0)), cols = O[0].map((_, j) => O.reduce((a, r) => a + r[j], 0)), N = rows.reduce((a, b) => a + b, 0);
  if (rows.some(x => !x) || cols.some(x => !x)) return out.concat(['a drawn row or column is empty']);
  let chi = 0;
  for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) {
    const E = rows[i] * cols[j] / N, ce = Ce[i][j], ey = +ce.eLine.getAttribute('y1');
    chi += (O[i][j] - E) ** 2 / E;
    if (Math.abs(ey - (G.rows[i].sBot - E * G.pxc)) > 0.12) out.push(`expected line ${i},${j} at ${ey}, drawn counts want ${(G.rows[i].sBot - E * G.pxc).toFixed(1)}`);
    if (!ce.e.textContent.endsWith(fx(E, 1))) out.push(`expected ${i},${j} reads ${ce.e.textContent}, drawn ${fx(E, 1)}`);
    const gc = ce.gap.getAttribute('class') || '', want = O[i][j] > E + 1e-9 ? 'is-up' : O[i][j] < E - 1e-9 ? 'is-down' : '';
    if (want && !gc.includes(want)) out.push(`gap ${i},${j} colour ${gc} vs ${want}`);
    const gh = +ce.gap.getAttribute('height');
    if (want && Math.abs(gh - Math.abs(O[i][j] - E) * G.pxc) > 0.25) out.push(`gap ${i},${j} height ${gh} vs ${(Math.abs(O[i][j] - E) * G.pxc).toFixed(1)}`);
  }
  const T = document.querySelectorAll('.cs2-tots .cs2-tot');
  rows.forEach((v, i) => { if (T[i].textContent !== String(v)) out.push(`row total ${i} reads ${T[i].textContent}, drawn ${v}`); });
  cols.forEach((v, j) => { if (T[R + j].textContent !== String(v)) out.push(`column total ${j} reads ${T[R + j].textContent}, drawn ${v}`); });
  if (T[R + C].textContent !== String(N)) out.push('grand total');
  const df = (R - 1) * (C - 1), p = D.chi2Sf(chi, df), P4 = p < 0.00005 ? '< 0.0001' : fx(p, 4);
  if (Pe.pillT.textContent.replace(' →', '') !== 'χ² = ' + fx(chi, 2)) out.push(`pill ${Pe.pillT.textContent} vs drawn χ² ${fx(chi, 2)}`);
  if (!Pe.pkT.textContent.endsWith(P4)) out.push(`p key ${Pe.pkT.textContent} vs ${P4}`);
  const mx = X.xs(Math.min(chi, PL.xmax));
  if (Math.abs(+Pe.mark.getAttribute('x1') - mx) > 0.12) out.push('marker not at the drawn χ²');
  // the parts bar ends at χ²
  let end = 0; Pe.bar.forEach(s => { end = Math.max(end, +s.getAttribute('x') + +s.getAttribute('width')); });
  if (Math.abs(end - mx) > 0.3) out.push(`bar ends at ${end.toFixed(1)}, χ² at ${mx.toFixed(1)}`);
  // the shading starts at χ²
  const sd = Pe.shade.getAttribute('d') || '';
  if (chi < PL.xmax) { const m = /^M([-\d.]+)/.exec(sd); if (!m || Math.abs(+m[1] - mx) > 0.12) out.push('shading does not start at χ²'); }
  // the cause line (unless a takeaway stands in its place)
  const cz = document.querySelector('.cs2 .tk2-cause');
  if (cz && !cz.classList.contains('is-take')) {
    const pills = [...cz.querySelectorAll('.tk2-cz')].map(e => e.textContent), [i, j] = X.S.sel, E = rows[i] * cols[j] / N;
    if (!pills[0] || !(pills[0].endsWith(`: ${O[i][j]} vs ${fx(E, 1)}`) || pills[0] === `${O[i][j]} vs ${fx(E, 1)} expected`)) out.push(`cause cell "${pills[0]}" vs drawn ${O[i][j]} vs ${fx(E, 1)}`);
    if (pills[1] !== 'part ' + fx((O[i][j] - E) ** 2 / E, 2)) out.push(`cause part "${pills[1]}"`);
    if (pills[2] !== 'χ² ' + fx(chi, 2)) out.push(`cause χ² "${pills[2]}" vs ${fx(chi, 2)}`);
    if (!pills[3] || !pills[3].endsWith(P4)) out.push(`cause p "${pills[3]}" vs ${P4}`);
    const low = rows.some((r, a) => cols.some(c => r * c / N < 5));
    if (low !== pills.some(t => /under 5/.test(t))) out.push('cause line and the expected counts condition disagree');
  } else if (cz && X.busy()) out.push('a takeaway while the stacks still move');
  // the knob rides on the selected stack's drawn top
  const kd = document.querySelector('.cs2 .cs2-knob .tk2-knob'), sv = document.querySelector('.cs2-svg').getBoundingClientRect();
  if (kd) { const r = kd.getBoundingClientRect(), [i, j] = X.S.sel, ky = r.top + r.height / 2 - sv.top, want = Math.max(Math.min(G.rows[i].sBot - O[i][j] * G.pxc, G.rows[i].sBot - G.kFloor), G.rows[i].y + G.band + G.kr + 6); if (Math.abs(ky - want) > 1) out.push(`knob at ${ky.toFixed(1)}, the stack's top at ${want.toFixed(1)}`); }
  return out;
};

/* Layout checks of one state (runs in the page). */
const LAYOUT = (phone) => {
  const out = [], sc = document.querySelector('.cs2-scene').getBoundingClientRect(), sv = document.querySelector('.cs2-svg').getBoundingClientRect();
  const vis = (e) => { if (!e) return false; const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false; for (let x = e; x && x.nodeType === 1; x = x.parentNode) { const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0 || x.hidden) return false; } return true; };
  const inS = (r, what) => { if (r.left < sc.left - 0.5 || r.right > sc.right + 0.5 || r.top < sc.top - 0.5 || r.bottom > sc.bottom + 0.5) out.push(`clipped: ${what}`); };
  const touch = (a, b, gx, gy) => a.left < b.right + gx && b.left < a.right + gx && a.top < b.bottom + gy && b.top < a.bottom + gy;
  if (document.scrollingElement.scrollWidth > innerWidth + 1) out.push('sideways scroll ' + document.scrollingElement.scrollWidth);
  const labs = [];
  document.querySelectorAll('.cs2-svg text').forEach(t => {
    if (!vis(t) || !t.textContent.trim() || t.closest('.cs2-pill')) return;
    const r = t.getBoundingClientRect(); labs.push({ r, w: t.textContent.trim(), c: t.getAttribute('class') || '', t });
    const fs = parseFloat(getComputedStyle(t).fontSize); if (fs < 11) out.push(`text under 11 px: "${t.textContent}" ${fs}`);
  });
  const pill = document.querySelector('.cs2-pill rect'); if (pill && vis(pill)) labs.push({ r: pill.getBoundingClientRect(), w: 'pill ' + document.querySelector('.cs2-pill').textContent, c: 'pill' });
  labs.forEach(l => inS(l.r, l.w));
  const knob = document.querySelector('.cs2 .cs2-knob .tk2-dot'); if (knob && vis(knob)) inS(knob.getBoundingClientRect(), 'knob');
  for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) {
    if (touch(labs[i].r, labs[j].r, 4, 2)) out.push(`labels touch: "${labs[i].w}" / "${labs[j].w}"`);
  }
  // labels against what is drawn: the stacks, the expected lines and pointers, the bar, the axis, the marker, the cutoff, the knob
  const drawn = [];
  // lines have a zero width or height box: count them by their stroke
  const visL = (e) => { const r = e.getBoundingClientRect(); if (!(r.width || r.height)) return false; for (let x = e; x && x.nodeType === 1; x = x.parentNode) { const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; } return true; };
  const grow = (e) => { const r = e.getBoundingClientRect(), k = e.tagName === 'line' ? (parseFloat(getComputedStyle(e).strokeWidth) || 1) / 2 : 0; return { left: r.left - k, right: r.right + k, top: r.top - k, bottom: r.bottom + k }; };
  document.querySelectorAll('.cs2-stk, .cs2-eline, .cs2-etri, .cs2-gap, .cs2-seg, .cs2-axis, .cs2-mark, .cs2-crit, .cs2-ctr').forEach(e => { if (visL(e)) drawn.push({ r: grow(e), c: e.getAttribute('class') }); });
  if (knob && vis(knob)) drawn.push({ r: knob.getBoundingClientRect(), c: 'knob' });
  labs.forEach(l => drawn.forEach(o => {
    // the χ² pill sits on its own marker; the cutoff label is beside its line by design (checked with a 4 px gap)
    if (l.c === 'pill' && /cs2-mark/.test(o.c)) return;
    if (/cs2-critl/.test(l.c) && /cs2-crit\b/.test(o.c)) { if (touch(l.r, o.r, 3, -100)) out.push('cutoff label touches its line'); return; }
    if (touch(l.r, o.r, 2, 1)) out.push(`"${l.w}" touches ${String(o.c).split(' ')[0]}`);
  }));
  // labels against the curve: sample its path
  const cv = document.querySelector('.cs2-curve'), dd = cv ? cv.getAttribute('d') : '', pts = [];
  dd.replace(/[ML]([-\d.]+) ([-\d.]+)/g, (m, x, y) => { pts.push([sv.left + +x, sv.top + +y]); return m; });
  labs.forEach(l => { if (!/cs2-critl|cs2-partsl|cs2-tl|cs2-pkt|cs2-ptitle|pill/.test(l.c)) return; const a = l.r; for (let k = 1; k < pts.length; k++) { const [x0, y0] = pts[k - 1], [x1, y1] = pts[k]; for (let q = 0; q <= 4; q++) { const x = x0 + (x1 - x0) * q / 4, y = y0 + (y1 - y0) * q / 4; if (x > a.left - 2 && x < a.right + 2 && y > a.top - 2 && y < a.bottom + 2) { out.push(`"${l.w}" touches the curve`); return; } } } });
  // the cue: inside the stage, covering no number, label or the knob
  const cue = document.querySelector('.cs2 .tk2-cue');
  if (cue && vis(cue)) {
    const r = cue.getBoundingClientRect(); inS(r, 'cue');
    labs.forEach(l => { if (touch(r, l.r, 0, 0)) out.push(`cue covers "${l.w}"`); });
    // nor any stack, gap, expected line or its pointers (review round 1)
    drawn.forEach(o => { if (/cs2-(stk|gap|eline|etri)/.test(o.c) && touch(r, o.r, 0, 0)) out.push(`cue covers ${o.c.split(' ')[0]}`); });
    if (knob && touch(r, knob.getBoundingClientRect(), 0, 0)) out.push('cue covers the knob');
  }
  // the stacks' table is the largest part of the picture
  const G = window.ApStatChiSquareLab.G();
  if (!(G.tb.w * G.tb.h > G.cv.w * G.cv.h)) out.push('the table is not the largest part');
  // phones: the cause line at most two rows and a constant height
  const cz = document.querySelector('.cs2 .tk2-cause');
  if (phone && cz) { const h = cz.getBoundingClientRect().height; if (h > 74) out.push('cause line taller than two rows: ' + h); window.__czH = window.__czH || h; if (Math.abs(window.__czH - h) > 1) out.push(`cause line height changed ${window.__czH} -> ${h}`); }
  return out;
};
/* The knob, the picture and the cause line on one screen with no inner scroll (runs in the page). */
const FOLD = () => {
  window.scrollTo(0, 0);
  const k = document.querySelector('.cs2 .cs2-knob .tk2-dot').getBoundingClientRect(), s = document.querySelector('.cs2-scene').getBoundingClientRect(), c = document.querySelector('.cs2 .tk2-cause').getBoundingClientRect();
  let inner = '';
  for (let e = document.querySelector('.cs2-scene').parentNode; e && e !== document.body; e = e.parentNode) { const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 1) inner = e.className; }
  return { k: k.top >= 0 && k.bottom <= innerHeight, s: s.top >= 0 && s.bottom <= innerHeight, c: c.bottom <= innerHeight, inner };
};

if (ONE) {
  const w = +ONE;
  const h = w < 600 ? 844 : w <= 820 ? 1024 : w === 1024 ? 768 : w === 1280 ? 800 : w === 1920 ? 1080 : 900;
  // the fit on the screens the brief names
  const fits = w === 360 ? [[360, 740], [375, 667]] : w === 390 ? [[390, 844]] : w === 1024 ? [[1024, 768]] : w === 1280 ? [[1280, 800]] : [];
  for (const [fw, fh] of fits) {
    const { browser, page } = await open(fw, fh, false, { noCue: true });
    const f = await page.evaluate(FOLD);
    ok(f.k && f.s && f.c && !f.inner, `${fw}x${fh}: the knob, the picture and the cause line are not on one screen with no inner scroll ${JSON.stringify(f)}`);
    await browser.close();
  }
  for (const dark of DARKS === 'both' ? [false, true] : [DARKS === 'dark']) {
    const tag = `${w}-${dark ? 'dark' : 'light'}`;
    const { browser, page, errs } = await open(w, h, dark);
    const X = (fn, a) => page.evaluate(fn, a);
    const shot = async (n) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/sweep-${tag}-${n}.png` }); };
    const check = async (n) => {
      await still(page); await page.waitForTimeout(40);
      const lay = await X(LAYOUT, w < 600); lay.forEach(f => ok(false, `${tag} ${n}: ${f}`)); ok(!lay.length, '');
      const ag = await X(AGREE); ag.forEach(f => ok(false, `${tag} ${n}: ${f}`)); ok(!ag.length, '');
      await shot(n);
    };
    const th = await X(() => document.documentElement.getAttribute('data-theme') === 'dark');
    ok(th === dark, `${tag} theme: dark is ${th}`);
    const cue = await X(() => !!document.querySelector('.cs2 .tk2-cue'));
    // phones under 430 px have no free place beside a cell for the bubble: the knob's pulse is the cue there (brief)
    ok(cue || w < 430, `${tag} no first visit cue`);
    await check('00-first');
    const L = window => 0;
    await X(() => window.ApStatChiSquareLab.cue.hide(false));
    const T = async (n, fn) => { await X(fn); await check(n); };
    await T('01-top', () => { const X = window.ApStatChiSquareLab; X.setCount(X.S.cap); });
    await T('02-lowest', () => { const X = window.ApStatChiSquareLab; X.setCount(0); });
    await T('03-last-col-top', () => { const X = window.ApStatChiSquareLab, S = X.S; X.select(S.T.length - 1, S.T[0].length - 1); X.setCount(S.cap); });
    await T('04-first-cell-top', () => { const X = window.ApStatChiSquareLab, S = X.S; X.select(0, 0); X.setCount(S.cap); });
    await T('05-reset', () => window.ApStatChiSquareLab.reset());
    await T('06-chance', () => window.ApStatChiSquareLab.chance());
    const tk = await X(() => document.querySelector('.cs2 .tk2-cause').classList.contains('is-take'));
    ok(tk, `${tag} no takeaway after a chance table`);
    await T('07-alpha01', () => window.ApStatChiSquareLab.alpha(0.01));
    await X(() => window.ApStatChiSquareLab.alpha(0.05));
    // a drag that crosses α gives the decision takeaway
    await T('08-cross', () => { const X = window.ApStatChiSquareLab; X.reset(); });
    // the first cell whose drag to its cap crosses α (the cap depends on the width)
    await T('08-take', () => { const X = window.ApStatChiSquareLab, S = X.S, M = window.ApStatMath.chiSquareLab;
      for (let i = 0; i < S.T.length; i++) for (let j = 0; j < S.T[0].length; j++) { const t = S.base.map(r => r.slice()); t[i][j] = S.cap; if (M.table(t).p < 0.05) { X.select(i, j); X.drag(S.cap); return; } } });
    const tk2 = await X(() => document.querySelector('.cs2 .tk2-cause').textContent);
    ok(/convincing evidence/.test(tk2), `${tag} no decision takeaway after crossing α: ${tk2}`);
    await T('09-news', () => window.ApStatChiSquareLab.setStudy('news'));
    await T('10-news-low', () => { const X = window.ApStatChiSquareLab; for (let i = 0; i < 3; i++) { X.select(i, 0); X.setCount(1); } X.finish(); });
    await T('11-plants', () => window.ApStatChiSquareLab.setStudy('plants'));
    await T('12-plants-top', () => { const X = window.ApStatChiSquareLab; X.select(0, 2); X.setCount(X.S.cap); });
    await T('13-lunch', () => window.ApStatChiSquareLab.setStudy('lunch'));
    // Test yourself: the drill and its figure
    await X(() => window.ApStatChiSquareLab.go('quiz'));
    await page.waitForTimeout(800);
    const qz = await X(() => { const f = document.querySelector('.ls-root .cs-qfig svg'); return { fig: !!f && f.getBoundingClientRect().height > 100, sx: document.scrollingElement.scrollWidth <= innerWidth + 1, raf: window.ApStatChiSquareLab.busy() }; });
    ok(qz.fig && qz.sx && !qz.raf, `${tag} Test yourself: ${JSON.stringify(qz)}`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/sweep-${tag}-14-quiz.png` });
    // back to Explore: a laid out picture
    await X(() => window.ApStatChiSquareLab.go('explore')); await page.waitForTimeout(400);
    await check('15-back');
    ok(!errs.length, `${tag} console: ${errs.slice(0, 3).join(' | ')}`);
    await browser.close();
  }
  if (w === 390 || w === 1440) {
    // deep links: #quiz and ?seed= open Test yourself; Explore afterwards is laid out (the AP Biology chi-square's block)
    for (const hash of ['#quiz', '?seed=12345#quiz']) {
      const { browser, page, errs } = await open(w, h, false, { hash, noCue: true });
      await page.waitForTimeout(800);
      const q = await page.evaluate(() => ({ quiz: !!document.querySelector('.ls-root .cs-qfig svg'), code: (document.querySelector('.ls-root') || document.body).textContent.includes('12345') }));
      ok(q.quiz && (hash.indexOf('seed') < 0 || q.code), `${w} ${hash}: Test yourself did not open ${JSON.stringify(q)}`);
      await page.evaluate(() => window.ApStatChiSquareLab.go('explore')); await page.waitForTimeout(500);
      const lay = await page.evaluate(LAYOUT, w < 600); lay.forEach(f => ok(false, `${w} ${hash} then Explore: ${f}`)); ok(!lay.length, '');
      const ag = await page.evaluate(AGREE); ag.forEach(f => ok(false, `${w} ${hash} then Explore: ${f}`)); ok(!ag.length, '');
      ok(!errs.length, `${w} ${hash} console: ${errs.slice(0, 3).join(' | ')}`);
      await browser.close();
    }
  }
}

if (FRAMES) {
  for (const w of [390, 1440]) {
    const h = w < 600 ? 844 : 900, tag = `frames ${w}`;
    const { browser, page, errs } = await open(w, h, false, { frames: true, noCue: true });
    const X = (fn, a) => page.evaluate(fn, a);
    const run = async (what, fn, want, wa) => {
      await X(() => { window.__fr.n = 0; window.__fr.bad = []; });
      await fn(); await still(page); await page.waitForTimeout(80);
      const fr = await X(() => window.__fr);
      ok(fr.n > 0, `${tag} ${what}: no frames`);
      fr.bad.forEach(b => ok(false, `${tag} ${what}: ${b}`)); ok(!fr.bad.length, '');
      const ag = await X(() => window.__AGREE()); ag.forEach(b => ok(false, `${tag} ${what} (at rest): ${b}`));
      if (want) { const r = await X(want, wa); ok(r === true, `${tag} ${what}: ${JSON.stringify(r)}`); }
      console.log(`  ${tag} ${what}: ${fr.n} frames`);
    };
    const knob = async () => X(() => { const r = document.querySelector('.cs2 .cs2-knob .tk2-knob').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    const v0 = await X(() => { const S = window.ApStatChiSquareLab.S; return S.T[S.sel[0]][S.sel[1]]; });
    await run('pointer drag up and back', async () => {
      const k = await knob(); await page.mouse.move(k[0], k[1]); await page.mouse.down();
      for (let i = 0; i <= 16; i++) { await page.mouse.move(k[0], k[1] - 40 * i / 16); await page.waitForTimeout(16); }
      for (let i = 16; i >= 0; i--) { await page.mouse.move(k[0], k[1] - 40 * i / 16); await page.waitForTimeout(16); }
      await page.mouse.up();
    }, (v0) => { const S = window.ApStatChiSquareLab.S; return Math.abs(S.T[S.sel[0]][S.sel[1]] - v0) <= 1 || 'ended at ' + S.T[S.sel[0]][S.sel[1]] + ' from ' + v0; }, v0);
    await run('fast drag up, reversed mid change', async () => {
      const k = await knob(); await page.mouse.move(k[0], k[1]); await page.mouse.down();
      await page.mouse.move(k[0], k[1] - 60); await page.waitForTimeout(50); await page.mouse.move(k[0], k[1] + 30); await page.waitForTimeout(30); await page.mouse.up();
    });
    await run('a press on another cell and a drag', async () => {
      const p = await X(() => { const X = window.ApStatChiSquareLab, G = X.G(), sv = document.querySelector('.cs2-svg').getBoundingClientRect(); const i = 0, j = 1; return [sv.left + G.cx(j), sv.top + G.y(i, X.S.D[i][j]) + 6]; });
      await page.mouse.move(p[0], p[1]); await page.mouse.down();
      for (let i = 0; i <= 10; i++) { await page.mouse.move(p[0], p[1] - 3 * i); await page.waitForTimeout(16); }
      await page.mouse.up();
    }, () => { const S = window.ApStatChiSquareLab.S; return (S.sel[0] === 0 && S.sel[1] === 1) || 'selected ' + S.sel; });
    await run('keys', async () => {
      await page.focus('.cs2 .cs2-knob .tk2-knob');
      for (let i = 0; i < 5; i++) { await page.keyboard.press('ArrowUp'); await page.waitForTimeout(40); }
      await page.keyboard.press('Shift+ArrowUp'); await page.waitForTimeout(30); await page.keyboard.press('PageDown'); await page.waitForTimeout(200);
      await page.keyboard.press('Home'); await page.waitForTimeout(300); await page.keyboard.press('End'); await page.waitForTimeout(100); await page.keyboard.press('ArrowRight');
    }, () => { const X = window.ApStatChiSquareLab, S = X.S; return (S.sel[0] === 0 && S.sel[1] === 2 && S.T[0][1] === S.cap) || 'sel ' + S.sel + ' T01 ' + S.T[0][1]; });
    await run('Chance table', async () => { await X(() => { window.__rows = new Set(); }); await page.click('.cs2-chance'); });
    { const rs = await X(() => { const a = [...window.__rows]; window.__rows = null; return a; }); ok(rs.length === 1, `${tag} row totals moved during a chance table: ${rs.join(' / ')}`); }
    await run('Start over', async () => { await page.click('.cs2-reset'); });
    await run('a study change', async () => { await page.selectOption('.cs2-sel', 'news'); await page.waitForTimeout(50); await page.click('.cs2-chance'); });
    await run('leave to Test yourself mid change, come back', async () => {
      await page.click('.cs2-chance'); await page.waitForTimeout(200);
      await X(() => window.ApStatChiSquareLab.go('quiz')); await page.waitForTimeout(300);
      const clean = await X(() => { const X = window.ApStatChiSquareLab; return !X.busy() && JSON.stringify(X.S.D) === JSON.stringify(X.S.T); }); ok(clean, `${tag} leaving mid change left it unfinished`);
      await X(() => window.ApStatChiSquareLab.go('explore')); await page.waitForTimeout(400);
    });
    if (w < 600) {
      await run('a real touch drag', async () => {
        const k = await knob(), y0 = await X(() => scrollY), v = await X(() => { const S = window.ApStatChiSquareLab.S; return S.T[S.sel[0]][S.sel[1]]; });
        const cdp = await page.context().newCDPSession(page);
        const pts = (y) => [{ x: k[0], y, id: 1 }];
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(k[1]) });
        for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(k[1] + 2 * i) }); await page.waitForTimeout(20); }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForTimeout(400);
        const y1 = await X(() => scrollY); ok(Math.abs(y1 - y0) < 2, `${tag} the page scrolled under a touch drag`);
        const v1 = await X(() => { const S = window.ApStatChiSquareLab.S; return S.T[S.sel[0]][S.sel[1]]; }); ok(v1 < v, `${tag} a touch drag down did not lower the count (${v} -> ${v1})`);
      });
    }
    ok(!errs.length, `${tag} console: ${errs.slice(0, 3).join(' | ')}`);
    await browser.close();
    // reduced motion: the result at once, a cross fade on a study change
    const rm = await open(w, h, false, { reduced: true, noCue: true });
    await rm.page.evaluate(`window.__AGREE = ${AGREE.toString()}`);
    await rm.page.click('.cs2-chance'); await rm.page.waitForTimeout(40);
    const r1 = await rm.page.evaluate(() => { const X = window.ApStatChiSquareLab; return { now: !X.busy() && JSON.stringify(X.S.D) === JSON.stringify(X.S.T), bad: window.__AGREE(), take: document.querySelector('.cs2 .tk2-cause').classList.contains('is-take') }; });
    await rm.page.selectOption('.cs2-sel', 'plants'); await rm.page.waitForTimeout(30);
    const fade = await rm.page.evaluate(() => document.querySelector('.cs2-scene').classList.contains('is-fade'));
    ok(r1.now && !r1.bad.length && r1.take && fade, `${tag} reduced motion: ${JSON.stringify(r1)} fade ${fade}`);
    await rm.browser.close();
  }
}

if (PERF) {
  const probe = async (page, fn) => {
    await page.evaluate(() => { window.__ft = []; window.__fon = true; let last = performance.now(); (function loop(t){ if (!window.__fon) return; window.__ft.push(t - last); last = t; requestAnimationFrame(loop); })(performance.now()); });
    await fn();
    const ft = (await page.evaluate(() => { window.__fon = false; return window.__ft.slice(2); })).sort((a, b) => a - b);
    const q = (p) => ft[Math.min(ft.length - 1, Math.floor(ft.length * p))];
    return `${ft.length} frames, median ${q(0.5).toFixed(1)} ms, p95 ${q(0.95).toFixed(1)} ms, max ${ft[ft.length - 1].toFixed(1)} ms`;
  };
  const drag = async (page, sel, dx, dy) => {
    const k = await page.evaluate((sel) => { const e = [...document.querySelectorAll(sel)].find(x => x.getBoundingClientRect().width > 0); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, sel);
    await page.mouse.move(k[0], k[1]); await page.mouse.down();
    for (let i = 0; i <= 24; i++) { await page.mouse.move(k[0] + dx * i / 24, k[1] + dy * i / 24); await page.waitForTimeout(16); }
    for (let i = 24; i >= 0; i--) { await page.mouse.move(k[0] + dx * i / 24, k[1] + dy * i / 24); await page.waitForTimeout(16); }
    await page.mouse.up(); await page.waitForTimeout(600);
  };
  for (const w of [390, 1440]) {
    for (const which of ['chi knob drag', 'chi chance table', 'FLAGSHIP fertilizer']) {
      const browser = await chromium.launch({ executablePath: EXE });
      const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, serviceWorkers: 'block' });
      await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
      const page = await ctx.newPage();
      await page.addInitScript(() => { window.LevlToolTest = 1; localStorage.setItem('tk2c:apstat-chi-square-lab', '1'); });
      const flag = /FLAG/.test(which);
      await page.goto(flag ? `http://localhost:${PORT}/environmental-science/tools/water-pollution.html` : URL0);
      if (flag) await page.waitForSelector('.tk2-knob', { state: 'attached', timeout: 15000 }); else await page.waitForSelector('.cs2-stk', { timeout: 15000 });
      await page.waitForTimeout(1200);
      const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      let res;
      if (flag) res = await probe(page, () => drag(page, '.tk2-knob', Math.min(260, w * 0.3), 0));
      else if (/chance/.test(which)) res = await probe(page, async () => { for (let i = 0; i < 3; i++) { await page.click('.cs2-chance'); await page.waitForTimeout(900); } });
      else res = await probe(page, () => drag(page, '.cs2 .cs2-knob .tk2-knob', 0, w < 600 ? -30 : -60));
      console.log(`  perf ${w} ${which} (CPU x4): ${res}`);
      await browser.close();
    }
  }
  pass++;
}

server.close();
const label = ONE ? `width ${ONE}` : FRAMES ? 'frames' : 'perf';
fails.filter(Boolean).slice(0, 60).forEach(f => console.log('  FAIL ' + f));
console.log(`stat-chi-square-lab sweep ${label}: ${pass} passed, ${fails.filter(Boolean).length} failed`);
process.exit(fails.filter(Boolean).length ? 1 : 0);
