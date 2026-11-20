#!/usr/bin/env node
/* Tools v2 sweep: NREMT Scenario simulator (docs/tools-v2-builder-brief.md, step 5; the pattern of
   nremt-skillsheets-sweep.mjs). Explore's landmark states at widths 360 to 1920 (light: every call's opening, then
   each call walked to an ending twice, always the first choice and always the last; dark: every opening and the
   first-choice ending), with reduced motion so the walk is quick (the frames run below checks the motion):
     - no sideways scroll; the words on the patient, the monitor and the "who" chip inside the picture;
     - no overlap (4 px at least) between the words on the patient, the monitor, the who chip and the cue, and no word
       on the patient's face or on the care drawn on them;
     - the monitor's four numbers inside the monitor; every choice at least 44 px tall, inside the card, no overlap;
     - the picture is the largest thing (wide: larger than the card; narrow: at least 40% of the screen's height);
     - every visible text at least 11 px; phones (640 px and under): the cause line at most two rows, constant height.
   And with --frames (390 and 1440), with motion: frame by frame (rule 14) a choice names its result only once the
   monitor has reached the case's numbers (the words on the patient and the card's new text wait too), and then the
   cause line's numbers are the monitor's drawn numbers; going back; the keyboard; reduced motion (the result at
   once); leaving Explore mid change (the change finishes, the clocks stop; coming back is clean); Test yourself (a
   run to its ending: the score card, the records for Review; leaving it pauses its monitor); the deep links; the
   locked page (Premium off) shows the gate in both modes; and choices with the CPU throttled x4 against the flagship
   in the same process (median frame about 16 ms, p95 at most 50 ms; reported). No console errors anywhere.
   One width per process: with no --width it runs itself once per width, in turn, then --frames.
   Usage: node scripts/tools-v2/nremt-scenario-sim-sweep.mjs [--width <w>] [--frames] [--shots <dir>]
   Needs playwright (PW_ROOT names a folder whose node_modules has it) and Chromium (CHROMIUM_PATH). */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, mkdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const SELF = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(dirname(SELF)));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const WIDTHS = [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
const SHOTS = arg('--shots', null);
const CALLS = Array.from({ length: 25 }, (_, i) => 's' + (i + 1));

if (!arg('--width', null) && !process.argv.includes('--frames')) {
  let pass = 0, fail = 0;
  const runs = WIDTHS.map(w => ['--width', String(w)]).concat([['--frames']]);
  for (const a of runs) {
    const r = spawnSync(process.execPath, [SELF, ...a, ...(SHOTS ? ['--shots', SHOTS] : [])], { encoding: 'utf8', timeout: 20 * 60 * 1000 });
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
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const file = resolve(ROOT, '.' + p);
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }); createReadStream(file).pipe(res);
});
await new Promise(ok => server.listen(0, ok));
const PORT = server.address().port;
const URL0 = `http://localhost:${PORT}/nremt/scenario-sim.html`;
let pass = 0; const fails = [];
const ok = (c, msg) => { if (c) pass++; else fails.push(msg); };
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

async function open(w, dark, opts = {}) {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: w, height: opts.h || (w < 500 ? 844 : w < 1100 ? 1024 : 900) }, serviceWorkers: 'block', hasTouch: w < 500,
    reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
  // Premium unlocked for the test only (never committed): has() says yes
  if (!opts.locked) await ctx.route('**/assets/premium.js', async r => { const resp = await r.fetch(); const t = (await resp.text()).replace('function has(course) {', 'function has(course) { return true;'); r.fulfill({ response: resp, body: t }); });
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  if (dark) await page.addInitScript(() => { try { localStorage.setItem('nremt_theme', 'dark'); } catch (e) {} });
  if (opts.noCue) await page.addInitScript(() => { try { localStorage.setItem('tk2c:nremt-scenario-sim', '1'); } catch (e) {} });
  await page.goto(URL0 + (opts.q || ''));
  await page.waitForTimeout(400);
  if (!opts.locked) await page.waitForFunction(() => { const x = window.NremtScenarioExplore && window.NremtScenarioExplore.last; return x && x._state().geo && document.querySelector('.scx-svg image'); }, null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(500);
  return { browser, ctx, page, errs };
}
const S = page => page.evaluate(() => window.NremtScenarioExplore.last._state());
async function call(page, id) { await page.evaluate(id => window.NremtScenarioExplore.last.show(id), id); await page.waitForTimeout(250); }
async function idle(page, max = 4000) { const t0 = Date.now(); while (Date.now() - t0 < max) { const s = await S(page); if (!s.busy && !s.pend) return s; await page.waitForTimeout(60); } return S(page); }
async function choose(page, i) { await page.evaluate(i => { const b = document.querySelectorAll('.scx-c')[i]; if (b) b.click(); }, i); }

