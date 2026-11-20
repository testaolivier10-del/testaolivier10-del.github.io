#!/usr/bin/env node
/* Tools v2 sweep: AP Biology, Chi-square test (docs/tools-v2-chi-square-brief.md; pattern of
   scripts/tools-v2/simpson-diversity-sweep.mjs).
   Every landmark state of Explore (two and four chambers, opening, even, past the line, every bug in one chamber,
   80 bugs), the Challenges view and a Problems view, at widths 360 to 1920, light and dark:
     - no sideways scroll; nothing clipped by the stage (tray, bugs, signs, graph text, cue, cause line);
     - bugs sit inside their chamber and never under a sign; signs, graph labels and the cue never overlap (4 px);
     - the scene (the thing acted on) is the largest thing on the stage; tap targets at least 44 px;
     - no rendered text under 11 px (scene, graph, cause line, the Problems figure and its table);
     - phones (640 px and under): the cause line is at most two rows and keeps its height;
     - the words agree with the bugs as drawn: each sign, the cause line pills, the χ² pill and the bar's pieces
       are read back from the bugs' drawn places (their transforms), not from the model;
   and, frame by frame at 390 and 1440 (--frames): during a drag, Let them wander, 40 to 80 bugs, a tab switch and
   Start over, every frame's signs, cause line, χ² pill and bar match the bugs drawn in that frame, and no decision
   word shows while bugs are still moving.
   Usage: node scripts/tools-v2/chi-square-sweep.mjs [--width <px>] [--frames] [--shots <dir>]
   With no --width it runs each of the ten widths in its own process, then the frame checks at 390 and 1440.
   Needs playwright (PW_ROOT names a folder whose node_modules has it) and Chromium (CHROMIUM_PATH). */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, mkdirSync } from 'node:fs';
import { dirname, extname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const WIDTHS = [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
const ONE = arg('--width', null), FRAMES = process.argv.includes('--frames'), SHOTS = arg('--shots', null);

if (!ONE && !FRAMES) {
  // one width per process (a single process for all ten can pass ten minutes)
  let pass = 0, fail = 0, bad = false;
  const runs = WIDTHS.map(w => ['--width', String(w)]).concat([['--frames']]);
  for (const a of runs) {
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...a, ...(SHOTS ? ['--shots', SHOTS] : [])], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
    process.stdout.write(r.stdout);
    const m = /(\d+) passed, (\d+) failed/.exec(r.stdout || '');
    if (m) { pass += +m[1]; fail += +m[2]; } else bad = true;
  }
  console.log(`\nchi-square sweep, all runs: ${pass} passed, ${fail} failed${bad ? ' (a run did not finish)' : ''}`);
  process.exit(fail || bad ? 1 : 0);
}

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
await new Promise(ok => server.listen(0, ok));
const PORT = server.address().port;
const URL0 = `http://localhost:${PORT}/bio/tools/chi-square.html`;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

let pass = 0; const fails = [];
const ok = (c, msg) => { if (c) pass++; else fails.push(msg); };

async function open(w, dark, opts = {}) {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : w < 1100 ? 1024 : 900 }, serviceWorkers: 'block', hasTouch: w < 500, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.addInitScript(([dark, noCue]) => { try { if (dark) localStorage.setItem('nremt_theme', 'dark'); if (noCue) localStorage.setItem('tk2c:apbio-chi', '1'); } catch (e) {} }, [dark, !!opts.noCue]);
  await page.goto(URL0 + (opts.hash || '')); await page.waitForSelector('.cs2-bugs use', { timeout: 15000 }); await page.waitForTimeout(700);
  return { browser, page, errs };
}
async function until(page, fn, a) { for (let i = 0; i < 120; i++) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(60); } return false; }
const still = (page) => until(page, () => !window.__cs2.busy());

