#!/usr/bin/env node
/* Tools v2 sweep: AP Biology, Rates and percent change (docs/tools-v2-rates-brief.md; pattern of
   scripts/tools-v2/chi-square-sweep.mjs).
   Landmark states of the three Explore tabs (Rate over time: the opening, the first minute, the last minute, the
   whole run, a late short interval; Rate at a moment: the start, the opening, near the end, the end; Percent change:
   the opening, no change, a 10% loss, the smallest and the largest core), the Challenges view and a Problems view,
   at widths 360 to 1920, light and dark:
     - no sideways scroll; nothing clipped by the scene or the graph (pills, labels, cue, knobs);
     - labels on the picture and on the graph never overlap each other or a tick number (4 px);
     - the picture (scene and graph) is the largest thing on the stage; knobs at least 44 px to grab;
     - no rendered text under 11 px; phones: the cause line is at most two rows and keeps its height;
     - the numbers agree with what is DRAWN (see agree()): the gas in the cylinder and the band, the triangle's
       legs, the tangent's slope, the core's height are measured from the DOM and the words read back;
   and, frame by frame at 390 and 1440 (--frames): every frame of the end point gliding along the readings, the
   start point, a jump to the last reading, the moment knob Home and End, the core keyed up and down, Start over
   and a tab switch: each frame's words match that frame's drawing.
   --perf: frame times of a full drag at CPU x4 at 390 and 1440, beside the flagship's fertilizer drag.
   Usage: node scripts/tools-v2/rates-sweep.mjs [--width <px>] [--frames] [--perf] [--shots <dir>]
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
  console.log(`\nrates sweep, all runs: ${pass} passed, ${fail} failed${bad ? ' (a run did not finish)' : ''}`);
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
const URL0 = `http://localhost:${PORT}/bio/tools/rates.html`;
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
  await page.addInitScript(([dark, noCue]) => { try { if (dark) localStorage.setItem('nremt_theme', 'dark'); if (noCue) localStorage.setItem('tk2c:apbio-rates', '1'); } catch (e) {} }, [dark, !!opts.noCue]);
  await page.goto(URL0 + (opts.hash || '')); await page.waitForSelector('.rt2-gas, .rt-fig', { timeout: 15000 }); await page.waitForTimeout(700);
  return { browser, page, errs };
}
async function until(page, fn, a) { for (let i = 0; i < 120; i++) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(50); } return false; }
const still = (page) => until(page, () => !window.__rt2.busy());

/* Read everything back from the DOM and check the words against the drawing (runs in the page). */
const AGREE = () => {
  const X = window.__rt2, R = X.R(), G = X.G(), GG = X.GG(), out = [], st = document.querySelector('.rt2');
  const tab = st.getAttribute('data-tab');
  const num = (s) => { const m = /([−+-]?\d+(?:\.\d+)?)/.exec(s || ''); return m ? parseFloat(m[1].replace('−', '-')) : NaN; };
  const pills = (sel) => [...document.querySelectorAll(sel + ' .rt2-pill')].filter(g => g.style.display !== 'none').map(g => g.querySelector('text').textContent);
  const cz = [...document.querySelectorAll('.rt2 .tk2-cause .tk2-cz')].map(e => e.textContent);
  const take = document.querySelector('.rt2 .tk2-cause.is-take');
  const near = (a, b, t, what) => { if (!(Math.abs(a - b) <= t)) out.push(`${what}: ${a} vs ${b}`); };
  const attr = (sel, k) => parseFloat(document.querySelector(sel).getAttribute(k));
  const lcd = document.querySelector('.rt2-lcdt') ? [...document.querySelectorAll('.rt2-lcdt')].map(e => e.textContent) : [];
  if (tab === 'avg' || tab === 'moment') {
    // the gas in the cylinder, measured
    const gh = attr('.rt2-gas', 'height'), vb = (attr('.rt2-gas', 'y') + gh - G.gy0) / G.kV;
    // the graph: the end point drawn at (legT x2 or the end dot)
    const tB = GG.t(attr('.rt2-gend:nth-of-type(2)', 'cx') || 0);
    const pB = [...document.querySelectorAll('.rt2-gend')][1], tEnd = GG.t(parseFloat(pB.getAttribute('cx')));
    near(vb, X.f(tEnd), 0.03, 'gas in the cylinder vs the end point on the graph');
    // the timer
    const secs = Math.round(tEnd * 60), want = Math.floor(secs / 60) + ':' + ('0' + secs % 60).slice(-2);
    const shown = lcd[0].split(':'), sec2 = +shown[0] * 60 + +shown[1];
    if (Math.abs(sec2 - tEnd * 60) > 0.52) out.push(`timer ${lcd[0]} vs drawn time ${want}`);   // the knob's circle is written to 0.01 px
    if (tab === 'avg') {
      const lt = document.querySelector('.rt2-leg.is-dt'), ly = document.querySelector('.rt2-leg.is-dy');
      const dtDrawn = GG.t(+lt.getAttribute('x2')) - GG.t(+lt.getAttribute('x1'));
      const dyDrawn = (+ly.getAttribute('y1') - +ly.getAttribute('y2')) / (GG.ph - GG.IN) * 15;
      const bandDy = attr('.rt2-band', 'height') / G.kV;
      near(bandDy, dyDrawn, 0.06, 'the band in the cylinder vs the Δy leg');
      const gp = pills('.rt2-graph'), sp = pills('.rt2-scene');
      const gDt = gp.find(s => /^Δt/.test(s)), gDy = gp.find(s => /^Δy/.test(s)), gRate = gp.find(s => /^slope/.test(s));
      const sDt = sp.find(s => /^Δt/.test(s)), sDy = sp.find(s => /^Δy/.test(s));
      if (!gDt || !gRate || !sDt || !sDy) out.push(`a label is missing: ${JSON.stringify(gp)} ${JSON.stringify(sp)}`);
      if (gDt) near(num(gDt), dtDrawn, 0.051, 'Δt label vs the Δt leg');
      if (gDy) near(num(gDy), dyDrawn, 0.051, 'Δy label vs the Δy leg');
      if (sDy) near(num(sDy), dyDrawn, 0.051, 'the cylinder’s Δy vs the Δy leg');
      if (gDt && sDt && gDt !== sDt) out.push(`Δt on the graph ${gDt} vs at the timer ${sDt}`);
      if (gDy && sDy && gDy !== sDy) out.push(`Δy on the graph ${gDy} vs at the cylinder ${sDy}`);
      const dyS = num(sDy), dtS = num(sDt);
      if (gRate) near(num(gRate), dyS / dtS, 0.0051, 'the slope label vs Δy ÷ Δt as shown');
      if (!take) { near(num(cz[0]), dyS, 1e-9, 'cause Δy'); near(num(cz[1]), dtS, 1e-9, 'cause Δt'); near(num(cz[2]), num(gRate), 1e-9, 'cause rate'); }
      // the hypotenuse runs between the drawn points
      const hy = document.querySelector('.rt2-hyp');
      near(+hy.getAttribute('x1'), +lt.getAttribute('x1'), 0.6, 'hypotenuse start'); near(+hy.getAttribute('y2'), +ly.getAttribute('y2'), 0.6, 'hypotenuse end');
    } else {
      const tn = document.querySelector('.rt2-tan'), x1 = +tn.getAttribute('x1'), y1 = +tn.getAttribute('y1'), x2 = +tn.getAttribute('x2'), y2 = +tn.getAttribute('y2');
      const slope = ((y1 - y2) / (GG.ph - GG.IN) * 15) / (GG.t(x2) - GG.t(x1));
      near(slope, X.fd(tEnd), 0.02, 'tangent drawn vs the slope of the curve at the drawn point');
      const ly = document.querySelector('.rt2-leg.is-dy'), rise = Math.abs(+ly.getAttribute('y1') - +ly.getAttribute('y2')) / (GG.ph - GG.IN) * 15;
      const lt = document.querySelector('.rt2-leg.is-dt'), run = Math.abs(GG.t(+lt.getAttribute('x2')) - GG.t(+lt.getAttribute('x1')));
      near(run, 1, 0.01, 'the run is 1 min');
      const gp = pills('.rt2-graph'), gRate = gp.find(s => /^rate/.test(s)), gRise = gp.find(s => /^rise/.test(s));
      if (!gRate) out.push('rate label missing');
      if (gRate) near(num(gRate.replace('≈', '')), slope, 0.051, 'rate label vs the tangent drawn');
      if (gRise) near(num(gRise), rise, 0.051, 'rise label vs the rise leg');
      if (!take) { near(num(cz[0]), tEnd, 0.051, 'cause time'); near(num((cz[2] || '').replace('≈', '')), num((gRate || '').replace('≈', '')), 1e-9, 'cause rate'); }
      const sp = pills('.rt2-scene'), gas = sp.find(s => /O₂/.test(s));
      if (gas) near(num(gas), vb, 0.051, 'oxygen pill vs the gas drawn'); else out.push('oxygen pill missing');
    }
  } else {
    const core = document.querySelector('.rt2-core:not(:first-child)') || [...document.querySelectorAll('.rt2-core')][1];
    const ct = [...document.querySelectorAll('.rt2-coretop')][1], top = +ct.getAttribute('cy') - +ct.getAttribute('ry');
    const mass = (G.pan - top) / G.kM;
    near(mass, num(lcd[1]), 0.012, 'the core drawn vs its balance');
    const pc = [...document.querySelectorAll('.rt2-scene .rt2-pill.is-pct text')][0].textContent;
    const want = Math.round((Math.round((num(lcd[1]) - 3.5) * 100) / 100) / 3.5 * 1000) / 10;
    near(num(pc), want, 1e-9, 'percent pill vs the balances');
    if (!take) near(num((cz[2] || '').replace('× 100 =', '')), num(pc), 1e-9, 'cause percent');
  }
  return out;
};

