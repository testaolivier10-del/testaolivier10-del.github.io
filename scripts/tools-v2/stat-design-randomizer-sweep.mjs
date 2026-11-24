#!/usr/bin/env node
/* Tools v2 sweep: AP Statistics, Design randomizer (docs/tools-v2-stat-design-randomizer-brief.md; pattern of
   scripts/tools-v2/stat-ci-capture-sweep.mjs).
   Landmark states of Explore (the first visit with its cue; one run; Run 100 for each design; a picked unit; the memory
   study with blinding on and off; Start over), and a Test yourself view, at widths 360 to 1920, light and dark:
     - no sideways scroll; nothing clipped by the scene (labels, pills, buttons, the cue);
     - labels never overlap each other (4 px); no rendered text under 11 px; phones: the cause line at most two rows,
       constant height;
     - the experiment (the bench or the room) is the largest part of the picture; Randomize and run, the cause line and
       the picture show together at 390 x 844, 1024 x 768 and 1280 x 800;
     - every number agrees with the picture AS DRAWN (AGREE: the stickers, the stems or score gauges, the dots and the
       card counts are read from the DOM; the cause line's balance, estimate, count and centre are checked against
       them; the design's structure (frames, trays) and the pressed card match the design);
     - the first visit cue points at Randomize and run and covers no label.
   --frames (390 and 1440): AGREE after every animation frame through a run, Run 100, a design change mid run, the
   blinding mid run, a scene change, Start over, leaving to Test yourself mid run and back, real taps on a unit and a
   card (touch at 390), keys, and reduced motion.
   --perf: CPU x4 frame times of one run and of Run 100 at 390 and 1440, beside the flagship's fertilizer drag.
   --shots <dir>: a picture of every state.
   Usage: node scripts/tools-v2/stat-design-randomizer-sweep.mjs [--width <px>] [--frames] [--perf] [--shots <dir>]
   With no flag it runs each of the ten widths in its own process, then the frame checks.
   Needs playwright (PW_ROOT names a folder whose node_modules has it) and Chromium (CHROMIUM_PATH). */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, readFileSync, mkdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const WIDTHS = [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
const ONE = arg('--width', null), FRAMES = process.argv.includes('--frames'), PERF = process.argv.includes('--perf'), SHOTS = arg('--shots', null);

if (!ONE && !FRAMES && !PERF) {
  let pass = 0, fail = 0, bad = false;
  const runs = WIDTHS.map(w => ['--width', String(w)]).concat([['--frames']]);
  for (const a of runs) {
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...a, ...(SHOTS ? ['--shots', SHOTS] : [])], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
    process.stdout.write(r.stdout);
    const m = /(\d+) passed, (\d+) failed/.exec(r.stdout || '');
    if (m) { pass += +m[1]; fail += +m[2]; } else bad = true;
  }
  console.log(`\nstat-design-randomizer sweep, all runs: ${pass} passed, ${fail} failed${bad ? ' (a run did not finish)' : ''}`);
  process.exit(fail || bad ? 1 : 0);
}

let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) {
  const roots = [process.env.PW_ROOT, '/opt/npm-tools', '/home/claude/testaolivier10-del.github.io'].filter(Boolean);
  for (const r of roots) { try { ({ chromium } = createRequire(r + '/')('playwright')); break; } catch (e2) {} }
  if (!chromium) { console.error('This sweep needs playwright (set PW_ROOT).'); process.exit(0); }
}
const EXE = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome') ? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' : undefined);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const file = resolve(ROOT, '.' + p);
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  // Premium is unlocked in this test only (never committed): has() answers yes
  if (p === '/assets/premium.js') { res.writeHead(200, { 'Content-Type': MIME['.js'] }); res.end(readFileSync(file, 'utf8').replace('function has(course) {', 'function has(course) { return true;')); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }); createReadStream(file).pipe(res);
});
await new Promise(ok => server.listen(0, ok));
const PORT = server.address().port;
const URL0 = `http://localhost:${PORT}/statistics/tools/design-randomizer.html`;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

let pass = 0; const fails = [];
const ok = (c, msg) => { if (c) pass++; else fails.push(msg); };

