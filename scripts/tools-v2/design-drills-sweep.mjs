#!/usr/bin/env node
/* Tools v2 sweep: AP Biology, Design drills (docs/tools-v2-builder-brief.md, step 5; pattern from
   simpson-diversity-sweep.mjs). Every landmark state of Explore (Fair test: what differs; Sample size: plants per
   group and a new batch) and Test yourself, at widths 360 to 1920, light and dark:
     - no sideways scroll; nothing clipped by the stage (plants, items, labels, pills, knob, cue);
     - no two labels or numbers closer than 4 px (group names, item labels, ruler numbers, mean and difference
       pills, "±2 SE", the knob's tag, the cue);
     - the bench (the thing acted on) is the largest thing; tap targets at least 44 px;
     - phones (640 px and under): the cause line is at most two rows and its height never changes;
     - the plants drawn match the model (each group's mean), the pills say the drawn means and difference, the
       error bars are the drawn mean ± 2 SE, and the cause line says the state's words;
   and, frame by frame at 390 and 1440: every number on the picture is the one for the plants drawn at that frame,
   and no result word shows while a plant is still changing.
   Usage: node scripts/tools-v2/design-drills-sweep.mjs [--width <w>] [--frames] [--shots <dir>] [--port <n>]
   (run one width per process; --frames runs only the frame checks and reduced motion).
   Needs playwright (PW_ROOT names a folder whose node_modules has it) and Chromium (CHROMIUM_PATH). */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, mkdirSync } from 'node:fs';