/* What the page shows, read back from the DOM: the bugs' drawn places, the signs, the pills, the χ² pill, the bar. */
const READ = () => {
  const G = window.__cs2.G(), k = G.k;
  const chOf = (x, y) => k === 2 ? (G.side ? (x < G.mx ? 0 : 1) : (y < G.my ? 0 : 1)) : (x < G.mx ? 0 : 1) + (y < G.my ? 0 : 2);
  const drawn = G.ch.map(() => 0), bugs = [];
  document.querySelectorAll('.cs2-bugs use').forEach(u => {
    const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(u.getAttribute('transform') || ''); if (!m) return;
    const op = +(u.getAttribute('opacity') || 1), x = +m[1], y = +m[2];
    if (op >= 0.5) drawn[chOf(x, y)]++;
    bugs.push({ x, y, op, held: u.classList.contains('is-held') });
  });
  const signs = [...document.querySelectorAll('.cs2-sign-cv')].map(e => +e.textContent);
  const exp = [...document.querySelectorAll('.cs2-sign-e')].map(e => e.textContent);
  const cause = document.querySelector('.cs2 .tk2-cause'), pills = [...cause.querySelectorAll('.tk2-cz')].map(e => e.textContent);
  const pill = document.querySelector('.cs2-markt').textContent;
  const segs = [...document.querySelectorAll('.cs2-seg')].map(s => +s.getAttribute('width') || 0);
  const GG = window.__cs2.GG();
  return { k, held: bugs.filter(b => b.held).length, n: bugs.filter(b => b.op >= 0.5).length, drawn, signs, exp, pills, take: cause.classList.contains('is-take') ? cause.textContent : null, pill, segs, busy: window.__cs2.busy(), unit: (GG.R - GG.L) / GG.xmax };
};
const CRIT = { 1: 3.84, 3: 7.82 };
function agree(s, tag) {
  const N = s.drawn.reduce((a, b) => a + b, 0), e = N / s.k, chi = s.drawn.reduce((a, o) => a + (o - e) ** 2 / e, 0);
  ok(s.signs.join() === s.drawn.join(), `${tag}: signs ${s.signs} vs drawn ${s.drawn}`);
  const exTxt = 'expected ' + (e % 1 ? e.toFixed(1) : String(e));
  ok(s.exp.every(t => t === exTxt), `${tag}: expected signs ${s.exp} vs ${exTxt}`);
  ok(s.pill.replace(' →', '') === 'χ² = ' + chi.toFixed(2), `${tag}: χ² pill "${s.pill}" vs drawn ${chi.toFixed(2)}`);
  if (!s.take) {
    ok(s.pills.some(p => p === 'χ² = ' + chi.toFixed(2)), `${tag}: cause χ² ${s.pills} vs ${chi.toFixed(2)}`);
    if (s.k === 2) s.drawn.forEach((o, i) => { const d = o - e, t = (d > 0 ? '+' : d < 0 ? '−' : '±') + Math.abs(d); ok(s.pills[i] && s.pills[i].endsWith(' ' + t), `${tag}: gap pill ${s.pills[i]} vs ${t}`); });
    const dec = s.pills.filter(p => /reject/.test(p));
    if (s.busy) ok(!dec.length, `${tag}: a decision word while bugs move (${dec})`);
    else ok(dec.length === 1 && dec[0] === (chi > CRIT[s.k - 1] ? 'reject the null' : 'fail to reject'), `${tag}: decision ${dec} for χ² ${chi.toFixed(2)}`);
  } else {
    ok(!s.busy, `${tag}: a takeaway while bugs move`);
    ok(s.take.includes(chi.toFixed(2)), `${tag}: takeaway "${s.take}" without the drawn χ² ${chi.toFixed(2)}`);
  }
  // the bar's pieces: each chamber's (o − e)² / e in χ² units (pieces past the axis end are cut)
  let acc = 0;
  s.drawn.forEach((o, i) => { const t = (o - e) ** 2 / e, w0 = Math.min(acc + t, 10 + 8 * (s.k - 2) / 2) - Math.min(acc, 10 + 8 * (s.k - 2) / 2); acc += t; const want = w0 * s.unit; ok(Math.abs(s.segs[i] - want) <= 1.6 || want < 1.2 && s.segs[i] < 1.6, `${tag}: bar piece ${i} ${s.segs[i]} vs ${want.toFixed(1)}`); });
}

