/* Tools v2 layout sweep for the Organic Chemistry Reaction Predictor (docs/tools-v2-reaction-predictor-brief.md). At
   each width, light and dark: every substrate with a reagent for each path it can take (SN2, E2 with a small and a
   bulky base, SN1, E1, no reaction), solvent and heat flipped, Build your own loaded from a link, Test yourself (Call
   the path before and after a call), Check yourself, "?" open, a first visit with the cue, and a run left halfway
   (Test yourself must start clean, Explore come back settled). Reduced motion, so each change lands at once, except
   the runs that check motion. At each state it asserts:
     - nothing drawn or named is clipped by the stage (balls, lone pairs, charge badges, names, tray cards);
     - names sit at least 4 px clear of each other, of every ball and badge, of the controls and the cue;
     - no two balls sit on each other; badges and lone pairs do not sit on another atom's ball;
     - the molecule is the largest object in the picture (its balls' box is bigger than each tray card);
     - the tray's share bars are drawn in proportion to the shares they name;
     - no rendered text under 11 px in the tool (picture, cause line, Test yourself, "?");
     - names and the cause line's result wait while the molecule moves (checked halfway through a run);
     - on a phone the cause line is at most two rows and keeps one height; no sideways scroll; no console errors.

     node scripts/tools-v2/reaction-predictor-sweep.mjs [widths, comma separated] [--shots dir] [--dark-only|--light-only]

   Needs Playwright (the repo's, else /opt/npm-tools) and a Chromium (CHROME or
   /opt/pw-browsers/chromium-1243/chrome-linux64/chrome). It serves the repo itself on a free port, blocks service
   workers and unlocks Premium in the browser only. Exit code 1 on any failure. Run one width per process. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
let chromium;
try { ({ chromium } = createRequire(join(ROOT, 'package.json'))('playwright')); }
catch (e) { ({ chromium } = createRequire('/opt/npm-tools/package.json')('playwright')); }
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const p = join(ROOT, normalize(decodeURIComponent(req.url.split('?')[0])));
  if (!p.startsWith(ROOT) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const args = process.argv.slice(2), si = args.indexOf('--shots'), SHOTS = si >= 0 ? args[si + 1] : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const WIDTHS = (args[0] && !args[0].startsWith('--') ? args[0] : '360,390,430,600,768,820,1024,1280,1440,1920').split(',').map(Number);
const THEMES = args.includes('--dark-only') ? ['dark'] : args.includes('--light-only') ? ['light'] : ['light', 'dark'];
const PREMIUM = readFileSync(join(ROOT, 'assets/premium.js'), 'utf8').replace('function has(course) {', 'function has(course) { return true;');
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
async function open(o) {
  const ctx = await b.newContext({ viewport: { width: o.w, height: o.h }, serviceWorkers: 'block', deviceScaleFactor: 1, reducedMotion: o.motion ? 'no-preference' : 'reduce' });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.route(/supabase|umami|api\.levlprep|polar/, r => r.abort());
  await page.route(/assets\/premium\.js/, r => r.fulfill({ body: PREMIUM, contentType: 'application/javascript' }));
  await page.addInitScript(a => { try { localStorage.setItem('nremt_theme', a.theme); if (!a.cue) localStorage.setItem('tk2c:ochem-rp-reagent', '1'); } catch (e) {} }, { theme: o.theme, cue: !!o.cue });
  await page.goto(BASE + '/ochem/tools/reaction-predictor.html' + (o.q || ''), { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.waitForFunction(() => window.OchemReactionPredictor && window.OchemReactionPredictor.view && window.OchemReactionPredictor.view.settled());
  return { page, errs, ctx };
}
let checks = 0, states = 0; const fails = [];
const probe = () => {
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  // seen: on the page, not hidden, and neither it nor a group around it faded out
  const vis = e => { if (!e || !e.getClientRects().length || e.closest('[hidden]')) return false;
    for (let x = e; x && x !== document.body; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false; }
    return true; };
  const scene = document.querySelector('.rp2-scene'), out = [], info = {};
  if (!scene || !vis(scene)) return { out, info: { noScene: true } };
  const S = R(scene);
  const inS = (x, name, tol = 0.6) => { if (x.l < S.l - tol || x.r > S.r + tol || x.t < S.t - tol || x.b > S.b + tol) out.push('clipped: ' + name); };
  const hit = (a, c, g = 0) => !(a.r + g <= c.l || c.r + g <= a.l || a.b + g <= c.t || c.b + g <= a.t);
  const q = s => [...document.querySelectorAll(s)].filter(vis);
  const balls = q('.rp2-at .rs2-ball, .rp2-at .rs2-ball').map(R);
  balls.forEach(x => inS(x, 'a ball'));
  q('.rp2-lp .rs2-e, .rp2-ch .rs2-badge circle, .rp2-card .rs2-thumb').forEach(e => inS(R(e), e.getAttribute('class')));
  // no two balls on each other (1 px of touching allowed)
  const C = balls.map(c => ({ x: (c.l + c.r) / 2, y: (c.t + c.b) / 2, r: c.w / 2 }));
  for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) if (Math.hypot(C[i].x - C[j].x, C[i].y - C[j].y) < C[i].r + C[j].r - 1.5) out.push('two balls overlap');
  // a badge or lone pair on another atom's ball
  q('.rp2-ch .rs2-badge circle, .rp2-lp .rs2-e').forEach(e => { const r = R(e), ex = (r.l + r.r) / 2, ey = (r.t + r.b) / 2;
    const ds = C.map(c => Math.hypot(ex - c.x, ey - c.y) - c.r).sort((a, c) => a - c);
    if (ds.length > 1 && ds[1] < r.w / 2 - 1) out.push('a ' + (e.closest('.rs2-badge') ? 'badge' : 'lone pair') + ' on another atom'); });
  // every name is drawn (review round 1: names with no room were silently hidden)
  if (+getComputedStyle(document.querySelector('.rs2-labs')).opacity > 0.05)
    [...document.querySelectorAll('.rs2-labs .rs2-lab')].forEach(e => { const r = e.getBoundingClientRect(); if (!r.width || !r.height || getComputedStyle(e).display === 'none') out.push('name "' + e.textContent + '" not drawn'); });
  // letters inside a tray card never overlap (review round 1: the cyclohexyl ether)
  q('.rp2-card').forEach(g => { const ts = [...g.querySelectorAll('.rs2-fal')].map(t => ({ t: t.textContent, r: R(t) }));
    for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) if (hit(ts[i].r, ts[j].r, -0.5)) out.push('card letters overlap: ' + ts[i].t + ' / ' + ts[j].t); });
  // names
  const labs = q('.rs2-lab').map(e => ({ t: e.textContent, r: R(e) }));
  labs.forEach(x => inS(x.r, 'name "' + x.t + '"'));
  for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) if (hit(labs[i].r, labs[j].r, 4)) out.push('names too close: "' + labs[i].t + '" and "' + labs[j].t + '"');
  // balls, charge badges and lone pair dots are all solid to a name
  const solid = q('.rp2-at .rs2-ball, .rp2-ch .rs2-badge circle, .rp2-lp .rs2-e').map(R);
  const ctrls = q('.rp2-bar select, .rp2-bar button, .tk2-cue').map(e => ({ n: e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : ''), r: R(e) }));
  labs.forEach(x => { const sc = solid.find(c => hit(x.r, c, 3.5)); if (sc) out.push('name "' + x.t + '" on a ball or badge (' + [x.r.l, x.r.t, x.r.r, x.r.b, sc.l, sc.t, sc.r, sc.b].map(Math.round).join(' ') + ')'); ctrls.forEach(c => { if (hit(x.r, c.r, 4)) out.push('name "' + x.t + '" on ' + c.n); }); });
  ctrls.forEach(c => { if (balls.some(x => hit(c.r, x, 2))) out.push('a ball under ' + c.n); });
  // the molecule is the largest thing in the picture
  if (balls.length) {
    const mb = { l: Math.min(...balls.map(x => x.l)), r: Math.max(...balls.map(x => x.r)), t: Math.min(...balls.map(x => x.t)), b: Math.max(...balls.map(x => x.b)) };
    const area = (mb.r - mb.l) * (mb.b - mb.t); info.mol = Math.round(area);
    q('.rp2-card .rs2-thumb').forEach(e => { const r = R(e); if (r.w * r.h >= area) out.push('a tray card is bigger than the molecule'); });
  }
  // share bars in proportion
  q('.rp2-card').forEach(g => { const t = g.querySelector('.rp2-ctag'), f = g.querySelector('.rp2-sfill'), tr = g.querySelector('.rp2-sbar'); if (!t || !f || !tr) return;
    const m = /≈(\d+)%/.exec(t.textContent); if (!m) return; const want = +m[1] / 100, got = +f.getAttribute('width') / +tr.getAttribute('width');
    if (Math.abs(want - got) > 0.02) out.push('share bar ' + got.toFixed(2) + ' for ' + t.textContent); });
  // text size, everywhere in the tool
  const root = document.querySelector('.ls, .ls-root, .tk2') || document.body;
  [...root.querySelectorAll('text, span, p, li, button, label, select, b, a, th, td, summary, h3')].filter(vis).forEach(e => {
    if (!e.textContent.trim() || [...e.childNodes].every(n => n.nodeType !== 3 || !n.textContent.trim())) return;
    const fs = parseFloat(getComputedStyle(e).fontSize), r = e.getBoundingClientRect();
    if (fs < 10.95 && r.width > 0) out.push('text under 11 px (' + fs + '): "' + e.textContent.trim().slice(0, 24) + '"'); });
  // a picker shows its whole name (never cut inside a word)
  const cv = document.createElement('canvas').getContext('2d');
  q('.rp2-bar select').forEach(e => { const cs = getComputedStyle(e); cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    const t = e.options[e.selectedIndex] ? e.options[e.selectedIndex].text : ''; if (cv.measureText(t).width > e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) + 1) out.push('picker text cut: "' + t + '"'); });
  // the cause line
  const cz = [...document.querySelectorAll('.rp2 .tk2-cause')].filter(vis)[0];
  if (cz) { const pills = [...cz.querySelectorAll('.tk2-cz')].filter(vis).map(R); const rows = new Set(pills.map(p => Math.round(p.t / 8))); info.rows = rows.size; info.causeH = Math.round(R(cz).h); }
  info.hscroll = document.documentElement.scrollWidth > window.innerWidth + 1;
  if (info.hscroll) out.push('sideways scroll');
  info.waiting = document.querySelector('.rs2-labs').classList.contains('is-wait');
  return { out, info };
};
async function check(page, errs, tag, opts = {}) {
  await page.waitForTimeout(opts.wait == null ? 120 : opts.wait);
  const r = await page.evaluate(probe);
  states++; checks += 12;
  r.out.forEach(x => fails.push(tag + ': ' + x));
  if (errs.length) { fails.push(tag + ': console: ' + errs.join(' | ')); errs.length = 0; }
  return r.info;
}
const PLAYS = [
  ['mebr', 'oh'], ['mebr', 'h2o'], ['mebr', 'otbu'], ['prbr', 'oet'], ['prbr', 'otbu'], ['prbr', 'cn'], ['prbr', 'h2o'], ['neopentyl', 'oet'],
  ['bubr2', 'oet'], ['bubr2', 'otbu'], ['bubr2', 'n3'], ['bubr2', 'nh3'], ['bubr2', 'etoh'], ['bubr2', 'etoh', 1], ['cyhexbr', 'oet'], ['cyhexbr', 'sh'],
  ['cyhexbr', 'h2o', 1], ['tbubr', 'oet'], ['tbubr', 'h2o'], ['tbubr', 'h2o', 1], ['tbubr', 'i', 1], ['mebubr', 'oet'], ['mebubr', 'otbu'], ['mebubr', 'dbu'],
  ['mebubr', 'i', 1], ['mebubr', 'etoh'], ['bnbr', 'cn'], ['bnbr', 'h2o'], ['bnbr', 'dbu'], ['bnbr', 'otbu'], ['bubr2', 'oet', 0, 'aprotic'], ['tbubr', 'h2o', 0, 'aprotic']
];
// on a phone's first screen the whole result is in view after a run: the tray's cards and the cause line (recheck 1)
const FOLD = { 360: 740, 390: 844, 430: 932 };
for (const w of WIDTHS) {
  if (FOLD[w]) for (const theme of THEMES) {
    const o = await open({ w, h: FOLD[w], theme });
    for (const [sub, rgt] of [['bubr2', 'oet'], ['tbubr', 'h2o'], ['neopentyl', 'oet']]) {
      await o.page.selectOption('#rpSubSel', sub); await o.page.selectOption('#rpRgtSel', rgt); await o.page.waitForTimeout(150);
      const r = await o.page.evaluate(() => { const ih = innerHeight, out = [];
        [...document.querySelectorAll('.rp2-card .rs2-thumb'), document.querySelector('.rp2 .tk2-cause')].forEach(e => { const q = e.getBoundingClientRect(); if (q.top < 0 || q.bottom > ih + 0.5) out.push((e.closest('.rp2-card') ? 'a tray card' : 'the cause line') + ' ends at ' + Math.round(q.bottom) + ' (fold ' + ih + ')'); });
        if (!document.querySelector('.rp2-card')) out.push('no tray cards'); return out; });
      r.forEach(x => fails.push(w + 'x' + FOLD[w] + ' ' + theme + ' ' + sub + '+' + rgt + ': ' + x)); states++; checks += 3;
    }
    if (o.errs.length) fails.push(w + ' fold: ' + o.errs.join(' | '));
    await o.ctx.close();
  }
  const h = w < 641 ? 844 : w < 1100 ? 1024 : 900;
  for (const theme of THEMES) {
    const T = w + ' ' + theme;
    let { page, errs, ctx } = await open({ w, h, theme });
    const causeHs = new Set(); let maxRows = 0;
    for (const [sub, rgt, heat, solv] of PLAYS) {
      await page.selectOption('#rpSubSel', sub); await page.selectOption('#rpRgtSel', rgt);
      const hot = await page.evaluate(() => document.querySelector('.rp2-heat').getAttribute('aria-pressed') === 'true');
      if (!!heat !== hot) await page.click('.rp2-heat');
      const ap = await page.evaluate(() => document.querySelector('.rp2-seg [data-solv="aprotic"]').classList.contains('on'));
      if ((solv === 'aprotic') !== ap) await page.click('.rp2-seg [data-solv="' + (solv || 'protic') + '"]');
      const info = await check(page, errs, T + ' ' + sub + '+' + rgt + (heat ? ' heat' : '') + (solv ? ' ' + solv : ''));
      if (info.causeH) causeHs.add(info.causeH); if (info.rows) maxRows = Math.max(maxRows, info.rows);
      if (SHOTS && theme === 'light' && ['bubr2', 'tbubr', 'bnbr', 'neopentyl'].includes(sub) && !solv) await page.locator('.rp2').screenshot({ path: join(SHOTS, `${w}-${sub}-${rgt}${heat ? '-heat' : ''}.png`) });
    }
    if (w < 641) { if (maxRows > 2) fails.push(T + ': the cause line takes ' + maxRows + ' rows'); if (causeHs.size > 1) fails.push(T + ': the cause line changes height ' + [...causeHs].join(', ')); }
    // a tray card replays its path (the minor one too)
    await page.selectOption('#rpSubSel', 'bubr2'); await page.selectOption('#rpRgtSel', 'oet');
    if (await page.evaluate(() => document.querySelector('.rp2-heat').getAttribute('aria-pressed') === 'true')) await page.click('.rp2-heat');
    await page.locator('.rp2-cb').nth(1).click();
    const t1 = await page.evaluate(() => [...document.querySelectorAll('.rs2-lab.is-head')].map(e => e.textContent).join());
    if (!/SN2/.test(t1)) fails.push(T + ': the minor card did not play SN2 (' + t1 + ')');
    await check(page, errs, T + ' minor card');
    // "?"
    await page.click('.ls-help, [aria-label="Help"], button[aria-label*="?"], .ls-q').catch(() => {});
    await check(page, errs, T + ' "?" open');
    await page.keyboard.press('Escape');
    // Test yourself: Call the path, before and after a call; Check yourself
    await page.locator('button', { hasText: 'Test yourself' }).first().click();
    await check(page, errs, T + ' call: before');
    await page.locator('.rp2-call').first().click();
    await check(page, errs, T + ' call: after');
    await page.click('#rpNext');
    await check(page, errs, T + ' call: next flask');
    await ctx.close();
    // a first visit: the cue, whole, on nothing
    ({ page, errs, ctx } = await open({ w, h, theme, cue: true }));
    const cueOk = await page.evaluate(() => { const c = document.querySelector('.tk2-cue'); if (!c) return 'no cue'; const r = c.getBoundingClientRect(), s = document.querySelector('.rp2-scene').getBoundingClientRect();
      if (r.left < s.left || r.right > s.right || r.top < s.top) return 'cue clipped (' + [r.left, r.top, r.right, r.bottom, s.left, s.top, s.right].map(Math.round).join(' ') + ')';
      const hit = [...document.querySelectorAll('.rp2-at .rs2-ball, .rs2-lab, .rp2-bar select, .rp2-bar button')].some(e => { const q = e.getBoundingClientRect(); return q.width && !(r.right <= q.left || q.right <= r.left || r.bottom <= q.top || q.bottom <= r.top); });
      return hit ? 'cue covers something' : ''; });
    if (cueOk) fails.push(T + ': ' + cueOk);
    await check(page, errs, T + ' first visit');
    await ctx.close();
    // motion: halfway through a run the names wait; leaving for Test yourself mid run starts clean; back is settled
    ({ page, errs, ctx } = await open({ w, h, theme, motion: true }));
    await page.selectOption('#rpRgtSel', 'otbu');
    await page.waitForTimeout(2600);
    const mid = await page.evaluate(() => ({ wait: document.querySelector('.rs2-labs').classList.contains('is-wait') || !document.querySelector('.rs2-labs').children.length, tray: document.querySelectorAll('.rp2-card').length, settled: window.OchemReactionPredictor.view.settled() }));
    if (mid.settled) fails.push(T + ': the run had already ended at 2.6 s');
    if (!mid.wait) fails.push(T + ': names shown while the molecule moves');
    if (mid.tray) fails.push(T + ': the tray shows products before they form');
    await page.locator('button', { hasText: 'Test yourself' }).first().click();
    const clean = await page.evaluate(() => window.OchemReactionPredictor.view.settled() && !document.querySelector('.rp2-ar').children.length);
    if (!clean) fails.push(T + ': a run kept going in Test yourself');
    await check(page, errs, T + ' left mid run');
    await page.locator('button', { hasText: 'Explore' }).first().click();
    const back = await page.evaluate(() => window.OchemReactionPredictor.view.settled() && document.querySelectorAll('.rp2-card').length > 0);
    if (!back) fails.push(T + ': Explore did not come back settled');
    await check(page, errs, T + ' back in Explore', { wait: 900 });
    await ctx.close();
  }
  console.log(w + ': ' + states + ' states, ' + checks + ' checks, ' + fails.length + ' failures so far');
}
await b.close(); server.close();
if (fails.length) { console.log(fails.slice(0, 60).join('\n')); console.log(fails.length + ' failures'); process.exit(1); }
console.log('OK: ' + states + ' states, ' + checks + ' checks');
