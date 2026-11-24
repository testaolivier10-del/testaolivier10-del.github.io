/* Tools v2 sweep for AP® Chemistry Buffers (docs/tools-v2-chem-buffers-brief.md), after the pattern of
   chem-ice-tables-sweep.mjs. Three runs in one file:

     node scripts/tools-v2/chem-buffers-sweep.mjs [widths] [--shots dir]   layout: every landmark state, light and dark
     node scripts/tools-v2/chem-buffers-sweep.mjs 390 --frames            every animation frame of the drops
     node scripts/tools-v2/chem-buffers-sweep.mjs 390 --perf [--rate 4]   frame times, with the flagship in the same run

   Run one width per process (each width takes a while). Each width is opened at a screen height it really comes with
   (844 up to 430, 960 at 600, 1024 at 768 and 820, 768 at 1024, 800 at 1280, 900 at 1440, 1080 at 1920; --height H
   overrides it).

   LAYOUT, at each state (both buffers, both amounts: the start, a drop or two, one short of capacity, a form used up and
   its takeaway, past capacity both ways, acid and base mixed; the first visit; Test yourself), in light and dark (the
   page is checked to be really dark):
     - nothing on the picture is clipped by the stage (every text, every tap target, the cue);
     - every text on the picture sits at least 4 px clear of every other, and none renders under 11 px;
     - a beaker (the thing acted on) is the largest object: larger than a meter, the counts, a dropper and any label;
     - every atom at rest is inside its beaker's liquid, and no two particles at rest touch;
     - the words agree with what is drawn: each meter reads the pH of its beaker's drawn particles and volume
       (ApChemMath.bufferMeter), its pointer sits at that pH, each count is the number of that particle drawn, the
       buffer meter says "used up" exactly when a form is gone, the liquid stands at the drawn volume, and the cause
       line carries the same pH values, drop count and counts (or the takeaway, only when a form is gone);
     - every tap target acts on the dropper drawn under it (elementFromPoint at its centre is that dropper's button);
     - on a phone the cause line is at most two rows and keeps one height; no sideways scroll; no console errors;
     - the screen fit: with the scene at the top of a phone screen (or as the page opens elsewhere) the droppers, both
       meters and the cause line are on screen with no scrolling inside the card (a phone under 800 px tall: the
       droppers and the buffer beaker);
     - on a first visit the cue is whole and covers no text, number or dropper.
   FRAMES: real taps (a click on a dropper, fast runs of taps past capacity both ways, acid onto left over base,
   alternating taps, the ammonia buffer), sampled on every animation frame: each meter, count and the cause line equal
   what the drawn particles give at that frame; a swap counts exactly when its H is drawn halfway across, a drop's ion
   exactly when its drop has faded halfway; every whole particle is drawn bonded; the drop counts never leave the range
   tapped; nothing is left moving at the end; leaving for Test yourself mid drop stops the stage; reduced motion shows the
   result at once.
   PERF: eight quick NaOH taps then eight HCl taps (CPU throttled, default x4) at the given widths, then the flagship's
   fertilizer knob dragged end to end and back in the same run. Target: median about 16 ms, p95 at or under 50 ms.

   Needs Playwright and a Chromium (CHROME or /opt/pw-browsers/chromium-1243/chrome-linux64/chrome). It serves the repo
   on a free port and blocks service workers and other hosts. The tool is Premium: it is unlocked for the run only, by
   routing assets/premium.js (never committed). Exit code 1 on any failure. */
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
const PAGE = '/chem/tools/buffer-drills.html';
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
  await page.addInitScript(([cue, theme]) => { try { localStorage.setItem('nremt_theme', theme); if (!cue) { localStorage.setItem('tk2c:apchem-buffer-drop', '1'); localStorage.setItem('tk2h:apchem-buffer-drop', '1'); } } catch (e) {} }, [!!o.cue, o.theme || 'light']);
  await page.goto(BASE + PAGE + (o.hash || ''), { waitUntil: 'load' });
  // the checks that read the drawn state go in as a page script (the page's CSP allows inline scripts, not eval)
  await page.addScriptTag({ content: agreeSrc });
  if (!o.hash) { await until(page, () => !!(window.__buf2 && window.__buf2.G())); await page.waitForTimeout(400); }
  else await page.waitForTimeout(1400);
  if (o.theme === 'dark') { const dk = await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark' && getComputedStyle(document.querySelector('.bx2-wall') || document.body).fill !== ''); if (!dk) errs.push('the page is not dark in the dark run'); }
  return { page, errs, ctx };
}
// poll (waitForFunction evaluates a string, which the page's CSP refuses)
async function until(page, fn, ms = 20000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn).catch(() => false)) return; await page.waitForTimeout(50); } throw new Error('timed out waiting'); }
const settle = async page => { await until(page, () => !window.__buf2.busy()); await page.waitForTimeout(150); };

