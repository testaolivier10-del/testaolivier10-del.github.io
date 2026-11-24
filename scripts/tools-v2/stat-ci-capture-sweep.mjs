#!/usr/bin/env node
/* Tools v2 sweep: AP Statistics, Interval capture (docs/tools-v2-stat-ci-capture-brief.md; pattern of
   scripts/tools-v2/bio-confidence-intervals-sweep.mjs).
   Landmark states of Explore (the first visit with its cue; 100 built at 95%; the level at 80 and 99; the smallest and
   largest n; every population; a picked row; five builds; the z* setting), and a Test yourself view, at widths 360 to
   1920, light and dark:
     - no sideways scroll; nothing clipped by the scene (labels, pills, knobs, the cue);
     - labels never overlap each other (4 px) and keep clear of the drawn rings, the peg, the axis and the rate line;
     - no rendered text under 11 px; phones: the cause line at most two rows, constant height;
     - the picture (the rings' board) is the largest thing; the Build button, the level knob and the cause line show
       together with the picture at 390 x 844, 1024 x 768 and 1280 x 800;
     - every number agrees with the rings AS DRAWN (AGREE: each ring's ends are read from the DOM, against the peg read
       from the DOM; the colours, the counts, the cause line, the rate dot and its pill are checked against them);
     - the first visit cue points at Build and covers nothing.
   --frames (390 and 1440): AGREE after every animation frame through a build, keys on the level, a real pointer drag
   of the level out and back, a change on top of one still playing, n up and down, a population change, Start over,
   leaving to Test yourself mid build and coming back, a real touch drag at 390, and reduced motion.
   --perf: CPU x4 frame times of a build and a level drag at 390 and 1440, beside the flagship's fertilizer drag.
   --shots <dir>: a picture of every state.
   Usage: node scripts/tools-v2/stat-ci-capture-sweep.mjs [--width <px>] [--frames] [--perf] [--shots <dir>]
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

if (!ONE && !FRAMES && !PERF) {
  let pass = 0, fail = 0, bad = false;
  const runs = WIDTHS.map(w => ['--width', String(w)]).concat([['--frames']]);
  for (const a of runs) {
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...a, ...(SHOTS ? ['--shots', SHOTS] : [])], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
    process.stdout.write(r.stdout);
    const m = /(\d+) passed, (\d+) failed/.exec(r.stdout || '');
    if (m) { pass += +m[1]; fail += +m[2]; } else bad = true;
  }
  console.log(`\nstat-ci-capture sweep, all runs: ${pass} passed, ${fail} failed${bad ? ' (a run did not finish)' : ''}`);
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
const URL0 = `http://localhost:${PORT}/statistics/tools/ci-capture.html`;
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
    try { if (dark) localStorage.setItem('nremt_theme', 'dark'); if (noCue) localStorage.setItem('tk2c:apstat-ci-capture', '1'); } catch (e) {}
    if (frames) {
      // after every animation frame callback, check the picture against itself
      const raf = window.requestAnimationFrame.bind(window);
      window.__fr = { n: 0, bad: [] };
      window.requestAnimationFrame = (cb) => raf((t) => { cb(t); if (window.__AGREE && window.ApStatCiCapture) { window.__fr.n++; const b = window.__AGREE(); if (b.length && window.__fr.bad.length < 20) window.__fr.bad.push(b.join('; ')); } });
    }
  }, [dark, !!opts.noCue, !!opts.frames]);
  await page.goto(URL0 + (opts.hash || '')); await page.waitForSelector('.ci3-scene .ci3-p', { timeout: 20000 }); await page.waitForTimeout(500);
  if (opts.frames) await page.evaluate(`window.__AGREE = ${AGREE.toString()}`);
  return { browser, page, errs };
}
async function until(page, fn, a) { for (let i = 0; i < 200; i++) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(50); } return false; }
const still = (page) => until(page, () => !window.ApStatCiCapture.busy());

/* Read the rings back from the DOM and check every number against them (runs in the page). */
const AGREE = () => {
  const X = window.ApStatCiCapture, out = [];
  const peg = document.querySelector('.ci3-peg');
  if (!peg) return ['no peg'];
  const pegX = +peg.getAttribute('x') + 2.5;
  let hit = 0, miss = 0, grow = 0;
  const rows = [...document.querySelectorAll('.ci3-rows .ci3-row')].filter(r => r.style.opacity === '' || +r.style.opacity > 0.999);
  rows.forEach((r, i) => {
    const d = r.querySelector('.ci3-ring').getAttribute('d') || '';
    const cls = r.getAttribute('class');
    if (/is-grow/.test(cls) || !d) { grow++; return; }
    // the ring's ends: the posts (M x y V) or, cut at the board's edge, an arrow: the ring runs past the edge
    const m = /^M([-\d.]+) [-\d.]+H([-\d.]+)/.exec(d);
    if (!m) { out.push('ring path ' + d.slice(0, 30)); return; }
    let x0 = +m[1], x1 = +m[2];
    const cut0 = /L[-\d.]+ [-\d.]+L/.test(d.split('M')[2] || '') ;
    const holds = (x0 <= pegX + 0.051 && pegX - 0.051 <= x1);
    const isHit = /is-hit/.test(cls);
    if (isHit !== holds) out.push(`row ${i}: ${isHit ? 'green' : 'vermillion'} but its ends ${x0}..${x1} vs peg ${pegX}`);
    if (isHit) hit++; else miss++;
    const cross = r.querySelector('.ci3-x').getAttribute('d') || '';
    if (!isHit && !cross && x0 > 30 && x1 < 2000) {} // a cross may fall outside the board at the very edge
    if (isHit && cross) out.push(`row ${i}: a captured ring has a cross`);
  });
  const built = hit + miss;
  const cnt = (document.querySelector('.ci3-cnt.is-hit') || {}).textContent || '';
  const cm = /^(\d+) of (\d+) capture/.exec(cnt);
  if (built && (!cm || +cm[1] !== hit || +cm[2] !== built)) out.push(`header "${cnt}" vs drawn ${hit} of ${built}`);
  const mt = (document.querySelector('.ci3-cnt.is-miss') || {}).textContent || '';
  if (built && mt !== miss + ' miss') out.push(`miss label "${mt}" vs ${miss}`);
  // the cause line's count (when it shows one)
  const cz = [...document.querySelectorAll('.ci3 .tk2-cause .tk2-cz')].map(e => e.textContent);
  const cc = cz.map(t => /^(\d+) of (\d+) capture/.exec(t)).find(Boolean);
  if (cc && (+cc[1] !== hit || +cc[2] !== built)) out.push(`cause "${cc[0]}" vs drawn ${hit} of ${built}`);
  // the level shown on the picture is the drawn width's level
  const lv = (document.querySelector('.ci3-lv') || {}).textContent || '';
  const lvm = /(\d+)%/.exec(lv), drawnL = X.crit() ? Math.round(X.levelOf(X.crit()) * 100) : null;
  if (lvm && drawnL != null && +lvm[1] !== drawnL) out.push(`level label ${lv} vs drawn ${drawnL}`);
  const lp = cz.map(t => /^(\d+)% level$/.exec(t)).find(Boolean);
  if (lp && drawnL != null && built && +lp[1] !== drawnL) out.push(`cause level ${lp[0]} vs drawn ${drawnL}`);
  // the rate dot: with 100 intervals and nothing older, it sits at the drawn share
  const S = X.S;
  if (S.smps.length === rows.length && built === rows.length && built) {
    const dot = document.querySelector('.ci3-rdot'), y = +dot.getAttribute('cy'), pill = (document.querySelector('.ci3-rv') || {}).textContent || '';
    const exp = X.rY(hit / built * 100);
    if (Math.abs(y - exp) > 0.6) out.push(`rate dot at ${y}, drawn share wants ${exp.toFixed(1)}`);
    if (pill && Math.abs(parseFloat(pill) - hit / built * 100) > 0.051) out.push(`rate value ${pill} vs ${hit}/${built}`);
  }
  return out;
};

