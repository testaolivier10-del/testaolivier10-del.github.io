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
     - (review round 1) plants in a column and in a row never touch; each sign's text lies inside its sign; the pea
       target blooms as two signs (purple, white) with the carriers named, and the next target is snapdragons again.
     - (recheck 1) on both carrier targets (pea bed), at every p, both Aa plots carry the carrier pill (2pq), each in
       its own plot, turned along a single column plot, inside the stage and overlapping no label or allele.
   One child process per width (--width W runs one width).
   Usage: node scripts/tools-v2/hardy-weinberg-sweep.mjs [--out dir] [--width W]   (needs playwright) */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const PAGE = '/bio/tools/hardy-weinberg.html';
const ALL = [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
const wArg = process.argv.indexOf('--width');
const WIDTHS = wArg > 0 ? [+process.argv[wArg + 1]] : ALL;
const DARK = [390, 768, 1440];
const outI = process.argv.indexOf('--out');
const OUT = outI > 0 ? process.argv[outI + 1] : '/tmp/hw-sweep';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };

/* With no --width, run one child process per width (one process for all ten can pass ten minutes) and add up. */
if (wArg < 0) {
  const { spawnSync } = await import('node:child_process');
  let passed = 0, failed = 0;
  for (const w of ALL) {
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--width', String(w), '--out', OUT], { encoding: 'utf8' });
    const out = (r.stdout || '') + (r.stderr || ''), m = /(\d+) checks passed, (\d+) failed/.exec(out);
    if (m) { passed += +m[1]; failed += +m[2]; } else { failed++; }
    process.stdout.write(`  ${w}: ${m ? m[0] : 'did not finish'}\n`);
    if (!m || +m[2]) process.stdout.write(out.split('\n').filter(l => /FAIL|Error/.test(l)).slice(0, 20).join('\n') + '\n');
  }
  console.log(`Hardy-Weinberg sweep: ${passed} checks passed, ${failed} failed. Contact sheets in ${OUT}`);
  process.exit(failed ? 1 : 0);
}

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
  const vis = e => e.getBoundingClientRect().width > 0;   // pills and signs that are not drawn now are display none
  q('.hw2-pill').filter(vis).forEach(e => labels.push({ k: 'pill ' + e.textContent, ...R(e) }));
  q('.hw2-cap').forEach(e => labels.push({ k: 'caption ' + e.textContent, ...R(e) }));
  const signEls = q('.hw2-sign').filter(vis);
  signEls.forEach(e => labels.push({ k: 'sign ' + e.textContent.trim(), ...R(e.querySelector('rect')) }));
  // the text (and its dot) of each sign, which must lie inside the sign (review round 1, must fix 4)
  const signText = signEls.map(e => ({ k: e.textContent.trim(), box: R(e.querySelector('rect')), t: R(e.querySelector('text')), d: R(e.querySelector('circle')) }));
  const toks = q('.hw2-tok').map(e => ({ k: 'allele', ...R(e) }));
  const knob = scene.querySelector('.tk2-dot'), cue = scene.querySelector('.tk2-cue');
  const frame = R(scene.querySelector('.hw2-frame')), soil = R(scene.querySelector('.hw2-soil'));
  // each plant's DRAWN box (its image has margins): its origin from the transform, the box from data-box
  const gP = scene.querySelector('.hw2-plants'), bx = (gP.getAttribute('data-box') || '0 0 0 0').split(' ').map(Number), sb = scene.querySelector('svg').getBoundingClientRect();
  const plants = q('.hw2-p').map(e => { const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(e.getAttribute('transform')), ox = sb.left + +m[1], oy = sb.top + +m[2];
    return { x: ox + bx[0], y: oy + bx[1], r: ox + bx[0] + bx[2], b: oy + bx[1] + bx[3] }; });
  const cause = document.querySelector('.hw2 .tk2-cause'), cz = Array.from(cause.querySelectorAll('.tk2-cz'));
  const rows = new Set(cz.map(e => Math.round(e.getBoundingClientRect().top)));
  const txt = e => e.textContent.replace(/\s+/g, ' ').trim();
  return { S, labels, toks, knob: knob && knob.offsetParent ? (b => ({ x: b.x - 7, y: b.y - 7, r: b.r + 7, b: b.b + 7, w: b.w + 14, h: b.h + 14 }))(R(knob)) : null, /* the dot and its two rings */ cue: cue ? R(cue) : null, frame, soil, plants,
    cause: { h: cause.getBoundingClientRect().height, rows: rows.size, text: cz.map(txt), hidden: cause.offsetParent === null },
    signs: signEls.map(e => txt(e)), signText, car: q('.hw2-car .hw2-pill').filter(vis).map(e => txt(e)), carBox: q('.hw2-car .hw2-pill').filter(vis).map(e => R(e)), sp: document.querySelector('.hw2').getAttribute('data-sp'), nR: q('.hw2-top .hw2-tok.is-r:not(.is-egg)').length, nRe: q('.hw2-top .hw2-tok.is-r.is-egg').length,
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
  // the knob and an allele are both round: compare centres (with the knob's rings)
  if (m.knob) m.toks.forEach(t => ok(Math.hypot((m.knob.x + m.knob.r) / 2 - (t.x + t.r) / 2, (m.knob.y + m.knob.b) / 2 - (t.y + t.b) / 2) > m.knob.w / 2 + Math.max(t.w, t.h) / 2 - 1, `${tag}: the knob covers an allele`));
  // the bed is the largest thing: most of the picture, and larger than any control or line outside it
  const bed = m.frame.w * m.frame.h;
  ok(bed > 0.5 * S.w * S.h, `${tag}: the bed is only ${(100 * bed / (S.w * S.h)).toFixed(0)}% of the picture`);
  ok(bed > 3 * m.biggest, `${tag}: something outside the picture is nearly as large as the bed`);
  ok(S.w * S.h > 0.38 * m.vw * Math.min(900, S.b + 200), `${tag}: the picture is small on the screen`);
  m.plants.forEach(p => ok(p.x >= m.soil.x - 1 && p.r <= m.soil.r + 1 && p.b <= m.soil.b + 1 && p.y >= m.frame.y - 1, `${tag}: a plant leaves the bed`));
  // separate, countable plants: in every column each plant clears the one in front of it (review round 1, must fix 2)
  for (let i = 0; i + 10 < m.plants.length; i++) ok(m.plants[i].b < m.plants[i + 10].y, `${tag}: plants ${i} and ${i + 10} touch in their column`);
  for (let i = 0; i < m.plants.length; i++) if (i % 10 < 9) ok(m.plants[i].r < m.plants[i + 1].x + 0.5, `${tag}: plants ${i} and ${i + 1} touch in their row`);
  m.signText.forEach(s => ok(s.t.x >= s.box.x + 2 && s.t.r <= s.box.r - 2 && s.d.x >= s.box.x + 2 && s.t.y >= s.box.y && s.t.b <= s.box.b, `${tag}: the text "${s.k}" runs out of its sign (${(s.t.r - s.box.r).toFixed(1)} px)`));
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

/* (recheck 1) The pea bed is split into four plots (AA, Aa, Aa, aa). Both Aa plots must carry the carrier pill, so
   a student who counts the labelled plants gets 2pq, not pq; each pill lies in its own plot, a single column plot
   has its pill turned along it, and (through check()) no pill is clipped or overlaps another label or an allele. */
function carriers(m, tag, n) {
  const want = n > 0 && n < 10 ? 2 : 0;
  ok(m.car.length === want, `${tag}: ${m.car.length} carrier pills on the pea bed, expected ${want} (${m.car.join(', ')})`);
  if (!want || m.car.length !== want) return;
  m.car.forEach(t => ok(/^Aa\b/.test(t) && /2pq/.test(t), `${tag}: a carrier pill reads "${t}"`));
  // each Aa plot from its own plants: top right (A egg, a pollen) and bottom left (a egg, A pollen)
  const plot = sel => { const ps = m.plants.filter((p, i) => sel(Math.floor(i / 10), i % 10));
    return { x: Math.min(...ps.map(p => p.x)), y: Math.min(...ps.map(p => p.y)), r: Math.max(...ps.map(p => p.r)), b: Math.max(...ps.map(p => p.b)) }; };
  const plots = [plot((r, c) => r < n && c >= n), plot((r, c) => r >= n && c < n)];
  const cols = [10 - n, n];
  plots.forEach((pl, j) => {
    const inPl = m.carBox.filter(b => { const cx = (b.x + b.r) / 2, cy = (b.y + b.b) / 2; return cx > pl.x - 2 && cx < pl.r + 2 && cy > pl.y - 2 && cy < pl.b + 2; });
    ok(inPl.length === 1, `${tag}: the ${j ? 'bottom left' : 'top right'} Aa plot carries ${inPl.length} carrier pills`);
    if (inPl.length === 1 && cols[j] === 1) ok(inPl[0].h > inPl[0].w, `${tag}: the pill on the single column Aa plot is not turned along it`);
    if (inPl.length === 1) ok(inPl[0].x >= m.soil.x - 1 && inPl[0].r <= m.soil.r + 1 && inPl[0].y >= m.soil.y - 1 && inPl[0].b <= m.soil.b + 1, `${tag}: a carrier pill leaves the bed`);
  });
}
/* Bloom a carrier target at every p (0 to 1 in steps of 0.1); the right answer comes last, as it ends the target. */
async function everyP(page, scene, shots, tag, right, done) {
  const order = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(n => n !== right && !done.includes(n)).concat([right]);
  for (const n of order) {
    const again = page.locator('.hw2-again');
    if (await again.count()) { await again.click(); await page.waitForTimeout(250); }
    const input = page.locator('.hw2 .tk2-in');
    await input.focus();
    await page.keyboard.press('Home');
    for (let i = 0; i < n; i++) await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    await page.locator('.hw2-go button').click();
    await page.waitForSelector('.hw2-fb .bio-mark', { timeout: 6000 });
    await page.waitForTimeout(400);
    const m = await page.evaluate(measure);
    check(m, `${tag} p=${n / 10} in bloom`, n);
    carriers(m, `${tag} p=${n / 10}`, n);
    if (n === 1 || n === 9 || n === right) shots.push({ t: `${tag.split(' ').slice(-2).join(' ')}: p = ${(n / 10).toFixed(1)}`, b: await scene.screenshot() });
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
async function settle(page) {
  // (no waitForFunction: the page's Content Security Policy refuses the string it evaluates)
  for (let i = 0; i < 60; i++) {
    const done = await page.evaluate(() => { const c = document.querySelector('.hw2 .tk2-cause'); return c.offsetParent === null || c.querySelectorAll('.tk2-cz').length === 5; });
    if (done) break;
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(120);
}

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
  await page.waitForTimeout(380);   // mid bloom (a phone scrolls the picture into view first when it is off screen)
  const sb = await scene.boundingBox();
  ok(sb.y >= -1 && sb.y + sb.height <= (page.viewportSize().height + 1), `${tag0}: the picture is not in view during the bloom`);
  await page.waitForSelector('.hw2-fb .bio-mark', { timeout: 6000 });
  await page.waitForTimeout(400);
  m = await page.evaluate(measure);
  check(m, `${tag0} target in bloom`, 5);
  // target 1 is on the pea bed (complete dominance): two signs (purple, white) and the carriers named on a pq plot
  ok(m.sp === 'pea' && m.colors[3] === 0 && m.signs.join('|') === 'purple 75%|white 25%', `${tag0}: the pea bed did not bloom as 75% purple, 25% white (${m.sp}, ${m.signs})`);
  carriers(m, `${tag0} target 1 p=0.5`, 5);
  shots.push({ t: 'Test yourself: peas in bloom', b: await scene.screenshot() });
  // (recheck 1) every p on both carrier targets: both Aa plots named, inside the stage, overlapping nothing
  await everyP(page, scene, shots, `${tag0} target 1`, 6, [5]);
  // the next target is back on the snapdragons: planted, then three signs after the bloom
  await page.locator('.hw2-nextt').click();
  await page.waitForTimeout(500);
  m = await page.evaluate(measure);
  check(m, `${tag0} target 2 planted`, 3);
  ok(m.sp === 'snap' && m.colors[3] === 100 && m.signs.length === 0 && m.car.length === 0, `${tag0}: target 2 is not a planted snapdragon bed (${m.sp}, ${m.colors}, ${m.signs.length})`);
  await page.locator('.hw2-go button').click();
  await page.waitForSelector('.hw2-fb .bio-mark', { timeout: 6000 });
  await page.waitForTimeout(400);
  m = await page.evaluate(measure);
  check(m, `${tag0} target 2 in bloom`, 3);
  ok(m.colors[3] === 0 && m.signs.join('|') === 'RR 9%|RW 42%|WW 49%', `${tag0}: target 2 did not bloom (${m.signs})`);
  shots.push({ t: 'Test yourself: snapdragons in bloom', b: await scene.screenshot() });
  // target 3 (rare recessive) is the second carrier target, on the pea bed again
  await page.locator('.hw2-nextt').click();
  await page.waitForTimeout(500);
  m = await page.evaluate(measure);
  ok(m.sp === 'pea' && m.car.length === 0, `${tag0}: target 3 is not a planted pea bed (${m.sp}, ${m.car})`);
  await everyP(page, scene, shots, `${tag0} target 3`, 9, []);
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