/* Runs in the page: what every number on screen should say, from what is drawn (shared by the layout and frames runs). */
const agreeSrc = `window.__agree = function(){
  const X = window.__buf2, M = window.ApChemMath, F = v => { const s = M.fixed(v, 2); return s.charAt(0) === '-' ? '−' + s.slice(1) : s; };
  const out = [], d = X.drawn(), bf = X.buffer(), vol = X.vol(), mx = X.mixed();
  const ph = [X.pHof(0, d[0]), X.pHof(1, d[1])];
  const meters = [...document.querySelectorAll('.bx2-ph')].map(t => t.textContent);
  ph.forEach((v, i) => { if (meters[i] !== F(v)) out.push('meter ' + i + ' reads ' + meters[i] + ', drawn ' + F(v)); });
  const kt = [...document.querySelectorAll('.bx2-krow')].map(r => r.querySelector('.bx2-kt').textContent.replace(/\\u200b/g, ''));
  const SUBS = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' }, plain = h => h.replace(/<[^>]+>/g, '').replace(/[₀-₉]/g, c => SUBS[c]);
  const want = [plain(bf.HA.html) + ' ' + d[0].h, plain(bf.A.html) + ' ' + d[0].a, d[0].oh ? 'OH⁻ ' + d[0].oh : d[0].h3o ? 'H3O⁺ ' + d[0].h3o : '', 'H3O⁺ ' + d[1].h3o, 'OH⁻ ' + d[1].oh];
  want.forEach((w, i) => { if ((kt[i] || '') !== w) out.push('count ' + i + ' "' + kt[i] + '", drawn "' + w + '"'); });
  const spent = d[0].h === 0 || d[0].a === 0, head = document.querySelector('.bx2-mhead').textContent;
  if (spent !== (head === 'Buffer used up')) out.push('the buffer header says "' + head + '" with ' + d[0].h + ' : ' + d[0].a);
  if (d[0].oh && d[0].h || d[0].h3o && d[0].a || d[1].oh && d[1].h3o) out.push('a strong ion is drawn beside what would take it');
  if (mx[0].acid !== mx[1].acid || mx[0].base !== mx[1].base) { /* the two beakers mix a drop at different moments: fine */ }
  const cz = document.querySelector('.bx2 .tk2-cause'), take = cz.classList.contains('is-take'), ct = cz.innerText.replace(/\\s+/g, ' ');
  if (take) { if (!spent) out.push('the takeaway shows while both forms are there'); }
  else {
    if (!ct.includes(F(ph[1]).replace(/^7\\.00$/, '7.00'))) out.push('cause line water pH: ' + ct + ' vs ' + F(ph[1]));
    if (!ct.includes(F(ph[0]))) out.push('cause line buffer pH: ' + ct + ' vs ' + F(ph[0]));
    const net = mx[0].base - mx[0].acid;
    if (mx[0].acid || mx[0].base) { if (net !== 0 && !ct.includes(Math.abs(net) + ' drop')) out.push('cause line drop count: ' + ct + ' vs net ' + net); }
    else if (!ct.includes(d[0].h + ' ') || !ct.includes('pKa')) out.push('cause line start: ' + ct);
    if (spent && !(d[0].oh || d[0].h3o) && !ct.includes('used')) out.push('cause line misses the used up form: ' + ct);
    if ((d[0].oh || d[0].h3o) && !ct.includes('left over')) out.push('cause line misses the left over ion: ' + ct);
  }
  return { out, vol, d, ph };
};`;
const probe = new Function(`
  const out = [], X = window.__buf2, G = X.G();
  const R = e => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]');
  const scene = document.querySelector('.bx2-scene'), S = R(scene), k = S.w / G.W;
  const inS = (x, n, tol = 0.6) => { if (x.l < S.l - tol || x.r > S.r + tol || x.t < S.t - tol || x.b > S.b + tol) out.push('clipped: ' + n); };
  const gap = (a, c, g) => !(a.r + g <= c.l || c.r + g <= a.l || a.b + g <= c.t || c.b + g <= a.t);
  const texts = [...scene.querySelectorAll('svg text')].filter(vis).filter(t => t.textContent.replace(/\\u200b/g, '').trim()).map(t => ({ n: 'text "' + t.textContent.trim() + '"', r: R(t) }));
  texts.forEach(x => inS(x.r, x.n));
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) if (gap(texts[i].r, texts[j].r, 4)) out.push('closer than 4 px: ' + texts[i].n + ' and ' + texts[j].n);
  [...scene.querySelectorAll('svg text, svg tspan')].filter(vis).filter(t => t.textContent.replace(/\\u200b/g, '').trim()).forEach(t => { const fs = parseFloat(getComputedStyle(t).fontSize) * k; if (fs < 10.95) out.push('text under 11 px: "' + t.textContent + '" ' + fs.toFixed(1)); });
  const taps = [...scene.querySelectorAll('.tk2-tap')];
  taps.forEach((t, i) => { const r = R(t); inS(r, 'tap ' + i); const e = document.elementFromPoint(r.l + r.w / 2, r.t + r.h / 2); if (e !== t && !t.contains(e)) out.push('tap target ' + i + ' is covered by ' + (e && e.className)); });
  for (let i = 0; i < taps.length; i++) for (let j = i + 1; j < taps.length; j++) if (gap(R(taps[i]), R(taps[j]), 0)) out.push('tap targets ' + i + ' and ' + j + ' overlap');
  // the beakers are the largest objects
  const A = x => x.w * x.h, rims = [...scene.querySelectorAll('.bx2-glassrim')].map(R), beaker = Math.min(...rims.map(A));
  rims.forEach((r, i) => inS(r, 'beaker ' + i));
  const others = [...scene.querySelectorAll('.bx2-meter')].map(e => ['meter', R(e)]).concat([...scene.querySelectorAll('.bx2-dropper')].map(e => ['dropper', R(e)]), texts.map(x => [x.n, x.r]));
  others.forEach(([n, r]) => { inS(r, n); if (A(r) >= beaker) out.push(n + ' is as large as a beaker'); });
  // atoms at rest inside their beaker's liquid, and no two particles touching
  const mols = X.mols(), vol = X.vol();
  mols.forEach((list, bi) => { const c = G.cols[bi], lev = G.lev(c, vol[bi]);
    list.forEach(m => { if (m.state !== 'whole') return; m.atoms.forEach(([x, y, r]) => { if (x - r < c.ix0 - 0.5 || x + r > c.ix1 + 0.5 || y + r > c.iy1 + 0.5 || y - r < lev - 0.5) out.push('an atom of ' + m.key + ' is outside the liquid of beaker ' + bi); }); });
    let close = 0;
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) { let worst = Infinity; for (const a of list[i].atoms) for (const b of list[j].atoms) worst = Math.min(worst, Math.hypot(a[0] - b[0], a[1] - b[1]) - a[2] - b[2]); if (worst < 1) close++; }
    if (close) out.push(close + ' pairs of particles touch in beaker ' + bi);
    const vs = X.volShown()[bi]; if (Math.abs(vs - vol[bi]) > 0.05) out.push('the liquid of beaker ' + bi + ' stands at ' + vs.toFixed(1) + ' mL, drawn volume ' + vol[bi]);
  });
  const ag = window.__agree(); ag.out.forEach(m => out.push(m));
  // the pointers at the drawn pH
  const pt = X.ptr(); ag.ph.forEach((v, i) => { if (Math.abs(pt[i].a - X.stripX(i, v)) > 0.5) out.push('pointer ' + i + ' is not at the drawn pH'); });
  const cause = document.querySelector('.bx2 .tk2-cause');
  const rows = new Set([...document.querySelectorAll('.bx2 .tk2-cz')].map(e => Math.round(R(e).t))).size;
  if (innerWidth <= 640 && rows > 2) out.push('cause line is ' + rows + ' rows: ' + cause.innerText);
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  return { out, causeH: Math.round(R(cause).height || R(cause).h) };
`);
/* The screen fit: with the scene at the top of a phone screen, or as the stage opens elsewhere, the droppers, both
   meters and the cause line are on screen, with no scrolling inside the card. */