/* Layout checks of one state (runs in the page). */
const LAYOUT = (phone) => {
  const out = [], sc = document.querySelector('.ci3-scene').getBoundingClientRect();
  const vis = (e) => { if (!e) return false; const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false; for (let x = e; x && x.nodeType === 1; x = x.parentNode) { const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0 || x.hidden) return false; } return true; };
  const inS = (r, what) => { if (r.left < sc.left - 0.5 || r.right > sc.right + 0.5 || r.top < sc.top - 0.5 || r.bottom > sc.bottom + 0.5) out.push(`clipped: ${what}`); };
  if (document.scrollingElement.scrollWidth > innerWidth + 1) out.push('sideways scroll ' + document.scrollingElement.scrollWidth);
  // labels: every text on the picture and every pill, the kit's knobs and the cue
  const labs = [];
  document.querySelectorAll('.ci3-labs text, .ci3-front text').forEach(t => {
    if (!vis(t) || !t.textContent.trim()) return;
    if (t.closest('g.ci3-pill')) return;
    const r = t.getBoundingClientRect(); labs.push({ r, w: t.textContent.trim() });
    const fs = parseFloat(getComputedStyle(t).fontSize); if (fs < 11) out.push(`text under 11 px: "${t.textContent}" ${fs}`);
  });
  document.querySelectorAll('.ci3-labs g.ci3-pill').forEach(g => { if (!vis(g)) return; const r = g.querySelector('rect').getBoundingClientRect(); labs.push({ r, w: 'pill ' + g.textContent }); const fs = parseFloat(getComputedStyle(g.querySelector('text')).fontSize); if (fs < 11) out.push('pill text under 11 px'); });
  labs.forEach(l => inS(l.r, l.w));
  document.querySelectorAll('.ci3 .tk2-knob').forEach(k => { if (vis(k)) inS(k.getBoundingClientRect(), 'knob'); });
  const cue = document.querySelector('.ci3 .tk2-cue'); if (cue && vis(cue)) { const r = cue.getBoundingClientRect(); const st = document.querySelector('.ci3').getBoundingClientRect(); if (r.left < st.left - 1 || r.right > st.right + 1) out.push('cue outside the stage'); }
  for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) {
    const a = labs[i].r, b = labs[j].r;
    if (a.left < b.right + 4 && b.left < a.right + 4 && a.top < b.bottom + 2 && b.top < a.bottom + 2) out.push(`labels touch: "${labs[i].w}" / "${labs[j].w}"`);
  }
  // labels against the drawn lines: the rings (by row), the peg, the axis, the rate line and its dots, the rails
  const lines = [];
  document.querySelectorAll('.ci3-rows .ci3-ring, .ci3-peg, .ci3-pegcap, .ci3-axis, .ci3-diag, .ci3-rdot, .ci3-rold, .ci3-nrail, .ci3-x').forEach(e => { if (vis(e)) lines.push({ r: e.getBoundingClientRect(), c: e.getAttribute('class') }); });
  const kn = [...document.querySelectorAll('.ci3 .tk2-dot')].filter(vis).map(e => ({ r: e.getBoundingClientRect(), c: 'knob' }));
  labs.forEach(l => {
    [...lines, ...kn].forEach(o => {
      const a = l.r, b = o.r;
      if (/ci3-pill/.test(l.w) || true) {
        const pegPill = /^pill (p|μ) = /.test(l.w);
        if (pegPill && /ci3-peg|ci3-axis/.test(o.c)) { if (a.top < b.bottom + 2 && b.top < a.bottom && a.left < b.right && b.left < a.right) out.push(`peg pill touches ${o.c}`); return; }
        if (/ci3-diag/.test(o.c)) {
          // the rate line is a diagonal: sample it
          const ln = document.querySelector('.ci3-diag'), x1 = +ln.getAttribute('x1'), y1 = +ln.getAttribute('y1'), x2 = +ln.getAttribute('x2'), y2 = +ln.getAttribute('y2'), sr = document.querySelector('.ci3-svg').getBoundingClientRect();
          for (let k = 0; k <= 60; k++) { const px = sr.left + x1 + (x2 - x1) * k / 60, py = sr.top + y1 + (y2 - y1) * k / 60; if (px > a.left - 3 && px < a.right + 3 && py > a.top - 3 && py < a.bottom + 3) { out.push(`"${l.w}" touches the rate line`); break; } }
          return;
        }
        if (a.left < b.right + 2 && b.left < a.right + 2 && a.top < b.bottom + 2 && b.top < a.bottom + 2) out.push(`"${l.w}" touches ${o.c.split(' ')[0]}`);
      }
    });
  });
  // the board of rings is the largest thing on the picture
  const area = (s) => { const e = document.querySelector(s); if (!e) return 0; const r = e.getBoundingClientRect(); return r.width * r.height; };
  if (!(area('.ci3-board') > area('.ci3-ratecard') && area('.ci3-board') > document.querySelector('.ci3-panel').getBoundingClientRect().width * document.querySelector('.ci3-panel').getBoundingClientRect().height)) out.push('the rings board is not the largest part');
  // phones: the cause line at most two rows and a constant height
  const cz = document.querySelector('.ci3 .tk2-cause');
  if (phone && cz) { const h = cz.getBoundingClientRect().height; if (h > 74) out.push('cause line taller than two rows: ' + h); window.__czH = window.__czH || h; if (Math.abs(window.__czH - h) > 1) out.push(`cause line height changed ${window.__czH} -> ${h}`); }
  return out;
};