import { dirname, extname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
let PORT = +arg('--port', 0); const SHOTS = arg('--shots', null), ONLY = arg('--width', null), FRAMES = process.argv.includes('--frames');
let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) {
  try { ({ chromium } = createRequire((process.env.PW_ROOT || '/home/claude/testaolivier10-del.github.io') + '/')('playwright')); }
  catch (e2) { console.error('This sweep needs playwright (set PW_ROOT).'); process.exit(0); }
}
const EXE = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome') ? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' : undefined);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const file = resolve(ROOT, '.' + p);
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }); createReadStream(file).pipe(res);
});
await new Promise(ok => server.listen(PORT, ok));
PORT = server.address().port;
const URL0 = `http://localhost:${PORT}/bio/tools/design-drills.html`;
const WIDTHS = ONLY ? [+ONLY] : [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
/* The model (design-drills.js, EXM): base 18 cm, plant food +6, less water −5, warmer +3. */
const FAIR = [
  { id: 'opening', set: { food: true }, test: 24, cause: /^Only plant food differs→Test 6 cm taller→Plant food made the difference$/ },
  { id: 'nothing', set: {}, test: 18, cause: /^Nothing differs→Same height→Nothing is tested$/ },
  { id: 'food-water', set: { food: true, water: true }, test: 19, cause: /^Plant food and water differ→Test 1 cm taller→Can’t tell which did it$/ },
  { id: 'food-warm', set: { food: true, warm: true }, test: 27, cause: /^Plant food and warmth differ→Test 9 cm taller→Can’t tell which did it$/ },
  { id: 'all-three', set: { food: true, water: true, warm: true }, test: 22, cause: /^Plant food, water and warmth differ→Test 4 cm taller→Can’t tell which did it$/ },
  { id: 'water-only', set: { water: true }, test: 13, cause: /^Only water differs→Test 5 cm shorter→Water made the difference$/ },
  { id: 'warm-only', set: { warm: true }, test: 21, cause: /^Only warmth differs→Test 3 cm taller→Warmth made the difference$/ },
];
const NS = [
  { id: 'n3', n: 3, cause: /^3 plants each→Bars overlap→Could be chance$/ },
  { id: 'n1', n: 1, cause: /^1 plant each→No spread to measure→Can’t tell$/ },
  { id: 'n2', n: 2, cause: /^2 plants each→Bars (overlap→Could be chance|apart→Unlikely to be chance)$/ },
  { id: 'n7', n: 7, cause: /^7 plants each→Bars apart→Unlikely to be chance$/ },
  { id: 'n12', n: 12, cause: /^12 plants each→Bars apart→Unlikely to be chance$/ },
  { id: 'n12-new', n: 12, fresh: true, cause: /^12 plants each→Bars (overlap→Could be chance|apart→Unlikely to be chance)$/ },
];
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
  if (opts.noCue) await page.addInitScript(() => { try { localStorage.setItem('tk2c:apbio-design-fair', '1'); localStorage.setItem('tk2c:apbio-design-n', '1'); } catch (e) {} });
  await page.goto(URL0 + (opts.hash || '')); await page.waitForSelector('.dd2-svg', { timeout: 15000 });
  await settle(page);
  return { browser, page, errs };
}
/* Wait for something on the page (the page's CSP forbids waitForFunction's eval). */
async function until(page, fn, a) { for (let i = 0; i < 120; i++) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(60); } return false; }
const settle = async (page) => { await page.waitForTimeout(150); await until(page, () => !document.querySelector('.dd2.is-busy') && !/Growing/.test(document.querySelector('.tk2-cause').textContent)); await page.waitForTimeout(260); };
async function setFair(page, set) {
  await page.evaluate((set) => {
    const ids = ['water', 'food', 'warm'], taps = [...document.querySelectorAll('.dd2-scene .tk2-tap')];
    ids.forEach((id, j) => { const on = taps[j].getAttribute('aria-pressed') === 'true'; if (on !== !!set[id]) taps[j].click(); });
  }, set);
  await settle(page);
}
async function setN(page, n) {
  await page.evaluate((n) => { const i = document.querySelector('.dd2-knob-n input'); i.value = n; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); }, n);
  await settle(page);
}
const geo = (page) => page.evaluate(() => {
  const R = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const q = (s) => document.querySelector(s), qa = (s) => [...document.querySelectorAll(s)];
  const vis = (e) => { if (!e || e.closest('[visibility="hidden"], [hidden]')) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.closest('.is-wait'); };
  const scene = q('.dd2-scene'), k = +scene.dataset.k, ys = +scene.dataset.ysoil, svgR = q('.dd2-svg').getBoundingClientRect();
  const sc = svgR.width / q('.dd2-svg').viewBox.baseVal.width;
  // each plant's drawn height, from the end of its stem (viewBox units) and the scale (cm per unit)
  const hts = [0, 1].map(g => qa(`.dd2-plants [data-g="${g}"] .dd2-pl`).filter(p => +(p.style.opacity || 1) > 0.5).map(p => { const d = p.querySelector('.dd2-stem').getAttribute('d') || ''; const m = /(-?[\d.]+)\s*$/.exec(d); return m ? -parseFloat(m[1]) / k : 0; }));
  const labs = [];
  qa('.dd2-scene [data-lab]').forEach(t => { if (!vis(t)) return; const box = t.closest('.dd2-mp, .dd2-br'); labs.push({ ...R(box ? box.querySelector('rect') : t), what: t.dataset.lab + ':' + t.textContent }); });
  const tag = q('.dd2-knob-n:not([hidden]) .tk2-tag'); if (tag && vis(tag) && tag.textContent) labs.push({ ...R(tag), what: 'knob:' + tag.textContent });
  const cue = q('.tk2-cue'); if (cue) labs.push({ ...R(cue), what: 'cue' });
  const cause = q('.tk2-cause');
  const err = [0, 1].map(g => { const e = q(`.dd2-err[data-g="${g}"]`); if (!e || e.getAttribute('visibility') === 'hidden') return null; const d = e.querySelector('.dd2-ebar').getAttribute('d'); const m = /M[\d.]+ ([\d.]+)V([\d.]+)/.exec(d); return m ? [(ys - +m[1]) / k, (ys - +m[2]) / k] : null; });
  return { sw: document.documentElement.scrollWidth, iw: innerWidth, scene: R(scene), stage: R(q('.dd2')), sc,
    plants: qa('.dd2-pl').filter(vis).map(R), items: qa('.dd2-item').map(R), labs, hts, err,
    pills: qa('.dd2-mp .dd2-pillt').map(t => t.textContent), diff: q('.dd2-br .dd2-pillt').textContent, wait: !!q('.dd2-over.is-wait'),
    taps: qa('.dd2-scene .tk2-tap:not([hidden])').map(R), knob: q('.dd2-knob-n:not([hidden]) .tk2-knob') ? R(q('.dd2-knob-n .tk2-knob')) : null,
    cause: { ...R(cause), text: cause.textContent, rows: [...new Set(qa('.tk2-cause .tk2-cz').map(e => Math.round(e.getBoundingClientRect().top)))].length, pills: qa('.tk2-cause .tk2-cz').map(R) },
    lines: R(q('.dd2-lines')), head: R(q('.tk2-head')), tabs: R(q('.dd2 .tk2-tabs')), acts: qa('.dd2-acts button:not([hidden])').map(R), tab: q('.dd2').dataset.tab };
});
const hit = (a, b, pad = 0) => a.l < b.r + pad && a.r > b.l - pad && a.t < b.b + pad && a.b > b.t - pad;
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1)); };
function check(g, tag, st) {
  const T = (c, m) => ok(c, `${tag}: ${m}`);
  T(g.sw <= g.iw + 1, `sideways scroll (${g.sw} > ${g.iw})`);
  const inS = (b) => b.l >= g.scene.l - 1 && b.r <= g.scene.r + 1 && b.t >= g.scene.t - 1 && b.b <= g.scene.b + 1;
  T(g.plants.every(inS), 'a plant is clipped by the stage');
  T(g.items.every(inS), 'an item is clipped');
  g.labs.forEach(l => T(inS(l), `${l.what} is clipped`));
  for (let i = 0; i < g.labs.length; i++) for (let j = i + 1; j < g.labs.length; j++) {
    const a = g.labs[i], b = g.labs[j];
    if (a.what.startsWith('ruler') && b.what.startsWith('ruler')) continue;
    T(!hit(a, b, 4), `"${a.what}" and "${b.what}" are closer than 4 px`);
  }
  T(g.taps.every(t => t.w >= 44 && t.h >= 44 && inS(t)), 'a tap target is under 44 px or clipped');
  if (g.knob) T(inS(g.knob), 'the knob is clipped');
  const others = Math.max(g.lines.h, g.head.h, g.tabs.h);
  T(g.scene.w >= g.stage.w - 2 && g.scene.h >= 2.5 * others, `the bench is not the largest thing (${Math.round(g.scene.h)})`);
  T(g.cause.pills.every(p => p.l >= g.lines.l - 1 && p.r <= g.lines.r + 1), 'a cause pill is clipped');
  T(!g.acts.some(a => g.cause.pills.some(p => hit(a, p))), 'a button overlaps the cause line');
  if (g.iw <= 640) T(g.cause.rows <= 2, `the cause line takes ${g.cause.rows} rows`);
  T(!g.wait, 'the numbers are still hidden after the plants settled');
  if (st) T(st.cause.test(g.cause.text), `cause line reads "${g.cause.text}"`);
  // the numbers say what is drawn, and the drawing is the model
  const m = g.hts.map(mean), fair = g.tab === 'fair';
  const f = (v) => fair ? String(Math.round(v)) : (Math.round(v * 10) / 10).toFixed(1);
  T(g.pills[0] === f(m[0]) + ' cm' && g.pills[1] === f(m[1]) + ' cm', `mean pills ${g.pills.join(', ')} for drawn means ${m.map(v => v.toFixed(2)).join(', ')}`);
  const dv = fair ? Math.round(m[1] - m[0]) : Math.round((m[1] - m[0]) * 10) / 10, dt = dv === 0 ? 'same' : (dv > 0 ? '+' : '−') + (fair ? Math.abs(dv) : Math.abs(dv).toFixed(1)) + ' cm';
  T(g.diff === dt, `difference pill "${g.diff}", drawn ${dt}`);
  if (fair && st) { T(Math.abs(m[0] - 18) < 0.05 && Math.abs(m[1] - st.test) < 0.05, `drawn means ${m.map(v => v.toFixed(2))} against the model 18, ${st.test}`); T(g.hts.every(a => a.length === 6), 'six plants a group'); }
  if (!fair && st) {
    T(g.hts.every(a => a.length === st.n), `${g.hts.map(a => a.length)} plants drawn for ${st.n}`);
    if (st.n > 1) [0, 1].forEach(k => { const se = sd(g.hts[k]) / Math.sqrt(st.n), e = g.err[k]; T(e && Math.abs(e[0] - (m[k] + 2 * se)) < 0.06 && Math.abs(e[1] - (m[k] - 2 * se)) < 0.06, `group ${k} error bar ${e && e.map(v => v.toFixed(2))} against mean ± 2 SE ${(m[k] + 2 * se).toFixed(2)}, ${(m[k] - 2 * se).toFixed(2)}`); });
    else T(!g.err[0] && !g.err[1], 'error bars drawn for one plant');
    if (st.n > 1) { const ov = m[0] + 2 * sd(g.hts[0]) / Math.sqrt(st.n) >= m[1] - 2 * sd(g.hts[1]) / Math.sqrt(st.n) && m[1] + 2 * sd(g.hts[1]) / Math.sqrt(st.n) >= m[0] - 2 * sd(g.hts[0]) / Math.sqrt(st.n); T(ov === /overlap/.test(g.cause.text), `the verdict "${g.cause.text}" does not match the bars drawn`); }
  }
}

