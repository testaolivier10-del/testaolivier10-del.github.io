#!/usr/bin/env node
/* Sweep test for the AP® Human Geography FRQ coach v2 Explore (docs/tools-v2-hug-frq-coach-brief.md;
   docs/tools-v2-builder-brief.md step 5). At each width, light or dark (--dark, asserted really dark):
     every question (8) at every rung of the ladder (5), drawn to the end: the prompt's verb, the cause line, the
     rubric line and the highlighted pieces all name the rung drawn (read from the page); every written piece is
     highlighted exactly when the rung's rubric needs it and quiet when it does not; nothing clipped (every text inside
     the scene, the answer never overflows its lines); every text at least 4 px from every other text (stop names,
     drawing labels, the question, the answer, the rubric, the buttons) and from the knob; no text under 11 px; the
     scene the largest thing on the stage; the cause line at most two rows on phones, one height for every state; no
     sideways scroll; tap targets at least 40 px. Then: the landing cue (inside the scene, on no text), a real tap on a
     stop name (touch on phones) moves the ladder, Next question turns the page, the fit at 390x844, 1024x768 and
     1280x800 (knob, scene and cause line in view at once), and no console errors.
   Premium is unlocked only in this test (premium.js routed, never committed).
   Usage: node scripts/tools-v2/hug-frq-coach-sweep.mjs [--width 390] [--dark] [--shots <dir>]
   Run one width per process. (needs playwright) */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, mkdirSync } from 'node:fs';
