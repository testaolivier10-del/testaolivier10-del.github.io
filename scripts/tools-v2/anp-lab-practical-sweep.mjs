#!/usr/bin/env node
/* Sweep test for the A&P Lab practical v2 Explore (docs/tools-v2-anp-lab-practical-brief.md; docs/tools-v2-builder-brief.md
   step 5). Every specimen at landing and with every one of its parts named, at ten widths: the name card inside the
   picture, clear of its own pins, of the find button and (at landing) of the cue; every pin inside the picture, no two
   pins drawn on top of each other and none under the find button; the picture the largest thing on the stage; the
   cause line at most two rows on phones with one constant height and every pill inside it; no sideways scroll; no
   console errors. Also: a real tap (mouse, or touch on a phone) next to a pin names that pin, a tap on bare picture
   closes the card, find by name forgives (case, a slip), the cue leaves after the first tap.

   Needs a static server at the repo root and Chromium:
     python3 -m http.server 8937 --bind 127.0.0.1 &
     node scripts/tools-v2/anp-lab-practical-sweep.mjs [--port 8937] [--shots <dir>] [--dark] [--width 390]
   Run one width per process (--width) for long sweeps. The tool is Premium: the test (never the page) unlocks it by
   serving assets/premium.js with has() answering true. */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const PORT = arg('--port', '8937'), SHOTS = arg('--shots', ''), DARK = process.argv.includes('--dark');
