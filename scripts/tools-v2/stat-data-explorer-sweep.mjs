#!/usr/bin/env node
/* Tools v2 sweep: AP Statistics, Data explorer (docs/tools-v2-stat-data-explorer-brief.md; pattern of
   scripts/tools-v2/stat-design-randomizer-sweep.mjs).
   Landmark states of Explore (the first visit with its cue; one person dragged far; a tapped person; the ± 1 SD band;
   people added and removed; 40 and 5 people; every data set; the boxplot tab with an outlier made and unmade, a picked
   person, the narrowest and widest bins; Start over) and Test yourself, at widths 360 to 1920, light and dark:
     - no sideways scroll; nothing clipped by the scene (labels, pills, the knob's tag, the cue);
     - labels never touch each other (4 px), the people, the knob or a post; no rendered text under 11 px; phones: the
       cause line at most two rows, constant height;
     - the plank and its people are the largest part of the picture; the picture, the knob and the cause line show
       together at 390 x 844, 1024 x 768, 1280 x 800 (and 375 x 667, 360 x 740 on the landing), no inner scroll;
     - every number agrees with the picture AS DRAWN (AGREE: each person's value is read back from where they stand;
       the mean mark, the wedge and the tilt, the flag, the SD band, the crate, the median slat, the posts, the rings,
       the outlier dots, the bars and every label and cause line pill are checked against those values);
     - "?" is filled on a fresh page and follows every change.
   --frames (390 and 1440): AGREE after every animation frame through a real pointer drag out and back, fast reversals,
   keys, add and remove, Start over, a data set change, the tab change, the SD band, a drag that makes an outlier,
   the bin knob, leaving to Test yourself mid change and back, a real touch drag at 390 (the page does not scroll), and
   reduced motion.
   --perf: CPU x4 frame times of a person dragged out and back at 390 and 1440, beside the flagship's fertilizer drag.
   --shots <dir>: a picture of every state.
   Usage: node scripts/tools-v2/stat-data-explorer-sweep.mjs [--width <px> [--height <px>]] [--frames] [--perf] [--shots <dir>]
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
  console.log(`\nstat-data-explorer sweep, all runs: ${pass} passed, ${fail} failed${bad ? ' (a run did not finish)' : ''}`);
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
  // the flagship (Premium) is unlocked for the perf run only, in this test (never committed): has() answers yes
  if (p === '/assets/premium.js' && PERF) { res.writeHead(200, { 'Content-Type': MIME['.js'] }); res.end(readFileSync(file, 'utf8').replace('function has(course) {', 'function has(course) { return true;')); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }); createReadStream(file).pipe(res);
});
await new Promise(ok => server.listen(0, ok));
const PORT = server.address().port;
const URL0 = `http://localhost:${PORT}/statistics/tools/data-explorer.html`;
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
    try { if (dark) localStorage.setItem('nremt_theme', 'dark'); if (noCue) localStorage.setItem('tk2c:apstat-data-explorer', '1'); } catch (e) {}
    if (frames) {
      const raf = window.requestAnimationFrame.bind(window);
      window.__fr = { n: 0, bad: [] };
      window.requestAnimationFrame = (cb) => raf((t) => { cb(t); if (window.__AGREE && window.ApStatDataExplorer) { window.__fr.n++; const b = window.__AGREE(); if (b.length && window.__fr.bad.length < 20) window.__fr.bad.push(b.join('; ')); } });
    }
  }, [dark, !!opts.noCue, !!opts.frames]);
  await page.goto(URL0 + (opts.hash || '')); await page.waitForSelector('.dx2-scene .dx2-p', { timeout: 20000 }); await page.waitForTimeout(500);
  if (opts.frames) await page.evaluate(`window.__AGREE = ${AGREE.toString()}`);
  return { browser, page, errs };
}
async function until(page, fn, a) { for (let i = 0; i < 240; i++) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(50); } return false; }
const still = (page) => until(page, () => !window.ApStatDataExplorer.busy());

/* Read the picture back from the DOM and check every number against it (runs in the page). */
const AGREE = () => {
  const X = window.ApStatDataExplorer, out = [], G = X.G(), lo = X.lo(), hi = X.hi(), step = X.S.set.step || 1, MX = window.ApStatMath.dataExplorer;
  if (!G) return out;
  const upp = (hi - lo) / (G.r - G.l);                // units per picture px
  const vx = x => lo + (x - G.l) * upp, xv = v => G.l + (v - lo) / upp;
  const snap = v => Math.min(hi, Math.max(lo, Math.round(v / step) * step));
  const nums = t => (String(t).replace(/−/g, '-').match(/-?\d+(\.\d+)?/g) || []).map(Number);
  const tab = document.querySelector('.dx2-scene').getAttribute('data-tab');
  const busy = X.busy(), take = document.querySelector('.dx2 .tk2-cause').classList.contains('is-take');
  // the people: a person counts when fully there (no fade); their value is where they stand
  const ppl = [...document.querySelectorAll('.dx2-people .dx2-p')], vals = [], byEl = new Map();
  ppl.forEach(g => { if (g.style.opacity !== '') return; const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(g.getAttribute('transform') || ''); if (!m) return; const v = snap(vx(+m[1])); vals.push(v); byEl.set(g, v); });
  if (vals.length < 2) return ['fewer than two people drawn'];
  const S = MX.stats(vals);
  const cz = [...document.querySelectorAll('.dx2 .tk2-cause .tk2-cz')].map(e => e.textContent).filter(t => t.indexOf('…') < 0);
  const still = (e) => !e.classList.contains('is-moving');
  const near = (a, b, tol, what) => { if (!(Math.abs(a - b) <= tol)) out.push(`${what}: ${(+a).toFixed(3)} vs ${(+b).toFixed(3)}`); };
  const pxTol = upp * 0.8 + 1e-6;
  const nLab = document.querySelector('.dx2-n').textContent, nn = nums(nLab);
  if (!busy && nn[0] !== vals.length) out.push(`count "${nLab}" vs ${vals.length} people`);
  // a stack's height is the count at that value: the levels at each value are 0, 1, ..., count − 1
  if (!busy) {
    const lh = X.levelH(), byV = {};
    byEl.forEach((v, g) => { const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(g.getAttribute('transform')); (byV[v] = byV[v] || []).push(Math.round((G.PY - +m[2]) / lh)); });
    Object.keys(byV).forEach(v => { const L = byV[v].sort((a, b) => a - b); if (L.some((l, i) => l !== i)) out.push(`value ${v}: ${L.length} people stand at levels ${L.join(',')}`); });
  }
  // no mark jumps: between two frames the flag, the crate's edges, the slat and the posts move at most 26 px
  if (window.__fr) {
    const key = tab + ':' + X.S.set.id + ':' + G.W + ':' + (window.__jumpReset || 0), xs = {};
    const ax = (sel, a) => { const e = document.querySelector(sel); if (e && e.style.display !== 'none' && e.getBoundingClientRect().width) xs[sel + a] = +e.getAttribute(a); };
    ax('.dx2-pole', 'x1'); ax('.dx2-crate', 'x'); ax('.dx2-mslat', 'x1'); document.querySelectorAll('.dx2-post').forEach((e, k) => { if (e.style.display !== 'none' && e.getBoundingClientRect().width) xs['post' + k] = +e.getAttribute('x'); });
    const c = document.querySelector('.dx2-crate'); if (c && c.getBoundingClientRect().width) xs.crateR = +c.getAttribute('x') + +c.getAttribute('width');
    const pv = window.__marks; if (pv && pv.key === key) Object.keys(xs).forEach(k => { if (k in pv.xs && Math.abs(xs[k] - pv.xs[k]) > 26) out.push(`${k} jumped ${Math.abs(xs[k] - pv.xs[k]).toFixed(1)} px in one frame`); });
    window.__marks = { key, xs };
  }
  if (tab === 'mean') {
    const tri = document.querySelector('.dx2-tri'), tm = /^M([-\d.]+) /.exec(tri.getAttribute('d'));
    const vMean = vx(+tm[1] + 7); near(vMean, S.mean, pxTol, 'mean mark vs the people');
    const mt = document.querySelector('.dx2-mpill text').textContent; near(nums(mt)[0], S.mean, 0.051, `"${mt}" vs the people's mean`);
    const pole = document.querySelector('.dx2-pole'), vMed = vx(+pole.getAttribute('x1'));
    const cte = document.querySelector('.dx2-clotht'), ct = cte.textContent; if (still(cte)) near(nums(ct)[0], vMed, pxTol + 0.006, `flag "${ct}" vs its pole`);
    if (!busy) near(nums(ct)[0], S.med, 0.006, `flag "${ct}" at rest vs the median`);
    // the tilt and the wedge
    const tr = document.querySelector('.dx2-tilt').getAttribute('transform') || '', rm = /rotate\(([-\d.]+) ([-\d.]+)/.exec(tr), th = rm ? +rm[1] : 0;
    const wm = /translate\(([-\d.]+)/.exec(document.querySelector('.dx2-wedge').getAttribute('transform') || ''), vF = wm ? vx(+wm[1]) : NaN;
    if (rm) near(+rm[2], +wm[1], 0.2, 'tilt pivot vs the wedge tip');
    if (Math.abs(th) > 0.15 && Math.sign(th) !== Math.sign(S.mean - vF)) out.push(`plank tips the wrong way: ${th} with mean ${S.mean} and wedge ${vF.toFixed(2)}`);
    // the tilt is the imbalance about the wedge's tip: proportional to (mean − tip), capped at 6 degrees
    const want = Math.max(-6, Math.min(6, 420 * (S.mean - vF) / (hi - lo)));
    if (Math.abs(th - want) > 0.25 + 42 * upp / (hi - lo)) out.push(`tilt ${th} vs the imbalance ${want.toFixed(3)} (mean ${S.mean.toFixed(3)}, tip ${vF.toFixed(3)})`);
    if (!busy) { if (Math.abs(th) > 0.001) out.push('tilted at rest ' + th); near(vF, S.mean, pxTol, 'wedge at rest vs the mean'); }
    // the SD band
    const band = document.querySelector('.dx2-band'), br = document.querySelector('.dx2-sdr');
    if (band.style.display !== 'none' && br && document.querySelector('.dx2-sdl') && document.querySelector('.dx2-sdl').style.display !== 'none' && !busy) {
      near(vx(+br.getAttribute('x')), Math.max(lo, S.mean - S.sd), pxTol, 'SD band left'); near(vx(+br.getAttribute('x') + +br.getAttribute('width')), Math.min(hi, S.mean + S.sd), pxTol * 1.5, 'SD band right');
    }
    if (!take) {
      const c0 = cz[0] || '';
      if (/students|adults|people/.test(c0) && !/→/.test(c0)) { if (nums(c0)[0] !== vals.length) out.push(`cause "${c0}" vs ${vals.length} people`); }
      cz.forEach(t => {
        if (/^mean /.test(t)) { const n = nums(t); near(n[n.length - 1], S.mean, 0.051, `cause "${t}"`); }
        if (/^median /.test(t) && still(cte)) { const n = nums(t); near(n[n.length - 1], nums(ct)[0], 0.006, `cause "${t}" vs the flag`); }
        if (/^SD /.test(t)) near(nums(t)[0], S.sd, 0.051, `cause "${t}"`);
        if (/^z = /.test(t)) { const v = nums(c0)[0]; near(nums(t)[0], (v - S.mean) / S.sd, 0.006, `cause "${t}" for ${v}`); }
      });
      if (/→/.test(c0)) { const v1 = nums(c0)[1], cur = X.S.cur && byEl.get(X.S.cur.el); if (Math.abs(v1 - cur) > 1e-6) out.push(`cause "${c0}" vs the moved person at ${cur}`); if (!vals.includes(v1)) out.push(`cause "${c0}": nobody stands at ${v1}`); }
    }
  } else {
    const vNum = (sel) => { const e = document.querySelector(sel); return e ? nums(e.textContent)[0] : NaN; };
    const crate = document.querySelector('.dx2-crate'), cq1 = vx(+crate.getAttribute('x')), cq3 = vx(+crate.getAttribute('x') + +crate.getAttribute('width'));
    const q1L = [...document.querySelectorAll('.dx2-qlab')].find(e => /^Q1/.test(e.textContent)), q3L = [...document.querySelectorAll('.dx2-qlab')].find(e => /^Q3/.test(e.textContent));
    const q1 = still(q1L) ? nums(q1L.textContent)[1] : cq1, q3 = still(q3L) ? nums(q3L.textContent)[1] : cq3;
    near(q1, cq1, pxTol + 0.006, 'Q1 label vs the crate'); near(q3, cq3, pxTol * 1.5 + 0.006, 'Q3 label vs the crate');
    const mle = document.querySelector('.dx2-qlab.is-med'), ms = vx(+document.querySelector('.dx2-mslat').getAttribute('x1')), ml = still(mle) ? vNum('.dx2-qlab.is-med') : ms; near(ml, ms, pxTol + 0.006, 'median label vs its slat');
    if (!busy) { near(q1, S.q1, 0.006, 'Q1 at rest'); near(q3, S.q3, 0.006, 'Q3 at rest'); near(ml, S.med, 0.006, 'median at rest'); }
    // posts and signs
    const fen = [0, 1].map(k => { const sg = document.querySelectorAll('.dx2-sign')[k], post = document.querySelectorAll('.dx2-post')[k];
      if (!still(sg)) return post && post.style.display !== 'none' ? vx(+post.getAttribute('x') + 2.5) : (k ? X.Dr.f1 : X.Dr.f0);
      const t = sg.querySelector('text').textContent, f = nums(t)[0];
      if (post && post.style.display !== 'none') near(vx(+post.getAttribute('x') + 2.5), f, pxTol + 0.006, `post vs its sign "${t}"`);
      else if (f >= lo && f <= hi) out.push(`sign "${t}" on the scale but no post`);
      return f; });
    if (!busy) { near(fen[0], S.fences[0], 0.006, 'lower fence at rest'); near(fen[1], S.fences[1], 0.006, 'upper fence at rest'); }
    // the rings: an outlier ring exactly on the people past the posts as drawn
    let rings = 0;
    byEl.forEach((v, g) => { const out1 = g.classList.contains('is-out'), past = v < fen[0] - 1e-9 || v > fen[1] + 1e-9, edge = Math.min(Math.abs(v - fen[0]), Math.abs(v - fen[1])) < pxTol; if (out1) rings++; if (out1 !== past && !edge) out.push(`person at ${v}: ring ${out1} but past a post ${past} (fences ${fen})`); });
    const dots = [...document.querySelectorAll('.dx2-odot')].filter(e => e.style.display !== 'none');
    if (dots.length !== rings) out.push(`${dots.length} outlier dots vs ${rings} rings`);
    const ol = [...document.querySelectorAll('.dx2-olab')].filter(e => e.style.display !== 'none');
    if (rings && !ol.length) out.push('outliers drawn but not named'); if (!rings && ol.length) out.push('"outlier" named with no outlier');
    // the histogram
    const bt = document.querySelector('.dx2-htitle').textContent + ' ' + document.querySelector('.dx2-binl').textContent, B = nums(bt)[0];
    // the tool's bins: left edge in, but the last bin stops at the scale's maximum and holds it
    if (Math.abs((hi - lo) / B - Math.round((hi - lo) / B)) > 1e-9) out.push(`bins of ${B} do not split the scale ${lo} to ${hi} into equal bins`);
    const start = lo, nbin = Math.max(1, Math.round((hi - lo) / B)), H = { counts: new Array(nbin).fill(0) };
    vals.forEach(v => { const j = v >= hi - 1e-9 ? nbin - 1 : Math.floor((v - start) / B + 1e-9); if (j >= 0 && j < nbin) H.counts[j]++; });
    const bars = [...document.querySelectorAll('.dx2-bar')].filter(e => e.style.display !== 'none');
    bars.forEach(b => { const x0 = +b.getAttribute('x'), wd = +b.getAttribute('width'), x1 = x0 + wd; if (x0 < G.l - 1 || x1 > G.r + 1) out.push(`a bar runs past the scale (${x0.toFixed(1)} to ${x1.toFixed(1)})`); if (Math.abs(wd + 1.2 - B / upp) > 0.25) out.push(`a bar ${(wd + 1.2).toFixed(1)} px wide, not the bin width ${(B / upp).toFixed(1)} px`); });
    // every bar's count is written on it, and the counts add up to the people
    if (!busy) { const labs = [...document.querySelectorAll('.dx2-blab')].filter(e => e.style.display !== 'none').map(e => +e.textContent); const sum = labs.reduce((a, c) => a + c, 0); if (labs.length !== bars.length || sum !== vals.length) out.push(`bar counts shown ${labs.length} of ${bars.length}, adding to ${sum} for ${vals.length} people`); }
    const nz = H.counts.filter(c => c > 0);
    if (bars.length !== nz.length) out.push(`${bars.length} bars vs ${nz.length} bins with people`);
    else { const mx = Math.max(...H.counts), hmx = Math.max(...bars.map(b => +b.getAttribute('height'))); bars.forEach((b, i) => { const want = nz[i] / mx * hmx; if (Math.abs(+b.getAttribute('height') - want) > 0.6) out.push(`bar ${i} height vs its count ${nz[i]}`); }); }
    if (!take) {
      cz.forEach(t => {
        if (/^Q1 /.test(t)) { const n = nums(t); near(n[1], q1, 0.006, `cause "${t}"`); near(n[3], q3, 0.006, `cause "${t}"`); }
        if (/^IQR /.test(t)) near(nums(t)[0], q3 - q1, 0.011, `cause "${t}"`);
        if (/^fences /.test(t)) { const n = nums(t); near(n[0], fen[0], 0.006, `cause "${t}"`); near(n[1], fen[1], 0.006, `cause "${t}"`); }
        if (/outlier/.test(t) && !/not an outlier|^outlier$/.test(t)) { const n = /no outliers/.test(t) ? 0 : /^1 outlier/.test(t) ? 1 : nums(t)[0]; if (n !== rings) out.push(`cause "${t}" vs ${rings} rings`); }
        if (/1\.5 × IQR = /.test(t)) { const n = nums(t); const f = n[n.length - 1]; if (!fen.some(x => Math.abs(x - f) < 0.006)) out.push(`cause "${t}" vs the signs ${fen}`); }
      });
      const c0 = cz[0] || '', last = cz[cz.length - 1] || '';
      if (/ min| pts| bpm/.test(c0) && (last === 'outlier' || last === 'not an outlier')) {
        const v = nums(c0).pop(); const past = v < fen[0] - 1e-9 || v > fen[1] + 1e-9; if (past !== (last === 'outlier')) out.push(`cause "${c0} … ${last}" vs the fences ${fen}`);
      }
    }
  }
  return out;
};

/* Layout of the screen at rest (runs in the page). */
const LAYOUT = (phone) => {
  const out = [], sc = document.querySelector('.dx2-scene'), sr = sc.getBoundingClientRect();
  const vis = (e) => { if (!e || !e.getBoundingClientRect().width) return false; for (let n = e; n && n !== sc; n = n.parentNode) { if (n.style && n.style.display === 'none') return false; if (n.hidden) return false; } return true; };
  if (document.scrollingElement.scrollWidth > innerWidth + 1) out.push('sideways scroll');
  const inS = (r, w) => { if (r.left < sr.left - 0.5 || r.right > sr.right + 0.5 || r.top < sr.top - 0.5 || r.bottom > sr.bottom + 0.5) out.push(`clipped: ${w}`); };
  const labs = [];
  // label boxes: pills and the flag cloth as one box each; free text alone
  document.querySelectorAll('.dx2-mpill, .dx2-sign').forEach(g => { if (vis(g)) labs.push({ r: g.querySelector('rect').getBoundingClientRect(), w: g.textContent, k: 'pill' }); });
  const cl = document.querySelector('.dx2-cloth'); if (vis(cl)) labs.push({ r: cl.getBoundingClientRect(), w: document.querySelector('.dx2-clotht').textContent, k: 'flag' });
  document.querySelectorAll('.dx2-svg text').forEach(t => {
    if (!vis(t) || !t.textContent.trim()) return;
    const fs = parseFloat(getComputedStyle(t).fontSize); if (fs < 10.95) out.push(`text under 11 px: "${t.textContent}" ${fs}`);
    if (t.closest('.dx2-mpill, .dx2-sign') || t.classList.contains('dx2-clotht')) return;
    labs.push({ r: t.getBoundingClientRect(), w: t.textContent, k: t.getAttribute('class') });
  });
  const tag = document.querySelector('.dx2 .tk2-handle .tk2-tag'); if (tag && !tag.hidden && vis(tag)) labs.push({ r: tag.getBoundingClientRect(), w: 'knob tag ' + tag.textContent, k: 'tag' });
  labs.forEach(l => inS(l.r, l.w));
  const cue = document.querySelector('.dx2 .tk2-cue'); if (cue) inS(cue.getBoundingClientRect(), 'the cue');
  for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) {
    const a = labs[i].r, b = labs[j].r, gap = /dx2-num/.test(labs[i].k) && /dx2-num/.test(labs[j].k) ? 2 : 4;
    if (a.left < b.right + gap && b.left < a.right + gap && a.top < b.bottom + 2 && b.top < a.bottom + 2) out.push(`labels touch: "${labs[i].w}" / "${labs[j].w}"`);
  }
  // labels clear of the people, the knob, the posts (but a sign's own) and the outlier dots
  const obs = [];
  document.querySelectorAll('.dx2-people .dx2-p').forEach(g => { if (!vis(g) || g.style.opacity !== '') return; ['.dx2-body', '.dx2-head'].forEach(s => obs.push({ r: g.querySelector(s).getBoundingClientRect(), c: 'person' })); });
  const kd = document.querySelector('.dx2 .tk2-handle .tk2-dot'); if (kd && vis(kd)) obs.push({ r: kd.getBoundingClientRect(), c: 'knob' });
  const bd = document.querySelector('.dx2-binknob .tk2-dot'); if (bd && vis(bd)) obs.push({ r: bd.getBoundingClientRect(), c: 'bin knob' });
  document.querySelectorAll('.dx2-post').forEach(e => { if (vis(e)) obs.push({ r: e.getBoundingClientRect(), c: 'post' }); });
  document.querySelectorAll('.dx2-odot').forEach(e => { if (vis(e)) obs.push({ r: e.getBoundingClientRect(), c: 'outlier dot' }); });
  document.querySelectorAll('.dx2-crate').forEach(e => { if (vis(e)) obs.push({ r: e.getBoundingClientRect(), c: 'crate' }); });
  labs.forEach(l => obs.forEach(o => {
    if (o.c === 'post' && l.k === 'pill') return;      // a sign stands on its post
    if (o.c === 'knob' && l.k === 'tag') return;       // the knob's own tag
    if (o.c === 'person' && /dx2-num/.test(l.k)) return; // the numbers are on the plank under their feet
    const a = l.r, b = o.r;
    if (a.left < b.right + 1 && b.left < a.right + 1 && a.top < b.bottom + 1 && b.top < a.bottom + 1) out.push(`"${l.w}" touches a ${o.c}`);
  }));
  // the plank and its people are the largest part of the picture
  const area = s => { const e = document.querySelector(s); if (!e || !vis(e)) return 0; const r = e.getBoundingClientRect(); return r.width * r.height; };
  // the people (not their plank) are the largest drawing: against the boxplot and the histogram's bars
  const union = (sel) => { let r = null; document.querySelectorAll(sel).forEach(e => { if (!vis(e)) return; const q = e.getBoundingClientRect(); r = r ? { l: Math.min(r.l, q.left), t: Math.min(r.t, q.top), r: Math.max(r.r, q.right), b: Math.max(r.b, q.bottom) } : { l: q.left, t: q.top, r: q.right, b: q.bottom }; }); return r ? (r.r - r.l) * (r.b - r.t) : 0; };
  const main = area('.dx2-people'), bx = area('.dx2-boxp'), hb = union('.dx2-bar');
  if (!(main > bx && main > hb)) out.push(`the people (${main | 0}) are not the largest part (boxplot ${bx | 0}, histogram bars ${hb | 0})`);
  const cz = document.querySelector('.dx2 .tk2-cause');
  if (phone && cz) { const h = cz.getBoundingClientRect().height; if (h > 74) out.push('cause line taller than two rows: ' + h); window.__czH = window.__czH || h; if (Math.abs(window.__czH - h) > 1) out.push(`cause line height changed ${window.__czH} -> ${h}`); }
  // "?" is filled and follows the people
  const X = window.ApStatDataExplorer, S = X.stats(), ref = document.querySelector('.dx2-ref');
  if (!ref || ref.textContent.length < 600) out.push('"?" empty');
  else if (S && (ref.textContent.indexOf('n = ' + S.n) < 0 || ref.textContent.indexOf('(' + S.mean.toFixed(2).replace('-', '−') + ' ') < 0)) out.push('"?" does not match the people (n ' + S.n + ', mean ' + S.mean.toFixed(2) + ')');
  return out;
};
const FIT = () => {
  const k = document.querySelector('.dx2 .tk2-handle .tk2-knob').getBoundingClientRect(), s = document.querySelector('.dx2-scene').getBoundingClientRect(), c = document.querySelector('.dx2 .tk2-cause').getBoundingClientRect();
  let inner = null;
  for (let n = document.querySelector('.dx2-scene').parentNode; n && n !== document.body; n = n.parentNode) { const cs = getComputedStyle(n); if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 2) { inner = n.className; break; } }
  return { knob: k.top >= 0 && k.bottom <= innerHeight, scene: s.top >= 0 && s.bottom <= innerHeight + 0.5, cause: c.bottom <= innerHeight, inner };
};