async function open(w, h, dark, opts = {}) {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', hasTouch: w < 600, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.addInitScript(([dark, noCue, frames]) => {
    window.LevlToolTest = 1;
    try { if (dark) localStorage.setItem('nremt_theme', 'dark'); if (noCue) localStorage.setItem('tk2c:apstat-design-randomizer', '1'); } catch (e) {}
    if (frames) {
      const raf = window.requestAnimationFrame.bind(window);
      window.__fr = { n: 0, bad: [] };
      window.requestAnimationFrame = (cb) => raf((t) => { cb(t); if (window.__AGREE && window.ApStatDesignRandomizer) { window.__fr.n++; const b = window.__AGREE(); if (b.length && window.__fr.bad.length < 20) window.__fr.bad.push(b.join('; ')); } });
    }
  }, [dark, !!opts.noCue, !!opts.frames]);
  await page.goto(URL0 + (opts.hash || '')); await page.waitForSelector('.dr3-scene .dr3-u', { timeout: 20000 }); await page.waitForTimeout(500);
  if (opts.frames) await page.evaluate(`window.__AGREE = ${AGREE.toString()}`);
  return { browser, page, errs };
}
async function until(page, fn, a) { for (let i = 0; i < 240; i++) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(50); } return false; }
const still = (page) => until(page, () => !window.ApStatDesignRandomizer.busy());

