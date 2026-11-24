#!/usr/bin/env node
/* Tools v2 sweep: AP Biology, Confidence intervals and error bars (docs/tools-v2-bio-confidence-intervals-brief.md;
   pattern of scripts/tools-v2/rates-sweep.mjs).
   Landmark states of Explore (the opening; 10 and 20 plants; the shade mean at its ends and where the bars just
   touch; the SD at its ends; close means at 20 plants; three new samples), the Challenges view and a Problems view,
   at widths 360 to 1920, light and dark, and the shade mean at every 0.5 cm at 5 and 20 plants:
     - no sideways scroll; nothing clipped by the scene (labels, tags, pills, knobs, the cue);
     - labels never overlap each other (4 px), the error bars' ends keep 4 px from other labels; knobs 44 px;
     - no rendered text under 11 px, leaves at least 8 px; phones: the cause line at most two rows, constant height;
     - every number agrees with the plants AS DRAWN (AGREE: each plant's stem tip is measured from the DOM; the mean
       lines, bars, error bars, ± labels, n, mean and SD tags, the knobs, the tint and the cause line are checked
       against those heights);
   and, frame by frame at 390 and 1440 (--frames): a real drag of the mean, keys, the SD drag, 5 to 20 plants and back,
   a change on top of one still playing, New sample, a drag while plants sprout, Start over, leaving to Test yourself
   mid change, a real touch drag at 390, and reduced motion. --perf: CPU x4 frame times beside the flagship.
   Usage: node scripts/tools-v2/bio-confidence-intervals-sweep.mjs [--width <px>] [--frames] [--perf] [--shots <dir>]
   With no --width it runs each of the ten widths in its own process, then the frame checks.
   Needs playwright (PW_ROOT names a folder whose node_modules has it) and Chromium (CHROMIUM_PATH). */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, mkdirSync } from 'node:fs';
import { dirname, extname, resolve, join } from 'node:path';
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
  console.log(`\nbio-confidence-intervals sweep, all runs: ${pass} passed, ${fail} failed${bad ? ' (a run did not finish)' : ''}`);
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
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }); createReadStream(file).pipe(res);
});
await new Promise(ok => server.listen(0, ok));
const PORT = server.address().port;
const URL0 = `http://localhost:${PORT}/bio/tools/confidence-intervals.html`;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

let pass = 0; const fails = [];
const ok = (c, msg) => { if (c) pass++; else fails.push(msg); };

async function open(w, dark, opts = {}) {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : w < 1100 ? 1024 : 900 }, serviceWorkers: 'block', hasTouch: w < 500, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.addInitScript(([dark, noCue]) => { try { if (dark) localStorage.setItem('nremt_theme', 'dark'); if (noCue) localStorage.setItem('tk2c:apbio-ci', '1'); } catch (e) {} }, [dark, !!opts.noCue]);
  await page.goto(URL0 + (opts.hash || '')); await page.waitForSelector('.ci2-pl, .ci-fig', { timeout: 15000 }); await page.waitForTimeout(700);
  return { browser, page, errs };
}
async function until(page, fn, a) { for (let i = 0; i < 120; i++) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(50); } return false; }
const still = (page) => until(page, () => !window.__ci2.busy());

