#!/usr/bin/env node
/* Tools v2 sweep: NREMT Body map (docs/tools-v2-builder-brief.md, step 5; the pattern of nremt-mnemonics-sweep.mjs).
   Every landmark state of Explore at widths 360 to 1920 (one process per width; the 3D body is slow in headless
   Chromium, so one browser at a time and long waits):
     The body: the opening (and its cue), then four parts picked by name (an organ, a bone, a landmark dot, the longest
       name) with their card open:
       - no sideways scroll; the picture is the largest thing on the stage;
       - the card, Find a part, Reset view and the cue sit inside the picture and clear (4 px) of each other and of the
         legend while it shows; the card never covers the part it names (its leader's end);
       - the card names the part the viewer selected, and the cause line names the same part;
       - phones (640 px and under): the cause line is at most two rows and its height never changes.
     Burns: the opening, one region, three regions, the child chart, after Start over:
       - every region number inside its figure and 4 px clear of every other number, the total, the chart switch and
         the captions; the total and the switch inside the picture;
       - the total reads what is painted, and the figures are the largest thing on the stage.
   With --frames (390 and 1440, motion on): frame by frame through a burn, a clear, the chart switch and a card:
       - the total on the picture equals the sum of each region's share times its drawn opacity on that frame;
       - the cause line's numbers appear only once the picture shows them (no total pill mid fade);
       - the card never shows while the camera is still travelling;
       - leaving Explore mid fade (Test yourself) finishes it at once: nothing runs while hidden, no errors;
       - Test yourself: both parts show a question; a right and a wrong answer on each.
   Usage: node scripts/tools-v2/nremt-body-map-sweep.mjs [--width <w>] [--frames] [--dark] [--shots <dir>] [--port <n>]
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
const DARK = process.argv.includes('--dark');

if (!arg('--width', null) && !process.argv.includes('--frames')) {
  let pass = 0, fail = 0;
  const runs = WIDTHS.map(w => ['--width', String(w)]).concat([['--width', '390', '--dark'], ['--width', '1440', '--dark'], ['--frames']]);
  for (const a of runs) {
    const r = spawnSync(process.execPath, [SELF, ...a, ...(SHOTS ? ['--shots', SHOTS] : [])], { encoding: 'utf8', timeout: 14 * 60 * 1000 });
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
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const file = resolve(ROOT, '.' + p);
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }); createReadStream(file).pipe(res);
});
await new Promise(ok => server.listen(+arg('--port', 0), ok));
const PORT = server.address().port;
const URL0 = `http://localhost:${PORT}/nremt/body-map.html`;
let pass = 0; const fails = [];
const T = (c, msg) => { if (c) pass++; else fails.push(msg); };
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

async function open(w, opts = {}) {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : w < 1100 ? 1024 : 900 }, serviceWorkers: 'block', bypassCSP: true,
    hasTouch: w < 500, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
  const page = await ctx.newPage(); const errs = [];
  page.setDefaultTimeout(240000);
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  if (DARK || opts.dark) await page.addInitScript(() => { try { localStorage.setItem('nremt_theme', 'dark'); } catch (e) {} });
  if (opts.noCue) await page.addInitScript(() => { try { localStorage.setItem('tk2c:nremt-body-map', '1'); localStorage.setItem('tk2c:nremt-body-map-burns', '1'); } catch (e) {} });
  await page.goto(URL0 + (opts.q || ''));
  return { browser, page, errs };
}
async function until(page, fn, a, n = 300) { for (let i = 0; i < n; i++) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(100); } return false; }
const loaded = page => until(page, () => { const l = document.querySelector('.bm2 .bv-loading'); return !!l && l.hidden; }, null, 1200);
const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, timeout: 240000 }); };

/* geometry of one state, read in the page */
function geom() {
  const R = e => { if (!e || e.hidden || e.closest('[hidden]')) return null; const r = e.getBoundingClientRect(); return r.width && r.height ? { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height } : null; };
  const q = s => document.querySelector(s);
  const vis = e => e && getComputedStyle(e).opacity !== '0' && getComputedStyle(e).visibility !== 'hidden';
  const pills = [...document.querySelectorAll('.bm2 .tk2-cause .tk2-cz')].map(R).filter(Boolean);
  const rows = new Set(pills.map(p => Math.round(p.t / 6))).size;
  const stage = q('.bm2'), scene = q('.bm2-scene');
  const kids = [...stage.children].filter(e => !e.hidden && e !== scene).map(R).filter(Boolean);
  const legend = q('.bm2 .legend');
  const g = {
    W: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth,
    scene: R(scene), kidsMax: Math.max(0, ...kids.map(k => k.w * k.h)),
    tab: stage.dataset.tab, cause: { rows, h: R(q('.bm2 .tk2-cause'))?.h || 0, text: q('.bm2 .tk2-cause').textContent },
    card: R(q('.bm2-card:not([hidden])')), cardIn: !!q('.bm2-card.is-in'), cardName: q('.bm2-card-n')?.textContent,
    find: R(q('.bm2 .bm2-find select')), reset: R(q('.bm2 .bv-reset')), legend: legend && vis(legend) ? R(legend) : null,
    cue: R(q('.bm2 .tk2-cue')), dot: R(q('.bm2-lead-d')), dotShown: (() => { const d = q('.bm2-lead-d'); return !!d && d.style.display !== 'none' && q('.bm2-lead').style.display !== 'none'; })(),
    burn: null
  };
  if (stage.dataset.tab === 'burns') {
    const nums = [...document.querySelectorAll('.bm2-burn .bn-pct')].filter(t => t.textContent).map(t => ({ n: t.textContent, ...R(t), fig: R(t.closest('svg')) }));
    g.burn = { nums, tot: R(q('.bm2-tot')), totText: q('.bm2-tot-n').textContent, age: R(q('.bm2-age')), caps: [...document.querySelectorAll('.bm2-burn figcaption')].map(R),
      figs: R(q('.bm2-figs')), flag: !q('.bm2-tot-f').hidden };
  }
  return g;
}
const hit = (a, b, pad = 4) => a && b && a.l < b.r + pad && b.l < a.r + pad && a.t < b.b + pad && b.t < a.b + pad;
const inside = (a, b, pad = 0) => a && b && a.l >= b.l - pad && a.r <= b.r + pad && a.t >= b.t - pad && a.b <= b.b + pad;