/* Read the picture back from the DOM and check every number against it (runs in the page). */
const AGREE = () => {
  const X = window.ApStatDesignRandomizer, out = [], S = X.S, U = S.U, BG = X.BG(), G = X.G();
  const people = S.sc.kind === 'people';
  const units = [...document.querySelectorAll('.dr3-units .dr3-u')];
  if (units.length !== U.length) return ['units drawn ' + units.length + ' vs ' + U.length];
  // stickers that are down (shown, at full size) and each unit's drawn response
  const tag = [], resp = [];
  units.forEach((g, i) => {
    const t = g.querySelector('.dr3-tag');
    const down = t.style.display !== 'none' && !t.getAttribute('transform');
    tag[i] = down ? (/is-A/.test(t.getAttribute('class')) ? 'A' : /is-B/.test(t.getAttribute('class')) ? 'B' : '?') : null;
    if (down && t.querySelector('text').textContent !== tag[i]) out.push(`unit ${i}: sticker colour and letter disagree`);
    if (!people) { const m = /^M[-\d.]+ ([-\d.]+) V ([-\d.]+)/.exec(g.querySelector('.dr3-stem').getAttribute('d') || ''); resp[i] = m ? (+m[1] - +m[2]) / BG.kcm : null; }
    else { const f = g.querySelector('.dr3-gfill'), o = g.querySelector('.dr3-gauge'); resp[i] = f.style.display === 'none' ? null : +f.getAttribute('height') / +o.getAttribute('height') * 30; }
  });
  const placed = tag.filter(Boolean).length;
  const cz = [...document.querySelectorAll('.dr3 .tk2-cause .tk2-cz')].map(e => e.textContent);
  // the balance on the other variable, from the stickers
  let a1 = 0, b1 = 0; U.forEach((u, i) => { if (u.block === 1) { if (tag[i] === 'A') a1++; else if (tag[i] === 'B') b1++; } });
  const bm = cz.map(t => /^(sunny|older): (\d+) A, (\d+) B$/.exec(t)).find(Boolean);
  if (bm && (+bm[2] !== a1 || +bm[3] !== b1)) out.push(`cause "${bm[0]}" vs drawn ${a1} A, ${b1} B`);
  const dm = cz.map(t => /^(?:dealt by chance|picked) (\d+) of (\d+)$/.exec(t)).find(Boolean);
  if (dm && +dm[1] !== placed) out.push(`cause "${dm[0]}" vs ${placed} stickers down`);
  // the estimate, from the drawn heights or scores
  const em = cz.map(t => /^estimate (−?[\d.]+)/.exec(t)).find(Boolean);
  if (em) {
    const A = [], B = []; units.forEach((g, i) => { if (resp[i] == null) return; (tag[i] === 'A' ? A : B).push(resp[i]); });
    const mean = a => a.reduce((s, x) => s + x, 0) / a.length, est = mean(A) - mean(B), shown = parseFloat(em[1].replace('−', '-'));
    if (placed !== U.length) out.push('an estimate before every sticker is down');
    if (Math.abs(est - shown) > 0.06) out.push(`estimate "${em[0]}" vs drawn ${est.toFixed(3)}`);
  }
  // the dots: every one drawn where its value says, in its own row; the card counts; the centre
  const q = G.P, dom = X.dom(), vx = (x) => dom[0] + (x - q.l) / (q.r - q.l) * (dom[1] - dom[0]);
  const DES = ['cr', 'block', 'pairs', 'none'];
  const circles = [...document.querySelectorAll('.dr3-dots .dr3-dot')].filter(c => c.style.display !== 'none');
  DES.forEach((d, k) => {
    const y0 = q.top + k * q.rh, y1 = y0 + q.rh;
    const inRow = X.rows[d].filter(o => o.land);
    const cel = [...document.querySelectorAll('.dr3-ccount')][k], card = cel.textContent, cm = /^(\d+) runs?$/.exec(card);
    // a row with both blindings: the card counts the blinding in use, and each blinding has its own triangle at its own mean
    const kinds = [inRow.filter(o => !o.ub), inRow.filter(o => o.ub)], mixed = kinds[0].length && kinds[1].length, useUb = S.sc.placebo && !S.blind ? 1 : 0;
    if (cel.style.display !== 'none') {
      if (mixed) { const mm = /^(\d+) (not blind|blind)$/.exec(card); if (!mm || +mm[1] !== kinds[useUb].length || (mm[2] === 'not blind') !== !!useUb) out.push(`card ${d} "${card}" vs ${kinds[useUb].length} ${useUb ? 'not blind' : 'blind'}`); }
      else if (!cm || +cm[1] !== inRow.length) out.push(`card ${d} "${card}" vs ${inRow.length} landed`);
    }
    const marks = [...document.querySelectorAll('.dr3-centre')].filter(m => m.style.display !== 'none' && (() => { const b = m.getBoundingClientRect(), sv = document.querySelector('.dr3-svg').getBoundingClientRect(); const yy = b.top - sv.top; return yy >= y0 && yy <= y1 + 2; })());
    [0, 1].forEach(u => {
      const dots = [...document.querySelectorAll('.dr3-dots .dr3-dot')].filter(c => c.style.display !== 'none' && /is-ub/.test(c.getAttribute('class')) === !!u && +c.getAttribute('cy') >= y0 && +c.getAttribute('cy') <= y1);
      const mk = marks.find(m => /is-ub/.test(m.getAttribute('class')) === !!u);
      if (kinds[u].length >= 5 && !X.busy()) {
        if (!mk) { out.push(`row ${d}: no ${u ? 'hollow' : 'filled'} triangle`); return; }
        const mx = +/^M([-\d.]+)/.exec(mk.getAttribute('d'))[1], mean = dots.reduce((a, c) => a + vx(+c.getAttribute('cx')), 0) / dots.length;
        if (Math.abs(vx(mx) - mean) > (dom[1] - dom[0]) / 1500 + 0.01) out.push(`row ${d}: ${u ? 'hollow' : 'filled'} triangle at ${vx(mx).toFixed(2)} vs its dots' mean ${mean.toFixed(2)}`);
      } else if (mk && kinds[u].length < 5) out.push(`row ${d}: a triangle for ${kinds[u].length} runs`);
    });
    inRow.forEach(o => { if (!o.el) return; const cx = +o.el.getAttribute('cx'), cy = +o.el.getAttribute('cy'); if (Math.abs(vx(cx) - o.v) > (dom[1] - dom[0]) / 2000 + 0.01) out.push(`dot in ${d} at ${vx(cx)} vs ${o.v}`); if (cy < y0 || cy > y1) out.push(`dot of ${d} outside its row`); });
    const pressed = document.querySelectorAll('.dr3-ctap')[k].getAttribute('aria-pressed') === 'true';
    if (pressed !== (S.design === d)) out.push(`card ${d} pressed ${pressed} vs design ${S.design}`);
  });
  const cm2 = cz.map(t => /^centered (−?[\d.]+)/.exec(t)).find(Boolean);
  if (cm2 && !X.busy()) {
    const k = DES.indexOf(S.design), y0 = q.top + k * q.rh, y1 = y0 + q.rh, ubW = cz.some(t => /not blind/.test(t)), blW = cz.some(t => /, blind$/.test(t));
    const vals = circles.filter(c => { const cy = +c.getAttribute('cy'); if (cy < y0 || cy > y1) return false; const ub = /is-ub/.test(c.getAttribute('class')); return ubW ? ub : blW ? !ub : true; }).map(c => vx(+c.getAttribute('cx')));
    const m = vals.reduce((s, x) => s + x, 0) / vals.length, shown = parseFloat(cm2[1].replace('−', '-'));
    if (Math.abs(m - shown) > 0.051) out.push(`centre "${cm2[0]}" vs drawn ${m.toFixed(3)}`);
    const nm = cz.map(t => /^(\d+) runs/.exec(t)).find(Boolean);
    if (nm && +nm[1] !== vals.length) out.push(`"${nm[0]}" vs ${vals.length} drawn dots`);
  }
  // the design's structure on the scene
  const fr = [...document.querySelectorAll('.dr3-frame')].every(f => f.classList.contains('is-on') === (S.design === 'block'));
  const tr = [...document.querySelectorAll('.dr3-tray')].every(f => f.classList.contains('is-on') === (S.design === 'pairs'));
  if (!fr) out.push('block frames do not match the design');
  if (!tr) out.push('pair trays do not match the design');
  return out;
};