/* Geometry: clipping, overlaps, text size, the cause line (runs in the page). */
const GEO = () => {
  const out = [], st = document.querySelector('.rt2'), tab = st.getAttribute('data-tab'), phone = innerWidth <= 640;
  const scene = document.querySelector('.rt2-scene').getBoundingClientRect(), graph = document.querySelector('.rt2-graph').getBoundingClientRect();
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[style*="display: none"]'); };
  const inside = (r, b, what) => { if (r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1) out.push(`${what} clipped (${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)})`); };
  const lab = [];
  document.querySelectorAll('.rt2-scene .rt2-pill, .rt2-scene text').forEach(e => { if (!vis(e)) return; const r = e.getBoundingClientRect(); inside(r, scene, 'scene ' + (e.textContent || '').slice(0, 14)); if (e.matches('.rt2-pill') || e.matches('.rt2-clab, .rt2-foaml, .rt2-what')) lab.push([r, e.textContent, 'scene']); if (e.matches('.rt2-rnum')) lab.push([r, e.textContent, 'scene']); });
  if (tab !== 'pct') document.querySelectorAll('.rt2-graph .rt2-pill, .rt2-graph text').forEach(e => { if (!vis(e) || e.closest('.rt2-pill') && !e.matches('.rt2-pill')) return; const r = e.getBoundingClientRect(); inside(r, graph, 'graph ' + e.textContent.slice(0, 14)); lab.push([r, e.textContent, 'graph']); });
  for (let i = 0; i < lab.length; i++) for (let j = i + 1; j < lab.length; j++) {
    const a = lab[i][0], b = lab[j][0];
    if (a.left < b.right + 4 && a.right > b.left - 4 && a.top < b.bottom + 4 && a.bottom > b.top - 4 && !(lab[i][1].includes(lab[j][1]) || lab[j][1].includes(lab[i][1]))) {
      // tick numbers on the same axis sit closer than 4 px only along the axis (never overlap)
      const tick = /^\d+$/.test(lab[i][1]) && /^\d+$/.test(lab[j][1]) && (a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
      if (!tick) out.push(`overlap: "${lab[i][1]}" / "${lab[j][1]}"`);
    }
  }
  // labels clear of the knobs
  document.querySelectorAll('.rt2 .tk2-handle:not([hidden]) .tk2-knob').forEach(k => { if (!vis(k)) return; const r = k.getBoundingClientRect(); if (r.width < 43.5 || r.height < 43.5) out.push(`knob ${Math.round(r.width)} px`); lab.forEach(l => { const a = l[0]; if (a.left < r.right - 6 && a.right > r.left + 6 && a.top < r.bottom - 6 && a.bottom > r.top + 6 && l[2] === (k.closest('.rt2-scene') ? 'scene' : 'graph')) out.push(`knob covers "${l[1]}"`); }); });
  // the cue never covers a label
  const cue = document.querySelector('.rt2 .tk2-cue');
  if (cue) { const r = cue.getBoundingClientRect(); lab.forEach(l => { const a = l[0]; if (!/^\d+$/.test(l[1]) && a.left < r.right && a.right > r.left && a.top < r.bottom && a.bottom > r.top) out.push(`cue covers "${l[1]}"`); }); inside(r, tab === 'pct' ? scene : graph, 'cue'); }
  // text size
  document.querySelectorAll('.rt2 text, .rt2 .tk2-cz, .rt2 .tk2-purpose, .rt2 .tk2-tab, .rt2 button').forEach(e => { if (!vis(e)) return; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 11) out.push(`text ${fs}px "${e.textContent.slice(0, 16)}"`); });
  // the picture is the largest thing
  const area = (r) => r.width * r.height, pic = area(scene) + (tab === 'pct' ? 0 : area(graph));
  [...st.children].forEach(c => { if (c.matches('.rt2-scene, .rt2-graph') || !vis(c)) return; if (area(c.getBoundingClientRect()) > area(scene)) out.push(`${c.className} bigger than the scene`); });
  if (document.documentElement.scrollWidth > innerWidth + 1) out.push(`sideways scroll ${document.documentElement.scrollWidth}`);
  const cz = document.querySelector('.rt2 .tk2-cause'), cr = cz.getBoundingClientRect(), rows = new Set([...cz.querySelectorAll('.tk2-cz')].map(e => Math.round(e.getBoundingClientRect().top))).size;
  if (phone && rows > 2) out.push(`cause line ${rows} rows`);
  return { out, causeH: Math.round(cr.height), scene: [Math.round(scene.width), Math.round(scene.height)], pic };
};

