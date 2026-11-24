/* Tools v2 sweep for AP® Physics 1 Motion graphs (docs/tools-v2-phys-motion-graphs-brief.md), after the pattern of
   phys-torque-balance-sweep.mjs. Three runs, one width per process:

     node scripts/tools-v2/phys-motion-graphs-sweep.mjs [widths] [--dark] [--shots dir]
       Every landmark state of the two Explore tabs, the first visits, Test yourself and Match the graph. At each state:
       - the page is really dark in a dark run (localStorage nremt_theme, the site's key);
       - nothing drawn or labelled is clipped by the picture; no two words or numbers come within 4 px; no knob covers
         a word; no rendered text under 11 px;
       - the cart is bigger than anything else on the track (the detector), the track spans the graphs' width;
       - the words agree with the drawing: the cart's arrows, the tangents' slopes, the cause line's v and a, the
         result word, "turns" and "turns at" against the drawn traces and dots (values read back from pixels);
       - at 390 × 844, 1024 × 768 and 1280 × 800 the main control, the picture and the cause line are all on screen
         at once, with no inner scroll; on a phone the cause line is at most two rows with one height per tab; no
         sideways scroll; no console errors; a first visit's cue is whole and covers no word, number or knob.
     ... --frames      Every animated change sampled on every frame (a live drive, a fast drag and a reversal, keys,
                       the example fading, a replay, a scrub, the Set run and its return, leaving mid run, reduced
                       motion): on every frame the cart, its arrows, the dots, the tangents and the cause line agree.
     ... --perf        A full drive drag at CPU x4 (median and p95 frame time) beside the flagship (Water pollution's
                       sacks), in the same run.

   Needs Playwright and a Chromium (CHROME or /opt/pw-browsers/chromium-1243/chrome-linux64/chrome). It serves the
   repo on a free port, blocks service workers and other hosts. Motion graphs is free: nothing is unlocked. Exit code
   1 on any failure. */
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
const DARK = args.includes('--dark'), FRAMES = args.includes('--frames'), PERF = args.includes('--perf');
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const WIDTHS = (args[0] && !args[0].startsWith('--') ? args[0] : '360,390,430,600,768,820,1024,1280,1440,1920').split(',').map(Number);
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
const PREMIUM = readFileSync(join(ROOT, 'assets/premium.js'), 'utf8').replace('function has(course) {', 'function has(course) { return true;');
async function open(o) {
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, serviceWorkers: 'block', deviceScaleFactor: 1, reducedMotion: o.reduced ? 'reduce' : 'no-preference', hasTouch: !!o.touch });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|supabase/.test(m.text() + (m.location().url || ''))) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  // only the flagship (Premium) is unlocked, for the perf comparison; Motion graphs is free and runs as it ships
  if (o.path) await page.route('**/assets/premium.js', r => r.fulfill({ body: PREMIUM, contentType: 'application/javascript' }));
  await page.addInitScript(o2 => { try { if (o2.dark) localStorage.setItem('nremt_theme', 'dark'); if (!o2.cue) ['drive', 'set'].forEach(k => localStorage.setItem('tk2c:apphys-motion-graphs-' + k, '1')); } catch (e) {} }, { dark: DARK, cue: !!o.cue });
  await page.goto(BASE + (o.path || '/physics/tools/motion-graphs.html') + (o.hash || ''), { waitUntil: 'load' });
  if (!o.path && !o.hash) { await page.waitForSelector('.mg2-svg .mg2-cart', { timeout: 15000 }); await page.waitForTimeout(500); }
  return { page, errs, ctx };
}
const W4 = w => String(w).padStart(4, '0') + (DARK ? 'd' : 'l');
const shot = async (page, name) => { if (!SHOTS) return; return page.screenshot({ path: join(SHOTS, name), fullPage: (await page.viewportSize()).width < 900 }); };
const tab = async (page, v) => { await page.click(`.tk2-tab[data-v=${v}]`); await page.waitForTimeout(400); };
async function until(page, fn, arg, ms = 8000) { const t0 = Date.now(); for (;;) { if (await page.evaluate(fn, arg)) return; if (Date.now() - t0 > ms) throw new Error('timed out: ' + fn.toString().slice(0, 80)); await page.waitForTimeout(40); } }
const idle = page => until(page, () => { const s = document.querySelector('.mg2').__mg.st; return !s.drv.rec && !s.play && !s.back; }, null, 16000).then(() => page.waitForTimeout(150));

