/* Tools v2 sweep for AP® Chemistry Q vs K (docs/tools-v2-chem-q-vs-k-brief.md), after the pattern of
   chem-ice-tables-sweep.mjs. Three runs in one file (run ONE width per process; the machine is small):

     node scripts/tools-v2/chem-q-vs-k-sweep.mjs [widths] [--shots dir] [--height h]   layout, light and dark
     node scripts/tools-v2/chem-q-vs-k-sweep.mjs 390 --frames                         every animation frame
     node scripts/tools-v2/chem-q-vs-k-sweep.mjs 390 --perf [--rate 4]                frame times, beside the flagship

   LAYOUT, at each landmark state (both reactions: the start; three B or CO₂ in; three A in twice; AB or CO₂ out; a
   solid lump in; the piston at 0.50 and 1.50 L; CaCO₃ used up), light and dark (the dark run asserts the page is dark):
     - nothing is clipped by the stage (every text on the picture, the knob, its tag, the cups);
     - every text on the picture at least 4 px from every other, the knob's tag included; no text under 11 px;
     - the cylinder (the thing acted on) is the largest object: larger than the plate, the tray and the dial;
     - every counted particle is drawn inside the cylinder, under the piston; lumps on its floor; no two gas particles
       touch (their atoms at least 2 px apart);
     - the words agree with the drawing: Q from the drawn counts at the drawn volume is the cause line's Q, the needle
       points at it, the arrow under the equation shows the way the next event would run (or no net change), the
       piston's tag says the drawn volume;
     - on a phone the cause line is at most two rows and one height; no sideways scroll; no console errors;
     - on a first visit the cue is whole and covers no text, number, cup or the cylinder;
     - the screen fit: at 390 x 844, 1024 x 768 and 1280 x 800 the cups, the cylinder and the cause line are on
       screen together, with no scrolling inside the card;
     - Test yourself (#quiz) shows the drill and not the Explore stage; ?seed= opens the same problem twice.
   FRAMES: taps on the cups (three A, three B, AB out, fast taps in a row), the piston down and up while it reacts, a
   solid lump, CO₂ in and out, leaving for Test yourself mid change, reduced motion: on every animation frame the cause
   line's Q, the tag and the arrow equal what the drawn particles and the drawn piston give; a particle counts exactly
   when it is drawn inside the glass; every counted particle is inside; nothing is left moving at the end.
   PERF: CPU throttled (default x4): six quick taps on B, six on AB, the piston dragged end to end and back, then the
   flagship's fertilizer knob in the same run. Target: median about 16 ms, p95 at or under 50 ms.

   Needs Playwright and a Chromium (CHROME or /opt/pw-browsers/chromium-1243/chrome-linux64/chrome). The tool is
   Premium: Premium is unlocked for these runs only, by routing assets/premium.js (never committed). Exit code 1 on any
   failure. */
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
const PAGE = '/chem/tools/q-vs-k.html';
const IGNORE = /ERR_FAILED|ERR_BLOCKED|Service Worker|net::/;
async function unlock(page) {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.route('**/assets/premium.js', async r => { const res = await r.fetch(); const body = (await res.text()).replace('function has(course) {', 'function has(course) { return true;'); await r.fulfill({ response: res, body }); });
}
async function open(o) {
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, serviceWorkers: 'block', deviceScaleFactor: 1, reducedMotion: o.reduced ? 'reduce' : 'no-preference', hasTouch: !!o.touch });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await unlock(page);
  await page.addInitScript(([cue, theme]) => { try { localStorage.setItem('nremt_theme', theme); if (!cue) localStorage.setItem('tk2c:apchem-qk-tray', '1'); } catch (e) {} }, [!!o.cue, o.theme || 'light']);
  await page.goto(BASE + PAGE + (o.hash || ''), { waitUntil: 'load' });
  if (!o.hash) { await until(page, () => !!(window.__qk2 && window.__qk2.G())); await page.waitForTimeout(400); }
  else await page.waitForTimeout(1500);
  return { page, errs, ctx };
}
async function until(page, fn, ms = 20000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn).catch(() => false)) return; await page.waitForTimeout(50); } throw new Error('timed out waiting'); }
const settle = async page => { await page.waitForTimeout(120); await until(page, () => !window.__qk2.busy()); await page.waitForTimeout(150); };
/* Runs in the page: the layout and agreement checks of one settled state. */
const probe = () => {
  const out = [], X = window.__qk2, r = X.react(), G = X.G(), M = window.ApChemMath;
  const R = e => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]');
  const scene = document.querySelector('.qk2-scene'), S = R(scene);
  const inS = (x, n, tol = 0.6) => { if (x.l < S.l - tol || x.r > S.r + tol || x.t < S.t - tol || x.b > S.b + tol) out.push('clipped: ' + n); };
  const gap = (a, c, g) => !(a.r + g <= c.l || c.r + g <= a.l || a.b + g <= c.t || c.b + g <= a.t);
  const texts = [...scene.querySelectorAll('svg text')].filter(vis).filter(t => t.textContent.trim()).map(t => ({ n: 'text "' + t.textContent.trim() + '"', r: R(t) }));
  const tag = scene.querySelector('.tk2-drag .tk2-tag'), knob = scene.querySelector('.tk2-drag .tk2-dot');
  const items = texts.slice();
  if (vis(tag)) items.push({ n: 'knob tag "' + tag.textContent + '"', r: R(tag) });
  if (vis(knob)) items.push({ n: 'knob', r: R(knob) });
  items.forEach(x => inS(x.r, x.n));
  [...scene.querySelectorAll('.qk2-wellbtn')].forEach((b, i) => inS(R(b), 'cup ' + i));
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], c = items[j];
    if (a.n === 'knob' || c.n === 'knob') { if (gap(a.r, c.r, 0)) out.push('overlap: ' + a.n + ' and ' + c.n); continue; }
    if (gap(a.r, c.r, 4)) out.push('closer than 4 px: ' + a.n + ' and ' + c.n);
  }
  [...scene.querySelectorAll('svg text, svg tspan')].filter(vis).filter(t => t.textContent.trim() && t.textContent !== '​').forEach(t => { const fs = parseFloat(getComputedStyle(t).fontSize); if (fs < 10.95) out.push('text under 11 px: "' + t.textContent + '" ' + fs.toFixed(1)); });
  if (vis(tag) && parseFloat(getComputedStyle(tag).fontSize) < 11) out.push('the tag is under 11 px');
  // the cylinder is the largest object
  const cyl = R(scene.querySelector('.qk2-glassrim')), A = x => x.w * x.h;
  const others = { plate: R(scene.querySelector('.qk2-card')), tray: R(scene.querySelector('.qk2-trayb')), dial: R(scene.querySelector('.qk2-dial')) };
  for (const k in others) { if (A(others[k]) >= A(cyl)) out.push(`the ${k} (${Math.round(A(others[k]))}) is not smaller than the cylinder (${Math.round(A(cyl))})`); inS(others[k], 'the ' + k); }
  inS(cyl, 'the cylinder');
  // the knob's tag stays clear of the plate and the dial
  if (vis(tag)) { const tg = R(tag); for (const k of ['plate', 'dial']) if (gap(tg, others[k], 2)) out.push('the knob tag touches the ' + k); }
  // every counted particle inside, under the piston
  const V = X.V(), py = X.pistonY(V), ps = X.ps();
  ps.forEach(p => { if (!p.counted) return; if (p.gas) p.atoms.forEach(([x, y, rr]) => { if (x - rr < G.x0 - 0.5 || x + rr > G.x1 + 0.5 || y + rr > G.yF + 0.5 || y - rr < py - 0.5) out.push(`an atom of ${p.key} outside the gas (${x.toFixed(0)}, ${y.toFixed(0)})`); });
    else if (p.x < G.x0 || p.x > G.x1 || p.y > G.yF) out.push('a lump outside the floor'); });
  let close = 0; const gs = ps.filter(p => p.gas && p.state === 'rest');
  for (let i = 0; i < gs.length; i++) for (let j = i + 1; j < gs.length; j++) { let w = Infinity; for (const a of gs[i].atoms) for (const b of gs[j].atoms) w = Math.min(w, Math.hypot(a[0] - b[0], a[1] - b[1]) - a[2] - b[2]); if (w < 2) close++; }
  if (close) out.push(close + ' pairs of particles touching');
  // the words agree with the drawing
  const c = X.drawn(), q = X.Qof(c, V), fq = v => v !== v ? 'no value' : v === 0 ? '0' : !isFinite(v) ? 'no value' : M.fmt(v, 3);
  const cause = document.querySelector('.qk2 .tk2-cause'), ct = cause.innerText.replace(/\s+/g, ' '), take = cause.classList.contains('is-take');
  if (!take) {
    if (q === q && !ct.includes('Q ' + fq(q)) && !ct.includes('Q stays ' + fq(q))) out.push(`cause line Q disagrees: ${ct} (drawn ${fq(q)})`);
    const nd = X.nextDir(c, V);
    if (nd > 0 && !ct.includes('runs forward')) out.push('cause line should say runs forward: ' + ct);
    if (nd < 0 && !ct.includes('runs back')) out.push('cause line should say runs back: ' + ct);
    if (nd === 0 && /runs (forward|back)/.test(ct)) out.push('cause line says it runs while nothing can: ' + ct);
    if (q === q && nd === 0 && !/solids/.test(ct)) { const lt = q < r.Kval * (1 - 1e-9), gt = q > r.Kval * (1 + 1e-9); if ((lt && /> K/.test(ct)) || (gt && /< K/.test(ct))) out.push('cause line comparison disagrees: ' + ct); }
  }
  const ad = X.arrows(), nd2 = X.nextDir(c, V), want = q !== q ? 'none' : nd2 > 0 ? 'fwd' : nd2 < 0 ? 'rev' : 'eq';
  if (ad !== want) out.push(`the arrow shows ${ad}, the drawing gives ${want}`);
  if (Math.abs(X.needle() - X.angOf(q)) > 0.003) out.push('the needle is not at the drawn Q');
  if (vis(tag) && tag.textContent !== V.toFixed(2) + ' L') out.push(`the tag says ${tag.textContent}, the piston is drawn at ${V.toFixed(2)} L`);
  const rows = new Set([...document.querySelectorAll('.qk2 .tk2-cz')].map(e => Math.round(R(e).t))).size;
  if (innerWidth <= 640 && rows > 2) out.push('cause line is ' + rows + ' rows: ' + ct);
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  return { out, causeH: Math.round(R(cause).h), ct };
};
const fitProbe = () => {
  const out = [], R = e => e.getBoundingClientRect();
  const scene = document.querySelector('.qk2-scene');
  if (innerWidth <= 640) window.scrollTo(0, R(scene).top + scrollY);
  const body = scene.closest('.ls-stage-body') || scene.closest('.ls-stage');
  if (innerWidth > 640 && body && body.scrollHeight - body.clientHeight > 2) out.push(`the card scrolls inside (${body.scrollHeight} in ${body.clientHeight})`);
  const box = innerWidth > 640 && body ? R(body) : { top: 0, bottom: innerHeight };
  // a short phone (under 800 px tall) keeps the cylinder its size and lets the cause line go under the fold (as ICE
  // tables, review S10): the cups and the cylinder only
  const short = innerWidth <= 640 && innerHeight < 800;
  const need = { cups: document.querySelector('.qk2-trayb'), cylinder: document.querySelector('.qk2-glassrim'), 'piston knob': document.querySelector('.qk2 .tk2-drag .tk2-dot') };
  if (!short) need['cause line'] = document.querySelector('.qk2 .tk2-cause');
  Object.keys(need).forEach(k => { const e = need[k]; if (!e) return out.push('no ' + k); const r = R(e); if (r.top < Math.max(0, box.top) - 1 || r.bottom > Math.min(innerHeight, box.bottom) + 1) out.push(`${k} off screen (${Math.round(r.top)} to ${Math.round(r.bottom)} of ${innerHeight})`); });
  window.scrollTo(0, 0);
  return out;
};
let checks = 0, states = 0; const fails = [];
const W4 = w => String(w).padStart(4, '0');
const hi0 = args.indexOf('--height'), HFIX = hi0 >= 0 ? +args[hi0 + 1] : 0;
function HEIGHT(w) { return HFIX || (w <= 430 ? 844 : w <= 600 ? 960 : w <= 820 ? 1024 : w <= 1024 ? 768 : w <= 1280 ? 800 : w <= 1440 ? 900 : 1080); }
const tap = async (page, key) => { await page.evaluate(k => window.__qk2.add(k), key); await settle(page); };
const out = async (page, key) => { await page.evaluate(k => window.__qk2.takeOut(k), key); await settle(page); };
const vol = async (page, v) => { await page.evaluate(x => window.__qk2.setV(x), v); await settle(page); };
if (!FRAMES && !PERF) for (const w of WIDTHS) {
  const h = HEIGHT(w);
  for (const theme of ['light', 'dark']) {
    {
      const c = await open({ w, h, cue: true, theme });
      const bad = await c.page.evaluate(() => { const R = e => e.getBoundingClientRect(), q = [...document.querySelectorAll('.tk2-cue')].filter(e => e.getClientRects().length)[0]; if (!q) return ['no cue shown'];
        const r = R(q), S = R(document.querySelector('.qk2-scene')), out = [];
        if (r.left < S.left || r.right > S.right || r.top < S.top || r.bottom > S.bottom) out.push('the cue is clipped by the stage');
        if (parseFloat(getComputedStyle(q).fontSize) < 11) out.push('the cue text is under 11 px');
        [...document.querySelectorAll('.qk2-scene svg text, .qk2-scene .tk2-tag, .qk2-scene .tk2-dot, .qk2-wellbtn, .qk2-glassrim')].filter(e => e.getClientRects().length && !e.closest('[hidden]')).forEach(e => { const x = R(e); if (!(r.right <= x.left || x.right <= r.left || r.bottom <= x.top || x.bottom <= r.top)) out.push('the cue covers ' + (e.textContent || e.getAttribute('class')).toString().trim().slice(0, 24)); });
        return out; });
      states++; checks += 3; bad.forEach(m => fails.push(`${w} ${theme} first visit: ${m}`));
      if (SHOTS) await c.page.locator('.qk2').screenshot({ path: join(SHOTS, `${W4(w)}-${theme}-0-first-visit.png`) });
      c.errs.forEach(e => fails.push(`${w} ${theme} first visit: console ${e}`));
      await c.ctx.close();
    }
    const c = await open({ w, h, theme });
    if (theme === 'dark') { const dk = await c.page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark' && getComputedStyle(document.querySelector('.qk2-scene')).getPropertyValue('--wall0').trim() !== '#EEF3F7'); if (!dk) fails.push(`${w} dark: the page is not dark`); checks++; }
    const fit = await c.page.evaluate(fitProbe); states++; checks += 5; fit.forEach(m => fails.push(`${w}x${h} ${theme} screen fit: ${m}`));
    const causeH = [], cylR = [];
    const shot = async name => { if (SHOTS) await c.page.locator('.qk2').screenshot({ path: join(SHOTS, `${W4(w)}-${theme}-${name}.png`) }); };
    const check = async name => { const res = await c.page.evaluate(probe); states++; checks += 22; res.out.forEach(m => fails.push(`${w} ${theme} ${name}: ${m}`)); causeH.push(res.causeH); cylR.push(await c.page.evaluate(() => window.__qk2.G().iw + 'x' + window.__qk2.G().tot)); await shot(name); return res; };
    const plan = {
      ab: [['start', async () => {}], ['B-in', p => tap(p, 'B')], ['A-in-twice', async p => { await tap(p, 'A'); await tap(p, 'A'); }], ['AB-out', p => out(p, 'AB')], ['vol-050', p => vol(p, 0.5)], ['vol-150', p => vol(p, 1.5)], ['A-out-all', async p => { await vol(p, 1); for (let i = 0; i < 6; i++) await out(p, 'A'); }]],
      caco3: [['start', async () => {}], ['CO2-in', p => tap(p, 'CO2')], ['solid-in', p => tap(p, 'CaCO3')], ['CO2-out', p => out(p, 'CO2')], ['vol-050', p => vol(p, 0.5)], ['vol-150', p => vol(p, 1.5)], ['used-up', async p => { for (let i = 0; i < 4; i++) await out(p, 'CO2'); }]]
    };
    for (const rx of ['ab', 'caco3']) {
      if (rx === 'caco3') { await c.page.click('.tk2-tab[data-v=caco3]'); await c.page.waitForTimeout(700); }
      for (const [name, act] of plan[rx]) {
        await act(c.page); const res = await check(rx + '-' + name);
        if (name === 'solid-in' && !/solids are not in Q|Q stays/.test(res.ct)) { await c.page.waitForTimeout(1300); const t = await c.page.evaluate(() => document.querySelector('.qk2 .tk2-cause').innerText); if (!/solid/.test(t)) fails.push(`${w} ${theme} solid-in: the cause line does not say solids are left out (${res.ct})`); }
        if (name === 'B-in') { await c.page.waitForTimeout(1300); const tk = await c.page.evaluate(() => document.querySelector('.qk2 .tk2-cause').classList.contains('is-take')); if (!tk) fails.push(`${w} ${theme}: no takeaway after it settles`); await shot('ab-takeaway'); }
      }
      await c.page.click('.qk2-again'); await settle(c.page);
    }
    if (new Set(cylR).size > 1) fails.push(`${w} ${theme}: the cylinder changes size (${[...new Set(cylR)].join(', ')})`);
    if (w <= 640 && new Set(causeH).size > 1) fails.push(`${w} ${theme}: the cause line changes height on a phone (${[...new Set(causeH)].join(', ')})`);
    // a real click on a cup (the tap path) and a real drag from a cup into the cylinder
    {
      const b = await c.page.locator('.qk2-wellbtn').nth(0).boundingBox();
      await c.page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await settle(c.page);
      // three CO₂ in from the start: they go into the CaO, so three more lumps are CaCO₃
      const n1 = await c.page.evaluate(() => window.__qk2.drawn()[0]);
      if (n1 !== 11) fails.push(`${w} ${theme}: a click on the CO₂ cup did not run (CaCO₃ ${n1})`);
      const b2 = await c.page.locator('.qk2-wellbtn').nth(0).boundingBox(), cyl = await c.page.locator('.qk2-glassrim').boundingBox();
      await c.page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2); await c.page.mouse.down();
      for (let i = 1; i <= 10; i++) { await c.page.mouse.move(b2.x + b2.width / 2 + (cyl.x + cyl.width / 2 - b2.x - b2.width / 2) * i / 10, b2.y + b2.height / 2 + (cyl.y + cyl.height * 0.6 - b2.y - b2.height / 2) * i / 10); await c.page.waitForTimeout(16); }
      await c.page.mouse.up(); await settle(c.page);
      const r2 = await c.page.evaluate(probe); states++; checks += 22; r2.out.forEach(m => fails.push(`${w} ${theme} after a real drag: ${m}`));
      if (!/added 3 CO/.test(r2.ct) && !(await c.page.evaluate(() => document.querySelector('.qk2 .tk2-cause').classList.contains('is-take')))) fails.push(`${w} ${theme}: the drag from the cup did not add (${r2.ct})`);
    }
    c.errs.forEach(e => fails.push(`${w} ${theme}: console ${e}`));
    await c.ctx.close();
    const q = await open({ w, h, theme, hash: '#quiz' });
    const qb = await q.page.evaluate(() => { const out = []; if (!document.querySelector('.cd-step, .cd-problem')) out.push('no drill in Test yourself'); const st = document.querySelector('.qk2'); if (st && st.getClientRects().length) out.push('the Explore stage shows in Test yourself'); if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll'); return out; });
    states++; checks += 3; qb.forEach(m => fails.push(`${w} ${theme} Test yourself: ${m}`)); q.errs.forEach(e => fails.push(`${w} ${theme} Test yourself: console ${e}`));
    if (SHOTS) await q.page.screenshot({ path: join(SHOTS, `${W4(w)}-${theme}-9-test-yourself.png`) });
    await q.ctx.close();
  }
  console.log(`${w}: done`);
}

/* ---------------------------------------------------------------- FRAMES */
if (FRAMES) for (const w of WIDTHS) {
  const h = HEIGHT(w);
  const c = await open({ w, h });
  await c.page.evaluate(() => {
    window.__fr = { on: false, bad: [], n: 0 };
    const X = window.__qk2, M = window.ApChemMath;
    const loop = () => {
      const F = window.__fr; if (!F.on) return;
      const G = X.G(), V = X.V(), c = X.drawn(), q = X.Qof(c, V), fq = v => v !== v ? 'no value' : v === 0 ? '0' : !isFinite(v) ? 'no value' : M.fmt(v, 3);
      F.n++;
      const say = m => { if (F.bad.length < 40) F.bad.push(`frame ${F.n} (${c.join(',')} at ${V.toFixed(3)} L): ${m}`); };
      const cz = document.querySelector('.qk2 .tk2-cause');
      if (!cz.classList.contains('is-take')) { const t = cz.innerText.replace(/\s+/g, ' '); if (q === q && !t.includes('Q ' + fq(q)) && !t.includes('Q stays ' + fq(q))) say('cause line ' + t + ' vs Q ' + fq(q)); }
      const tag = document.querySelector('.qk2 .tk2-drag .tk2-tag'); if (tag && tag.textContent !== V.toFixed(2) + ' L') say(`tag ${tag.textContent} vs drawn ${V.toFixed(2)} L`);
      const nd = X.nextDir(c, V), want = q !== q ? 'none' : nd > 0 ? 'fwd' : nd < 0 ? 'rev' : 'eq'; if (X.arrows() !== want) say(`arrow ${X.arrows()} vs ${want}`);
      const py = X.pistonY(V);
      X.ps().forEach(p => {
        if (!p.gas) { if (p.counted && (p.x < G.x0 || p.x > G.x1)) say('a counted lump outside'); return; }
        const inGlass = p.atoms.every(([x, y, r]) => x + r <= G.x1 + 0.5 + r);   // the centre side of the wall
        if (p.counted && p.atoms.some(([x, y, r]) => x - r < G.x0 - 0.5 || y - r < py - 0.5 || y + r > G.yF + 0.5)) say(`a counted ${p.key} drawn outside the gas`);
        if (p.counted && p.x > G.x1 - 0.5) say(`a counted ${p.key} drawn in the port (${p.x.toFixed(1)})`);
        if (!p.counted && p.state === 'enter' && p.x < G.x1 - 1.5) say(`an uncounted ${p.key} drawn inside (${p.x.toFixed(1)})`);
        void inGlass;
      });
      requestAnimationFrame(loop);
    };
    window.__frStart = () => { window.__fr.on = true; requestAnimationFrame(loop); };
  });
  const run = async (label, act) => {
    await c.page.evaluate(() => window.__frStart());
    await act(); await settle(c.page);
    const r = await c.page.evaluate(() => { window.__fr.on = false; const F = window.__fr, o = { n: F.n, bad: F.bad.slice() }; F.bad = []; F.n = 0; return o; });
    const left = await c.page.evaluate(() => ({ ev: window.__qk2.evs().length, moving: window.__qk2.ps().filter(p => p.state !== 'rest').length, nd: window.__qk2.nextDir(window.__qk2.drawn(), window.__qk2.V()) }));
    if (left.ev || left.moving) r.bad.push('something left moving at the end');
    if (left.nd) r.bad.push('it stopped while an event could still bring Q nearer K');
    states++; checks += r.n; r.bad.forEach(m => fails.push(`${w} frames ${label}: ${m}`));
    console.log(`${w} frames ${label}: ${r.n} frames, ${r.bad.length} problems`);
  };
  const cup = async i => { const b = await c.page.locator('.qk2-wellbtn').nth(i).boundingBox(); await c.page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); };
  await run('three B in', () => cup(1));
  await run('three A, twice, fast', async () => { await cup(0); await c.page.waitForTimeout(120); await cup(0); });
  await run('AB out (tap a particle)', async () => { const p = await c.page.evaluate(() => { const g = window.__qk2.G(), r = document.querySelector('.qk2-scene').getBoundingClientRect(), k = r.width / g.W, ab = window.__qk2.ps().find(p => p.key === 'AB' && p.state === 'rest'); return [r.left + ab.x * k, r.top + ab.y * k]; }); await c.page.mouse.click(p[0], p[1]); });
  await run('piston to 0.50 then 1.50 while it reacts', async () => { await c.page.evaluate(() => window.__qk2.setV(0.5)); await c.page.waitForTimeout(900); await c.page.evaluate(() => window.__qk2.setV(1.5)); });
  await run('six fast taps, mixed', async () => { for (const i of [1, 2, 1, 2, 0, 2]) { await cup(i); await c.page.waitForTimeout(70); } });
  await c.page.click('.qk2-again'); await settle(c.page);
  await c.page.click('.tk2-tab[data-v=caco3]'); await c.page.waitForTimeout(700);
  await run('CO2 in', () => cup(0));
  await run('a CaCO3 lump in', () => cup(1));
  await run('CO2 out twice', async () => { await c.page.evaluate(() => window.__qk2.takeOut('CO2')); await c.page.waitForTimeout(300); await c.page.evaluate(() => window.__qk2.takeOut('CO2')); });
  await run('piston down and up', async () => { await c.page.evaluate(() => window.__qk2.setV(0.5)); await c.page.waitForTimeout(1500); await c.page.evaluate(() => window.__qk2.setV(1.25)); });
  // leaving for Test yourself mid change: the stage stops and comes back clean
  await cup(0); await c.page.waitForTimeout(250);
  await c.page.locator('.ls-modes button', { hasText: 'Test yourself' }).first().click();
  await c.page.waitForTimeout(400);
  const off = await c.page.evaluate(() => ({ busy: window.__qk2.busy(), ev: window.__qk2.evs().length }));
  if (off.busy || off.ev) fails.push(`${w} frames: still animating after leaving for Test yourself`);
  await c.page.locator('.ls-modes button', { hasText: 'Explore' }).first().click(); await c.page.waitForTimeout(500);
  const back = await c.page.evaluate(probe); back.out.forEach(m => fails.push(`${w} frames back to Explore: ${m}`));
  states += 2; checks += 23;
  c.errs.forEach(e => fails.push(`${w} frames: console ${e}`));
  await c.ctx.close();
  // reduced motion: the full result at once, the numbers right
  const rm = await open({ w, h, reduced: true });
  await rm.page.evaluate(() => window.__qk2.add('B')); await rm.page.waitForTimeout(80);
  const rr = await rm.page.evaluate(probe); states++; checks += 22; rr.out.forEach(m => fails.push(`${w} reduced motion: ${m}`));
  const rd = await rm.page.evaluate(() => window.__qk2.drawn()); if (rd[1] !== 10) fails.push(`${w} reduced motion: the result is not shown at once (${rd})`);
  rm.errs.forEach(e => fails.push(`${w} reduced motion: console ${e}`));
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
    const h = HEIGHT(w);
    const c = await open({ w, h });
    const cdp = await c.ctx.newCDPSession(c.page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
    const cup = async i => { const b = await c.page.locator('.qk2-wellbtn').nth(i).boundingBox(); await c.page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); };
    await probeF(c.page, 'Q vs K, six taps on B then six on AB', w, async () => { for (let i = 0; i < 6; i++) { await cup(1); await c.page.waitForTimeout(250); } await c.page.waitForTimeout(2500); for (let i = 0; i < 6; i++) { await cup(2); await c.page.waitForTimeout(250); } await c.page.waitForTimeout(3500); }, true);
    await probeF(c.page, 'Q vs K, the piston end to end and back', w, async () => {
      const b = await c.page.locator('.qk2 .tk2-drag .tk2-knob').boundingBox(), x = b.x + b.width / 2, y0 = b.y + b.height / 2;
      const g = await c.page.evaluate(() => { const G = window.__qk2.G(), r = document.querySelector('.qk2-scene').getBoundingClientRect(), k = r.width / G.W; return [r.top + (window.__qk2.pistonY(0.5) - 12 - G.stem) * k, r.top + (window.__qk2.pistonY(1.5) - 12 - G.stem) * k]; });
      await c.page.mouse.move(x, y0); await c.page.mouse.down();
      for (let i = 0; i <= 20; i++) { await c.page.mouse.move(x, y0 + (g[0] - y0) * i / 20); await c.page.waitForTimeout(16); }
      await c.page.waitForTimeout(1500);
      for (let i = 0; i <= 20; i++) { await c.page.mouse.move(x, g[0] + (g[1] - g[0]) * i / 20); await c.page.waitForTimeout(16); }
      await c.page.mouse.up(); await c.page.waitForTimeout(3000);
    }, true);
    await c.ctx.close();
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
    const fp = await ctx.newPage();
    await unlock(fp);
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
console.log(`Q vs K sweep: ${states} states, ${checks} checks, 0 failures` + (FRAMES ? ' (frames)' : PERF ? ' (perf)' : ''));