if (!FRAMES) for (const dark of [false, true]) for (const w of WIDTHS) {
  const { browser, page, errs } = await open(w, dark);
  const tag0 = `${w}${dark ? ' dark' : ''}`, heights = [];
  { const g = await geo(page); check(g, `${tag0} first visit (cue)`, FAIR[0]); ok(g.labs.some(l => l.what === 'cue'), `${tag0}: the first visit shows the cue`); heights.push(g.cause.h); }
  if (SHOTS && !dark) { mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: join(SHOTS, `sweep-opening-${w}.png`) }); }
  for (const st of FAIR) {
    await setFair(page, st.set);
    const g = await geo(page); check(g, `${tag0} ${st.id}`, st); heights.push(g.cause.h);
    if (SHOTS && (w === 360 || w === 820 || w === 1920) && (!dark || st.id === 'all-three')) await page.screenshot({ path: join(SHOTS, `sweep-${st.id}-${w}${dark ? '-dark' : ''}.png`) });
  }
  await page.click('.dd2 .tk2-tab[data-v="n"]'); await settle(page);
  { const g = await geo(page); check(g, `${tag0} sample size (cue)`, NS[0]); ok(g.labs.some(l => l.what === 'cue'), `${tag0}: Sample size shows its cue`); heights.push(g.cause.h); }
  for (const st of NS) {
    if (st.fresh) { await page.click('.dd2-new'); await settle(page); } else await setN(page, st.n);
    const g = await geo(page); check(g, `${tag0} ${st.id}`, st); heights.push(g.cause.h);
    if (SHOTS && (w === 360 || w === 820 || w === 1920) && (!dark || st.id === 'n7')) await page.screenshot({ path: join(SHOTS, `sweep-${st.id}-${w}${dark ? '-dark' : ''}.png`) });
  }
  if (w <= 640) ok(new Set(heights.map(h => Math.round(h))).size === 1, `${tag0}: the cause line changes height: ${heights.map(h => Math.round(h)).join(', ')}`);
  // Test yourself: the experiment drills, with the experiment's own picture
  await page.click('.ls-modes [data-v="quiz"], .ls-modes button:nth-child(2)'); await page.waitForTimeout(500);
  { const t = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, bench: !!document.querySelector('.dd2:not([hidden])') && document.querySelector('.dd2').getBoundingClientRect().height > 0,
      scene: !!document.querySelector('.ls-dr-stage:not([hidden]) .dr-sfig'), drill: !!document.querySelector('.ls-dr-steps .dr-sec'), pick: (document.querySelector('.ls-pick-sel') || {}).value || '' }));
    ok(t.sw <= t.iw + 1 && !t.bench && t.scene && t.drill && t.pick === 'duckweed-nitrogen', `${tag0} Test yourself: ${JSON.stringify(t)}`);
    if (SHOTS && !dark && (w === 360 || w === 1440)) await page.screenshot({ path: join(SHOTS, `sweep-quiz-${w}.png`) }); }
  ok(!errs.length, `${tag0}: console errors: ${errs.join(' | ')}`);
  await browser.close();
}

