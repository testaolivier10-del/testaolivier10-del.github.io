/* Tools v2 sweep for AP® Chemistry ICE tables (docs/tools-v2-chem-ice-tables-brief.md), after the pattern of
   units-sig-figs-sweep.mjs. Three runs in one file:

     node scripts/tools-v2/chem-ice-tables-sweep.mjs [widths] [--shots dir]   layout: every landmark state, light and dark
     node scripts/tools-v2/chem-ice-tables-sweep.mjs 390 --frames            every animation frame of the changes
     node scripts/tools-v2/chem-ice-tables-sweep.mjs 390 --perf [--rate 4]   frame times, with the flagship in the same run

   LAYOUT, at each state (both reactions at the start, a few steps in, the equilibrium step and the last step; the first
   visit; Test yourself), in light and dark:
     - nothing is clipped by the stage (every text on the picture, the knob, its tag, the cue);
     - no two texts on the picture overlap, and each sits at least 4 px clear of the others (the clipboard, the gauge's
       labels, the rail's x and the knob's tag);
     - no rendered text under 11 px (subscripts included);
     - the flask (the thing acted on) is the largest object: larger than the clipboard page and any label;
     - every atom is inside the flask;
     - the words agree with the drawn molecules: the E row is each species' drawn count × the scale, the C row is the x of
       the drawn counts, the clipboard's Q, the knob's tag and the cause line give the same x and Q, the needle points at
       that Q, the gas colour follows the drawn I₂ or NO₂, and "at equilibrium" (or the takeaway) shows exactly at the
       step nearest K;
     - on a phone the cause line is at most two rows and keeps one height;
     - no sideways scroll, no console errors;
     - on a first visit the cue is whole and covers no text, number or the knob.
   FRAMES: a jump of x from the start past equilibrium, a reversal mid change, the End and Home keys and Start over,
   sampled on every animation frame: the table, Q, the tag and the cause line equal what the drawn molecules give at
   that frame; every whole molecule is drawn bonded (its atoms at the template's distances); the counts never leave the
   range between where the change began and where the knob is; nothing is left moving at the end.
   PERF: the knob dragged end to end and back with a mouse (CPU throttled, default x4) at 390 and 1440, then the
   flagship's fertilizer knob the same way in the same run. Target: median about 16 ms, p95 at or under 50 ms.

   Needs Playwright and a Chromium (CHROME or /opt/pw-browsers/chromium-1243/chrome-linux64/chrome). It serves the repo
   on a free port and blocks service workers and other hosts; the tool is free, so nothing is unlocked (the flagship is
   Premium and is unlocked for the perf run only, by routing assets/premium.js). Exit code 1 on any failure. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadavg, cpus } from 'node:os';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
let chromium;
try { ({ chromium } = createRequire(join(ROOT, 'package.json'))('playwright')); }
catch (e) { ({ chromium } = createRequire('/home/claude/testaolivier10-del.github.io/package.json')('playwright')); }
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const p = join(ROOT, normalize(decodeURIComponent(req.url.split('?')[0])));
  if (!p.startsWith(ROOT) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const args = process.argv.slice(2), si = args.indexOf('--shots'), SHOTS = si >= 0 ? args[si + 1] : null;
const FRAMES = args.includes('--frames'), PERF = args.includes('--perf'), ri = args.indexOf('--rate'), RATE = ri >= 0 ? +args[ri + 1] : 4;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const WIDTHS = (args[0] && !args[0].startsWith('--') ? args[0] : '360,390,430,600,768,820,1024,1280,1440,1920').split(',').map(Number);
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
const PAGE = '/chem/tools/ice-table-drills.html';
const IGNORE = /ERR_FAILED|ERR_BLOCKED|Service Worker|net::/;
async function open(o) {
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, serviceWorkers: 'block', deviceScaleFactor: 1, reducedMotion: o.reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.addInitScript(([cue, theme]) => { try { localStorage.setItem('nremt_theme', theme); if (!cue) localStorage.setItem('tk2c:apchem-ice-x', '1'); } catch (e) {} }, [!!o.cue, o.theme || 'light']);
  await page.goto(BASE + PAGE + (o.hash || ''), { waitUntil: 'load' });
  if (!o.hash) { await until(page, () => !!(window.__ice2 && window.__ice2.G())); await page.waitForTimeout(400); }
  else await page.waitForTimeout(1200);
  return { page, errs, ctx };
}
// poll (waitForFunction evaluates a string, which the page's CSP refuses)
async function until(page, fn, ms = 15000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn).catch(() => false)) return; await page.waitForTimeout(50); } throw new Error('timed out waiting'); }
const settle = async page => { await until(page, () => !window.__ice2.busy()); await page.waitForTimeout(120); };
/* Runs in the page: the layout and agreement checks of one settled state. */
const probe = (o) => {
  const out = [], X = window.__ice2, r = X.react(), G = X.G(), M = window.ApChemMath;
  const R = e => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]');
  const scene = document.querySelector('.ix2-scene'), S = R(scene);
  const inS = (x, n, tol = 0.6) => { if (x.l < S.l - tol || x.r > S.r + tol || x.t < S.t - tol || x.b > S.b + tol) out.push('clipped: ' + n); };
  const gap = (a, c, g) => !(a.r + g <= c.l || c.r + g <= a.l || a.b + g <= c.t || c.b + g <= a.t);
  // every text on the picture, and the knob's tag and the knob
  const texts = [...scene.querySelectorAll('svg text')].filter(vis).filter(t => t.textContent.trim()).map(t => ({ n: 'text "' + t.textContent.trim() + '"', r: R(t), el: t }));
  const tag = scene.querySelector('.tk2-drag .tk2-tag'), knob = scene.querySelector('.tk2-drag .tk2-dot');
  const items = texts.slice();
  if (vis(tag)) items.push({ n: 'knob tag "' + tag.textContent + '"', r: R(tag), el: tag });
  if (vis(knob)) items.push({ n: 'knob', r: R(knob), el: knob });
  items.forEach(x => inS(x.r, x.n));
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], c = items[j];
    if (a.n === 'knob' || c.n === 'knob') { if (gap(a.r, c.r, 0)) out.push('overlap: ' + a.n + ' and ' + c.n); continue; }
    if (gap(a.r, c.r, 4)) out.push('closer than 4 px: ' + a.n + ' and ' + c.n);
  }
  // no text under 11 px (a subscript tspan included)
  [...scene.querySelectorAll('svg text, svg tspan')].filter(vis).filter(t => t.textContent.trim() && t.textContent !== ' ').forEach(t => { const fs = parseFloat(getComputedStyle(t).fontSize); if (fs < 10.95) out.push('text under 11 px: "' + t.textContent + '" ' + fs.toFixed(1)); });
  if (vis(tag) && parseFloat(getComputedStyle(tag).fontSize) < 11) out.push('the tag is under 11 px');
  // the flask is the largest object
  const fl = R(scene.querySelector('.ix2-glassrim')), stp = R(scene.querySelector('.ix2-stopper')), flask = { l: fl.l, t: Math.min(fl.t, stp.t), r: fl.r, b: fl.b }; flask.w = flask.r - flask.l; flask.h = flask.b - flask.t;
  const paper = R(scene.querySelector('.ix2-paper')), A = x => x.w * x.h;
  if (A(flask) < A(paper)) out.push(`the flask (${Math.round(A(flask))}) is smaller than the clipboard page (${Math.round(A(paper))})`);
  items.forEach(x => { if (A(x.r) > A(flask)) out.push(x.n + ' is larger than the flask'); });
  inS(flask, 'the flask'); inS(paper, 'the clipboard page');
  // every atom inside the flask's body (or its neck)
  const sc = svg => svg.getBoundingClientRect().width / G.W, k = sc(scene.querySelector('svg'));
  X.mols().forEach(m => m.atoms.forEach(([x, y]) => { const d = Math.hypot(x - G.cx, y - (G.cy + 2)); if (d > G.R - 2) out.push(`an atom of ${m.key} is outside the flask (${d.toFixed(0)} of ${G.R})`); }));
  // the words agree with the drawn molecules
  const c = X.drawn(), per = r.per, x = (r.n0[0] - c[0]) / -r.species[0].nu * per, q = X.Qof(c), fmt = v => M.fmt(v, 3), fq = v => v === 0 ? '0' : M.fmt(v, 3);
  const vals = [...scene.querySelectorAll('.ix2-val')].map(t => t.textContent), n = r.species.length;
  // the I row, then the C row, then the E row (each one cell per species)
  r.species.forEach((s, i) => {
    if (vals[i] !== fmt(r.n0[i] * per)) out.push(`I row ${s.key} shows ${vals[i]}`);
    const cw = x === 0 ? '0' : (s.nu < 0 ? '−' : '+') + fmt(Math.abs(s.nu) * x);
    if (vals[n + i] !== cw) out.push(`C row ${s.key} shows ${vals[n + i]}, drawn x gives ${cw}`);
    if (vals[2 * n + i] !== fmt(c[i] * per)) out.push(`E row ${s.key} shows ${vals[2 * n + i]}, drawn ${c[i]} molecules give ${fmt(c[i] * per)}`);
  });
  const qv = scene.querySelector('.ix2-qv'); if (!qv || qv.textContent !== fq(q)) out.push(`Q on the clipboard ${qv && qv.textContent}, drawn Q ${fq(q)}`);
  const tagT = tag ? tag.textContent : '', xw = x === 0 ? '0' : fmt(x);
  if (tagT !== 'x = ' + xw + ' ' + r.unit) out.push(`the tag says ${tagT}, drawn x ${xw}`);
  const cause = document.querySelector('.ix2 .tk2-cause'), ct = cause.innerText.replace(/\s+/g, ' ');
  const eq = Math.round(x / per) === X.eqStep(), take = cause.classList.contains('is-take');
  if (take) { if (!eq) out.push('the takeaway shows away from equilibrium'); }
  else {
    if (!ct.includes('x ' + (x === 0 ? '0' : xw))) out.push('cause line x disagrees: ' + ct);
    if (!ct.includes('Q ' + fq(q))) out.push('cause line Q disagrees: ' + ct);
    if (eq !== ct.includes('at equilibrium')) out.push('cause line equilibrium word disagrees: ' + ct);
    if (!eq && (q < r.Kval) !== ct.includes('below K')) out.push('cause line below/above disagrees: ' + ct);
  }
  if (eq !== document.querySelector('.ix2-eqband').classList.contains('is-on')) out.push('the equilibrium band disagrees');
  if (Math.abs(X.needle() - X.angOf(q)) > 0.003) out.push('the needle is not at the drawn Q');
  const ti = r.species.findIndex(s => s.key === r.tint.key); let most = 0; for (let kk = 0; kk <= r.steps; kk++) most = Math.max(most, r.n0[ti] + r.species[ti].nu * kk);
  const gas = X.gas(); if (Math.abs(gas.to - (0.08 + 0.5 * c[ti] / most)) > 0.002 || Math.abs(gas.now - gas.to) > 0.003) out.push('the gas colour disagrees with the drawn ' + r.tint.key);
  const rows = new Set([...document.querySelectorAll('.ix2 .tk2-cz')].map(e => Math.round(R(e).t))).size;
  if (innerWidth <= 640 && rows > 2) out.push('cause line is ' + rows + ' rows: ' + ct);
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  return { out, causeH: Math.round(R(cause).h) };
};
let checks = 0, states = 0; const fails = [];
const W4 = w => String(w).padStart(4, '0');
if (!FRAMES && !PERF) for (const w of WIDTHS) {
  const h = w <= 430 ? 844 : w <= 820 ? 1024 : w >= 1920 ? 1080 : 900;
  for (const theme of ['light', 'dark']) {
    // a first visit: the cue is whole and covers nothing
    {
      const c = await open({ w, h, cue: true, theme });
      const bad = await c.page.evaluate(() => { const R = e => e.getBoundingClientRect(), q = [...document.querySelectorAll('.tk2-cue')].filter(e => e.getClientRects().length)[0]; if (!q) return ['no cue shown'];
        const r = R(q), S = R(document.querySelector('.ix2-scene')), out = [];
        if (r.left < S.left || r.right > S.right || r.top < S.top || r.bottom > S.bottom) out.push('the cue is clipped by the stage');
        if (parseFloat(getComputedStyle(q).fontSize) < 11) out.push('the cue text is under 11 px');
        [...document.querySelectorAll('.ix2-scene svg text, .ix2-scene .tk2-tag, .ix2-scene .tk2-dot')].filter(e => e.getClientRects().length && !e.closest('[hidden]') && e.textContent !== '').forEach(e => { const x = R(e); if (!(r.right <= x.left || x.right <= r.left || r.bottom <= x.top || x.bottom <= r.top)) out.push('the cue covers ' + (e.textContent || e.className).toString().trim().slice(0, 24)); });
        return out; });
      states++; checks += 3; bad.forEach(m => fails.push(`${w} ${theme} first visit: ${m}`));
      await c.page.waitForTimeout(150);
      if (SHOTS) await c.page.locator('.ix2').screenshot({ path: join(SHOTS, `${W4(w)}-${theme}-0-first-visit.png`) });
      c.errs.forEach(e => fails.push(`${w} ${theme} first visit: console ${e}`));
      await c.ctx.close();
    }
    const c = await open({ w, h, theme });
    const causeH = {};
    for (const [rx, ks] of [['hi', [0, 4, 'eq', 13]], ['n2o4', [0, 3, 'eq', 14]]]) {
      if (rx === 'n2o4') { await c.page.click('.tk2-tab[data-v=n2o4]'); await c.page.waitForTimeout(500); }
      for (const k0 of ks) {
        const k = k0 === 'eq' ? await c.page.evaluate(() => window.__ice2.eqStep()) : k0;
        await c.page.evaluate(v => window.__ice2.set(v), k); await settle(c.page);
        const res = await c.page.evaluate(probe, {});
        states++; checks += 18; res.out.forEach(m => fails.push(`${w} ${theme} ${rx} step ${k}: ${m}`));
        (causeH[rx] = causeH[rx] || []).push(res.causeH);
        if (SHOTS) await c.page.locator('.ix2').screenshot({ path: join(SHOTS, `${W4(w)}-${theme}-${rx}-${k0 === 'eq' ? 'eq' : String(k).padStart(2, '0')}.png`) });
        if (k0 === 'eq') { await c.page.waitForTimeout(1300); const res2 = await c.page.evaluate(probe, {}); checks += 18; res2.out.forEach(m => fails.push(`${w} ${theme} ${rx} takeaway: ${m}`));
          const tk = await c.page.evaluate(() => document.querySelector('.ix2 .tk2-cause').classList.contains('is-take')); if (!tk) fails.push(`${w} ${theme} ${rx}: no takeaway at equilibrium`);
          if (SHOTS) await c.page.locator('.ix2').screenshot({ path: join(SHOTS, `${W4(w)}-${theme}-${rx}-eq-takeaway.png`) }); }
      }
    }
    if (w <= 640) for (const rx in causeH) if (new Set(causeH[rx]).size > 1) fails.push(`${w} ${theme} ${rx}: the cause line changes height on a phone (${causeH[rx].join(', ')})`);
    c.errs.forEach(e => fails.push(`${w} ${theme}: console ${e}`));
    await c.ctx.close();
    // Test yourself: the drill opens, no sideways scroll, no console errors
    const q = await open({ w, h, theme, hash: '#quiz' });
    const qb = await q.page.evaluate(() => { const out = []; if (!document.querySelector('.cd-ice')) out.push('no ICE table in Test yourself'); const st = document.querySelector('.ix2'); if (st && st.getClientRects().length) out.push('the Explore stage shows in Test yourself'); if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll'); return out; });
    states++; checks += 3; qb.forEach(m => fails.push(`${w} ${theme} Test yourself: ${m}`)); q.errs.forEach(e => fails.push(`${w} ${theme} Test yourself: console ${e}`));
    if (SHOTS) await q.page.screenshot({ path: join(SHOTS, `${W4(w)}-${theme}-9-test-yourself.png`) });
    await q.ctx.close();
  }
  console.log(`${w}: done`);
}

/* ---------------------------------------------------------------- FRAMES */
if (FRAMES) for (const w of WIDTHS) {
  const h = w <= 430 ? 844 : 900;
  const c = await open({ w, h });
  // in the page: record every animation frame's drawn state against every number shown
  await c.page.evaluate(() => {
    window.__fr = { on: false, bad: [], n: 0, lo: 0, hi: 0 };
    const X = window.__ice2, M = window.ApChemMath;
    const loop = () => {
      const F = window.__fr; if (!F.on) return;
      const r = X.react(), c = X.drawn(), per = r.per, x = (r.n0[0] - c[0]) / -r.species[0].nu * per, k = Math.round(x / per), q = X.Qof(c), fmt = v => M.fmt(v, 3), fq = v => v === 0 ? '0' : M.fmt(v, 3), n = r.species.length;
      F.n++;
      const say = m => { if (F.bad.length < 40) F.bad.push(`frame ${F.n} (step ${k}): ${m}`); };
      if (k < Math.min(F.lo, F.hi) || k > Math.max(F.lo, F.hi)) say(`drawn step ${k} outside ${F.lo}..${F.hi}`);
      const vals = [...document.querySelectorAll('.ix2-val')].map(t => t.textContent);
      r.species.forEach((s, i) => { if (vals[2 * n + i] !== fmt(c[i] * per)) say(`E ${s.key} ${vals[2 * n + i]} vs drawn ${fmt(c[i] * per)}`); const cw = x === 0 ? '0' : (s.nu < 0 ? '−' : '+') + fmt(Math.abs(s.nu) * x); if (vals[n + i] !== cw) say(`C ${s.key} ${vals[n + i]} vs ${cw}`); });
      const qv = document.querySelector('.ix2-qv'); if (qv.textContent !== fq(q)) say(`Q ${qv.textContent} vs drawn ${fq(q)}`);
      const tag = document.querySelector('.ix2 .tk2-drag .tk2-tag').textContent; if (tag !== 'x = ' + (x === 0 ? '0' : fmt(x)) + ' ' + r.unit) say(`tag ${tag} vs drawn x ${fmt(x)}`);
      const cz = document.querySelector('.ix2 .tk2-cause'); if (!cz.classList.contains('is-take')) { const t = cz.innerText.replace(/\s+/g, ' '); if (!t.includes('Q ' + fq(q))) say('cause line ' + t + ' vs Q ' + fq(q)); if (!t.includes('x ' + (x === 0 ? '0' : fmt(x)))) say('cause line ' + t + ' vs x ' + fmt(x)); }
      // whole molecules are drawn bonded: each atom where the template puts it
      const T = M.particles.templ, s = X.G().s;
      X.mols().forEach(m => { if (m.state !== 'whole') return; const t = T[m.key].slice().sort((p, q) => (p.z || 0) - (q.z || 0) || (q.r || 9) - (p.r || 9)); const a = m.atoms;
        for (let i = 1; i < a.length; i++) { const want = Math.hypot(t[i].dx - t[0].dx, t[i].dy - t[0].dy) * s, got = Math.hypot(a[i][0] - a[0][0], a[i][1] - a[0][1]); if (Math.abs(want - got) > 0.6) { say(`${m.key} drawn apart (${got.toFixed(1)} vs ${want.toFixed(1)})`); break; } } });
      requestAnimationFrame(loop);
    };
    window.__frStart = (lo, hi) => { window.__fr.lo = lo; window.__fr.hi = hi; window.__fr.on = true; requestAnimationFrame(loop); };
  });
  const run = async (label, lo, hi, act) => {
    await c.page.evaluate(([a, b]) => window.__frStart(a, b), [lo, hi]);
    await act(); await settle(c.page);
    const r = await c.page.evaluate(() => { window.__fr.on = false; const F = window.__fr, out = { n: F.n, bad: F.bad.slice() }; F.bad = []; F.n = 0; return out; });
    const left = await c.page.evaluate(() => ({ ev: window.__ice2.events().length, glow: window.__ice2.events().filter(e => e.glow > 0).length, target: window.__ice2.target(), drawn: window.__ice2.drawn() }));
    if (left.ev || left.glow) r.bad.push('something left moving at the end');
    states++; checks += r.n; r.bad.forEach(m => fails.push(`${w} frames ${label}: ${m}`));
    console.log(`${w} frames ${label}: ${r.n} frames, ${r.bad.length} problems`);
  };
  const knob = async () => { const b = await c.page.locator('.ix2 .tk2-drag .tk2-knob').boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
  const G = await c.page.evaluate(() => { const g = window.__ice2.G(), r = document.querySelector('.ix2-scene').getBoundingClientRect(), k = r.width / g.W; return { x0: r.left + g.rail[0] * k, x1: r.left + g.rail[2] * k, y: r.top + g.rail[1] * k, steps: window.__ice2.react().steps }; });
  const xAt = k => G.x0 + (G.x1 - G.x0) * k / G.steps;
  // 1. a fast pointer drag from the start past equilibrium
  await run('fast drag 0 to 12', 0, 12, async () => { const [x, y] = await knob(); await c.page.mouse.move(x, y); await c.page.mouse.down(); for (let i = 1; i <= 6; i++) { await c.page.mouse.move(x + (xAt(12) - x) * i / 6, y); await c.page.waitForTimeout(16); } await c.page.mouse.up(); });
  // 2. a reversal mid change: on to the end, then back to 2 while it is still reacting
  await run('reversal 12 to 13 to 2', 2, 13, async () => { await c.page.keyboard.press('End'); await c.page.waitForTimeout(260); const [x, y] = await knob(); await c.page.mouse.move(x, y); await c.page.mouse.down(); await c.page.mouse.move(xAt(2), y, { steps: 4 }); await c.page.mouse.up(); });
  // 3. keys: arrow steps, End, Home
  await c.page.locator('.ix2 .tk2-drag input').focus();
  await run('arrow keys up', 2, 5, async () => { for (let i = 0; i < 3; i++) { await c.page.keyboard.press('ArrowRight'); await c.page.waitForTimeout(90); } });
  await run('End then Home', 0, 13, async () => { await c.page.keyboard.press('End'); await c.page.waitForTimeout(500); await c.page.keyboard.press('Home'); });
  // 4. the other reaction: a slow drag across equilibrium and back
  await c.page.click('.tk2-tab[data-v=n2o4]'); await c.page.waitForTimeout(500);
  Object.assign(G, await c.page.evaluate(() => { const g = window.__ice2.G(), r = document.querySelector('.ix2-scene').getBoundingClientRect(), k = r.width / g.W; return { x0: r.left + g.rail[0] * k, x1: r.left + g.rail[2] * k, y: r.top + g.rail[1] * k, steps: window.__ice2.react().steps }; }));
  await run('N2O4 drag to 8 and back to 3', 0, 8, async () => { const [x, y] = await knob(); await c.page.mouse.move(x, y); await c.page.mouse.down(); for (let i = 1; i <= 8; i++) { await c.page.mouse.move(xAt(i) + 0.5, y); await c.page.waitForTimeout(110); } for (let i = 7; i >= 3; i--) { await c.page.mouse.move(xAt(i) + 0.5, y); await c.page.waitForTimeout(110); } await c.page.mouse.up(); });
  // 5. leaving for Test yourself mid change: the stage stops and comes back clean
  await c.page.keyboard.press('End');
  await c.page.waitForTimeout(200);
  await c.page.locator('.ls-modes button', { hasText: 'Test yourself' }).first().click();
  await c.page.waitForTimeout(400);
  const off = await c.page.evaluate(() => ({ busy: window.__ice2.busy(), target: window.__ice2.target(), drawn: window.__ice2.drawn() }));
  if (off.busy) fails.push(`${w} frames: still animating after leaving for Test yourself`);
  states++; checks++;
  c.errs.forEach(e => fails.push(`${w} frames: console ${e}`));
  await c.ctx.close();
  // 6. reduced motion: the full result at once (a cross fade), the numbers right
  const rm = await open({ w, h, reduced: true });
  await rm.page.evaluate(() => window.__ice2.set(9)); await rm.page.waitForTimeout(60);
  const rr = await rm.page.evaluate(probe, {});
  states++; checks += 18; rr.out.forEach(m => fails.push(`${w} reduced motion: ${m}`));
  const rd = await rm.page.evaluate(() => window.__ice2.drawn()); if (rd[2] !== 18) fails.push(`${w} reduced motion: the result is not shown at once (${rd})`);
  await rm.ctx.close();
}

/* ---------------------------------------------------------------- PERF */
if (PERF) {
  console.log(`machine load ${loadavg()[0].toFixed(1)} on ${cpus().length} cores`);
  const probeF = async (page, label, w, act, gate) => {
    await page.evaluate(() => { window.__f = []; let last = performance.now(); window.__on = true; const loop = t => { window.__f.push(t - last); last = t; if (window.__on) requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
    await act(); await page.waitForTimeout(600);
    const r = await page.evaluate(() => { window.__on = false; const f = window.__f.slice(1).sort((a, b) => a - b); if (!f.length) f.push(0); return { n: f.length, med: f[f.length >> 1], p95: f[Math.min(f.length - 1, Math.floor(f.length * 0.95))], max: f[f.length - 1] }; });
    console.log(`${w} px, CPU x${RATE}, ${label}: median ${r.med.toFixed(1)} ms, p95 ${r.p95.toFixed(1)} ms, max ${r.max.toFixed(0)} ms (${r.n} frames)`);
    if (gate && (r.med >= 20 || r.p95 > 50.2)) fails.push(`${w} ${label}: median ${r.med.toFixed(1)} ms, p95 ${r.p95.toFixed(1)} ms`);
  };
  for (const w of WIDTHS) {
    const h = w <= 430 ? 844 : 900;
    const c = await open({ w, h });
    const cdp = await c.ctx.newCDPSession(c.page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
    for (const rx of ['hi', 'n2o4']) {
      if (rx === 'n2o4') { await c.page.click('.tk2-tab[data-v=n2o4]'); await c.page.waitForTimeout(800); }
      await probeF(c.page, `ICE tables (${rx}), x knob end to end and back`, w, async () => {
        const b = await c.page.locator('.ix2 .tk2-drag .tk2-knob').boundingBox(), x0 = b.x + b.width / 2, y = b.y + b.height / 2;
        const g = await c.page.evaluate(() => { const g = window.__ice2.G(), r = document.querySelector('.ix2-scene').getBoundingClientRect(), k = r.width / g.W; return r.left + g.rail[2] * k; });
        await c.page.mouse.move(x0, y); await c.page.mouse.down();
        for (let i = 0; i <= 24; i++) { await c.page.mouse.move(x0 + (g - x0) * i / 24, y); await c.page.waitForTimeout(16); }
        await c.page.waitForTimeout(1200);
        for (let i = 24; i >= 0; i--) { await c.page.mouse.move(x0 + (g - x0) * i / 24, y); await c.page.waitForTimeout(16); }
        await c.page.mouse.up(); await c.page.waitForTimeout(1500);
      }, true);
    }
    await c.ctx.close();
    // the flagship in the same run (Premium: unlocked for this measurement only)
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
    const fp = await ctx.newPage();
    await fp.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
    await fp.route('**/assets/premium.js', async r => { const res = await r.fetch(); const body = (await res.text()).replace('function has(course) {', 'function has(course) { return true;'); await r.fulfill({ response: res, body }); });
    await fp.goto(BASE + '/environmental-science/tools/water-pollution.html'); await fp.waitForSelector('.tk2-knob', { state: 'attached' }); await fp.waitForTimeout(1500);
    const cdp2 = await ctx.newCDPSession(fp); await cdp2.send('Emulation.setCPUThrottlingRate', { rate: RATE });
    await probeF(fp, 'FLAGSHIP water pollution, fertilizer knob end to end and back', w, async () => {
      const k = await fp.evaluate(() => { const e = [...document.querySelectorAll('.tk2-knob')].find(x => x.getBoundingClientRect().width > 0); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }), span = Math.min(260, w * 0.3);
      await fp.mouse.move(k.x, k.y); await fp.mouse.down();
      for (let i = 0; i <= 24; i++) { await fp.mouse.move(k.x + span * i / 24, k.y); await fp.waitForTimeout(16); }
      for (let i = 24; i >= 0; i--) { await fp.mouse.move(k.x + span * i / 24, k.y); await fp.waitForTimeout(16); }
      await fp.mouse.up();
    }, false);
    await ctx.close();
  }
}
await browser.close(); server.close();
if (fails.length) { console.log(`FAIL: ${fails.length} of ${checks} checks in ${states} states\n  ` + [...new Set(fails)].slice(0, 120).join('\n  ')); process.exit(1); }
console.log(`ICE tables sweep: ${states} states, ${checks} checks, 0 failures` + (FRAMES ? ' (frames)' : PERF ? ' (perf)' : ''));
