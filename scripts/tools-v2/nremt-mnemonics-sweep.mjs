#!/usr/bin/env node
/* Tools v2 sweep: NREMT Mnemonics (docs/tools-v2-builder-brief.md, step 5; the pattern of simpson-diversity-sweep.mjs).
   Every landmark state of Explore (each tab: the opening, every letter, the takeaway) at widths 360 to 1920, light
   and dark:
     - no sideways scroll; nothing clipped by the picture (labels, badges, speech, keys, the patient chip, the cue);
     - no overlap between labels, badges, speech bubbles, the patient chip, the keys and the cue;
     - the patient is the largest thing in the picture, and the picture is the largest thing on the stage;
     - the letter keys are at least 44 px tall and 38 px wide (eight keys must fit a 360 px phone);
     - phones (640 px and under): the cause line is at most two rows and its height never changes;
   and, frame by frame at 390 and 1440 with motion on: a result word (the cause line's last pill, the letter's label)
   appears only when the picture shows the result (rule 14; no flash on the first frame of a change).
   One width per process (the builder brief): with no --width it runs itself once per width, in turn.
   Usage: node scripts/tools-v2/nremt-mnemonics-sweep.mjs [--width <w>] [--frames] [--shots <dir>] [--port <n>]
   Needs playwright (PW_ROOT names a folder whose node_modules has it) and Chromium (CHROMIUM_PATH). */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, mkdirSync } from 'node:fs';
import { dirname, extname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const SELF = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(dirname(SELF)));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const WIDTHS = [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
const SHOTS = arg('--shots', null);

if (!arg('--width', null) && !process.argv.includes('--frames')) {
  // the parent: one child process per width, then the frame checks
  let pass = 0, fail = 0;
  const runs = WIDTHS.map(w => ['--width', String(w)]).concat([['--frames']]);
  for (const a of runs) {
    const r = spawnSync(process.execPath, [SELF, ...a, ...(SHOTS ? ['--shots', SHOTS] : [])], { encoding: 'utf8', timeout: 9 * 60 * 1000 });
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
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const file = resolve(ROOT, '.' + p);
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }); createReadStream(file).pipe(res);
});
await new Promise(ok => server.listen(+arg('--port', 0), ok));
const PORT = server.address().port;
const URL0 = `http://localhost:${PORT}/nremt/mnemonics.html`;
const TABS = { dcap: 8, avpu: 4, opqrst: 6, sample: 6 };
let pass = 0; const fails = [];
const ok = (c, msg) => { if (c) pass++; else fails.push(msg); };

