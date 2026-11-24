/* Tools v2 layout sweep for AP® Calculus AB Riemann sums (docs/tools-v2-calc-riemann-sums-brief.md), after the
   pattern of calc-limit-explorer-sweep.mjs. Every curve and table at its landmark states: tab 1 at 1, 4, 12 and 100
   strips, each kind of sum, a strip tapped, Fill one by one finished; tab 2 with each kind of sum; plus the first
   visit. At each width given, in the theme given (dark asserted). The Premium tool is unlocked for the test only (the
   page's assets/premium.js is routed with has() returning true; never committed). At each state it asserts:
     - nothing drawn or labelled is clipped by the stage (labels, ticks, titles, the knob, its tag, the sums, the cue);
     - no two labels, the tag, the sums or ticks closer than 4 px; nothing on the knob; no rendered text under 11 px;
     - the graph panel is the largest thing and at least 40% of the stage; the tank is smaller than it;
     - the words agree with the picture: the sum in the cause line is the signed area of the drawn columns (read from
       the drawn path), the tank's number is where its water is drawn, "over by" or "under by" is the sum minus the
       exact value, the tag reads the number of drawn strips, and in tab 2 "overestimate" only with more orange
       (extra) than green (missed) drawn, "underestimate" only with more green;
     - on a phone the cause line is at most two rows; no sideways scroll; no console errors;
     - on a first visit one cue is shown, whole, covering no label, number, tick or tag.
   --fit: at 390x844, 1024x768, 1280x800, 375x667 and 360x740 the knob, the picture and the cause line are in view at
   once with no inner scroll, on a first visit and after (any width list is ignored).
   --frames: frame by frame during a knob drag, a jump of many strips (End), a change of sum, a tab change and Fill one
   by one: the cause line's sum is the drawn area and the tank's number its drawn level on every frame; the takeaway
   only once the picture shows it; motion seen; leaving for Test yourself mid fill stops it.

     node scripts/tools-v2/calc-riemann-sums-sweep.mjs [width] [--dark] [--shots dir] [--fit] [--frames]

   One width per process. Needs Playwright and a Chromium. */
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
  let body = readFileSync(p);
  // the Premium unlock for this test only
  if (p.endsWith(join('assets', 'premium.js'))) body = String(body).replace('function has(course) {', 'function has(course) { return true;');
  res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(body);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const args = process.argv.slice(2), si = args.indexOf('--shots'), SHOTS = si >= 0 ? args[si + 1] : null;
const DARK = args.includes('--dark'), FIT = args.includes('--fit'), FRAMES = args.includes('--frames'), THEME = DARK ? 'dark' : 'light';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const WIDTHS = (args[0] && !args[0].startsWith('--') ? args[0] : '360,390,430,600,768,820,1024,1280,1440,1920').split(',').map(Number);
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
const CUES = ['tk2c:apcalc-riemann-sums', 'tk2c:apcalc-riemann-sums-2', 'tk2h:apcalc-riemann-sums-n'];
async function open(o) {
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, serviceWorkers: 'block', deviceScaleFactor: 1, reducedMotion: o.motion ? 'no-preference' : 'reduce' });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|ERR_BLOCKED/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.addInitScript(t => { window.LevlToolTest = true; try { localStorage.setItem('nremt_theme', t); } catch (e) {} }, THEME);
  if (!o.cue) await page.addInitScript(k => { try { k.forEach(x => localStorage.setItem(x, '1')); } catch (e) {} }, CUES);
  await page.goto(BASE + '/calculus/tools/riemann-sums.html', { waitUntil: 'load' });
  await page.waitForSelector('.rs2-svg .rs2-tops');
  await page.waitForTimeout(400);
  const dark = await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark');
  if (DARK && !dark) throw new Error('the page is not dark');
  if (!DARK && dark) throw new Error('the page is dark');
  return { page, errs, ctx };
}
const shot = (page, name) => SHOTS ? page.locator('.rs2').screenshot({ path: join(SHOTS, name) }) : null;