const fitProbe = () => {
  const out = [], R = e => e.getBoundingClientRect();
  const scene = document.querySelector('.bx2-scene');
  if (innerWidth <= 640) window.scrollTo(0, R(scene).top + scrollY);
  const body = scene.closest('.ls-stage-body') || scene.closest('.ls-stage');
  if (innerWidth > 640 && body && body.scrollHeight - body.clientHeight > 2) out.push(`the card scrolls inside (${body.scrollHeight} in ${body.clientHeight})`);
  const box = innerWidth > 640 && body ? R(body) : { top: 0, bottom: innerHeight };
  const short = innerWidth <= 640 && innerHeight < 800, taps = [...document.querySelectorAll('.bx2 .tk2-tap')], meters = [...document.querySelectorAll('.bx2-meter')];
  const need = short ? { 'HCl dropper': taps[0], 'NaOH dropper': taps[1], 'buffer beaker': document.querySelector('.bx2-glassrim') } : { 'HCl dropper': taps[0], 'NaOH dropper': taps[1], 'buffer meter': meters[0], 'water meter': meters[1], 'cause line': document.querySelector('.bx2 .tk2-cause') };
  Object.keys(need).forEach(k => { const e = need[k]; if (!e) return out.push('no ' + k); const r = R(e); if (r.top < Math.max(0, box.top) - 1 || r.bottom > Math.min(innerHeight, box.bottom) + 1) out.push(`${k} off screen (${Math.round(r.top)} to ${Math.round(r.bottom)} of ${innerHeight})`); });
  window.scrollTo(0, 0);
  return out;
};
let checks = 0, states = 0; const fails = [];
const W4 = w => String(w).padStart(4, '0');
const hi0 = args.indexOf('--height'), HFIX = hi0 >= 0 ? +args[hi0 + 1] : 0;
function HEIGHT(w) { return HFIX || (w <= 430 ? 844 : w <= 600 ? 960 : w <= 820 ? 1024 : w <= 1024 ? 768 : w <= 1280 ? 800 : w <= 1440 ? 900 : 1080); }
// [buffer, amount, acid drops, base drops, label]
const STATES = [['acetic', 5, 0, 0, 'start'], ['acetic', 5, 0, 1, 'base1'], ['acetic', 5, 0, 4, 'base4'], ['acetic', 5, 0, 5, 'spent'], ['acetic', 5, 0, 8, 'past'], ['acetic', 5, 8, 0, 'acidpast'],
  ['acetic', 5, 3, 5, 'mixed'], ['acetic', 10, 0, 13, 'n10past'], ['acetic', 10, 7, 0, 'n10acid'], ['ammonia', 5, 0, 2, 'base2'], ['ammonia', 5, 5, 0, 'spent'], ['ammonia', 10, 13, 0, 'n10acidpast'], ['ammonia', 10, 2, 2, 'cancel']];