/* Geometry checks of one frame (the stage, the scene, the graph, the lines). */
const GEO = () => {
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const scene = document.querySelector('.cs2-scene'), graph = document.querySelector('.cs2-graph'), stage = document.querySelector('.cs2');
  const G = window.__cs2.G(), so = R(scene);
  const signs = [...document.querySelectorAll('.cs2-sign-bg')].map(R);
  const bugs = [...document.querySelectorAll('.cs2-bugs use')].map(u => { const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(u.getAttribute('transform')); return { x: so.l + +m[1], y: so.t + +m[2] }; });
  const texts = [...document.querySelectorAll('.cs2 svg text')].filter(t => t.textContent.trim() && t.getBBox().width > 0).map(t => {
    const s = t.ownerSVGElement, vb = s.viewBox.baseVal, k = vb && vb.width ? s.getBoundingClientRect().width / vb.width : 1;
    return { s: t.textContent, cls: t.getAttribute('class'), px: parseFloat(getComputedStyle(t).fontSize) * k, box: R(t) };
  });
  const cause = document.querySelector('.cs2 .tk2-cause'), cr = R(cause);
  const pills = [...cause.querySelectorAll('.tk2-cz')].map(R);
  const rows = new Set(pills.map(p => Math.round(p.t))).size;
  const cue = document.querySelector('.cs2 .tk2-cue');
  const btns = [...document.querySelectorAll('.cs2-acts button, .cs2 .tk2-tab, .cs2 .tk2-how')].filter(b => b.offsetParent).map(b => ({ s: b.textContent.trim(), ...R(b) }));
  const kids = [...stage.children].filter(k => k.offsetParent).map(k => ({ c: k.className, a: k.getBoundingClientRect().width * k.getBoundingClientRect().height }));
  const ml = document.querySelector('.cs2-mark'), go = graph.getBoundingClientRect(), mark = ml ? { x: go.left + +ml.getAttribute('x1'), t: go.top + +ml.getAttribute('y1'), b: go.top + +ml.getAttribute('y2') } : null;
  return { mark, vw: innerWidth, sw: document.documentElement.scrollWidth, so, go: R(graph), st: R(stage), signs, bugs, bugL: G.bugL, tray: { l: so.l + G.ix0, t: so.t + G.iy0, r: so.l + G.ix1, b: so.t + G.iy1 }, ch: G.ch.map(c => ({ l: so.l + c.x0, t: so.t + c.y0, r: so.l + c.x1, b: so.t + c.y1 })), k: G.k, side: G.side, mx: so.l + G.mx, my: so.t + G.my,
    texts, cause: cr, causeFs: parseFloat(getComputedStyle(cause.querySelector('.tk2-cz') || cause).fontSize), rows, cue: cue ? R(cue) : null, btns, kids };
};
const inside = (a, b, m = 0) => a.l >= b.l - m && a.t >= b.t - m && a.r <= b.r + m && a.b <= b.b + m;
const apart = (a, b, gap = 4) => a.r + gap <= b.l || b.r + gap <= a.l || a.b + gap <= b.t || b.b + gap <= a.t;
function geoChecks(g, tag, phone) {
  ok(g.sw <= g.vw + 1, `${tag}: sideways scroll ${g.sw} > ${g.vw}`);
  ok(inside(g.tray, g.so), `${tag}: tray clipped by the scene`);
  g.signs.forEach((s, i) => ok(inside(s, g.so, 0.5), `${tag}: sign ${i} clipped`));
  for (let i = 0; i < g.signs.length; i++) for (let j = i + 1; j < g.signs.length; j++) ok(apart(g.signs[i], g.signs[j]), `${tag}: signs ${i} and ${j} overlap`);
  // every bug inside its chamber (clear of the rim and the walls by a third of a bug) and never under a sign
  const m = g.bugL * 0.3;
  g.bugs.forEach((b, i) => {
    const c = g.ch.find(c => b.x >= c.l - 0.5 && b.x <= c.r + 0.5 && b.y >= c.t - 0.5 && b.y <= c.b + 0.5);
    ok(!!c && b.x >= c.l + m - 0.5 && b.x <= c.r - m + 0.5 && b.y >= c.t + m - 0.5 && b.y <= c.b - m + 0.5, `${tag}: bug ${i} at ${b.x.toFixed(0)},${b.y.toFixed(0)} not inside a chamber`);
    const r = g.bugL * 0.45, bb = { l: b.x - r, r: b.x + r, t: b.y - r, b: b.y + r };
    ok(g.signs.every(s => apart(bb, s, 0)), `${tag}: bug ${i} under a sign`);
  });
  // text: inside its box, at least 11 px, labels apart from each other by 4 px (each tick from the others too)
  g.texts.forEach(t => ok(t.px >= 10.99, `${tag}: text "${t.s}" ${t.px.toFixed(1)} px`));
  const gt = g.texts.filter(t => !/cs2-sign/.test(t.cls || ''));
  gt.forEach(t => ok(inside(t.box, g.go, 0.5), `${tag}: graph text "${t.s}" clipped`));
  for (let i = 0; i < gt.length; i++) for (let j = i + 1; j < gt.length; j++) ok(apart(gt[i].box, gt[j].box), `${tag}: "${gt[i].s}" and "${gt[j].s}" overlap`);
  const st = g.texts.filter(t => /cs2-sign/.test(t.cls || ''));
  st.forEach(t => ok(g.signs.some(s => inside(t.box, s, 0.5)), `${tag}: sign text "${t.s}" outside its sign`));
  // the χ² marker's line never runs through a label (only through its own pill)
  if (g.mark) gt.filter(t => !/cs2-markt|cs2-tick/.test(t.cls || '')).forEach(t => ok(!(g.mark.x > t.box.l - 2 && g.mark.x < t.box.r + 2 && g.mark.b > t.box.t && g.mark.t < t.box.b), `${tag}: the χ² line runs through "${t.s}"`));
  ok(g.causeFs >= 11, `${tag}: cause line text ${g.causeFs}px`);
  ok(inside(g.cause, g.st, 0.5), `${tag}: cause line clipped by the stage`);
  if (g.cue) { ok(inside(g.cue, g.so, 0.5), `${tag}: cue clipped`); g.signs.forEach((s, i) => ok(apart(g.cue, s, 2), `${tag}: cue covers sign ${i}`)); }
  // the scene is the largest thing on the stage
  const big = g.kids.reduce((a, b) => b.a > a.a ? b : a, { a: 0 });
  ok(/cs2-scene/.test(big.c), `${tag}: the largest thing is ${big.c}`);
  ok(g.so.w * g.so.h > g.go.w * g.go.h * 1.4, `${tag}: the scene is not clearly larger than the graph`);
  g.btns.forEach(b => ok(b.h >= 43.5 || /tk2-how|Show me how/.test(b.s) && b.h >= 24, `${tag}: target "${b.s}" ${b.h.toFixed(0)} px tall`));
  if (phone) ok(g.rows <= 2, `${tag}: cause line in ${g.rows} rows`);
}

