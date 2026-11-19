/* Tools v2 layout sweep for AP® Calculus AB Tangent tracer (docs/tools-v2-tangent-tracer-brief.md), after the pattern
   of the other sweeps in this folder. Every curve on the shelf at its landmark states: tab 1 at its start, at each
   corner, cusp, vertical tangent, jump or end, at both ends of the window and after Drive across; tab 2 at h = 1,
   h = −0.5, h = 0.05 and h = 0.001 (the magnifier); plus the first visit. At ten widths. At each state it asserts:
     - nothing drawn or labelled is clipped by the stage (labels, tick labels, the car, the knobs and their tags, the
       magnifier and its zoom label);
     - no two labels overlap, and no label sits under a knob, a tag or the car;
     - the road panel (the thing acted on) is the largest thing in the picture and at least 40% of the stage;
     - the words agree with the picture: the cause line names the slope on P's tag (tab 1) and the h on Q's tag
       (tab 2), the knob sits on the curve, and "does not exist" shows only at a point that has no slope;
     - on a phone the cause line is at most two rows and keeps one height;
     - no sideways scroll, no console errors;
     - on a first visit the cue is whole and covers no label, number or tag.
     - (review round 1, frame 2) the car is never hidden by P's knob, in either tab: P's knob is a clear ring around the
       car (the car inside it) and P on the road is inside it;
     - (review round 1, frame 3) tab 2 on a first visit shows one cue at a time (P's cue is gone, only Q's chip);
       Q's chip never covers Q's tag, a label (h, Δy, zoom), P's dot in the magnifier or P's knob; "Slide Q in" and
       Q's keys count as Q's first use (the chip goes).

     node scripts/tools-v2/tangent-tracer-sweep.mjs [widths, comma separated] [--shots dir]

   Needs Playwright and a Chromium (CHROME or /opt/pw-browsers/chromium-1243/chrome-linux64/chrome). It serves the
   repo itself on a free port and blocks service workers; the tool is free, so nothing is unlocked. Reduced motion is
   on, so each state is the settled picture (the animations are checked frame by frame in the browser checks, see
   the brief). Exit code 1 on any failure. Not part of CI (a few minutes); run it after any change to the tool's
   layout, labels or wording. */
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
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const WIDTHS = (args[0] && !args[0].startsWith('--') ? args[0] : '360,390,430,600,768,820,1024,1280,1440,1920').split(',').map(Number);
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
async function open(o) {
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, serviceWorkers: 'block', deviceScaleFactor: 1, reducedMotion: o.cue ? 'no-preference' : 'reduce' });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.addInitScript(() => { window.LevlToolTest = true; });
  if (!o.cue) await page.addInitScript(() => { try { ['tk2c:apcalc-tangent-tracer', 'tk2h:apcalc-tangent-tracer-q', 'tk2h:apcalc-tangent-tracer-p'].forEach(k => localStorage.setItem(k, '1')); } catch (e) {} });
  await page.goto(BASE + '/calculus/tools/tangent-tracer.html', { waitUntil: 'load' });
  await page.waitForSelector('.tt2-svg .tt2-road');
  await page.waitForTimeout(400);
  return { page, errs };
}
const shot = (page, name) => SHOTS ? page.locator('.tt2').screenshot({ path: join(SHOTS, name) }) : null;
/* Runs in the page: the checks of one state. */
const probe = () => {
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]') && R(e).w > 0;
  const q = s => [...document.querySelectorAll(s)].filter(vis), out = [];
  const T = window.ApCalcTangentTracer, S = T.S, G = T.G();
  const sc = R(document.querySelector('.tt2-scene'));
  const inS = (x, name, tol = 0.6) => { if (x.l < sc.l - tol || x.r > sc.r + tol || x.t < sc.t - tol || x.b > sc.b + tol) out.push('clipped: ' + name); };
  const hit = (a, c, g = 0.6) => !(a.r - g <= c.l || c.r - g <= a.l || a.b - g <= c.t || c.b - g <= a.t);
  const labs = q('.tt2-svg > .tt2-dyn text.tt2-lab').map(e => ({ n: 'label "' + e.textContent + '"', r: R(e) }));
  const ticks = q('.tt2-static .tt2-ticks text').map(e => ({ n: 'tick "' + e.textContent + '"', r: R(e), tick: true }));
  const tags = q('.tt2 .tk2-tag').map(e => ({ n: 'tag "' + e.textContent + '"', r: R(e) }));
  const knobs = q('.tt2 .tk2-handle:not([hidden]) .tk2-dot').map(e => ({ n: 'knob', r: R(e) }));
  const cars = q('.tt2-svg > .tt2-dyn .tt2-car').map(e => ({ n: 'the car', r: R(e) }));
  const lens = q('.tt2-svg > .tt2-dyn .tt2-lens-rim').map(e => ({ n: 'the magnifier', r: R(e) }));
  [...labs, ...ticks, ...tags, ...knobs, ...cars, ...lens].forEach(x => inS(x.r, x.n));
  const all = [...labs, ...tags, ...ticks];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], c = all[j];
    if (a.tick && c.tick) continue;
    if (hit(a.r, c.r)) out.push('overlap: ' + a.n + ' and ' + c.n);
  }
  // the car is turned, so its box is bigger than it: look for it under a 4 x 3 grid of points of each label
  const onCar = r => { for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const x = r.l + 1.5 + (r.w - 3) * i / 3, y = r.t + 1.5 + (r.h - 3) * j / 2;
    if (document.elementsFromPoint(x, y).some(e => e.closest && e.closest('.tt2-car'))) return true; } return false; };
  // a clear ring hides only what its stroke crosses: a label wholly inside or outside the circle is read through it
  const isRing = e => e.closest('.tk2-handle.is-ring');
  const ringCut = (r, c) => { const cx = c.l + c.w / 2, cy = c.t + c.h / 2, rr = c.w / 2, d = [[r.l, r.t], [r.r, r.t], [r.l, r.b], [r.r, r.b]].map(p => Math.hypot(p[0] - cx, p[1] - cy));
    const near = Math.hypot(Math.max(r.l, Math.min(cx, r.r)) - cx, Math.max(r.t, Math.min(cy, r.b)) - cy); return !(Math.max(...d) < rr - 3 || near > rr + 3); };
  const knobEls = q('.tt2 .tk2-handle:not([hidden]) .tk2-dot');
  [...labs, ...ticks].forEach(a => { knobs.forEach((c, i) => { if (hit(a.r, c.r, 1) && (!isRing(knobEls[i]) || ringCut(a.r, c.r))) out.push(a.n + ' under ' + c.n); }); if (cars.length && onCar(a.r)) out.push(a.n + ' on the car'); });
  tags.forEach(a => { if (cars.length && onCar(a.r)) out.push(a.n + ' on the car'); });
  // the road panel is the largest thing and a real share of the stage
  const A = G.A, B = G.B, k = sc.w / G.W, aA = A.W * A.H * k * k, share = aA / (sc.w * sc.h);
  if (B && B.W * B.H >= A.W * A.H) out.push('the f′ paper is as big as the road');
  lens.forEach(x => { if (x.r.w * x.r.h >= aA) out.push('the magnifier is bigger than the road'); });
  if (share < 0.4) out.push('the road panel is ' + (share * 100).toFixed(0) + '% of the stage');
  // the knob sits on the curve (on a phone: P on the road is inside the ring)
  const hpEl = document.querySelectorAll('.tt2 .tk2-handle')[0], ring = hpEl.classList.contains('is-ring');
  const pr = R(hpEl.querySelector('.tk2-knob'));
  const want = [sc.l + A.sx(S.a) * k, sc.t + A.sy(S.F.f(S.a)) * k], off = Math.hypot(pr.l + pr.w / 2 - want[0], pr.t + pr.h / 2 - want[1]);
  if (ring ? off > pr.w / 2 - 4 : off > 1.5) out.push('P’s knob is off the curve (' + [pr.l + pr.w / 2 - want[0], pr.t + pr.h / 2 - want[1]].map(v => Math.round(v)).join(', ') + ')');
  // frame 2: the car is never hidden by P's knob (both tabs)
  const car = cars[0], dotEl = hpEl.querySelector('.tk2-dot');
  if (car) {
    const bg = getComputedStyle(dotEl).backgroundColor, clear = bg === 'transparent' || /rgba\(.*,\s*0\)$/.test(bg);
    if (!ring) out.push('P’s knob is not a ring');
    if (ring) {
      if (!clear) out.push('P’s ring is not clear');
      const cx = pr.l + pr.w / 2, cy = pr.t + pr.h / 2, cr = car.r;
      // the car (its turned box shrunk by a fifth, as the box is bigger than the car) is inside the ring
      const sx = cr.w * 0.1, sy = cr.h * 0.1, far = [[cr.l + sx, cr.t + sy], [cr.r - sx, cr.t + sy], [cr.l + sx, cr.b - sy], [cr.r - sx, cr.b - sy]].map(p => Math.hypot(p[0] - cx, p[1] - cy));
      if (Math.max(...far) > pr.w / 2 + 6) out.push('the car sticks out of P’s ring by ' + Math.round(Math.max(...far) - pr.w / 2) + ' px');
    } else if (!clear) {
      const d = R(dotEl), cr = car.r, ix = Math.max(0, Math.min(d.r, cr.r) - Math.max(d.l, cr.l)) * Math.max(0, Math.min(d.b, cr.b) - Math.max(d.t, cr.t));
      if (ix > cr.w * cr.h / 6) out.push('P’s knob covers ' + Math.round(100 * ix / (cr.w * cr.h)) + '% of the car');
    }
  }
  // the words agree with the picture
  const causeEl = document.querySelector('.tt2 .tk2-cause'), cause = causeEl.innerText.replace(/\n/g, ' ');
  const c = S.cls || {}, slopeTag = tags.find(t => /slope/.test(t.n)), take = causeEl.classList.contains('is-take');
  if (S.tab === 'slope') {
    if (c.kind === 'smooth') {
      const tv = slopeTag ? slopeTag.n.replace(/^tag "slope |"$/g, '') : null;
      if (!tv) out.push('no slope on P');
      else if (!take && !cause.includes('slope ' + tv)) out.push('cause line and tag disagree: ' + tv + ' / ' + cause);
      if (/does not exist/.test(cause)) out.push('"does not exist" at a smooth point');
    } else if (!take && !/does not exist|not defined/.test(cause)) out.push('no "does not exist" at a ' + c.kind);
  } else {
    const qt = tags.find(t => /h = /.test(t.n));
    if (qt && !take && !/off the road/.test(cause) && !cause.includes(qt.n.replace(/^tag "|"$/g, ''))) out.push('cause line and Q disagree: ' + qt.n + ' / ' + cause);
  }
  const rows = new Set(q('.tt2 .tk2-cz').map(e => Math.round(R(e).t))).size;
  if (innerWidth <= 640 && rows > 2) out.push('cause line is ' + rows + ' rows: ' + cause);
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  return { out, share, causeH: Math.round(R(causeEl).h) };
};
const CURVES = ['quad', 'cubic', 'sin', 'exp', 'ln', 'abs', 'corner', 'smooth', 'sqrt', 'cbrt', 'cusp', 'jump'];
let checks = 0, states = 0; const fails = [], minShare = {};
for (const w of WIDTHS) {
  const h = w <= 430 ? 844 : w <= 820 ? 1024 : w >= 1920 ? 1080 : 900, W4 = String(w).padStart(4, '0');
  { // a first visit: the cue is whole and covers no label, number or tag
    const c = await open({ w, h, cue: true });
    await c.page.waitForTimeout(300);
    const bad = await c.page.evaluate(() => { const R = e => e.getBoundingClientRect(), q = document.querySelector('.tk2-cue'); if (!q) return ['no cue shown'];
      const r = R(q), S = R(document.querySelector('.tt2-scene')), out = [];
      if (r.left < S.left || r.right > S.right || r.top < S.top || r.bottom > S.bottom) out.push('the cue is clipped by the stage');
      [...document.querySelectorAll('.tt2-dyn text, .tt2-ticks text, .tt2 .tk2-tag')].filter(e => e.getClientRects().length && !e.closest('[hidden]')).forEach(e => { const x = R(e); if (!(r.right <= x.left || x.right <= r.left || r.bottom <= x.top || x.bottom <= r.top)) out.push('the cue covers ' + e.textContent.trim().slice(0, 24)); });
      return out; });
    states++; checks += 2; bad.forEach(m => fails.push(`${w} first visit: ${m}`));
    await shot(c.page, `${W4}-0-first-visit.png`);
    // frame 3: the first visit to tab 2
    const chipCheck = () => {
      const R = e => e.getBoundingClientRect(), vis = e => e && e.getClientRects().length && !e.closest('[hidden]') && getComputedStyle(e).visibility !== 'hidden';
      const hit = (a, c) => !(a.right - 0.5 <= c.left || c.right - 0.5 <= a.left || a.bottom - 0.5 <= c.top || c.bottom - 0.5 <= a.top);
      const out = [], cues = [...document.querySelectorAll('.tt2 .tk2-cue, .tt2 .tk2-chip')].filter(vis);
      if (cues.length > 1) out.push(cues.length + ' cues at once');
      const ch = document.querySelector('.tt2 .tk2-handle .tk2-chip');
      if (ch && vis(ch)) {
        const r = R(ch), S = R(document.querySelector('.tt2-scene'));
        if (r.left < S.left || r.right > S.right || r.top < S.top || r.bottom > S.bottom) out.push('Q’s chip is clipped');
        [...document.querySelectorAll('.tt2 .tk2-tag, .tt2-dyn text, .tt2-dyn .tt2-pdot, .tt2-dyn .tt2-qdot')].filter(vis).forEach(e => { if (hit(r, R(e))) out.push('Q’s chip covers ' + (e.textContent.trim() || e.getAttribute('class'))); });
        const pk = R(document.querySelectorAll('.tt2 .tk2-handle')[0].querySelector('.tk2-dot')); if (hit(r, pk)) out.push('Q’s chip covers P’s knob');
      }
      return { out, chip: !!(ch && vis(ch)) };
    };
    await c.page.locator('.tt2 .tk2-tab >> nth=1').click(); await c.page.waitForTimeout(500);
    for (const hh of [1, -0.5, 0.05, 0.001]) {
      await c.page.evaluate(hh => window.ApCalcTangentTracer.setH(hh), hh); await c.page.waitForTimeout(450);
      const r = await c.page.evaluate(chipCheck); states++; checks += 4;
      if (!r.chip) fails.push(`${w} tab 2 first visit h = ${hh}: Q’s chip gone before Q was used`);
      r.out.forEach(m => fails.push(`${w} tab 2 first visit h = ${hh}: ${m}`));
      if (hh === 1 || hh === 0.05) await shot(c.page, `${W4}-0-tab2-first-h${hh}.png`);
    }
    await c.page.evaluate(() => window.ApCalcTangentTracer.setH(1)); await c.page.waitForTimeout(200);
    await c.page.locator('.tt2-lines .tk2-play >> nth=1').click(); await c.page.waitForTimeout(3400);
    { const r = await c.page.evaluate(chipCheck); checks++; if (r.chip) fails.push(`${w} tab 2: Q’s chip stays after Slide Q in`); }
    await c.page.context().close();
    const c2 = await open({ w, h, cue: true });
    await c2.page.locator('.tt2 .tk2-tab >> nth=1').click(); await c2.page.waitForTimeout(400);
    await c2.page.locator('.tt2 .tk2-handle >> nth=1 >> .tk2-knob').press('PageDown'); await c2.page.waitForTimeout(300);
    { const r = await c2.page.evaluate(chipCheck); checks++; if (r.chip) fails.push(`${w} tab 2: Q’s chip stays after Q’s keys`); r.out.forEach(m => fails.push(`${w} tab 2 after keys: ${m}`)); }
    await c2.page.context().close();
  }
  const { page, errs } = await open({ w, h });
  const heights = new Set(); let lo = 9;
  const check = async (what, name) => {
    // two frames: under reduced motion the site gives every property a 0.01 ms transition, so a knob reads its new
    // place only after the next frame
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.waitForTimeout(120);
    // a change of the cause line's height can resize the stage once (a frame later): wait for P's knob to settle
    for (let t = 0; t < 10; t++) { if (await page.evaluate(() => { const T = window.ApCalcTangentTracer, G = T.G(), sc = document.querySelector('.tt2-scene').getBoundingClientRect(), k = sc.width / G.W, r = document.querySelector('.tt2 .tk2-handle .tk2-knob').getBoundingClientRect();
      return Math.hypot(r.left + r.width / 2 - sc.left - G.A.sx(T.S.a) * k, r.top + r.height / 2 - sc.top - G.A.sy(T.S.F.f(T.S.a)) * k) < 1.5; })) break; await page.waitForTimeout(100); }
    const r = await page.evaluate(probe); states++; checks += 12;
    r.out.forEach(m => fails.push(`${w} ${what}: ${m}`));
    if (w <= 640) heights.add(r.causeH);
    lo = Math.min(lo, r.share);
    if (name) await shot(page, `${W4}-${name}.png`);
  };
  for (const cv of CURVES) {
    await page.evaluate(cv => { const T = window.ApCalcTangentTracer; T.setTab('slope'); T.setF(T.FUNCS[cv]); }, cv);
    await check(`${cv} tab 1 start`, cv === 'quad' || cv === 'abs' ? `1-${cv}-start` : null);
    const marks = await page.evaluate(() => { const T = window.ApCalcTangentTracer, F = T.S.F; return (F.special || []).map(s => s.x).concat(F.join != null ? [F.join] : []); });
    for (const x of marks) { await page.evaluate(x => window.ApCalcTangentTracer.moveP(x), x); await check(`${cv} tab 1 at x = ${x}`, cv === 'cusp' || cv === 'jump' || cv === 'cbrt' ? `1-${cv}-special` : null); }
    for (const key of ['Home', 'End']) { await page.locator('.tt2 .tk2-handle >> nth=0 >> .tk2-knob').press(key); await check(`${cv} tab 1 ${key}`, cv === 'exp' && key === 'End' ? '1-exp-end' : null); }
    await page.locator('.tt2-lines .tk2-play >> nth=0').click(); await page.waitForTimeout(80);
    await check(`${cv} tab 1 after Drive across`, cv === 'sin' || cv === 'corner' ? `1-${cv}-drive` : null);
    await page.evaluate(() => { const T = window.ApCalcTangentTracer; T.setTab('secant'); T.moveP(T.S.F.a); });
    for (const hh of [1, -0.5, 0.05, 0.001]) {
      const ok = await page.evaluate(hh => { const T = window.ApCalcTangentTracer; T.setH(hh); return T.S.h === hh; }, hh);
      if (!ok) continue;
      await page.waitForTimeout(40);
      await check(`${cv} tab 2 h = ${hh}`, (cv === 'quad' || cv === 'abs' || cv === 'sqrt') ? `2-${cv}-h${hh}` : null);
    }
  }
  if (w <= 640) { checks++; if (heights.size !== 1) fails.push(`${w}: cause line height not constant: ${[...heights]}`); }
  minShare[w] = (lo * 100).toFixed(1) + '%';
  const real = errs.filter(e => !/ERR_FAILED/.test(e)); checks++; if (real.length) fails.push(`${w}: console ${real.join('|')}`);
  await page.context().close();
}
await browser.close();
const uniq = [...new Set(fails)];
console.log(`states ${states}, checks ${checks}, failures ${uniq.length}`); console.log('road panel share of the stage (min):', JSON.stringify(minShare));
const kinds = {}; uniq.forEach(f => { const k = f.replace(/^\d+ [^:]*: /, '').replace(/".*?"/g, '""').replace(/[-−\d.,]+/g, '#'); kinds[k] = (kinds[k] || 0) + 1; });
console.log(Object.entries(kinds).sort((a, c) => c[1] - a[1]).slice(0, 25).map(([k, n]) => n + ' x ' + k).join('\n'));
console.log(uniq.slice(0, 40).join('\n'));
server.close();
process.exit(uniq.length ? 1 : 0);