async function open(w, dark, opts = {}) {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : w < 1100 ? 1024 : 900 }, serviceWorkers: 'block', hasTouch: w < 500, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  if (dark) await page.addInitScript(() => { try { localStorage.setItem('nremt_theme', 'dark'); } catch (e) {} });
  if (opts.noCue) await page.addInitScript(() => { try { localStorage.setItem('tk2c:nremt-mnemonics', '1'); } catch (e) {} });
  await page.goto(URL0 + (opts.hash || '')); await page.waitForSelector('.mn2-body image', { timeout: 15000 }); await page.waitForTimeout(700);
  return { browser, page, errs };
}
async function until(page, fn, a) { for (let i = 0; i < 120; i++) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(60); } return false; }
async function tab(page, id) {
  await page.click(`.tk2-tab[data-v="${id}"]`);
  await until(page, (id) => document.querySelector('.mn2').dataset.tab === id && !!document.querySelector('.mn2-body image'), id);
  await page.waitForTimeout(350);
}
async function letter(page, i) {
  await page.click(`.mn2-key[data-i="${i}"]`);
  await until(page, (i) => document.querySelector('.mn2').dataset.done[i] === '1', i);
  await page.waitForTimeout(300);
}
const geo = (page) => page.evaluate(() => {
  const R = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const q = (s) => document.querySelector(s), qa = (s) => [...document.querySelectorAll(s)];
  const vis = (e) => { const c = getComputedStyle(e); return c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0.05 && e.getBoundingClientRect().width > 0; };
  const cause = q('.mn2 .tk2-cause');
  const of = (b) => { const k = b.dataset.of || ''; const e = k.startsWith('m:') ? q(`.mn2-mk[data-m="${k.slice(2)}"]`) : k.startsWith('p:') ? q(`[data-p="${k.slice(2)}"]`) : null; return e ? R(e) : null; };
  return { tab: q('.mn2').dataset.tab, face: R(q('.mn2-face')), sw: document.documentElement.scrollWidth, iw: innerWidth, stage: R(q('.mn2')), scene: R(q('.mn2-scene')), body: R(q('.mn2-body')), keys: R(q('.mn2-keys')),
    key: qa('.mn2-key').map(R), labs: qa('.mn2-lab').filter(vis).map(e => ({ ...R(e), text: e.textContent })), badges: qa('.mn2-badge').filter(vis).map(e => ({ ...R(e), text: e.textContent, of: of(e) })),
    bubs: qa('.mn2-bub.is-in').map(e => ({ ...R(e), text: e.textContent })), who: R(q('.mn2-who')), cue: q('.tk2-cue') ? R(q('.tk2-cue')) : null,
    props: qa('.mn2-cart, .mn2-purse, .mn2-scale.is-lit').map(R),
    head: R(q('.mn2 .tk2-head')), tabs: R(q('.mn2 .tk2-tabs')), lines: R(q('.mn2-lines')), acts: qa('.mn2-acts button').map(R),
    cause: { ...R(cause), text: cause.textContent, take: cause.classList.contains('is-take'), rows: [...new Set(qa('.mn2 .tk2-cause .tk2-cz').map(e => Math.round(e.getBoundingClientRect().top)))].length, pills: qa('.mn2 .tk2-cause .tk2-cz').map(R) } };
});
const hit = (a, b, pad = 0) => a.l < b.r - pad && a.r > b.l + pad && a.t < b.b - pad && a.b > b.t + pad;
const inside = (a, b, pad = 1) => a.l >= b.l - pad && a.r <= b.r + pad && a.t >= b.t - pad && a.b <= b.b + pad;
function check(g, tag) {
  const T = (c, m) => ok(c, `${tag}: ${m}`);
  T(g.sw <= g.iw + 1, `sideways scroll (${g.sw} > ${g.iw})`);
  const pic = { l: g.scene.l, r: g.scene.r, t: g.scene.t, b: g.keys.t };
  const things = [...g.labs.map(x => ['label ' + x.text, x]), ...g.badges.map(x => ['badge ' + x.text, x]), ...g.bubs.map(x => ['speech "' + x.text.slice(0, 20) + '"', x]), ['patient chip', g.who]];
  if (g.cue) things.push(['cue', g.cue]);
  things.forEach(([n, r]) => T(inside(r, n === 'cue' ? g.scene : pic), `${n} is clipped or under the keys (${Math.round(r.l)},${Math.round(r.t)},${Math.round(r.r)},${Math.round(r.b)} in ${Math.round(pic.l)},${Math.round(pic.t)},${Math.round(pic.r)},${Math.round(pic.b)})`));
  things.forEach(([n, r], i) => things.forEach(([m, s], j) => { if (j > i && !(n.startsWith('badge') && m.startsWith('badge')) && hit(r, s, 1)) T(false, `${n} overlaps ${m}`); }));
  things.filter(([n]) => n.startsWith('badge')).forEach(([n, r], i, arr) => arr.forEach(([m, s], j) => { if (j > i && hit(r, s, 4)) T(false, `${n} overlaps ${m}`); }));
  T(inside(g.keys, g.scene), 'the keys leave the picture');
  T(g.key.every(k => inside(k, g.keys, 6)), 'a key leaves the key row');
  T(g.key.every((k, i) => g.key.every((m, j) => i === j || !hit(k, m, 0.5))), 'keys overlap');
  T(g.key.every(k => k.h >= 44 && k.w >= 38), `a key is too small (${Math.round(Math.min(...g.key.map(k => k.w)))} x ${Math.round(Math.min(...g.key.map(k => k.h)))})`);
  // the patient is the largest thing in the picture; the picture the largest on the stage
  const bodyA = g.body.w * g.body.h, otherA = Math.max(g.keys.w * g.keys.h * 0.5, ...g.bubs.map(b => b.w * b.h), ...g.props.map(b => b.w * b.h));
  T(bodyA > 2 * otherA, `the patient is not the largest thing (${Math.round(bodyA)} vs ${Math.round(otherA)})`);
  // AVPU frames his head and shoulders on purpose: there the face must be whole and clear of the keys
  if (g.tab === 'avpu') T(inside(g.face, { ...g.scene, b: g.keys.t }), 'the face is clipped');
  else T(inside({ ...g.body, l: g.body.l + 2, r: g.body.r - 2, t: g.body.t + 2, b: g.body.b - 2 }, g.scene, 30), 'the patient is clipped');
  // a done letter's badge sits beside its finding, never on it
  g.badges.forEach(b => { if (b.of) T(!hit(b, b.of, 2), `badge ${b.text} covers its finding`); });
  T(g.scene.w >= g.stage.w - 2 && g.scene.h >= 2.5 * Math.max(g.lines.h, g.head.h, g.tabs.h) && g.scene.h >= 0.55 * g.stage.h, `the picture is not the largest thing (${Math.round(g.scene.h)} of ${Math.round(g.stage.h)})`);
  T(g.cause.pills.every(p => p.l >= g.lines.l - 1 && p.r <= g.lines.r + 1), 'a cause pill is clipped');
  T(!g.acts.some(a => g.cause.pills.some(p => hit(a, p))), 'a button overlaps the cause line');
  if (g.iw <= 640 && !g.cause.take) T(g.cause.rows <= 2, `the cause line takes ${g.cause.rows} rows`);
}