const STATES = [
  { id: 'two-open', tab: 0, counts: [24, 16] },
  { id: 'two-even', tab: 0, counts: [20, 20] },
  { id: 'two-reject', tab: 0, counts: [28, 12] },
  { id: 'two-all', tab: 0, counts: [40, 0] },
  { id: 'two-near', tab: 0, counts: [26, 14] },
  { id: 'two-just-past', tab: 0, counts: [27, 13] },
  { id: 'two-80', tab: 0, big: true, counts: [52, 28] },
  { id: 'four-open', tab: 1, counts: [13, 9, 11, 7] },
  { id: 'four-even', tab: 1, counts: [10, 10, 10, 10] },
  { id: 'four-reject', tab: 1, counts: [18, 6, 10, 6] },
  { id: 'four-all', tab: 1, counts: [0, 0, 0, 40] },
  { id: 'four-near', tab: 1, counts: [15, 7, 12, 6] },
  { id: 'four-80', tab: 1, big: true, counts: [26, 18, 22, 14] },
];

async function sweepWidth(w) {
  for (const dark of [false, true]) {
    const theme = dark ? 'dark' : 'light', phone = w <= 640;
    let { browser, page, errs } = await open(w, dark);
    // the first visit: the cue shows and covers no sign
    let g = await page.evaluate(GEO);
    ok(!!g.cue, `${w} ${theme}: no first visit cue`);
    geoChecks(g, `${w} ${theme} first-visit`, phone);
    if (SHOTS && (w === 390 || w === 768 || w === 1440)) await page.screenshot({ path: join(SHOTS, `sweep-${w}-${theme}-00-first.png`) });
    let causeH = null;
    for (const s of STATES) {
      const tag = `${w} ${theme} ${s.id}`;
      await page.click(`.cs2 .tk2-tab:nth-child(${s.tab + 1})`); await still(page);
      const bigNow = await page.evaluate(() => document.querySelector('.cs2-nb[data-b="1"]').getAttribute('aria-pressed') === 'true');
      if (!!s.big !== bigNow) { await page.click(`.cs2-nb[data-b="${s.big ? 1 : 0}"]`); await still(page); }
      await page.evaluate(c => window.__cs2.set(c), s.counts); await page.waitForTimeout(120);
      const r = await page.evaluate(READ);
      ok(r.drawn.join() === s.counts.join(), `${tag}: drawn ${r.drawn} vs set ${s.counts}`);
      agree(r, tag);
      g = await page.evaluate(GEO);
      geoChecks(g, tag, phone);
      if (phone) { if (causeH == null) causeH = g.cause.h; else ok(Math.abs(g.cause.h - causeH) < 1.5, `${tag}: cause line height ${g.cause.h} vs ${causeH}`); }
      if (SHOTS && (w === 390 || w === 768 || w === 1440 || w === 360)) await page.screenshot({ path: join(SHOTS, `sweep-${w}-${theme}-${s.id}.png`) });
    }
    // review round 1, must fix 3 and 4: every chance run is a dot (none dropped, however tall a column), the dots stay
    // inside the plot and never cover a label; runs heaped near the critical value (the worst case for "5% tail")
    for (const tab of [0, 1]) {
      await page.click(`.cs2 .tk2-tab:nth-child(${tab + 1})`); await still(page);
      const crit = tab ? 7.82 : 3.84, list = [];
      for (let i = 0; i < 90; i++) list.push(crit + (i % 9) * 0.12 - 0.3);
      for (let i = 0; i < 60; i++) list.push(0.2 + (i % 5) * 0.1);
      await page.evaluate(l => window.__cs2.runs(l), list);
      const d = await page.evaluate(() => { const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; };
        const g = document.querySelector('.cs2-graph').getBoundingClientRect(), GG = window.__cs2.GG();
        return { n: document.querySelectorAll('.cs2-run').length, tally: window.__cs2.tally().n, dots: [...document.querySelectorAll('.cs2-run')].map(R), texts: [...document.querySelectorAll('.cs2-gsvg text')].filter(t => t.textContent.trim()).map(t => ({ s: t.textContent, ...R(t) })), base: g.top + GG.base, top: g.top + GG.top }; });
      ok(d.n === d.tally && d.n === 150, `${w} ${theme} tab ${tab}: ${d.n} dots for ${d.tally} runs`);
      ok(d.dots.every(o => o.b <= d.base + 0.6 && o.t >= d.top - 0.6), `${w} ${theme} tab ${tab}: a dot outside the plot`);
      const hit = d.texts.filter(t => d.dots.some(o => !(o.r <= t.l || t.r <= o.l || o.b <= t.t || t.b <= o.t)));
      ok(!hit.length, `${w} ${theme} tab ${tab}: dots cover "${hit.map(t => t.s).join('", "')}"`);
      await page.evaluate(() => window.__cs2.runs([]));
    }
    await page.click('.cs2 .tk2-tab:nth-child(1)'); await still(page);
    // Challenges: the same stage beside the challenge card
    await page.goto('about:blank'); await page.goto(URL0 + '#goals'); await page.waitForSelector('.cs2-bugs use'); await page.waitForTimeout(800); await still(page);
    g = await page.evaluate(GEO);
    geoChecks(g, `${w} ${theme} goals`, false);
    const rg = await page.evaluate(READ); agree(rg, `${w} ${theme} goals`);
    ok(rg.drawn.join() === '24,16', `${w} ${theme} goals: challenges start from the opening (${rg.drawn})`);
    if (SHOTS && (w === 390 || w === 1440)) await page.screenshot({ path: join(SHOTS, `sweep-${w}-${theme}-goals.png`) });
    // Problems: the problem's figure and the table (text at least 11 px, no sideways scroll), the worked problem checked
    await page.goto('about:blank'); await page.goto(URL0 + '#practice'); await page.waitForSelector('.cs2-pfig'); await page.waitForTimeout(500);
    // review round 1, must fix 2: the figure is drawn at its own size (an svg scales to fit both ways, so the scale
    // is the smaller of width and height over the viewBox), and its text is at least 11 px
    const pf = await page.evaluate(() => { const sv = document.querySelector('.cs2-pfig'), r = sv.getBoundingClientRect(), vb = sv.viewBox.baseVal, k = Math.min(r.width / vb.width, r.height / vb.height);
      return { sw: document.documentElement.scrollWidth, vw: innerWidth, h: vb.height * k, small: [...document.querySelectorAll('.cs2-pfig text, .cs2-ctab th, .cs2-ctab td, .cs2-ctab caption')].map(t => ({ s: t.textContent, px: parseFloat(getComputedStyle(t).fontSize) * (t.ownerSVGElement ? k : 1) })).filter(x => x.px < 10.99) }; });
    ok(pf.h >= 250, `${w} ${theme} practice: the figure is ${pf.h.toFixed(0)} px tall`);
    ok(pf.sw <= pf.vw + 1, `${w} ${theme} practice: sideways scroll`);
    ok(!pf.small.length, `${w} ${theme} practice: small text ${JSON.stringify(pf.small.slice(0, 3))}`);
    if (SHOTS && (w === 390 || w === 1440)) await page.screenshot({ path: join(SHOTS, `sweep-${w}-${theme}-practice.png`), fullPage: w < 500 });
    // review round 1, must fix 1: from a deep link to Explore, the chamber holds its opening bugs
    for (const hash of ['#goals', '#practice', '?seed=777']) {
      await page.goto('about:blank'); await page.goto(URL0 + hash); await page.waitForTimeout(900);
      await page.evaluate(() => { const b = [...document.querySelectorAll('button, [role="tab"]')].find(b => b.textContent.trim() === 'Explore'); b.click(); });
      await page.waitForTimeout(500); await still(page);
      const r = await page.evaluate(READ);
      ok(r.drawn.join() === '24,16', `${w} ${theme} ${hash} then Explore: ${r.drawn}`);
      agree(r, `${w} ${theme} ${hash} then Explore`);
    }
    ok(!errs.length, `${w} ${theme}: console errors ${errs.slice(0, 2)}`);
    await browser.close();
  }
}