/* Runs in the page: the drawn state read back from pixels, and every check on it. */
const probe = (o) => {
  const out = [], R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const shown = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]') && getComputedStyle(e).display !== 'none';
  const root = o.root ? document.querySelector(o.root) : document.querySelector('.mg2');
  const scene = root.querySelector('.mg2-scene'), svg = scene.querySelector('.mg2-svg'), S = R(scene);
  const k = R(svg).w / svg.viewBox.baseVal.width;
  const gap = (a, c) => Math.max(c.l - a.r, a.l - c.r, c.t - a.b, a.t - c.b);
  if (o.dark && document.documentElement.getAttribute('data-theme') !== 'dark') out.push('the page is not dark in a dark run');
  const texts = [...svg.querySelectorAll('text')].filter(e => shown(e) && e.textContent.trim()).map(e => ({ n: '"' + e.textContent.trim() + '"', r: R(e), el: e }));
  texts.forEach(x => { const fs = parseFloat(getComputedStyle(x.el).fontSize) * k; if (fs < 10.95) out.push('text under 11 px: ' + x.n + ' ' + fs.toFixed(1)); if (x.r.l < S.l - 0.6 || x.r.r > S.r + 0.6 || x.r.t < S.t - 0.6 || x.r.b > S.b + 0.6) out.push('clipped: ' + x.n); });
  const knobs = [...scene.querySelectorAll('.tk2-dot')].filter(shown).map(e => ({ r: R(e) }));
  knobs.forEach(x => { if (x.r.l < S.l - 2 || x.r.r > S.r + 2 || x.r.t < S.t - 2 || x.r.b > S.b + 2) out.push('a knob is clipped'); });
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) if (gap(texts[i].r, texts[j].r) < 4) out.push('words closer than 4 px: ' + texts[i].n + ' and ' + texts[j].n);
  texts.forEach(a => knobs.forEach(kk => { if (gap(a.r, kk.r) < 0) out.push('a knob covers ' + a.n); }));
  for (let i = 0; i < knobs.length; i++) for (let j = i + 1; j < knobs.length; j++) if (gap(knobs[i].r, knobs[j].r) < 2) out.push('two knobs touch');
  if (Math.abs(svg.viewBox.baseVal.height * k - R(svg).h) > 1.5 && !scene.classList.contains('is-match')) out.push('the drawing does not fill its box (stale size)');
  // the cart is the biggest thing on the track; the track spans the graphs
  const cart = R(svg.querySelector('.mg2-body')), det = R(svg.querySelector('.mg2-det-b')), rail = R(svg.querySelector('.mg2-rail')), pan = R(svg.querySelector('.mg2-pbg'));
  if (cart.w * cart.h < det.w * det.h) out.push('the detector is bigger than the cart');
  if (rail.w < pan.w * 0.9) out.push('the track is narrower than the graphs');
  // the drawn values, read back from pixels
  const L = root.__mg.lab, G = L.geo(), st = L.st, RG = { x: [-5, 5], v: [-4, 4], a: [-3, 3] };
  const val = (kk, cy) => RG[kk][0] + (G.top[kk] + G.ph - cy) / G.ph * (RG[kk][1] - RG[kk][0]);
  const dot = kk => { const d = svg.querySelector('.mg2-dot.' + { x: 's1', v: 's2', a: 's3' }[kk]); return +d.getAttribute('cx') < 0 ? null : val(kk, +d.getAttribute('cy')); };
  const dx = dot('x'), dv = dot('v'), da = dot('a'), s = L.series();
  const tol = kk => (RG[kk][1] - RG[kk][0]) / G.ph * 0.6 + 0.002;
  const inRange = (kk, y) => y > RG[kk][0] + 0.01 && y < RG[kk][1] - 0.01;
  const cxDrawn = +svg.querySelector('.mg2-cart').getAttribute('data-x');
  const va = +svg.querySelector('.mg2-va').getAttribute('data-v'), aa = +svg.querySelector('.mg2-aa').getAttribute('data-a');
  if (s && dv != null) {
    if (inRange('v', dv) && Math.abs(va - dv) > tol('v')) out.push(`the v arrow says ${va.toFixed(2)}, the v graph's dot ${dv.toFixed(2)}`);
    if (inRange('a', da) && Math.abs(aa - da) > tol('a')) out.push(`the a arrow says ${aa.toFixed(2)}, the a graph's dot ${da.toFixed(2)}`);
    const recording = st.drv.rec && st.tab === 'drive';
    if (!recording && inRange('x', dx) && Math.abs(cxDrawn - dx) > tol('x')) out.push(`the cart is drawn at ${cxDrawn.toFixed(2)} m, the x graph's dot at ${dx.toFixed(2)}`);
    // the tangents: their pixel slopes are the drawn v and a
    const tl = (sel, kk) => { const e = svg.querySelector(sel); const x1 = +e.getAttribute('x1'), x2 = +e.getAttribute('x2'), y1 = +e.getAttribute('y1'), y2 = +e.getAttribute('y2'); if (Math.abs(x2 - x1) < 2) return null; return -(y2 - y1) / G.ph * (RG[kk][1] - RG[kk][0]) / ((x2 - x1) / G.pw * 10); };
    const sv = tl('.mg2-tan.is-v', 'x'), sa = tl('.mg2-tan.is-a', 'v');
    if (sv != null && inRange('v', dv) && Math.abs(sv - dv) > 0.03) out.push(`the x tangent's slope ${sv.toFixed(2)} is not the drawn v ${dv.toFixed(2)}`);
    if (sa != null && inRange('a', da) && Math.abs(sa - da) > 0.03) out.push(`the v tangent's slope ${sa.toFixed(2)} is not the drawn a ${da.toFixed(2)}`);
    // the area under v-t is Δx (exact runs; a hand drive within 0.3 m)
    const ar = +svg.querySelector('.mg2-area').getAttribute('data-area'), t = L.curT();
    if (t > 0.1 && s.exact && inRange('x', dx) && Math.abs(ar - (dx - s.x[0])) > 0.03 + tol('x')) out.push(`area under v-t ${ar.toFixed(2)} but Δx drawn ${(dx - s.x[0]).toFixed(2)}`);
    if (t > 0.1 && !s.exact && inRange('x', dx) && Math.abs(ar - (dx - s.x[0])) > 0.35) out.push(`hand drive: area under v-t ${ar.toFixed(2)} but Δx drawn ${(dx - s.x[0]).toFixed(2)}`);
    // "turns": v changes sign there on the drawn v trace
    const vpts = svg.querySelector('.mg2-tr.s2').getAttribute('points').split(' ').filter(Boolean).map(p => p.split(',').map(Number));
    [...svg.querySelectorAll('.mg2-words text')].filter(e => e.textContent === 'turns').forEach(e => {
      const x = +e.getAttribute('x'), y0 = G.top.v + G.ph / 2 + G.ph / 2 * 0, z = G.top.v + G.ph - (0 - -4) / 8 * G.ph;
      const near = vpts.filter(p => Math.abs(p[0] - x) < G.pw * 0.15);
      const above = near.some(p => p[1] < z - 0.5), below = near.some(p => p[1] > z + 0.5);
      if (!(above && below)) out.push('"turns" where v does not cross zero');
    });
  }
  // Set: each tip's knob sits on its drawn arrow's tip
  if (st.tab === 'set' && !st.back) {
    [['.mg2-va', /velocity/], ['.mg2-aa', /Acceleration/]].forEach(([sel, re]) => {
      const kn = [...scene.querySelectorAll('.tk2-handle .tk2-knob')].find(e => re.test(e.getAttribute('aria-label') || ''));
      if (!kn || !shown(kn) || kn.style.visibility === 'hidden') return;
      const kr = R(kn), arr = svg.querySelector(sel), d = arr.getAttribute('d'), sv = R(svg);
      const kx = (kr.l + kr.w / 2 - sv.l) / k;
      const nums = d ? d.match(/-?[\d.]+/g).map(Number) : null, tipX = nums ? nums[4] : null;
      const want = tipX != null ? tipX : (svg.querySelector('.mg2-cart').transform.baseVal.consolidate().matrix.e);
      if (Math.abs(kx - want) > 1.5) out.push('a knob is not on its arrow’s tip (' + kx.toFixed(1) + ' vs ' + want.toFixed(1) + ')');
    });
  }
  // the cause line: v, a and the result word from the drawn frame
  const causeEl = root.querySelector('.tk2-cause');
  if (causeEl && !causeEl.classList.contains('is-take') && s) {
    const cause = causeEl.innerText.replace(/\s+/g, ' ').trim(), res = causeEl.getAttribute('data-res') || '';
    const num = re => { const m = re.exec(cause); return m ? +m[1].replace('−', '-').replace('+', '') : null; };
    if (st.tab === 'drive') {
      const cv = num(/v ([+−-]?[\d.]+) m\/s/), ca = num(/a ([+−-]?[\d.]+) m\/s²/), ct = num(/at ([\d.]+) s:/);
      if (cv == null || ca == null) out.push('cause line without v and a: ' + cause);
      else {
        if (inRange('v', dv) && Math.abs(cv - dv) > 0.05 + tol('v')) out.push(`cause line v ${cv} but the drawn v is ${dv.toFixed(2)}`);
        if (inRange('a', da) && Math.abs(ca - da) > 0.05 + tol('a')) out.push(`cause line a ${ca} but the drawn a is ${da.toFixed(2)}`);
        if (ct != null && Math.abs(ct - L.curT()) > 0.051) out.push(`cause line time ${ct} but the cursor is at ${L.curT().toFixed(2)}`);
        const ex = !!s.exact, ev = ex ? 0.02 : 0.08, ea = ex ? 0.02 : 0.4, d = Math.abs(va) < ev ? 0 : Math.sign(va), ad = Math.abs(aa) < ea ? 0 : Math.sign(aa);
        const want = !d ? (ad ? 'turn' : 'rest') : !ad ? 'const' : ad === d ? 'up' : 'down';
        if (res !== want) out.push(`result ${res} for the drawn v ${va.toFixed(2)}, a ${aa.toFixed(2)} (want ${want})`);
      }
    } else {
      const se = st.set, cv = num(/v₀ ([+−-]?[\d.]+) m\/s/), ca = num(/a ([+−-]?[\d.]+) m\/s²/);
      if (cv !== +se.v0.toFixed(1) || ca !== +se.a.toFixed(1)) out.push(`cause line ${cause} for v₀ ${se.v0}, a ${se.a}`);
      // before a run, the arrows are v₀ and a
      if (!st.play && !st.back && (Math.abs(va - se.v0) > 1e-6 || Math.abs(aa - se.segs[0].a) > 1e-6)) out.push('the arrows are not v₀ and a before the run');
      const tm = /turns at ([\d.]+) s/.exec(cause);
      if (tm) {
        const T = +tm[1], xs = svg.querySelector('.mg2-tr.s1').getAttribute('points').split(' ').filter(Boolean).map(p => p.split(',').map(Number));
        const px = G.L + T / 10 * G.pw, i = xs.reduce((b, p, j) => Math.abs(p[0] - px) < Math.abs(xs[b][0] - px) ? j : b, 0);
        const ext = xs.slice(Math.max(0, i - 3), i + 4).map(p => p[1]), y = xs[i][1];
        if (!(ext.every(q => q >= y - 0.3) || ext.every(q => q <= y + 0.3))) out.push('turns at ' + T + ' s is not the top or bottom of the drawn x graph');
      }
      const want = Math.abs(se.v0) < 1e-9 && Math.abs(se.a) < 1e-9 ? 'rest' : Math.abs(se.a) < 1e-9 ? 'const' : Math.abs(se.v0) < 1e-9 ? 'up' : se.v0 * se.a > 0 ? 'up' : 'down';
      if (res.split(' ')[0] !== want) out.push(`Set result ${res} for v₀ ${se.v0}, a ${se.a}`);
    }
  }
  // the cue, when one shows: whole, inside the picture, over no word, number or knob
  const cue = [...scene.querySelectorAll('.tk2-cue')].filter(shown)[0];
  if (cue) { const r = R(cue); if (r.l < S.l - 0.5 || r.r > S.r + 0.5 || r.t < S.t - 0.5 || r.b > S.b + 0.5) out.push('the cue is clipped'); [...texts, ...knobs].forEach(x => { if (gap(r, x.r) < 0) out.push('the cue covers ' + (x.n || 'a knob')); }); }
  if (causeEl) { const rows = new Set([...causeEl.querySelectorAll('.tk2-cz')].map(e => Math.round(R(e).t))).size; if (innerWidth <= 640 && rows > 2) out.push('cause line is ' + rows + ' rows'); }
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  // fit: the main control, the picture and the cause line on screen together, no inner scroll
  if (o.fit) {
    const main = [...scene.querySelectorAll('.tk2-handle:not(.is-quiet) .tk2-dot')].filter(shown)[0];
    [['the picture', R(scene)], ['the cause line', causeEl ? R(causeEl) : null], ['the main control', main ? R(main) : null]].forEach(([n, r]) => { if (!r) out.push(n + ' missing'); else if (r.t < -0.5 || r.b > innerHeight + 0.5) out.push(n + ' is not on screen (' + Math.round(r.t) + ' to ' + Math.round(r.b) + ' of ' + innerHeight + ')'); });
    let e = scene.parentElement;
    while (e && e !== document.body) { const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 1) out.push('inner scroll in ' + e.className); e = e.parentElement; }
  }
  return { out, causeH: causeEl ? Math.round(R(causeEl).h) : 0 };
};