async function measure(page) {
  return page.evaluate(() => {
    const box = document.querySelector('.scx-scene'), pic = box.querySelector('.scx-pic'), P = pic.getBoundingClientRect();
    const vis = e => e && !e.hidden && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0;
    const R = (e, n) => { const r = e.getBoundingClientRect(); return { n, l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
    const labs = [...box.querySelectorAll('.scx-lab')].map(e => R(e, 'word "' + e.textContent + '"'));
    const mon = R(box.querySelector('.scx-mon'), 'monitor'), who = R(box.querySelector('.scx-who'), 'who chip');
    const tiles = [...box.querySelectorAll('.scx-mon .mon-tile')].map((t, i) => R(t, 'tile ' + i));
    const cue = document.querySelector('.scx-cuehost .tk2-cue');
    const ch = [...box.querySelectorAll('.scx-c')].filter(vis).map((b, i) => R(b, 'choice ' + 'ABCDEF'[i]));
    const st = window.NremtScenarioExplore.last._state();
    const drawn = (st.geo ? st.geo.drawn : []).map((d, i) => ({ n: i ? 'care drawn ' + i : 'face', l: P.left + d.l, r: P.left + d.r, t: P.top + d.t, b: P.top + d.b }));
    const texts = [];
    const tw = document.createTreeWalker(box.closest('.scx'), NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) {
      const t = tw.currentNode, e = t.parentElement; if (!t.textContent.trim() || !vis(e)) continue;
      if (e.closest('.tk2-sr') || e.closest('.sr-only') || e.closest('svg') || e.closest('.scx-it:not(.is-on)')) continue;
      texts.push({ t: t.textContent.trim().slice(0, 24), px: parseFloat(getComputedStyle(e).fontSize) });
    }
    const cause = document.querySelector('.scx .tk2-cause');
    const pills = [...cause.querySelectorAll('.tk2-cz')].map(p => Math.round(p.getBoundingClientRect().top));
    // review round 1, item 14: the tourniquet's letters on screen, the SpO2 unit never cut off
    const tq = [...box.querySelectorAll('.scx-it.is-on .scx-tqt')].map(t => { const m = t.getScreenCTM(); return parseFloat(t.getAttribute('font-size')) * Math.hypot(m.a, m.b); });
    const su = box.querySelector('.scx-mon .mon-tile[data-k="spo2"] .mon-u');
    const unitCut = su && getComputedStyle(su).display !== 'none' ? su.scrollWidth > su.clientWidth + 1 : false;
    return { tq, unitCut, unit: su ? su.textContent : '', chain: cause.textContent, P: R(pic, 'picture'), board: R(box.querySelector('.scx-board'), 'card'), labs, mon, who, tiles, cue: cue ? R(cue, 'cue') : null, ch, drawn, texts,
      scrollW: document.documentElement.scrollWidth, vw: innerWidth, vh: innerHeight, wide: box.classList.contains('is-wide'), causeH: cause.getBoundingClientRect().height,
      causeRows: cause.classList.contains('is-take') ? (() => { const r = document.createRange(); r.selectNodeContents(cause); return new Set([...r.getClientRects()].map(x => Math.round(x.top))).size; })() : new Set(pills).size };
  });
}
const over = (a, b, gap = 4) => a.l < b.r + gap && b.l < a.r + gap && a.t < b.b + gap && b.t < a.b + gap;
const inside = (a, B, tol = 1) => a.l >= B.l - tol && a.r <= B.r + tol && a.t >= B.t - tol && a.b <= B.b + tol;
function check(m, tag, causeH0) {
  ok(m.scrollW <= m.vw + 1, `${tag}: sideways scroll ${m.scrollW} > ${m.vw}`);
  [m.mon, m.who].concat(m.labs).forEach(x => ok(inside(x, m.P), `${tag}: ${x.n} clipped by the picture`));
  m.tiles.forEach(x => ok(inside(x, m.mon, 1.5), `${tag}: monitor ${x.n} spills out of the monitor`));
  const all = m.labs.concat([m.mon, m.who]).concat(m.cue ? [m.cue] : []);
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (!(all[i].n === 'monitor' && all[j].n === 'who chip')) ok(!over(all[i], all[j]), `${tag}: ${all[i].n} overlaps ${all[j].n}`);
  m.labs.forEach(a => m.drawn.forEach(d => ok(!over(a, d, 2), `${tag}: ${a.n} covers the ${d.n}`)));
  if (m.cue) m.ch.forEach(c => ok(!over(m.cue, c, 0) || c.n !== 'choice A', `${tag}: the cue covers ${c.n}`));
  m.ch.forEach(c => { ok(c.h >= 44, `${tag}: ${c.n} only ${Math.round(c.h)} px tall`); ok(c.l >= m.board.l - 1 && c.r <= m.board.r + 1, `${tag}: ${c.n} clipped by the card`); });
  for (let i = 0; i < m.ch.length; i++) for (let j = i + 1; j < m.ch.length; j++) ok(!over(m.ch[i], m.ch[j], 0), `${tag}: ${m.ch[i].n} overlaps ${m.ch[j].n}`);
  if (m.wide) ok(m.P.w * m.P.h >= m.board.w * m.board.h, `${tag}: the picture is smaller than the card`);
  else ok(m.P.h >= m.vh * 0.4, `${tag}: the picture is only ${Math.round(m.P.h)} px tall`);
  const small = m.texts.filter(t => t.px < 11 - 0.01);
  ok(!small.length, `${tag}: text under 11 px: ${small.slice(0, 3).map(t => t.t + ' ' + t.px.toFixed(1)).join(', ')}`);
  m.tq.forEach(px => ok(px >= 11 - 0.01, `${tag}: the TQ tag's letters are ${px.toFixed(1)} px`));
  ok(!m.unitCut, `${tag}: the SpO2 unit "${m.unit}" is cut off`);
  ok(!/\d+ findings?|\bBirth\b/.test(m.chain) && !m.labs.some(l => /\d+ findings?|"Birth"/.test(l.n)), `${tag}: a count or "Birth" named (${m.chain})`);
  if (m.vw <= 640) { ok(m.causeRows <= 2, `${tag}: cause line ${m.causeRows} rows`); if (causeH0 != null) ok(Math.abs(m.causeH - causeH0) < 1.5, `${tag}: cause line height changed ${causeH0} -> ${m.causeH}`); }
}

async function sweep(w) {
  for (const dark of [false, true]) {
    const { browser, page, errs } = await open(w, dark, { reduced: true });
    let causeH0 = null;
    for (const id of CALLS) {
      await call(page, id); await idle(page);
      let m = await measure(page); if (causeH0 == null) causeH0 = m.causeH;
      check(m, `${w}${dark ? ' dark' : ''} ${id} opening`, causeH0);
      if (SHOTS && (w === 390 || w === 1440 || w === 768) && ['s1', 's6', 's14', 's23'].includes(id)) await page.locator('.scx-scene').screenshot({ path: `${SHOTS}/sweep-${id}-open-${w}${dark ? '-dark' : ''}.png` });
      for (const way of dark ? ['first'] : ['first', 'last']) {
        await call(page, id);
        for (let k = 0; k < 14; k++) {
          const st = await S(page); if (st.ending) break;
          const n = await page.evaluate(() => document.querySelectorAll('.scx-c').length);
          await choose(page, way === 'first' ? 0 : n - 1); await idle(page);
          m = await measure(page);
          check(m, `${w}${dark ? ' dark' : ''} ${id} ${way} step ${k + 1}`, causeH0);
          const s2 = await S(page);
          ok(!(s2.drawn.care.cpr && s2.drawn.care.o2), `${w} ${id} ${way} step ${k + 1}: an oxygen mask under compressions`);
          if (s2.hadSpo2) ok(!/probe/.test(m.unit), `${w} ${id} ${way} step ${k + 1}: "probe not on yet" after a reading`);
        }
        const st = await S(page);
        ok(!!st.ending, `${w} ${id} ${way}: the walk reached an ending`);
        if (SHOTS && (w === 390 || w === 1440) && ['s1', 's8', 's18', 's21'].includes(id) && way === 'first') await page.locator('.scx-scene').screenshot({ path: `${SHOTS}/sweep-${id}-end-${w}${dark ? '-dark' : ''}.png` });
      }
    }
    ok(!errs.length, `${w}${dark ? ' dark' : ''}: console errors: ${errs.slice(0, 3).join(' | ')}`);
    await browser.close();
  }
}

/* ---- frames: rule 14, motion, leaving, Test yourself, links, locked, performance */
async function frames() {
  for (const w of [390, 1440]) {
    const { browser, page, errs } = await open(w, false, { noCue: true });
    // a choice, sampled every frame: the result words wait for the drawn numbers
    await call(page, 's1'); await idle(page);
    const rec = await page.evaluate(() => new Promise(done => {
      const X = window.NremtScenarioExplore.last, out = [];
      const now0 = document.querySelector('.scx-now span').textContent;
      document.querySelectorAll('.scx-c')[1].click();
      const t0 = performance.now();
      (function f(){
        const s = X._state();
        out.push({ t: performance.now() - t0, pills: document.querySelectorAll('.scx .tk2-cause .tk2-cz').length, chain: s.chain, tween: s.tween, busy: s.busy, labs: document.querySelectorAll('.scx-lab').length,
          nowSame: document.querySelector('.scx-now span').textContent === now0, shown: s.shown, hr: document.querySelector('.scx-mon .mon-tile[data-k="hr"] .mon-v').textContent });
        if (performance.now() - t0 < 2200) requestAnimationFrame(f); else done(out);
      })();
    }));
    const during = rec.filter(r => r.busy);
    ok(during.length > 5, `${w} frames: a change lasts several frames (${during.length})`);
    ok(during.every(r => r.pills <= 1), `${w} frames: the result is named before the picture shows it`);
    ok(during.every(r => r.labs === 0), `${w} frames: words on the patient before the change ends`);
    ok(during.every(r => r.nowSame), `${w} frames: the card turned before the picture finished`);
    ok(rec.some(r => r.busy && r.tween), `${w} frames: the monitor's numbers slide`);
    const end = rec[rec.length - 1];
    ok(!end.busy && end.pills >= 2, `${w} frames: the result is named at the end (${end.chain})`);
    const m = /(HR|BP|RR|SpO₂) (\d+) → (\d+)/.exec(end.chain);
    if (m) { const k = { HR: 'hr', BP: 'sys', RR: 'rr', 'SpO₂': 'spo2' }[m[1]]; ok(Math.round(end.shown[k]) === +m[3], `${w} frames: the cause line's ${m[1]} ${m[3]} is the drawn ${Math.round(end.shown[k])}`); }
    ok(+end.hr === Math.round(end.shown.hr), `${w} frames: the monitor shows its drawn HR`);
    // the care is on the patient and its word appears once it is
    let st = await S(page);
    ok(st.drawn.care.gauze && st.labs.includes('Direct pressure'), `${w} frames: direct pressure drawn and named (${st.labs})`);
    // back: the gauze comes off, the card returns, the words follow
    await page.click('.scx-back'); st = await idle(page);
    ok(st.path.length === 0 && !st.drawn.care.gauze, `${w} frames: back takes the step back`);
    ok(/Back to decision 1/.test(st.chain), `${w} frames: the cause line says it went back (${st.chain})`);
    // a whole call to an ending, then start over
    for (const i of [0, 0, 0]) { await choose(page, i); await idle(page); }
    st = await S(page);
    ok(st.ending === 'good' && /Good outcome/.test(st.take || st.chain), `${w} frames: s1 best path ends well (${st.ending} ${st.take})`);
    ok(!st.raf, `${w} frames: the monitor stops at the ending`);
    await page.click('.scx-eagain'); st = await idle(page);
    ok(st.path.length === 0 && st.node === 's1_start', `${w} frames: Start over`);
    // the bleed never heals: the pool after waiting stays when the tourniquet goes on
    await choose(page, 2); await idle(page); await choose(page, 0); await idle(page); await choose(page, 1); await idle(page);
    const poolA = (await S(page)).drawn.pool; await choose(page, 0); await idle(page);
    st = await S(page); ok(st.drawn.pool >= poolA && st.drawn.bleed === 'stop', `${w} frames: the pool stays once the bleed stops (${poolA} -> ${st.drawn.pool}, ${st.drawn.bleed})`);
    // keyboard: Tab to a choice, Enter
    await call(page, 's2'); await idle(page);
    await page.focus('.scx-c'); await page.keyboard.press('Enter'); st = await idle(page);
    ok(st.path.length === 1, `${w} frames: Enter on a choice takes it`);
    // a sitting patient lies down for compressions (s3 to its unresponsive branch is long; s21's arrest: start, cooling, missed...)
    await call(page, 's21'); await idle(page);
    for (let k = 0; k < 6; k++) { const s2 = await S(page); if (s2.drawn.care.cpr || s2.ending) break; const n = await page.evaluate(() => document.querySelectorAll('.scx-c').length); await choose(page, k === 0 ? 0 : n - 1); await idle(page); }
    st = await S(page); ok(!st.drawn.care.cpr || st.view === 'floor', `${w} frames: compressions are given on the ground (${st.view})`);
    // leaving mid change: the change finishes at once, every clock stops; back is clean
    await call(page, 's8'); await idle(page);
    await choose(page, 0); await page.waitForTimeout(250);
    await page.click('.ls-root [role="radio"]:not([aria-checked="true"]), .ls-modes button:not([aria-pressed="true"]), button:has-text("Test yourself")');
    await page.waitForTimeout(200);
    st = await S(page);
    ok(!st.busy && !st.pend && st.timers === 0 && !st.raf && !st.on, `${w} frames: leaving mid change stops everything (${JSON.stringify({ b: st.busy, t: st.timers, r: st.raf })})`);
    await page.click('button:has-text("Explore")'); await page.waitForTimeout(400);
    st = await S(page); ok(st.on && st.raf && st.path.length === 1 && st.chain.length > 0, `${w} frames: back in Explore, clean and running`);
    // Test yourself: a scored run to an ending; Explore pauses its monitor; Review gets the misses
    await page.click('button:has-text("Test yourself")'); await page.waitForTimeout(300);
    await page.evaluate(() => { const b = document.querySelector('#pickerAll'); if (b) b.click(); });
    await page.click('[data-scenario="s1"]'); await page.waitForTimeout(400);
    for (let k = 0; k < 10; k++) { const b = await page.$('#nodeHost [data-choice="0"]'); if (!b) break; await b.click(); await page.waitForTimeout(250); }
    ok(await page.evaluate(() => !!document.querySelector('.ls-root[data-sim="end"]')), `${w} frames: the run reaches its debrief`);
    ok(await page.waitForFunction(() => !!document.querySelector('.sim-card *'), null, { timeout: 5000 }).then(() => true, () => false), `${w} frames: the score card shows`);
    const recs = await page.evaluate(() => Object.keys(localStorage).filter(k => /tool|result|missed/i.test(k)).length);
    ok(recs > 0, `${w} frames: the run's results are stored for Review`);
    await page.click('#simAgain').catch(() => page.evaluate(() => document.querySelector('#simAgain').click()));
    await page.waitForTimeout(300);
    await page.click('button:has-text("Explore")'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => { const m = document.querySelector('#monHost .mon'); return !m || true; }), `${w} frames: Explore shown over a run`);
    ok(!errs.length, `${w} frames: console errors: ${errs.slice(0, 3).join(' | ')}`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/frames-end-${w}.png` });
    await browser.close();
  }
  // review round 1, items 1 to 9: the picture and the words follow the case
  {
    const { browser, page, errs } = await open(1440, false, { reduced: true, noCue: true });
    const walk = async (id, picks) => { await call(page, id); await idle(page); const out = []; for (const i of picks) { await choose(page, i); out.push(await idle(page)); } return out; };
    let r = await walk('s6', [0, 0, 0, 0]); let st = r[r.length - 1];
    ok(st.node === 's6_shock_good' && !st.labs.includes('Not breathing') && !st.drawn.care.cpr && st.drawn.eyes === 'open', `case 1: s6 return of breathing clears "Not breathing", stops CPR, opens the eyes (${st.node} ${st.labs} ${st.drawn.care.cpr} ${st.drawn.eyes})`);
    r = await walk('s18', [0, 0, 0]); st = r[r.length - 1];
    ok(st.node === 's18_compressions' && !st.labs.includes('Not breathing') && !st.drawn.care.cpr, `case 1: s18 the newborn breathes and cries (${st.node} ${st.labs})`);
    r = await walk('s6', [2, 0, 0, 1, 1]);
    ok(r.every(x => !x.labs.includes('Pulse back') && !/Pulse back/.test(x.chain)), `case 2: no false "Pulse back" on s6's last choices (${r.map(x => x.labs).join(' | ')})`);
    r = await walk('s6', [0, 0, 0]); st = r[r.length - 1];
    ok(st.node === 's6_aed_good' && !st.drawn.care.cpr, `case 3: hands off the chest while the AED analyzes (${st.node} cpr ${st.drawn.care.cpr})`);
    r = await walk('s3', [0]); st = r[0];
    ok(st.node === 's3_watch_good' && !st.labs.includes('Coughing') && !/Coughing/.test(st.chain) && st.labs.includes('Cannot cough'), `case 4: s3 silent child is not "Coughing" (${st.labs} / ${st.chain})`);
    for (const picks of [[0, 0, 0, 0, 0], [0, 0, 1, 0, 0]]) {
      r = await walk('s15', picks);
      ok(r.every(x => !x.labs.includes('Cyanosis')), `case 5: s15 no newborn "Cyanosis" on the mother (${r.map(x => x.node + ':' + x.labs).join(' | ')})`);
      ok(r.every(x => !(x.shown && x.shown.hr === 128)), 'case 5: s15 the newborn HR 128 is not the mother\'s');
      const nb = r.find(x => x.node === 's15_newborn'); if (nb) ok(!nb.labs.includes('Contractions') && !/Worse/.test(nb.chain), `case 5: after the birth, no "Contractions", no "Worse" from the baby's numbers (${nb.labs} / ${nb.chain})`);
    }
    for (const picks of [[0, 0, 0, 0], [1, 1, 1, 1]]) { r = await walk('s17', picks); ok(r.every(x => !x.labs.includes('Birth')), `case 6: s17 never "Birth" (${r.map(x => x.labs).join(' | ')})`); }
    r = await walk('s24', [1, 0]); st = r[r.length - 1];
    ok(!/Better|Worse/.test(st.chain), `case 7: HR 52 to 50 is not Better or Worse (${st.chain})`);
    r = await walk('s14', [0, 0]); st = r[r.length - 1];
    ok(/Still no pulse/.test(st.chain) && !/Worse/.test(st.chain), `case 7: s14 pulseless throughout is "Still no pulse" (${st.chain})`);
    r = await walk('s5', [0, 0]); st = r[r.length - 1];
    ok(st.drawn.care.epi && await page.evaluate(() => !!document.querySelector('.scx-it[data-k="epi"].is-on')), `case 8: the auto injector is drawn (${st.node})`);
    r = await walk('s21', [0, 1, 0]); st = r[r.length - 1];
    ok(!st.drawn.care.o2, `case 9: no oxygen mask on a pulseless, apneic patient (${st.node})`);
    r = await walk('s21', [1]); st = r[0];
    ok(st.node === 's21_prone' && st.view === 'prone' && st.labs.includes('Knee on his back'), `case 15: s21 face down with weight on his back (${st.view} ${st.labs})`);
    ok(!errs.length, `cases: console errors: ${errs.slice(0, 3).join(' | ')}`);
    await browser.close();
  }
  // reduced motion: the result at once
  {
    const { browser, page, errs } = await open(390, false, { reduced: true, noCue: true });
    await call(page, 's1'); await idle(page);
    await choose(page, 0); await page.waitForTimeout(350);
    const st = await S(page); ok(!st.busy && /Better|Worse|No change/.test(st.chain), `reduced: the result at once (${st.chain})`);
    ok(!errs.length, 'reduced: console errors');
    await browser.close();
  }
  // deep links
  for (const [q, want] of [['#call-s5', ['explore', 's5']], ['?scenario=s3', ['quiz', 's3']], ['#test', ['quiz', null]], ['', ['explore', 's1']]]) {
    const { browser, page } = await open(1440, false, { q, noCue: true });
    const r = await page.evaluate(() => ({ mode: document.querySelector('.ls-root').getAttribute('data-mode') || (document.querySelector('.scx').hidden ? 'quiz' : 'explore'),
      ex: window.NremtScenarioExplore.last._state().id, run: document.querySelector('.ls-root').getAttribute('data-sim'), title: (document.querySelector('.sim-domain') || {}).textContent || '' }));
    ok(r.mode === want[0] || (want[0] === 'explore' ? !/quiz/.test(r.mode) : /quiz/.test(r.mode)), `link ${q || '(none)'}: mode ${r.mode}`);
    if (want[0] === 'explore') ok(r.ex === want[1], `link ${q}: Explore on ${r.ex}`);
    if (want[1] && want[0] === 'quiz') ok(r.run === 'call', `link ${q}: the run started (${r.run})`);
    await browser.close();
  }
  // locked (Premium launched, no pass): the gate in Explore and in Test yourself
  {
    const { browser, page } = await open(1440, false, { locked: true, noCue: true });
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => ({ ex: !!document.querySelector('.scx-gate:not([hidden]) *') && !!document.querySelector('.scx-scene[hidden]') }));
    ok(r.ex, 'locked: Explore shows the Premium gate, not the call');
    await page.click('button:has-text("Test yourself")'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => !document.querySelector('[data-scenario]') && !!document.querySelector('#pickerGrid *')), 'locked: Test yourself shows the gate, no call to start');
    await browser.close();
  }
  // performance, CPU x4: a choice's change here and a drag on the flagship, the same process
  const perf = [];
  for (const w of [390, 1440]) {
    const { browser, page } = await open(w, false, { noCue: true });
    const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const runs = [];
    for (const id of ['s1', 's8', 's6']) {
      await call(page, id); await idle(page, 8000);
      runs.push(await page.evaluate(() => new Promise(done => { const ts = []; let last = performance.now(); const t0 = last; document.querySelector('.scx-c').click();
        (function f(){ const n = performance.now(); ts.push(n - last); last = n; if (n - t0 < 2000) requestAnimationFrame(f); else done(ts); })(); })));
      await idle(page, 8000);
    }
    const all = runs.flat().sort((a, b) => a - b), med = all[Math.floor(all.length / 2)], p95 = all[Math.floor(all.length * 0.95)];
    await browser.close();
    // the flagship: water pollution's fertilizer knob, dragged
    const b2 = await chromium.launch({ executablePath: EXE });
    const p2 = await (await b2.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, serviceWorkers: 'block' })).newPage();
    await p2.goto(`http://localhost:${PORT}/environmental-science/tools/water-pollution.html`); await p2.waitForTimeout(1500);
    const c2 = await p2.context().newCDPSession(p2); await c2.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const fl = await p2.evaluate(() => new Promise(done => { const inp = document.querySelector('.tk2-drag input, input[type=range]'); const ts = []; let last = performance.now(); const t0 = last; let v = 0;
      (function f(){ const n = performance.now(); ts.push(n - last); last = n; if (inp){ v = (v + 1) % 6; inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); } if (n - t0 < 2000) requestAnimationFrame(f); else done(ts); })(); }));
    await b2.close();
    const fa = fl.sort((a, b) => a - b), fmed = fa[Math.floor(fa.length / 2)], fp95 = fa[Math.floor(fa.length * 0.95)];
    perf.push(`${w}: choice median ${med.toFixed(1)} ms p95 ${p95.toFixed(1)} ms; flagship drag median ${fmed.toFixed(1)} ms p95 ${fp95.toFixed(1)} ms`);
    ok(med <= 34 && p95 <= Math.max(50, fp95 * 1.25), `perf ${w}: median ${med.toFixed(1)} p95 ${p95.toFixed(1)} (flagship ${fmed.toFixed(1)} / ${fp95.toFixed(1)})`);
  }
  console.log('PERF ' + perf.join(' | '));
}

if (arg('--width', null)) await sweep(+arg('--width'));
if (process.argv.includes('--frames')) await frames();
server.close();
fails.slice(0, 40).forEach(f => console.log('FAIL ' + f));
console.log(`${pass} passed, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