/* Frame by frame: every frame of every animated change agrees with the bugs drawn in it. */
async function frames(w) {
  const { browser, page, errs } = await open(w, false, { noCue: true });
  const grab = async (label, act, ms) => {
    const p = page.evaluate(([ms]) => new Promise(done => { const out = []; const t0 = performance.now(); const tick = () => { setTimeout(() => { out.push(window.__cs2read()); if (performance.now() - t0 < ms) requestAnimationFrame(tick); else done(out); }, 0); }; requestAnimationFrame(tick); }), [ms]);
    await act();
    const fr = await p;
    let moving = 0;
    fr.forEach((s, i) => { if (s.busy || s.held) moving++; agree(s, `${w} frames ${label} #${i}`); });
    ok(moving > 2, `${w} frames ${label}: only ${moving} frames in motion`);
    return fr.length;
  };
  let n = 0;
  await installRead(page);
  // a drag across the wall, slow then fast, and back
  n += await grab('drag', async () => {
    const g = await page.evaluate(() => { const G = window.__cs2.G(), r = document.querySelector('.cs2-scene').getBoundingClientRect(); const bs = window.__cs2.bugs().filter(b => window.__cs2.chamberOf(b.x, b.y) === 0).sort((a, b) => Math.hypot(a.x - G.mx, a.y - G.my) - Math.hypot(b.x - G.mx, b.y - G.my)); return { x: r.left + bs[0].x, y: r.top + bs[0].y, tx: r.left + G.mx + (G.side ? G.bugL * 3 : 0), ty: r.top + G.my + (G.side ? 0 : G.bugL * 3) }; });
    await page.mouse.move(g.x, g.y); await page.mouse.down();
    for (let i = 1; i <= 14; i++) { await page.mouse.move(g.x + (g.tx - g.x) * i / 14, g.y + (g.ty - g.y) * i / 14); await page.waitForTimeout(16); }
    for (let i = 1; i <= 4; i++) { await page.mouse.move(g.tx + (g.x - g.tx) * i / 4, g.ty + (g.y - g.ty) * i / 4); }
    for (let i = 1; i <= 4; i++) { await page.mouse.move(g.x + (g.tx - g.x) * i / 4, g.y + (g.ty - g.y) * i / 4); }
    await page.mouse.up();
  }, 900);
  await still(page);
  n += await grab('wander', () => page.click('.cs2-wander'), 2300); await still(page);
  n += await grab('double', () => page.click('.cs2-nb[data-b="1"]'), 1300); await still(page);
  n += await grab('wander-80', () => page.click('.cs2-wander'), 2300); await still(page);
  n += await grab('halve', () => page.click('.cs2-nb[data-b="0"]'), 1100); await still(page);
  n += await grab('tab-four', () => page.click('.cs2 .tk2-tab:nth-child(2)'), 1500); await still(page);
  n += await grab('wander-four', () => page.click('.cs2-wander'), 2300); await still(page);
  n += await grab('keys', async () => { await page.focus('.cs2-chb[data-ci="0"]'); await page.keyboard.press('Enter'); await page.waitForTimeout(80); await page.keyboard.press('Enter'); }, 1200); await still(page);
  n += await grab('start-over', () => page.click('.cs2-reset'), 1200); await still(page);
  n += await grab('tab-two', () => page.click('.cs2 .tk2-tab:nth-child(1)'), 1500); await still(page);
  // a wander interrupted by a drag: the drag wins and the words follow the bugs
  n += await grab('wander-interrupted', async () => { await page.click('.cs2-wander'); await page.waitForTimeout(300); await page.click('.cs2-wander'); }, 2600); await still(page);
  // review round 1, must fix 5: a grab during a wander finishes the run first (one run, counted as chance alone), and
  // no frame shows a decision while bugs still walk
  {
    const n0 = await page.evaluate(() => window.__cs2.tally().n);
    await page.click('.cs2-wander'); await page.waitForTimeout(350);
    n += await grab('drag-in-wander', async () => {
      const g = await page.evaluate(() => { const G = window.__cs2.G(), r = document.querySelector('.cs2-scene').getBoundingClientRect(); const b = window.__cs2.bugs()[0]; return { x: r.left + b.x, y: r.top + b.y, tx: r.left + G.mx, ty: r.top + G.my }; });
      await page.mouse.move(g.x, g.y); await page.mouse.down();
      ok(!(await page.evaluate(() => window.__cs2.busy())), `${w} drag in wander: the bugs still walk after the grab`);
      ok(await page.evaluate(() => window.__cs2.tally().n) === n0 + 1, `${w} drag in wander: the run was not finished and counted once`);
      for (let i = 1; i <= 8; i++) { await page.mouse.move(g.x + (g.tx - g.x) * i / 8, g.y + (g.ty - g.y) * i / 8); await page.waitForTimeout(16); }
      await page.mouse.up();
    }, 900);
    await still(page);
    ok(await page.evaluate(() => window.__cs2.tally().n) === n0 + 1, `${w} drag in wander: the drag added a chance run`);
  }
  const r = await page.evaluate(READ); agree(r, `${w} frames settled`);
  // leaving mid animation: Test yourself stops the bugs and the screen returns clean
  await page.click('.cs2-wander'); await page.waitForTimeout(300);
  await page.click('.ls-root .ls-modes button:nth-child(2), .ls-root [data-mode-btn="quiz"]').catch(async () => { await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Test yourself'); b && b.click(); }); });
  await page.waitForTimeout(300);
  ok(!(await page.evaluate(() => window.__cs2.busy())), `${w} frames: still moving after Test yourself`);
  // reduced motion: the new places at once, the words whole at once
  const rm = await open(w, false, { noCue: true, reduced: true });
  await installRead(rm.page);
  await rm.page.click('.cs2-wander'); await rm.page.waitForTimeout(60);
  const s2 = await rm.page.evaluate(READ);
  ok(!s2.busy, `${w} reduced: still moving`); agree(s2, `${w} reduced wander`);
  ok(!rm.errs.length && !errs.length, `${w} frames: console errors ${errs.concat(rm.errs).slice(0, 2)}`);
  await rm.browser.close();
  console.log(`${w}: ${n} frames sampled`);
  await browser.close();
}
async function installRead(page) {
  // the sampler reads every frame inside the page; its function comes in as a script from this server
  await page.addScriptTag({ url: `http://localhost:${PORT}/__cs2read.js` });
}

// the READ function as a script file the page may load
const READ_SRC = `window.__cs2read = ${READ.toString()};`;
server.removeAllListeners('request');
server.on('request', (req, res) => {
  if (req.url.startsWith('/__cs2read.js')) { res.writeHead(200, { 'Content-Type': 'text/javascript' }); res.end(READ_SRC); return; }
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const file = resolve(ROOT, '.' + p);
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }); createReadStream(file).pipe(res);
});

try {
  if (ONE) await sweepWidth(+ONE);
  if (FRAMES) { await frames(390); await frames(1440); }
} catch (e) { fails.push('crash: ' + (e && e.stack || e)); }
server.close();
const where = ONE ? `width ${ONE}` : 'frames';
fails.slice(0, 40).forEach(f => console.log('  FAIL ' + f));
console.log(`chi-square sweep (${where}): ${pass} passed, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
