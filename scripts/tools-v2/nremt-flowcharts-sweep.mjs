#!/usr/bin/env node
/* Tools v2 sweep: NREMT Protocol flowcharts (docs/tools-v2-builder-brief.md, step 5; the pattern of
   nremt-mnemonics-sweep.mjs). Every landmark state of Explore (each call: the opening, every decision with its arms
   live, the state after one wrong arm at every decision, the end with its takeaway) at widths 360 to 1920, light and
   dark:
     - no sideways scroll; nothing clipped by the picture (labels, speech, the patient chip, the clock, the cue);
       the card's boxes and arms inside the card, and the current decision with its arms in the card's view;
     - no overlap between labels, speech, the chip and the clock (4 px apart); arm buttons apart; the cue covers
       no arm, box or label;
     - the patient is the largest thing in the picture (larger than the card) and the picture the largest on the stage;
     - arm buttons at least 44 px tall; no rendered text under 11 px;
     - phones (640 px and under): the cause line at most two rows, its height constant;
   and, frame by frame at 390 and 1440 with motion on, through every pick (right and wrong): a label appears only
   when what it names is drawn (and faded in), an arm is live only once its finding is labelled, and the cause
   line's last pill only when the action or the consequence is drawn (rule 14). Plus: leaving Explore in the middle
   of a step and coming back (finished, nothing running), reduced motion, and frame times with the CPU slowed x4.
   One width per process (the builder brief): with no --width it runs itself once per width, in turn.
   Usage: node scripts/tools-v2/nremt-flowcharts-sweep.mjs [--width <w>] [--frames] [--shots <dir>] [--port <n>]
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
const URL0 = `http://localhost:${PORT}/nremt/flowcharts.html`;
// each call: the right arm at each decision, and one wrong arm tried first
const PATHS = {
  primary: [['Voice', 'Alert'], ['Yes', 'No'], ['No', 'Yes'], ['Yes', 'No'], ['Yes', 'No'], ['Yes', 'No']],
  arrest: [['No', 'Yes'], ['No pulse', 'Both normal'], ['Shock', 'No shock']]
};
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
  if (!opts.cue) await page.addInitScript(() => { try { localStorage.setItem('tk2c:nremt-flowcharts', '1'); } catch (e) {} });
  await page.goto(URL0 + (opts.hash || '')); await page.waitForSelector('.fx2-fig image', { timeout: 15000 });
  return { browser, page, errs };
}
async function until(page, fn, a, n = 160) { for (let i = 0; i < n; i++) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(60); } return false; }
const askReady = (page) => until(page, () => document.querySelector('.fx2-scene').getAttribute('data-phase') === 'ask' && document.querySelectorAll('.fx2-arm.is-live').length > 0);
const endReady = (page) => until(page, () => document.querySelector('.fx2 .tk2-cause').classList.contains('is-take'), null, 200);
async function arm(page, text) {
  await page.evaluate((t) => { const b = [...document.querySelectorAll('.fx2-arm.is-live')].find(x => x.querySelector('.fx2-arm-t').textContent.trim() === t); if (!b) throw new Error('no live arm ' + t); b.click(); }, text);
}
const geo = (page) => page.evaluate(() => {
  const R = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const q = (s) => document.querySelector(s), qa = (s) => [...document.querySelectorAll(s)];
  const vis = (e) => { const c = getComputedStyle(e); return c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0.05 && e.getBoundingClientRect().width > 0; };
  const scene = q('.fx2-scene'), sc = q('#fx2-sc rect'), k = scene.getBoundingClientRect().width / +q('.fx2-svg').viewBox.baseVal.width;
  const sr = scene.getBoundingClientRect(), pic = { l: sr.left + +sc.getAttribute('x') * k, t: sr.top + +sc.getAttribute('y') * k };
  pic.r = pic.l + +sc.getAttribute('width') * k; pic.b = pic.t + +sc.getAttribute('height') * k; pic.w = pic.r - pic.l; pic.h = pic.b - pic.t;
  const img = q('.fx2-fig image'), ib = img ? R(img) : null, body = ib ? { l: Math.max(ib.l, pic.l), t: Math.max(ib.t, pic.t), r: Math.min(ib.r, pic.r), b: Math.min(ib.b, pic.b) } : null;
  // the smallest rendered text in the stage (labels, card, arms, chips, speech, cause line, AED words)
  let minText = 99, minWho = '';
  qa('.fx2 *').forEach(e => { if (!e.childNodes.length || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return; if (!vis(e) || e.closest('[hidden]')) return;
    const fs = parseFloat(getComputedStyle(e).fontSize) * (e instanceof SVGElement && e.getScreenCTM ? e.getScreenCTM().a : 1); if (fs < minText){ minText = fs; minWho = e.className.baseVal != null ? e.className.baseVal : e.className; } });
  const cause = q('.fx2 .tk2-cause'), dec = qa('.fx2-node.is-dec').pop(), arms = qa('.fx2-arms').pop();
  return { sw: document.documentElement.scrollWidth, iw: innerWidth, stage: R(q('.fx2')), scene: R(scene), pic, body,
    board: R(q('.fx2-board')), view: R(q('.fx2-view')), paper: R(q('.fx2-paper')), nodes: qa('.fx2-node').map(e => ({ ...R(e), text: e.textContent })),
    arms: qa('.fx2-arm').map(e => ({ ...R(e), text: e.textContent, live: e.classList.contains('is-live') })), dec: dec ? R(dec) : null, armRow: arms ? R(arms) : null,
    labs: qa('.fx2-lab').filter(vis).map(e => ({ ...R(e), text: e.textContent })), bub: q('.fx2-bub.is-on') ? R(q('.fx2-bub.is-on')) : null,
    who: R(q('.fx2-who')), clock: q('.fx2-clock.is-on') ? R(q('.fx2-clock')) : null, cue: q('.tk2-cue') ? R(q('.tk2-cue')) : null, aed: q('.fx2-aed.is-on') ? R(q('.fx2-aed')) : null,
    head: R(q('.fx2 .tk2-head')), tabs: R(q('.fx2 .tk2-tabs')), foot: R(q('.fx2-lines-row')), minText, minWho,
    cause: { ...R(cause), take: cause.classList.contains('is-take'), rows: [...new Set(qa('.fx2 .tk2-cause .tk2-cz').map(e => Math.round(e.getBoundingClientRect().top)))].length, pills: qa('.fx2 .tk2-cause .tk2-cz').map(R) } };
});
const hit = (a, b, pad = 0) => a.l < b.r + pad && a.r > b.l - pad && a.t < b.b + pad && a.b > b.t - pad;
const inside = (a, b, pad = 1) => a.l >= b.l - pad && a.r <= b.r + pad && a.t >= b.t - pad && a.b <= b.b + pad;
function check(g, tag) {
  const T = (c, m) => ok(c, `${tag}: ${m}`);
  T(g.sw <= g.iw + 1, `sideways scroll (${g.sw} > ${g.iw})`);
  const things = [...g.labs.map(x => ['label ' + x.text, x]), ['patient chip', g.who]];
  if (g.bub) things.push(['speech', g.bub]);
  if (g.clock) things.push(['clock', g.clock]);
  things.forEach(([n, r]) => T(inside(r, g.pic), `${n} is clipped (${Math.round(r.l)},${Math.round(r.t)},${Math.round(r.r)},${Math.round(r.b)} in ${Math.round(g.pic.l)},${Math.round(g.pic.t)},${Math.round(g.pic.r)},${Math.round(g.pic.b)})`));
  things.forEach(([n, r], i) => things.forEach(([m, s], j) => { if (j > i && hit(r, s, 4)) T(false, `${n} overlaps ${m}`); }));
  if (g.aed) g.labs.forEach(l => T(!hit(l, g.aed, 2), `label ${l.text} covers the AED`));
  things.forEach(([n, r]) => T(!hit(r, g.board, 2), `${n} runs onto the card`));
  if (g.cue) {
    T(inside(g.cue, g.scene), 'the cue is clipped');
    T(![...g.arms, ...g.nodes, ...g.labs].some(r => hit(r, g.cue, 0)), 'the cue covers an arm, a box or a label');
  }
  // the card: boxes and arms inside it across; the newest decision and its arms in its view
  g.nodes.forEach(n => T(n.l >= g.paper.l - 1 && n.r <= g.paper.r + 1, `box "${n.text}" leaves the card`));
  g.arms.forEach(a => T(a.l >= g.paper.l - 1 && a.r <= g.paper.r + 1, `arm "${a.text}" leaves the card`));
  g.arms.forEach((a, i) => g.arms.forEach((b, j) => { if (j > i && hit(a, b, -0.5)) T(false, `arms "${a.text}" and "${b.text}" overlap`); }));
  T(g.arms.every(a => a.h >= 44), `an arm is under 44 px tall (${Math.round(Math.min(...g.arms.map(a => a.h)))})`);
  if (g.armRow && g.arms.some(a => a.live)) T(inside(g.armRow, g.view, 1) && inside(g.dec, g.view, 1), 'the live decision or its arms are out of the card view');
  // the patient is the largest thing; the picture the largest on the stage
  const bodyA = g.body ? (g.body.r - g.body.l) * (g.body.b - g.body.t) : 0;
  T(bodyA > g.board.w * g.board.h, `the patient (${Math.round(bodyA)}) is not larger than the card (${Math.round(g.board.w * g.board.h)})`);
  T(g.scene.h >= 2.5 * Math.max(g.foot.h, g.head.h, g.tabs.h) && g.scene.w >= g.stage.w - 2, 'the picture is not the largest thing on the stage');
  T(g.minText >= 10.95, `text under 11 px (${g.minText.toFixed(1)} on ${g.minWho})`);
  T(g.cause.pills.every(p => p.l >= g.foot.l - 1 && p.r <= g.foot.r + 1), 'a cause pill is clipped');
  if (g.iw <= 640 && !g.cause.take) T(g.cause.rows <= 2, `the cause line takes ${g.cause.rows} rows`);
}

if (arg('--width', null)) {
  const w = +arg('--width');
  for (const dark of [false, true]) {
    const tag0 = `${w}${dark ? ' dark' : ''}`;
    // the first visit: the cue
    { const { browser, page, errs } = await open(w, dark, { cue: true });
      await askReady(page); await page.waitForTimeout(400);
      const g = await geo(page); check(g, `${tag0} first visit`); ok(!!g.cue, `${tag0}: the first visit shows the cue`);
      if (SHOTS && !dark) { mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: join(SHOTS, `sweep-opening-${w}.png`) }); }
      ok(!errs.length, `${tag0} first visit: console errors: ${errs.join(' | ')}`);
      await browser.close(); }
    for (const call of Object.keys(PATHS)) {
      const { browser, page, errs } = await open(w, dark, { hash: '#call-' + call });
      const heights = [];
      for (let s = 0; s < PATHS[call].length; s++) {
        const [right, wrong] = PATHS[call][s];
        ok(await askReady(page), `${tag0} ${call} step ${s}: arms never live`); await page.waitForTimeout(350);
        let g = await geo(page); check(g, `${tag0} ${call} step ${s} ask`); heights.push(Math.round(g.cause.h));
        await arm(page, wrong); await askReady(page); await page.waitForTimeout(450);
        g = await geo(page); check(g, `${tag0} ${call} step ${s} after wrong ${wrong}`); heights.push(Math.round(g.cause.h));
        ok(g.arms.some(a => /\S/.test(a.text) && a.text.includes(wrong)), `${tag0} ${call}: the wrong arm stays on the card`);
        if (SHOTS && !dark && (w === 390 || w === 1440)) await page.screenshot({ path: join(SHOTS, `sweep-${call}-${s}-wrong-${w}.png`) });
        await arm(page, right);
      }
      ok(await endReady(page), `${tag0} ${call}: the takeaway never shows`); await page.waitForTimeout(300);
      const g = await geo(page); check(g, `${tag0} ${call} end`);
      if (w <= 640) ok(new Set(heights.concat(Math.round(g.cause.h))).size === 1, `${tag0} ${call}: the cause line height changes (${[...new Set(heights)].join(', ')})`);
      if (SHOTS && !dark) await page.screenshot({ path: join(SHOTS, `sweep-${call}-end-${w}.png`) });
      if (SHOTS && dark && (w === 390 || w === 1440)) await page.screenshot({ path: join(SHOTS, `sweep-${call}-end-${w}-dark.png`) });
      // start over: a clean patient and a blank card
      await page.click('.fx2-reset'); await askReady(page); await page.waitForTimeout(300);
      ok(await page.evaluate(() => document.querySelectorAll('.fx2-node').length === 2 && !document.querySelector('.fx2-clock.is-on')), `${tag0} ${call}: Start over leaves old boxes or the clock`);
      ok(!errs.length, `${tag0} ${call}: console errors: ${errs.join(' | ')}`);
      await browser.close();
    }
  }
}

if (process.argv.includes('--frames')) {
  // label -> what must be drawn (and faded in) when it shows
  const NEED = { 'Eyes open to voice': '.fx2-eo', 'Spurting blood': '.fx2-jets', 'Snoring': '.fx2-snore', 'Chest rises fully': '.fx2-rise', 'Fast, weak pulse': '.fx2-wrist',
    'Pale, sweaty': '.fx2-sweat', 'Tourniquet': '.fx2-tq', 'Jaw thrust': '.fx2-jaw', 'Blanket': '.fx2-blanket', 'Lips turn blue': '.fx2-lips', 'Carotid, 10 s': '.fx2-carotid',
    'Pads': '.fx2-pads', '30 pushes, 2 breaths': '.fx2-cpr', 'CPR again': '.fx2-cpr', 'Shock advised': '.fx2-aed.is-adv .fx2-aed-t', 'Gasping': '.fx2-rl' };
  // the cause line's last pill -> what must be drawn
  const RES = { 'the spurting stops': ['.fx2-tq', '!.fx2-jets'], 'air moves freely': ['.fx2-jaw', '!.fx2-snore'], 'blanket on, kept warm': ['.fx2-blanket'], 'more blood lost': ['pool'],
    'tongue still blocks it': ['.fx2-lips'], 'blood pushed to the brain': ['.fx2-cpr'], 'shock, then CPR at once': ['.fx2-cpr'] };
  for (const w of [390, 1440]) {
    const { browser, page, errs } = await open(w, false, { hash: '' });
    const cdp = await page.context().newCDPSession(page);
    for (const call of Object.keys(PATHS)) {
      await page.evaluate((c) => { location.hash = '#call-' + c; }, call);
      await page.waitForTimeout(300);
      let frames = 0, bad = [];
      const sample = async () => {
        const r = await page.evaluate(([NEED, RES]) => {
          const op = (sel) => { const neg = sel[0] === '!'; const s = neg ? sel.slice(1) : sel; if (s === 'pool') { const p = document.querySelector('.fx2-pool'); const m = /scale\(([\d.]+)/.exec(p.style.transform || ''); return m && +m[1] > 1.2 ? 1 : 0; }
            const e = document.querySelector(s); if (!e) return neg ? 1 : 0; let o = 1, x = e; while (x && x.tagName !== 'svg') { o *= +getComputedStyle(x).opacity; x = x.parentElement; } const on = (e.closest('.fx2-on > g') || e).classList.contains('is-on') || /fx2-aed/.test(s) || s === '.fx2-rl';
            return neg ? (on ? 0 : 1) : (on ? o : 0); };
          const out = [];
          document.querySelectorAll('.fx2-lab.is-in').forEach(l => { const s = NEED[l.textContent]; if (s && op(s) < 0.85 && +getComputedStyle(l).opacity > 0.05) out.push('label "' + l.textContent + '" before its drawing (' + op(s).toFixed(2) + ')'); });
          if (document.querySelector('.fx2-arm.is-live') && !document.querySelector('.fx2-lab.is-in') && document.querySelector('.fx2-scene').getAttribute('data-phase') === 'ask') out.push('arms live with no finding labelled');
          const pills = [...document.querySelectorAll('.fx2 .tk2-cause .tk2-cz')], last = pills[2];
          if (last) { const need = RES[last.textContent]; if (need && need.some(s => op(s) < 0.85)) out.push('cause "' + last.textContent + '" before the picture'); }
          return out;
        }, [NEED, RES]);
        frames++; bad.push(...r);
      };
      for (let s = 0; s < PATHS[call].length; s++) {
        const [right, wrong] = PATHS[call][s];
        await askReady(page);
        for (const a of [wrong, right]) {
          await arm(page, a);
          for (let f = 0; f < 70; f++) { await sample(); await page.waitForTimeout(40); if (f > 8 && await page.evaluate(() => document.querySelector('.fx2-scene').getAttribute('data-phase') === 'ask' || document.querySelector('.fx2 .tk2-cause').classList.contains('is-take'))) break; }
          if (a === wrong) await askReady(page);
        }
      }
      ok(!bad.length, `frames ${w} ${call}: ${[...new Set(bad)].slice(0, 6).join('; ')}`);
      ok(frames > 100, `frames ${w} ${call}: too few frames sampled (${frames})`);
      console.log(`frames ${w} ${call}: ${frames} sampled`);
    }
    // leave in the middle of a step, come back: finished, nothing running
    await page.evaluate(() => { location.hash = '#call-primary'; }); await page.waitForTimeout(200);
    await page.click('.fx2-reset'); await askReady(page);
    await arm(page, 'Voice'); await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Test yourself' }).click(); await page.waitForTimeout(200);
    ok(await page.evaluate(() => document.querySelector('.fx2-scene').getAttribute('data-phase') === 'ask'), `frames ${w}: leaving mid step does not finish it`);
    const before = await page.evaluate(() => document.querySelector('.fx2-chart').innerHTML.length);
    await page.waitForTimeout(2500);
    ok(await page.evaluate((b) => document.querySelector('.fx2-chart').innerHTML.length === b, before), `frames ${w}: something runs while Explore is hidden`);
    await page.getByRole('button', { name: 'Explore' }).click(); await page.waitForTimeout(700);
    check(await geo(page), `frames ${w} back from Test yourself`);
    // frame times with the CPU slowed x4 during a step with motion (the tourniquet, the jets)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await askReady(page);
    const times = await page.evaluate(() => new Promise(res => { const t = []; let last = performance.now(); const b = [...document.querySelectorAll('.fx2-arm.is-live')].find(x => x.textContent.trim() === 'Yes'); b.click();
      function f(n){ t.push(n - last); last = n; if (t.length < 120) requestAnimationFrame(f); else res(t); } requestAnimationFrame(f); }));
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    times.sort((a, b) => a - b);
    const med = times[Math.floor(times.length / 2)], p95 = times[Math.floor(times.length * 0.95)];
    console.log(`frames ${w}: frame time median ${med.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms (CPU x4)`);
    ok(med <= 20 && p95 <= 50, `frames ${w}: slow frames (median ${med.toFixed(1)}, p95 ${p95.toFixed(1)})`);
    ok(!errs.length, `frames ${w}: console errors: ${errs.join(' | ')}`);
    await browser.close();
  }
  // reduced motion: the whole arrest call, results at once
  { const { browser, page, errs } = await open(390, false, { reduced: true, hash: '#call-arrest' });
    for (const [right] of PATHS.arrest) { ok(await askReady(page), 'reduced: arms live'); await arm(page, right); }
    ok(await endReady(page), 'reduced: the takeaway shows');
    check(await geo(page), 'reduced end');
    ok(!errs.length, `reduced: console errors: ${errs.join(' | ')}`);
    await browser.close(); }
}

console.log(`${pass} passed, ${fails.length} failed`);
fails.slice(0, 40).forEach(f => console.log('FAIL ' + f));
server.close();
process.exit(fails.length ? 1 : 0);
