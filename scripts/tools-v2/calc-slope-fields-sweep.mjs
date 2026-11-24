/* Tools v2 layout sweep for AP® Calculus AB Slope fields (docs/tools-v2-calc-slope-fields-brief.md), after the pattern
   of calc-limit-explorer-sweep.mjs. Every equation at its landmark states (the start, the leaf in each corner, on an
   equilibrium, where the slope turns vertical, with the formula's line on, after the leaf has floated, k and the room
   at their ends), plus the first visit. At each width given, in the theme given (dark asserted). At each state:
     - nothing drawn or labeled is clipped by the stage (labels, ticks, knobs, tags, the leaf, the mug, chip, cue);
     - no two labels or tags closer than 4 px; ticks clear of labels and tags; no rendered text under 11 px;
     - the water is the largest thing and at least 40% of the stage;
     - the picture is exact: every streak is at least 14 px long and has the slope f at its center; each calm line
       sits at its equilibrium; the drawn solution passes through the drawn start point, stays in the water, and the
       formula's solution sits on it to under a pixel; the leaf rests on the start inside its ring;
     - the words agree with the picture: the cause line's point is the drawn start point read back from the picture,
       its slope is f there, its "away from / toward / stays" is true of the drawn curve, the formula label is the
       particular solution through that point;
     - on a phone the cause line is at most two rows; no sideways scroll; no console errors;
     - on a first visit one cue is shown, whole, covering no label, number or tag.
   --fit: at 390x844, 1024x768, 1280x800, 375x667 and 360x740 the leaf's knob, the picture and the cause line are in
   view at once with no inner scroll (any width list is ignored).
   --frames: frame by frame while the leaf floats (each equation), a new equation cross fades, the formula's line draws
   in and a drag ends: the leaf is on the drawn curve, turned along it; the mug reads the drawn leaf; the takeaway only
   once the leaf has arrived; leaving for Test yourself mid float stops it.

     node scripts/tools-v2/calc-slope-fields-sweep.mjs [width] [--dark] [--shots dir] [--fit] [--frames]

   One width per process. Needs Playwright and a Chromium. Premium is unlocked only in the browser (premium.js's has()
   is answered true by a route), never in a file. */
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
const PREMIUM = readFileSync(join(ROOT, 'assets/premium.js'), 'utf8').replace('function has(course) {', 'function has(course) { return true;');
const args = process.argv.slice(2), si = args.indexOf('--shots'), SHOTS = si >= 0 ? args[si + 1] : null;
const DARK = args.includes('--dark'), FIT = args.includes('--fit'), FRAMES = args.includes('--frames'), THEME = DARK ? 'dark' : 'light';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const WIDTHS = (args[0] && !args[0].startsWith('--') ? args[0] : '360,390,430,600,768,820,1024,1280,1440,1920').split(',').map(Number);
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
const KEYS = ['tk2c:apcalc-slope-fields', 'tk2h:apcalc-slope-fields'];
async function open(o) {
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, serviceWorkers: 'block', deviceScaleFactor: 1, reducedMotion: o.motion ? 'no-preference' : 'reduce' });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|ERR_BLOCKED/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.route('**/assets/premium.js', r => r.fulfill({ body: PREMIUM, contentType: 'application/javascript' }));
  await page.addInitScript(t => { window.LevlToolTest = true; try { localStorage.setItem('nremt_theme', t); } catch (e) {} }, THEME);
  if (!o.cue) await page.addInitScript(k => { try { k.forEach(x => localStorage.setItem(x, '1')); } catch (e) {} }, KEYS);
  await page.goto(BASE + '/calculus/tools/slope-fields.html', { waitUntil: 'load' });
  await page.waitForSelector('.sf2-svg .sf2-field');
  await page.waitForTimeout(400);
  const dark = await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark');
  if (DARK && !dark) throw new Error('the page is not dark');
  if (!DARK && dark) throw new Error('the page is dark');
  return { page, errs, ctx };
}
const shot = (page, name) => SHOTS ? page.locator('.sf2').screenshot({ path: join(SHOTS, name) }) : null;