/* Read everything back from the DOM and check every number against the plants AS DRAWN (runs in the page). */
const AGREE = () => {
  const X = window.__ci2, G = X.G(), c = G.cb, out = [];
  const num = (s) => { const m = /([−+-]?\d+(?:\.\d+)?)/.exec((s || '').replace('±', '')); return m ? parseFloat(m[1].replace('−', '-')) : NaN; };
  const near = (a, b, t, what) => { if (!(Math.abs(a - b) <= t)) out.push(`${what}: ${a} vs ${b}`); };
  const vis = (e) => e && e.style.display !== 'none' && getComputedStyle(e).display !== 'none';
  // the plants, measured: the stem's tip above the soil
  const trays = [0, 1].map(g => [...document.querySelectorAll(`.ci2-pl${g} .ci2-pl`)].map(e => {
    const d = e.querySelector('.ci2-stem').getAttribute('d') || '', m = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)$/.exec(d);
    const tr = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(e.getAttribute('transform'));
    return { st: e.getAttribute('data-st'), h: m ? -parseFloat(m[2]) / G.k : 0, x: tr ? +tr[1] + (m ? +m[1] : 0) : NaN, base: tr ? +tr[2] : NaN };
  }));
  trays.forEach((a, g) => a.forEach(p => { if (Math.abs(p.base - G.ySoil) > 0.06) out.push(`plant ${g} not on the soil`); if (p.h > 30.01) out.push(`plant taller than the board ${p.h}`); }));
  const S = trays.map(a => { const hs = a.filter(p => p.st === 'grown').map(p => p.h), n = hs.length, m = hs.reduce((s, h) => s + h, 0) / n; const sd = Math.sqrt(hs.reduce((s, h) => s + (h - m) * (h - m), 0) / (n - 1)); return { n, m, sd, e2: 2 * sd / Math.sqrt(n), top: Math.max(...hs) }; });
  const yH = (h) => G.ySoil - h * G.k, yA = (v) => c.b - v * c.ky;
  const shown = [];
  [0, 1].forEach(g => {
    const s = S[g], id = g ? 'shade' : 'sun';
    if (!(s.n > 1)) { out.push(`tray ${g}: ${s.n} plants counted`); return; }
    near(+document.querySelector(`.ci2-mline.is-${id}`).getAttribute('y1'), yH(s.m), 0.3, `tray ${g} mean line vs the plants`);
    near(+document.querySelector(`.ci2-bar.is-${id}`).getAttribute('y'), yA(s.m), 0.3, `bar ${g} top vs the plants' mean`);
    const ed = document.querySelectorAll('.ci2-err')[g].getAttribute('d'), em = /^M([-\d.]+) ([-\d.]+)V([-\d.]+)/.exec(ed);
    near(+em[2], yA(s.m + s.e2), 0.3, `error bar ${g} top vs mean + 2 SE of the plants`); near(+em[3], yA(s.m - s.e2), 0.3, `error bar ${g} foot`);
    const el = document.querySelectorAll('.ci2-elab')[g].textContent; near(num(el), s.e2, 0.06, `±label ${g} vs 2 SE of the plants`);
    near(num(document.querySelectorAll('.ci2-nlab')[g].textContent), s.n, 0, `n label ${g}`);
    const mt = g ? document.querySelector('.ci2-hmean .tk2-tag').textContent : document.querySelector('.ci2-pill.is-sun text').textContent;
    near(num(mt), s.m, 0.06, `mean label ${g} vs the plants`);
    shown.push({ m: num(mt), e: num(el), id });
  });
  if (shown.length < 2) return out;
  const sdt = document.querySelector('.ci2-hsd .tk2-tag'), cueOn = !!document.querySelector('.ci2 .tk2-cue');
  if (cueOn) { if (!sdt.hidden) out.push('SD tag shows under the cue'); } else near(num(sdt.textContent), S[1].sd, 0.07, 'SD tag vs the shade plants');
  // the knobs sit on what is drawn
  const sr = document.querySelector('.ci2-svg').getBoundingClientRect();
  const kc = (sel) => { const r = document.querySelector(sel + ' .tk2-knob').getBoundingClientRect(); return [r.left + r.width / 2 - sr.left, r.top + r.height / 2 - sr.top]; };
  const km = kc('.ci2-hmean'); near(km[1], yH(S[1].m), 1.5, 'mean knob on the drawn mean'); near(km[0], G.knobX, 1.5, 'mean knob x');
  const ks = kc('.ci2-hsd'); near(ks[1], yH(S[1].top), 1.5, 'spread knob on the tallest plant');
  // the overlap from the numbers as shown, and the verdict, the tint and the cause line all agree
  const lo = shown[0].m <= shown[1].m ? shown[0] : shown[1], up = lo === shown[0] ? shown[1] : shown[0];
  const ov = Math.round(((lo.m + lo.e) - (up.m - up.e)) * 10) / 10, kind = ov > 0 ? 'ov' : ov < 0 ? 'gap' : 'touch';
  const band = document.querySelector('.ci2-band'); if (!band.getAttribute('class').includes('is-' + kind)) out.push(`band ${band.getAttribute('class')} vs ${kind}`);
  const bp = document.querySelector('.ci2-pill.is-ov, .ci2-pill.is-gap, .ci2-pill.is-touch');
  if (!bp || !bp.getAttribute('class').includes(kind)) out.push(`band label vs ${kind}`);
  // the drawn error bars overlap exactly when the verdict says so (beyond the rounding of the shown numbers)
  const Lo = lo.id === 'sun' ? S[0] : S[1], Up = lo.id === 'sun' ? S[1] : S[0], ovD = (Lo.m + Lo.e2) - (Up.m - Up.e2);
  if (kind === 'ov' && ovD < -0.11) out.push(`says overlap, drawn apart ${ovD}`); if (kind === 'gap' && ovD > 0.11) out.push(`says apart, drawn overlapping ${ovD}`);
  const take = document.querySelector('.ci2 .tk2-cause.is-take');
  const cz = [...document.querySelectorAll('.ci2 .tk2-cause .tk2-cz')].map(e => e.textContent);
  if (!take) {
    near(num(cz[0]), Math.round((up.m - lo.m) * 10) / 10, 1e-9, 'cause: means apart');
    if (kind === 'ov') { near(num(cz[1]), ov, 1e-9, 'cause: overlap'); if (cz[2] !== 'may be chance') out.push('cause verdict ' + cz[2]); }
    if (kind === 'gap') { near(num(cz[1]), -ov, 1e-9, 'cause: gap'); if (cz[2] !== 'unlikely to be chance') out.push('cause verdict ' + cz[2]); }
    if (kind === 'touch' && (!/touch/.test(cz[1]) || cz[2] !== 'unlikely to be chance')) out.push('cause touch ' + cz[1] + ' / ' + cz[2]);   // touching is no overlap
  }
  return out;
};