if (arg('--width', null)) {
  const w = +arg('--width');
  for (const dark of [false, true]) {
    const tag0 = `${w}${dark ? ' dark' : ''}`, heights = [];
    // the first visit: the cue, at full motion
    { const { browser, page, errs } = await open(w, dark);
      await page.waitForTimeout(500);
      const g = await geo(page); check(g, `${tag0} first visit`); ok(!!g.cue, `${tag0}: the first visit shows the cue`);
      ok(g.cue && !g.key.some(k => hit(k, g.cue)), `${tag0}: the cue covers a key`);
      if (SHOTS && !dark) { mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: join(SHOTS, `sweep-opening-${w}.png`) }); }
      ok(!errs.length, `${tag0} first visit: console errors: ${errs.join(' | ')}`);
      await browser.close(); }
    // every landmark state, with reduced motion (the same end states, at once)
    const { browser, page, errs } = await open(w, dark, { reduced: true, noCue: true });
    for (const [id, n] of Object.entries(TABS)) {
      await tab(page, id);
      { const g = await geo(page); check(g, `${tag0} ${id} opening`); heights.push([id + ' opening', g.cause.h]); }
      for (let i = 0; i < n; i++) {
        await letter(page, i);
        const g = await geo(page); check(g, `${tag0} ${id} letter ${i + 1}`); heights.push([id + ' ' + (i + 1), g.cause.h]);
        ok(g.labs.length <= 2, `${tag0} ${id} letter ${i + 1}: ${g.labs.length} labels at once`);
        if (i === n - 1) {
          ok(!g.cause.take && g.cause.pills.length === 3, `${tag0} ${id}: the last letter's result is not shown before the takeaway ("${g.cause.text}")`);
          await until(page, () => document.querySelector('.mn2 .tk2-cause').classList.contains('is-take'));
          const g2 = await geo(page); check(g2, `${tag0} ${id} takeaway`); heights.push([id + ' take', g2.cause.h]); ok(g2.cause.take, `${tag0} ${id}: no takeaway after the last letter`);
        }
        else ok(/→/.test(g.cause.text) || g.cause.pills.length === 3, `${tag0} ${id} letter ${i + 1}: cause line "${g.cause.text}"`);
        if (SHOTS && (w === 360 || w === 820 || w === 1440) && (i === n - 1 || (id === 'avpu' && i === 2)) && !dark) await page.screenshot({ path: join(SHOTS, `sweep-${id}-${i + 1}-${w}.png`) });
      }
      if (SHOTS && dark && (w === 390 || w === 1440)) await page.screenshot({ path: join(SHOTS, `sweep-${id}-all-${w}-dark.png`) });
      // Start over clears the patient
      await page.click('.mn2-reset'); await until(page, () => document.querySelector('.mn2').dataset.cur === '-1'); await page.waitForTimeout(200);
      { const g = await geo(page); ok(!g.labs.length && !g.badges.length && !g.bubs.length, `${tag0} ${id}: Start over leaves marks`); }
    }
    if (w <= 640) {
      const hs = heights.filter(h => !/opening/.test(h[0]) || true).map(h => Math.round(h[1]));
      ok(new Set(hs).size === 1, `${tag0}: the cause line changes height: ${[...new Set(hs)].join(', ')}`);
    }
    ok(!errs.length, `${tag0}: console errors: ${errs.join(' | ')}`);
    await browser.close();
  }
}