const STATES = [
  ['avg-open', { tab: 'avg', a: 0, b: 2 }], ['avg-first', { tab: 'avg', a: 0, b: 1 }], ['avg-last', { tab: 'avg', a: 4, b: 5 }], ['avg-whole', { tab: 'avg', a: 0, b: 5 }],
  ['avg-late', { tab: 'avg', a: 3, b: 5 }], ['avg-mid', { tab: 'avg', a: 2, b: 3 }],
  ['mom-0', { tab: 'moment', m: 0 }], ['mom-open', { tab: 'moment', m: 1.5 }], ['mom-35', { tab: 'moment', m: 3.5 }], ['mom-42', { tab: 'moment', m: 4.2 }], ['mom-5', { tab: 'moment', m: 5 }],
  ['pct-open', { tab: 'pct', c: 3.92 }], ['pct-zero', { tab: 'pct', c: 3.5 }], ['pct-loss10', { tab: 'pct', c: 3.15 }], ['pct-min', { tab: 'pct', c: 1.75 }], ['pct-max', { tab: 'pct', c: 5.25 }]];

if (ONE) {
  const w = +ONE;
  for (const theme of ['light', 'dark']) {
    const { browser, page, errs } = await open(w, theme === 'dark');
    // the first visit: the cue on the end point
    const g0 = await page.evaluate(GEO);
    ok(!g0.out.length, `${w} ${theme} first visit: ${g0.out.join('; ')}`);
    ok(await page.evaluate(() => !!document.querySelector('.rt2 .tk2-cue')), `${w} ${theme}: the first visit cue shows`);
    if (SHOTS && (w === 390 || w === 1440 || w === 768)) await page.screenshot({ path: join(SHOTS, `sweep-${w}-${theme}-00-first.png`), fullPage: w < 500 });
    await page.evaluate(() => { localStorage.setItem('tk2c:apbio-rates', '1'); document.querySelector('.rt2 .tk2-cue')?.remove(); });
    const heights = {};
    for (const [name, s] of STATES) {
      await page.evaluate((s) => window.__rt2.set(s), s); await page.waitForTimeout(80); await still(page);
      const g = await page.evaluate(GEO);
      ok(!g.out.length, `${w} ${theme} ${name}: ${g.out.join('; ')}`);
      const a = await page.evaluate(AGREE);
      ok(!a.length, `${w} ${theme} ${name}: ${a.join('; ')}`);
      (heights[s.tab] = heights[s.tab] || new Set()).add(g.causeH);
      if (SHOTS && (w === 390 || w === 1440 || w === 768)) await page.screenshot({ path: join(SHOTS, `sweep-${w}-${theme}-${name}.png`), fullPage: w < 500 });
    }
    if (w <= 640) for (const t in heights) ok(heights[t].size === 1, `${w} ${theme} ${t}: the cause line changes height ${[...heights[t]]}`);
    ok(!errs.length, `${w} ${theme}: console ${errs.join(' | ')}`);
    // Challenges, from the opening
    await page.goto('about:blank'); await page.goto(URL0 + '#goals'); await page.waitForSelector('.rt2-gas'); await page.waitForTimeout(900); await still(page);
    const gg = await page.evaluate(GEO); ok(!gg.out.length, `${w} ${theme} goals: ${gg.out.join('; ')}`);
    const ag = await page.evaluate(AGREE); ok(!ag.length, `${w} ${theme} goals: ${ag.join('; ')}`);
    ok(await page.evaluate(() => { const X = window.__rt2; return X.MD.a === 0 && X.MD.b === 2 && !!document.querySelector('.tk2-chal, .tk2-challenges'); }), `${w} ${theme} goals: from the opening with the challenge card`);
    if (SHOTS && (w === 390 || w === 1440)) await page.screenshot({ path: join(SHOTS, `sweep-${w}-${theme}-goals.png`), fullPage: w < 500 });
    // Problems
    await page.goto('about:blank'); await page.goto(URL0 + '#practice'); await page.waitForSelector('.rt-fig'); await page.waitForTimeout(500);
    const pf = await page.evaluate(() => { const f = [...document.querySelectorAll('.rt-fig')].find(e => e.getBoundingClientRect().width > 0); const r = f.getBoundingClientRect(), vb = f.viewBox.baseVal, k = Math.min(r.width / vb.width, r.height / vb.height); const small = [...f.querySelectorAll('text')].map(t => parseFloat(getComputedStyle(t).fontSize) * k).filter(s => s < 10.95); return { h: r.height, small, sw: document.documentElement.scrollWidth, vw: innerWidth, dash: [...f.querySelectorAll('*')].filter(e => { const d = getComputedStyle(e).strokeDasharray; return d && d !== 'none'; }).length }; });
    ok(pf.h >= 200, `${w} ${theme} practice: figure ${pf.h} px tall`);
    ok(!pf.small.length, `${w} ${theme} practice: text under 11 px ${pf.small.slice(0, 3)}`);
    ok(pf.sw <= pf.vw + 1, `${w} ${theme} practice: sideways scroll`);
    ok(!pf.dash, `${w} ${theme} practice: ${pf.dash} dashed shapes`);
    if (SHOTS && (w === 390 || w === 1440)) await page.screenshot({ path: join(SHOTS, `sweep-${w}-${theme}-practice.png`), fullPage: w < 500 });
    await browser.close();
  }
}

