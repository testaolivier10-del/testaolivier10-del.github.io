#!/usr/bin/env node
/* Tools v2 sweep: A&P 3D anatomy (docs/tools-v2-anp-anatomy-3d-brief.md; docs/tools-v2-builder-brief.md step 5).
   The 3D body is slow in headless Chromium (software WebGL), so one width per process, one browser at a time.

   Per width (default mode), light or --dark:
     - the loading still is there before the model (the stage is never empty) and the canvas is the stage's size;
     - each of the five regions at its landing (its first part named): no sideways scroll; the body is the largest
       thing on the stage; the card sits inside the picture, 4 px clear of Find a part, Reset view, the credit and the
       cue, and off the ring where its leader ends; the card, the viewer's selection and the cause line name the same
       part, and the cause line says that part's "at"; on phones (640 px and under) the cause line is at most two rows
       and one constant height; every pill inside it; no rendered text under 11 px; the tabs inside the stage;
     - the first visit cue: inside the picture, clear of the card and the buttons, and a tap where it points names the
       part it points at (then it leaves);
     - a real tap (mouse, or touch on phones) on a part names what the viewer picked; a tap on empty space lets go;
     - find by name forgives (a slip in a long word) and crosses regions (the tab follows);
     - with --all, every part of every region named by find, each state checked as above.
   --frames (motion on; use --width 390 and 1440): every animation frame through a tap, a reversal (a second tap mid
     ease), a region change and a find across regions: the card and the cause line never show while the picture
     still moves, never name the part before, and agree with each other and the viewer whenever shown; leaving for
     Test yourself mid change leaves nothing behind; reduced motion gives the card at once; Test yourself: a quiz
     answer right and one wrong, recorded as anatomy-3d:<structure>:name|point; the locked state shows the Premium
     card.
   --perf (CPU x4): a full turn of the body by drag; median and p95 frame time (and the same for the flagship's
     fertilizer knob with --flagship).
   Usage: node scripts/tools-v2/anp-anatomy-3d-sweep.mjs --width 390 [--dark] [--all] [--frames] [--perf] [--flagship]
          [--shots <dir>] [--port <n>] [--real]   (--real: the viewer's shadows and anti-aliasing on, for shots)
   Needs playwright (PW_ROOT names a folder whose node_modules has it) and Chromium (CHROMIUM_PATH). */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, mkdirSync, readFileSync } from 'node:fs';