/* Frame by frame: every number on the picture is the one for the plants as drawn at that frame; while a plant is
   still changing no result word shows (the cause line says "Growing"), and on Sample size the numbers wait. */
if (FRAMES || !ONLY) for (const w of [390, 1440]) {
  const { browser, page, errs } = await open(w, false, { noCue: true });
  const frames = await page.evaluate(async () => {
    const log = [], q = (s) => document.querySelector(s), qa = (s) => [...document.querySelectorAll(s)];
    const scene = q('.dd2-scene');
    const snap = (what) => {
      const k = +scene.dataset.k, tab = q('.dd2').dataset.tab;
      const hts = [0, 1].map(g => qa(`.dd2-plants [data-g="${g}"] .dd2-pl`).map(p => { const d = p.querySelector('.dd2-stem').getAttribute('d') || ''; const m = /(-?[\d.]+)\s*$/.exec(d); return { h: m ? -parseFloat(m[1]) / k : 0, op: +(p.style.opacity || 1) }; }));
      const m = hts.map(a => { const v = a.filter(x => x.op > 0.999).map(x => x.h); return v.length ? v.reduce((x, y) => x + y, 0) / v.length : null; });
      log.push({ what, tab, m, pills: qa('.dd2-mp .dd2-pillt').map(t => t.textContent), diff: q('.dd2-br .dd2-pillt').textContent, wait: !!q('.dd2-over.is-wait'),
        cause: q('.tk2-cause').textContent, busy: !!q('.dd2.is-busy'), anyFade: hts.some(a => a.some(x => x.op < 0.999)) });
    };
    const loop = (what, ms) => new Promise(done => { const t0 = performance.now(); const f = () => { snap(what); if (performance.now() - t0 < (ms || 1100)) requestAnimationFrame(f); else done(); }; f(); });
    const taps = qa('.dd2-scene .tk2-tap');
    taps[0].click(); await loop('less water');
    taps[2].click(); await loop('warmer');
    taps[1].click(); taps[1].click(); taps[0].click(); await loop('three fast taps');
    taps[2].click(); await loop('back');
    q('.dd2 .tk2-tab[data-v="n"]').click(); await loop('to Sample size', 1500);
    const inp = q('.dd2-knob-n input');
    for (let v = 4; v <= 12; v++){ inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => requestAnimationFrame(r)); snap('fast drag up'); }
    await loop('fast drag up, end', 1300);
    for (let v = 11; v >= 2; v--){ inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => requestAnimationFrame(r)); snap('fast drag down'); }
    await loop('fast drag down, end', 900);
    q('.dd2-new').click(); await loop('new plants', 1500);
    return log;
  });
  let bad = 0, mid = 0;
  const f1 = (v, fair) => fair ? String(Math.round(v)) : (Math.round(v * 10) / 10).toFixed(1);
  frames.forEach(f => {
    const fair = f.tab === 'fair', moving = f.busy;
    if (moving) mid++;
    let fine = true, why = '';
    if (!f.wait && f.m[0] != null && f.m[1] != null) {
      if (f.pills[0] !== f1(f.m[0], fair) + ' cm' || f.pills[1] !== f1(f.m[1], fair) + ' cm') { fine = false; why = 'pills ' + f.pills.join(', ') + ' drawn ' + f.m.map(v => v.toFixed(2)); }
      if (!fair && f.anyFade) { fine = false; why = 'numbers shown while plants come or go'; }
    }
    if (moving && /made the difference|Can’t tell|Nothing is tested|chance/.test(f.cause)) { fine = false; why = 'result words while moving: ' + f.cause; }
    if (!fine && bad++ < 4) fails.push(`${w} frames (${f.what}): ${why}`);
  });
  ok(bad === 0, `${w} frames: ${bad} of ${frames.length} frames where the numbers or words and the plants disagree`);
  ok(mid > 20, `${w} frames: too few frames caught a change (${mid})`);
  ok(frames.some(f => f.wait) && frames.some(f => !f.wait && f.tab === 'n'), `${w} frames: Sample size never hid or never showed its numbers`);
  ok(!errs.length, `${w} frames: console errors: ${errs.join(' | ')}`);
  console.log(`frames at ${w}: ${frames.length} checked, ${mid} with a change running`);
  await browser.close();
}
/* Reduced motion: the result at once, with a short cross fade. */
if (FRAMES || !ONLY) { const { browser, page, errs } = await open(390, false, { reduced: true, noCue: true });
  const r = await page.evaluate(() => { document.querySelectorAll('.dd2-scene .tk2-tap')[0].click(); const p = document.querySelector('.dd2-plants [data-g="1"] .dd2-pl.is-fade');
    return { anim: p ? getComputedStyle(p).animationName : '', dur: p ? getComputedStyle(p).animationDuration : '', cause: document.querySelector('.tk2-cause').textContent }; });
  ok(r.anim === 'dd2-fade' && parseFloat(r.dur) <= 0.3 && /Test 1 cm taller/.test(r.cause), `reduced motion: ${JSON.stringify(r)}`);
  ok(!errs.length, 'reduced motion: console errors'); await browser.close(); }

server.close();
console.log(`${pass} passed, ${fails.length} failed`);
fails.slice(0, 60).forEach(f => console.log('  FAIL ' + f));
process.exit(fails.length ? 1 : 0);