if (FRAMES) {
  for (const w of [390, 1440]) {
    const { browser, page, errs } = await open(w, false, { noCue: true });
    let frames = 0, checks = 0;
    // record every frame's agreement while a change plays
    async function watch(label, act) {
      await page.evaluate(() => { window.__rtF = { n: 0, bad: [], on: true }; const AG = window.__rtAgree; (function loop(){ if(!window.__rtF.on) return; const o = AG(); window.__rtF.n++; if (o.length) window.__rtF.bad.push(o.join('; ')); requestAnimationFrame(loop); })(); });
      await act(); await page.waitForTimeout(60); await still(page); await page.waitForTimeout(60);
      const r = await page.evaluate(() => { window.__rtF.on = false; return window.__rtF; });
      frames += r.n; checks += r.n;
      ok(!r.bad.length, `${w} frames ${label}: ${r.bad.length} bad of ${r.n}: ${r.bad.slice(0, 2).join(' | ')}`);
      ok(r.n >= 3, `${w} frames ${label}: only ${r.n} frames`);
    }
    await page.evaluate(`window.__rtAgree = ${AGREE.toString()}`);
    await page.evaluate(() => window.__rt2.set({ tab: 'avg', a: 0, b: 2 }));
    // a real drag of the end point along the readings, out and back
    const box = async (sel) => page.evaluate((sel) => { const e = [...document.querySelectorAll(sel)].find(x => x.getBoundingClientRect().width); const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel);
    const pt = async (t, v) => page.evaluate(([t, v]) => { const GG = window.__rt2.GG(), r = document.querySelector('.rt2-gsvg').getBoundingClientRect(); return [r.left + GG.x(t), r.top + GG.y(v)]; }, [t, v]);
    await watch('drag the end point to 5 and back to 1', async () => {
      const kb = await page.evaluate(() => { const e = [...document.querySelectorAll('.rt2-graph .tk2-handle:not([hidden]) .tk2-knob')]; return e.map(x => { const r = x.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); });
      const end = kb[0];
      await page.mouse.move(end[0], end[1]); await page.mouse.down();
      for (let t = 2; t <= 5; t += 0.25) { const p = await pt(t, 0); await page.mouse.move(p[0], end[1], { steps: 2 }); }
      await page.waitForTimeout(250);
      for (let t = 5; t >= 1; t -= 0.5) { const p = await pt(t, 0); await page.mouse.move(p[0], end[1], { steps: 1 }); }
      await page.mouse.up();
    });
    await watch('keys: End point End, start point right', async () => {
      await page.evaluate(() => { const ks = [...document.querySelectorAll('.rt2-graph .tk2-handle:not([hidden]) .tk2-knob')]; ks.find(k => /End/.test(k.getAttribute('aria-label'))).focus(); });
      await page.keyboard.press('End'); await page.waitForTimeout(120);
      await page.evaluate(() => { [...document.querySelectorAll('.rt2-graph .tk2-handle:not([hidden]) .tk2-knob')].find(k => /Start/.test(k.getAttribute('aria-label'))).focus(); });
      await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
    });
    await watch('Start over', async () => { await page.click('.rt2-reset'); });
    await watch('tab: Rate at a moment, Home then End', async () => {
      await page.evaluate(() => window.__rt2.tab('moment')); await page.waitForTimeout(100);
      await page.evaluate(() => [...document.querySelectorAll('.rt2-graph .tk2-handle:not([hidden]) .tk2-knob')][0].focus());
      await page.keyboard.press('Home'); await page.waitForTimeout(500); await page.keyboard.press('End');
    });
    await watch('drag along the curve', async () => {
      const kb = await page.evaluate(() => { const r = [...document.querySelectorAll('.rt2-graph .tk2-handle:not([hidden]) .tk2-knob')][0].getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      await page.mouse.move(kb[0], kb[1]); await page.mouse.down();
      for (let t = 5; t >= 0; t -= 0.2) { const p = await pt(t, 0); await page.mouse.move(p[0], kb[1]); }
      await page.mouse.up();
    });
    await watch('tab: Percent change, keys down and up, Start over', async () => {
      await page.evaluate(() => window.__rt2.tab('pct')); await page.waitForTimeout(100);
      await page.evaluate(() => document.querySelector('.rt2-scene .tk2-handle:not([hidden]) .tk2-knob').focus());
      await page.keyboard.press('Home'); await page.waitForTimeout(300); await page.keyboard.press('End'); await page.waitForTimeout(200);
      for (let i = 0; i < 6; i++) await page.keyboard.press('PageDown');
      await page.waitForTimeout(200); await page.click('.rt2-reset');
    });
    await watch('drag the core', async () => {
      const kb = await page.evaluate(() => { const r = document.querySelector('.rt2-scene .tk2-handle:not([hidden]) .tk2-knob').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      await page.mouse.move(kb[0], kb[1]); await page.mouse.down();
      for (let d = 0; d <= 120; d += 6) await page.mouse.move(kb[0], kb[1] + d);
      for (let d = 120; d >= -60; d -= 10) await page.mouse.move(kb[0], kb[1] + d);
      await page.mouse.up();
    });
    // reduced motion: the result at once (no tween), the words whole
    const rm = await open(w, false, { noCue: true, reduced: true });
    await rm.page.evaluate(() => window.__rt2.set({ tab: 'avg', a: 0, b: 2 }));
    await rm.page.evaluate(() => [...document.querySelectorAll('.rt2-graph .tk2-handle:not([hidden]) .tk2-knob')].find(k => /End/.test(k.getAttribute('aria-label'))).focus());
    await rm.page.keyboard.press('End');
    const rmR = await rm.page.evaluate(() => ({ busy: window.__rt2.busy(), b: window.__rt2.DR.b, fade: document.querySelector('.rt2-scene').classList.contains('is-fade') }));
    ok(!rmR.busy && rmR.b === 5 && rmR.fade, `${w} reduced motion: at once with a cross fade ${JSON.stringify(rmR)}`);
    await rm.browser.close();
    ok(!errs.length, `${w} frames: console ${errs.join(' | ')}`);
    console.log(`  ${w}: ${frames} frames checked`);
    await browser.close();
  }
}

if (PERF) {
  for (const w of [390, 1440]) {
    for (const which of ['rates', 'flagship']) {
      const browser = await chromium.launch({ executablePath: EXE });
      const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, serviceWorkers: 'block', hasTouch: false });
      await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
      const page = await ctx.newPage();
      await page.addInitScript(() => { localStorage.setItem('tk2c:apbio-rates', '1'); });
      await page.goto(which === 'rates' ? URL0 : `http://localhost:${PORT}/environmental-science/tools/water-pollution.html`);
      await page.waitForTimeout(1800);
      const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const sel = which === 'rates' ? '.rt2-graph .tk2-handle:not([hidden]) .tk2-knob' : '.tk2-drag .tk2-knob, .tk2-knob';
      await page.evaluate(() => { window.__ft = []; let last = performance.now(); (function loop(t){ window.__ft.push(t - last); last = t; if (window.__ft.length < 2000) requestAnimationFrame(loop); })(performance.now()); });
      const kb = await page.evaluate((sel) => { const e = [...document.querySelectorAll(sel)].filter(x => x.getBoundingClientRect().width)[0]; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel);
      await page.evaluate(() => { window.__ft = []; });
      await page.mouse.move(kb[0], kb[1]); await page.mouse.down();
      const span = which === 'rates' ? (w < 500 ? 230 : 1000) : (w < 500 ? 200 : 400);
      for (let i = 0; i <= 60; i++) await page.mouse.move(kb[0] + (which === 'rates' ? span * Math.sin(i / 60 * Math.PI) : span * Math.sin(i / 60 * Math.PI) * 0.6), kb[1] + (which === 'rates' ? 0 : 0));
      await page.mouse.up(); await page.waitForTimeout(600);
      const ft = (await page.evaluate(() => window.__ft)).filter(x => x > 0).sort((a, b) => a - b);
      const q = (p) => ft[Math.min(ft.length - 1, Math.floor(ft.length * p))];
      console.log(`  perf ${which} ${w}: ${ft.length} frames, median ${q(0.5).toFixed(1)} ms, p95 ${q(0.95).toFixed(1)} ms`);
      await browser.close();
    }
  }
  pass++;
}

server.close();
const label = ONE ? `width ${ONE}` : FRAMES ? 'frames' : 'perf';
fails.slice(0, 40).forEach(f => console.log('  FAIL ' + f));
console.log(`rates sweep ${label}: ${pass} passed, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