/* Frame by frame (motion on): a result word appears only once the picture shows it. */
if (process.argv.includes('--frames')) {
  for (const w of [390, 1440]) {
    const { browser, page, errs } = await open(w, false, { noCue: true });
    const plan = { dcap: [0, 1, 5, 7, 2], avpu: [0, 1, 2, 3], opqrst: [0, 3, 4], sample: [0, 2, 4] };
    let frames = 0, early = 0, mid = 0, firstFlash = 0;
    for (const [id, list] of Object.entries(plan)) {
      await tab(page, id);
      for (const i of list) {
        const log = await page.evaluate(async ({ id, i }) => {
          const q = (s) => document.querySelector(s), qa = (s) => [...document.querySelectorAll(s)], out = [];
          const op = (e) => e ? +getComputedStyle(e).opacity : 0;
          const L = window.NremtMnemonics.TABS.filter(t => t.id === id)[0].letters[i];
          const snap = () => {
            const pills = qa('.mn2 .tk2-cause .tk2-cz').length, take = q('.mn2 .tk2-cause').classList.contains('is-take');
            const cur = qa('.mn2-lab.is-cur').filter(e => op(e) > 0.05).length;
            let shown;
            if (id === 'dcap') { const m = q(`.mn2-mk[data-m="${i}"]`); shown = op(m) > 0.6; }
            else if (id === 'avpu') { const want = { A: 'open', V: 'open', P: 'grim', U: 'closed' }[L.k]; const f = q('.mn2-f.is-' + want), pt = q('.mn2-bub.is-pt'); shown = op(f) > 0.6 && (L.k === 'V' || L.k === 'P' ? pt.classList.contains('is-in') : true) && (L.k === 'A' ? pt.classList.contains('is-in') : true) && (L.k === 'A' || L.k === 'V' || op(q('.mn2-pinch')) > 0.6); }
            else { const b = q('.mn2-bub.is-pt'); shown = b.classList.contains('is-in') && op(b) > 0.6; }
            out.push({ pills, take, cur, shown });
          };
          q(`.mn2-key[data-i="${i}"]`).click(); snap();
          await new Promise(done => { const t0 = performance.now(); const f = () => { snap(); if (performance.now() - t0 < 4600) requestAnimationFrame(f); else done(); }; requestAnimationFrame(f); });
          return out;
        }, { id, i });
        frames += log.length;
        if (log[0].pills === 3 || log[0].cur) firstFlash++;
        log.forEach(f => { if (!f.shown) mid++; if ((f.pills === 3 || f.cur || f.take) && !f.shown) early++; });
      }
    }
    ok(early === 0, `${w} frames: ${early} frames where a result word shows before the picture does`);
    ok(firstFlash === 0, `${w} frames: ${firstFlash} changes flash a result on their first frame`);
    ok(mid > 20, `${w} frames: no frame caught a change in progress (${mid})`);
    ok(!errs.length, `${w} frames: console errors: ${errs.join(' | ')}`);
    console.log(`frames at ${w}: ${frames} checked, ${mid} mid change`);
    await browser.close();
  }
  // A phone 360 x 780: after a key, the cause line is on screen
  { const browser = await chromium.launch({ executablePath: EXE });
    const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, serviceWorkers: 'block', hasTouch: true });
    await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
    await ctx.addInitScript(() => { try { localStorage.setItem('tk2c:nremt-mnemonics', '1'); } catch (e) {} });
    const page = await ctx.newPage(); await page.goto(URL0); await page.waitForSelector('.mn2-body image'); await page.waitForTimeout(600);
    for (const id of ['dcap', 'avpu']) {
      await tab(page, id); await page.tap('.mn2-key[data-i="1"]');
      await until(page, () => document.querySelector('.mn2').dataset.done[1] === '1'); await page.waitForTimeout(700);
      const r = await page.evaluate(() => ({ cause: document.querySelector('.mn2 .tk2-cause').getBoundingClientRect().bottom, keys: document.querySelector('.mn2-keys').getBoundingClientRect().top, h: innerHeight }));
      ok(r.cause <= r.h && r.keys >= 0, `360 x 780 ${id}: the cause line is off screen after a key (${Math.round(r.cause)} of ${r.h})`);
    }
    await browser.close(); }
  // Reduced motion: the full result at once, with a short fade
  { const { browser, page, errs } = await open(390, false, { reduced: true, noCue: true });
    await page.click('.mn2-key[data-i="0"]'); await page.waitForTimeout(60);
    const r = await page.evaluate(() => ({ done: document.querySelector('.mn2').dataset.done, dur: getComputedStyle(document.querySelector('.mn2-mk[data-m="0"]')).transitionDuration, take: document.querySelector('.mn2 .tk2-cause').textContent }));
    ok(r.done[0] === '1' && /0\.15s/.test(r.dur) && /forearm/.test(r.take), `reduced motion: ${JSON.stringify(r)}`);
    ok(!errs.length, 'reduced motion: console errors'); await browser.close(); }
}

server.close();
console.log(`${pass} passed, ${fails.length} failed`);
fails.slice(0, 60).forEach(f => console.log('  FAIL ' + f));
process.exit(fails.length ? 1 : 0);