/* Runs in the page: what the drawn frame says, read from the DOM (the paths, the tank's water, the words). */
const READ = () => {
  const T = window.ApCalcRiemannSums, G = T.G(), D = T.D(), S = T.S;
  // the signed area of the drawn columns: the glass path is the closed outline axis -> tops -> axis
  const d = document.querySelector('.rs2-svg [data-k="glass"]').getAttribute('d');
  const pts = d.replace(/Z/g, '').split(/(?=[ML])/).map(s => s.slice(1).trim().split(/\s+/).map(Number));
  let a = 0; for (let i = 0; i + 1 < pts.length; i++) a += (pts[i + 1][0] - pts[i][0]) * ((G.y0 - pts[i][1]) + (G.y0 - pts[i + 1][1])) / 2;
  const kx = (G.x[1] - G.x[0]) / (G.R - G.L), ky = (G.y[1] - G.y[0]) / (G.B - G.T), drawnArea = a * kx * ky;
  const tw = document.querySelector('.rs2-svg [data-k="tw"]'), level = +tw.getAttribute('y');
  const num = s => +String(s).replace(/−/g, '-').replace(/,/g, '').replace(/[^\d.\-]/g, '');
  const causeEl = document.querySelector('.rs2 .tk2-cause'), take = causeEl.classList.contains('is-take');
  const pills = [...causeEl.querySelectorAll('.tk2-cz')].map(e => ({ t: e.textContent, c: e.className }));
  const tankLab = [...document.querySelectorAll('.rs2-labs text')].find(e => e.classList.contains('rs2-big'));
  const tag = document.querySelector('.rs2 .rs2-knob .tk2-tag');
  const sl = S.drawn && S.drawn.sl;
  // the drawn strips: walls of the target
  return { drawnArea, level, tankText: tankLab ? tankLab.textContent : '', tankY: G.ty ? null : null, take, takeText: take ? causeEl.textContent : '', pills, tag: tag && !tag.hidden ? tag.textContent : '',
    nDrawn: S.ps.length, tab: S.tab, kind: S.kind, fill: S.fill, e: S.e, from: !!S.from, exact: D.exact, dec: D.dec, tankLo: D.tank[0], tankHi: D.tank[1], tT: G.tT, tB: G.tB,
    ex: sl ? sl.exA : 0, mi: sl ? sl.miA : 0, inTank: S.drawn.inTank, sel: S.sel, isT: D.type === 'table' };
};
/* the checks on one read frame (in node) */
function agree(F, tag) {
  const out = [], num = s => +String(s).replace(/−/g, '-').replace(/[^\d.\-]/g, '');
  const tol = Math.max(0.6 * Math.pow(10, -F.dec), Math.abs(F.drawnArea) * 0.004 + 0.002 * (F.tankHi - F.tankLo));
  // the tank's number at its drawn level
  if (F.tankText) {
    const v = num(F.tankText), y = F.tB - 6 - (v - F.tankLo) / (F.tankHi - F.tankLo) * (F.tB - F.tT - 12);
    if (Math.abs(Math.max(F.tT, Math.min(F.tB - 4, y)) - F.level) > 1.6) out.push(`${tag}: the tank says ${F.tankText} but its water is drawn at ${F.level.toFixed(1)} (expected ${y.toFixed(1)})`);
  }
  if (F.take) return out;
  const sumPill = F.pills.find(p => /is-sum/.test(p.c));
  if (F.fill == null && F.sel < 0 && sumPill && F.tab === 'n') {
    const v = num(sumPill.t.split(' ').slice(-2).join(' ').replace(/ ?[A-Za-z/]+$/, ''));
    if (Math.abs(v - F.drawnArea) > tol) out.push(`${tag}: the cause line's sum ${sumPill.t} is not the drawn area ${F.drawnArea.toFixed(4)}`);
    const by = F.pills.find(p => /^(over|under) by /.test(p.t));
    if (by && F.exact != null) { const e = num(by.t.replace(/^(over|under) by /, '')) * (/^over/.test(by.t) ? 1 : -1), want = F.drawnArea - F.exact; if (Math.abs(e - want) > tol + 1e-6) out.push(`${tag}: "${by.t}" but the drawn sum minus exact is ${want.toFixed(4)}`); }
    if (F.tag && !F.isT && num(F.tag) !== F.nDrawn) out.push(`${tag}: the tag says ${F.tag} with ${F.nDrawn} strips drawn`);
    if (!F.from && F.tankText && Math.abs(num(F.tankText) - F.drawnArea) > tol) out.push(`${tag}: the tank ${F.tankText} is not the drawn columns' area ${F.drawnArea.toFixed(4)}`);
  }
  if (F.tab === 'ou' && !F.isT) {
    const txt = F.pills.map(p => p.t).join(' | ');
    if (/overestimate/.test(txt) && !(F.ex > F.mi)) out.push(`${tag}: "overestimate" with less orange than green drawn (${F.ex.toFixed(0)} / ${F.mi.toFixed(0)})`);
    if (/underestimate/.test(txt) && !(F.mi > F.ex)) out.push(`${tag}: "underestimate" with less green than orange drawn (${F.ex.toFixed(0)} / ${F.mi.toFixed(0)})`);
  }
  return out;
}
/* Runs in the page: the layout checks of one state. */
const probe = () => {
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none' && !e.closest('[hidden]') && R(e).w > 0;
  const q = s => [...document.querySelectorAll(s)].filter(vis), out = [];
  const T = window.ApCalcRiemannSums, G = T.G();
  const scEl = document.querySelector('.rs2-scene'), sc = R(scEl), k = sc.w / G.W;
  const inS = (x, name, tol = 0.6) => { if (x.l < sc.l - tol || x.r > sc.r + tol || x.t < sc.t - tol || x.b > sc.b + tol) out.push('clipped: ' + name); };
  const hit = (a, c, g = 0.6) => !(a.r - g <= c.l || c.r - g <= a.l || a.b - g <= c.t || c.b - g <= a.t);
  const labs = q('.rs2-labs text').map(e => ({ n: 'label "' + e.textContent + '"', r: R(e), e }));
  const ticks = q('.rs2-static .rs2-tick, .rs2-static .rs2-rlab, .rs2-static .rs2-tnote').map(e => ({ n: 'tick "' + e.textContent + '"', r: R(e), e }));
  const titles = q('.rs2-static .rs2-title').map(e => ({ n: 'title "' + e.textContent + '"', r: R(e), e }));
  const tags = q('.rs2 .rs2-knob .tk2-tag').map(e => ({ n: 'tag "' + e.textContent + '"', r: R(e), e, css: true }));
  const knobs = q('.rs2 .rs2-knob .tk2-dot').map(e => ({ n: 'knob', r: R(e) }));
  const segs = q('.rs2-seg').map(e => ({ n: 'the sums', r: R(e) }));
  const chips = q('.rs2 .tk2-chip').map(e => ({ n: 'chip', r: R(e) }));
  const segBtns = q('.rs2-seg button').map(e => ({ n: 'sum button "' + e.textContent + '"', r: R(e), e, css: true }));
  [...labs, ...ticks, ...titles, ...tags, ...knobs, ...segs, ...chips].forEach(x => inS(x.r, x.n));
  [...labs, ...ticks, ...titles, ...tags, ...segBtns].forEach(x => { const fs = parseFloat(getComputedStyle(x.e).fontSize) * (x.css ? 1 : k); if (fs < 10.95) out.push(x.n + ' renders at ' + fs.toFixed(1) + ' px'); });
  const words = [...labs, ...tags, ...segs];
  for (let i = 0; i < words.length; i++) for (let j = i + 1; j < words.length; j++) if (hit(words[i].r, words[j].r, -4)) out.push('closer than 4 px: ' + words[i].n + ' and ' + words[j].n);
  [...labs, ...tags, ...segs].forEach(a => [...ticks, ...titles].forEach(c => { if (hit(a.r, c.r)) out.push('overlap: ' + a.n + ' and ' + c.n); }));
  [...labs, ...segs, ...ticks, ...titles].forEach(a => knobs.forEach(c => { if (hit(a.r, c.r)) out.push(a.n + ' under the knob'); }));
  chips.forEach(c => [...labs, ...tags, ...ticks, ...titles, ...segs].forEach(a => { if (hit(a.r, c.r)) out.push('the chip covers ' + a.n); }));
  for (let i = 0; i < ticks.length; i++) for (let j = i + 1; j < ticks.length; j++) if (hit(ticks[i].r, ticks[j].r)) out.push('overlap: ' + ticks[i].n + ' and ' + ticks[j].n);
  // the graph panel is the largest thing
  const plot = (G.R - G.L) * (G.B - G.T) * k * k, tank = G.tankW * (G.tB - G.tT) * k * k, share = plot / (sc.w * sc.h);
  if (tank >= plot) out.push('the tank is bigger than the graph');
  if (share < 0.4) out.push('the graph is ' + (share * 100).toFixed(0) + '% of the stage');
  const causeEl = document.querySelector('.rs2 .tk2-cause');
  const rows = new Set(q('.rs2 .tk2-cz').map(e => Math.round(R(e).t))).size;
  if (innerWidth <= 640 && rows > 2) out.push('cause line is ' + rows + ' rows: ' + causeEl.textContent);
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  return out;
};
async function act(page, a) {
  await page.evaluate(a => { const T = window.ApCalcRiemannSums;
    if (a[0] === 'curve') T.setCurve(a[1]); if (a[0] === 'n') T.setN(a[1]); if (a[0] === 'kind') T.kind(a[1]); if (a[0] === 'tab') T.setTab(a[1]);
    if (a[0] === 'tap') T.tap(a[1]); if (a[0] === 'fill') T.fill.start(); }, a);
  await page.waitForTimeout(a[0] === 'fill' ? 300 : 120);
}
const CURVES = ['pump', 'morning', 'grow', 'root', 'decay', 'dome', 'wave', 'cubic', 'inflow', 'coast'];
const TABLES = ['inflow', 'coast'];
const STATES = [];
for (const c of CURVES) {
  const t = TABLES.includes(c);
  STATES.push([c + '-start', [['curve', c]]]);
  if (!t) STATES.push([c + '-n1', [['curve', c], ['n', 1]]], [c + '-n12', [['curve', c], ['n', 12]]], [c + '-n100', [['curve', c], ['n', 100]]], [c + '-n100trap', [['curve', c], ['kind', 'trap'], ['n', 100]]]);
  for (const k of ['right', 'mid', 'trap']) STATES.push([c + '-' + k, [['curve', c], ['kind', k]]]);
  STATES.push([c + '-tap', [['curve', c], ['tap', 1]]], [c + '-filled', [['curve', c], ['fill']]]);
  for (const k of ['left', 'right', 'mid', 'trap']) STATES.push([c + '-ou-' + k, [['curve', c], ['tab', 'ou'], ['kind', k]]]);
}
let checks = 0, states = 0; const fails = [];
const heightOf = w => w <= 430 ? 844 : w <= 820 ? 1024 : w >= 1920 ? 1080 : 900;
const reset = page => page.evaluate(() => { const T = window.ApCalcRiemannSums; T.setTab('n'); T.setCurve('pump'); T.kind('left'); T.setN(4); T.S.n2 = 3; });
if (FIT) {
  for (const [w, h] of [[390, 844], [1024, 768], [1280, 800], [375, 667], [360, 740]]) for (const cue of [true, false]) {
    const { page, errs, ctx } = await open({ w, h, cue });
    for (const st of [[], [['tab', 'ou']], [['curve', 'inflow']]]) {
      for (const a of st) await act(page, a);
      await page.waitForTimeout(250);
      const r = await page.evaluate(() => {
        window.scrollTo(0, 0);
        const R = e => e.getBoundingClientRect(), sc = R(document.querySelector('.rs2-scene')), c = R(document.querySelector('.rs2 .tk2-cause')), out = [];
        if (sc.top < 0 || sc.bottom > innerHeight) out.push('the picture is not wholly in view (' + Math.round(sc.top) + ' to ' + Math.round(sc.bottom) + ')');
        if (c.bottom > innerHeight) out.push('the cause line is below the fold (' + Math.round(c.bottom) + ')');
        const kn = document.querySelector('.rs2 .rs2-knob:not([hidden]) .tk2-knob'); if (kn) { const k = R(kn); if (k.top < 0 || k.bottom > innerHeight) out.push('the knob is out of view'); }
        const sg = R(document.querySelector('.rs2-seg')); if (sg.top < 0 || sg.bottom > innerHeight) out.push('the sums are out of view');
        let e = document.querySelector('.rs2'); while (e && e !== document.body) { const s = getComputedStyle(e); if (/(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 1) out.push('inner scroll in ' + e.className); e = e.parentElement; }
        return out;
      });
      checks += 5; states++;
      r.forEach(x => fails.push(`${w}x${h}${cue ? ' first visit' : ''} ${st.length ? st[0].join(' ') : 'tab 1'}: ${x}`));
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `fit-${w}x${h}${cue ? '-first' : ''}-${st.length ? st[0][1] : 'n'}.png`) });
    }
    errs.forEach(e => fails.push(`${w}x${h}: console: ${e}`));
    await ctx.close();
  }
} else if (FRAMES) {
  for (const w of WIDTHS) {
    const { page, errs, ctx } = await open({ w, h: heightOf(w), motion: true });
    const sample = async (name, start, ms, o = {}) => {
      await page.evaluate(() => { window.__fr = []; window.__on = true; const loop = () => { window.__fr.push(window.__read()); if (window.__on) requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
      await start(); await page.waitForTimeout(ms);
      const fr = await page.evaluate(() => { window.__on = false; return window.__fr; });
      let bad = 0;
      for (const F of fr) { checks++; const o2 = agree(F, `${w} ${name}`); if (o2.length) { bad++; if (bad < 4) fails.push(...o2); }
        if (F.take && /^With 100 strips/.test(F.takeText) && (F.from || F.nDrawn !== 100)) { bad++; fails.push(`${w} ${name}: the 100 strips takeaway before the picture shows them`); }
        if (F.take && /^Poured together/.test(F.takeText) && F.fill != null && F.fill < F.nDrawn - 1e-6) { bad++; fails.push(`${w} ${name}: the fill takeaway before the last column is poured`); } }
      if (o.motion) { checks++; const ds = new Set(fr.map(F => F[o.motion].toFixed(3))); if (ds.size < 4) fails.push(`${w} ${name}: no motion seen (${ds.size} distinct values of ${o.motion})`); }
      console.log(`${w} ${THEME} frames ${name}: ${fr.length} frames, ${bad} bad`);
      if (SHOTS) await shot(page, `${w}-${THEME}-frames-${name}.png`);
    };
    await page.evaluate(`window.__read = ${READ.toString()}`);
    // a real drag of the knob along the rail
    await sample('drag', async () => {
      const b = await page.locator('.rs2 .rs2-knob .tk2-knob').boundingBox(), x = b.x + b.width / 2, y = b.y + b.height / 2;
      await page.mouse.move(x, y); await page.mouse.down();
      for (let i = 0; i <= 20; i++) { await page.mouse.move(x + 160 * i / 20, y); await page.waitForTimeout(20); }
      for (let i = 20; i >= 0; i--) { await page.mouse.move(x + 160 * i / 20, y); await page.waitForTimeout(20); }
      await page.mouse.up();
    }, 900, { motion: 'drawnArea' });
    await sample('end-key', async () => { await page.focus('.rs2 .rs2-knob .tk2-knob'); await page.keyboard.press('End'); }, 900, { motion: 'drawnArea' });
    const t100 = await page.evaluate(() => document.querySelector('.rs2 .tk2-cause').textContent);
    checks++; if (!/^With 100 strips/.test(t100)) fails.push(`${w}: no takeaway at 100 strips: ${t100}`);
    await sample('home-key', async () => { await page.keyboard.press('Home'); }, 900, { motion: 'drawnArea' });
    await sample('kind', async () => { await page.click('.rs2-seg [data-k="right"]'); }, 800, { motion: 'drawnArea' });
    await sample('tab', async () => { await page.click('.rs2 .tk2-tab[data-v="ou"]'); }, 800, { motion: 'drawnArea' });
    await page.click('.rs2 .tk2-tab[data-v="n"]'); await page.waitForTimeout(500);
    await page.evaluate(() => window.ApCalcRiemannSums.setN(8)); await page.waitForTimeout(500);
    await sample('fill', async () => { await page.click('.rs2 .tk2-play'); }, 4600, { motion: 'inTank' });
    const tk = await page.evaluate(() => document.querySelector('.rs2 .tk2-cause').textContent);
    checks++; if (!/^Poured together/.test(tk)) fails.push(`${w}: no takeaway after Fill one by one: ${tk}`);
    await sample('refill', async () => { await page.click('.rs2-seg [data-k="trap"]'); }, 800);
    await page.evaluate(() => window.ApCalcRiemannSums.setCurve('cubic')); await page.waitForTimeout(500);
    await sample('fill-negative', async () => { await page.click('.rs2 .tk2-play'); }, 4600, { motion: 'inTank' });
    // leave mid fill: Test yourself, then back; nothing left running
    await page.click('.rs2 .tk2-play'); await page.waitForTimeout(800);
    await page.getByRole('button', { name: 'Test yourself' }).first().click().catch(() => page.getByRole('tab', { name: 'Test yourself' }).first().click());
    await page.waitForTimeout(500);
    const stopped = await page.evaluate(() => !window.ApCalcRiemannSums.fill.playing() && window.ApCalcRiemannSums.S.fill == null);
    checks++; if (!stopped) fails.push(`${w}: Fill one by one kept running in Test yourself`);
    errs.forEach(e => fails.push(`${w} frames: console: ${e}`));
    await ctx.close();
  }
} else {
  for (const w of WIDTHS) {
    const h = heightOf(w), W4 = String(w).padStart(4, '0');
    for (const tab of ['n', 'ou']) { // the first visit (each tab has its own cue)
      const c = await open({ w, h, cue: true });
      if (tab === 'ou') { await c.page.click('.rs2 .tk2-tab[data-v="ou"]'); await c.page.waitForTimeout(400); }
      await c.page.waitForTimeout(300);
      const bad = await c.page.evaluate(() => { const R = e => e.getBoundingClientRect(), cues = [...document.querySelectorAll('.rs2 .tk2-cue')].filter(e => !e.hidden && R(e).width); if (cues.length !== 1) return ['cues shown: ' + cues.length];
        const r = R(cues[0]), S = R(document.querySelector('.rs2-scene')), out = [];
        if (r.left < S.left || r.right > S.right || r.top < S.top || r.bottom > S.bottom) out.push('the cue is clipped by the stage');
        [...document.querySelectorAll('.rs2-labs text, .rs2-static .rs2-tick, .rs2-static .rs2-title, .rs2-static .rs2-rlab, .rs2 .tk2-tag, .rs2 .tk2-chip, .rs2-seg button, .rs2 .rs2-knob .tk2-dot')].forEach(e => { const q = R(e); if (q.width && getComputedStyle(e).display !== 'none' && !e.closest('[hidden]') && !(q.right <= r.left || q.left >= r.right || q.bottom <= r.top || q.top >= r.bottom)) out.push('the cue covers "' + e.textContent + '"'); });
        return out; });
      checks += 3; states++;
      bad.forEach(x => fails.push(`${w} first visit ${tab}: ${x}`));
      if (SHOTS) await shot(c.page, `${W4}-${THEME}-0-first-visit-${tab}.png`);
      await c.ctx.close();
    }
    const { page, errs, ctx } = await open({ w, h });
    await page.evaluate(`window.__read = ${READ.toString()}`);
    for (const [name, acts] of STATES) {
      await reset(page); await page.waitForTimeout(80);
      for (const a of acts) await act(page, a);
      await page.waitForTimeout(250);
      let r = await page.evaluate(probe);
      if (r.length) { await page.waitForTimeout(700); r = await page.evaluate(probe); }
      const F = await page.evaluate(() => window.__read());
      const ag = agree(F, `${w} ${THEME} ${name}`);
      states++; checks += 22;
      r.forEach(x => fails.push(`${w} ${THEME} ${name}: ${x}`)); fails.push(...ag);
      if (SHOTS && (w === 390 || w === 1440 || /start|n100|ou-left|tap|filled/.test(name))) await shot(page, `${W4}-${THEME}-${name}.png`);
    }
    errs.forEach(e => fails.push(`${w}: console: ${e}`));
    await ctx.close();
  }
}
await browser.close(); server.close();
const uniq = [...new Set(fails)];
console.log(`Riemann sums sweep${FIT ? ' (fit)' : FRAMES ? ' (frames)' : ''}, ${THEME}: ${states} states, ${checks} checks, ${uniq.length} failures at ${FIT ? '390x844, 1024x768, 1280x800, 375x667, 360x740' : WIDTHS.join(', ')}`);
uniq.slice(0, 80).forEach(x => console.log('  ' + x));
process.exit(uniq.length ? 1 : 0);