let checks = 0, states = 0; const fails = [];
async function runSweep(w, h) {
  for (const tv of ['drive', 'set']) {
    const c = await open({ w, h, cue: true });
    if (tv !== 'drive') await tab(c.page, tv);
    await c.page.waitForTimeout(300);
    const r = await c.page.evaluate(probe, { dark: DARK, fit: [390, 1024, 1280].includes(w) });
    const hasCue = await c.page.evaluate(() => !![...document.querySelectorAll('.tk2-cue')].filter(e => e.getClientRects().length).length);
    states++; checks += 12; if (!hasCue) fails.push(`${w} first visit ${tv}: no cue`);
    r.out.forEach(m => fails.push(`${w} first visit ${tv}: ${m}`));
    await shot(c.page, `${W4(w)}-0-first-${tv}.png`);
    await c.ctx.close();
  }
  const { page, errs, ctx } = await open({ w, h });
  const heights = { drive: new Set(), set: new Set() };
  const check = async (what, fit) => {
    const r = await page.evaluate(probe, { dark: DARK, fit: !!fit});
    states++; checks += 20; r.out.forEach(m => fails.push(`${w} ${what}: ${m}`));
    const tv = await page.evaluate(() => document.querySelector('.mg2').__mg.st.tab);
    if (w <= 640 && heights[tv]) heights[tv].add(r.causeH);
  };
  const fitW = [390, 1024, 1280].includes(w);
  await check('drive landing (example)', fitW); await shot(page, `${W4(w)}-1-drive-landing.png`);
  // a drive by mouse: right, hold, left (the recording runs 10 s)
  const knob = async () => (await page.locator('.mg2 .tk2-handle .tk2-knob').first().boundingBox());
  let b = await knob(), sx = b.x + b.width / 2, sy = b.y + b.height / 2;
  const sc = await page.locator('.mg2-scene').boundingBox(), ppm = await page.evaluate(() => document.querySelector('.mg2').__mg.lab.geo().ppm);
  await page.mouse.move(sx, sy); await page.mouse.down();
  for (let i = 1; i <= 30; i++) { await page.mouse.move(sx + ppm * 4 * i / 30, sy); await page.waitForTimeout(30); }
  await check('driving, mid recording'); await shot(page, `${W4(w)}-1-drive-recording.png`);
  for (let i = 1; i <= 30; i++) { await page.mouse.move(sx + ppm * 4 - ppm * 3 * i / 30, sy); await page.waitForTimeout(30); }
  await page.mouse.up();
  await idle(page); await check('drive done (takeaway)'); await shot(page, `${W4(w)}-1-drive-done.png`);
  // the time cursor: keys on the scrub
  await page.focus('.mg2 .tk2-scrub input'); await page.keyboard.press('Home'); for (let i = 0; i < 40; i++) await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(100); await check('drive scrubbed to 2 s'); await shot(page, `${W4(w)}-1-drive-scrub.png`);
  // drive by keys (hold right 1.5 s, hold left 1 s)
  await page.focus('.mg2 .tk2-handle .tk2-knob'); const kx0 = await page.evaluate(() => document.querySelector('.mg2').__mg.lab.cartX());
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1500); await page.keyboard.up('ArrowRight');
  const kx1 = await page.evaluate(() => document.querySelector('.mg2').__mg.lab.cartX()); checks++; if (!(kx1 - kx0 > 0.8)) fails.push(`${w} holding the right arrow key moved the cart only ${(kx1 - kx0).toFixed(2)} m`);
  await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(1000); await page.keyboard.up('ArrowLeft');
  await check('driving by keys'); await idle(page); await check('key drive done');
  await page.click('.mg2-run'); await page.waitForTimeout(1600); await check('replay mid'); await shot(page, `${W4(w)}-1-drive-replay.png`);
  await page.click('.mg2-again'); await page.waitForTimeout(300); await check('start over');
  // Set v and a
  await tab(page, 'set'); await check('set landing', fitW); await shot(page, `${W4(w)}-2-set-landing.png`);
  const setVA = async (v0, a) => { await page.evaluate(([v0, a]) => { const L = document.querySelector('.mg2').__mg.lab, H = L.handles(); H.v.value(v0, true); H.a.value(a, true); }, [v0, a]); await page.waitForTimeout(80); };
  for (const [v0, a, nm] of [[-3, 2, 'v0 -3 a +2'], [3, 2, 'end stop'], [0, 0, 'at rest'], [0, -1.2, 'from rest'], [2, 0, 'steady'], [0.4, -0.1, 'small'], [-1.5, 0.3, 'back and forth']]) {
    await setVA(v0, a); await check('set ' + nm); if (/stop|rest$|back/.test(nm)) await shot(page, `${W4(w)}-2-set-${nm.replace(/\s+/g, '-')}.png`);
  }
  await page.focus('.mg2 .tk2-handle.is-quiet .tk2-knob'); await page.keyboard.press('End'); await page.waitForTimeout(100); await check('set start at 3');
  await page.keyboard.press('Home'); await page.waitForTimeout(100);
  // a real drag of the v tip, then let go: the run plays and comes back
  b = await page.locator('.mg2 .tk2-handle:not(.is-quiet) .tk2-knob').nth(1).boundingBox().catch(() => null);
  const vb = await page.evaluate(() => { const k = document.querySelectorAll('.mg2 .tk2-handle:not(.is-quiet) .tk2-knob'); return [...k].map(e => e.getAttribute('aria-label')); });
  const vk = page.locator('.mg2 .tk2-handle:not(.is-quiet) .tk2-knob').nth(vb.findIndex(l => /velocity/.test(l)));
  b = await vk.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.mouse.move(b.x + b.width / 2 + ppm * 1.2, b.y + b.height / 2, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(1500); await check('set running'); await shot(page, `${W4(w)}-2-set-running.png`);
  // a change of a mid run: a new straight piece on v-t from that moment
  const aIdx = (await page.evaluate(() => [...document.querySelectorAll('.mg2 .tk2-handle .tk2-knob')].map(e => e.getAttribute('aria-label')))).findIndex(l => /Acceleration/.test(l));
  await page.locator('.mg2 .tk2-handle .tk2-knob').nth(aIdx).focus(); for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(300); await check('set a changed mid run'); await shot(page, `${W4(w)}-2-set-a-mid-run.png`);
  await idle(page); await check('set back at start'); await shot(page, `${W4(w)}-2-set-back.png`);
  // Test yourself: a drill problem, then Match the graph
  await page.click('.ls-root button:has-text("Test yourself")'); await page.waitForTimeout(600);
  const ty = await page.evaluate(() => ({ fig: !!document.querySelector('.ls-drill-stage svg, .ls-drill-stage .ls-drill-text'), step: !!document.querySelector('.cd-step'), sw: document.documentElement.scrollWidth > innerWidth, ex: !!document.querySelector('.mg2') && document.querySelector('.mg2').getClientRects().length > 0 }));
  checks += 4; if (!ty.fig) fails.push(`${w} Test yourself: no figure or problem on the stage`); if (!ty.step) fails.push(`${w} Test yourself: no step`); if (ty.sw) fails.push(`${w} Test yourself: sideways scroll`); if (ty.ex) fails.push(`${w} Test yourself: the Explore stage still shows`);
  await shot(page, `${W4(w)}-3-test.png`);
  await pickMatch(page);
  const mr = await page.evaluate(probe, { dark: DARK, root: '.mg2-mfig' }).catch(e => ({ out: ['no Match figure: ' + e.message] }));
  states++; checks += 12; mr.out.filter(m => !/cause line/.test(m)).forEach(m => fails.push(`${w} Match: ${m}`));
  await shot(page, `${W4(w)}-3-match.png`);
  if (w <= 640) for (const t of ['drive', 'set']) { checks++; if (heights[t].size > 1) fails.push(`${w}: cause line height not constant in ${t}: ${[...heights[t]]}`); }
  checks++; if (errs.length) fails.push(`${w}: console ${errs.join('|')}`);
  await ctx.close();
}
/* Test yourself: pick "Match the graph" in the stage's dropdown (its select drives it). */
async function pickMatch(page) {
  await page.evaluate(() => { const sel = [...document.querySelectorAll('select')].find(s => [...s.options].some(o => o.value === 'match')); sel.value = 'match'; sel.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.waitForTimeout(700);
}

/* ---------------------------------------------------------------- frame by frame */
const frameProbe = () => {
  const root = document.querySelector('.mg2'), L = root.__mg.lab, G = L.geo(), st = L.st, svg = root.querySelector('.mg2-svg'), out = [];
  const RG = { x: [-5, 5], v: [-4, 4], a: [-3, 3] }, val = (k, cy) => RG[k][0] + (G.top[k] + G.ph - cy) / G.ph * (RG[k][1] - RG[k][0]);
  const dot = k => { const d = svg.querySelector('.mg2-dot.' + { x: 's1', v: 's2', a: 's3' }[k]); return +d.getAttribute('cx') < 0 ? null : val(k, +d.getAttribute('cy')); };
  const inR = (k, y) => y != null && y > RG[k][0] + 0.01 && y < RG[k][1] - 0.01, tol = k => (RG[k][1] - RG[k][0]) / G.ph * 0.6 + 0.002;
  const dx = dot('x'), dv = dot('v'), da = dot('a');
  const va = +svg.querySelector('.mg2-va').getAttribute('data-v'), aa = +svg.querySelector('.mg2-aa').getAttribute('data-a'), cx = +svg.querySelector('.mg2-cart').getAttribute('data-x');
  // the cart's transform is where data-x says
  const m = /translate\(([-\d.]+),/.exec(svg.querySelector('.mg2-cart').getAttribute('transform')), px = G.xL + (cx + 5) * G.ppm;
  if (!m || Math.abs(+m[1] - px) > 0.6) out.push('the cart is not drawn at its x');
  if (L.series()) {
    if (inR('v', dv) && Math.abs(va - dv) > tol('v')) out.push(`v arrow ${va.toFixed(2)} vs v dot ${dv.toFixed(2)}`);
    if (inR('a', da) && Math.abs(aa - da) > tol('a')) out.push(`a arrow ${aa.toFixed(2)} vs a dot ${da.toFixed(2)}`);
    if (!(st.drv.rec && st.tab === 'drive') && inR('x', dx) && Math.abs(cx - dx) > tol('x')) out.push(`cart ${cx.toFixed(2)} vs x dot ${dx.toFixed(2)}`);
    if (st.drv.rec && st.tab === 'drive') {
      // recording: the x trace ends at the dot (the newest point), the dot is the newest point drawn
      const pts = svg.querySelector('.mg2-tr.s1').getAttribute('points').trim().split(' '), last = pts[pts.length - 1].split(',').map(Number);
      const dcx = +svg.querySelector('.mg2-dot.s1').getAttribute('cx');
      if (Math.abs(last[0] - dcx) > 0.6) out.push('the dot is not at the newest recorded point');
    }
    const ce = root.querySelector('.tk2-cause'), cause = ce.innerText.replace(/\s+/g, ' ');
    if (!ce.classList.contains('is-take') && st.tab === 'drive') {
      const mv = /v ([+−-]?[\d.]+) m\/s/.exec(cause), ma = /a ([+−-]?[\d.]+) m\/s²/.exec(cause);
      const nv = mv ? +mv[1].replace('−', '-').replace('+', '') : null, na = ma ? +ma[1].replace('−', '-').replace('+', '') : null;
      if (nv == null || na == null) out.push('cause line without numbers');
      else { if (inR('v', dv) && Math.abs(nv - dv) > 0.05 + tol('v')) out.push(`cause v ${nv} vs drawn ${dv.toFixed(2)}`); if (inR('a', da) && Math.abs(na - da) > 0.05 + tol('a')) out.push(`cause a ${na} vs drawn ${da.toFixed(2)}`); }
    }
    if (st.tab === 'set' && !st.play && !st.back && (Math.abs(va - st.set.v0) > 1e-6 || Math.abs(aa - st.set.segs[0].a) > 1e-6)) out.push('Set: arrows not v₀ and a while stopped');
  }
  // "turns" words only over a drawn crossing (cheap check: none before 0.1 s of trace)
  return { out, k: [st.tab, cx.toFixed(3), va.toFixed(3), L.curT().toFixed(2)].join(':') };
};
async function sample(page, label, ms) {
  if (!(await page.evaluate(() => !!window.__fp))) await page.addScriptTag({ content: 'window.__fp = ' + frameProbe.toString() + ';' });
  const res = await page.evaluate(async ([ms]) => {
    const f = window.__fp, out = [], seen = new Set(); let n = 0; const t0 = performance.now();
    await new Promise(done => { function tick() { const r = f(); n++; seen.add(r.k); r.out.forEach(m => out.push(m)); if (performance.now() - t0 < ms) requestAnimationFrame(tick); else done(); } requestAnimationFrame(tick); });
    return { out: [...new Set(out)], n, distinct: seen.size };
  }, [ms]);
  states += res.n; checks += res.n * 7;
  res.out.forEach(m => fails.push(`frames ${label}: ${m}`));
  return res;
}
async function runFrames(w, h) {
  const { page, errs, ctx } = await open({ w, h });
  const sampleWhile = async (label, act, ms) => { const p = sample(page, label, ms); await page.waitForTimeout(30); await act(); const r = await p; console.log(`  ${label}: frames ${r.n}, distinct ${r.distinct}`); return r; };
  const ppm = await page.evaluate(() => document.querySelector('.mg2').__mg.lab.geo().ppm);
  const kb = async () => { const b = await page.locator('.mg2 .tk2-handle .tk2-knob').first().boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
  let [x, y] = await kb();
  await sampleWhile('live drive: fast drag and reversal', async () => {
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x + ppm * 3, y, { steps: 3 }); await page.waitForTimeout(400);
    for (let i = 0; i < 20; i++) { await page.mouse.move(x + ppm * 3 - ppm * 4 * i / 20, y); await page.waitForTimeout(25); }
    await page.mouse.move(x + ppm * 2, y, { steps: 2 }); await page.waitForTimeout(300); await page.mouse.up();
  }, 2600);
  await sampleWhile('recording on after letting go', async () => {}, 1500);
  await sampleWhile('keys mid recording', async () => { await page.focus('.mg2 .tk2-handle .tk2-knob'); await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(700); await page.keyboard.up('ArrowLeft'); await page.keyboard.down('ArrowRight'); await page.waitForTimeout(500); await page.keyboard.up('ArrowRight'); }, 1600);
  await idle(page);
  await sampleWhile('replay', async () => { await page.click('.mg2-run'); }, 2000);
  await sampleWhile('scrub during replay', async () => { const b = await page.locator('.mg2-pbg').first().boundingBox(); await page.mouse.move(b.x + b.width * 0.7, b.y + b.height / 2); await page.mouse.down(); await page.mouse.move(b.x + b.width * 0.2, b.y + b.height / 2, { steps: 8 }); await page.mouse.up(); }, 1200);
  await page.click('.mg2-again'); await page.waitForTimeout(300);
  await sampleWhile('example fades into a new run', async () => { [x, y] = await kb(); await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + ppm, y, { steps: 5 }); await page.mouse.up(); }, 900);
  // Set: a drag of each tip, the run, its return; a reversal mid run (the run stops, the cart fades back)
  await page.click('.mg2-again');
  await page.click('.tk2-tab[data-v=set]'); await page.waitForTimeout(400);
  const tip = async re => { const ls = await page.evaluate(() => [...document.querySelectorAll('.mg2 .tk2-handle .tk2-knob')].map(e => e.getAttribute('aria-label'))); const b = await page.locator('.mg2 .tk2-handle .tk2-knob').nth(ls.findIndex(l => re.test(l))).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
  await sampleWhile('Set: drag v tip and a tip, run', async () => {
    let [vx, vy] = await tip(/velocity/); await page.mouse.move(vx, vy); await page.mouse.down(); await page.mouse.move(vx + ppm * 1.5, vy, { steps: 6 }); await page.mouse.move(vx - ppm * 0.5, vy, { steps: 6 }); await page.mouse.up();
    await page.waitForTimeout(100);
  }, 4000);
  await idle(page);
  await sampleWhile('Set: keys on a, run, stop mid run', async () => { await page.focus('.mg2 .tk2-handle:not(.is-quiet) .tk2-knob >> nth=0'); await page.keyboard.press('End'); await page.waitForTimeout(1200); await page.click('.mg2-run'); }, 1800);
  await sampleWhile('Set: run, a changed mid run, to the end and back', async () => { await page.click('.mg2-run'); await page.waitForTimeout(2500); const k = await tip(/Acceleration/); await page.mouse.move(k[0], k[1]); await page.mouse.down(); await page.mouse.move(k[0] + ppm * 0.6, k[1], { steps: 8 }); await page.mouse.up(); }, 11000);
  // leaving mid run: Test yourself stops everything; Explore comes back clean
  await page.click('.mg2-run'); await page.waitForTimeout(700);
  await page.click('.ls-root button:has-text("Test yourself")'); await page.waitForTimeout(300);
  const stopped = await page.evaluate(async () => { const L = document.querySelector('.mg2').__mg.lab, a = L.curT(); await new Promise(r => setTimeout(r, 400)); return { moved: L.curT() !== a, play: !!L.st.play, back: !!L.st.back }; });
  checks++; if (stopped.moved || stopped.play || stopped.back) fails.push('frames: the run kept going after leaving for Test yourself ' + JSON.stringify(stopped));
  await page.click('.ls-root button:has-text("Explore")'); await page.waitForTimeout(500);
  await sample(page, 'back to Explore', 500);
  // Drive: leaving mid recording
  await page.click('.tk2-tab[data-v=drive]'); await page.waitForTimeout(300); [x, y] = await kb();
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + ppm, y, { steps: 4 }); await page.mouse.up();
  await page.click('.ls-root button:has-text("Test yourself")'); await page.waitForTimeout(300);
  const st2 = await page.evaluate(async () => { const L = document.querySelector('.mg2').__mg.lab; const c = L.st.drv.clock; await new Promise(r => setTimeout(r, 300)); return { rec: L.st.drv.rec, ticked: L.st.drv.clock !== c }; });
  checks++; if (st2.rec || st2.ticked) fails.push('frames: the recording kept going after leaving for Test yourself');
  await page.click('.ls-root button:has-text("Explore")'); await page.waitForTimeout(400);
  // Match: drive, Check, show the answer
  await page.click('.ls-root button:has-text("Test yourself")'); await page.waitForTimeout(500);
  await pickMatch(page);
  const mk = await page.locator('.ls-drill-stage .tk2-handle .tk2-knob').first().boundingBox();
  checks++;
  if (!mk) fails.push('Match: no cart knob');
  else {
    await page.mouse.move(mk.x + mk.width / 2, mk.y + mk.height / 2); await page.mouse.down(); await page.mouse.move(mk.x + ppm, mk.y + mk.height / 2, { steps: 10 }); await page.mouse.up();
    await page.waitForTimeout(400);
    await page.click('.ls-drill button:has-text("Check")'); await page.waitForTimeout(200);
    const early = await page.evaluate(() => (document.querySelector('.ls-drill .cd-fb') || {}).textContent || '');
    checks++; if (!/Keep driving|whole 10 s/.test(early)) fails.push('Match: Check mid run did not ask to keep driving: ' + early);
    await page.waitForTimeout(10200);
    await page.click('.ls-drill button:has-text("Check")'); await page.waitForTimeout(300);
    const fb = await page.evaluate(() => (document.querySelector('.ls-drill .cd-fb') || {}).textContent || '');
    checks++; if (!/Match \d+%/.test(fb)) fails.push('Match: no score after a run: ' + fb);
    console.log('  Match feedback: ' + fb.slice(0, 120));
  }
  // reduced motion: a Set run shows its end at once
  const rm = await open({ w, h, reduced: true });
  await tab(rm.page, 'set'); await rm.page.click('.mg2-run'); await rm.page.waitForTimeout(300);
  const rr = await rm.page.evaluate(() => { const L = document.querySelector('.mg2').__mg.lab; return { t: L.curT(), end: L.series().end }; });
  checks++; if (Math.abs(rr.t - rr.end) > 0.01) fails.push('reduced motion: the run is not at its end at once ' + JSON.stringify(rr));
  if (rm.errs.length) fails.push('reduced motion console: ' + rm.errs.join('|'));
  await rm.ctx.close();
  // real touch: a drag on the cart from the scrolled end of the page
  const tc = await open({ w, h, touch: true });
  await tc.page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await tc.page.waitForTimeout(200);
  const tb = await tc.page.locator('.mg2 .tk2-handle .tk2-knob').first().boundingBox();
  const cdp = await tc.ctx.newCDPSession(tc.page), px0 = tb.x + tb.width / 2, py0 = tb.y + tb.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: px0, y: py0 }] });
  for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: px0 + ppm * 0.2 * i, y: py0 }] }); await tc.page.waitForTimeout(30); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const tr = await tc.page.evaluate(() => { const s = document.querySelector('.mg2').__mg.st; return { rec: s.drv.rec, x: s.drv.x, x0: s.drv.raw.x[0] }; });
  checks++; if (!tr.rec || !(tr.x - tr.x0 > 0.8)) fails.push('touch: a touch drag did not drive the cart ' + JSON.stringify(tr));
  await tc.ctx.close();
  checks++; if (errs.length) fails.push(`frames ${w}: console ${errs.join('|')}`);
  await ctx.close();
}