/* Layout checks of one state (runs in the page). */
const LAYOUT = (phone) => {
  const out = [], sc = document.querySelector('.dr3-scene').getBoundingClientRect();
  const vis = (e) => { if (!e) return false; const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false; for (let x = e; x && x.nodeType === 1; x = x.parentNode) { const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0 || x.hidden) return false; } return true; };
  const inS = (r, what) => { if (r.left < sc.left - 0.5 || r.right > sc.right + 0.5 || r.top < sc.top - 0.5 || r.bottom > sc.bottom + 0.5) out.push(`clipped: ${what}`); };
  if (document.scrollingElement.scrollWidth > innerWidth + 1) out.push('sideways scroll ' + document.scrollingElement.scrollWidth);
  const labs = [];
  document.querySelectorAll('.dr3-labs text, .dr3-plab, .dr3-glab, .dr3-rnum').forEach(t => {
    if (!vis(t) || !t.textContent.trim()) return;
    if (t.closest('.dr3-tpill') || t.closest('.dr3-tag')) return;
    const r = t.getBoundingClientRect(); labs.push({ r, w: t.textContent.trim() });
    const fs = parseFloat(getComputedStyle(t).fontSize) * (t.closest('svg').getBoundingClientRect().width / (t.closest('svg').viewBox.baseVal.width || 1));
    if (fs < 10.95) out.push(`text under 11 px: "${t.textContent}" ${fs.toFixed(1)}`);
  });
  document.querySelectorAll('.dr3-tag text').forEach(t => { if (!vis(t)) return; const fs = parseFloat(getComputedStyle(t).fontSize); if (fs < 11) out.push('sticker letter under 11 px'); });
  const tp = document.querySelector('.dr3-tpill rect'); if (tp && vis(tp)) labs.push({ r: tp.getBoundingClientRect(), w: 'truth pill' });
  labs.forEach(l => inS(l.r, l.w));
  ['.dr3-run', '.dr3 .tk2-cue', '.dr3-blind'].forEach(s => { const e = document.querySelector(s); if (e && vis(e)) inS(e.getBoundingClientRect(), s); });
  for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) {
    const a = labs[i].r, b = labs[j].r;
    if (a.left < b.right + 4 && b.left < a.right + 4 && a.top < b.bottom + 2 && b.top < a.bottom + 2) out.push(`labels touch: "${labs[i].w}" / "${labs[j].w}"`);
  }
  // labels clear of the dots, the truth line (but its own pill), the stickers and the Randomize button
  const obs = [];
  document.querySelectorAll('.dr3-dots .dr3-dot').forEach(e => { if (vis(e)) obs.push({ r: e.getBoundingClientRect(), c: 'dot' }); });
  document.querySelectorAll('.dr3-tag').forEach(e => { if (vis(e) && !e.closest('.dr3-key') && !e.closest('.dr3-handg')) obs.push({ r: e.getBoundingClientRect(), c: 'sticker' }); });
  const tr = document.querySelector('.dr3-truth'); if (tr) obs.push({ r: tr.getBoundingClientRect(), c: 'truth' });
  const go = document.querySelector('.dr3-run'); if (go && vis(go)) obs.push({ r: go.getBoundingClientRect(), c: 'button' });
  labs.forEach(l => obs.forEach(o => {
    if (l.w === 'truth pill' && o.c === 'truth') return;
    const a = l.r, b = o.r;
    if (a.left < b.right + 1 && b.left < a.right + 1 && a.top < b.bottom + 1 && b.top < a.bottom + 1) out.push(`"${l.w}" touches a ${o.c}`);
  }));
  // every card's name inside its card
  const cards = [...document.querySelectorAll('.dr3-card')].map(c => c.getBoundingClientRect());
  document.querySelectorAll('.dr3-cname, .dr3-ccount').forEach(t => { if (!vis(t)) return; const r = t.getBoundingClientRect(), c = cards.find(c => r.top >= c.top - 1 && r.bottom <= c.bottom + 1); if (!c || r.left < c.left + 3 || r.right > c.right - 3) out.push(`card text outside its card: "${t.textContent}"`); });
  // the stickers keep apart from each other
  const st = [...document.querySelectorAll('.dr3-units .dr3-tag')].filter(vis).map(e => e.getBoundingClientRect());
  for (let i = 0; i < st.length; i++) for (let j = i + 1; j < st.length; j++) { const a = st[i], b = st[j]; if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) out.push('stickers overlap'); }
  // the experiment is the largest part of the picture
  const G = window.ApStatDesignRandomizer.G();
  if (!(G.R.w * G.R.h > G.P.w * G.P.h)) out.push('the experiment is not the largest part');
  const cz = document.querySelector('.dr3 .tk2-cause');
  if (phone && cz) { const h = cz.getBoundingClientRect().height; if (h > 74) out.push('cause line taller than two rows: ' + h); window.__czH = window.__czH || h; if (Math.abs(window.__czH - h) > 1) out.push(`cause line height changed ${window.__czH} -> ${h}`); }
  return out;
};