/* Runs in the page: the checks of one state. */
const probe = () => {
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]') && R(e).w > 0;
  const q = s => [...document.querySelectorAll(s)].filter(vis), out = [];
  const T = window.ApCalcSlopeFields, st = T.st, G = T.G(), A = G.A, M = window.ApCalcMath.slopeFields;
  const scEl = document.querySelector('.sf2-scene'), sc = R(scEl), k = sc.w / G.W;
  const inS = (x, name, tol = 0.6) => { if (x.l < sc.l - tol || x.r > sc.r + tol || x.t < sc.t - tol || x.b > sc.b + tol) out.push('clipped: ' + name); };
  const hit = (a, c, g = 0.6) => !(a.r - g <= c.l || c.r - g <= a.l || a.b - g <= c.t || c.b - g <= a.t);
  const labs = q('.sf2-labs text').map(e => ({ n: 'label "' + e.textContent + '"', r: R(e), e }));
  const ticks = q('.sf2-static .sf2-ticks text').map(e => ({ n: 'tick "' + e.textContent + '"', r: R(e), e }));
  const tags = q('.sf2 .tk2-tag').map(e => ({ n: 'tag "' + e.textContent + '"', r: R(e), e, tag: true }));
  const knobs = q('.sf2 .tk2-dot').map(e => ({ n: 'knob', r: R(e) }));
  const leaf = q('.sf2-leafg > .sf2-leaf:not(.sf2-leaf2)').map(e => ({ n: 'the leaf', r: R(e) }));
  const mug = q('.sf2-mug').map(e => ({ n: 'the mug', r: R(e) }));
  const chips = q('.sf2 .tk2-chip').map(e => ({ n: 'chip', r: R(e) }));
  [...labs, ...ticks, ...tags, ...knobs, ...leaf, ...mug, ...chips].forEach(x => inS(x.r, x.n));
  [...labs, ...ticks, ...tags].forEach(x => { const fs = parseFloat(getComputedStyle(x.e).fontSize) * (x.tag ? 1 : k); if (fs < 10.95) out.push(x.n + ' renders at ' + fs.toFixed(1) + ' px'); });
  const words = [...labs, ...tags];
  for (let i = 0; i < words.length; i++) for (let j = i + 1; j < words.length; j++) if (hit(words[i].r, words[j].r, -4)) out.push('closer than 4 px: ' + words[i].n + ' and ' + words[j].n);
  words.forEach(a => ticks.forEach(c => { if (hit(a.r, c.r)) out.push('overlap: ' + a.n + ' and ' + c.n); }));
  [...words, ...ticks].forEach(a => mug.forEach(c => { if (!/°C/.test(a.n) && hit(a.r, c.r)) out.push('the mug covers ' + a.n); }));
  chips.forEach(c => [...labs, ...tags, ...ticks].forEach(a => { if (hit(a.r, c.r)) out.push('the chip covers ' + a.n); }));
  // labels clear of the knobs (the leaf's ring and the quiet ones)
  const kn = q('.sf2 .tk2-knob').map(R);
  labs.forEach(a => kn.forEach(c => { if (hit(a.r, c, 1)) out.push(a.n + ' under a knob'); }));
  // the water is the largest thing
  const share = A.W * A.H / (G.W * G.H);
  if (share < 0.4) out.push('the water is ' + (share * 100).toFixed(0) + '% of the stage');
  // the streaks: length and slope at their centers
  const f = (x, y) => { const p = st.id === 'ky' || st.id === 'cool' ? T.params[st.id] : null; return M.fns(M.de(st.id), p).f(x, y); };
  const fd = document.querySelector('.sf2-field').getAttribute('d'), segs = [...fd.matchAll(/M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)/g)].map(m => m.slice(1).map(Number));
  if (segs.length < 30) out.push('only ' + segs.length + ' streaks');
  let badS = 0;
  segs.forEach(s => {
    const L = Math.hypot(s[2] - s[0], s[3] - s[1]) * k; if (L < 13.9) badS++;
    const cx = (s[0] + s[2]) / 2, cy = (s[1] + s[3]) / 2, x = A.ix(cx), y = A.iy(cy), m = f(x, y);
    const dm = -(s[3] - s[1]) / (s[2] - s[0] || 1e-9) / G.ky * G.kx;
    if (isFinite(m) && Math.abs(Math.atan(dm) - Math.atan(m)) > 0.02 && Math.abs(s[2] - s[0]) > 0.05) badS++;
    if (!isFinite(m) && Math.abs(s[2] - s[0]) > 0.11) badS++;
  });
  if (badS) out.push(badS + ' streaks too short or at the wrong slope');
  // calm lines at the equilibria
  const eqs = [...document.querySelectorAll('.sf2-eqline')].map(e => +e.getAttribute('d').split(' ')[1].replace(/H.*/, ''));
  const want = (M.de(st.id).eq(T.params[st.id] || {}) || []).filter(v => v >= G.view.y[0] - 1e-9 && v <= G.view.y[1] + 1e-9);
  const kz = st.id === 'ky' && Math.abs(T.params.ky.k) < 1e-12;
  if (!kz) { if (eqs.length !== want.length) out.push('calm lines ' + eqs.length + ', equilibria ' + want.length); eqs.forEach((Y, i) => { if (Math.abs(Y - A.sy(want[i])) > 0.6) out.push('calm line off its equilibrium'); }); }
  // the drawn solution: through the drawn start, in the water, and the formula on it
  const sd = document.querySelector('.sf2-sol').getAttribute('d');
  const pts = [...sd.matchAll(/([-\d.]+) ([-\d.]+)/g)].map(m => [+m[1], +m[2]]);
  const dot = document.querySelector('.sf2-start'), sx0 = +dot.getAttribute('cx'), sy0 = +dot.getAttribute('cy');
  const xS = A.ix(sx0), yS = A.iy(sy0);
  if (Math.abs(xS - st.x0) > 1e-6 * 0 + (G.view.x[1] - G.view.x[0]) / A.W * 0.6 || Math.abs(yS - st.y0) > (G.view.y[1] - G.view.y[0]) / A.H * 0.6) out.push('the start dot is not at the start point');
  if (!pts.some(p => Math.hypot(p[0] - sx0, p[1] - sy0) < 0.8)) out.push('the solution does not pass through the start dot');
  if (pts.some(p => p[1] < A.T - 0.6 || p[1] > A.B + 0.6 || p[0] < A.L - 0.6 || p[0] > A.R + 0.6)) out.push('the solution leaves the water');
  const ex = T.exactFn();
  if (ex) { let worst = 0; pts.forEach(p => { const x = A.ix(p[0]); if (x < ex.lo || x > ex.hi) return; const Y = A.sy(ex.fn(x)), m = f(x, A.iy(p[1])), sl = isFinite(m) ? m * G.ky / G.kx : 1e9; if (Y > A.T + 1 && Y < A.B - 1) worst = Math.max(worst, Math.abs(Y - p[1]) / Math.sqrt(1 + sl * sl)); }); if (worst > 0.75) out.push('the traced curve is ' + worst.toFixed(2) + ' px from the formula'); }
  // the leaf rests on the start, inside the ring
  const lf = document.querySelector('.sf2-leafg > .sf2-leaf:not(.sf2-leaf2)'), tr = (lf.getAttribute('transform') || '').match(/translate\(([-\d.]+) ([-\d.]+)\)/);
  if (!st.ride && (!tr || Math.hypot(+tr[1] - sx0, +tr[2] - sy0) > 0.8)) out.push('the leaf is not on the start');
  const ring = R(document.querySelector('.sf2-h .tk2-knob'));
  if (Math.hypot(sc.l + sx0 * k - (ring.l + ring.w / 2), sc.t + sy0 * k - (ring.t + ring.h / 2)) > 1.5) out.push('the ring is off the start');
  // the words agree with the picture
  const causeEl = document.querySelector('.sf2 .tk2-cause'), take = causeEl.classList.contains('is-take'), txt = causeEl.innerText.replace(/\n/g, ' ');
  const num = s => +String(s).replace(/−/g, '-');
  const fmt = v => String(+(+v).toFixed(2)).replace('-', '−');
  if (!take) {
    const pills = [...causeEl.querySelectorAll('.tk2-cz')].map(e => e.textContent);
    const pm = pills[0].match(/\(([^,]+), ([^)]+)\)/);
    if (!pm || Math.abs(num(pm[1]) - xS) > 0.051 * (st.id === 'cool' ? 10 : 1) || Math.abs(num(pm[2]) - yS) > 0.051 * (st.id === 'cool' ? 10 : 1)) out.push('the cause point ' + pills[0] + ' is not the drawn start');
    const m = f(st.x0, st.y0), sm = pills[1].match(/([=≈]) ([−\d.]+)$/);
    if (!sm || Math.abs(num(sm[2]) - m) > 0.0051) out.push('the cause slope ' + pills[1] + ' is not f at the start (' + m + ')');
    const last = pills[pills.length - 1], end = pts[pts.length - 1], first = pts[0];
    if (/away from 2/.test(last) && !(Math.abs(A.iy(end[1]) - 2) >= Math.abs(st.y0 - 2) - 0.01)) out.push('"away from 2" but the drawn curve does not move away');
    if (/toward/.test(last) && !(Math.abs(A.iy(end[1]) - T.params.cool.Ta) <= Math.abs(st.y0 - T.params.cool.Ta) + 0.01)) out.push('"toward" but the drawn curve does not move toward the room');
    if (/stays at/.test(last) && Math.abs(end[1] - first[1]) > 0.8) out.push('"stays" but the drawn curve is not flat');
    if (/domain ends/.test(last) && !document.querySelector('.sf2-end')) out.push('"domain ends" with no open end drawn');
    if (document.querySelectorAll('.sf2-end').length > [...document.querySelectorAll('.sf2-labs .sf2-cbad')].length) out.push('an open end without its "domain ends" label');
    if (/^(at )?\(/.test(pills[0]) === false) out.push('first pill is not the point');
  } else {
    const fm = T.formula();
    if (fm && !txt.includes(fm)) out.push('the takeaway does not give the formula ' + fm);
  }
  if (st.exact) { const fm = T.formula(), lab = labs.find(a => a.e.classList.contains('sf2-cex')); if (fm && !lab) out.push('no label on the formula line'); if (lab && lab.e.textContent !== fm) out.push('formula label ' + lab.e.textContent + ' is not ' + fm); if (!document.querySelector('.sf2-exact')) out.push('no formula line'); }
  if (st.id === 'cool') { const ml = labs.find(a => a.e.classList.contains('sf2-cmug')); if (!ml) out.push('no mug label'); else if (ml.e.textContent !== String(Math.round(A.iy(sy0))) + ' °C' && ml.e.textContent !== (+A.iy(sy0).toFixed(0)) + ' °C') out.push('the mug reads ' + ml.e.textContent + ', the leaf is at ' + A.iy(sy0).toFixed(1)); }
  const rows = new Set(q('.sf2 .tk2-cz').map(e => Math.round(R(e).t))).size;
  if (innerWidth <= 640 && rows > 2) out.push('cause line is ' + rows + ' rows: ' + txt);
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  if (!document.querySelector('.sf2-ref') || document.querySelector('.sf2-ref').textContent.length < 400) out.push('"?" is empty');
  void fmt;
  return { out, share };
};
async function act(page, a) {
  await page.evaluate(a => { const T = window.ApCalcSlopeFields;
    if (a[0] === 'eq') T.setEq(a[1]); if (a[0] === 'at') T.set(a[1], a[2]); if (a[0] === 'check') T.check(); if (a[0] === 'k') T.setK(a[1]); if (a[0] === 'ta') T.setTa(a[1]);
    if (a[0] === 'float') T.float();
    if (a[0] === 'corner') { const v = T.G().view; T.set(a[1] < 0 ? v.x[0] : v.x[1], a[2] < 0 ? v.y[0] : v.y[1]); } }, a);
  await page.waitForTimeout(140);
}
const STATES = [];
const EQ = ['y-2', 'xy', 'x/y', 'x+y', 'ky', 'cool'];
for (const e of EQ) {
  STATES.push([e + '-start', [['eq', e]]], [e + '-tl', [['eq', e], ['corner', -1, 1]]], [e + '-br', [['eq', e], ['corner', 1, -1]]], [e + '-tr', [['eq', e], ['corner', 1, 1]]], [e + '-bl', [['eq', e], ['corner', -1, -1]]],
    [e + '-check', [['eq', e], ['check']]], [e + '-floated', [['eq', e], ['float']]], [e + '-checkfloat', [['eq', e], ['check'], ['at', 0.5, e === 'cool' ? 60 : e === 'ky' ? 4 : 1.2], ['float']]]);
}
STATES.push(['y-2-oneq', [['eq', 'y-2'], ['at', 0, 2]]], ['y-2-below', [['eq', 'y-2'], ['at', 1, 1]]], ['xy-oneq', [['eq', 'xy'], ['at', -1, 0]]], ['xy-neg', [['eq', 'xy'], ['at', 1, -0.5]]],
  ['x/y-vert', [['eq', 'x/y'], ['at', 2, 1]]], ['x/y-vert2', [['eq', 'x/y'], ['at', -1.5, -0.5], ['check']]], ['x/y-axis', [['eq', 'x/y'], ['at', 1, 0]]], ['x/y-line', [['eq', 'x/y'], ['at', 1, 1], ['check']]],
  ['ky-kmax', [['eq', 'ky'], ['k', 0.5]]], ['ky-kneg', [['eq', 'ky'], ['k', -0.3], ['at', 0, 8]]], ['ky-kmin', [['eq', 'ky'], ['k', -0.5], ['at', 0, 9]]], ['ky-k0', [['eq', 'ky'], ['k', 0]]], ['ky-oneq', [['eq', 'ky'], ['at', 2, 0]]],
  ['cool-kmax', [['eq', 'cool'], ['k', 0.2]]], ['cool-kmin', [['eq', 'cool'], ['k', 0.02]]], ['cool-ta40', [['eq', 'cool'], ['ta', 40]]], ['cool-ta0', [['eq', 'cool'], ['ta', 0], ['check']]], ['cool-below', [['eq', 'cool'], ['at', 0, 5]]],
  ['cool-oneq', [['eq', 'cool'], ['at', 10, 20]]]);