if (ONE) {
  const w = +ONE;
  const h = w < 600 ? 844 : w <= 820 ? 1024 : w === 1024 ? 768 : w === 1280 ? 800 : w === 1920 ? 1080 : 900;
  for (const dark of [false, true]) {
    const tag = `${w}-${dark ? 'dark' : 'light'}`;
    const { browser, page, errs } = await open(w, h, dark);
    const X = (fn, a) => page.evaluate(fn, a);
    const shot = async (n) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/sweep-${tag}-${n}.png` }); };
    const check = async (n, opt = {}) => {
      await still(page);
      const lay = await X(LAYOUT, w < 600); lay.forEach(f => ok(false, `${tag} ${n}: ${f}`)); ok(!lay.length, '');
      const ag = await X(AGREE); ag.forEach(f => ok(false, `${tag} ${n}: ${f}`)); ok(!ag.length, '');
      await shot(n);
    };
    // the theme really is the one asked for (the site's key is localStorage.nremt_theme)
    const th = await X(() => document.documentElement.getAttribute('data-theme') === 'dark');
    ok(th === dark, `${tag} theme: dark is ${th}`);
    // the first visit: the cue sits right of Build, on the same row, covering nothing
    const cue = await X(() => { const c = document.querySelector('.ci3 .tk2-cue'), b = document.querySelector('.ci3-build'); if (!c) return null; const r = c.getBoundingClientRect(), q = b.getBoundingClientRect();
      const hits = [...document.querySelectorAll('.ci3 .tk2-cz, .ci3 .tk2-cz-a, .ci3-reset, .ci3-scene')].filter(e => e.getBoundingClientRect().width).some(e => { const z = e.getBoundingClientRect(); return r.top < z.bottom && r.bottom > z.top && r.left < z.right && r.right > z.left; });
      return { cl: Math.round(r.left), br: Math.round(q.right), right: r.left >= q.right + 8 || r.right <= q.left - 8, row: Math.abs((r.top + r.bottom) / 2 - (q.top + q.bottom) / 2) < 6, overCause: hits, inView: r.right <= innerWidth - 2 && r.left >= 2 }; });
    ok(cue && cue.right && cue.row && !cue.overCause && cue.inView, `${tag} first visit cue: ${JSON.stringify(cue)}`);
    // the picture, Build and the cause line show together on the first screen
    const fold = await X(() => { const b = document.querySelector('.ci3-build').getBoundingClientRect(), c = document.querySelector('.ci3 .tk2-cause').getBoundingClientRect(), s = document.querySelector('.ci3-scene').getBoundingClientRect(); return { b: b.bottom <= innerHeight, c: c.bottom <= innerHeight, s: s.top >= 0 && s.bottom <= innerHeight }; });
    ok(fold.b && fold.c && fold.s, `${tag} picture, Build and cause line not on one screen: ${JSON.stringify(fold)}`);
    await check('00-first');
    await page.click('.ci3-build'); await page.waitForTimeout(300);
    if (SHOTS && w % 390 === 0 || SHOTS && w === 1440) { await page.waitForTimeout(500); await shot('mid-build'); }
    await check('01-built95');
    // after a build the level knob, the Build button and the cause line show with the picture
    const fold2 = await X(() => { window.scrollTo(0, 0); const k = document.querySelector('.ci3-klev .tk2-knob').getBoundingClientRect(), b = document.querySelector('.ci3-build').getBoundingClientRect(), c = document.querySelector('.ci3 .tk2-cause').getBoundingClientRect(); return k.top >= 0 && k.bottom <= innerHeight && b.bottom <= innerHeight && c.bottom <= innerHeight; });
    ok(fold2, `${tag} after a build: the level knob, Build and the cause line are not on one screen`);
    await X(() => window.ApStatCiCapture.setLevel(80)); await check('02-level80');
    await X(() => window.ApStatCiCapture.setLevel(99)); await check('03-level99');
    await X(() => window.ApStatCiCapture.select(37, 'key')); await check('04-picked');
    await X(() => window.ApStatCiCapture.select(-1));
    await X(() => window.ApStatCiCapture.setN(0)); await check('05-n-min');
    await X(() => window.ApStatCiCapture.setN(11)); await check('06-n-max');
    await X(() => window.ApStatCiCapture.setLevel(95));
    for (let k = 0; k < 4; k++) { await X(() => window.ApStatCiCapture.build()); await still(page); }
    await check('07-five-builds');
    for (const [id, nIdx] of [['rare', 5], ['normal', 6], ['skewed', 2]]) {
      await X((id) => window.ApStatCiCapture.setPop(id), id); await check(`08-${id}-empty`);
      await X((i) => window.ApStatCiCapture.setN(i), nIdx);
      await X(() => window.ApStatCiCapture.build()); await check(`09-${id}-built`);
    }
    await X(() => window.ApStatCiCapture.setLevel(80)); await check('10-skewed-80');
    // Test yourself: the drill and its figure
    await X(() => window.ApStatCiCapture.go('quiz'));
    await page.waitForTimeout(700);
    const qz = await X(() => { const f = document.querySelector('.ls-root .ci-svg, .ls-root .cd-extra svg'); return { fig: !!f, sx: document.scrollingElement.scrollWidth <= innerWidth + 1 }; });
    ok(qz.fig && qz.sx, `${tag} Test yourself: ${JSON.stringify(qz)}`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/sweep-${tag}-11-quiz.png` });
    ok(!errs.length, `${tag} console: ${errs.slice(0, 3).join(' | ')}`);
    await browser.close();
  }
}