async function goState(page, st) {
  await page.evaluate(([b, n]) => { const t = document.querySelector('.tk2-tab[data-v="' + b + '"]'); if (t.getAttribute('aria-selected') !== 'true') t.click(); const a = document.querySelector('.bx2-amt-b[data-n="' + n + '"]'); if (a.getAttribute('aria-pressed') !== 'true') a.click(); }, [st[0], st[1]]);
  await page.waitForTimeout(80);
  await page.evaluate(([a, b]) => window.__buf2.set(a, b), [st[2], st[3]]);
  await settle(page);
}
if (!FRAMES && !PERF) for (const w of WIDTHS) {
  const h = HEIGHT(w);
  for (const theme of ['light', 'dark']) {
    {
      const c = await open({ w, h, cue: true, theme });
      const bad = await c.page.evaluate(() => { const R = e => e.getBoundingClientRect(), q = [...document.querySelectorAll('.tk2-cue')].filter(e => e.getClientRects().length)[0]; if (!q) return ['no cue shown'];
        const r = R(q), S = R(document.querySelector('.bx2-scene')), out = [];
        if (r.left < S.left || r.right > S.right || r.top < S.top || r.bottom > S.bottom) out.push('the cue is clipped by the stage');
        if (parseFloat(getComputedStyle(q).fontSize) < 11) out.push('the cue text is under 11 px');
        [...document.querySelectorAll('.bx2-scene svg text, .bx2-scene .bx2-dropper')].filter(e => e.getClientRects().length && !e.closest('[hidden]')).forEach(e => { const x = R(e); if (!(r.right <= x.left || x.right <= r.left || r.bottom <= x.top || x.bottom <= r.top)) out.push('the cue covers ' + (e.textContent || e.getAttribute('class')).toString().trim().slice(0, 24)); });
        return out; });
      states++; checks += 3; bad.forEach(m => fails.push(`${w} ${theme} first visit: ${m}`));
      if (SHOTS) await c.page.locator('.bx2').screenshot({ path: join(SHOTS, `${W4(w)}-${theme}-0-first-visit.png`) });
      c.errs.forEach(e => fails.push(`${w} ${theme} first visit: console ${e}`));
      await c.ctx.close();
    }
    const c = await open({ w, h, theme });
    const fit = await c.page.evaluate(fitProbe); states++; checks += 6; fit.forEach(m => fails.push(`${w}x${h} ${theme} screen fit: ${m}`));
    const causeH = [], sizes = [];
    for (const st of STATES) {
      await goState(c.page, st);
      const res = await c.page.evaluate(probe);
      states++; checks += 24; res.out.forEach(m => fails.push(`${w} ${theme} ${st.join(' ')}: ${m}`));
      causeH.push(res.causeH);
      sizes.push(await c.page.evaluate(() => { const g = window.__buf2.G(); return [g.bw, g.bh, g.s].join('/'); }));
      if (SHOTS) await c.page.locator('.bx2').screenshot({ path: join(SHOTS, `${W4(w)}-${theme}-${st[0]}-${st[1]}-${st[4]}.png`) });
      if (st[4] === 'past' || st[4] === 'acidpast' || st[4] === 'n10past' || st[4] === 'n10acidpast') {
        // past capacity the chain stays at rest (the left over ion and the water), never the takeaway (review round 1)
        await c.page.waitForTimeout(1400); checks++;
        const tk = await c.page.evaluate(() => document.querySelector('.bx2 .tk2-cause').classList.contains('is-take'));
        if (tk) fails.push(`${w} ${theme} ${st.join(' ')}: the takeaway hides the left over ion past capacity`);
      }
      if (st[4] === 'spent') {
        await c.page.waitForTimeout(1400); const r2 = await c.page.evaluate(probe); checks += 24; r2.out.forEach(m => fails.push(`${w} ${theme} ${st.join(' ')} takeaway: ${m}`));
        const tk = await c.page.evaluate(() => document.querySelector('.bx2 .tk2-cause').classList.contains('is-take')); if (!tk) fails.push(`${w} ${theme} ${st[0]}: no takeaway when a form is used up`);
        if (SHOTS && st[0] === 'acetic') await c.page.locator('.bx2').screenshot({ path: join(SHOTS, `${W4(w)}-${theme}-${st[0]}-${st[1]}-takeaway.png`) });
      }
    }
    if (new Set(sizes).size > 1) fails.push(`${w} ${theme}: the beakers or particles change size between states (${[...new Set(sizes)].join(', ')})`);
    if (w <= 640 && new Set(causeH).size > 1) fails.push(`${w} ${theme}: the cause line changes height on a phone (${[...new Set(causeH)].join(', ')})`);
    // a real tap on the NaOH dropper drops into both beakers
    await goState(c.page, ['acetic', 5, 0, 0]);
    const tb = await c.page.locator('.bx2 .tk2-tap').nth(1).boundingBox();
    await c.page.mouse.click(tb.x + tb.width / 2, tb.y + tb.height / 2); await settle(c.page);
    const after = await c.page.evaluate(() => window.__buf2.drawn());
    states++; checks += 2;
    if (after[0].a !== 6 || after[1].oh !== 1) fails.push(`${w} ${theme}: a tap on NaOH did not drop into both beakers (${JSON.stringify(after)})`);
    // the screen fit again with Start over showing
    const fit2 = await c.page.evaluate(fitProbe); checks += 6; fit2.forEach(m => fails.push(`${w}x${h} ${theme} screen fit after a drop: ${m}`));
    if (SHOTS && theme === 'light') await c.page.screenshot({ path: join(SHOTS, `${W4(w)}-${theme}-8-screen.png`) });
    c.errs.forEach(e => fails.push(`${w} ${theme}: console ${e}`));
    await c.ctx.close();
    const q = await open({ w, h, theme, hash: '#quiz' });
    const qb = await q.page.evaluate(() => { const out = []; if (!document.querySelector('.ls-drill .bt-step, .ls-drill input, .cd-problem')) out.push('no drill in Test yourself'); const st = document.querySelector('.bx2'); if (st && st.getClientRects().length) out.push('the Explore stage shows in Test yourself'); if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll'); return out; });
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
    window.__fr = { on: false, bad: [], n: 0, lo: [0, 0], hi: [0, 0] };
    const X = window.__buf2, M = window.ApChemMath;
    const loop = () => {
      const F = window.__fr; if (!F.on) return;
      F.n++;
      const say = m => { if (F.bad.length < 40) F.bad.push(`frame ${F.n}: ${m}`); };
      const ag = window.__agree(); ag.out.forEach(say);
      // the drop counts never leave the range tapped
      const mx = X.mixed()[0]; if (mx.acid < F.lo[0] || mx.acid > F.hi[0] || mx.base < F.lo[1] || mx.base > F.hi[1]) say('drops mixed ' + JSON.stringify(mx) + ' outside the range tapped');
      // a swap counts when its H is drawn halfway across; an ion that stays counts when its drop has faded halfway
      X.events().forEach((list, bi) => list.forEach(e => {
        if (e.hu != null) { if (e.hu > 0.58 && !e.mixed) say('beaker ' + bi + ': the H is drawn ' + Math.round(e.hu * 100) + '% across but not counted'); if (e.hu < 0.42 && e.mixed) say('beaker ' + bi + ': counted with the H drawn only ' + Math.round(e.hu * 100) + '% across'); }
        else if (e.kind === 'stay' && e.shell < 1) { if (e.shell < 0.42 && !e.mixed) say('beaker ' + bi + ': the drop is ' + Math.round((1 - e.shell) * 100) + '% faded but its ion is not counted'); if (e.shell > 0.58 && e.mixed) say('beaker ' + bi + ': the ion counts while its drop is only ' + Math.round((1 - e.shell) * 100) + '% faded'); }
      }));
      // whole particles are drawn bonded: each atom where the template puts it
      const s = X.G().s;
      X.mols().forEach(list => list.forEach(m => { if (m.state !== 'whole') return; const t = X.tpl(m.drawKey), a = m.atoms;
        for (let i = 1; i < a.length; i++) { const p = t[a[i][3]], q = t[a[0][3]], want = Math.hypot(p.dx - q.dx, p.dy - q.dy) * s, got = Math.hypot(a[i][0] - a[0][0], a[i][1] - a[0][1]); if (Math.abs(want - got) > 0.6) { say(m.key + ' drawn apart'); break; } } }));
      requestAnimationFrame(loop);
    };
    window.__frStart = (lo, hi) => { Object.assign(window.__fr, { lo, hi, on: true }); requestAnimationFrame(loop); };
  });
  const run = async (label, lo, hi, act) => {
    await c.page.evaluate(([a, b]) => window.__frStart(a, b), [lo, hi]);
    await act(); await settle(c.page);
    const r = await c.page.evaluate(() => { window.__fr.on = false; const F = window.__fr, out = { n: F.n, bad: F.bad.slice() }; F.bad = []; F.n = 0; return out; });
    const left = await c.page.evaluate(() => window.__buf2.events().flat().length + window.__buf2.queue().length);
    if (left) r.bad.push('something left moving at the end');
    states++; checks += r.n; r.bad.forEach(m => fails.push(`${w} frames ${label}: ${m}`));
    console.log(`${w} frames ${label}: ${r.n} frames, ${r.bad.length} problems`);
  };
  const tapBox = async i => { const b = await c.page.locator('.bx2 .tk2-tap').nth(i).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
  const clickTap = async (i, gapMs) => { const [x, y] = await tapBox(i); await c.page.mouse.click(x, y); if (gapMs) await c.page.waitForTimeout(gapMs); };
  // 1. one NaOH drop, clicked on the dropper over the water
  await run('one NaOH drop', [0, 0], [0, 1], async () => { await clickTap(3); });
  // 2. fast NaOH taps past capacity (5 mmol: one more than 5 is left over)
  await run('fast NaOH past capacity', [0, 1], [0, 8], async () => { for (let i = 0; i < 7; i++) await clickTap(1, 60); });
  // 3. fast HCl taps onto the left over OH⁻ and back into the buffer
  await run('fast HCl onto left over base', [0, 8], [6, 8], async () => { for (let i = 0; i < 6; i++) await clickTap(0, 60); });
  // 4. alternating taps
  await run('alternating', [6, 8], [10, 12], async () => { for (let i = 0; i < 4; i++) { await clickTap(1, 40); await clickTap(2, 40); } });
  // 5. the ammonia buffer, HCl past capacity
  await c.page.click('.tk2-tab[data-v=ammonia]'); await c.page.waitForTimeout(500);
  await run('ammonia HCl past capacity', [0, 0], [7, 0], async () => { for (let i = 0; i < 7; i++) await clickTap(0, 120); });
  // 5b. another buffer cross fades (review round 1): both canvases fade from the old picture and the still scene fades in
  await c.page.click('.tk2-tab[data-v=acetic]'); await c.page.waitForTimeout(80);
  const sw = await c.page.evaluate(() => ({ f: window.__buf2.fading(), a: getComputedStyle(document.querySelector('.bx2-svg')).animationName, b: window.__buf2.buffer().id }));
  states++; checks += 3;
  if (sw.b !== 'acetic' || sw.f.some(x => !x) || sw.a !== 'bx2-swap') fails.push(`${w}: switching the buffer does not fade (${JSON.stringify(sw)})`);
  await settle(c.page); await c.page.click('.tk2-tab[data-v=ammonia]'); await settle(c.page);
  // 5c. Start over eases the meter pointers back (no jump)
  await c.page.evaluate(() => window.__buf2.set(0, 4)); await settle(c.page);
  const p0 = await c.page.evaluate(() => window.__buf2.ptr()[0].a);
  await c.page.evaluate(() => document.querySelector('.bx2-again').click()); await c.page.waitForTimeout(40);
  const p1 = await c.page.evaluate(() => window.__buf2.ptr()[0]);
  states++; checks++;
  if (!(Math.abs(p1.a - p1.to) > 0.5 && Math.abs(p1.a - p0) > 0.01)) fails.push(`${w}: Start over snaps the meter pointer (${p0.toFixed(1)} to ${p1.a.toFixed(1)}, target ${p1.to.toFixed(1)})`);
  await settle(c.page);
  // 6. at the limit a tap does nothing
  const lim = await c.page.evaluate(() => { window.__buf2.set(8, 0); return window.__buf2.drawn(); });
  await clickTap(0); await c.page.waitForTimeout(400);
  const lim2 = await c.page.evaluate(() => window.__buf2.drawn());
  states++; checks++; if (JSON.stringify(lim) !== JSON.stringify(lim2)) fails.push(`${w}: a tap past the limit changed the beakers`);
  // 7. leaving for Test yourself mid drop: the stage stops and comes back clean
  await c.page.evaluate(() => window.__buf2.set(0, 0));
  await clickTap(1); await clickTap(1); await c.page.waitForTimeout(500);
  await c.page.locator('.ls-modes button', { hasText: 'Test yourself' }).first().click();
  await c.page.waitForTimeout(400);
  const off = await c.page.evaluate(() => ({ busy: window.__buf2.busy(), d: window.__buf2.drawn() }));
  states++; checks += 2;
  if (off.busy) fails.push(`${w} frames: still animating after leaving for Test yourself`);
  if (off.d[0].a !== 7) fails.push(`${w} frames: leaving mid drop lost a drop (${JSON.stringify(off.d)})`);
  await c.page.locator('.ls-modes button', { hasText: 'Explore' }).first().click(); await c.page.waitForTimeout(500);
  const back = await c.page.evaluate(() => window.__agree().out); back.forEach(m => fails.push(`${w} frames back in Explore: ${m}`));
  c.errs.forEach(e => fails.push(`${w} frames: console ${e}`));
  await c.ctx.close();
  // 8. reduced motion: the full result at once (a cross fade), the numbers right
  const rm = await open({ w, h, reduced: true });
  const [x, y] = await (async () => { const b = await rm.page.locator('.bx2 .tk2-tap').nth(1).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; })();
  await rm.page.mouse.click(x, y); await rm.page.waitForTimeout(60);
  const rd = await rm.page.evaluate(() => window.__buf2.drawn());
  const ra = await rm.page.evaluate(() => window.__agree().out);
  states++; checks += 3; ra.forEach(m => fails.push(`${w} reduced motion: ${m}`));
  if (rd[0].a !== 6 || rd[1].oh !== 1) fails.push(`${w} reduced motion: the result is not shown at once (${JSON.stringify(rd)})`);
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
    await c.page.click('.bx2-amt-b[data-n="10"]'); await c.page.waitForTimeout(500);
    const cdp = await c.ctx.newCDPSession(c.page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
    await probeF(c.page, 'Buffers, 8 NaOH taps then 8 HCl taps', w, async () => {
      const t = async i => { const b = await c.page.locator('.bx2 .tk2-tap').nth(i).boundingBox(); await c.page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); };
      for (let i = 0; i < 8; i++) { await t(1); await c.page.waitForTimeout(120); }
      await c.page.waitForTimeout(2500);
      for (let i = 0; i < 8; i++) { await t(0); await c.page.waitForTimeout(120); }
      await c.page.waitForTimeout(2500);
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
console.log(`Buffers sweep: ${states} states, ${checks} checks, 0 failures` + (FRAMES ? ' (frames)' : PERF ? ' (perf)' : ''));