/* Geometry: clipping, overlaps, text size, the cause line (runs in the page). */
const GEO = () => {
  const out = [], st = document.querySelector('.ci2'), phone = innerWidth <= 640;
  const scene = document.querySelector('.ci2-scene').getBoundingClientRect();
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none' && !e.closest('[style*="display: none"]') && !e.closest('[hidden]'); };
  const inside = (r, b, what) => { if (r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1) out.push(`${what} clipped (${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)})`); };
  const lab = [];
  document.querySelectorAll('.ci2-scene [data-lab]').forEach(e => { if (!vis(e)) return; const r = e.getBoundingClientRect(); inside(r, scene, 'label ' + e.textContent.slice(0, 14)); lab.push([r, e.textContent, e.getAttribute('data-lab')]); });
  document.querySelectorAll('.ci2 .tk2-handle:not([hidden]) .tk2-tag').forEach(e => { if (!vis(e)) return; const r = e.getBoundingClientRect(); inside(r, scene, 'tag ' + e.textContent); lab.push([r, e.textContent, 'tag']); });
  for (let i = 0; i < lab.length; i++) for (let j = i + 1; j < lab.length; j++) {
    const a = lab[i][0], b = lab[j][0];
    if (a.left < b.right + 4 && a.right > b.left - 4 && a.top < b.bottom + 4 && a.bottom > b.top - 4) {
      // tick numbers on one axis sit closer than 4 px only along that axis, never overlapping
      const tick = lab[i][2] === lab[j][2] && /tick|rnum/.test(lab[i][2]) && (a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
      if (!tick) out.push(`overlap: "${lab[i][1]}" / "${lab[j][1]}"`);
    }
  }
  // the error bars' ends keep 4 px from every label but their own ±
  document.querySelectorAll('.ci2-err').forEach((e, g) => { if (!vis(e)) return; const r = e.getBoundingClientRect(); lab.forEach(l => { if (l[2] === 'elab' || l[2] === 'band') return; const a = l[0]; if (a.left < r.right + 4 && a.right > r.left - 4 && a.top < r.bottom + 4 && a.bottom > r.top - 4) out.push(`error bar ${g} touches "${l[1]}"`); }); });
  document.querySelectorAll('.ci2 .tk2-handle:not([hidden]) .tk2-knob').forEach(k => { if (!vis(k)) return; const r = k.getBoundingClientRect(); if (r.width < 43.5 || r.height < 43.5) out.push(`knob ${Math.round(r.width)} px`); inside(r, scene, 'knob'); lab.forEach(l => { const a = l[0]; if (l[2] !== 'tag' && a.left < r.right - 6 && a.right > r.left + 6 && a.top < r.bottom - 6 && a.bottom > r.top + 6) out.push(`knob covers "${l[1]}"`); }); });
  const kn = [...document.querySelectorAll('.ci2 .tk2-handle:not([hidden]) .tk2-knob')].map(k => k.getBoundingClientRect());
  if (kn.length === 2) { const d = Math.hypot(kn[0].x - kn[1].x, kn[0].y - kn[1].y); if (d < 30) out.push(`the two knobs ${Math.round(d)} px apart`); }
  const cue = document.querySelector('.ci2 .tk2-cue');
  if (cue) {
    const r = cue.getBoundingClientRect(); lab.forEach(l => { const a = l[0]; if (a.left < r.right && a.right > r.left && a.top < r.bottom && a.bottom > r.top) out.push(`cue covers "${l[1]}"`); }); inside(r, scene, 'cue');
    // its arrow points at the mean knob (the thing to drag): straight above it, within 12 px across
    const ar = cue.querySelector('.tk2-cue-ar').getBoundingClientRect(), km = document.querySelector('.ci2-hmean .tk2-knob').getBoundingClientRect();
    const ax = ar.left + ar.width / 2, kx = km.left + km.width / 2;
    if (Math.abs(ax - kx) > 12 || ar.top > km.top) out.push(`cue arrow ${Math.round(ax - kx)} px across from the mean knob`);
    // never on a plant's top or leaves, nor across a mean line
    document.querySelectorAll('.ci2-pl .ci2-top, .ci2-mline').forEach(e => { const a = e.getBoundingClientRect(); if (a.width + a.height > 0 && a.left < r.right && a.right > r.left && a.top < r.bottom && a.bottom > r.top) out.push(`cue covers ${e.matches('.ci2-mline') ? 'a mean line' : 'a plant'}`); });
  }
  document.querySelectorAll('.ci2 text, .ci2 .tk2-cz, .ci2 .tk2-purpose, .ci2 button, .ci2 .tk2-tag, .ci2 .ci2-nl').forEach(e => { if (!vis(e)) return; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 11) out.push(`text ${fs}px "${e.textContent.slice(0, 16)}"`); });
  const area = (r) => r.width * r.height;
  [...st.children].forEach(c => { if (c.matches('.ci2-scene') || !vis(c)) return; if (area(c.getBoundingClientRect()) > area(scene)) out.push(`${c.className} bigger than the scene`); });
  if (document.documentElement.scrollWidth > innerWidth + 1) out.push(`sideways scroll ${document.documentElement.scrollWidth}`);
  const cz = document.querySelector('.ci2 .tk2-cause'), cr = cz.getBoundingClientRect(), rows = new Set([...cz.querySelectorAll('.tk2-cz')].map(e => Math.round(e.getBoundingClientRect().top))).size;
  if (phone && rows > 2) out.push(`cause line ${rows} rows`);
  // plants stay plants: leaves at least 7 px
  const lf = window.__ci2.G().leaf; if (lf < 10.9) out.push(`leaves ${lf} px`);
  return { out, causeH: Math.round(cr.height) };
};