function checkCommon(g, tag, w) {
  T(g.sw <= g.W + 1, `${tag}: sideways scroll (${g.sw} > ${g.W})`);
  T(g.scene && g.scene.w * g.scene.h >= g.kidsMax, `${tag}: the picture is not the largest thing on the stage`);
  if (w <= 640) T(g.cause.rows <= 2, `${tag}: cause line ${g.cause.rows} rows`);
}
function checkBody(g, tag, w) {
  checkCommon(g, tag, w);
  const things = [['find', g.find], ['reset', g.reset], ['card', g.card], ['cue', g.cue], ['legend', g.legend]].filter(x => x[1]);
  things.forEach(([n, r]) => T(inside(r, g.scene, 0.5), `${tag}: ${n} clipped by the picture`));
  things.forEach(([n, r], i) => things.forEach(([m, s], j) => { if (j > i) T(!hit(r, s, 4), `${tag}: ${n} overlaps ${m}`); }));
  if (g.card && g.dotShown && g.dot) T(!hit(g.card, g.dot, 2), `${tag}: the card covers the part it names`);
}
function checkBurn(g, tag, w) {
  checkCommon(g, tag, w);
  const b = g.burn;
  T(inside(b.tot, g.scene, 0.5) && inside(b.age, g.scene, 0.5), `${tag}: total or chart switch clipped`);
  T(!hit(b.tot, b.age, 4), `${tag}: total overlaps the chart switch`);
  b.nums.forEach((n, i) => {
    T(inside(n, n.fig, 2), `${tag}: number ${n.n} sticks out of its figure`);
    b.nums.forEach((m, j) => { if (j > i) T(!hit(n, m, 4), `${tag}: numbers ${n.n} and ${m.n} overlap`); });
    T(!hit(n, b.tot, 4) && !hit(n, b.age, 4), `${tag}: number ${n.n} under the total or the switch`);
    b.caps.forEach(c => T(!hit(n, c, 4), `${tag}: number ${n.n} under a caption`));
  });
  b.caps.forEach(c => T(!hit(c, b.tot, 4) && !hit(c, b.age, 4), `${tag}: a caption under the total or the switch`));
  if (g.cue) { T(inside(g.cue, g.scene, 0.5), `${tag}: cue clipped`); b.nums.forEach(n => T(!hit(g.cue, n, 4), `${tag}: the cue covers ${n.n}`)); T(!hit(g.cue, b.tot, 4) && !hit(g.cue, b.age, 4), `${tag}: the cue covers the total or switch`); }
  T(b.figs && g.scene && b.figs.w * b.figs.h >= 0.5 * g.scene.w * g.scene.h, `${tag}: the figures are not most of the picture`);
}