/* ---------------------------------------------------------------- perf at CPU x4 */
async function frameTimes(page, run) {
  await page.evaluate(() => { window.__ft = []; let last = performance.now(); window.__ftOn = true; (function tick(t) { if (!window.__ftOn) return; window.__ft.push(t - last); last = t; requestAnimationFrame(tick); })(performance.now()); });
  await run();
  return page.evaluate(() => { window.__ftOn = false; const a = window.__ft.slice(2).sort((x, y) => x - y); return { n: a.length, med: a[Math.floor(a.length / 2)], p95: a[Math.floor(a.length * 0.95)] }; });
}
async function runPerf(w, h) {
  const res = {};
  { const { page, ctx } = await open({ w, h }); const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const ppm = await page.evaluate(() => document.querySelector('.mg2').__mg.lab.geo().ppm);
    res.tool = await frameTimes(page, async () => { const k = await page.locator('.mg2 .tk2-handle .tk2-knob').first().boundingBox(), x = k.x + k.width / 2, y = k.y + k.height / 2;
      await page.mouse.move(x, y); await page.mouse.down();
      for (let i = 0; i <= 60; i++) await page.mouse.move(x + ppm * 3 * Math.abs(Math.sin(i / 9)), y);
      await page.mouse.up(); await page.waitForTimeout(1400); });
    await ctx.close(); }
  { const { page, ctx } = await open({ w, h, path: '/environmental-science/tools/water-pollution.html' }); await page.waitForSelector('.tk2-drag .tk2-knob', { timeout: 15000 }); await page.waitForTimeout(500);
    const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    res.flagship = await frameTimes(page, async () => { const k = await page.locator('.tk2-drag .tk2-knob').first().boundingBox(); await page.mouse.move(k.x + 22, k.y + 22); await page.mouse.down();
      for (let i = 0; i <= 60; i++) await page.mouse.move(k.x + 22 + 140 * Math.abs(Math.sin(i / 9)), k.y + 22);
      await page.mouse.up(); await page.waitForTimeout(1400); });
    await ctx.close(); }
  console.log(`  perf ${w}: motion graphs median ${res.tool.med.toFixed(1)} ms, p95 ${res.tool.p95.toFixed(1)} ms (${res.tool.n} frames); flagship median ${res.flagship.med.toFixed(1)} ms, p95 ${res.flagship.p95.toFixed(1)} ms (${res.flagship.n} frames)`);
  checks += 2; if (res.tool.med > 20) fails.push(`perf ${w}: median ${res.tool.med.toFixed(1)} ms`); if (res.tool.p95 > 50) fails.push(`perf ${w}: p95 ${res.tool.p95.toFixed(1)} ms`);
}

for (const w of WIDTHS) {
  const h = { 360: 740, 390: 844, 430: 932, 600: 960, 768: 1024, 820: 1180, 1024: 768, 1280: 800, 1440: 900, 1920: 1080 }[w] || (w < 600 ? 844 : 900);
  if (PERF) await runPerf(w, h);
  else if (FRAMES) await runFrames(w, h);
  else await runSweep(w, h);
}
await browser.close();
const uniq = [...new Set(fails)];
console.log(`${PERF ? 'perf' : FRAMES ? 'frames' : 'sweep'} ${WIDTHS.join(',')} ${DARK ? 'dark' : 'light'}: states ${states}, checks ${checks}, failures ${uniq.length}`);
console.log(uniq.slice(0, 60).join('\n'));
server.close();
process.exit(uniq.length ? 1 : 0);
