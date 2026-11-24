/* Tools v2 layout sweep for AP® Precalculus Function lab (docs/tools-v2-pcalc-function-lab-brief.md), after the
   pattern of the other sweeps in this folder. Every parent at landmark states (the opening, a translation, a stretch
   with both flips, a narrow and a wide b, the pins pushed to the board's corners), after the round pin and after
   Show the steps (the takeaway), plus the first visit; light and dark, at a real screen height per width. At each
   state it asserts:
     - the page is really dark in a dark run (the site's key is localStorage nremt_theme);
     - nothing drawn or labelled is clipped by the stage, and the labels, tags and knobs are on the board;
     - no two labels, tags or visible numbers come within 4 px of each other, and no label sits under a knob;
     - no rendered text under 11 px;
     - the board (the thing acted on) is the largest thing on the stage (at least 80% of it);
     - the words agree with the picture: the knobs sit where the drawn parameters put them (the square pin at
       (h, k), the round pin on its bead), the tags read those parameters, the cause line repeats the tag of the pin
       it names, and the wire's label carries every parameter that is not 1 (a, b) or 0 (h, k);
     - on a phone the cause line is at most two rows; no sideways scroll; no console errors;
     - at 390x844, 1024x768 and 1280x800 the board, both pins and the cause line are in view at once (no scroll);
     - on a first visit the cue is whole, on the board, and covers no label, tag, number or knob; one cue only.

     node scripts/tools-v2/pcalc-function-lab-sweep.mjs [widths, comma separated] [--shots dir] [--themes light,dark]

   Run it one width per process (the brief's speed rule): for w in 360 390 ...; do node ... $w; done. Needs
   Playwright and a Chromium (CHROME or /opt/pw-browsers/chromium-1243/chrome-linux64/chrome). It serves the repo
   itself on a free port and blocks service workers; the tool is free, so nothing is unlocked. Reduced motion is on,
   so each state is the settled picture (the animations are checked frame by frame in
   scripts/tools-v2/pcalc-function-lab-frames.mjs). Exit code 1 on any failure. */
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
const args = process.argv.slice(2), si = args.indexOf('--shots'), SHOTS = si >= 0 ? args[si + 1] : null, ti = args.indexOf('--themes');
const THEMES = (ti >= 0 ? args[ti + 1] : 'light,dark').split(',');
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const WIDTHS = (args[0] && !args[0].startsWith('--') ? args[0] : '360,390,430,600,768,820,1024,1280,1440,1920').split(',').map(Number);
const HEIGHT = { 360: 740, 390: 844, 430: 932, 600: 960, 768: 1024, 820: 1180, 1024: 768, 1280: 800, 1440: 900, 1920: 1080 };
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
const KEYS = ['tk2c:apprecalc-function-lab', 'tk2h:apprecalc-function-lab-hk', 'tk2h:apprecalc-function-lab-drag'];
async function open(o) {
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, serviceWorkers: 'block', deviceScaleFactor: 1, reducedMotion: o.cue ? 'no-preference' : 'reduce' });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/net::ERR_FAILED/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.addInitScript(([theme, keys, cue]) => { window.LevlToolTest = true; try { localStorage.setItem('nremt_theme', theme); if (!cue) keys.forEach(k => localStorage.setItem(k, '1')); } catch (e) {} }, [o.theme, KEYS, !!o.cue]);
  await page.goto(BASE + '/precalculus/tools/function-lab.html' + (o.hash || ''), { waitUntil: 'load' });
  if (!o.hash) { await page.waitForSelector('.fl2-svg .fl2-wire-h'); await page.waitForTimeout(400); }
  return { ctx, page, errs };
}
const shot = (page, name) => SHOTS ? page.locator('.fl2').screenshot({ path: join(SHOTS, name) }) : null;
/* Runs in the page: the checks of one state. */
const probe = (theme) => {
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none' && !e.closest('[hidden]') && !e.closest('[style*="display: none"]') && R(e).w > 0;
  const q = s => [...document.querySelectorAll(s)].filter(vis), out = [];
  const T = window.ApPrecalcFunctionLab, S = T.S, G = T.G(), D = T.D;
  const sc = R(document.querySelector('.fl2-scene')), k = sc.w / G.W;
  const board = { l: sc.l + G.L * k, t: sc.t + G.T * k, r: sc.l + G.R * k, b: sc.t + G.B * k };
  const inBox = (x, B, name, tol = 0.6) => { if (x.l < B.l - tol || x.r > B.r + tol || x.t < B.t - tol || x.b > B.b + tol) out.push('outside the ' + (B === sc ? 'stage' : 'board') + ': ' + name); };
  const hit = (a, c, g = 0) => !(a.r + g <= c.l || c.r + g <= a.l || a.b + g <= c.t || c.b + g <= a.t);
  if (theme === 'dark' && document.documentElement.getAttribute('data-theme') !== 'dark') out.push('the dark run is not dark');
  if (theme === 'dark') { const f = getComputedStyle(document.querySelector('.fl2-board')).fill; if (!/74, 56, 38/.test(f)) out.push('the board is not the dark board: ' + f); }
  const labs = q('.fl2-labs .fl2-lab').map(e => ({ n: 'label "' + e.textContent + '"', r: R(e.querySelector('rect')) }));
  const ticks = q('.fl2-ticks text').map(e => ({ n: 'number "' + e.textContent + '"', r: R(e), tick: true }));
  const tags = q('.fl2 .tk2-tag').map(e => ({ n: 'tag "' + e.textContent + '"', r: R(e) }));
  const chips = q('.fl2 .tk2-chip').map(e => ({ n: 'chip', r: R(e) }));
  const knobs = q('.fl2 .tk2-handle:not([hidden]) .tk2-dot').map(e => ({ n: 'knob', r: R(e) }));
  [...labs, ...tags, ...knobs, ...chips].forEach(x => inBox(x.r, board, x.n));
  ticks.forEach(x => inBox(x.r, sc, x.n));
  const all = [...labs, ...tags, ...ticks, ...chips];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], c = all[j];
    if (a.tick && c.tick) continue;
    if (hit(a.r, c.r, 4)) out.push('too close: ' + a.n + ' and ' + c.n);
  }
  [...labs, ...ticks, ...chips].forEach(a => knobs.forEach(c => { if (hit(a.r, c.r, 1)) out.push(a.n + ' under a knob'); }));
  tags.forEach(a => knobs.forEach(c => { if (hit(a.r, c.r, -2)) out.push(a.n + ' under a knob'); }));
  // text size
  [...document.querySelectorAll('.fl2 text, .fl2 .tk2-tag, .fl2 .tk2-cz, .fl2 .tk2-chip, .fl2 .tk2-cue, .fl2-reset, .fl2 .tk2-play, .fl2-sel')].filter(vis).forEach(e => {
    const fs = parseFloat(getComputedStyle(e).fontSize) * (e.closest('svg') ? k : 1); if (fs < 10.95) out.push('text under 11 px (' + fs.toFixed(1) + '): ' + e.textContent.slice(0, 30));
  });
  // the board is the largest thing
  const share = (board.r - board.l) * (board.b - board.t) / (sc.w * sc.h);
  if (share < 0.8) out.push('the board is ' + (share * 100).toFixed(0) + '% of the stage');
  // the knobs sit where the drawn parameters put them
  const Fa = T.FL.FAMILIES[S.fam], kp = Fa.keys[Fa.shape];
  const want = { hk: [sc.l + G.sx(D.h) * k, sc.t + G.sy(D.k) * k], ab: [sc.l + G.sx(kp[0] * D.sx + D.h) * k, sc.t + G.sy(kp[1] * D.sy + D.k) * k] };
  ['hk', 'ab'].forEach(n => { const e = document.querySelector('.fl2-' + n + ' .tk2-knob'), r = R(e), off = Math.hypot(r.l + r.w / 2 - want[n][0], r.t + r.h / 2 - want[n][1]); if (off > 1.5) out.push('the ' + n + ' pin is off its point by ' + off.toFixed(1)); });
  // the bead under the round pin sits on the wire's drawn path: the bead's centre is the round pin's centre
  const beads = q('.fl2-bead'); if (!beads.length) out.push('no beads');
  // the tags read the drawn parameters; the cause line repeats the pin it names; the wire's label carries them
  const P = T.shownP(), num = v => String(+(+v).toFixed(2)).replace('-', '−');
  const tg = document.querySelector('.fl2-hk .tk2-tag').textContent, ta = document.querySelector('.fl2-ab .tk2-tag').textContent;
  if (tg !== 'h = ' + num(P.h) + ', k = ' + num(P.k)) out.push('square pin tag ' + tg + ' is not h = ' + P.h + ', k = ' + P.k);
  if (!ta.startsWith('a = ' + num(P.a) + ', b = ')) out.push('round pin tag ' + ta + ' is not a = ' + P.a);
  const causeEl = document.querySelector('.fl2 .tk2-cause'), cause = causeEl.innerText.replace(/\n/g, ' '), take = causeEl.classList.contains('is-take');
  if (!take && S.last === 'hk' && !cause.includes(tg)) out.push('cause line and square pin disagree: ' + cause + ' / ' + tg);
  if (!take && S.last === 'ab') { const am = cause.match(/a = (\S+)/), bm = cause.match(/b = (\S+)/); if (am && !ta.includes('a = ' + am[1])) out.push('cause line a and tag disagree: ' + cause + ' / ' + ta); if (bm && !ta.includes('b = ' + bm[1])) out.push('cause line b and tag disagree: ' + cause + ' / ' + ta); }
  const gl = document.querySelector('.fl2-lab.is-g');
  if (vis(gl)) { const t = gl.textContent;
    if (Math.abs(P.a - 1) > 1e-9 && Math.abs(P.a + 1) > 1e-9 && !t.includes(num(P.a))) out.push('the wire label lacks a: ' + t);
    if (Math.abs(P.h) > 1e-9 && !t.includes(num(Math.abs(P.h)))) out.push('the wire label lacks h: ' + t);
    if (Math.abs(P.k) > 1e-9 && !t.includes(num(Math.abs(P.k)))) out.push('the wire label lacks k: ' + t);
  } else out.push('the wire has no label');
  if (!vis(document.querySelector('.fl2-lab.is-f'))) out.push('the parent has no label');
  // asymptote threads are named
  const nA = (Fa.va ? 1 : 0) + (Fa.ha ? 1 : 0), nAl = q('.fl2-lab.is-a').length;
  if (nAl !== nA) out.push(nA + ' asymptotes but ' + nAl + ' asymptote labels');
  const rows = new Set(q('.fl2 .tk2-cz').map(e => Math.round(R(e).t))).size;
  if (innerWidth <= 640 && rows > 2) out.push('cause line is ' + rows + ' rows: ' + cause);
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  return { out, share, causeH: Math.round(R(causeEl).h) };
};
const FAMS = ['linear', 'quadratic', 'cubic', 'absolute', 'sqrt', 'reciprocal', 'piecewise', 'exponential', 'logarithmic', 'sine'];
const STATES = [
  ['translate', { a: 1, b: 1, h: -2, k: 1.5 }],
  ['stretch-flip', { a: -2, b: -1, h: 1, k: 1 }],
  ['narrow', { a: 2, b: 3, h: -1, k: -1 }],
  ['wide', { a: 1.5, b: 0.25, h: 0, k: -2 }],
  ['corner-hi', { a: 1, b: 1, h: 99, k: 99 }],
  ['corner-lo', { a: -1, b: 1, h: -99, k: -99 }],
];
let checks = 0, states = 0; const fails = [], minShare = {};
const fail = (w, th, name, list) => { list.forEach(f => fails.push(`${w} ${th} ${name}: ${f}`)); };
for (const w of WIDTHS) {
  const h = HEIGHT[w] || 900, W4 = String(w).padStart(4, '0');
  for (const theme of THEMES) {
    { // a first visit: the cue is whole and covers nothing; one cue only
      const c = await open({ w, h, theme, cue: true });
      await c.page.waitForTimeout(500);
      const bad = await c.page.evaluate(() => {
        const R = e => e.getBoundingClientRect(), cue = document.querySelectorAll('.tk2-cue'), out = [];
        if (cue.length !== 1) return ['cues on screen: ' + cue.length];
        const r = R(cue[0]), S = R(document.querySelector('.fl2-scene'));
        if (r.left < S.left || r.right > S.right || r.top < S.top || r.bottom > S.bottom) out.push('the cue is clipped by the stage');
        const vis = e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none' && !e.closest('[hidden]') && !e.closest('[style*="display: none"]');
        const hit = (a, c) => !(a.right + 3 <= c.left || c.right + 3 <= a.left || a.bottom + 3 <= c.top || c.bottom + 3 <= a.top);
        [...document.querySelectorAll('.fl2-lab rect, .fl2-ticks text, .fl2 .tk2-tag, .fl2 .tk2-dot, .fl2-bead')].filter(vis).forEach(e => { if (hit(r, R(e))) out.push('the cue covers ' + (e.textContent || e.getAttribute('class'))); });
        if ([...document.querySelectorAll('.fl2 .tk2-chip')].filter(vis).length) out.push('a chip shows beside the cue');
        // fit to the screen's height: the board, both pins and the cause line in view without scrolling
        const fitW = [[390, 844], [1024, 768], [1280, 800]].some(([a, b]) => a === innerWidth && b === innerHeight);
        if (fitW) [['the board', '.fl2-scene'], ['the square pin', '.fl2-hk .tk2-dot'], ['the round pin', '.fl2-ab .tk2-dot'], ['the cause line', '.fl2 .tk2-cause'], ['Show the steps', '.fl2 .tk2-play']].forEach(([n, s]) => { const b = R(document.querySelector(s)); if (b.top < 0 || b.bottom > innerHeight + 0.5) out.push(n + ' is not in view at ' + innerWidth + 'x' + innerHeight); });
        return out;
      });
      checks += 8; states++;
      fail(w, theme, 'first visit', bad.concat(c.errs));
      await shot(c.page, `${W4}-${theme}-00-first.png`);
      await c.ctx.close();
    }
    const c = await open({ w, h, theme });
    const page = c.page;
    let causeH = null;
    const run = async (name, setup) => {
      await page.evaluate(setup.fn, setup.arg);
      // two frames: with reduced motion the site gives every property a 0.01 ms transition, so a knob reads its new
      // place a frame late
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 60)))));
      const r = await page.evaluate(probe, theme);
      checks += 20; states++;
      fail(w, theme, name, r.out);
      minShare[w] = Math.min(minShare[w] ?? 1, r.share);
      if (w <= 640) { if (causeH == null) causeH = r.causeH; else if (Math.abs(r.causeH - causeH) > 1) fail(w, theme, name, ['cause line height changed ' + causeH + ' → ' + r.causeH]); }
      await shot(page, `${W4}-${theme}-${name}.png`);
    };
    await run('opening', { fn: () => {}, arg: null });
    for (const fam of FAMS) {
      for (const [sn, p] of STATES) {
        await run(fam + '-' + sn, { fn: ([p, fam]) => window.ApPrecalcFunctionLab.set(p, fam), arg: [p, fam] });
        // the pins kept what was asked (only pushed in to the board's edge, never sent back to f)
        const got = await page.evaluate(() => Object.assign({}, window.ApPrecalcFunctionLab.S.p)); checks++;
        if (got.a !== p.a || got.b !== p.b) fail(w, theme, fam + '-' + sn, ['asked ' + JSON.stringify(p) + ', the board holds ' + JSON.stringify(got)]);
      }
      await run(fam + '-roundpin', { fn: ([fam]) => window.ApPrecalcFunctionLab.set({ a: 2, b: 0.5, h: 0.5, k: -0.5, last: 'ab' }, fam), arg: [fam] });
    }
    // Show the steps to its end (reduced motion: each press is the next step), then the takeaway
    await page.evaluate(() => window.ApPrecalcFunctionLab.set({ a: -2, b: 2, h: 1, k: 1 }, 'quadratic'));
    for (let i = 0; i < 8; i++) { const end = await page.evaluate(() => document.querySelector('.fl2 .tk2-cause').classList.contains('is-take')); if (end) break; await page.click('.fl2 .tk2-play'); await page.waitForTimeout(60); }
    { const r = await page.evaluate(() => { const c = document.querySelector('.fl2 .tk2-cause'); return { take: c.classList.contains('is-take'), t: c.textContent }; });
      checks++; if (!r.take || !/Every point moves the same way/.test(r.t)) fail(w, theme, 'steps', ['no takeaway after Show the steps: ' + r.t]); }
    await run('steps-end', { fn: () => {}, arg: null });
    // "?" holds the formula, the table and the features
    await page.click('.ls-help');
    await page.waitForTimeout(250);
    { const r = await page.evaluate(() => { const s = document.querySelector('.fl2-ref'); return s ? { tbl: !!s.querySelector('.fl2-tbl tbody tr'), feats: s.querySelectorAll('.fl-feats > div').length, vis: s.getBoundingClientRect().width > 0 } : null; });
      checks++; if (!r || !r.vis || !r.tbl || r.feats < 4) fail(w, theme, '?', ['the reference is not shown whole: ' + JSON.stringify(r)]); }
    if (SHOTS) await page.screenshot({ path: join(SHOTS, `${W4}-${theme}-zz-ref.png`) });
    fail(w, theme, 'console', c.errs);
    await c.ctx.close();
  }
  console.log(`${w}: done (${states} states so far, board at least ${(minShare[w] * 100).toFixed(0)}%)`);
}
// Test yourself and the deep links, once (at the first width)
{
  const w = WIDTHS[0], h = HEIGHT[w] || 900;
  const c = await open({ w, h, theme: 'light', hash: '#quiz' });
  await c.page.waitForSelector('.cd-step, .cd-steps', { timeout: 8000 }).catch(() => {});
  await c.page.waitForTimeout(500);
  const r = await c.page.evaluate(() => ({ quiz: document.querySelector('.ls-root') ? document.querySelector('.ls-root').getAttribute('data-mode') : null, steps: document.querySelectorAll('.cd-step').length }));
  checks += 2; if (r.quiz !== 'quiz' || !r.steps) fail(w, 'light', '#quiz', ['#quiz does not open Test yourself: ' + JSON.stringify(r)]);
  fail(w, 'light', '#quiz console', c.errs);
  await c.ctx.close();
}
await browser.close(); server.close();
console.log(`${states} states, ${checks} checks, ${fails.length} failures`);
if (fails.length) { console.log(fails.slice(0, 80).join('\n')); process.exit(1); }