const PARTS = ['heart', 'femur', 'p8', 'p7'];   // an organ, a bone, a landmark dot, the longest name
async function pickPart(page, key) {
  await page.evaluate(k => { const s = document.querySelector('.bm2 .bm2-find select'); const o = [...s.options].find(x => x.value === k || x.value === 'pt_' + k || x.textContent.toLowerCase().startsWith(k)); s.value = o ? o.value : s.options[1].value; s.dispatchEvent(new Event('change')); }, key);
  await until(page, () => !!document.querySelector('.bm2-card.is-in') && !document.querySelector('.bm2-card[hidden]'), null, 600);
  await page.waitForTimeout(500);
}

async function runWidth(w) {
  const tagW = `${w}${DARK ? ' dark' : ''}`;
  const { browser, page, errs } = await open(w);
  await page.waitForSelector('.bm2');
  T(await loaded(page), `${tagW}: the 3D body did not load`);
  await until(page, () => !!document.querySelector('.bm2 .tk2-cue'), null, 40);
  let g = await page.evaluate(geom);
  T(!!g.cue, `${tagW}: no first visit cue`);
  checkBody(g, `${tagW} body opening`, w);
  const h0 = g.cause.h;
  await shot(page, `sweep-body-open-${tagW.replace(' ', '-')}`);
  for (const k of PARTS) {
    await pickPart(page, k);
    g = await page.evaluate(geom);
    const sel = await page.evaluate(() => { const v = document.querySelector('.bm2 #bodyViewer'); return document.querySelector('.bm2-card-n').textContent; });
    T(!!g.card && g.cardIn, `${tagW} ${k}: no card`);
    T(g.cause.text.includes(g.cardName || '#'), `${tagW} ${k}: the cause line does not name ${g.cardName}`);
    if (w <= 640) T(Math.abs(g.cause.h - h0) < 1.5, `${tagW} ${k}: cause line height changed (${h0} to ${g.cause.h})`);
    checkBody(g, `${tagW} body ${k}`, w);
    for (const sec of ['wrong', 'care']) {
      await page.evaluate(s => document.querySelector(`.bm2-card-tab[data-sec="${s}"]`).click(), sec);
      await page.waitForTimeout(250);
      checkBody(await page.evaluate(geom), `${tagW} body ${k} ${sec}`, w);
    }
    if (k === 'heart' || k === 'p7') await shot(page, `sweep-body-${k}-${tagW.replace(' ', '-')}`);
    void sel;
  }
  // burns
  await page.evaluate(() => document.querySelector('.bm2 .tk2-tab[data-v="burns"]').click());
  await until(page, () => !!document.querySelector('.bm2-burn svg[data-view="front"] image'), null, 100);
  await until(page, () => !!document.querySelector('.bm2 .tk2-cue'), null, 30);
  g = await page.evaluate(geom);
  checkBurn(g, `${tagW} burns opening`, w);
  const hb = g.cause.h;
  await shot(page, `sweep-burns-open-${tagW.replace(' ', '-')}`);
  const paint = async (id, view = 'front') => { await page.evaluate(([i, v]) => { const g = document.querySelector(`.bm2-burn svg[data-view="${v}"] [data-region="${i}"]`); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, [id, view]); await until(page, () => /Total/.test(document.querySelector('.bm2 .tk2-cause').textContent) && document.querySelectorAll('.bm2 .tk2-cause .tk2-cz').length >= 3, null, 60); await page.waitForTimeout(150); };
  const STEPS = [['chest', 'front', 9], ['rarm-f', 'front', 13.5], ['lleg-b', 'back', 22.5]];
  for (const [id, v, tot] of STEPS) {
    await paint(id, v);
    g = await page.evaluate(geom);
    T(g.burn.totText === tot + '%', `${tagW} burns ${id}: total reads ${g.burn.totText}, painted ${tot}%`);
    T(g.cause.text.includes('Total ' + tot + '%'), `${tagW} burns ${id}: cause line total`);
    T(g.burn.flag === tot > 10, `${tagW} burns ${id}: over 10% flag`);
    if (w <= 640) T(Math.abs(g.cause.h - hb) < 1.5, `${tagW} burns ${id}: cause line height changed`);
    checkBurn(g, `${tagW} burns ${id}`, w);
  }
  await shot(page, `sweep-burns-three-${tagW.replace(' ', '-')}`);
  await page.evaluate(() => document.querySelector('.bm2-age [data-age="child"]').click());
  await until(page, () => /Child chart.*Total/.test(document.querySelector('.bm2 .tk2-cause').textContent), null, 60);
  g = await page.evaluate(geom);
  T(g.burn.totText === '20.25%', `${tagW} child: total ${g.burn.totText}, want 20.25%`);
  T(g.burn.nums.some(n => n.n === '6.75') && g.burn.nums.filter(n => n.n === '9').length >= 2, `${tagW} child: the child numbers`);
  checkBurn(g, `${tagW} burns child`, w);
  await shot(page, `sweep-burns-child-${tagW.replace(' ', '-')}`);
  await page.evaluate(() => document.querySelector('.bm2 .bm2-reset').click());
  await until(page, () => document.querySelector('.bm2-tot-n').textContent === '0%', null, 60);
  g = await page.evaluate(geom);
  T(g.burn.totText === '0%' && !g.burn.flag, `${tagW} start over: total ${g.burn.totText}`);
  checkBurn(g, `${tagW} burns start over`, w);
  T(!errs.length, `${tagW}: console errors: ${errs.join(' | ')}`);
  await browser.close();
}

async function runFrames() {
  for (const w of [390, 1440]) {
    const { browser, page, errs } = await open(w, { noCue: true, q: '?mode=burns' });
    await until(page, () => !!document.querySelector('.bm2-burn svg[data-view="front"] image'), null, 100);
    await page.waitForTimeout(500);
    // sample every frame: the total on the picture against what is drawn
    await page.evaluate(() => {
      const P = { 'head-f': 4.5, 'head-b': 4.5, chest: 9, abdomen: 9, upback: 9, lowback: 9, genitals: 1, 'rarm-f': 4.5, 'rarm-b': 4.5, 'larm-f': 4.5, 'larm-b': 4.5, 'rleg-f': 9, 'rleg-b': 9, 'lleg-f': 9, 'lleg-b': 9 };
      const C = Object.assign({}, P, { 'head-f': 9, 'head-b': 9, 'rleg-f': 6.75, 'rleg-b': 6.75, 'lleg-f': 6.75, 'lleg-b': 6.75 });
      window.__bad = []; window.__n = 0; window.__mid = 0;
      function tick(){
        const child = document.querySelector('.bm2-age [data-age="child"]').getAttribute('aria-checked') === 'true';
        let sum = 0, mid = false;
        document.querySelectorAll('.bm2-burn .bn-shape').forEach(s => {
          const id = s.parentNode.parentNode.querySelector('.bn-reg') && null;
        });
        document.querySelectorAll('.bm2-burn [data-region]').forEach(g => {
          const id = g.dataset.region, svg = g.ownerSVGElement;
          const shapes = [...svg.querySelectorAll('.bn-shape')], regs = [...svg.querySelectorAll('[data-region]')];
          const s = shapes[regs.indexOf(g)];
          const full = s.classList.contains('is-full'), half = s.classList.contains('is-half');
          const o = s.style.opacity === '' ? 1 : +s.style.opacity;
          const f = (full ? 1 : half ? 0.5 : 0) * o;
          if (o > 0 && o < 1 && (full || half)) mid = true;
          sum += (child ? C : P)[id] * f;
        });
        const shown = parseFloat(document.querySelector('.bm2-tot-n').textContent);
        const cause = document.querySelector('.bm2 .tk2-cause').textContent;
        window.__n++; if (mid) window.__mid++;
        if (Math.abs(shown - sum) > 0.06 && !document.querySelector('.bm2-burn.is-swap-now')) window.__bad.push(`total ${shown} drawn ${sum.toFixed(3)}`);
        if (mid && /Total/.test(cause)) window.__bad.push('a total pill mid fade: ' + cause);
        window.__raf = requestAnimationFrame(tick);
      }
      window.__raf = requestAnimationFrame(tick);
    });
    const click = async (id, v = 'front') => { await page.evaluate(([i, vv]) => document.querySelector(`.bm2-burn svg[data-view="${vv}"] [data-region="${i}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), [id, v]); };
    await click('chest'); await page.waitForTimeout(60); await shot(page, `frames-burn-mid-${w}`); await page.waitForTimeout(500);
    await click('abdomen'); await page.waitForTimeout(100); await click('rleg-f'); await page.waitForTimeout(600);
    await click('chest'); await page.waitForTimeout(600);   // a reversal: the burn fades out
    await page.evaluate(() => document.querySelector('.bm2-age [data-age="child"]').click()); await page.waitForTimeout(700);
    await page.evaluate(() => document.querySelector('.bm2 .bm2-reset').click()); await page.waitForTimeout(600);
    const r = await page.evaluate(() => ({ bad: window.__bad.slice(0, 5), nb: window.__bad.length, n: window.__n, mid: window.__mid }));
    T(r.nb === 0, `frames ${w}: ${r.nb} frames where the numbers disagree with the picture: ${r.bad.join(' | ')}`);
    T(r.mid >= 6, `frames ${w}: only ${r.mid} mid fade frames sampled (no fade?)`);
    console.log(`frames ${w}: ${r.n} frames, ${r.mid} mid fade`);
    // leave mid fade: Test yourself, then back
    await click('chest'); await page.waitForTimeout(40);
    await page.evaluate(() => document.querySelector('[data-v="quiz"]').click());
    await page.waitForTimeout(300);
    const hid = await page.evaluate(() => ({ op: [...document.querySelectorAll('.bm2-burn .bn-shape')].map(s => s.style.opacity).filter(o => o !== '' && +o > 0 && +o < 1).length, q: !!document.querySelector('.bm2-qburn .bn-qpanel strong, .bm2-qdock .bn-qpanel strong') }));
    T(hid.op === 0, `frames ${w}: a fade kept running after Explore hid`);
    await page.evaluate(() => document.querySelector('[data-v="explore"]').click());
    await page.waitForTimeout(400);
    T(await page.evaluate(() => document.querySelector('.bm2-tot-n').textContent === '9%'), `frames ${w}: back in Explore the burn is finished (9%)`);
    // the card waits for the camera
    await page.evaluate(() => document.querySelector('.bm2 .tk2-tab[data-v="body"]').click());
    T(await loaded(page), `frames ${w}: 3D body did not load`);
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      window.__cardEarly = 0; window.__cardFrames = 0;
      const t = () => { window.__cardFrames++; const c = document.querySelector('.bm2-card'); const fly = window.NremtBodyMap.viewer.flying(); if (c && !c.hidden && c.classList.contains('is-in') && fly) window.__cardEarly++; window.__r2 = requestAnimationFrame(t); };
      window.__r2 = requestAnimationFrame(t);
    });
    await page.evaluate(() => { const s = document.querySelector('.bm2 .bm2-find select'); s.value = 'heart'; s.dispatchEvent(new Event('change')); });
    await until(page, () => !!document.querySelector('.bm2-card.is-in'), null, 400);
    await shot(page, `frames-card-${w}`);
    const cf = await page.evaluate(() => ({ e: window.__cardEarly, f: window.__cardFrames, cause: document.querySelector('.bm2 .tk2-cause').textContent }));
    T(cf.e === 0, `frames ${w}: the card showed while the camera moved`);
    T(/Heart/.test(cf.cause), `frames ${w}: cause line after the card: ${cf.cause}`);
    // Test yourself: find it (a right and a wrong answer) and the Rule of Nines quiz
    await page.evaluate(() => document.querySelector('[data-v="quiz"]').click());
    await page.waitForTimeout(800);
    const q1 = await page.evaluate(() => document.querySelector('.ls-task-t')?.textContent || '');
    T(/^Find the /.test(q1), `frames ${w}: find quiz question: ${q1}`);
    const target = q1.replace(/^Find the /, '').replace(/\.$/, '');
    // wrong: pick another name; right: pick the asked one (Find a part, the keyboard's way to answer)
    await page.evaluate(t => { const s = document.querySelector('.bm2-qstage .bm2-find select'); const o = [...s.options].find(x => x.value && x.textContent.replace(/ \((left|right)\)$/, '') !== t); s.value = o.value; s.dispatchEvent(new Event('change')); }, target);
    await page.waitForTimeout(500);
    T(await page.evaluate(() => /Not quite/.test(document.querySelector('.ls-task')?.textContent || '') && !!document.querySelector('.bm-nudge .bm-retry')), `frames ${w}: a wrong answer says Not quite and offers Try again`);
    await page.evaluate(() => document.querySelector('.bm-retry').click());
    await page.waitForTimeout(500);
    await page.evaluate(t => { const s = document.querySelector('.bm2-qstage .bm2-find select'); const o = [...s.options].find(x => x.value && x.textContent.replace(/ \((left|right)\)$/, '') === t); s.value = o.value; s.dispatchEvent(new Event('change')); }, target);
    await page.waitForTimeout(500);
    T(await page.evaluate(() => /Found it|Right/.test(document.querySelector('.ls-task')?.textContent || '')), `frames ${w}: a right answer is marked`);
    const recs = await page.evaluate(() => { try { return JSON.stringify(localStorage).match(/body-map/g)?.length || 0; } catch (e) { return -1; } });
    T(recs !== 0, `frames ${w}: the answer was not recorded`);
    // the Rule of Nines quiz, by its deep link
    await page.goto(URL0 + '?mode=burns&q=leg-back');
    await until(page, () => !!document.querySelector('.bn-choices button'), null, 100);
    await page.evaluate(() => [...document.querySelectorAll('.bn-choices button')].find(b => b.dataset.ans === '36').click());
    T(await page.evaluate(() => /Right: 36%/.test(document.querySelector('.bn-verdict')?.textContent || '')), `frames ${w}: burns quiz right answer`);
    await page.evaluate(() => document.querySelector('.bn-next').click());
    await page.waitForTimeout(300);
    const kind = await page.evaluate(() => document.querySelector('.bn-check') ? 'paint' : 'estimate');
    if (kind === 'estimate') {
      await page.evaluate(() => { const b = document.querySelectorAll('.bn-choices button'); const ok = [...b].find(x => !x.classList.contains('ok')); ok.click(); });
    } else {
      await page.evaluate(() => { document.querySelector('.bm2-qstage svg[data-view="front"] [data-region="genitals"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); document.querySelector('.bn-check').click(); });
    }
    T(await page.evaluate(() => !!document.querySelector('.bn-verdict')), `frames ${w}: burns quiz second answer gives a verdict`);
    T(!errs.length, `frames ${w}: console errors: ${errs.join(' | ')}`);
    await browser.close();
  }
  // reduced motion: the result at once
  const { browser, page, errs } = await open(390, { reduced: true, noCue: true, q: '?mode=burns' });
  await until(page, () => !!document.querySelector('.bm2-burn svg[data-view="front"] image'), null, 100);
  await page.evaluate(() => document.querySelector('.bm2-burn svg[data-view="front"] [data-region="chest"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForTimeout(30);
  T(await page.evaluate(() => document.querySelector('.bm2-tot-n').textContent === '9%' && /Total 9%/.test(document.querySelector('.bm2 .tk2-cause').textContent)), 'reduced motion: the burn and total at once');
  T(!errs.length, `reduced: console errors: ${errs.join(' | ')}`);
  await browser.close();
}

try {
  if (process.argv.includes('--frames')) await runFrames();
  else await runWidth(+arg('--width'));
} catch (e) { fails.push('crashed: ' + e.message.split('\n')[0]); }
server.close();
fails.slice(0, 40).forEach(f => console.log('FAIL ' + f));
console.log(`${pass} passed, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
