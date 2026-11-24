/* Tools v2 layout sweep for AP® Calculus AB Limit explorer (docs/tools-v2-calc-limit-explorer-brief.md), after the
   pattern of tangent-tracer-sweep.mjs. Every curve at its landmark states: tab 1 at the start, both cars far, near
   (the magnifier opening), deep (0.001 from a, after Close in), one car near and one far, both at the far ends, and
   filled (a removable point); tab 2 at the start, part way, far out (after Drive out) and both at the nearest; plus the
   first visit. At each width given, in the theme given (dark asserted). At each state it asserts:
     - nothing drawn or labelled is clipped by the stage (labels, ticks, cars, rings, tags, the magnifier, Fill);
     - no two labels, tags or the Fill button overlap, with 4 px between labels, tags and numbers; ticks clear of
       labels; no label or tag on a car, a hole, a jump's end, a nose in the glass; no rendered text under 11 px;
     - the road panel is the largest thing and at least 40% of the stage; the magnifier smaller than it;
     - each car's nose is on the road at its x and inside its ring; the knobs sit on the noses in the glass;
     - the words agree with the picture: each tag's f(x) is f at the drawn nose, the cause line's values are the tags'
       values, "limit" or "no limit" only when both cars are within 0.01 (tab 2: "level off" only beyond 1,000);
     - on a phone the cause line is at most two rows; no sideways scroll; no console errors;
     - on a first visit one cue is shown, whole, covering no label, number or tag.
   --fit: at 390x844, 1024x768 and 1280x800 the cars' knobs, the picture and the cause line are in view at once with
   no inner scroll (any width list is ignored).
   --frames: frame by frame during Close in, Back out, a key jump (Page Down), Fill the hole, Undo and Drive out: the
   tags and the cause line always read the drawn noses; the takeaway only once the picture shows it.

     node scripts/tools-v2/calc-limit-explorer-sweep.mjs [width] [--dark] [--shots dir] [--fit] [--frames]

   One width per process (CI style: a few minutes for all ten). Needs Playwright and a Chromium. */
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
const DARK = args.includes('--dark'), FIT = args.includes('--fit'), FRAMES = args.includes('--frames'), THEME = DARK ? 'dark' : 'light';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const WIDTHS = (args[0] && !args[0].startsWith('--') ? args[0] : '360,390,430,600,768,820,1024,1280,1440,1920').split(',').map(Number);
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
async function open(o) {
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, serviceWorkers: 'block', deviceScaleFactor: 1, reducedMotion: o.motion ? 'no-preference' : 'reduce' });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|ERR_BLOCKED/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.addInitScript(t => { window.LevlToolTest = true; try { localStorage.setItem('nremt_theme', t); } catch (e) {} }, THEME);
  if (!o.cue) await page.addInitScript(() => { try { ['tk2c:apcalc-limit-explorer', 'tk2h:apcalc-limit-explorer-l', 'tk2h:apcalc-limit-explorer-r'].forEach(k => localStorage.setItem(k, '1')); } catch (e) {} });
  await page.goto(BASE + '/calculus/tools/limit-explorer.html', { waitUntil: 'load' });
  await page.waitForSelector('.le2-svg .le2-road');
  await page.waitForTimeout(400);
  const dark = await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark' && getComputedStyle(document.body).backgroundColor);
  if (DARK && !dark) throw new Error('the page is not dark');
  if (!DARK && dark) throw new Error('the page is dark');
  return { page, errs, ctx };
}
const shot = (page, name) => SHOTS ? page.locator('.le2').screenshot({ path: join(SHOTS, name) }) : null;
/* Runs in the page: the checks of one state. */
const probe = () => {
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]') && R(e).w > 0;
  const q = s => [...document.querySelectorAll(s)].filter(vis), out = [];
  const T = window.ApCalcLimitExplorer, S = T.S, G = T.G(), A = G.A;
  const scEl = document.querySelector('.le2-scene'), sc = R(scEl), k = sc.w / G.W;
  const inS = (x, name, tol = 0.6) => { if (x.l < sc.l - tol || x.r > sc.r + tol || x.t < sc.t - tol || x.b > sc.b + tol) out.push('clipped: ' + name); };
  const hit = (a, c, g = 0.6) => !(a.r - g <= c.l || c.r - g <= a.l || a.b - g <= c.t || c.b - g <= a.t);
  const labs = q('.le2-svg > .le2-dyn text.le2-lab').map(e => ({ n: 'label "' + e.textContent + '"', r: R(e), e }));
  const ticks = q('.le2-static .le2-ticks text').map(e => ({ n: 'tick "' + e.textContent + '"', r: R(e), tick: true, e }));
  const tags = q('.le2 .tk2-tag').map(e => ({ n: 'tag "' + e.textContent + '"', r: R(e), e, tag: true }));
  const knobs = q('.le2 .tk2-handle:not([hidden]) .tk2-dot').map(e => ({ n: 'knob', r: R(e) }));
  const cars = q('.le2-svg > .le2-dyn .le2-car').map(e => ({ n: 'a car', r: R(e) }));
  const lens = q('.le2-svg > .le2-dyn .le2-lens-rim').map(e => ({ n: 'the magnifier', r: R(e) }));
  const fill = q('.le2-fill').map(e => ({ n: 'Fill button', r: R(e) }));
  const chips = q('.le2 .tk2-chip').map(e => ({ n: 'chip', r: R(e) }));
  [...labs, ...ticks, ...tags, ...knobs, ...cars, ...lens, ...fill, ...chips].forEach(x => inS(x.r, x.n));
  // text size
  [...labs, ...ticks, ...tags].forEach(x => { const fs = parseFloat(getComputedStyle(x.e).fontSize) * (x.tag ? 1 : k); if (fs < 10.95) out.push(x.n + ' renders at ' + fs.toFixed(1) + ' px'); });
  const words = [...labs, ...tags, ...fill];
  for (let i = 0; i < words.length; i++) for (let j = i + 1; j < words.length; j++) if (hit(words[i].r, words[j].r, -4)) out.push('closer than 4 px: ' + words[i].n + ' and ' + words[j].n);
  [...labs, ...tags, ...fill].forEach(a => ticks.forEach(c => { if (hit(a.r, c.r)) out.push('overlap: ' + a.n + ' and ' + c.n); }));
  chips.forEach(c => [...labs, ...tags, ...ticks, ...fill].forEach(a => { if (hit(a.r, c.r)) out.push('the chip covers ' + a.n); }));
  // nothing on a car, a hole or a jump's end, or a nose dot in the glass
  const marks = q('.le2-svg > .le2-dyn .le2-pt, .le2-svg > .le2-static .le2-pt, .le2-svg > .le2-dyn .le2-ndot').map(e => ({ n: 'a point', r: R(e) }));
  const onCar = r => { for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const x = r.l + 1.5 + (r.w - 3) * i / 3, y = r.t + 1.5 + (r.h - 3) * j / 2;
    if (document.elementsFromPoint(x, y).some(e => e.closest && e.closest('.le2-car'))) return true; } return false; };
  [...labs, ...tags, ...fill].forEach(a => { if (cars.length && onCar(a.r)) out.push(a.n + ' on a car'); marks.forEach(m => { if (hit(a.r, m.r, 1)) out.push(a.n + ' on ' + m.n); }); });
  // the road panel is the largest thing
  const aA = A.W * A.H * k * k, share = aA / (sc.w * sc.h);
  lens.forEach(x => { if (x.r.w * x.r.h >= aA) out.push('the magnifier is bigger than the road'); });
  if (share < 0.4) out.push('the road panel is ' + (share * 100).toFixed(0) + '% of the stage');
  // noses on the road at their x, inside their rings; knobs on the noses in the glass
  const f = S.tab === 'point' ? (x => window.ApCalcMath.limitExplorer.entry(S.P.id).f(x)) : (x => window.ApCalcMath.limitExplorer.entry('inf').f(x));
  const xs = S.tab === 'point' ? [S.P.a - S.dl, S.P.a + S.dr] : [-S.xl, S.xr];
  const noses = [...document.querySelectorAll('.le2-svg > .le2-dyn .le2-nose')];
  const hEls = [...document.querySelectorAll('.le2 .tk2-handle')];
  xs.forEach((x, i) => {
    const n = noses[i]; if (!n) { out.push('no nose ' + i); return; }
    const cx = +n.getAttribute('cx'), cy = +n.getAttribute('cy'), y = f(x), Y = A.sy(y), out_ = Y < A.T || Y > A.B;
    if (Math.abs(cx - A.sx(x)) > 0.6) out.push('nose ' + i + ' is not at its x');
    if (!out_ && Math.abs(cy - Y) > 0.6 && Math.abs(cy - Y) < 1e6) { const c = (S.drawn || {})[i ? 'cr' : 'cl']; if (!c || !c.out) out.push('nose ' + i + ' is off the road by ' + (cy - Y).toFixed(1)); }
    const kn = R(hEls[i].querySelector('.tk2-knob')), kc = [kn.l + kn.w / 2, kn.t + kn.h / 2];
    if (hEls[i].classList.contains('is-ring')) {
      const d = Math.hypot(sc.l + cx * k - kc[0], sc.t + cy * k - kc[1]);
      if (d > kn.w / 2 - 2) out.push('nose ' + i + ' is outside its ring');
    } else {
      const dots = [...document.querySelectorAll('.le2-svg > .le2-dyn .le2-ndot')];
      const dr = dots[i] && R(dots[i]); if (!dr || Math.hypot(dr.l + dr.w / 2 - kc[0], dr.t + dr.h / 2 - kc[1]) > 1.5) out.push('knob ' + i + ' is off its nose in the glass');
    }
  });
  // the words agree with the picture
  const num = s => +String(s).replace(/−/g, '-').replace(/,/g, '');
  const causeEl = document.querySelector('.le2 .tk2-cause'), cause = causeEl.innerText.replace(/\n/g, ' '), take = causeEl.classList.contains('is-take');
  // a tag reads "f(x) = y" (or, on a phone, y alone: then x is the car's own)
  const tagv = tags.map(t => { const own = t.e.closest('.le2-hl') ? xs[0] : xs[1], m = t.e.textContent.match(/^f\((.+)\) = (.+)$/) || [null, String(own), t.e.textContent]; return /^[−\d.,-]+$/.test(m[2]) ? [num(m[1]), num(m[2]), m[2]] : null; });
  tagv.forEach((v, i) => { if (!v) { out.push('tag ' + i + ' unreadable'); return; } const yv = f(v[0]); if (!(Math.abs(yv - v[1]) <= Math.max(1e-5, Math.abs(yv) * 1e-3) + 0.6 * Math.pow(10, -(v[2].split('.')[1] || '').length))) out.push('tag ' + tags[i].n + ' is not f at its x (' + yv + ')'); });
  if (!take) {
    const pills = [...causeEl.querySelectorAll('.tk2-cz')].map(e => e.textContent);
    if (tagv.length === 2 && tagv.every(Boolean)) {
      const lv = pills[0].split(/ |= /).pop(), rv = pills[1].split(/ |= /).pop();
      const ends = (tag, v) => tag.e.textContent === v || tag.e.textContent.endsWith(' ' + v);
      const tl = tags.find(t => t.e.closest('.le2-hl')), tr = tags.find(t => t.e.closest('.le2-hr'));
      if (tl && !ends(tl, lv)) out.push('cause and the purple tag disagree: ' + lv + ' / ' + tl.e.textContent);
      if (tr && !ends(tr, rv)) out.push('cause and the orange tag disagree: ' + rv + ' / ' + tr.e.textContent);
    }
    const said = /limit|both head|level off|disagree|swing|unbounded|without bound/.test(pills.slice(2).join(' '));
    const near = S.tab === 'point' ? S.dl <= 0.01 + 1e-12 && S.dr <= 0.01 + 1e-12 : S.xl >= 999.999 && S.xr >= 999.999;
    if (said !== near) out.push((said ? 'a conclusion while the cars are far: ' : 'no conclusion with both cars close: ') + cause);
  }
  const rows = new Set(q('.le2 .tk2-cz').map(e => Math.round(R(e).t))).size;
  if (innerWidth <= 640 && rows > 2) out.push('cause line is ' + rows + ' rows: ' + cause);
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  return { out, share };
};
async function act(page, a) {
  await page.evaluate(a => { const T = window.ApCalcLimitExplorer;
    if (a[0] === 'set') T.set(a[1], a[2]); if (a[0] === 'curve') T.setCurve(a[1]); if (a[0] === 'close') T.close.start();
    if (a[0] === 'drive') T.drive.start(); if (a[0] === 'fill') T.fill(); if (a[0] === 'max') { T.set(-1, 99); T.set(1, 99); } if (a[0] === 'min') { T.set(-1, 0); T.set(1, 0); } }, a);
  await page.waitForTimeout(120);
}
const POINT = ['hole', 'move', 'jump', 'vasym', 'osc', 'squeeze'];
const STATES = [];
for (const c of POINT) {
  STATES.push([c + '-start', [['curve', c]]], [c + '-near', [['curve', c], ['set', -1, 0.05], ['set', 1, 0.04]]], [c + '-mid', [['curve', c], ['set', -1, 0.3], ['set', 1, 0.2]]],
    [c + '-onenear', [['curve', c], ['set', -1, 0.002], ['set', 1, 0.7]]], [c + '-deep', [['curve', c], ['close']]], [c + '-min', [['curve', c], ['min']]], [c + '-max', [['curve', c], ['max']]], [c + '-close01', [['curve', c], ['set', -1, 0.01], ['set', 1, 0.01]]]);
  if (['hole', 'move', 'squeeze'].includes(c)) STATES.push([c + '-filled', [['curve', c], ['fill']]], [c + '-filleddeep', [['curve', c], ['fill'], ['close']]]);
}
STATES.push(['inf-start', [['curve', 'inf']]], ['inf-mid', [['curve', 'inf'], ['set', -1, 60], ['set', 1, 300]]], ['inf-far', [['curve', 'inf'], ['drive']]], ['inf-min', [['curve', 'inf'], ['min']]], ['inf-1000', [['curve', 'inf'], ['set', -1, 1000], ['set', 1, 1000]]]);
let checks = 0, states = 0; const fails = [];
const heightOf = w => w <= 430 ? 844 : w <= 820 ? 1024 : w >= 1920 ? 1080 : 900;
if (FIT) {
  for (const [w, h] of [[390, 844], [1024, 768], [1280, 800]]) {
    const { page, errs, ctx } = await open({ w, h });
    for (const st of [[], [['curve', 'inf']]]) {
      for (const a of st) await act(page, a);
      await page.waitForTimeout(200);
      const r = await page.evaluate(() => {
        const R = e => e.getBoundingClientRect(), sc = R(document.querySelector('.le2-scene')), c = R(document.querySelector('.le2 .tk2-cause')), out = [];
        const ks = [...document.querySelectorAll('.le2 .tk2-knob')].map(R);
        if (sc.top < 0 || sc.bottom > innerHeight) out.push('the picture is not wholly in view (' + Math.round(sc.top) + ' to ' + Math.round(sc.bottom) + ')');
        if (c.bottom > innerHeight) out.push('the cause line is below the fold');
        ks.forEach(k => { if (k.top < 0 || k.bottom > innerHeight) out.push('a car knob is out of view'); });
        // no inner scroll: no scrolled box holds the stage
        let e = document.querySelector('.le2'); while (e && e !== document.body) { const s = getComputedStyle(e); if (/(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 1) out.push('inner scroll in ' + e.className); e = e.parentElement; }
        return out;
      });
      checks += 4; states++;
      r.forEach(x => fails.push(`${w}x${h} ${st.length ? 'tab 2' : 'tab 1'}: ${x}`));
    }
    errs.forEach(e => fails.push(`${w}x${h}: console: ${e}`));
    await ctx.close();
  }
} else if (FRAMES) {
  for (const w of WIDTHS) {
    const { page, errs, ctx } = await open({ w, h: heightOf(w), motion: true });
    const sample = async (name, start, ms) => {
      await page.evaluate(() => { window.__fr = []; window.__on = true; const loop = () => { const T = window.ApCalcLimitExplorer, S = T.S, c = document.querySelector('.le2 .tk2-cause');
        const tags = [...document.querySelectorAll('.le2 .tk2-tag')].map(e => e.hidden ? '' : e.textContent);
        const pills = [...c.querySelectorAll('.tk2-cz')].map(e => e.textContent), noses = [...document.querySelectorAll('.le2-dyn .le2-nose')].map(n => +n.getAttribute('cx'));
        const pts = [...document.querySelectorAll('.le2-dyn > g > .le2-pt, .le2-dyn > .le2-pt, .le2-dyn g[clip-path] > .le2-pt')].map(p => p.classList.contains('is-open'));
        window.__fr.push({ tab: S.tab, id: S.P.id, dl: S.dl, dr: S.dr, xl: S.xl, xr: S.xr, fillK: S.fillK, filled: S.filled, tags, pills, take: c.classList.contains('is-take') ? c.textContent : '', noses, G: { L: T.G().A.L, W: T.G().A.W, x0: T.G().A.x[0], x1: T.G().A.x[1], log: T.G().A.log }, pts });
        if (window.__on) requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
      await start(); await page.waitForTimeout(ms);
      const fr = await page.evaluate(() => { window.__on = false; return window.__fr; });
      const LE = await page.evaluate(() => 1);
      let bad = 0;
      for (const F of fr) {
        checks++;
        const num = s => +String(s).replace(/−/g, '-').replace(/,/g, '');
        // the drawn noses give the x in each tag; the pills give the same f as the tags
        const xs = F.tab === 'point' ? [null, null] : [-F.xl, F.xr];
        F.tags.forEach((t, i) => { if (!t) return; const m = t.match(/^f\((.+)\) = (.+)$/) || (/^[−\d.,-]+$/.test(t) ? [t, null, t] : null); if (!m) { bad++; fails.push(`${w} ${name}: unreadable tag ${t}`); return; }
          const xd = F.tab === 'point' ? (i ? null : null) : xs[i];
          const sx = F.G.log || m[1] == null ? null : (F.G.L + (num(m[1]) - F.G.x0) / (F.G.x1 - F.G.x0) * F.G.W);
          if (sx != null && Math.abs(sx - F.noses[i]) > Math.max(1.5, Math.abs(num(m[1])) * 0)) { const tol = F.G.W / (F.G.x1 - F.G.x0) * Math.pow(10, -((m[1].split('.')[1] || '').length)) * 0.6 + 0.6; if (Math.abs(sx - F.noses[i]) > tol) { bad++; if (bad < 4) fails.push(`${w} ${name}: tag ${t} is ${(sx - F.noses[i]).toFixed(1)} px from its car's nose`); } }
          if (!F.take && F.pills[i] && !(t === F.pills[i].split(/ |= /).pop() || t.endsWith(' ' + F.pills[i].split(/ |= /).pop()))) { bad++; if (bad < 4) fails.push(`${w} ${name}: pill ${F.pills[i]} and tag ${t} disagree`); }
          void xd; });
        if (F.noses.some(v => !isFinite(v))) { bad++; if (bad < 4) fails.push(`${w} ${name}: a car drawn at NaN`); }
        if (F.take && /continuous at x = \d\.$/.test(F.take) && /^Now/.test(F.take) && F.fillK < 1) { bad++; fails.push(`${w} ${name}: the takeaway before the hole is filled`); }
        if (F.take && /limit|exist/.test(F.take) && F.tab === 'point' && !/^Now/.test(F.take) && (F.dl > 0.00101 || F.dr > 0.00101)) { bad++; fails.push(`${w} ${name}: the Close in takeaway before the cars arrived`); }
        if (F.take && F.tab === 'inf' && (F.xl < 9999 || F.xr < 9999)) { bad++; fails.push(`${w} ${name}: the Drive out takeaway before the cars arrived`); }
      }
      void LE;
      // a key jump or a drive is seen happening: the drawn distance passes through values between its ends
      if (/glide|close|out/.test(name)) { const ds = new Set(fr.map(F => (F.tab === 'point' ? F.dl : F.xl).toPrecision(4))); checks++; if (ds.size < 4) fails.push(`${w} ${name}: no motion seen (${ds.size} distinct positions)`); }
      console.log(`${w} ${THEME} frames ${name}: ${fr.length} frames, ${bad} bad`);
      if (SHOTS) await shot(page, `${w}-${THEME}-frames-${name}.png`);
    };
    await sample('close-in', () => page.click('.le2 .tk2-play:not([hidden])'), 2600);
    await page.waitForTimeout(800);
    await sample('back-out', () => page.click('.le2 .tk2-play:not([hidden])'), 3600);
    await sample('page-down-glide', async () => { await page.focus('.le2-hl .tk2-knob'); await page.keyboard.press('PageDown'); await page.keyboard.press('PageDown'); }, 900);
    await sample('fill', () => page.click('.le2-fill'), 1000);
    await sample('undo', () => page.click('.le2-fill'), 900);
    await page.evaluate(() => window.ApCalcLimitExplorer.setCurve('jump'));
    await sample('jump close in', () => page.click('.le2 .tk2-play:not([hidden])'), 3600);
    await page.evaluate(() => window.ApCalcLimitExplorer.setCurve('inf'));
    await page.waitForTimeout(500);
    await sample('drive-out', () => page.click('.le2 .tk2-play:not([hidden])'), 3600);
    // leave mid animation: Test yourself, then back; nothing left running
    await page.evaluate(() => window.ApCalcLimitExplorer.setCurve('hole'));
    await page.click('.le2 .tk2-play:not([hidden])'); await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Test yourself' }).first().click().catch(() => page.getByRole('tab', { name: 'Test yourself' }).first().click());
    await page.waitForTimeout(500);
    const stopped = await page.evaluate(() => !window.ApCalcLimitExplorer.close.playing());
    checks++; if (!stopped) fails.push(`${w}: Close in kept running in Test yourself`);
    errs.forEach(e => fails.push(`${w} frames: console: ${e}`));
    await ctx.close();
  }
} else {
  for (const w of WIDTHS) {
    const h = heightOf(w), W4 = String(w).padStart(4, '0');
    { // the first visit
      const c = await open({ w, h, cue: true });
      await c.page.waitForTimeout(300);
      const bad = await c.page.evaluate(() => { const R = e => e.getBoundingClientRect(), cues = [...document.querySelectorAll('.le2 .tk2-cue')].filter(e => !e.hidden && R(e).width); if (cues.length !== 1) return ['cues shown: ' + cues.length];
        const r = R(cues[0]), S = R(document.querySelector('.le2-scene')), out = [];
        if (r.left < S.left || r.right > S.right || r.top < S.top || r.bottom > S.bottom) out.push('the cue is clipped by the stage');
        [...document.querySelectorAll('.le2-dyn text.le2-lab, .le2-static .le2-ticks text, .le2 .tk2-tag, .le2-fill, .le2 .tk2-chip')].forEach(e => { const q = R(e); if (q.width && !(q.right <= r.left || q.left >= r.right || q.bottom <= r.top || q.top >= r.bottom)) out.push('the cue covers "' + e.textContent + '"'); });
        return out; });
      checks += 3; states++;
      bad.forEach(x => fails.push(`${w} first visit: ${x}`));
      if (SHOTS) await shot(c.page, `${W4}-${THEME}-0-first-visit.png`);
      await c.ctx.close();
    }
    const { page, errs, ctx } = await open({ w, h });
    for (const [name, acts] of STATES) {
      await page.evaluate(() => { const T = window.ApCalcLimitExplorer; T.setCurve('hole'); if (T.S.filled) T.fill(); T.set(-1, 1); T.set(1, 1); });
      await page.waitForTimeout(80);
      for (const a of acts) await act(page, a);
      await page.waitForTimeout(250);
      let r = await page.evaluate(probe);
      // a takeaway changes the cause line's height and the picture is laid out again a frame later: settle and look again
      if (r.out.length) { await page.waitForTimeout(700); r = await page.evaluate(probe); }
      states++; checks += 20;
      r.out.forEach(x => fails.push(`${w} ${THEME} ${name}: ${x}`));
      if (SHOTS) await shot(page, `${W4}-${THEME}-${name}.png`);
    }
    errs.forEach(e => fails.push(`${w}: console: ${e}`));
    await ctx.close();
  }
}
await browser.close(); server.close();
const uniq = [...new Set(fails)];
console.log(`Limit explorer sweep${FIT ? ' (fit)' : FRAMES ? ' (frames)' : ''}, ${THEME}: ${states} states, ${checks} checks, ${uniq.length} failures at ${FIT ? '390x844, 1024x768, 1280x800' : WIDTHS.join(', ')}`);
uniq.slice(0, 80).forEach(x => console.log('  ' + x));
process.exit(uniq.length ? 1 : 0);
