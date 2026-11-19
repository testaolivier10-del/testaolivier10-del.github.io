#!/usr/bin/env node
/* Tools v2 sweep: NREMT Skill sheets (docs/tools-v2-builder-brief.md, step 5; the pattern of nremt-sound-trainer-sweep.mjs).
   Every landmark state of Explore (the opening with the cue; for each of the ten stations: half the steps done, a step
   done out of order, every step done in order) at widths 360 to 1920, light and dark:
     - no sideways scroll; nothing clipped by the scene (the words on the patient, the "!" marks, the cue, the sheet's
       rows, the squeeze button, the tourniquet box);
     - no overlap (4 px at least) between the words on the patient, the "!" marks and the cue, nor between the
       sheet's rows;
     - the patient's picture is the largest thing in the scene; every row is at least 40 px tall;
     - every visible text is at least 11 px (the words on the patient included: they grow with the camera);
     - phones (640 px and under): the cause line is at most two rows and its height never changes.
   Review round 1: the row "!" only ever lands on a step that was done (every out of order state, and named cases);
   every frame of a camera move paints the whole picture; the log roll slides the board in while the words wait.
   And with --frames (390 and 1440): frame by frame (rule 14) the cause line names a step only once its item is on
   the patient (never on the first frames), the live "!" only with its words; a step taken back; keyboard; reduced
   motion (the result at once); leaving Explore mid change (the clock, the timers and the camera stop; coming back is
   clean); Test yourself: a run started, paused by Explore and resumed, finished with its result; the deep links;
   and taps with the CPU throttled x4 (median frame about 16 ms, p95 at most 50 ms). No console errors anywhere.
   One width per process: with no --width it runs itself once per width, in turn, then --frames.
   Usage: node scripts/tools-v2/nremt-skillsheets-sweep.mjs [--width <w>] [--frames] [--shots <dir>]
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
const KEYS = ['bleeding', 'bvm', 'oxygen', 'aed', 'longbone', 'joint', 'supine', 'seated', 'trauma', 'medical'];

if (!arg('--width', null) && !process.argv.includes('--frames')) {
  let pass = 0, fail = 0;
  const runs = WIDTHS.map(w => ['--width', String(w)]).concat([['--frames']]);
  for (const a of runs) {
    const r = spawnSync(process.execPath, [SELF, ...a, ...(SHOTS ? ['--shots', SHOTS] : [])], { encoding: 'utf8', timeout: 12 * 60 * 1000 });
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
const URL0 = `http://localhost:${PORT}/nremt/skillsheets.html`;
let pass = 0; const fails = [];
const ok = (c, msg) => { if (c) pass++; else fails.push(msg); };
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

async function open(w, dark, opts = {}) {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: w, height: opts.h || (w < 500 ? 844 : w < 1100 ? 1024 : 900) }, serviceWorkers: 'block', hasTouch: w < 500,
    reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  if (dark) await page.addInitScript(() => { try { localStorage.setItem('nremt_theme', 'dark'); } catch (e) {} });
  if (opts.noCue) await page.addInitScript(() => { try { localStorage.setItem('tk2c:nremt-skillsheets', '1'); } catch (e) {} });
  await page.goto(URL0 + (opts.q || ''));
  await page.waitForSelector('.ssx-pt .sp-svg image', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(800);
  return { browser, ctx, page, errs };
}
const S = page => page.evaluate(() => window.NremtSkillExplore.last._state());
async function station(page, k) { await page.evaluate(k => window.NremtSkillExplore.last.show(k), k); await page.waitForTimeout(500); }
async function tap(page, i) { await page.evaluate(i => document.querySelector(`.ssx-step[data-i="${i}"]`).click(), i); }
// the camera waits 1.4 s on a step, then moves for 0.65 s: wait past both, then until it has really stopped
async function settle(page) {
  await page.waitForTimeout(2200);
  for (let i = 0; i < 40; i++) { if (!await page.evaluate(() => { const P = window.NremtSkillExplore.last.patient(); return !!(P && P.raf); })) break; await page.waitForTimeout(100); }
  await page.waitForTimeout(150);
}

/* ---- the layout checks, run on one state */
async function measure(page) {
  return page.evaluate(() => {
    const box = document.querySelector('.ssx-scene'), B = box.getBoundingClientRect(), pt = document.querySelector('.ssx-pt .sp-stage');
    const P = pt.getBoundingClientRect();
    const vis = e => e && !e.hidden && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0;
    const R = (e, n) => { const r = e.getBoundingClientRect(); return { n, l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
    const plates = [...pt.querySelectorAll('.sp-plate')].filter(p => vis(p) && !p.closest('.sp-item:not(.on)') && +getComputedStyle(p.closest('.sp-item') || p).opacity > 0.5).map(p => R(p, 'plate ' + (p.textContent || '').trim().slice(0, 24)));
    const marks = [...pt.querySelectorAll('.sp-mark')].map(m => R(m.querySelector('.sp-mark-dot'), 'mark'));
    const cue = document.querySelector('.ssx-cuehost .tk2-cue');
    const rows = [...box.querySelectorAll('.ssx-step')].map((b, i) => R(b, 'row ' + (i + 1)));
    const extras = [...box.querySelectorAll('.sp-squeeze, .sp-place')].filter(vis).map(e => R(e, e.className));
    const texts = [];
    const tw = document.createTreeWalker(box.closest('.ssx'), NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) {
      const t = tw.currentNode, e = t.parentElement; if (!t.textContent.trim() || !vis(e)) continue;
      if (e.closest('.sp-item:not(.on)') || e.closest('.ssx-n span') && e.closest('.is-done') || e.closest('.tk2-sr') || e.closest('.sp-loading')) continue;
      let px = parseFloat(getComputedStyle(e).fontSize);
      if (e.closest('svg') && e.getScreenCTM) { const m = e.getScreenCTM(); px *= Math.hypot(m.a, m.b); }
      const r = e.getBoundingClientRect();
      if (e.closest('.ssx-pt') && (r.right < P.left || r.left > P.right || r.bottom < P.top || r.top > P.bottom)) continue;
      texts.push({ t: t.textContent.trim().slice(0, 24), px });
    }
    const cause = document.querySelector('.ssx .tk2-cause'), cs = getComputedStyle(cause);
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4;
    const pills = [...cause.querySelectorAll('.tk2-cz')].map(p => Math.round(p.getBoundingClientRect().top));
    return { B: R(box, 'scene'), P: R(pt, 'patient'), board: R(box.querySelector('.ssx-board'), 'board'), plates, marks, cue: cue ? R(cue, 'cue') : null, rows, extras, texts,
      scrollW: document.documentElement.scrollWidth, vw: innerWidth, vh: innerHeight, sy: scrollY, wide: box.classList.contains('is-wide'), causeH: cause.getBoundingClientRect().height,
      causeRows: cause.classList.contains('is-take') ? (() => { const r = document.createRange(); r.selectNodeContents(cause); return new Set([...r.getClientRects()].map(x => Math.round(x.top))).size; })() : new Set(pills).size };
  });
}
const over = (a, b, gap = 4) => a.l < b.r + gap && b.l < a.r + gap && a.t < b.b + gap && b.t < a.b + gap;
const inside = (a, B, tol = 1) => a.l >= B.l - tol && a.r <= B.r + tol && a.t >= B.t - tol && a.b <= B.b + tol;
function check(m, tag, w, causeH0) {
  ok(m.scrollW <= m.vw + 1, `${tag}: sideways scroll ${m.scrollW} > ${m.vw}`);
  const words = m.plates.concat(m.marks).concat(m.cue ? [m.cue] : []);
  words.forEach(x => ok(inside(x, x.n === 'cue' ? m.B : m.P), `${tag}: ${x.n} clipped by the picture`));
  m.extras.forEach(x => ok(inside(x, m.P), `${tag}: ${x.n} clipped`));
  for (let i = 0; i < m.plates.length; i++) for (let j = i + 1; j < m.plates.length; j++)
    ok(!over(m.plates[i], m.plates[j]), `${tag}: ${m.plates[i].n} overlaps ${m.plates[j].n}`);
  m.marks.forEach(a => m.plates.forEach(b => ok(!over(a, b, 2), `${tag}: a "!" mark overlaps ${b.n}`)));
  if (m.cue) m.rows.forEach(r => ok(!over(m.cue, r, 0), `${tag}: the cue covers ${r.n}`));
  m.rows.forEach(r => { ok(r.h >= 40, `${tag}: ${r.n} only ${Math.round(r.h)} px tall`); ok(inside(r, m.board), `${tag}: ${r.n} clipped by the clipboard`); });
  for (let i = 0; i < m.rows.length; i++) for (let j = i + 1; j < m.rows.length; j++) ok(!over(m.rows[i], m.rows[j], 0), `${tag}: ${m.rows[i].n} overlaps ${m.rows[j].n}`);
  // stacked (the clipboard under the picture): the picture is the largest thing in the first screen (review round 1
  // caps its height so the clipboard's head and two rows also show there)
  const boardSeen = m.wide ? m.board.h : Math.max(0, Math.min(m.board.b + m.sy, m.vh) - (m.board.t + m.sy));
  ok(m.P.w * m.P.h >= m.board.w * boardSeen, `${tag}: the patient is not the largest thing in the ${m.wide ? 'scene' : 'first screen'}`);
  const small = m.texts.filter(x => x.px < 10.95);
  ok(!small.length, `${tag}: text under 11 px: ${small.slice(0, 3).map(x => x.t + ' ' + x.px.toFixed(1)).join(', ')}`);
  if (w <= 640) {
    ok(m.causeRows <= 2, `${tag}: the cause line takes ${m.causeRows} rows`);
    if (causeH0 != null) ok(Math.abs(m.causeH - causeH0) < 1.5, `${tag}: the cause line height changed ${causeH0} -> ${m.causeH}`);
  }
}

async function shot(page, name) { if (SHOTS) await page.locator('.ssx').screenshot({ path: `${SHOTS}/${name}.png` }).catch(() => {}); }

const W = +arg('--width', 0);
if (W) {
  for (const dark of [false, true]) {
    const tagT = dark ? 'dark' : 'light';
    const { browser, page, errs } = await open(W, dark);
    await page.waitForTimeout(500);
    let m = await measure(page);
    ok(!!m.cue, `${W} ${tagT}: the first visit cue shows`);
    check(m, `${W} ${tagT} opening`, W, null);
    // review round 1: on the first screen a stacked layout shows the clipboard's head and its first two rows
    if (!m.wide) ok(m.rows.length > 1 && m.rows[1].b + m.sy <= m.vh + 1, `${W} ${tagT}: the first two rows are not in the first screen (${Math.round(m.rows[1].b + m.sy)} > ${m.vh})`);
    if (m.cue) ok(m.cue.b + m.sy <= m.vh + 1 && m.cue.t + m.sy >= 0, `${W} ${tagT}: the cue is off the first screen`);
    const causeH0 = m.causeH;
    if (!dark) await shot(page, `sweep-opening-${W}`);
    for (const k of KEYS) {
      await station(page, k);
      const n = await page.$$eval('.ssx-step', b => b.length);
      // half the steps, in order
      for (let i = 0; i < Math.ceil(n / 2); i++) await tap(page, i);
      await settle(page);
      check(await measure(page), `${W} ${tagT} ${k} half`, W, causeH0);
      // the rest, in order: nothing left showing
      for (let i = Math.ceil(n / 2); i < n; i++) await tap(page, i);
      await settle(page);
      const st = await S(page);
      ok(st.done.every(Boolean) && !st.live.length && /in the sheet’s order/.test(st.take), `${W} ${tagT} ${k}: all done in order gives the takeaway (${st.chain || st.take})`);
      m = await measure(page); check(m, `${W} ${tagT} ${k} all`, W, causeH0);
      if (W === 390 || W === 1440 || W === 768) await shot(page, `sweep-${k}-all-${W}-${tagT}`);
      // out of order: start over, then the last step first and the rest
      await page.click('.ssx-reset'); await page.waitForTimeout(400);
      await tap(page, n - 1); await tap(page, 1); await settle(page);
      m = await measure(page); check(m, `${W} ${tagT} ${k} out of order`, W, causeH0);
      const s2 = await S(page);
      const touched = await page.evaluate(n => { const d = window.NremtSkillExplore.last.patient().def; return !!(d.steps[n - 1].touch || d.steps[1].touch); }, n);
      ok(s2.live.includes('bsi') === touched, `${W} ${tagT} ${k}: a touch before gloves is marked only when there was one (${s2.live.join(',')})`);
      // review round 1: the row "!" lands only on a step that was done (the one done out of turn), never on a missing one
      const flags = await page.$$eval('.ssx-step.is-flag', b => b.map(x => ({ i: +x.dataset.i, done: x.classList.contains('is-done') })));
      ok(flags.every(x => x.done), `${W} ${tagT} ${k}: a "!" on a step not done (${JSON.stringify(flags)})`);
      ok(!s2.live.length || flags.length > 0, `${W} ${tagT} ${k}: an order problem with no row marked (${s2.live.join(',')})`);
      await page.click('.ssx-reset'); await page.waitForTimeout(300);
    }
    ok(!errs.length, `${W} ${tagT}: console errors ${errs.slice(0, 2).join(' | ')}`);
    await browser.close();
  }
}

if (process.argv.includes('--frames')) {
  for (const w of [390, 1440]) {
    const { browser, page, errs } = await open(w, false, { noCue: true });
    // the cause line waits for the picture: frames after a tap on the tourniquet step
    await tap(page, 0); await tap(page, 1); await settle(page);
    const before = (await S(page)).chain;
    const t0 = Date.now(); await tap(page, 2);
    const frames = [];
    for (let i = 0; i < 18; i++) {
      frames.push(await page.evaluate(() => { const st = window.NremtSkillExplore.last._state(), it = window.NremtSkillExplore.last.patient().tq;
        return { chain: st.chain, op: +getComputedStyle(it).opacity }; }));
      await page.waitForTimeout(40);
    }
    frames.forEach((f, i) => { if (/Tourniquet/.test(f.chain)) ok(f.op > 0.6, `${w} frames: the cause line names the tourniquet at opacity ${f.op} (frame ${i})`); });
    ok(frames[0].chain === before, `${w} frames: the cause line changed on the first frame`);
    ok(frames.some(f => /Tourniquet.*bleeding stops/.test(f.chain)), `${w} frames: the tourniquet's cause never came (${frames.map(f => f.chain).pop()})`);
    // taken back off
    await tap(page, 2); await settle(page);
    ok(/Tourniquet, then taken back off/.test((await S(page)).chain), `${w}: taking a step back says so`);
    ok(+await page.evaluate(() => getComputedStyle(window.NremtSkillExplore.last.patient().tq).opacity) < 0.05, `${w}: the tourniquet left the picture`);
    // a tap on the thigh places it (the tourniquet box, then the patient)
    await settle(page);
    const place = await page.$('.ssx-pt .sp-place:not([hidden])');
    ok(!!place, `${w}: the tourniquet box asks for a tap on the thigh`);
    await page.evaluate(() => { const P = window.NremtSkillExplore.last.patient(), L = window.NremtStationPatient.pure.L, IN = window.NremtStationPatient.pure.PX_PER_IN;
      const m = P.world.getScreenCTM(), x = L.wound[0], y = L.wound[1] - 2.5 * IN;
      P.svg.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: m.a * x + m.c * y + m.e, clientY: m.b * x + m.d * y + m.f })); });
    await settle(page);
    let st = await S(page);
    ok(st.done[2], `${w}: a tap on the thigh did the tourniquet step`);
    // review round 1: which row carries the "!" (always the step done out of turn)
    const flagged = () => page.$$eval('.ssx-step.is-flag', b => b.map(x => x.querySelector('.ssx-lab').textContent));
    const ORDER = [
      ['bvm', [0, 9], ['Ventilate'], 'ventilate before suction'],
      ['bvm', [0, 1, 2, 3, 4, 5, 6, 8], ['Oral airway'], 'OPA without reopening'],
      ['bvm', [0, 1, 2, 3, 4, 5, 6, 7, 9, 8], ['Oral airway'], 'OPA after breaths'],
      ['bleeding', [0, 1, 5, 2], ['Blanket'], 'blanket before the tourniquet'],
      ['bleeding', [1, 0], ['Direct pressure'], 'pressure before gloves'],
      ['supine', [1, 3, 0], ['Hold the head'], 'held without gloves'],
      ['longbone', [0, 1, 4, 2], ['Apply splint'], 'splint before the check'],
    ];
    for (const [k, seq, want, what] of ORDER) {
      await station(page, k);
      for (const i of seq) await tap(page, i);
      await settle(page);
      const got = await flagged();
      ok(want.every(x => got.includes(x)), `${w} order ${k} (${what}): flagged ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
      const notDone = await page.$$eval('.ssx-step.is-flag:not(.is-done)', b => b.length);
      ok(notDone === 0, `${w} order ${k} (${what}): a "!" on a step not done`);
      await page.click('.ssx-reset'); await page.waitForTimeout(300);
    }
    // wording: the effects named in review round 1
    await station(page, 'bleeding'); for (const i of [0, 1, 5, 2]) await tap(page, i); await settle(page);
    ok(/before the bleed was stopped/.test((await S(page)).chain), `${w}: shock care first says "before the bleed was stopped" (${(await S(page)).chain})`);
    await page.click('.ssx-reset'); await page.waitForTimeout(300);
    await station(page, 'longbone'); for (const i of [0, 1, 4]) await tap(page, i); await settle(page);
    ok(/Splint before the check/.test((await S(page)).chain), `${w}: a splint with no check says "Splint before the check" (${(await S(page)).chain})`);
    await page.click('.ssx-reset'); await page.waitForTimeout(300);
    // no blank band during a camera move: on every frame of a move the painted svgs cover the whole picture
    await station(page, 'bleeding'); await tap(page, 0); await page.waitForTimeout(200); await tap(page, 1);
    const cover = [];
    for (let i = 0; i < 70 && cover.length < 12; i++) {
      const f = await page.evaluate(() => { const P = window.NremtSkillExplore.last.patient(); if (!P.raf) return null;
        const S = P.stage.getBoundingClientRect();
        return [P.svg, P.svg2].map(v => { const r = v.getBoundingClientRect(); return r.left <= S.left + 1 && r.top <= S.top + 1 && r.right >= S.right - 1 && r.bottom >= S.bottom - 1; }); });
      if (f) cover.push(f.every(Boolean));
      await page.waitForTimeout(25);
    }
    ok(cover.length > 2, `${w}: caught the camera moving (${cover.length} frames)`);
    ok(cover.every(Boolean), `${w}: a camera frame left part of the picture unpainted (${cover.map(Number).join('')})`);
    await page.click('.ssx-reset'); await page.waitForTimeout(300);
    // the log roll: the board slides in under the patient while the body rolls; the words wait for it
    await station(page, 'supine');
    for (const i of [0, 1, 2, 3, 4]) await tap(page, i);
    await settle(page);
    await tap(page, 5);
    const roll = [];
    for (let i = 0; i < 16; i++) {
      roll.push(await page.evaluate(() => { const P = window.NremtSkillExplore.last.patient(), st = window.NremtSkillExplore.last._state();
        return { tx: P.lay.boardUnder.getAttribute('transform') || '', body: P.skinLayer.getAttribute('transform') || '', rolling: !!P.rolling, chain: st.chain }; }));
      await page.waitForTimeout(90);
    }
    ok(roll.some(f => /translate\((?!0\.0 )[1-9]/.test(f.tx)) && roll.some(f => /scale\(0\.[0-9]+ 1\)/.test(f.body)), `${w}: the log roll slides the board and rolls the body (${roll.map(f => f.tx).slice(0, 4).join(' | ')})`);
    roll.forEach((f, i) => { if (f.rolling) ok(!/Log roll/.test(f.chain), `${w}: the cause line named the log roll mid roll (frame ${i})`); });
    await settle(page);
    ok(/Log roll/.test((await S(page)).chain), `${w}: the log roll's cause came (${(await S(page)).chain})`);
    // seated: the move to the board is said out loud
    await station(page, 'seated'); await tap(page, 10); await settle(page);
    ok(/said out loud/.test((await S(page)).chain), `${w}: the seated move is worded as said out loud (${(await S(page)).chain})`);
    await page.click('.ssx-reset'); await page.waitForTimeout(300);
    // live marks: BVM ventilated through vomit
    await station(page, 'bvm');
    await tap(page, 0); await tap(page, 9); await settle(page);
    st = await S(page);
    ok(st.live.includes('suction') && /vomit/.test(st.chain), `${w}: BVM through vomit is marked (${st.live} / ${st.chain})`);
    ok(await page.$$eval('.ssx-pt .sp-mark', x => x.length) >= 1, `${w}: the "!" is on the patient`);
    // the bag: squeeze it twice
    const sq = await page.$('.ssx-pt .sp-sq-btn');
    ok(!!sq && await sq.isVisible(), `${w}: the bag can be squeezed once ventilating`);
    if (sq) { await sq.click(); await page.waitForTimeout(5400); await sq.click(); await page.waitForTimeout(300); st = await S(page); ok(/a minute/.test(st.chain), `${w}: the squeeze gives the rate (${st.chain})`); }
    // keyboard: arrows move along the sheet, Enter does the step
    await station(page, 'oxygen');
    await page.focus('.ssx-step[data-i="0"]'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await settle(page);
    st = await S(page);
    ok(st.done[1] && !st.done[0], `${w}: keyboard did step 2`);
    // leaving mid change: Test yourself, then back
    await tap(page, 0); await page.waitForTimeout(80);
    await page.click('.ls-modes button:has-text("Test yourself"), [role=radio]:has-text("Test yourself")');
    await page.waitForTimeout(400);
    st = await S(page);
    ok(!st.on && !st.tick && !st.timers && !st.cam, `${w}: leaving Explore stops the clock, timers and camera (${JSON.stringify({ on: st.on, tick: st.tick, timers: st.timers, cam: st.cam })})`);
    const sec = st.sec; await page.waitForTimeout(1300); ok((await S(page)).sec === sec, `${w}: the bleed clock stays still while hidden`);
    // Test yourself: a run, paused by Explore, resumed, finished
    await page.locator('.run-station', { hasText: 'Bleeding' }).first().click(); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll('#stationRunDock .run-step input').forEach((b, i) => { if (i < 2) { b.checked = true; b.dispatchEvent(new Event('change', { bubbles: true })); } }));
    await page.waitForTimeout(1200);
    await page.click('.ls-modes button:has-text("Explore"), [role=radio]:has-text("Explore")'); await page.waitForTimeout(300);
    ok(!await page.evaluate(() => window.NremtStationRun.running()), `${w}: the run's clock pauses in Explore`);
    const clk = await page.evaluate(() => document.getElementById('runClock').textContent);
    await page.waitForTimeout(2200);
    await page.click('.ls-modes button:has-text("Test yourself"), [role=radio]:has-text("Test yourself")'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => window.NremtStationRun.running()), `${w}: the run resumes`);
    const clk2 = await page.evaluate(() => document.getElementById('runClock').textContent);
    ok(clk2 === clk || parseInt(clk2.split(':')[1]) - parseInt(clk.split(':')[1]) <= 1, `${w}: the paused time did not count (${clk} -> ${clk2})`);
    await page.click('#runFinish'); await page.waitForTimeout(1200);
    ok(await page.$$eval('.sp-misses .sp-miss', x => x.length) > 0 && await page.$('#runAgain') != null, `${w}: the run's result shows its misses and Run it again`);
    if (w === 1440) await page.screenshot({ path: SHOTS ? `${SHOTS}/frames-run-result-${w}.png` : '/dev/null' }).catch(() => {});
    ok(!errs.length, `${w} frames: console errors ${errs.slice(0, 2).join(' | ')}`);
    await browser.close();

    // reduced motion: the result at once, a short cross fade
    const r = await open(w, false, { reduced: true, noCue: true });
    await tap(r.page, 0); await r.page.waitForTimeout(60);
    let rs = await S(r.page);
    ok(/Gloves on/.test(rs.chain), `${w} reduced: the cause line comes at once (${rs.chain})`);
    ok(await r.page.evaluate(() => getComputedStyle(document.querySelector('.ssx-pt .sp-item')).transitionDuration.split(',')[0].trim()) === '0.2s', `${w} reduced: items cross fade in 0.2 s`);
    await r.browser.close();

    // deep links: #station-<name> opens Explore on it; #run-<name> starts its run
    const d = await open(w, false, { q: '#station-joint-immobilization', noCue: true });
    ok((await S(d.page)).key === 'joint', `${w}: #station- opens Explore on that station`);
    await d.browser.close();
    const d2 = await open(w, false, { q: '#run-spinal-immobilization-supine-patient', noCue: true });
    ok(await d2.page.evaluate(() => /Supine/.test((document.querySelector('.run-name') || {}).textContent || '')), `${w}: #run- starts that station's run`);
    await d2.browser.close();

    // performance: taps (item in, camera move) with the CPU throttled x4
    const pf = await open(w, false, { noCue: true });
    const cdp = await pf.ctx.newCDPSession(pf.page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await pf.page.evaluate(() => { window.__f = []; let last = performance.now(); (function loop(t){ window.__f.push(t - last); last = t; if (window.__f.length < 400) requestAnimationFrame(loop); })(performance.now()); });
    for (let i = 0; i < 7; i++) { await tap(pf.page, i); await pf.page.waitForTimeout(700); }
    const fr = (await pf.page.evaluate(() => window.__f.slice(5))).sort((a, b) => a - b);
    const med = fr[Math.floor(fr.length / 2)], p95 = fr[Math.floor(fr.length * 0.95)];
    console.log(`perf ${w}: ${fr.length} frames, median ${med.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms`);
    ok(med <= 20 && p95 <= 50, `${w} perf: median ${med.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms`);
    await pf.browser.close();
  }
}

server.close();
fails.slice(0, 40).forEach(f => console.log('FAIL ' + f));
console.log(`${pass} passed, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