const STATES = [
  ['open', {}], ['n10', { n: 10 }], ['n20', { n: 20 }], ['mean-min', { mean: 4 }], ['mean-max', { mean: 20 }], ['touch', { mean: 17.2 }],
  ['sd-min', { sd: 1 }], ['sd-max', { sd: 4.5 }], ['n20-close', { n: 20, mean: 12.4 }], ['n20-sd', { n: 20, sd: 4.5 }], ['n10-low', { n: 10, mean: 6 }],
  ['sample5', { sample: 1 }], ['sample5b', { sample: 2 }], ['sample20', { n: 20, sample: 1 }]];
async function setState(page, s) {
  await page.evaluate(() => window.__ci2.open()); await page.waitForTimeout(40);
  await page.evaluate((s) => window.__ci2.set({ n: s.n, mean: s.mean, sd: s.sd }), s);
  for (let i = 0; i < (s.sample || 0); i++) { await page.evaluate(() => window.__ci2.sample()); await page.waitForTimeout(30); await still(page); }
  await page.evaluate(() => window.__ci2.set({})); await still(page);
}

if (ONE) {
  const w = +ONE;
  for (const theme of ['light', 'dark']) {
    const { browser, page, errs } = await open(w, theme === 'dark');
    const g0 = await page.evaluate(GEO);
    ok(!g0.out.length, `${w} ${theme} first visit: ${g0.out.join('; ')}`);
    ok(await page.evaluate(() => !!document.querySelector('.ci2 .tk2-cue')), `${w} ${theme}: the first visit cue shows`);
    const a0 = await page.evaluate(AGREE); ok(!a0.length, `${w} ${theme} first visit: ${a0.join('; ')}`);
    if (SHOTS && [390, 768, 1440].includes(w)) await page.screenshot({ path: join(SHOTS, `sweep-${w}-${theme}-00-first.png`), fullPage: w < 500 });
    await page.evaluate(() => window.__ci2.noCue());
    const heights = new Set();
    for (const [name, s] of STATES) {
      await setState(page, s);
      const g = await page.evaluate(GEO); ok(!g.out.length, `${w} ${theme} ${name}: ${g.out.join('; ')}`);
      const a = await page.evaluate(AGREE); ok(!a.length, `${w} ${theme} ${name}: ${a.join('; ')}`);
      heights.add(g.causeH);
      if (SHOTS && [390, 768, 1440].includes(w)) await page.screenshot({ path: join(SHOTS, `sweep-${w}-${theme}-${name}.png`), fullPage: w < 500 });
    }
    if (theme === 'light') {
      // every 0.5 cm of the shade mean at 5 and at 20 plants: every check, no exceptions
      const bad = [];
      for (const n of [5, 20]) for (let m = 4; m <= 20.001; m += 0.5) {
        await page.evaluate(([n, m]) => { window.__ci2.open(); window.__ci2.set({ n, mean: m }); }, [n, m]); await still(page);
        const g = await page.evaluate(GEO), a = await page.evaluate(AGREE);
        if (g.out.length || a.length) bad.push(`${n} ${m}: ${g.out.concat(a).join('; ')}`);
      }
      ok(!bad.length, `${w} every 0.5 cm: ${bad.length} bad: ${bad.slice(0, 3).join(' | ')}`);
    }
    if (w <= 640) ok(heights.size === 1, `${w} ${theme}: the cause line changes height ${[...heights]}`);
    ok(!errs.length, `${w} ${theme}: console ${errs.join(' | ')}`);
    // Challenges, from the opening
    await page.goto('about:blank'); await page.goto(URL0 + '#goals'); await page.waitForSelector('.ci2-pl'); await page.waitForTimeout(900); await still(page);
    const gg = await page.evaluate(GEO); ok(!gg.out.length, `${w} ${theme} goals: ${gg.out.join('; ')}`);
    const ag = await page.evaluate(AGREE); ok(!ag.length, `${w} ${theme} goals: ${ag.join('; ')}`);
    ok(await page.evaluate(() => { const M = window.__ci2.Mo(); return M[1].m === 16 && window.__ci2.St.n === 5 && !!document.querySelector('.tk2-chal'); }), `${w} ${theme} goals: from the opening with the challenge card`);
    if (SHOTS && [390, 1440].includes(w)) await page.screenshot({ path: join(SHOTS, `sweep-${w}-${theme}-goals.png`), fullPage: w < 500 });
    // Problems
    await page.goto('about:blank'); await page.goto(URL0 + '#practice'); await page.waitForSelector('.ci-fig'); await page.waitForTimeout(500);
    const pf = await page.evaluate(() => { const f = [...document.querySelectorAll('.ci-fig')].find(e => e.getBoundingClientRect().width > 0); const r = f.getBoundingClientRect(), vb = f.viewBox.baseVal, k = Math.min(r.width / vb.width, r.height / vb.height); const small = [...f.querySelectorAll('text')].map(t => parseFloat(getComputedStyle(t).fontSize) * k).filter(s => s < 10.95); return { h: r.height, small, sw: document.documentElement.scrollWidth, vw: innerWidth, dash: [...f.querySelectorAll('*')].filter(e => { const d = getComputedStyle(e).strokeDasharray; return d && d !== 'none'; }).length }; });
    ok(pf.h >= 180, `${w} ${theme} practice: figure ${pf.h} px tall`);
    ok(!pf.small.length, `${w} ${theme} practice: text under 11 px ${pf.small.slice(0, 3)}`);
    ok(pf.sw <= pf.vw + 1, `${w} ${theme} practice: sideways scroll`);
    ok(!pf.dash, `${w} ${theme} practice: ${pf.dash} dashed shapes`);
    if (SHOTS && [390, 1440].includes(w)) await page.screenshot({ path: join(SHOTS, `sweep-${w}-${theme}-practice.png`), fullPage: w < 500 });
    await browser.close();
  }
}