import { dirname, extname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const SELF = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(dirname(SELF)));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(k);
const WIDTHS = [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
const SHOTS = arg('--shots', null), DARK = has('--dark');

if (!arg('--width', null)) {
  // every width in its own process, light then dark
  let pass = 0, fail = 0;
  for (const dark of [false, true]) for (const w of WIDTHS) {
    const a = ['--width', String(w), ...(dark ? ['--dark'] : []), ...(SHOTS ? ['--shots', SHOTS] : [])];
    const r = spawnSync(process.execPath, [SELF, ...a], { encoding: 'utf8', timeout: 40 * 60 * 1000 });
    const out = (r.stdout || '') + (r.stderr || '');
    const m = /(\d+) passed, (\d+) failed/.exec(out);
    if (m) { pass += +m[1]; fail += +m[2]; } else fail++;
    process.stdout.write(out.split('\n').filter(l => l.trim()).map(l => `[${a.join(' ')}] ${l}`).join('\n') + '\n');
  }
  console.log(`TOTAL ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) {
  try { ({ chromium } = createRequire((process.env.PW_ROOT || '/home/claude/testaolivier10-del.github.io') + '/')('playwright')); }
  catch (e2) { console.error('This sweep needs playwright (set PW_ROOT).'); process.exit(0); }
}
const EXE = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome') ? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' : undefined);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const file = resolve(ROOT, '.' + p);
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }); createReadStream(file).pipe(res);
});
await new Promise(ok => server.listen(+arg('--port', 0), '127.0.0.1', ok));
const PORT = server.address().port;
const URL0 = `http://127.0.0.1:${PORT}/anatomy-physiology/tools/anatomy-3d.html`;
const W = +arg('--width', 390);
const H = W < 500 ? 844 : W < 1100 ? 1024 : W >= 1900 ? 1080 : 900;
const PHONE = W <= 640;
let pass = 0; const fails = [];
const T = (c, msg) => { if (c) pass++; else { fails.push(msg); if (process.env.LIVE) console.log('FAIL ' + msg); } };
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const DATA = JSON.parse(readFileSync(join(ROOT, 'anatomy-physiology/data/tools/anatomy-3d.json'), 'utf8'));
const BYID = Object.fromEntries(DATA.structures.map(s => [s.id, s]));
const PREMIUM = readFileSync(join(ROOT, 'assets/premium.js'), 'utf8');
const VIEWER = readFileSync(join(ROOT, 'assets/body3d/viewer.js'), 'utf8');

async function open(opts = {}) {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: opts.w || W, height: opts.h || H }, serviceWorkers: 'block', hasTouch: (opts.w || W) < 900,
    isMobile: (opts.w || W) < 500, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  if (!opts.locked) await ctx.route('**/assets/premium.js', r => r.fulfill({ contentType: 'application/javascript', body: PREMIUM.replace('function has(course) {', 'function has(course) { return true;') }));
  if (opts.hold) await ctx.route('**/body3d.glb*', () => {});
  // Headless Chromium draws WebGL in software, slowly on a busy machine: unless --real (or a perf run), the served viewer
  // skips its shadows and anti-aliasing (the test's copy only, as premium.js above). Geometry, picking, timing and
  // every state are the same; the preview's shots use --real.
  if (!has('--real') && !opts.real) await ctx.route('**/assets/body3d/viewer.js', r => r.fulfill({ contentType: 'application/javascript',
    body: VIEWER.replace('renderer.shadowMap.enabled = true;', 'renderer.shadowMap.enabled = false;').replace('antialias:true', 'antialias:false') }));
  await ctx.route(u => !u.href.startsWith(`http://127.0.0.1:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
  const page = await ctx.newPage(); const errs = [];
  page.setDefaultTimeout(300000);
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.addInitScript(([d, noCue]) => { try { localStorage.setItem('nremt_theme', d ? 'dark' : 'light'); if (noCue) localStorage.setItem('tk2c:anp-anatomy-3d', '1'); } catch (e) {} }, [DARK || !!opts.dark, !!opts.noCue]);
  await page.goto(URL0 + (opts.q || ''));
  return { browser, ctx, page, errs };
}
async function until(page, fn, a, n = 900) { for (let i = 0; i < n; i++) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(150); } return false; }
const settledCard = page => until(page, () => {
  const ex = window.AnpAnatomyExplore && window.AnpAnatomyExplore.current, v = ex && ex._viewer();
  const c = document.querySelector('.ax .tk2-spot-card');
  return !!(v && v.loaded() && !v.settling() && c && !c.hidden && c.classList.contains('is-in') && document.querySelector('.ax .tk2-cause .tk2-cz'));
});
const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}-${W}${DARK ? '-dark' : ''}.png`, timeout: 300000 }); };

/* everything checked on one settled state */
async function check(page, tag, opts = {}) {
  const r = await page.evaluate(() => {
    const ex = window.AnpAnatomyExplore.current, v = ex._viewer(), q = s => document.querySelector(s), R = e => e.getBoundingClientRect();
    const stage = q('.ax'), scene = q('.ax-scene'), card = q('.ax .tk2-spot-card'), ring = q('.ax .tk2-spot-ring'), cause = q('.ax .tk2-cause');
    const rect = e => { if (!e || e.hidden) return null; const b = R(e); return b.width ? { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height } : null; };
    const pills = [...cause.querySelectorAll('.tk2-cz')].map(e => ({ t: e.textContent, r: rect(e) }));
    const small = [];
    stage.querySelectorAll('*').forEach(e => {
      if (!e.childNodes.length || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
      const b = R(e); if (!b.width || !b.height) return;
      const st = getComputedStyle(e); if (st.visibility === 'hidden' || st.display === 'none' || +st.opacity === 0) return;
      if (e.closest('.tk2-sr') || e.closest('[hidden]') || e.closest('.bv-loading[hidden]')) return;
      const fs = parseFloat(st.fontSize) * (window.visualViewport ? 1 : 1);
      if (fs < 11) small.push(e.className + ':' + fs);
    });
    const kids = [...stage.children].filter(e => e.offsetParent).map(e => ({ c: e.className, a: R(e).width * R(e).height }));
    const ringC = ring ? { x: +ring.getAttribute('cx') + R(q('.ax-over')).left, y: +ring.getAttribute('cy') + R(q('.ax-over')).top } : null;
    const sel = v.selected(), s = sel && window.AnpAnatomyExplore.current.tabs.flatMap(t => t.items).find(x => x.id === sel);
    // what a tap on the ring would pick (the viewer's own picker), and the leader of a card standing off its ring
    const ringHit = ring ? v.hit(+ring.getAttribute('cx'), +ring.getAttribute('cy')) : null;
    const lead = q('.ax .tk2-spot-lead'), leadOk = !!lead && lead.classList.contains('is-in') && lead.getAttribute('d');
    return { scroll: document.documentElement.scrollWidth - innerWidth, scene: rect(scene), card: rect(card), cardText: card && !card.hidden ? card.querySelector('.tk2-spot-t').textContent : null,
      find: rect(q('.ax-find')), reset: rect(q('.ax-reset')), credit: rect(q('.ax-credit')), cue: rect(q('.tk2-cue')), cause: rect(cause), pills, small,
      kids, ringC, ringHit, leadOk, sel, selName: s ? (s.label || s.name) : null, selAt: s ? s.at : null, tabs: [...document.querySelectorAll('.ax .tk2-tab')].map(rect), stage: rect(stage),
      tabFit: [...document.querySelectorAll('.ax .tk2-tab')].map(b => b.scrollWidth <= b.clientWidth + 1 && [...b.children].every(c => { const cr = R(c), br = R(b); return cr.width <= 1 || (cr.left >= br.left - 1 && cr.right <= br.right + 1); })),
      canvas: rect(q('.ax-slot canvas')) };
  });
  const inside = (a, b, m = 1) => a && b && a.l >= b.l - m && a.r <= b.r + m && a.t >= b.t - m && a.b <= b.b + m;
  const meet = (a, b, g = 4) => a && b && a.l < b.r + g && a.r > b.l - g && a.t < b.b + g && a.b > b.t - g;
  T(r.scroll <= 0, `${tag}: sideways scroll ${r.scroll}px`);
  T(r.small.length === 0, `${tag}: text under 11 px: ${r.small.slice(0, 4).join(', ')}`);
  const big = r.kids.reduce((m, k) => k.a > m.a ? k : m, { a: 0 });
  T(/ax-scene/.test(big.c), `${tag}: the largest thing on the stage is ${big.c}, not the body`);
  T(r.canvas && r.scene && Math.abs(r.canvas.w - r.scene.w) < 2 && Math.abs(r.canvas.h - r.scene.h) < 2, `${tag}: the canvas does not fill the picture ${JSON.stringify([r.canvas, r.scene])}`);
  T(r.tabs.every(t => t && t.l >= r.stage.l - 1 && t.r <= r.stage.r + 1), `${tag}: a tab sticks out of the stage`);
  T(r.tabFit.every(Boolean), `${tag}: a tab's name overflows its tab`);
  T(!meet(r.find, r.reset, 4), `${tag}: Find a part meets Reset view`);
  if (opts.card !== false) {
    T(!!r.card, `${tag}: no card`);
    if (r.card) {
      T(inside(r.card, r.scene, 0), `${tag}: the card leaves the picture`);
      T(!meet(r.card, r.find), `${tag}: the card meets Find a part`);
      T(!meet(r.card, r.reset), `${tag}: the card meets Reset view`);
      T(!meet(r.card, r.credit), `${tag}: the card meets the credit`);
      T(!r.cue || !meet(r.card, r.cue), `${tag}: the card meets the cue`);
      T(!r.ringC || !(r.ringC.x > r.card.l - 4 && r.ringC.x < r.card.r + 4 && r.ringC.y > r.card.t - 4 && r.ringC.y < r.card.b + 4), `${tag}: the card covers the point it names`);
      T(r.cardText === r.selName, `${tag}: the card says ${r.cardText}, the viewer selected ${r.selName}`);
      T(r.ringHit === r.sel, `${tag}: a tap on the ring picks ${r.ringHit}, not ${r.sel}`);
      if (r.ringC) { const dx = Math.max(r.card.l - r.ringC.x, 0, r.ringC.x - r.card.r), dy = Math.max(r.card.t - r.ringC.y, 0, r.ringC.y - r.card.b);
        T(Math.hypot(dx, dy) < 14 || r.leadOk, `${tag}: the card stands ${Math.round(Math.hypot(dx, dy))} px off its ring with no leader`); }
      T(r.pills[0] && r.pills[0].t === r.selName && r.pills[1] && r.pills[1].t === r.selAt, `${tag}: the cause line says ${r.pills.map(p => p.t).join(' / ')} for ${r.selName}`);
      if (opts.expect) T(r.sel === opts.expect, `${tag}: expected ${opts.expect}, selected ${r.sel}`);
    }
  }
  T(r.pills.every(p => inside(p.r, r.cause, 1)), `${tag}: a pill leaves the cause line`);
  if (PHONE) {
    const row = r.pills.length ? Math.max(...r.pills.map(p => p.r.h)) : 30;
    const rows = r.pills.length ? new Set(r.pills.map(p => Math.round(p.r.t / 4))).size : 0;
    T(rows <= 2, `${tag}: the cause line has ${rows} rows on a phone`);
    heights.add(Math.round(r.cause.h));
    T(row < 60, `${tag}: a pill wraps (${row} px)`);
  }
  if (r.cue) { T(inside(r.cue, r.scene, 1), `${tag}: the cue leaves the picture`); T(!meet(r.cue, r.find) && !meet(r.cue, r.reset), `${tag}: the cue meets a button`); }
  return r;
}
const heights = new Set();

/* --------------------------------------------------------------- sweep */
async function sweep() {
  // the loading still (the model held back): never an empty stage
  {
    const { browser, page, errs } = await open({ hold: true });
    await until(page, () => { const p = document.querySelector('.ax-slot .bv-poster'); return p && p.complete && p.naturalWidth > 0; }, null, 300);
    const st = await page.evaluate(() => { const p = document.querySelector('.ax-slot .bv-poster'), s = document.querySelector('.ax-scene').getBoundingClientRect(), b = p && p.getBoundingClientRect();
      return { ok: !!(p && p.naturalWidth), h: b && b.height, sh: s.height, inside: b && b.top >= s.top - 1 && b.bottom <= s.bottom + 1 }; });
    T(st.ok, `loading: no still of the body while the model loads`);
    T(st.ok && Math.abs(st.h - st.sh) < 3 && st.inside, `loading: the still does not fill the picture's height ${JSON.stringify(st)}`);
    await shot(page, 'loading');
    T(!errs.length, `loading: console errors ${errs.join(' | ')}`);
    await browser.close();
  }
  const { browser, page, errs } = await open();
  T(await settledCard(page), 'landing: the first part never named');
  await page.waitForTimeout(400);
  await check(page, 'landing skeleton', { expect: 'femur' });
  T(await page.evaluate(() => !!document.querySelector('.tk2-cue')), 'landing: no first visit cue');
  await shot(page, 'land');
  // the cue points where a tap names a part of the region: tap there
  const cueAt = await page.evaluate(() => { const c = window.AnpAnatomyExplore.current._cueAt(), r = document.querySelector('.ax-slot canvas').getBoundingClientRect(); return c ? { id: c.id, x: r.left + c.x, y: r.top + c.y } : null; });
  T(!!cueAt, 'landing: the cue has no part under it');
  if (cueAt) {
    if (W < 900) await page.touchscreen.tap(cueAt.x, cueAt.y); else await page.mouse.click(cueAt.x, cueAt.y);
    T(await settledCard(page), 'tap at the cue: no card');
    await page.waitForTimeout(300);
    await check(page, 'tap at the cue', { expect: cueAt.id });
    T(await page.evaluate(() => !document.querySelector('.tk2-cue')), 'tap at the cue: the cue stays');
  }
  // each region at its landing
  for (const t of DATA.explore.tabs.slice(1)) {
    await page.click(`.ax .tk2-tab[data-v="${t.id}"]`);
    T(await settledCard(page), `${t.id}: nothing named`);
    await page.waitForTimeout(300);
    await check(page, `tab ${t.id}`, { expect: t.first });
    await shot(page, `tab-${t.id}`);
  }
  // a real tap on a part of the skeleton, then on empty space
  await page.click('.ax .tk2-tab[data-v="skeleton"]');
  await settledCard(page);
  for (const id of ['frontal-bone', 'humerus']) {
    const pt = await page.evaluate(id => { const v = window.AnpAnatomyExplore.current._viewer(), p = v.project(id), r = document.querySelector('.ax-slot canvas').getBoundingClientRect(); return p ? [r.left + p.x, r.top + p.y] : null; }, id);
    if (!pt) { T(false, `tap: ${id} is not on screen`); continue; }
    if (W < 900) await page.touchscreen.tap(pt[0], pt[1]); else await page.mouse.click(pt[0], pt[1]);
    T(await settledCard(page), `tap ${id}: no card`);
    await page.waitForTimeout(300);
    const r = await check(page, `tap ${id}`);
    T(r.sel === id || (r.sel && BYID[r.sel] && BYID[r.sel].system === 'skeletal'), `tap ${id}: selected ${r.sel}`);
    if (id === 'humerus') await shot(page, 'tap-humerus');
  }
  const empty = await page.evaluate(() => { const r = document.querySelector('.ax-slot canvas').getBoundingClientRect(); return [r.left + 24, r.top + r.height * 0.55]; });
  if (W < 900) await page.touchscreen.tap(empty[0], empty[1]); else await page.mouse.click(empty[0], empty[1]);
  T(await until(page, () => { const c = document.querySelector('.ax .tk2-spot-card'); return c && c.hidden && !window.AnpAnatomyExplore.current._viewer().selected(); }, null, 200), 'tap on empty space: the card stays');
  T(await page.evaluate(() => !document.querySelector('.ax .tk2-cause .tk2-cz')), 'tap on empty space: the cause line stays');
  // find: a slip in a long word, across regions (from the skeleton to the abdomen)
  await page.click('.ax-find-b'); await page.fill('.ax-find-in', 'duodenun'); await page.press('.ax-find-in', 'Enter');
  T(await settledCard(page), 'find duodenun: no card');
  await page.waitForTimeout(300);
  const fr = await check(page, 'find duodenun', { expect: 'duodenum' });
  T(await page.evaluate(() => window.AnpAnatomyExplore.current.tab() === 'abdomen'), 'find duodenun: the tab did not follow');
  await shot(page, 'find');
  if (has('--all')) {
    for (const t of DATA.explore.tabs) for (const s of DATA.structures.filter(x => t.systems.includes(x.system))) {
      await page.evaluate(id => window.AnpAnatomyExplore.current.show(id), s.id);
      T(await settledCard(page), `all ${s.id}: no card`);
      await page.waitForTimeout(150);
      const r = await check(page, `all ${s.id}`, { expect: s.id });
      /* the named part's glow is drawn round its ring: the pixels there (card layer hidden) change when the part is let
         go (its glow eases out), so the part is what is drawn under the ring, not something in front of it */
      if (r.ringC) {
        const clip = { x: Math.max(0, r.ringC.x - 8), y: Math.max(0, r.ringC.y - 8), width: 16, height: 16 };
        await page.evaluate(() => { document.querySelector('.ax-over').style.visibility = 'hidden'; });
        const a = await page.screenshot({ clip, timeout: 300000 });
        await page.evaluate(() => { const v = window.AnpAnatomyExplore.current._viewer(); v.clear(); });
        await until(page, () => !window.AnpAnatomyExplore.current._viewer().settling(), null, 100);
        await page.waitForTimeout(250);
        const b = await page.screenshot({ clip, timeout: 300000 });
        await page.evaluate(() => { document.querySelector('.ax-over').style.visibility = ''; });
        const changed = await page.evaluate(async ([x, y]) => {
          const px = async b64 => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
            const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
          const p = await px(x), q = await px(y); let n = 0;
          for (let i = 0; i < p.length; i += 4) if (Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) + Math.abs(p[i + 2] - q[i + 2]) > 40) n++;
          return n;
        }, [a.toString('base64'), b.toString('base64')]);
        T(changed > 12, `all ${s.id}: no glow drawn at its ring (${changed} of 256 pixels change when it is let go)`);
      }
      if (SHOTS && (s.id === 'cervical-vertebrae' || s.id === 'septal-branches' || s.id === 'papillary-muscles')) await shot(page, `all-${s.id}`);
      void r;
    }
  }
  if (PHONE) T(heights.size === 1, `the cause line changes height on a phone: ${[...heights].join(', ')}`);
  T(!errs.length, `console errors: ${errs.join(' | ')}`);
  await browser.close();
}

/* --------------------------------------------------------------- frames */
async function frames() {
  const { browser, page, errs } = await open({ noCue: true });
  T(await settledCard(page), 'frames: landing');
  // record every frame in the page: what is drawn and what is said
  await page.evaluate(() => {
    window.__fr = []; window.__rec = true;
    const tick = () => {
      if (!window.__rec) return;
      const ex = window.AnpAnatomyExplore.current, v = ex._viewer(), c = document.querySelector('.ax .tk2-spot-card');
      const pills = [...document.querySelectorAll('.ax .tk2-cause .tk2-cz')].map(e => e.textContent);
      window.__fr.push({ t: performance.now(), settling: v.settling(), sel: v.selected(), card: c && !c.hidden ? c.querySelector('.tk2-spot-t').textContent : null, op: c && !c.hidden ? +getComputedStyle(c).opacity : 0, pills, tab: ex.tab() });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const names = Object.fromEntries(DATA.structures.map(s => [s.id, s.label || s.name]));
  async function act(label, fn, wait = 6000) {
    await page.evaluate(() => { window.__fr = []; });
    const t0 = await page.evaluate(() => performance.now());
    await fn();
    await page.waitForTimeout(wait);
    await settledCard(page);
    const fr = await page.evaluate(() => window.__fr);
    let bad = 0, mid = 0;
    for (const f of fr) {
      if (f.settling) mid++;
      if (f.card && f.settling) { bad++; fails.push(`${label}: the card shows while the picture still moves (${f.card})`); break; }
      if (f.pills.length && !f.card) { bad++; fails.push(`${label}: the cause line speaks before the card (${f.pills.join(' / ')})`); break; }
      if (f.card && f.card !== names[f.sel]) { bad++; fails.push(`${label}: the card says ${f.card}, the viewer has ${f.sel}`); break; }
      if (f.card && f.pills[0] && f.pills[0] !== f.card) { bad++; fails.push(`${label}: the cause line says ${f.pills[0]}, the card ${f.card}`); break; }
    }
    if (!bad) pass++;
    T(fr.length > 4, `${label}: only ${fr.length} frames recorded`);
    T(mid > 0, `${label}: no frame caught mid change`);
    return { fr, t0, mid };
  }
  const tapAt = async id => {
    const pt = await page.evaluate(id => { const v = window.AnpAnatomyExplore.current._viewer(), p = v.project(id), r = document.querySelector('.ax-slot canvas').getBoundingClientRect(); return p ? [r.left + p.x, r.top + p.y] : null; }, id);
    if (W < 900) await page.touchscreen.tap(pt[0], pt[1]); else await page.mouse.click(pt[0], pt[1]);
  };
  const a = await act('tap', () => tapAt('humerus'));
  // a frame mid ease, for the preview
  if (SHOTS) {
    await tapAt('frontal-bone'); await page.waitForTimeout(120);
    await page.screenshot({ path: `${SHOTS}/mid-glow-${W}.png`, timeout: 300000 });
    await settledCard(page);
  }
  // reversal: a second tap while the first part still eases in: the first never gets its card
  const rv = await act('reversal', async () => { await tapAt('femur'); await page.waitForTimeout(90); await tapAt('frontal-bone'); });
  const fem = rv.fr.findIndex(f => f.sel === 'femur'), after = fem < 0 ? -1 : rv.fr.findIndex((f, i) => i > fem && f.sel === 'frontal-bone');
  T(after < 0 || !rv.fr.slice(after).some(f => f.card === 'Femur'), 'reversal: the first part named after the second tap');
  T(rv.fr.length && rv.fr[rv.fr.length - 1].card === 'Frontal bone', 'reversal: the second part is not the one named at the end');
  // region change: the camera travels, the card waits
  const tc = await act('region', () => page.click('.ax .tk2-tab[data-v="heart"]'), 4000);
  if (SHOTS) {
    await page.click('.ax .tk2-tab[data-v="lungs"]'); await page.waitForTimeout(260);
    await page.screenshot({ path: `${SHOTS}/mid-region-${W}.png`, timeout: 300000 });
    await settledCard(page);
  }
  void tc;
  // find across regions
  await act('find', async () => { await page.click('.ax-find-b'); await page.fill('.ax-find-in', 'kidneys'); await page.press('.ax-find-in', 'Enter'); });
  T(await page.evaluate(() => window.AnpAnatomyExplore.current.current() === 'kidneys'), 'find kidneys: not named');
  // leave for Test yourself mid change, then come back
  await page.click('.ax .tk2-tab[data-v="brain"]'); await page.waitForTimeout(80);
  await page.click('.ls-modes button:has-text("Test yourself")');
  await page.waitForTimeout(2500);
  const left = await page.evaluate(() => ({ card: !!document.querySelector('.ax .tk2-spot-card:not([hidden])') && !!document.querySelector('.ax').offsetParent,
    view: document.querySelector('.a3-view').parentNode.className, q: !!document.querySelector('.a3-q').textContent.trim() || !!document.querySelector('.a3-row').textContent.trim() }));
  T(!left.card, 'leaving mid change: a card stays on screen');
  T(/a3-stage/.test(left.view), `Test yourself: the body is not on its stage (${left.view})`);
  T(left.q, 'Test yourself: no question or controls');
  await shot(page, 'test');
  // a quiz answer, wrong then (next question) right; the record ids
  await page.evaluate(() => { window.__rec2 = []; const c = window.AnpCore; if (c) { const f = c.toolResult; c.toolResult = function(k, items){ (items || []).forEach(i => window.__rec2.push(i.id + ':' + i.correct)); return f.apply(this, arguments); }; } });
  await page.click('.a3-modes [data-m="quiz"]');
  await page.waitForTimeout(2500);
  for (let k = 0; k < 2; k++) {
    const q = await page.evaluate(() => { const r = window.AnpAnatomyExplore.current; void r; return { input: !!document.querySelector('.a3-input'), choices: [...document.querySelectorAll('.a3-choice')].map(b => b.textContent), show: !!document.querySelector('.a3-show') }; });
    if (q.input) { await page.fill('.a3-input', k ? 'zzz' : 'not a structure'); await page.press('.a3-input', 'Enter'); }
    else if (q.choices.length) await page.click('.a3-choice >> nth=0');
    else await page.click('.a3-show');
    await page.waitForTimeout(1200);
    T(await page.evaluate(() => !!document.querySelector('.a3-verdict')), `quiz ${k}: no verdict`);
    if (k === 0) await shot(page, 'quiz-answer');
    await page.click('.a3-next');
    await page.waitForTimeout(1500);
  }
  const recs = await page.evaluate(() => window.__rec2);
  T(recs.length === 2 && recs.every(x => /^anatomy-3d:[a-z0-9-]+:(name|point):(true|false)$/.test(x)), `quiz: records ${JSON.stringify(recs)}`);
  await page.click('.ls-modes button:has-text("Explore")');
  await until(page, () => /ax-slot/.test(document.querySelector('.a3-view').parentNode.className), null, 200);
  T(await settledCard(page), 'back to Explore: nothing named');
  T(await page.evaluate(() => /ax-slot/.test(document.querySelector('.a3-view').parentNode.className)), 'back to Explore: the body did not come back');
  T(!errs.length, `frames: console errors ${errs.join(' | ')}`);
  await browser.close();
  // reduced motion: the result at once, a short fade
  {
    const r = await open({ reduced: true, noCue: true });
    T(await settledCard(r.page), 'reduced motion: landing');
    const pt = await r.page.evaluate(() => { const v = window.AnpAnatomyExplore.current._viewer(), p = v.project('humerus'), b = document.querySelector('.ax-slot canvas').getBoundingClientRect(); return [b.left + p.x, b.top + p.y]; });
    const t0 = Date.now();
    if (W < 900) await r.page.touchscreen.tap(pt[0], pt[1]); else await r.page.mouse.click(pt[0], pt[1]);
    T(await settledCard(r.page), 'reduced motion: no card');
    T(await r.page.evaluate(() => !document.querySelector('.ax .tk2-spot-card.is-grow')), 'reduced motion: the card grows');
    console.log(`reduced motion: card after ${Date.now() - t0} ms (headless)`);
    T(!r.errs.length, `reduced motion: console errors ${r.errs.join(' | ')}`);
    await r.browser.close();
  }
  // the real locked state: the Premium card, no errors
  {
    const r = await open({ locked: true });
    T(await until(r.page, () => !!document.querySelector('.anp-premium, .premium-gate, [data-premium-gate], .pm-gate, .levl-premium') || /Premium/.test((document.querySelector('main') || document.body).textContent), null, 200), 'locked: no Premium card');
    await r.page.waitForTimeout(1500);
    T(await r.page.evaluate(() => !document.querySelector('.ax .tk2-spot-card:not([hidden])')), 'locked: the tool ran anyway');
    await shot(r.page, 'locked');
    T(!r.errs.length, `locked: console errors ${r.errs.join(' | ')}`);
    await r.browser.close();
  }
  console.log(`frames: tap ${a.fr.length} frames (${a.mid} mid change), reversal ${rv.fr.length}`);
}

/* --------------------------------------------------------------- perf */
async function perf() {
  const out = {};
  const measure = async (page, label, fn) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.evaluate(() => { window.__ft = []; let last = 0; window.__on = true; const f = t => { if (last) window.__ft.push(t - last); last = t; if (window.__on) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    await fn();
    const ft = await page.evaluate(() => { window.__on = false; return window.__ft; });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    ft.sort((x, y) => x - y);
    const q = p => ft.length ? ft[Math.min(ft.length - 1, Math.floor(p * ft.length))] : NaN;
    out[label] = { frames: ft.length, median: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1) };
    console.log(`perf ${label} at ${W}: ${ft.length} frames, median ${q(0.5).toFixed(1)} ms, p95 ${q(0.95).toFixed(1)} ms`);
  };
  if (has('--flagship')) {
    const browser = await chromium.launch({ executablePath: EXE });
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, serviceWorkers: 'block', hasTouch: W < 900 });
    await ctx.route('**/assets/premium.js', r => r.fulfill({ contentType: 'application/javascript', body: PREMIUM.replace('function has(course) {', 'function has(course) { return true;') }));
    await ctx.route(u => !u.href.startsWith(`http://127.0.0.1:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
    const page = await ctx.newPage();
    await page.addInitScript(() => { try { localStorage.setItem('tk2c:apenv-water-pollution', '1'); } catch (e) {} });
    await page.goto(`http://127.0.0.1:${PORT}/environmental-science/tools/water-pollution.html`);
    for (let i = 0; i < 200 && !(await page.evaluate(() => !!document.querySelector('.tk2-drag .tk2-knob'))); i++) await page.waitForTimeout(150);
    await page.waitForTimeout(1500);
    const k = await page.evaluate(() => { const e = document.querySelector('.tk2-drag .tk2-knob'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    if (k) await measure(page, 'flagship knob', async () => {
      await page.mouse.move(k[0], k[1]); await page.mouse.down();
      for (let i = 0; i <= 60; i++) { await page.mouse.move(k[0] + 120 * Math.sin(i / 10), k[1]); await page.waitForTimeout(16); }
      await page.mouse.up(); await page.waitForTimeout(600);
    });
    else console.log('perf: the flagship knob was not found');
    await browser.close();
  }
  {
    // software WebGL in headless Chromium: the viewer's shadows and anti-aliasing are off unless --real (see open())
    const { browser, page } = await open({ noCue: true });
    await settledCard(page);
    const b = await page.evaluate(() => { const r = document.querySelector('.ax-slot canvas').getBoundingClientRect(); return [r.left + r.width * 0.3, r.top + r.height * 0.5, r.width * 0.4]; });
    // our own work per drawn frame (the card following the body), apart from the drawing itself
    await page.evaluate(() => { const sp = window.AnpAnatomyExplore.current._spots(), f = sp.place; window.__js = []; sp.place = function(){ const t = performance.now(); f.apply(this, arguments); window.__js.push(performance.now() - t); }; });
    await measure(page, 'turn the body', async () => {
      await page.mouse.move(b[0], b[1]); await page.mouse.down();
      for (let i = 0; i <= 30; i++) { await page.mouse.move(b[0] + b[2] * i / 30, b[1] + 10 * Math.sin(i / 4)); await page.waitForTimeout(16); }
      await page.mouse.up(); await page.waitForTimeout(600);
    });
    {
      const js = (await page.evaluate(() => window.__js)).sort((x, y) => x - y);
      const q = p => js.length ? js[Math.min(js.length - 1, Math.floor(p * js.length))].toFixed(2) : 'n/a';
      console.log(`perf the card following the body at ${W} (CPU x4): ${js.length} calls, median ${q(0.5)} ms, p95 ${q(0.95)} ms`);
    }
    await measure(page, 'tap a part', async () => {
      for (const id of ['frontal-bone', 'humerus', 'femur']) {
        const pt = await page.evaluate(id => { const v = window.AnpAnatomyExplore.current._viewer(), p = v.project(id), r = document.querySelector('.ax-slot canvas').getBoundingClientRect(); return p ? [r.left + p.x, r.top + p.y] : null; }, id);
        if (pt) await page.mouse.click(pt[0], pt[1]);
        await page.waitForTimeout(900);
      }
    });
    await browser.close();
  }
  if (has('--baseline')) {
    // the same viewer on the NREMT body map (not on tools v2 hooks): what the drawing alone costs on this machine
    const browser = await chromium.launch({ executablePath: EXE });
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, serviceWorkers: 'block' });
    if (!has('--real')) await ctx.route('**/assets/body3d/viewer.js', r => r.fulfill({ contentType: 'application/javascript',
      body: VIEWER.replace('renderer.shadowMap.enabled = true;', 'renderer.shadowMap.enabled = false;').replace('antialias:true', 'antialias:false') }));
    await ctx.route(u => !u.href.startsWith(`http://127.0.0.1:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
    const page = await ctx.newPage(); page.setDefaultTimeout(300000);
    await page.goto(`http://127.0.0.1:${PORT}/nremt/body-map.html`);
    for (let i = 0; i < 900 && !(await page.evaluate(() => { const l = document.querySelector('.bv-loading'); return !!l && l.hidden; })); i++) await page.waitForTimeout(150);
    await page.waitForTimeout(2000);
    const b = await page.evaluate(() => { const r = document.querySelector('.bv-canvas').getBoundingClientRect(); return [r.left + r.width * 0.3, r.top + r.height * 0.5, r.width * 0.4]; });
    await measure(page, 'NREMT body map turn (same viewer)', async () => {
      await page.mouse.move(b[0], b[1]); await page.mouse.down();
      for (let i = 0; i <= 30; i++) { await page.mouse.move(b[0] + b[2] * i / 30, b[1] + 10 * Math.sin(i / 4)); await page.waitForTimeout(16); }
      await page.mouse.up(); await page.waitForTimeout(600);
    });
    await browser.close();
  }
  return out;
}

try {
  if (has('--perf')) await perf();
  else if (has('--frames')) await frames();
  else await sweep();
} catch (e) { fails.push('crash: ' + (e && e.stack || e)); }
server.close();
for (const f of fails) console.log('FAIL ' + f);
console.log(`${W}${DARK ? ' dark' : ''}: ${pass} passed, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