import { dirname, extname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const DARK = process.argv.includes('--dark'), SHOTS = arg('--shots', '');
const ALL = [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
const WIDTHS = arg('--width', '') ? [+arg('--width', '')] : ALL;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) { try { ({ chromium } = createRequire((process.env.PW_ROOT || '/opt/npm-tools') + '/')('playwright')); } catch (e2) { console.error('needs playwright'); process.exit(0); } }
const server = createServer((req, res) => { let f = resolve(ROOT, '.' + decodeURIComponent(req.url.split('?')[0])); if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); createReadStream(f).pipe(res); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port, URL = BASE + '/human-geography/tools/frq-coach.html';
const EXE = existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome') ? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' : undefined;
const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
let fails = 0, checks = 0;
const fail = (m) => { fails++; if (fails < 60) console.log('FAIL ' + m); };
const ok = (c, m) => { checks++; if (!c) fail(m); };
const sfx = DARK ? '-dark' : '';

async function open(ctx, h) {
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.FrqCoachExplore && document.querySelector('.fcx-scene') && document.querySelector('.fcx-scene').clientWidth > 0, null, { timeout: 20000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(500);
  return { page, errs };
}
async function newCtx(w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', hasTouch: w < 900, isMobile: w < 500, bypassCSP: true });
  await ctx.route(u => !u.href.startsWith(BASE), r => r.abort());
  await ctx.route('**/assets/premium.js', async r => { const res = await r.fetch(); const body = (await res.text()).replace('function has(course) {', 'function has(course) { return true;'); await r.fulfill({ response: res, body }); });
  await ctx.addInitScript((d) => { try { localStorage.setItem('nremt_theme', d ? 'dark' : 'light'); } catch (e) {} }, DARK);
  return ctx;
}

// every check on one drawn state, in the page
const CHECK = () => {
  const E = window.FrqCoachExplore, F = window.ApHugMath.frqCoach, s = E.state(), out = [], v = s.verb, R = (e) => e.getBoundingClientRect();
  const scene = document.querySelector('.fcx-scene'), sc = R(scene);
  if (s.drawn !== s.stop) out.push('not drawn to the end');
  if (s.promptVerb.replace(/\s+/g, ' ') !== F.VERBS[v].name) out.push('prompt verb ' + s.promptVerb);
  if (!s.take && (s.cause[0] !== F.VERBS[v].name || s.cause[1] !== F.ADD_LABEL[v] || s.cause.length !== 3)) out.push('cause line ' + s.cause.join(' > '));
  if (s.rubric !== F.RUBRIC_LINE[v] || s.rubricFor !== v) out.push('rubric line ' + s.rubric);
  F.PIECES.forEach((k) => { const p = s.pieces[k], w = F.WRITTEN[v].includes(k), n = F.NEEDED[v].includes(k);
    if (w !== (p.shown === p.n) || (!w && p.shown)) out.push(k + ' written ' + p.shown + '/' + p.n);
    if (w && p.on !== n) out.push(k + ' highlight ' + p.on); if (w && p.quiet === n) out.push(k + ' quiet ' + p.quiet); });
  // texts to keep apart (each one rect; the answer and the prompt by their lines)
  const T = [];
  const add = (e, name) => { if (!e || e.closest('[hidden]')) return; const r = R(e); if (r.width > 0 && r.height > 0) T.push({ name, r, e }); };
  add(document.querySelector('.fcx-kick'), 'kicker'); add(document.querySelector('.fcx-next'), 'next');
  [...document.querySelectorAll('.fcx-prompt')].forEach((e) => { const rg = document.createRange(); rg.selectNodeContents(e); [...rg.getClientRects()].forEach((r, i) => r.width > 2 && T.push({ name: 'prompt line ' + i, r, e })); });
  add(document.querySelector('.fcx-akick'), 'answer kicker');
  const words = [...document.querySelectorAll('.fcx-w.is-in')];
  if (words.length) { const a = words.map(R); T.push({ name: 'answer', r: { left: Math.min(...a.map(r => r.left)), right: Math.max(...a.map(r => r.right)), top: Math.min(...a.map(r => r.top)), bottom: Math.max(...a.map(r => r.bottom)) }, e: words[0] }); }
  add(document.querySelector('.fcx-rub'), 'rubric');
  document.querySelectorAll('.fcx-stop span').forEach((e, i) => add(e, 'stop ' + e.textContent));
  document.querySelectorAll('.fcx-al').forEach((e) => add(e, 'art ' + e.textContent));
  const meet = (a, b, g) => a.left < b.right + g && a.right > b.left - g && a.top < b.bottom + g && a.bottom > b.top - g;
  for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
    const a = T[i], b = T[j];
    if (/^prompt line/.test(a.name) && /^prompt line/.test(b.name)) continue;
    if (/^stop /.test(a.name) && /^stop /.test(b.name) && a.e.parentNode === b.e.parentNode) continue;   // two lines of one name
    if (meet(a.r, b.r, 4)) out.push(a.name + ' within 4 px of ' + b.name);
  }
  // the knob clear of every text
  const kn = document.querySelector('.fcx-drag .tk2-dot'); if (kn) { const kr = R(kn); T.forEach((t) => { if (meet(kr, t.r, 4)) out.push('knob within 4 px of ' + t.name); }); }
  // inside the scene; the answer never overflows its lines
  T.forEach((t) => { if (t.r.left < sc.left - 1 || t.r.right > sc.right + 1 || t.r.top < sc.top - 1 || t.r.bottom > sc.bottom + 1) out.push(t.name + ' outside the scene'); });
  const ans = document.querySelector('.fcx-ans'); if (ans.scrollHeight > ans.clientHeight + 1) out.push('answer overflows');
  const rub = R(document.querySelector('.fcx-rub')); if (words.length && Math.max(...words.map(w => R(w).bottom)) > rub.top - 2) out.push('answer runs into the rubric');
  // no text under 11 px
  T.forEach((t) => { let fs; if (t.e instanceof SVGElement) { const m = t.e.getScreenCTM(); fs = parseFloat(t.e.getAttribute('font-size')) * (m ? Math.hypot(m.a, m.b) : 1); } else fs = parseFloat(getComputedStyle(t.e).fontSize); if (fs < 10.95) out.push(t.name + ' ' + fs.toFixed(1) + ' px'); });
  [...document.querySelectorAll('.fcx .tk2-cz, .fcx .tk2-purpose, .fcx .tk2-how')].forEach((e) => { const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 10.95) out.push(e.className + ' ' + fs + ' px'); });
  // the scene is the largest thing on the stage
  const area = (r) => r.width * r.height;
  document.querySelectorAll('.fcx .tk2-head, .fcx-lines').forEach((e) => { if (area(R(e)) >= area(sc)) out.push(e.className + ' bigger than the scene'); });
  // the cause line
  const cz = document.querySelector('.fcx .tk2-cause'), zr = R(cz);
  cz.querySelectorAll('.tk2-cz').forEach((p) => { const q = R(p); if (q.right > zr.right + 1 || q.left < zr.left - 1) out.push('a pill sticks out of the cause line'); if (p.scrollWidth > p.clientWidth + 1) out.push('pill text clipped'); });
  const tops = new Set([...cz.querySelectorAll('.tk2-cz')].map((p) => Math.round(R(p).top / 8)));
  // tap targets
  [...document.querySelectorAll('.fcx-stop, .fcx-next')].forEach((e) => { const r = R(e); if (r.height < 39.5 || r.width < 39.5) out.push('small target ' + (e.textContent || e.className)); });
  if (document.scrollingElement.scrollWidth > window.innerWidth + 1) out.push('sideways scroll');
  return { errs: out, rows: tops.size, lines: Math.round(R(document.querySelector('.fcx-lines')).height), q: E.ctx() };
};

for (const w of WIDTHS) {
  const h = w < 500 ? 844 : w < 900 ? 1024 : w >= 1900 ? 1080 : 900;
  const ctx = await newCtx(w, h);
  const { page, errs } = await open(ctx, h);
  ok(await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark') === DARK, `${w}: theme is not ${DARK ? 'dark' : 'light'}`);
  // the landing cue
  await page.evaluate(() => { Object.keys(localStorage).forEach((k) => { if (/^tk2[ch]:|aphug_frqcoach_x1/.test(k)) localStorage.removeItem(k); }); });
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.FrqCoachExplore, null, { timeout: 20000 }); await page.waitForTimeout(1300);
  const cue = await page.evaluate(() => {
    const c = document.querySelector('.tk2-cue'); if (!c) return { none: true };
    const r = c.getBoundingClientRect(), sc = document.querySelector('.fcx-scene').getBoundingClientRect(), hits = [];
    document.querySelectorAll('.fcx-stop span, .fcx-al, .fcx-prompt, .fcx-w.is-in, .fcx-rub, .fcx-akick, .fcx-kick, .fcx-next, .fcx-drag .tk2-dot').forEach((e) => { const q = e.getBoundingClientRect(); if (q.width && q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top) hits.push(e.className.baseVal || e.className || e.textContent); });
    return { hits, out: r.left < sc.left - 1 || r.right > sc.right + 1 || r.top < sc.top - 1 || r.bottom > sc.bottom + 1, n: document.querySelectorAll('.tk2-cue, .tk2-chip').length };
  });
  ok(!cue.none, `${w}: no first visit cue`);
  if (!cue.none) { ok(!cue.hits.length, `${w}: the cue covers ${cue.hits.join(', ')}`); ok(!cue.out, `${w}: the cue is outside the scene`); ok(cue.n === 1, `${w}: ${cue.n} cues or chips`); }
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `land-${w}${sfx}.png`) });

  const ids = await page.evaluate(() => ['polders', 'green-revolution', 'city-models', 'transition', 'diffusion', 'boundaries', 'country-a-people', 'development']);
  const lineH = new Set(), rowsMax = { n: 0 };
  for (const id of ids) {
    await page.evaluate((i) => { window.FrqCoachExplore.question(i); }, id);
    await page.waitForTimeout(240);
    for (let st = 0; st < 5; st++) {
      await page.evaluate((s) => { window.FrqCoachExplore.stop(s, true); }, st);
      await page.waitForTimeout(st === 0 ? 260 : 160);
      const r = await page.evaluate(CHECK);
      ok(r.q === id, `${w} ${id}: the page shows ${r.q}`);
      r.errs.forEach((e) => fail(`${w} ${id} rung ${st}: ${e}`)); checks += 30;
      lineH.add(r.lines); rowsMax.n = Math.max(rowsMax.n, r.rows);
      if (SHOTS && (id === 'polders' || id === 'transition' || (st === 4 && w === 390))) await page.screenshot({ path: join(SHOTS, `${id}-${st}-${w}${sfx}.png`) });
    }
  }
  if (w < 700) ok(rowsMax.n <= 2, `${w}: the cause line takes ${rowsMax.n} rows`);
  ok(lineH.size === 1, `${w}: the lines box changes height (${[...lineH].join(', ')})`);

  // a real tap on a stop name moves the ladder; Next question turns the page
  await page.evaluate(() => window.FrqCoachExplore.stop(0, true));
  const tgt = await page.evaluate(() => { const b = document.querySelectorAll('.fcx-stop')[2]; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await page.waitForTimeout(200);
  if (w < 900) await page.touchscreen.tap(tgt[0], tgt[1]); else await page.mouse.click(tgt[0], tgt[1]);
  await page.waitForTimeout(2200);
  ok(await page.evaluate(() => { const s = window.FrqCoachExplore.state(); return s.stop === 2 && s.drawn === 2; }), `${w}: a tap on Explain did not move the ladder there`);
  const q0 = await page.evaluate(() => window.FrqCoachExplore.ctx());
  await page.evaluate(() => document.querySelector('.fcx-next').click());
  await page.waitForTimeout(2600);
  ok(await page.evaluate((q) => window.FrqCoachExplore.ctx() !== q && window.FrqCoachExplore.state().drawn === 2, q0), `${w}: Next question did not turn to a new question at the same rung`);
  ok(!errs.length, `${w}: console errors: ${errs.join(' | ')}`);
  await ctx.close();
}

// fit: the knob, the scene and the cause line in view at once (no inner scroll), at the three screens
if (!arg('--width', '') || ['390', '1024', '1280'].includes(arg('--width', ''))) {
  for (const [w, h] of [[390, 844], [1024, 768], [1280, 800]].filter(x => !arg('--width', '') || +arg('--width', '') === x[0])) {
    const ctx = await newCtx(w, h);
    const { page } = await open(ctx, h);
    for (let st = 0; st < 5; st++) {
      await page.evaluate((s) => window.FrqCoachExplore.stop(s, true), st); await page.waitForTimeout(150);
      const r = await page.evaluate(() => {
        const R = (e) => e.getBoundingClientRect(), sc = R(document.querySelector('.fcx-scene')), cz = R(document.querySelector('.fcx-lines')), kn = R(document.querySelector('.fcx-drag .tk2-knob'));
        const inner = [...document.querySelectorAll('.fcx, .fcx *')].some((e) => { const s = getComputedStyle(e); return /(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 1; });
        return { scB: sc.bottom, czB: cz.bottom, knT: kn.top, scT: sc.top, H: innerHeight, inner };
      });
      ok(r.scT >= 0 && r.scB <= r.H + 0.5 && r.czB <= r.H + 0.5 && r.knT >= 0, `fit ${w}x${h} rung ${st}: scene ${r.scT.toFixed(0)} to ${r.scB.toFixed(0)}, cause line to ${r.czB.toFixed(0)} of ${r.H}`);
      ok(!r.inner, `fit ${w}x${h}: an inner scroll`);
    }
    if (SHOTS) await page.screenshot({ path: join(SHOTS, `fit-${w}x${h}${sfx}.png`) });
    await ctx.close();
  }
}
await browser.close(); server.close();
console.log(`${fails ? 'FAILED' : 'passed'}: ${checks - fails} passed, ${fails} failed (${WIDTHS.join(', ')}${DARK ? ', dark' : ''})`);
process.exit(fails ? 1 : 0);