if (FRAMES) {
  for (const w of [390, 1440]) {
    const { browser, page, errs } = await open(w, false, { noCue: true });
    let frames = 0;
    async function watch(label, act, shot) {
      await page.evaluate(() => { window.__ciF = { n: 0, bad: [], on: true, mid: 0 }; const AG = window.__ciAgree; (function loop(){ if (!window.__ciF.on) return; const o = AG(); window.__ciF.n++; if (window.__ci2.busy()) window.__ciF.mid++; if (o.length) window.__ciF.bad.push(o.join('; ')); requestAnimationFrame(loop); })(); });
      await act(); await page.waitForTimeout(60); await still(page); await page.waitForTimeout(60);
      const r = await page.evaluate(() => { window.__ciF.on = false; return window.__ciF; });
      frames += r.n;
      ok(!r.bad.length, `${w} frames ${label}: ${r.bad.length} bad of ${r.n}: ${r.bad.slice(0, 2).join(' | ')}`);
      ok(r.n >= 3, `${w} frames ${label}: only ${r.n} frames`);
    }
    await page.evaluate(`window.__ciAgree = ${AGREE.toString()}`);
    const knob = (sel) => page.evaluate((sel) => { const r = document.querySelector(sel + ' .tk2-knob').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel);
    await watch('drag the mean up, down past the other tray, and back', async () => {
      const k = await knob('.ci2-hmean'); await page.mouse.move(k[0], k[1]); await page.mouse.down();
      for (let d = 0; d >= -90; d -= 6) await page.mouse.move(k[0], k[1] + d);
      for (let d = -90; d <= 120; d += 10) await page.mouse.move(k[0], k[1] + d);
      for (let d = 120; d >= 0; d -= 15) await page.mouse.move(k[0], k[1] + d);
      await page.mouse.up();
    });
    await watch('keys on the mean: PageDown x4, Home, End', async () => {
      await page.focus('.ci2-hmean .tk2-knob');
      for (const key of ['PageDown', 'PageDown', 'PageDown', 'PageDown']) { await page.keyboard.press(key); await page.waitForTimeout(60); }
      await page.keyboard.press('Home'); await page.waitForTimeout(120); await page.keyboard.press('End');
    });
    await watch('drag the tallest plant (the SD) up and down', async () => {
      await page.evaluate(() => window.__ci2.reset()); await still(page);
      const k = await knob('.ci2-hsd'); await page.mouse.move(k[0], k[1]); await page.mouse.down();
      for (let d = 0; d >= -40; d -= 4) await page.mouse.move(k[0], k[1] + d);
      for (let d = -40; d <= 60; d += 6) await page.mouse.move(k[0], k[1] + d);
      await page.mouse.up();
    });
    // changing n changes only n: each tray's drawn mean and SD stay within 0.1 cm on every frame, and the verdict
    // (overlap or not) changes at most once
    async function steady(label, setup, act) {
      await setup(); await still(page); await page.waitForTimeout(80);
      await page.evaluate(() => { window.__ciS = { on: true, bad: [], flips: 0, last: null, n: 0 }; (function loop(){ const S = window.__ciS; if (!S.on) return; const X = window.__ci2, Mo = X.Mo(), d = X.drawn(), V = X.V(); S.n++;
        d.forEach((s, g) => { if (s.n > 1) { if (Math.abs(s.mean - Mo[g].m) > 0.1) S.bad.push(`tray ${g} mean ${s.mean.toFixed(2)} vs ${Mo[g].m}`); if (Math.abs(s.sd - Mo[g].s) > 0.1) S.bad.push(`tray ${g} SD ${s.sd.toFixed(2)} vs ${Mo[g].s}`); } });
        const ov = V ? V.kind === 'ov' : null; if (ov !== null && S.last !== null && ov !== S.last) S.flips++; if (ov !== null) S.last = ov; requestAnimationFrame(loop); })(); });
      await act(); await page.waitForTimeout(60); await still(page); await page.waitForTimeout(60);
      const r = await page.evaluate(() => { window.__ciS.on = false; return window.__ciS; });
      ok(!r.bad.length && r.flips <= 1, `${w} only n changes, ${label}: ${r.bad.length} off of ${r.n} frames, ${r.flips} flips: ${r.bad.slice(0, 2).join(' | ')}`);
    }
    for (const [a, b] of [[5, 20], [20, 5], [5, 10], [10, 20], [20, 10], [10, 5]]) await steady(`${a} to ${b}`, async () => { await page.evaluate(() => window.__ci2.reset()); await still(page); if (a !== 5) { await page.click(`.ci2-nb[data-n="${a}"]`); await still(page); } }, async () => { await page.click(`.ci2-nb[data-n="${b}"]`); });
    for (const [a, b] of [[5, 20], [20, 5], [10, 20], [20, 10], [10, 5], [10, 5], [10, 5], [10, 5]]) await steady(`${a} to ${b} after New sample`, async () => { await page.evaluate(() => window.__ci2.reset()); await still(page); if (a !== 5) { await page.click(`.ci2-nb[data-n="${a}"]`); await still(page); } await page.click('.ci2-new'); }, async () => { await page.click(`.ci2-nb[data-n="${b}"]`); });
    await watch('5 to 20 plants (they sprout)', async () => { await page.evaluate(() => window.__ci2.reset()); await still(page); await page.click('.ci2-nb[data-n="20"]'); });
    if (SHOTS) { await page.evaluate(() => window.__ci2.reset()); await still(page); await page.click('.ci2-nb[data-n="20"]'); await page.waitForTimeout(380); await page.screenshot({ path: join(SHOTS, `mid-${w}-sprout.png`), fullPage: w < 500 }); await still(page); }
    await watch('20 to 5 plants (they leave)', async () => { await page.click('.ci2-nb[data-n="5"]'); });
    await watch('5 to 10, then 20 while still growing', async () => { await page.click('.ci2-nb[data-n="10"]'); await page.waitForTimeout(150); await page.click('.ci2-nb[data-n="20"]'); });
    await watch('New sample at 20, then at 5', async () => { await page.click('.ci2-new'); await page.waitForTimeout(900); await page.click('.ci2-nb[data-n="5"]'); await page.waitForTimeout(700); await page.click('.ci2-new'); });
    if (SHOTS) { await page.click('.ci2-new'); await page.waitForTimeout(300); await page.screenshot({ path: join(SHOTS, `mid-${w}-sample.png`), fullPage: w < 500 }); await still(page); }
    await watch('drag while new plants sprout', async () => { await page.click('.ci2-nb[data-n="20"]'); await page.waitForTimeout(100); const k = await knob('.ci2-hmean'); await page.mouse.move(k[0], k[1]); await page.mouse.down(); for (let d = 0; d <= 50; d += 5) await page.mouse.move(k[0], k[1] + d); await page.mouse.up(); });
    await watch('Start over', async () => { await page.click('.ci2-reset'); });
    if (SHOTS) { await page.click('.ci2-nb[data-n="20"]'); await still(page); await page.click('.ci2-reset'); await page.waitForTimeout(250); await page.screenshot({ path: join(SHOTS, `mid-${w}-startover.png`), fullPage: w < 500 }); await still(page); }
    // leaving mid change: Test yourself and back, the screen is clean and the plants are whole
    await page.click('.ci2-nb[data-n="20"]'); await page.waitForTimeout(200);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button, [role=tab]')].find(x => /Test yourself/.test(x.textContent)); b && b.click(); }); await page.waitForTimeout(300);
    ok(await page.evaluate(() => !window.__ci2.busy()), `${w}: leaving mid change stops it`);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button, [role=tab]')].find(x => /^Explore$/.test(x.textContent.trim())); b && b.click(); }); await page.waitForTimeout(400);
    const back = await page.evaluate(() => window.__ciAgree()); ok(!back.length, `${w}: back from Test yourself: ${back.join('; ')}`);
    // real touch drag of the mean knob at the phone width (the page must not scroll)
    if (w < 500) {
      await page.evaluate(() => window.__ci2.reset()); await still(page);
      const y0 = await page.evaluate(() => scrollY), k = await knob('.ci2-hmean'), cdp = await page.context().newCDPSession(page);
      const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
      await tp('touchStart', k[0], k[1]); for (let d = 0; d <= 60; d += 6) await tp('touchMove', k[0], k[1] + d); await tp('touchEnd');
      await still(page);
      const r = await page.evaluate((y0) => ({ m: window.__ci2.Mo()[1].m, dy: scrollY - y0 }), y0);
      ok(r.m < 16 && Math.abs(r.dy) < 2, `${w} touch drag moves the mean, not the page ${JSON.stringify(r)}`);
    }
    // reduced motion: the result at once with a cross fade
    const rm = await open(w, false, { noCue: true, reduced: true });
    await rm.page.click('.ci2-nb[data-n="20"]');
    // (the site's reduced motion rule gives every property a 0.01 ms transition: read after one frame)
    await rm.page.waitForTimeout(80);
    const rmR = await rm.page.evaluate(() => ({ busy: window.__ci2.busy(), n: window.__ci2.drawn()[1].n, fade: document.querySelector('.ci2-scene').classList.contains('is-fade') }));
    ok(!rmR.busy && rmR.n === 20 && rmR.fade, `${w} reduced motion: at once with a cross fade ${JSON.stringify(rmR)}`);
    await rm.page.evaluate(`window.__ciAgree = ${AGREE.toString()}`);
    const rmA = await rm.page.evaluate(() => window.__ciAgree()); ok(!rmA.length, `${w} reduced motion agrees: ${rmA.join('; ')}`);
    await rm.browser.close();
    ok(!errs.length, `${w} frames: console ${errs.join(' | ')}`);
    console.log(`  ${w}: ${frames} frames checked`);
    await browser.close();
  }
}

if (PERF) {
  const probe = async (page, sel, span) => {
    await page.evaluate(() => { window.__ft = []; window.__fon = true; let last = performance.now(); (function loop(t){ if (!window.__fon) return; window.__ft.push(t - last); last = t; requestAnimationFrame(loop); })(performance.now()); });
    const k = await page.evaluate((sel) => { const e = [...document.querySelectorAll(sel)].find(x => x.getBoundingClientRect().width > 0); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, sel);
    await page.mouse.move(k[0], k[1]); await page.mouse.down();
    for (let i = 0; i <= 24; i++) { await page.mouse.move(k[0] + span[0] * i / 24, k[1] + span[1] * i / 24); await page.waitForTimeout(16); }
    for (let i = 24; i >= 0; i--) { await page.mouse.move(k[0] + span[0] * i / 24, k[1] + span[1] * i / 24); await page.waitForTimeout(16); }
    await page.mouse.up(); await page.waitForTimeout(700);
    const ft = (await page.evaluate(() => { window.__fon = false; return window.__ft.slice(2); })).sort((a, b) => a - b);
    const q = (p) => ft[Math.min(ft.length - 1, Math.floor(ft.length * p))];
    return `${ft.length} frames, median ${q(0.5).toFixed(1)} ms, p95 ${q(0.95).toFixed(1)} ms, max ${ft[ft.length - 1].toFixed(1)} ms`;
  };
  for (const w of [390, 1440]) {
    for (const which of ['ci mean (20 plants)', 'ci spread (20 plants)', 'ci sprout 5 to 20', 'FLAGSHIP fertilizer']) {
      const browser = await chromium.launch({ executablePath: EXE });
      const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, serviceWorkers: 'block' });
      await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
      await ctx.route(u => u.href.includes('/assets/premium.js'), async r => { const resp = await r.fetch(); const body = (await resp.text()).replace('function has(course) {', 'function has(course) { return true;'); await r.fulfill({ response: resp, body }); });
      const page = await ctx.newPage();
      await page.addInitScript(() => { localStorage.setItem('tk2c:apbio-ci', '1'); });
      const flag = /FLAG/.test(which);
      await page.goto(flag ? `http://localhost:${PORT}/environmental-science/tools/water-pollution.html` : URL0);
      if (flag) await page.waitForSelector('.tk2-knob', { state: 'attached', timeout: 15000 }); else await page.waitForSelector('.ci2-pl', { timeout: 15000 });
      await page.waitForTimeout(1500);
      if (!flag && !/sprout/.test(which)) { await page.evaluate(() => window.__ci2.set({ n: 20 })); await page.waitForTimeout(300); }
      const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      if (/sprout/.test(which)) {
        await page.evaluate(() => { window.__ft = []; window.__fon = true; let last = performance.now(); (function loop(t){ if (!window.__fon) return; window.__ft.push(t - last); last = t; requestAnimationFrame(loop); })(performance.now()); });
        await page.click('.ci2-nb[data-n="20"]'); await page.waitForTimeout(2500);
        const ft = (await page.evaluate(() => { window.__fon = false; return window.__ft.slice(2); })).sort((a, b) => a - b); const q = (p) => ft[Math.min(ft.length - 1, Math.floor(ft.length * p))];
        console.log(`  perf ${w} ${which} (CPU x4): ${ft.length} frames, median ${q(0.5).toFixed(1)} ms, p95 ${q(0.95).toFixed(1)} ms, max ${ft[ft.length - 1].toFixed(1)} ms`);
      } else {
        const sel = flag ? '.tk2-knob' : /spread/.test(which) ? '.ci2-hsd .tk2-knob' : '.ci2-hmean .tk2-knob';
        const span = flag ? [Math.min(260, w * 0.3), 0] : [0, /spread/.test(which) ? -30 : (w < 500 ? 70 : 140)];
        console.log(`  perf ${w} ${which} (CPU x4): ${await probe(page, sel, span)}`);
      }
      await browser.close();
    }
  }
  pass++;
}

server.close();
const label = ONE ? `width ${ONE}` : FRAMES ? 'frames' : 'perf';
fails.slice(0, 40).forEach(f => console.log('  FAIL ' + f));
console.log(`bio-confidence-intervals sweep ${label}: ${pass} passed, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
