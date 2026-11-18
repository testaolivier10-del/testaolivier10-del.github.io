#!/usr/bin/env node
/* Tools v2 sweep: AP Biology, Hardy-Weinberg (docs/tools-v2-hardy-weinberg-brief.md; the rule is step 5 of the
   Builder section of docs/tools-v2-builder-brief.md). Every landmark state (p = 0 to 1 in steps of 0.1, and the
   Test yourself bed planted and in bloom) at widths 360, 390, 430, 600, 768, 820, 1024, 1280, 1440 and 1920, light
   and dark at three of them. Asserts, in a real browser:
     - nothing is clipped by the stage (every label, allele, sign, the knob and the cue lie inside the picture);
     - no two labels overlap, and the first visit cue covers no label or number;
     - the acted-on object (the bed) is the largest thing on screen;
     - every plant stays inside the bed;
     - the cause line is at most two rows on a phone and its box has one height in every state at a width;
     - the picture's numbers agree: the signs, the alleles drawn and the cause line say the same p and shares;
     - no sideways scroll, no console errors.
   Writes one contact sheet per width group to --out (default /tmp/hw-sweep).
   Usage: node scripts/tools-v2/hardy-weinberg-sweep.mjs [--out dir]   (needs playwright) */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const PAGE = '/bio/tools/hardy-weinberg.html';
const WIDTHS = [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
const DARK = [390, 768, 1440];
const outI = process.argv.indexOf('--out');
const OUT = outI > 0 ? process.argv[outI + 1] : '/tmp/hw-sweep';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };

let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) { console.error('This sweep needs playwright:\n  npm i --no-save playwright && npx playwright install chromium\n(' + e.message + ')'); process.exit(0); }