const ALL = [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
const WIDTHS = arg('--width', '') ? [+arg('--width', '')] : ALL;
const exe = '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: exe });
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
let fails = 0, checks = 0;
const fail = (m) => { fails++; console.log('FAIL ' + m); };
const ok = (c, m) => { checks++; if (!c) fail(m); };

for (const w of WIDTHS) {
  const h = w < 500 ? 844 : w < 900 ? 1024 : w >= 1900 ? 1080 : 900;
  const touch = w < 900;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', hasTouch: touch, isMobile: w < 500 });
  await ctx.route('**/assets/premium.js', (r) => r.fulfill({ contentType: 'application/javascript',
    body: readFileSync(join(ROOT, 'assets/premium.js'), 'utf8').replace('function has(course) {', 'function has(course) { return true;') }));
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await ctx.addInitScript((d) => { try { localStorage.setItem('nremt_theme', d ? 'dark' : 'light'); } catch (e) {} }, DARK);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  await page.goto(`http://127.0.0.1:${PORT}/anatomy-physiology/tools/lab-practical.html`, { waitUntil: 'load' });
  for (let i = 0; i < 150 && !(await page.evaluate(() => !!(window.AnpLabExplore && window.AnpLabExplore.current && document.querySelector('.tk2-spot-card.is-in')))); i++) await page.waitForTimeout(100);
  await page.waitForTimeout(400);

  // the first visit cue: there, inside the picture, covering no pin, the card or the find button
  const cue = await page.evaluate(() => {
    const c = document.querySelector('.tk2-cue'); if (!c) return { none: true };
    const r = c.getBoundingClientRect(), pic = document.querySelector('.lx-pic').getBoundingClientRect(), hits = [];
    document.querySelectorAll('.tk2-spot-pin, .tk2-spot-card:not([hidden]), .lx-find-b').forEach((e) => {
      const q = e.getBoundingClientRect();
      if (q.width && q.left < r.right - 1 && q.right > r.left + 1 && q.top < r.bottom - 1 && q.bottom > r.top + 1) hits.push(e.className);
    });
    return { hits, out: r.left < pic.left - 2 || r.right > pic.right + 2 || r.top < pic.top - 2 || r.bottom > pic.bottom + 2 };
  });
  ok(!cue.none, `${w}: no first visit cue`);
  if (!cue.none) { ok(!cue.hits.length, `${w}: the cue covers ${cue.hits.join(', ')}`); ok(!cue.out, `${w}: the cue sticks out of the picture`); }
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `land-${w}${DARK ? '-dark' : ''}.png`) });

  // the cue on each tab as a first screen (#specimen/<tab> on a fresh device)
  for (const t of ['brain', 'skull', 'neuron', 'skin', 'kidney']) {
    const pg = await ctx.newPage();
    await pg.goto(`http://127.0.0.1:${PORT}/anatomy-physiology/tools/lab-practical.html#specimen/${t}`, { waitUntil: 'load' });
    for (let i = 0; i < 80 && !(await pg.evaluate(() => !!document.querySelector('.tk2-spot-card.is-in'))); i++) await pg.waitForTimeout(100);
    await pg.waitForTimeout(400);
    const c2 = await pg.evaluate(() => {
      const c = document.querySelector('.tk2-cue'); if (!c) return { none: true };
      const r = c.getBoundingClientRect(), pic = document.querySelector('.lx-pic').getBoundingClientRect(), hits = [];
      document.querySelectorAll('.tk2-spot-pin, .tk2-spot-card:not([hidden]), .lx-find-b').forEach((e) => {
        const q = e.getBoundingClientRect();
        if (q.width && q.left < r.right - 1 && q.right > r.left + 1 && q.top < r.bottom - 1 && q.bottom > r.top + 1) hits.push(e.className);
      });
      return { hits, out: r.left < pic.left - 2 || r.right > pic.right + 2 || r.top < pic.top - 2 || r.bottom > pic.bottom + 2 };
    });
    ok(c2.none || (!c2.hits.length && !c2.out), `${w} ${t}: the first visit cue ${JSON.stringify(c2)}`);
    await pg.close();
  }

  const specs = await page.evaluate(() => window.AnpLabExplore.current._specs.map((s) => ({ id: s.id, spots: s.spots.map((x) => x.label) })));
  const causeH = new Set();
  for (const sp of specs) {
    await page.evaluate((id) => window.AnpLabExplore.current.tab(id), sp.id);
    for (let i = 0; i < 40 && !(await page.evaluate(() => { const p = document.querySelector('.lx-pic'); return p && !p.classList.contains('is-swap') && document.querySelector('.tk2-spot-card.is-in'); })); i++) await page.waitForTimeout(80);
    for (const lab of sp.spots) {
      await page.evaluate((l) => window.AnpLabExplore.current.pick(l), lab);
      await page.waitForTimeout(330);   // the card has grown (0.26 s)
      const r = await page.evaluate((lab) => {
        const out = { errs: [] }, R = (e) => e.getBoundingClientRect();
        const pic = R(document.querySelector('.lx-pic')), card = document.querySelector('.tk2-spot-card'), c = R(card);
        const inside = (q, b, m = 0) => q.left >= b.left - m && q.right <= b.right + m && q.top >= b.top - m && q.bottom <= b.bottom + m;
        const meet = (a, b, g) => a.left < b.right + g && a.right > b.left - g && a.top < b.bottom + g && a.bottom > b.top - g;
        if (card.hidden) out.errs.push('no card');
        if (card.textContent.trim() !== document.querySelector('.tk2-spot[aria-pressed="true"]').getAttribute('aria-label')) out.errs.push('card names another part');
        if (!inside(c, pic, 1)) out.errs.push('card outside the picture');
        if (card.scrollWidth > card.clientWidth + 1) out.errs.push('card text clipped');
        const mine = [...document.querySelectorAll('.tk2-spot[aria-pressed="true"] .tk2-spot-pin, .tk2-spot-dot.is-on')];
        mine.forEach((p) => { if (meet(R(p), c, 0)) out.errs.push('card covers its own pin ' + JSON.stringify([R(p).left, R(p).top, c.left, c.top, c.right, c.bottom, pic.left, pic.top, pic.width])); });
        const fb = document.querySelector('.lx-find-b');
        if (fb && fb.offsetParent && meet(R(fb), c, 4)) out.errs.push('card on the find button');
        const pins = [...document.querySelectorAll('.tk2-spot-pin, .tk2-spot-dot')].map(R);
        pins.forEach((p, i) => {
          if (!inside(p, pic, 1)) out.errs.push('pin ' + i + ' outside the picture');
          if (fb && fb.offsetParent && meet(p, R(fb), 4)) out.errs.push('pin ' + i + ' under the find button');
          pins.forEach((q, j) => { if (j > i && Math.hypot(p.left - q.left, p.top - q.top) < p.width * 0.9) out.errs.push('pins ' + i + ' and ' + j + ' drawn on top of each other'); });
        });
        // the picture fills the plate's width or most of the screen's height
        const plate = R(document.querySelector('.lx-plate'));
        if (pic.width < plate.width * 0.85 && pic.height < innerHeight * 0.5) out.errs.push('picture small: ' + Math.round(pic.width) + ' x ' + Math.round(pic.height));
        // no other pin under the card
        [...document.querySelectorAll('.tk2-spot:not([aria-pressed="true"]) .tk2-spot-pin')].forEach((e) => { if (meet(R(e), c, 2)) out.errs.push('card covers the ' + e.parentElement.getAttribute('data-id') + ' pin'); });
        // the picture is the biggest thing on the stage
        const area = (q) => q.width * q.height, big = area(pic);
        document.querySelectorAll('.lx .tk2-tabs, .lx .tk2-head, .lx-lines').forEach((e) => { if (area(R(e)) >= big) out.errs.push(e.className + ' bigger than the picture'); });
        // the cause line: pills inside it; rows
        const cz = document.querySelector('.lx .tk2-cause'), zr = R(cz);
        cz.querySelectorAll('.tk2-cz').forEach((p) => { const q = R(p); if (q.right > zr.right + 1 || q.left < zr.left - 1) out.errs.push('a pill sticks out of the cause line'); if (p.scrollWidth > p.clientWidth + 1) out.errs.push('pill text clipped'); });
        out.causeH = Math.round(zr.height);
        out.lines = Math.round(R(document.querySelector('.lx-lines')).height);
        const tops = new Set(); cz.querySelectorAll('.tk2-cz, .tk2-cz-a').forEach((p) => { const q = R(p); tops.add(Math.round(q.top / 6)); });
        const rows = [...cz.querySelectorAll('.tk2-cz')].reduce((n, p) => n + Math.round(R(p).height / 26), 0);
        out.rows = Math.max(tops.size, 1);
        out.rowsText = rows;
        out.hscroll = document.scrollingElement.scrollWidth > innerWidth + 1;
        return out;
      }, lab);
      ok(!r.errs.length, `${w} ${sp.id}/${lab}: ${r.errs.join('; ')}`);
      ok(!r.hscroll, `${w} ${sp.id}/${lab}: sideways scroll`);
      causeH.add(r.lines);
      if (w <= 640) ok(r.causeH <= 78, `${w} ${sp.id}/${lab}: cause line ${r.causeH}px, more than two rows`);
    }
    if (SHOTS) await page.screenshot({ path: join(SHOTS, `${sp.id}-${w}${DARK ? '-dark' : ''}.png`) });
  }
  if (w <= 1100) ok(causeH.size === 1, `${w}: the cause line's box changes height (${[...causeH].join(', ')})`);

  // a real tap next to a pin names it; a tap on bare picture closes the card; find forgives
  await page.evaluate(() => window.AnpLabExplore.current.tab('heart'));
  await page.waitForTimeout(500);
  const pin = await page.evaluate(() => { const b = document.querySelector('.tk2-spot[data-id="left-ventricle"]').getBoundingClientRect(); return [b.left + b.width / 2 + 6, b.top + b.height / 2 + 4]; });
  if (touch) await page.touchscreen.tap(pin[0], pin[1]); else await page.mouse.click(pin[0], pin[1]);
  await page.waitForTimeout(350);
  const tapRes = await page.evaluate(() => ({ card: document.querySelector('.tk2-spot-card').textContent, cause: document.querySelector('.lx .tk2-cause').textContent, cue: !!document.querySelector('.tk2-cue') }));
  ok(tapRes.card === 'Left ventricle', `${w}: a tap next to the left ventricle pin named "${tapRes.card}"`);
  ok(/Left ventricle.*pumps blood/.test(tapRes.cause), `${w}: the cause line says "${tapRes.cause}"`);
  ok(!tapRes.cue, `${w}: the cue stayed after the first tap`);
  // a tap on the drawing near no pin keeps the card and rings the nearest pins (review round 1)
  const miss = await page.evaluate(() => {
    const A = window.AnpLabExplore.current, pic = document.querySelector('.lx-pic').getBoundingClientRect();
    const k = pic.width / A._cur().crop[2];
    const pins = [...document.querySelectorAll('.tk2-spot-pin, .tk2-spot-dot')].map((e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    for (let y = pic.top + 20; y < pic.bottom - 20; y += 7) for (let x = pic.left + 20; x < pic.right - 20; x += 7) {
      if (A._blank((x - pic.left) / k, (y - pic.top) / k)) continue;
      if (pins.every((q) => Math.hypot(q[0] - x, q[1] - y) > 48)) return [x, y];
    }
    return null;
  });
  ok(!!miss, `${w}: found no drawing far from the pins to test a miss`);
  if (miss) {
    if (touch) await page.touchscreen.tap(miss[0], miss[1]); else await page.mouse.click(miss[0], miss[1]);
    await page.waitForTimeout(80);
    const m = await page.evaluate(() => ({ card: document.querySelector('.tk2-spot-card').hidden ? null : document.querySelector('.tk2-spot-card').textContent,
      cause: document.querySelector('.lx .tk2-cause').textContent, hint: document.querySelectorAll('.tk2-spot.is-hint').length }));
    ok(m.card === 'Left ventricle' && /Left ventricle/.test(m.cause) && m.hint === 2, `${w}: a miss over the drawing ${JSON.stringify(m)}`);
  }
  const bare = await page.evaluate(() => { const p = document.querySelector('.lx-pic').getBoundingClientRect(); return [p.left + 6, p.bottom - 6]; });
  if (touch) await page.touchscreen.tap(bare[0], bare[1]); else await page.mouse.click(bare[0], bare[1]);
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => document.querySelector('.tk2-spot-card').hidden), `${w}: a tap on bare picture left the card open`);
  for (const [q, want] of [['MITRAL', 'Mitral (bicuspid) valve'], ['bicuspid valve', 'Mitral (bicuspid) valve'], ['papilary muscle', 'Papillary muscle'], ['svc', 'Superior vena cava'], ['aort', 'Aorta']]) {
    const got = await page.evaluate((q) => { const it = window.AnpLabExplore.current._spots().find(q); return it ? it.name : null; }, q);
    ok(got === want, `${w}: find "${q}" gave ${got}`);
  }
  ok(!errs.length, `${w}: console errors: ${errs.join(' | ')}`);
  console.log(`${w}${DARK ? ' dark' : ''}: done (${fails} failing so far)`);
  await ctx.close();
}
await browser.close();
console.log(`${checks} checks, ${fails} failing`);
process.exit(fails ? 1 : 0);