let checks = 0, states = 0; const fails = [];
const heightOf = w => w <= 430 ? 844 : w <= 820 ? 1024 : w >= 1920 ? 1080 : 900;
async function reset(page) {
  await page.evaluate(() => { const T = window.ApCalcSlopeFields; T.params.ky.k = 0.3; T.params.cool.k = 0.08; T.params.cool.Ta = 20; if (T.st.exact) T.check(); T.setEq('x+y'); T.setEq('y-2'); });
  await page.waitForTimeout(60);
}
if (FIT) {
  for (const [w, h] of [[390, 844], [1024, 768], [1280, 800], [375, 667], [360, 740]]) {
    const { page, errs, ctx } = await open({ w, h });
    for (const st of [[], [['eq', 'cool']], [['eq', 'ky']]]) {
      for (const a of st) await act(page, a);
      await page.waitForTimeout(200);
      const r = await page.evaluate(() => {
        const R = e => e.getBoundingClientRect(), sc = R(document.querySelector('.sf2-scene')), c = R(document.querySelector('.sf2 .tk2-cause')), out = [];
        const kn = R(document.querySelector('.sf2-h .tk2-knob'));
        if (sc.top < 0 || sc.bottom > innerHeight) out.push('the picture is not wholly in view (' + Math.round(sc.top) + ' to ' + Math.round(sc.bottom) + ' of ' + innerHeight + ')');
        if (c.bottom > innerHeight) out.push('the cause line is below the fold (' + Math.round(c.bottom) + ')');
        if (kn.top < 0 || kn.bottom > innerHeight) out.push('the leaf knob is out of view');
        let e = document.querySelector('.sf2'); while (e && e !== document.body) { const s = getComputedStyle(e); if (/(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 1) out.push('inner scroll in ' + e.className); e = e.parentElement; }
        return out;
      });
      checks += 4; states++;
      r.forEach(x => fails.push(`${w}x${h} ${st.length ? st[0][1] : 'y-2'}: ${x}`));
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `fit-${w}x${h}-${st.length ? st[0][1] : 'y-2'}.png`) });
    }
    errs.forEach(e => fails.push(`${w}x${h}: console: ${e}`));
    await ctx.close();
  }
} else if (FRAMES) {
  for (const w of WIDTHS) {
    const { page, errs, ctx } = await open({ w, h: heightOf(w), motion: true });
    const sample = async (name, start, ms) => {
      await page.evaluate(() => { window.__fr = []; window.__on = true; const loop = () => { const T = window.ApCalcSlopeFields, st = T.st, G = T.G(), A = G.A, c = document.querySelector('.sf2 .tk2-cause');
        const lf = document.querySelector('.sf2-leafg > .sf2-leaf:not(.sf2-leaf2)'), m = (lf.getAttribute('transform') || '').match(/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)/);
        const sol = document.querySelector('.sf2-sol'), d = sol ? sol.getAttribute('d') : '', mug = document.querySelector('.sf2-cmug');
        window.__fr.push({ id: st.id, riding: !!st.ride, leaf: m ? [+m[1], +m[2], +m[3]] : null, op: +lf.getAttribute('opacity'), d, take: c.classList.contains('is-take') ? c.textContent : '',
          pills: [...c.querySelectorAll('.tk2-cz')].map(e => e.textContent), mug: mug ? mug.textContent : null, T: A.T, B: A.B, H: A.H, y0: G.view.y[0], y1: G.view.y[1], x0: st.x0, yS: st.y0,
          start: [+document.querySelector('.sf2-start').getAttribute('cx'), +document.querySelector('.sf2-start').getAttribute('cy')] });
        if (window.__on) requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
      await start(); await page.waitForTimeout(ms);
      const fr = await page.evaluate(() => { window.__on = false; return window.__fr; });
      let bad = 0, moved = new Set(), sawTake = false, arrived = false;
      for (const F of fr) {
        checks++;
        const pts = [...F.d.matchAll(/([-\d.]+) ([-\d.]+)/g)].map(m => [+m[1], +m[2]]);
        if (!F.leaf) { bad++; continue; }
        moved.add(F.leaf[0].toFixed(0) + ',' + F.leaf[1].toFixed(0));
        // the leaf is on the drawn curve, and turned along it
        let best = Infinity, bi = 0;
        for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy; if (L2 < 0.25) continue; const t = Math.max(0, Math.min(1, ((F.leaf[0] - a[0]) * dx + (F.leaf[1] - a[1]) * dy) / L2)), dd = Math.hypot(a[0] + dx * t - F.leaf[0], a[1] + dy * t - F.leaf[1]); if (dd < best) { best = dd; bi = i; } }
        if (F.op > 0.05 && best > 1.2) { bad++; if (bad < 4) fails.push(`${w} ${name}: the leaf is ${best.toFixed(1)} px off the drawn curve`); }
        if (F.riding && pts.length > 2 && F.op > 0.9) { const a = pts[bi], b = pts[bi + 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; let da = Math.abs(ang - F.leaf[2]) % 180; da = Math.min(da, 180 - da); if (da > 12) { bad++; if (bad < 4) fails.push(`${w} ${name}: the leaf is turned ${da.toFixed(0)}° off the curve (leaf ${F.leaf.map(v => v.toFixed(1))}, segment ${bi} of ${pts.length}: ${a} to ${b})`); } }
        // the mug reads the drawn leaf
        if (F.mug != null && F.op > 0.05) { const Tl = F.y1 - (F.leaf[1] - F.T) / F.H * (F.y1 - F.y0); if (F.mug !== Math.round(Tl) + ' °C' && Math.abs(parseFloat(F.mug) - Tl) > 0.6) { bad++; if (bad < 4) fails.push(`${w} ${name}: the mug reads ${F.mug}, the leaf is at ${Tl.toFixed(1)}`); } }
        // the takeaway only once the leaf has arrived (never while it floats)
        if (F.take) { sawTake = true; if (F.riding) { bad++; fails.push(`${w} ${name}: the takeaway while the leaf floats`); } }
        if (!F.riding && F.take) arrived = true;
        // the cause line's point is the drawn start
        if (!F.take && F.pills[0]) { const pm = F.pills[0].match(/\(([^,]+), ([^)]+)\)/); if (!pm || Math.abs(+pm[1].replace('−', '-') - F.x0) > 1e-6 || Math.abs(+pm[2].replace('−', '-') - F.yS) > 1e-6) { bad++; if (bad < 4) fails.push(`${w} ${name}: cause ${F.pills[0]} is not the start`); } }
      }
      if (/float/.test(name)) { checks += 2; if (moved.size < 6) fails.push(`${w} ${name}: no float seen (${moved.size} positions)`); if (!sawTake || !arrived) fails.push(`${w} ${name}: no takeaway after the float`); }
      console.log(`${w} ${THEME} frames ${name}: ${fr.length} frames (${fr.filter(F => F.riding).length} floating), ${bad} bad`);
      if (SHOTS) await shot(page, `${w}-${THEME}-frames-${name.replace(/\//g, 'over')}.png`);
    };
    for (const e of EQ) {
      await page.evaluate(e => window.ApCalcSlopeFields.setEq(e), e); await page.waitForTimeout(2600);
      await sample('float ' + e, () => page.evaluate(() => window.ApCalcSlopeFields.float()), 2400);
    }
    await page.evaluate(() => window.ApCalcSlopeFields.setEq('y-2')); await page.waitForTimeout(2600);
    await sample('new equation float cool', () => page.selectOption('.sf2-sel', 'cool'), 2800);
    await sample('formula draws in', () => page.click('.sf2-check'), 900);
    // a real drag of the leaf, then the float that follows the release
    await sample('drag then float', async () => {
      const b = await page.locator('.sf2-h .tk2-knob').boundingBox(), x = b.x + b.width / 2, y = b.y + b.height / 2;
      await page.mouse.move(x, y); await page.mouse.down();
      for (let i = 1; i <= 12; i++) { await page.mouse.move(x + i * 5, y + i * 6); await page.waitForTimeout(16); }
      await page.mouse.up();
    }, 2600);
    // leave mid float: Test yourself, then back; nothing left running
    await page.evaluate(() => window.ApCalcSlopeFields.float()); await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Test yourself' }).first().click().catch(() => page.getByRole('tab', { name: 'Test yourself' }).first().click());
    await page.waitForTimeout(500);
    const stopped = await page.evaluate(() => !window.ApCalcSlopeFields.riding());
    checks++; if (!stopped) fails.push(`${w}: the float kept running in Test yourself`);
    errs.forEach(e => fails.push(`${w} frames: console: ${e}`));
    await ctx.close();
  }
} else {
  for (const w of WIDTHS) {
    const h = heightOf(w), W4 = String(w).padStart(4, '0');
    { // the first visit
      const c = await open({ w, h, cue: true });
      await c.page.waitForTimeout(300);
      const bad = await c.page.evaluate(() => { const R = e => e.getBoundingClientRect(), cues = [...document.querySelectorAll('.sf2 .tk2-cue')].filter(e => !e.hidden && R(e).width); if (cues.length !== 1) return ['cues shown: ' + cues.length];
        const r = R(cues[0]), S = R(document.querySelector('.sf2-scene')), out = [];
        if (r.left < S.left || r.right > S.right || r.top < S.top || r.bottom > S.bottom) out.push('the cue is clipped by the stage');
        const lf = R(document.querySelector('.sf2-leafg > .sf2-leaf'));
        if (!(lf.right <= r.left || lf.left >= r.right || lf.bottom <= r.top || lf.top >= r.bottom)) out.push('the cue covers the leaf');
        [...document.querySelectorAll('.sf2-labs text, .sf2-static .sf2-ticks text, .sf2 .tk2-tag, .sf2 .tk2-chip')].forEach(e => { const q = R(e); if (q.width && getComputedStyle(e).visibility !== 'hidden' && !(q.right <= r.left || q.left >= r.right || q.bottom <= r.top || q.top >= r.bottom)) out.push('the cue covers "' + e.textContent + '"'); });
        const chip = document.querySelector('.sf2 .tk2-chip'); if (chip && R(chip).width) { const c = R(chip); [...document.querySelectorAll('.sf2-labs text, .sf2-static .sf2-ticks text, .sf2 .tk2-tag')].forEach(e => { const q = R(e); if (q.width && getComputedStyle(e).visibility !== 'hidden' && !(q.right <= c.left || q.left >= c.right || q.bottom <= c.top || q.top >= c.bottom)) out.push('the chip covers "' + e.textContent + '"'); }); }
        return out; });
      checks += 4; states++;
      bad.forEach(x => fails.push(`${w} first visit: ${x}`));
      if (SHOTS) await shot(c.page, `${W4}-${THEME}-0-first-visit.png`);
      await c.ctx.close();
    }
    const { page, errs, ctx } = await open({ w, h });
    for (const [name, acts] of STATES) {
      await reset(page);
      for (const a of acts) await act(page, a);
      await page.waitForTimeout(220);
      let r = await page.evaluate(probe);
      if (r.out.length) { await page.waitForTimeout(700); r = await page.evaluate(probe); }
      states++; checks += 24;
      r.out.forEach(x => fails.push(`${w} ${THEME} ${name}: ${x}`));
      if (SHOTS) await shot(page, `${W4}-${THEME}-${name.replace(/\//g, 'over')}.png`);
    }
    errs.forEach(e => fails.push(`${w}: console: ${e}`));
    await ctx.close();
  }
}
await browser.close(); server.close();
const uniq = [...new Set(fails)];
console.log(`Slope fields sweep${FIT ? ' (fit)' : FRAMES ? ' (frames)' : ''}, ${THEME}: ${states} states, ${checks} checks, ${uniq.length} failures at ${FIT ? '390x844, 1024x768, 1280x800, 375x667, 360x740' : WIDTHS.join(', ')}`);
uniq.slice(0, 80).forEach(x => console.log('  ' + x));
process.exit(uniq.length ? 1 : 0);