if (ONE) {
  const w = +ONE;
  const h = +arg('--height', 0) || (w < 600 ? 844 : w <= 820 ? 1024 : w === 1024 ? 768 : w === 1280 ? 800 : w === 1920 ? 1080 : 900);
  if (w === 360 && !arg('--height', 0)) {
    for (const [sw, sh] of [[360, 740], [375, 667]]) {
      const { browser, page } = await open(sw, sh, false);
      const f = await page.evaluate(FIT);
      ok(f.knob && f.scene && f.cause && !f.inner, `${sw}x${sh} landing: ${JSON.stringify(f)}`);
      await browser.close();
    }
  }
  for (const dark of [false, true]) {
    const tag = `${w}${arg('--height', 0) ? 'x' + h : ''}-${dark ? 'dark' : 'light'}`;
    const { browser, page, errs } = await open(w, h, dark);
    const X = (fn, a) => page.evaluate(fn, a);
    const shot = async (n) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/sweep-${tag}-${n}.png` }); };
    const check = async (n) => {
      await still(page); await page.waitForTimeout(40);
      const lay = await X(LAYOUT, w < 600); lay.forEach(f => ok(false, `${tag} ${n}: ${f}`)); ok(!lay.length, '');
      const ag = await X(AGREE); ag.forEach(f => ok(false, `${tag} ${n}: ${f}`)); ok(!ag.length, '');
      { const pw = await X(() => { const b = [...document.querySelectorAll('.dx2-people .dx2-p .dx2-body')].map(e => e.getBoundingClientRect().width).sort((a, c) => a - c); return b[b.length >> 1] / 0.88; }); ok(pw >= 14.5, `${tag} ${n}: people drawn ${pw.toFixed(1)} px wide (under 15)`); }
      await shot(n);
    };
    const th = await X(() => document.documentElement.getAttribute('data-theme') === 'dark');
    ok(th === dark, `${tag} theme: dark is ${th}`);
    const f = await X(FIT); ok(f.knob && f.scene && f.cause && !f.inner, `${tag} picture, knob and cause line not on one screen: ${JSON.stringify(f)}`);
    // the first visit: the cue above the knob, covering no label or number, in view
    const cue = await X(() => {
      const c = document.querySelector('.dx2 .tk2-cue'), k = document.querySelector('.dx2 .tk2-handle .tk2-dot'); if (!c) return null;
      const r = c.getBoundingClientRect(), q = k.getBoundingClientRect();
      const over = (sel) => [...document.querySelectorAll(sel)].filter(e => e.getBoundingClientRect().width && getComputedStyle(e).display !== 'none').some(e => { const z = e.getBoundingClientRect(); return r.top < z.bottom && r.bottom > z.top && r.left < z.right && r.right > z.left; });
      return { above: r.bottom <= q.top + 1, over: over('.dx2-svg text, .dx2-cloth, .dx2-mpill rect'), inView: r.top >= 0 && r.bottom <= innerHeight && r.left >= 2 && r.right <= innerWidth - 2 };
    });
    ok(cue && cue.above && !cue.over && cue.inView, `${tag} first visit cue: ${JSON.stringify(cue)}`);
    await check('00-first');
    const T = 'window.ApStatDataExplorer';
    // one person dragged far: the farthest to the top of the scale
    await X(() => { const X = window.ApStatDataExplorer; X.move(X.S.cur, X.hi() - 2); }); await check('01-far');
    await X(() => { const X = window.ApStatDataExplorer; X.move(X.S.cur, X.lo() + 1); }); await check('01b-far-low');
    await X(() => { const X = window.ApStatDataExplorer; const p = X.S.P[Math.floor(X.S.P.length / 2)]; X.select(p); }); await check('02-tapped');
    await X(() => window.ApStatDataExplorer.setSD(true)); await check('03-sd');
    await X(() => { const X = window.ApStatDataExplorer; X.add(); X.add(); X.add(); }); await check('04-added');
    await X(() => { const X = window.ApStatDataExplorer; X.remove(); }); await check('05-removed');
    await X(() => { const X = window.ApStatDataExplorer; for (let i = 0; i < 25; i++) X.add(); }); await check('06-forty');
    await X(() => window.ApStatDataExplorer.setTab('box')); await check('07-forty-box');
    await X(() => { const X = window.ApStatDataExplorer; X.setTab('mean'); X.startOver(); }); await check('08-start-over');
    ok(await X(() => window.ApStatDataExplorer.stats().n === window.ApStatDataExplorer.S.set.values.length), `${tag} Start over did not bring back the data set`);
    await X(() => { const X = window.ApStatDataExplorer; for (let i = 0; i < 20; i++) X.remove(); }); await check('09-five');
    await X(() => window.ApStatDataExplorer.setSD(false));
    for (const i of [1, 2]) {
      await X((i) => window.ApStatDataExplorer.setSet(i), i); await check(`10-set${i}`);
      await X(() => window.ApStatDataExplorer.setTab('box')); await check(`11-set${i}-box`);
      await X(() => window.ApStatDataExplorer.setTab('mean'));
    }
    await X(() => window.ApStatDataExplorer.setSet(0));
    await X(() => window.ApStatDataExplorer.setTab('box')); await check('12-box');
    ok(await X(() => /Q1 is the median of the lower half/.test(document.querySelector('.dx2-ref').textContent)), `${tag} "?" lacks the quartile rule`);
    // an outlier made (the person at 35 to just past the upper fence) and unmade
    await X(() => { const X = window.ApStatDataExplorer, p = X.S.P.find(q => q.v === 35); X.move(p, 40); }); await check('13-box-outlier-made');
    await X(() => { const X = window.ApStatDataExplorer, p = X.S.P.find(q => q.v === 48); X.move(p, 30); }); await check('14-box-outlier-unmade');
    await X(() => { const X = window.ApStatDataExplorer; X.select(X.S.P[3]); }); await check('15-box-picked');
    await X(() => window.ApStatDataExplorer.bin(window.ApStatDataExplorer.S.set.binMin)); await check('16-bins-narrow');
    await X(() => window.ApStatDataExplorer.bin(window.ApStatDataExplorer.S.set.binMax)); await check('17-bins-wide');
    await X(() => window.ApStatDataExplorer.startOver()); await check('18-box-start-over');
    // a person dragged to the scale's right end, on every data set, with a bin width that does not divide the range
    for (const i of [0, 1, 2]) {
      await X((i) => { const X = window.ApStatDataExplorer; X.setSet(i); X.setTab('box'); }, i);
      await X(() => { const X = window.ApStatDataExplorer; X.move(X.S.cur, X.hi()); X.move(X.S.P[2], X.hi()); });
      await check(`18b-set${i}-at-max`);
      // every bin width the knob offers, each splitting the scale into equal bins
      const ws = await X(() => window.ApStatDataExplorer.widths());
      for (const b of ws) { await X((b) => window.ApStatDataExplorer.bin(b), b); await check(`18c-set${i}-at-max-bins-${b}`); }
    }
    await X(() => { const X = window.ApStatDataExplorer; X.setSet(0); X.setTab('box'); });
    // Test yourself: the drill and its figure
    await X(() => window.ApStatDataExplorer.kmode('quiz'));
    await page.waitForTimeout(700);
    const qz = await X(() => { const f = document.querySelector('.ls-root .dx-qfig svg'); return { fig: !!f, sx: document.scrollingElement.scrollWidth <= innerWidth + 1 }; });
    ok(qz.fig && qz.sx, `${tag} Test yourself: ${JSON.stringify(qz)}`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/sweep-${tag}-19-quiz.png` });
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
      ok(fr.n > 0 || /calm|reduced|tap|key/.test(what), `${tag} ${what}: no frames`);
      fr.bad.forEach(b => ok(false, `${tag} ${what}: ${b}`)); ok(!fr.bad.length, '');
      console.log(`  ${tag} ${what}: ${fr.n} frames`);
    };
    const at = (v) => X((v) => { const X = window.ApStatDataExplorer, r = document.querySelector('.dx2-scene').getBoundingClientRect(), G = X.G(); return [r.left + X.xv(v), r.top + G.PY - X.levelH() * 0.5]; }, v);
    const personAt = (v) => X((v) => { const X = window.ApStatDataExplorer, p = X.S.P.find(q => q.st === 'in' && X.dval(q) === v), r = document.querySelector('.dx2-scene').getBoundingClientRect(), G = X.G(); return p ? [r.left + X.xv(p.d), r.top + G.PY - (p.lv + 0.5) * X.levelH()] : null; }, v);
    const drag = async (from, xs, pause = 16) => { await page.mouse.move(from[0], from[1]); await page.mouse.down(); for (const x of xs) { await page.mouse.move(x, from[1]); await page.waitForTimeout(pause); } await page.mouse.up(); };
    await run('a real drag out and back', async () => {
      const p = await personAt(48), a = await at(68), b = await at(30);
      const xs = []; for (let i = 1; i <= 16; i++) xs.push(p[0] + (a[0] - p[0]) * i / 16); for (let i = 1; i <= 16; i++) xs.push(a[0] + (b[0] - a[0]) * i / 16);
      await drag(p, xs);
      const v = await X(() => window.ApStatDataExplorer.dval(window.ApStatDataExplorer.S.cur)); ok(Math.abs(v - 30) <= 1, `${tag} the dragged person ended at ${v} (the pointer let go over 30; the plank may still tip by a degree)`);
    });
    await run('fast reversals', async () => { const p = await personAt(await X(() => window.ApStatDataExplorer.dval(window.ApStatDataExplorer.S.cur))), a = await at(60), b = await at(5); await drag(p, [a[0], b[0], a[0], b[0], p[0]], 8); });
    await run('a tap picks a person (z-score)', async () => {
      const p = await personAt(5); await page.mouse.click(p[0], p[1]); await page.waitForTimeout(80);
      const c = await X(() => document.querySelector('.dx2 .tk2-cause').textContent); ok(/z = /.test(c), `${tag} a tap: ${c}`);
    });
    await run('keys on the knob', async () => { await page.focus('.dx2 .tk2-handle .tk2-knob'); for (let i = 0; i < 4; i++) { await page.keyboard.press('PageUp'); await page.waitForTimeout(60); } await page.keyboard.press('ArrowLeft'); });
    await run('the people group: arrows pick', async () => { await page.focus('.dx2-peoplepick'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(60); await page.keyboard.press('Escape'); });
    await run('add and remove', async () => { await page.click('.dx2-add'); await page.waitForTimeout(200); await page.click('.dx2-add'); await page.waitForTimeout(700); await page.click('.dx2-rm'); });
    await run('the SD band', async () => { await page.click('.dx2-sdb'); await page.waitForTimeout(400); await page.click('.dx2-sdb'); });
    await run('Start over', async () => { await page.click('.dx2-reset'); });
    await run('a data set change', async () => { await page.selectOption('.dx2-sel', '2'); await page.waitForTimeout(300); await page.selectOption('.dx2-sel', '0'); });
    await run('the boxplot tab', async () => { await page.click('.tk2-tab[data-v="box"]'); });
    await run('a drag that makes an outlier and back', async () => {
      const p = await personAt(35), a = await at(44), b = await at(35);
      const xs = []; for (let i = 1; i <= 12; i++) xs.push(p[0] + (a[0] - p[0]) * i / 12); for (let i = 1; i <= 12; i++) xs.push(a[0] + (b[0] - a[0]) * i / 12);
      await drag(p, xs, 24);
    });
    await run('a drag across the middle (the box moves)', async () => { const p = await personAt(5), a = await at(25); const xs = []; for (let i = 1; i <= 14; i++) xs.push(p[0] + (a[0] - p[0]) * i / 14); await drag(p, xs, 24); });
    await run('the bin knob', async () => { await page.focus('.dx2-binknob input'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(80); await page.keyboard.press('ArrowLeft'); });
    await run('leave to Test yourself mid change, come back', async () => {
      await page.click('.dx2-reset'); await page.waitForTimeout(90);
      await X(() => window.ApStatDataExplorer.kmode('quiz')); await page.waitForTimeout(300);
      ok(await X(() => !window.ApStatDataExplorer.busy()), `${tag} leaving mid change left an animation running`);
      // the change finished while hidden: the marks are simply there when Explore comes back (no jump check across it)
      await X(() => { window.__jumpReset = (window.__jumpReset || 0) + 1; window.ApStatDataExplorer.kmode('explore'); }); await page.waitForTimeout(300);
      const r = await X(() => ({ n: window.ApStatDataExplorer.stats().n, busy: window.ApStatDataExplorer.busy() }));
      ok(r.n === 20 && !r.busy, `${tag} back in Explore: ${JSON.stringify(r)}`);
    });
    await run('back to the mean tab', async () => { await page.click('.tk2-tab[data-v="mean"]'); });
    if (w < 600) {
      // a real touch drag: the person moves, the page does not scroll
      const cdp = await page.context().newCDPSession(page);
      await run('a real touch drag', async () => {
        const p = await personAt(48), a = await at(65); const y0 = await X(() => scrollY);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p[0], y: p[1] }] });
        for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p[0] + (a[0] - p[0]) * i / 12, y: p[1] - i }] }); await page.waitForTimeout(20); }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForTimeout(100);
        const r = await X(() => ({ v: window.ApStatDataExplorer.dval(window.ApStatDataExplorer.S.cur), y: scrollY }));
        ok(r.v === 65 && Math.abs(r.y - y0) < 2, `${tag} touch drag: ${JSON.stringify(r)} from scroll ${y0}`);
      });
    }
    ok(!errs.length, `${tag} console: ${errs.slice(0, 3).join(' | ')}`);
    await browser.close();
    // reduced motion: the result at once, with the cross fade
    const rm = await open(w, h, false, { reduced: true, noCue: true });
    await rm.page.evaluate(`window.__AGREE = ${AGREE.toString()}`);
    await rm.page.evaluate(() => { const X = window.ApStatDataExplorer; X.move(X.S.cur, 66); });
    await rm.page.waitForTimeout(40);
    const r1 = await rm.page.evaluate(() => ({ v: window.ApStatDataExplorer.dval(window.ApStatDataExplorer.S.cur), busy: window.ApStatDataExplorer.busy(), fade: document.querySelector('.dx2-scene').classList.contains('is-fade'), bad: window.__AGREE() }));
    ok(r1.v === 66 && !r1.busy && r1.fade && !r1.bad.length, `${tag} reduced motion: ${JSON.stringify(r1)}`);
    await rm.page.evaluate(() => window.ApStatDataExplorer.add()); await rm.page.waitForTimeout(40);
    const r2 = await rm.page.evaluate(() => ({ n: window.ApStatDataExplorer.stats().n, busy: window.ApStatDataExplorer.busy(), bad: window.__AGREE() }));
    ok(r2.n === 21 && !r2.busy && !r2.bad.length, `${tag} reduced motion add: ${JSON.stringify(r2)}`);
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
  const drag = async (page, k, dx) => {
    await page.mouse.move(k[0], k[1]); await page.mouse.down();
    for (let i = 0; i <= 24; i++) { await page.mouse.move(k[0] + dx * i / 24, k[1]); await page.waitForTimeout(16); }
    for (let i = 24; i >= 0; i--) { await page.mouse.move(k[0] + dx * i / 24, k[1]); await page.waitForTimeout(16); }
    await page.mouse.up(); await page.waitForTimeout(600);
  };
  for (const w of [390, 1440]) {
    for (const which of ['a person (mean tab)', 'a person (boxplot tab, 40 people)', 'FLAGSHIP fertilizer']) {
      const browser = await chromium.launch({ executablePath: EXE });
      const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, serviceWorkers: 'block' });
      await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
      const page = await ctx.newPage();
      await page.addInitScript(() => { window.LevlToolTest = 1; localStorage.setItem('tk2c:apstat-data-explorer', '1'); });
      const flag = /FLAG/.test(which);
      await page.goto(flag ? `http://localhost:${PORT}/environmental-science/tools/water-pollution.html` : URL0);
      if (flag) await page.waitForSelector('.tk2-knob', { state: 'attached', timeout: 15000 }); else await page.waitForSelector('.dx2-p', { timeout: 15000 });
      await page.waitForTimeout(1200);
      if (/40 people/.test(which)) { await page.evaluate(() => { const X = window.ApStatDataExplorer; X.setTab('box'); for (let i = 0; i < 20; i++) X.add(); X.finish(); }); await page.waitForTimeout(400); }
      const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      let k;
      if (flag) k = await page.evaluate(() => { const e = [...document.querySelectorAll('.tk2-knob')].find(x => x.getBoundingClientRect().width > 0); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
      else k = await page.evaluate(() => { const X = window.ApStatDataExplorer, p = X.S.cur, r = document.querySelector('.dx2-scene').getBoundingClientRect(), G = X.G(); return [r.left + X.xv(p.d), r.top + G.PY - (p.lv + 0.5) * X.levelH()]; });
      const dx = flag ? Math.min(260, w * 0.3) : -Math.min(w * 0.5, 600);
      const res = await probe(page, () => drag(page, k, dx));
      console.log(`  perf ${w} ${which} (CPU x4): ${res}`);
      await browser.close();
    }
  }
  pass++;
}

server.close();
const label = ONE ? `width ${ONE}` : FRAMES ? 'frames' : 'perf';
fails.filter(Boolean).slice(0, +(process.env.NFAIL || 40)).forEach(f => console.log('  FAIL ' + f));
console.log(`stat-data-explorer sweep ${label}: ${pass} passed, ${fails.filter(Boolean).length} failed`);
process.exit(fails.filter(Boolean).length ? 1 : 0);