const server = createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  let f = resolve(ROOT, '.' + u);
  if (!f.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
  createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const EXE = process.env.PW_CHROMIUM || (existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome') ? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' : undefined);
const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
mkdirSync(OUT, { recursive: true });

let pass = 0; const fails = [];
function ok(cond, msg) { if (cond) pass++; else fails.push(msg); }

/* Everything measured in the page, in one call. */
function measure() {
  const R = e => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
  const scene = document.querySelector('.hw2-scene'), S = R(scene);
  const q = sel => Array.from(scene.querySelectorAll(sel));
  const labels = [];
  q('.hw2-pill').forEach(e => labels.push({ k: 'pill ' + e.textContent, ...R(e) }));
  q('.hw2-cap').forEach(e => labels.push({ k: 'caption ' + e.textContent, ...R(e) }));
  q('.hw2-sign').forEach(e => labels.push({ k: 'sign ' + e.textContent.trim(), ...R(e.querySelector('rect')) }));
  const toks = q('.hw2-tok').map(e => ({ k: 'allele', ...R(e) }));
  const knob = scene.querySelector('.tk2-dot'), cue = scene.querySelector('.tk2-cue');
  const frame = R(scene.querySelector('.hw2-frame')), soil = R(scene.querySelector('.hw2-soil'));
  const plants = q('.hw2-p').map(e => R(e));
  const cause = document.querySelector('.hw2 .tk2-cause'), cz = Array.from(cause.querySelectorAll('.tk2-cz'));
  const rows = new Set(cz.map(e => Math.round(e.getBoundingClientRect().top)));
  const txt = e => e.textContent.replace(/\s+/g, ' ').trim();
  return { S, labels, toks, knob: knob && knob.offsetParent ? R(knob) : null, cue: cue ? R(cue) : null, frame, soil, plants,
    cause: { h: cause.getBoundingClientRect().height, rows: rows.size, text: cz.map(txt), hidden: cause.offsetParent === null },
    signs: q('.hw2-sign').map(e => txt(e)), nR: q('.hw2-top .hw2-tok.is-r:not(.is-egg)').length, nRe: q('.hw2-top .hw2-tok.is-r.is-egg').length,
    colors: ['g0', 'g1', 'g2', 'is-sprout'].map(c => scene.querySelectorAll('.hw2-p > use.' + c + ':not(.is-out)').length),
    scrollX: document.documentElement.scrollWidth - document.documentElement.clientWidth, vw: innerWidth,
    biggest: Array.from(document.querySelectorAll('.ls-root button, .ls-root .tk2-cause, .ls-root .tk2-head')).reduce((m, e) => Math.max(m, e.getBoundingClientRect().width * e.getBoundingClientRect().height), 0) };
}
function hit(a, b, pad = 0) { return a.x < b.r - pad && b.x < a.r - pad && a.y < b.b - pad && b.y < a.b - pad; }
function check(m, tag, n, opts = {}) {
  const S = m.S, inS = (b, pad = 0) => b.x >= S.x - pad && b.r <= S.r + pad && b.y >= S.y - pad && b.b <= S.b + pad;
  m.labels.forEach(l => ok(inS(l, 0.5), `${tag}: ${l.k} is clipped by the stage`));
  m.toks.forEach(l => ok(inS(l, 0.5), `${tag}: an allele is clipped by the stage`));
  if (m.knob) ok(inS(m.knob, 0.5), `${tag}: the knob is clipped by the stage`);
  if (m.cue) ok(inS(m.cue, 0.5), `${tag}: the cue is clipped by the stage`);
  for (let i = 0; i < m.labels.length; i++) for (let j = i + 1; j < m.labels.length; j++) ok(!hit(m.labels[i], m.labels[j], 0.5), `${tag}: ${m.labels[i].k} overlaps ${m.labels[j].k}`);
  m.labels.forEach(l => m.toks.forEach(t => ok(!hit(l, t, 1), `${tag}: ${l.k} overlaps an allele`)));
  if (m.cue) m.labels.forEach(l => ok(!hit(m.cue, l, 0.5), `${tag}: the cue covers ${l.k}`));
  if (m.knob) m.labels.forEach(l => ok(!hit(m.knob, l, 0.5), `${tag}: the knob covers ${l.k}`));
  if (m.knob) m.toks.forEach(t => ok(!hit(m.knob, t, 1.5), `${tag}: the knob covers an allele`));
  // the bed is the largest thing: most of the picture, and larger than any control or line outside it
  const bed = m.frame.w * m.frame.h;
  ok(bed > 0.5 * S.w * S.h, `${tag}: the bed is only ${(100 * bed / (S.w * S.h)).toFixed(0)}% of the picture`);
  ok(bed > 3 * m.biggest, `${tag}: something outside the picture is nearly as large as the bed`);
  ok(S.w * S.h > 0.38 * m.vw * Math.min(900, S.b + 200), `${tag}: the picture is small on the screen`);
  m.plants.forEach(p => ok(p.x >= m.soil.x - 1 && p.r <= m.soil.r + 1 && p.b <= m.soil.b + 1 && p.y >= m.frame.y - 1, `${tag}: a plant leaves the bed`));
  ok(m.scrollX <= 0, `${tag}: sideways scroll of ${m.scrollX}px`);
  if (opts.explore) {
    ok(m.nR === n && m.nRe === n, `${tag}: ${m.nR} R pollen and ${m.nRe} R eggs drawn for p = ${n / 10}`);
    const c = [n * n, 2 * n * (10 - n), (10 - n) * (10 - n)];
    ok(m.colors[0] === c[0] && m.colors[1] === c[1] && m.colors[2] === c[2] && m.colors[3] === 0, `${tag}: plants drawn ${m.colors} but expected ${c}`);
    ok(m.signs.join('|') === `RR ${c[0]}%|RW ${c[1]}%|WW ${c[2]}%`, `${tag}: signs say ${m.signs.join(', ')}`);
    const want = [`p = ${(n / 10).toFixed(1)}`, `q = ${(1 - n / 10).toFixed(1)}`, `p² = ${(c[0] / 100).toFixed(2)}`, `2pq = ${(c[1] / 100).toFixed(2)}`, `q² = ${(c[2] / 100).toFixed(2)}`];
    ok(m.cause.text.join('|') === want.join('|'), `${tag}: the cause line says ${m.cause.text.join(' ')}`);
    if (m.vw <= 640) ok(m.cause.rows <= 2, `${tag}: the cause line takes ${m.cause.rows} rows`);
  }
}

async function open(w, dark) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 700 ? 844 : w < 1100 ? 1024 : 900 }, serviceWorkers: 'block', hasTouch: w < 700 });
  await ctx.route(u => !u.href.startsWith(BASE) && !u.href.startsWith('data:'), r => r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push(e.message));
  if (dark) await page.addInitScript(() => { try { localStorage.setItem('nremt_theme', 'dark'); } catch (e) {} });
  await page.goto(BASE + PAGE);
  await page.waitForSelector('.hw2-svg');
  await page.waitForTimeout(600);
  return { ctx, page, errs };
}
async function settle(page) { await page.waitForFunction(() => document.querySelectorAll('.hw2 .tk2-cause .tk2-cz').length === 5 || document.querySelector('.hw2 .tk2-cause').offsetParent === null, null, { timeout: 5000 }).catch(() => {}); await page.waitForTimeout(380); }