if (ONE) {
  const w = +ONE;
  const h = w < 600 ? 844 : w <= 820 ? 1024 : w === 1024 ? 768 : w === 1280 ? 800 : w === 1920 ? 1080 : 900;
  if (w === 360) {
    for (const [sw, sh] of [[360, 740], [375, 667]]) {
      const { browser, page } = await open(sw, sh, false);
      const f = await page.evaluate(() => { const b = document.querySelector('.dr3-run').getBoundingClientRect(), c = document.querySelector('.dr3 .tk2-cue'); return { b: b.bottom <= innerHeight, c: !!c && c.getBoundingClientRect().bottom <= innerHeight }; });
      ok(f.b && f.c, `${sw}x${sh} landing: Randomize or its cue below the fold ${JSON.stringify(f)}`);
      await browser.close();
    }
  }
  for (const dark of [false, true]) {
    const tag = `${w}-${dark ? 'dark' : 'light'}`;
    const { browser, page, errs } = await open(w, h, dark);
    const X = (fn, a) => page.evaluate(fn, a);
    const shot = async (n) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/sweep-${tag}-${n}.png` }); };
    const check = async (n) => {
      await still(page);
      const lay = await X(LAYOUT, w < 600); lay.forEach(f => ok(false, `${tag} ${n}: ${f}`)); ok(!lay.length, '');
      const ag = await X(AGREE); ag.forEach(f => ok(false, `${tag} ${n}: ${f}`)); ok(!ag.length, '');
      await shot(n);
    };
    const th = await X(() => document.documentElement.getAttribute('data-theme') === 'dark');
    ok(th === dark, `${tag} theme: dark is ${th}`);
    // the first visit: the cue under Randomize and run, covering no label
    const cue = await X(() => {
      const c = document.querySelector('.dr3 .tk2-cue'), b = document.querySelector('.dr3-run'); if (!c) return null;
      const r = c.getBoundingClientRect(), q = b.getBoundingClientRect();
      const over = (sel) => [...document.querySelectorAll(sel)].filter(e => e.getBoundingClientRect().width).some(e => { const z = e.getBoundingClientRect(); return r.top < z.bottom && r.bottom > z.top && r.left < z.right && r.right > z.left; });
      return { below: r.top >= q.bottom - 1 && r.left < q.right && r.right > q.left, over: over('.dr3-labs text, .dr3-plab, .dr3-glab, .dr3-rnum, .dr3-key'), inView: r.bottom <= innerHeight && r.left >= 2 && r.right <= innerWidth - 2 };
    });
    ok(cue && cue.below && !cue.over && cue.inView, `${tag} first visit cue: ${JSON.stringify(cue)}`);
    const fold = await X(() => { const b = document.querySelector('.dr3-run').getBoundingClientRect(), c = document.querySelector('.dr3 .tk2-cause').getBoundingClientRect(), s = document.querySelector('.dr3-scene').getBoundingClientRect(), r1 = document.querySelector('.dr3-100').getBoundingClientRect(); return { b: b.top >= 0 && b.bottom <= innerHeight, c: c.bottom <= innerHeight, s: s.top >= 0 && s.bottom <= innerHeight, r: r1.bottom <= innerHeight }; });
    ok(fold.b && fold.c && fold.s && fold.r, `${tag} picture, Randomize, cause line and Run 100 not on one screen: ${JSON.stringify(fold)}`);
    // "?" is filled from the first paint and names the design in use after every change
    const refOk = (want) => X((want) => { const r = document.querySelector('.dr3-ref'); return !!r && r.textContent.length > 400 && r.textContent.indexOf('This design: ' + want) > -1; }, want);
    ok(await refOk('completely randomized'), `${tag} "?" empty or wrong on a fresh page`);
    await check('00-first');
    await page.click('.dr3-run');
    if (SHOTS && (w === 390 || w === 1440)) { await page.waitForTimeout(800); await shot('mid-deal'); await page.waitForTimeout(1400); await shot('mid-grow'); }
    await check('01-one-run');
    await X(() => window.ApStatDesignRandomizer.hundred()); await check('02-cr-100');
    for (const d of ['block', 'pairs', 'none']) {
      await X((d) => window.ApStatDesignRandomizer.setDesign(d), d); await check(`03-${d}-fresh`);
      ok(await refOk({ block: 'randomized block', pairs: 'matched pairs', none: 'Gardener picks' }[d]), `${tag} "?" does not name ${d} after the change`);
      await X(() => window.ApStatDesignRandomizer.hundred()); await check(`04-${d}-100`);
    }
    await X(() => window.ApStatDesignRandomizer.select(5)); await check('05-picked');
    await X(() => window.ApStatDesignRandomizer.select(-1));
    // the memory study
    await X(() => window.ApStatDesignRandomizer.setScene(1)); await check('06-memory-empty');
    ok(await X(() => /Blinding/.test(document.querySelector('.dr3-ref').textContent) && /Researcher picks/.test(document.querySelector('.dr3-ref').textContent)), `${tag} "?" not updated after the scene change`);
    await X(() => window.ApStatDesignRandomizer.go()); await check('07-memory-run');
    await X(() => window.ApStatDesignRandomizer.hundred()); await check('08-memory-cr-100');
    await X(() => window.ApStatDesignRandomizer.setBlind(false)); await X(() => window.ApStatDesignRandomizer.hundred()); await check('09-memory-not-blind');
    await X(() => window.ApStatDesignRandomizer.setBlind(true)); await check('09b-memory-mixed-blind-in-use');
    await X(() => window.ApStatDesignRandomizer.setBlind(false));
    await X(() => window.ApStatDesignRandomizer.setDesign('block')); await X(() => window.ApStatDesignRandomizer.hundred()); await check('10-memory-block-not-blind');
    await X(() => window.ApStatDesignRandomizer.setBlind(true)); await X(() => window.ApStatDesignRandomizer.setDesign('none')); await X(() => window.ApStatDesignRandomizer.hundred()); await check('11-memory-none');
    await X(() => window.ApStatDesignRandomizer.setDesign('pairs')); await X(() => window.ApStatDesignRandomizer.go()); await check('12-memory-pairs-run');
    await X(() => window.ApStatDesignRandomizer.startOver()); await check('13-start-over');
    ok(await refOk('matched pairs') && await X(() => !/Every design so far/.test(document.querySelector('.dr3-ref').textContent)), `${tag} "?" stale after Start over`);
    // Test yourself: the drill and its figure
    await X(() => window.ApStatDesignRandomizer.kmode('quiz'));
    await page.waitForTimeout(700);
    const qz = await X(() => { const f = document.querySelector('.ls-root .dq-fig svg, .ls-root .dd-svg, .ls-root .dr-scope, .ls-root .cd-extra svg'); return { fig: !!f, sx: document.scrollingElement.scrollWidth <= innerWidth + 1, steps: !!document.querySelector('.ls-root .ls-dock button, .ls-root .bt-opt, .ls-root [role="radio"]') }; });
    ok(qz.fig && qz.sx, `${tag} Test yourself: ${JSON.stringify(qz)}`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/sweep-${tag}-14-quiz.png` });
    ok(!errs.length, `${tag} console: ${errs.slice(0, 3).join(' | ')}`);
    await browser.close();
  }
}