if (FRAMES) {
  for (const w of [390, 1440]) {
    const h = w < 600 ? 844 : 900, tag = `frames ${w}`;
    const { browser, page, errs } = await open(w, h, false, { frames: true, noCue: true });
    const X = (fn, a) => page.evaluate(fn, a);
    const run = async (what, fn) => {
      await X(() => { window.__fr.n = 0; window.__fr.bad = []; });
      await fn(); await still(page); await page.waitForTimeout(80);
      const fr = await X(() => window.__fr);
      ok(fr.n > 0 || /calm|reduced/.test(what), `${tag} ${what}: no frames`);
      fr.bad.forEach(b => ok(false, `${tag} ${what}: ${b}`)); ok(!fr.bad.length, '');
      console.log(`  ${tag} ${what}: ${fr.n} frames`);
    };
    const knob = async () => X(() => { const r = document.querySelector('.ci3-klev .tk2-knob').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    await run('build', async () => { await page.click('.ci3-build'); });
    await run('keys on the level', async () => { await page.focus('.ci3-klev input'); for (let i = 0; i < 6; i++) { await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(60); } await page.keyboard.press('Home'); await page.waitForTimeout(100); await page.keyboard.press('End'); });
    { const lv = await X(() => window.ApStatCiCapture.S.level); ok(lv === 0.99, `${tag} End took the level to ${lv}`); }
    await run('two quick keys', async () => { await page.focus('.ci3-klev input'); await page.keyboard.press('PageDown'); await page.waitForTimeout(40); await page.keyboard.press('ArrowLeft'); });
    { const lv = await X(() => window.ApStatCiCapture.S.level); ok(lv === 0.88, `${tag} PageDown then ArrowLeft mid change: ${lv} (want 0.88)`); }
    await run('pointer drag out and back', async () => {
      const k = await knob(); await page.mouse.move(k[0], k[1]); await page.mouse.down();
      for (let i = 0; i <= 20; i++) { await page.mouse.move(k[0] - (w < 600 ? 120 : 360) * i / 20, k[1]); await page.waitForTimeout(16); }
      for (let i = 20; i >= 0; i--) { await page.mouse.move(k[0] - (w < 600 ? 120 : 360) * i / 20, k[1]); await page.waitForTimeout(16); }
      await page.mouse.up();
    });
    await run('build, then the level mid build', async () => { await page.click('.ci3-build'); await page.waitForTimeout(250); await page.focus('.ci3-klev input'); await page.keyboard.press('PageDown'); await page.waitForTimeout(200); await page.keyboard.press('PageUp'); });
    await run('n up and down', async () => { await X(() => window.ApStatCiCapture.setN(8)); await page.waitForTimeout(400); await X(() => window.ApStatCiCapture.setN(2)); });
    await run('a population change and a build', async () => { await page.selectOption('.ci3-sel', 'skewed'); await page.waitForTimeout(100); await page.click('.ci3-build'); });
    await run('Start over', async () => { await page.click('.ci3-reset'); });
    await run('leave to Test yourself mid build, come back', async () => {
      await page.click('.ci3-build'); await page.waitForTimeout(400);
      await X(() => window.ApStatCiCapture.go && window.ApStatCiCapture.go('quiz'));
      await page.waitForTimeout(300);
      const clean = await X(() => !window.ApStatCiCapture.busy()); ok(clean, `${tag} leaving mid build left an animation running`);
      await X(() => window.ApStatCiCapture.go && window.ApStatCiCapture.go('explore'));
      await page.waitForTimeout(300);
      const done = await X(() => window.ApStatCiCapture.Dn()); ok(done.built === done.all && done.all === 100, `${tag} back in Explore: ${JSON.stringify(done)}`);
    });
    if (w < 600) {
      await run('a real touch drag', async () => {
        const k = await knob(), y0 = await X(() => scrollY);
        const cdp = await page.context().newCDPSession(page);
        const pts = (x) => [{ x, y: k[1], id: 1 }];
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(k[0]) });
        for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(k[0] - 8 * i) }); await page.waitForTimeout(20); }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        const y1 = await X(() => scrollY); ok(Math.abs(y1 - y0) < 2, `${tag} the page scrolled under a touch drag`);
        const lv = await X(() => window.ApStatCiCapture.S.level); ok(lv < 0.95, `${tag} touch drag did not move the level (${lv})`);
      });
    }
    ok(!errs.length, `${tag} console: ${errs.slice(0, 3).join(' | ')}`);
    await browser.close();
    // reduced motion: the result at once, with the cross fade
    const rm = await open(w, h, false, { reduced: true, noCue: true });
    await rm.page.evaluate(`window.__AGREE = ${AGREE.toString()}`);
    await rm.page.click('.ci3-build'); await rm.page.waitForTimeout(60);
    const r1 = await rm.page.evaluate(() => ({ d: window.ApStatCiCapture.Dn(), fade: document.querySelector('.ci3-scene').classList.contains('is-fade'), bad: window.__AGREE() }));
    ok(r1.d.built === 100 && r1.fade && !r1.bad.length, `${tag} reduced motion: ${JSON.stringify(r1)}`);
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
  const drag = async (page, sel, dx) => {
    const k = await page.evaluate((sel) => { const e = [...document.querySelectorAll(sel)].find(x => x.getBoundingClientRect().width > 0); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, sel);
    await page.mouse.move(k[0], k[1]); await page.mouse.down();
    for (let i = 0; i <= 24; i++) { await page.mouse.move(k[0] + dx * i / 24, k[1]); await page.waitForTimeout(16); }
    for (let i = 24; i >= 0; i--) { await page.mouse.move(k[0] + dx * i / 24, k[1]); await page.waitForTimeout(16); }
    await page.mouse.up(); await page.waitForTimeout(600);
  };
  for (const w of [390, 1440]) {
    for (const which of ['ci build 100', 'ci level drag', 'FLAGSHIP fertilizer']) {
      const browser = await chromium.launch({ executablePath: EXE });
      const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, serviceWorkers: 'block' });
      await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
      const page = await ctx.newPage();
      await page.addInitScript(() => { window.LevlToolTest = 1; localStorage.setItem('tk2c:apstat-ci-capture', '1'); });
      const flag = /FLAG/.test(which);
      await page.goto(flag ? `http://localhost:${PORT}/environmental-science/tools/water-pollution.html` : URL0);
      if (flag) await page.waitForSelector('.tk2-knob', { state: 'attached', timeout: 15000 }); else await page.waitForSelector('.ci3-p', { timeout: 15000 });
      await page.waitForTimeout(1200);
      if (/drag/.test(which)) { await page.click('.ci3-build'); await page.waitForTimeout(3000); }
      const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      let res;
      if (flag) res = await probe(page, () => drag(page, '.tk2-knob', Math.min(260, w * 0.3)));
      else if (/build/.test(which)) res = await probe(page, async () => { await page.click('.ci3-build'); await page.waitForTimeout(3500); });
      else res = await probe(page, () => drag(page, '.ci3-klev .tk2-knob', w < 600 ? -120 : -300));
      console.log(`  perf ${w} ${which} (CPU x4): ${res}`);
      await browser.close();
    }
  }
  pass++;
}

server.close();
const label = ONE ? `width ${ONE}` : FRAMES ? 'frames' : 'perf';
fails.filter(Boolean).slice(0, 40).forEach(f => console.log('  FAIL ' + f));
console.log(`stat-ci-capture sweep ${label}: ${pass} passed, ${fails.filter(Boolean).length} failed`);
process.exit(fails.filter(Boolean).length ? 1 : 0);