const sheets = [];
for (const w of WIDTHS) for (const dark of (DARK.includes(w) ? [false, true] : [false])) {
  const { ctx, page, errs } = await open(w, dark), tag0 = `${w}${dark ? ' dark' : ''}`, shots = [], heights = new Set();
  // the opening state, with the first visit cue
  let m = await page.evaluate(measure);
  ok(!!m.cue, `${tag0}: no first visit cue at the opening`);
  check(m, `${tag0} opening`, 7, { explore: true }); heights.add(Math.round(m.cause.h));
  const scene = page.locator('.hw2-scene');
  shots.push({ t: 'opening', b: await scene.screenshot() });
  const input = page.locator('.hw2 .tk2-in');
  await input.focus();
  await page.keyboard.press('Home');
  for (let n = 0; n <= 10; n++) {
    if (n) await page.keyboard.press('ArrowRight');
    await settle(page);
    m = await page.evaluate(measure);
    check(m, `${tag0} p=${n / 10}`, n, { explore: true }); heights.add(Math.round(m.cause.h));
    // mid change: the line's box keeps its height
    if (!dark || n % 5 === 0) shots.push({ t: 'p = ' + (n / 10).toFixed(1), b: await scene.screenshot() });
  }
  // a change in progress: the box of the cause line does not jump
  await page.keyboard.press('Home'); await page.waitForTimeout(60);
  m = await page.evaluate(measure); heights.add(Math.round(m.cause.h));
  ok(m.cause.text.length === 2, `${tag0}: mid change the cause line already shows ${m.cause.text.length} pills`);
  await settle(page);
  ok(heights.size === 1, `${tag0}: the cause line changes height (${[...heights].join(', ')} px)`);
  // Test yourself: planted, then in bloom
  await page.locator('.ls-root').getByText('Test yourself', { exact: true }).first().click();
  await page.waitForTimeout(700);
  m = await page.evaluate(measure);
  check(m, `${tag0} target planted`, 5);
  ok(m.colors[3] === 100 && m.signs.length === 0, `${tag0}: the planted bed gives the answer away (${m.colors}, ${m.signs.length} signs)`);
  shots.push({ t: 'Test yourself: planted', b: await scene.screenshot() });
  await page.locator('.hw2-go button').click();
  await page.waitForSelector('.hw2-fb .bio-mark', { timeout: 6000 });
  await page.waitForTimeout(500);
  m = await page.evaluate(measure);
  check(m, `${tag0} target in bloom`, 5);
  ok(m.colors[3] === 0 && m.signs.length === 3, `${tag0}: the bed did not bloom`);
  const sb = await scene.boundingBox();
  ok(sb.y >= -1 && sb.y + sb.height <= (page.viewportSize().height + 1), `${tag0}: the picture is not in view after the bloom`);
  shots.push({ t: 'Test yourself: in bloom', b: await scene.screenshot() });
  ok(errs.length === 0, `${tag0}: console errors: ${errs.join(' | ')}`);
  sheets.push({ tag: tag0, w, shots });
  await ctx.close();
}

// contact sheets: one page per width
const sp = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
for (const s of sheets) {
  const cell = Math.min(520, Math.max(260, s.w / 2.2));
  await sp.setContent('<body style="margin:0;padding:12px;font:700 13px system-ui;background:#888;color:#fff"><h3 style="margin:0 0 8px">Hardy-Weinberg sweep, ' + s.tag + ' px</h3><div style="display:flex;flex-wrap:wrap;gap:10px">' +
    s.shots.map(x => '<figure style="margin:0"><img style="display:block;width:' + cell + 'px" src="data:image/png;base64,' + x.b.toString('base64') + '"><figcaption>' + x.t + '</figcaption></figure>').join('') + '</div></body>');
  writeFileSync(join(OUT, 'sheet-' + s.tag.replace(' ', '-') + '.png'), await sp.screenshot({ fullPage: true }));
}
await browser.close(); server.close();
console.log(`Hardy-Weinberg sweep: ${pass} checks passed, ${fails.length} failed. Contact sheets in ${OUT}`);
if (fails.length) { fails.slice(0, 60).forEach(f => console.log('  FAIL ' + f)); process.exit(1); }