if (FRAMES) {
  for (const w of [390, 1440]) {
    const h = w < 600 ? 844 : 900, tag = `frames ${w}`;
    const { browser, page, errs } = await open(w, h, false, { frames: true, noCue: true });
    const X = (fn, a) => page.evaluate(fn, a);
    const run = async (what, fn) => {
      await X(() => { window.__fr.n = 0; window.__fr.bad = []; });
      await fn(); await still(page); await page.waitForTimeout(80);
      const fr = await X(() => window.__fr);
      ok(fr.n > 0 || /calm|reduced|tap|key/.test(what), `${tag} ${what}: no frames`);
      fr.bad.forEach(b => ok(false, `${tag} ${what}: ${b}`)); ok(!fr.bad.length, '');
      console.log(`  ${tag} ${what}: ${fr.n} frames`);
    };
    await run('a run (deal, grow, drop)', async () => { await page.click('.dr3-run'); });
    { const n = await X(() => window.ApStatDesignRandomizer.rows.cr.length); ok(n === 1, `${tag} one run gave ${n} dots`); }
    await run('Run 100', async () => { await page.click('.dr3-100'); });
    await run('a design change mid run', async () => { await page.click('.dr3-run'); await page.waitForTimeout(700); await X(() => document.querySelectorAll('.dr3-ctap')[1].click()); await page.waitForTimeout(200); await page.click('.dr3-run'); });
    { const r = await X(() => ({ cr: window.ApStatDesignRandomizer.rows.cr.length, b: window.ApStatDesignRandomizer.rows.block.length })); ok(r.cr === 101 && r.b === 1, `${tag} a run dropped mid deal added a dot: ${JSON.stringify(r)}`); }
    await run('a unit tapped', async () => {
      const p = await X(() => { const e = document.querySelectorAll('.dr3-units .dr3-u')[10].querySelector('.dr3-pot, .dr3-head').getBoundingClientRect(); return [e.x + e.width / 2, e.y + e.height / 2]; });
      if (w < 600) await page.touchscreen.tap(p[0], p[1]); else await page.mouse.click(p[0], p[1]);
      await page.waitForTimeout(100);
      const s = await X(() => window.ApStatDesignRandomizer.S.sel); ok(s === 10, `${tag} a tap on unit 10 picked ${s}`);
      await page.keyboard.press('ArrowRight'); await page.waitForTimeout(60);
      const s2 = await X(() => window.ApStatDesignRandomizer.S.sel); ok(s2 === 11, `${tag} ArrowRight picked ${s2}`);
      const cz = await X(() => document.querySelector('.dr3 .tk2-cause').textContent); ok(/Plant 12/.test(cz), `${tag} the picked unit's cause line: ${cz}`);
      await page.keyboard.press('Escape');
    });
    await run('a card tapped', async () => {
      const p = await X(() => { const r = document.querySelectorAll('.dr3-ctap')[3].getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
      if (w < 600) await page.touchscreen.tap(p[0], p[1]); else await page.mouse.click(p[0], p[1]);
      await page.waitForTimeout(100);
      const d = await X(() => window.ApStatDesignRandomizer.S.design); ok(d === 'none', `${tag} the fourth card chose ${d}`);
    });
    await run('a key on a card', async () => { await page.focus('.dr3-ctap'); await page.keyboard.press('Enter'); await page.waitForTimeout(100); const d = await X(() => window.ApStatDesignRandomizer.S.design); ok(d === 'cr', `${tag} Enter on the first card chose ${d}`); });
    await run('the memory study, a run', async () => { await page.selectOption('.dr3-sel', '1'); await page.waitForTimeout(150); await page.click('.dr3-run'); });
    await run('blinding off mid run', async () => { await page.click('.dr3-run'); await page.waitForTimeout(900); await page.click('.dr3-blind'); await page.waitForTimeout(100); await page.click('.dr3-run'); });
    { const ub = await X(() => window.ApStatDesignRandomizer.rows.cr.filter(o => o.ub).length); ok(ub === 1, `${tag} not blind dots: ${ub}`); }
    await run('Run 100, not blind', async () => { await page.click('.dr3-100'); });
    await run('Start over', async () => { await page.click('.dr3-reset'); });
    await run('leave to Test yourself mid run, come back', async () => {
      await page.click('.dr3-run'); await page.waitForTimeout(2200);
      await X(() => window.ApStatDesignRandomizer.kmode('quiz'));
      await page.waitForTimeout(300);
      const clean = await X(() => !window.ApStatDesignRandomizer.busy()); ok(clean, `${tag} leaving mid run left an animation running`);
      await X(() => window.ApStatDesignRandomizer.kmode('explore'));
      await page.waitForTimeout(300);
      const r = await X(() => { const X2 = window.ApStatDesignRandomizer; return { done: X2.run() && X2.run().done, dots: X2.rows.cr.length, hand: document.querySelector('.dr3-handg').style.display }; });
      ok(r.done && r.dots === 1 && r.hand === 'none', `${tag} back in Explore: ${JSON.stringify(r)}`);
    });
    ok(!errs.length, `${tag} console: ${errs.slice(0, 3).join(' | ')}`);
    await browser.close();
    // reduced motion: the result at once, with the cross fade
    const rm = await open(w, h, false, { reduced: true, noCue: true });
    await rm.page.evaluate(`window.__AGREE = ${AGREE.toString()}`);
    await rm.page.click('.dr3-run'); await rm.page.waitForTimeout(60);
    const r1 = await rm.page.evaluate(() => ({ n: window.ApStatDesignRandomizer.rows.cr.filter(o => o.land).length, busy: window.ApStatDesignRandomizer.busy(), fade: document.querySelector('.dr3-scene').classList.contains('is-fade'), est: /estimate/.test(document.querySelector('.dr3 .tk2-cause').textContent), bad: window.__AGREE() }));
    ok(r1.n === 1 && !r1.busy && r1.fade && r1.est && !r1.bad.length, `${tag} reduced motion: ${JSON.stringify(r1)}`);
    await rm.browser.close();
  }
}

if (PERF) {
  const probe = async (page, fn) => {
    await page.evaluate(() => { window.__ft = []; window.__fon = true; let last = performance.now(); (function loop(t){ if (!window.__fon) return; window.__ft.push(t - last); last = t; requestAnimationFrame(loop); })(performance.now()); });
    await fn();
    const ft = (await page.evaluate(() => { window.__fon = false; return window.__ft.slice(2); })).sort((a, b) => a - b);
    const q = (p) => ft[Math.min(ft.length - 1, Math.floor(ft.length * p))];
    return `${ft.length} frames, median ${q(0.5).toFixed(1)} ms, p95 ${q(0.95).toFixed(1)} ms, max ${ft[ft.length - 1].toFixed(1)} ms`;
  };
  const drag = async (page, sel, dx) => {
    const k = await page.evaluate((sel) => { const e = [...document.querySelectorAll(sel)].find(x => x.getBoundingClientRect().width > 0); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, sel);
    await page.mouse.move(k[0], k[1]); await page.mouse.down();
    for (let i = 0; i <= 24; i++) { await page.mouse.move(k[0] + dx * i / 24, k[1]); await page.waitForTimeout(16); }
    for (let i = 24; i >= 0; i--) { await page.mouse.move(k[0] + dx * i / 24, k[1]); await page.waitForTimeout(16); }
    await page.mouse.up(); await page.waitForTimeout(600);
  };
  for (const w of [390, 1440]) {
    for (const which of ['plants one run', 'plants Run 100 (after 500)', 'memory one run', 'FLAGSHIP fertilizer']) {
      const browser = await chromium.launch({ executablePath: EXE });
      const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, serviceWorkers: 'block' });
      await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
      const page = await ctx.newPage();
      await page.addInitScript(() => { window.LevlToolTest = 1; localStorage.setItem('tk2c:apstat-design-randomizer', '1'); });
      const flag = /FLAG/.test(which);
      await page.goto(flag ? `http://localhost:${PORT}/environmental-science/tools/water-pollution.html` : URL0);
      if (flag) await page.waitForSelector('.tk2-knob', { state: 'attached', timeout: 15000 }); else await page.waitForSelector('.dr3-u', { timeout: 15000 });
      await page.waitForTimeout(1200);
      if (/memory/.test(which)) { await page.selectOption('.dr3-sel', '1'); await page.waitForTimeout(400); }
      if (/after 500/.test(which)) { for (let i = 0; i < 5; i++) { await page.evaluate(() => window.ApStatDesignRandomizer.hundred()); await page.waitForTimeout(100); } await page.evaluate(() => window.ApStatDesignRandomizer.finish()); }
      const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      let res;
      if (flag) res = await probe(page, () => drag(page, '.tk2-knob', Math.min(260, w * 0.3)));
      else if (/Run 100/.test(which)) res = await probe(page, async () => { await page.click('.dr3-100'); await page.waitForTimeout(2600); });
      else res = await probe(page, async () => { await page.click('.dr3-run'); await page.waitForTimeout(4200); });
      console.log(`  perf ${w} ${which} (CPU x4): ${res}`);
      await browser.close();
    }
  }
  pass++;
}

server.close();
const label = ONE ? `width ${ONE}` : FRAMES ? 'frames' : 'perf';
fails.filter(Boolean).slice(0, +(process.env.NFAIL || 40)).forEach(f => console.log('  FAIL ' + f));
console.log(`stat-design-randomizer sweep ${label}: ${pass} passed, ${fails.filter(Boolean).length} failed`);
process.exit(fails.filter(Boolean).length ? 1 : 0);
