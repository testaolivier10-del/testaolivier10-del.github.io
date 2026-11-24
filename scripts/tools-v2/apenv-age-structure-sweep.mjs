/* Tools v2 sweep for AP® Environmental Science Age structure (docs/tools-v2-apenv-age-structure-brief.md), after the
   pattern of chem-buffers-sweep.mjs. Three runs in one file:

     node scripts/tools-v2/apenv-age-structure-sweep.mjs [widths] [--shots dir]   layout: landmark states, light and dark
     node scripts/tools-v2/apenv-age-structure-sweep.mjs 390 --frames            every animation frame of real drags
     node scripts/tools-v2/apenv-age-structure-sweep.mjs 390 --perf [--rate 4]   frame times, the flagship in the same run

   Run one width per process. Each width opens at a screen height it really comes with (844 up to 430, 960 at 600,
   1024 at 768 and 820, 768 at 1024, 800 at 1280, 900 at 1440, 1080 at 1920; --height H overrides it).

   LAYOUT, at each state (the opening state, replacement, both ends of both controls, the four stage presets, a few in
   between; the first visit; Test yourself), light and dark (the page is checked to be really dark):
     - nothing on the picture is clipped by the stage (texts, the knobs, the knob's tag, the cue);
     - every text on the picture sits at least 4 px clear of every other and of the knob's tag, and none renders under
       11 px; the tag and the knobs never cover a text;
     - the pyramid (the thing acted on) is the largest object on the picture;
     - every row's drawn width is the model's share at the one fixed scale (A.stable at the rate and life expectancy);
     - the words agree with what is drawn: the growth pill, the replacement label, the cause line's rate, shape word
       and growth (or the takeaway), the children drawn (whole ones and the part) and the mother at the rate;
     - on a phone the cause line is at most two rows and keeps one height; no sideways scroll; no console errors;
     - the screen fit: with the scene at the top of a phone screen (or as the page opens elsewhere) the mother's knob,
       the life knob, the whole pyramid and the cause line are on screen, with no scrolling inside the card;
     - on a first visit the cue is whole and covers no text, knob or tag; Test yourself shows the drill, not the stage.
   FRAMES: real mouse and touch drags of the mother (slow, fast, reversed), keyboard jumps (Home, End, Page keys), the
   life knob dragged both ways, sampled on every animation frame: every row is drawn at the model's value for the rate
   it holds that frame (between the rates the run passed through), the rows above never lead the base, the pill, the
   cause line, the replacement label and aria-valuetext read what is drawn; at the end nothing moves and the rows equal
   the target; leaving for Test yourself mid change stops the loop and comes back clean; reduced motion shows the result
   at once with a cross fade.
   PERF: the mother dragged end to end and back (CPU throttled, default x4), then the flagship's fertilizer knob in the
   same run. Target: median about 16 ms, p95 at or under 50 ms.

   Needs Playwright and a Chromium. It serves the repo on a free port and blocks service workers and other hosts. The
   tool is Premium: it is unlocked for the run only, by routing assets/premium.js (never committed). Exit 1 on failure. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadavg, cpus } from 'node:os';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
let chromium;
try { ({ chromium } = createRequire(join(ROOT, 'package.json'))('playwright')); }
catch (e) { try { ({ chromium } = createRequire('/opt/npm-tools/node_modules/')('playwright')); } catch (e2) { ({ chromium } = createRequire('/home/claude/testaolivier10-del.github.io/package.json')('playwright')); } }
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const p = join(ROOT, normalize(decodeURIComponent(req.url.split('?')[0])));
  if (!p.startsWith(ROOT) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const args = process.argv.slice(2), si = args.indexOf('--shots'), SHOTS = si >= 0 ? args[si + 1] : null;
const FRAMES = args.includes('--frames'), PERF = args.includes('--perf'), ri = args.indexOf('--rate'), RATE = ri >= 0 ? +args[ri + 1] : 4;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const WIDTHS = (args[0] && !args[0].startsWith('--') ? args[0] : '360,390,430,600,768,820,1024,1280,1440,1920').split(',').map(Number);
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
const PAGE = '/environmental-science/tools/age-structure.html';
const IGNORE = /ERR_FAILED|ERR_BLOCKED|Service Worker|net::/;
async function unlock(page) {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.route('**/assets/premium.js', async r => { const res = await r.fetch(); const body = (await res.text()).replace('function has(course) {', 'function has(course) { return true;'); await r.fulfill({ response: res, body }); });
}
async function open(o) {
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, serviceWorkers: 'block', deviceScaleFactor: 1, reducedMotion: o.reduced ? 'reduce' : 'no-preference', hasTouch: !!o.touch, isMobile: !!o.touch });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await unlock(page);
  await page.addInitScript(([cue, theme]) => { try { localStorage.setItem('nremt_theme', theme); if (!cue) { localStorage.setItem('tk2c:apenv-age-tfr', '1'); localStorage.setItem('tk2h:apenv-age-tfr', '1'); localStorage.setItem('tk2t:apenv-age', '1'); } } catch (e) {} }, [!!o.cue, o.theme || 'light']);
  await page.goto(BASE + PAGE + (o.hash || ''), { waitUntil: 'load' });
  await page.addScriptTag({ content: agreeSrc });
  if (!o.hash) { await until(page, () => !!(window.__age && window.__age.G())); await page.waitForTimeout(400); }
  else await page.waitForTimeout(1400);
  if (o.theme === 'dark') { const dk = await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark' && getComputedStyle(document.body).backgroundColor !== 'rgb(255, 255, 255)'); if (!dk) errs.push('the page is not dark in the dark run'); }
  return { page, errs, ctx };
}
async function until(page, fn, ms = 20000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn).catch(() => false)) return; await page.waitForTimeout(50); } throw new Error('timed out waiting'); }
const settle = async page => { await until(page, () => !window.__age.busy()); await page.waitForTimeout(150); };

/* Runs in the page: what every word and width on screen should be, from what is drawn (layout and frames runs). */
const agreeSrc = `window.__agree = function(rest){
  const X = window.__age, A = window.ApEnvMath.ageStructure, G = X.G(), S = X.S(), d = X.drawn(), out = [];
  const n1 = v => (Math.round(v * 10) / 10).toFixed(1);
  // every row at the model's value for the rate it holds (and at rest, the target)
  const w = X.rows();
  for (let i = 0; i < 17; i++) {
    const m = A.stable(S.T[i], S.E), wm = G.sx(m.male[i]), wf = G.sx(m.female[i]);
    if (Math.abs(w[2 * i] - wm) > 0.11 || Math.abs(w[2 * i + 1] - wf) > 0.11) out.push('row ' + i + ' drawn ' + w[2 * i].toFixed(1) + '/' + w[2 * i + 1].toFixed(1) + ', model ' + wm.toFixed(1) + '/' + wf.toFixed(1));
  }
  if (rest) { const t = A.stable(S.t, S.e); for (let i = 0; i < 17; i++) if (Math.abs(w[2 * i] - G.sx(t.male[i])) > 0.11 || Math.abs(w[2 * i + 1] - G.sx(t.female[i])) > 0.11) { out.push('at rest row ' + i + ' is not the target'); break; } }
  const b = A.stable(S.T[0], S.E), gw = X.gw(b.r);
  const pill = document.querySelector('.agv-pill text').textContent;
  if (pill !== gw.pill) out.push('pill "' + pill + '", drawn "' + gw.pill + '"');
  const rt = document.querySelector('.agv-rtext').textContent;
  if (rt !== 'replacement ' + n1(b.repl)) out.push('replacement label "' + rt + '", drawn ' + n1(b.repl));
  const rx = +document.querySelector('.agv-rmark').getAttribute('d').split(' ')[0].slice(1);
  if (Math.abs(rx - G.x(b.repl)) > 0.11) out.push('replacement mark not at ' + n1(b.repl));
  const sh = A.shape(d);
  const cz = document.querySelector('.agv .tk2-cause'), take = cz.classList.contains('is-take'), ct = cz.innerText.replace(/\\s+/g, ' ');
  if (take) { if (X.busy()) out.push('the takeaway shows while the pyramid moves'); if (!/replacement/.test(ct)) out.push('odd takeaway: ' + ct); }
  else {
    if (!ct.includes(n1(S.T[0]) + ' children per woman')) out.push('cause line rate: ' + ct + ' vs ' + n1(S.T[0]));
    if (!ct.includes(sh)) out.push('cause line shape: ' + ct + ' vs ' + sh);
    if (!ct.includes(gw.part)) out.push('cause line growth: ' + ct + ' vs ' + gw.part);
    if (gw.two && !ct.includes(gw.two)) out.push('cause line doubling: ' + ct + ' vs ' + gw.two);
  }
  // the mother at the rate; whole children and a part of one up to her
  const mt = document.querySelector('.agv-mom').getAttribute('transform'), mx = +mt.match(/translate\\(([-\\d.]+)/)[1];
  if (Math.abs(mx - G.momX(S.t)) > 0.11) out.push('the mother is not at ' + S.t);
  const kids = document.querySelectorAll('.agv-kids g[clip-path] > g').length;
  if (kids !== Math.ceil(S.t - 1e-9)) out.push(kids + ' children drawn for ' + S.t);
  const cw = +document.querySelector('.agv-kclip').getAttribute('width');
  if (Math.abs(cw - (G.x(S.t) - G.x(0) + 4)) > 0.11) out.push('the children are cut at the wrong place');
  const life = document.querySelector('.agv-life').textContent;
  if (life !== 'Life expectancy ' + Math.round(S.E) + ' years') out.push('life label "' + life + '" vs drawn ' + S.E);
  const vt = document.querySelector('.agv .tk2-handle:not(.is-quiet) .tk2-knob').getAttribute('aria-valuetext');
  if (vt !== n1(S.t) + ' children per woman') out.push('aria-valuetext "' + vt + '" vs ' + S.t);
  return { out, sh, gw };
};`;
const probe = new Function(`
  const out = [], X = window.__age, G = X.G();
  const R = e => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]');
  const scene = document.querySelector('.agv-scene'), S = R(scene), k = S.w / G.W;
  const inS = (x, n, tol = 0.6) => { if (x.l < S.l - tol || x.r > S.r + tol || x.t < S.t - tol || x.b > S.b + tol) out.push('clipped: ' + n); };
  const gap = (a, c, g) => !(a.r + g <= c.l || c.r + g <= a.l || a.b + g <= c.t || c.b + g <= a.t);
  const texts = [...scene.querySelectorAll('svg text')].filter(vis).filter(t => t.textContent.trim()).map(t => ({ n: 'text "' + t.textContent.trim() + '"', r: R(t) }));
  texts.forEach(x => inS(x.r, x.n));
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) if (gap(texts[i].r, texts[j].r, 4)) out.push('closer than 4 px: ' + texts[i].n + ' and ' + texts[j].n);
  [...scene.querySelectorAll('svg text')].filter(vis).forEach(t => { const fs = parseFloat(getComputedStyle(t).fontSize) * k; if (fs < 10.95) out.push('text under 11 px: "' + t.textContent + '" ' + fs.toFixed(1)); });
  // the knobs (their visible dots) and the tag: inside, and clear of every text
  const tag = [...scene.querySelectorAll('.tk2-tag')].filter(vis).map(e => ['tag "' + e.textContent + '"', R(e)]);
  const dots = [...scene.querySelectorAll('.tk2-dot')].filter(vis).map((e, i) => ['knob ' + i, R(e)]);
  tag.concat(dots).forEach(([n, r]) => { inS(r, n); texts.forEach(x => { if (gap(r, x.r, n.startsWith('tag') ? 4 : 0)) out.push(n + ' covers ' + x.n); }); });
  if (parseFloat(getComputedStyle(scene.querySelector('.tk2-tag')).fontSize) < 11) out.push('the tag is under 11 px');
  // the pyramid is the largest thing on the picture
  const A2 = x => x.w * x.h, pyr = R(scene.querySelector('.agv-rows'));
  const others = [['mother', R(scene.querySelector('.agv-mom'))], ['children', R(scene.querySelector('.agv-kids g[clip-path]'))], ['growth pill', R(scene.querySelector('.agv-pill'))]].concat(texts.map(x => [x.n, x.r]), tag);
  others.forEach(([n, r]) => { if (A2(r) >= A2(pyr)) out.push(n + ' is as large as the pyramid'); });
  inS(pyr, 'the pyramid'); inS(R(scene.querySelector('.agv-mom')), 'the mother');
  const ag = window.__agree(true); ag.out.forEach(m => out.push(m));
  const cause = document.querySelector('.agv .tk2-cause');
  const rows = new Set([...document.querySelectorAll('.agv .tk2-cz')].map(e => Math.round(R(e).t))).size;
  if (innerWidth <= 640 && rows > 2) out.push('cause line is ' + rows + ' rows: ' + cause.innerText);
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  return { out, causeH: Math.round(R(cause).h), sh: ag.sh };
`);
const fitProbe = () => {
  const out = [], R = e => e.getBoundingClientRect();
  const scene = document.querySelector('.agv-scene');
  if (innerWidth <= 640) window.scrollTo(0, R(scene).top + scrollY);
  const body = scene.closest('.ls-stage-body') || scene.closest('.ls-stage');
  if (innerWidth > 640 && body && body.scrollHeight - body.clientHeight > 2) out.push(`the card scrolls inside (${body.scrollHeight} in ${body.clientHeight})`);
  const box = innerWidth > 640 && body ? R(body) : { top: 0, bottom: innerHeight };
  const knobs = [...document.querySelectorAll('.agv .tk2-handle .tk2-dot')];
  const need = { 'mother knob': knobs[0], 'life knob': knobs[1], 'pyramid': document.querySelector('.agv-rows'), 'mother': document.querySelector('.agv-mom'), 'cause line': document.querySelector('.agv .tk2-cause') };
  Object.keys(need).forEach(k => { const e = need[k]; if (!e) return out.push('no ' + k); const r = R(e); if (r.top < Math.max(0, box.top) - 1 || r.bottom > Math.min(innerHeight, box.bottom) + 1) out.push(`${k} off screen (${Math.round(r.top)} to ${Math.round(r.bottom)} of ${innerHeight})`); });
  window.scrollTo(0, 0);
  return out;
};
let checks = 0, states = 0; const fails = [];
const W4 = w => String(w).padStart(4, '0');
const hi0 = args.indexOf('--height'), HFIX = hi0 >= 0 ? +args[hi0 + 1] : 0;
function HEIGHT(w) { return HFIX || (w <= 430 ? 844 : w <= 600 ? 960 : w <= 820 ? 1024 : w <= 1024 ? 768 : w <= 1280 ? 800 : w <= 1440 ? 900 : 1080); }
// [children per woman, life expectancy, label]
const STATES = [[5, 60, 'start'], [2.1, 80, 'replacement'], [1, 85, 'low-long'], [7, 85, 'high-long'], [7, 30, 'high-short'], [1, 30, 'low-short'],
  [6, 32, 'stage1'], [5.2, 55, 'stage2'], [2.4, 72, 'stage3'], [1.6, 81, 'stage4'], [3, 45, 'mid'], [1.3, 84, 'japan-like'], [4.4, 30, 'repl-short']];
async function goState(page, st) { await page.evaluate(([t, e]) => window.__age.set(t, e), [st[0], st[1]]); await settle(page); }
if (!FRAMES && !PERF) for (const w of WIDTHS) {
  const h = HEIGHT(w);
  for (const theme of ['light', 'dark']) {
    {
      const c = await open({ w, h, cue: true, theme });
      const bad = await c.page.evaluate(() => { const R = e => e.getBoundingClientRect(), q = [...document.querySelectorAll('.tk2-cue')].filter(e => e.getClientRects().length)[0]; if (!q) return ['no cue shown'];
        const r = R(q), S = R(document.querySelector('.agv-scene')), out = [];
        if (r.left < S.left || r.right > S.right || r.top < S.top || r.bottom > S.bottom) out.push('the cue is clipped by the stage');
        if (parseFloat(getComputedStyle(q).fontSize) < 11) out.push('the cue text is under 11 px');
        [...document.querySelectorAll('.agv-scene svg text, .agv-scene .tk2-dot, .agv-scene .tk2-tag, .agv-mom')].filter(e => e.getClientRects().length && !e.closest('[hidden]')).forEach(e => { const x = R(e); if (!(r.right <= x.left || x.right <= r.left || r.bottom <= x.top || x.bottom <= r.top)) out.push('the cue covers ' + (e.textContent || e.getAttribute('class')).toString().trim().slice(0, 24)); });
        return out; });
      states++; checks += 3; bad.forEach(m => fails.push(`${w} ${theme} first visit: ${m}`));
      if (SHOTS) await c.page.locator('.agv').screenshot({ path: join(SHOTS, `${W4(w)}-${theme}-0-first-visit.png`) });
      c.errs.forEach(e => fails.push(`${w} ${theme} first visit: console ${e}`));
      await c.ctx.close();
    }
    const c = await open({ w, h, theme });
    const fit = await c.page.evaluate(fitProbe); states++; checks += 6; fit.forEach(m => fails.push(`${w}x${h} ${theme} screen fit: ${m}`));
    const causeH = [], shapes = new Set(), sizes = [];
    for (const st of STATES) {
      await goState(c.page, st);
      const res = await c.page.evaluate(probe);
      states++; checks += 40; res.out.forEach(m => fails.push(`${w} ${theme} ${st.join(' ')}: ${m}`));
      causeH.push(res.causeH); shapes.add(res.sh);
      sizes.push(await c.page.evaluate(() => { const g = window.__age.G(); return [g.W, g.H, g.pitch.toFixed(2), g.ageStep].join('/'); }));
      if (SHOTS && (theme === 'light' || ['start', 'low-long', 'high-short'].includes(st[2]))) await c.page.locator('.agv').screenshot({ path: join(SHOTS, `${W4(w)}-${theme}-${st[2]}.png`) });
    }
    checks++; if (new Set(sizes).size > 1) fails.push(`${w} ${theme}: the scene changes size between states (${[...new Set(sizes)].join(', ')})`);
    checks++; if (shapes.size < 3) fails.push(`${w} ${theme}: the states show only ${[...shapes].join(', ')}`);
    if (w <= 640 && new Set(causeH).size > 1) fails.push(`${w} ${theme}: the cause line changes height on a phone (${[...new Set(causeH)].join(', ')})`);
    // the takeaway: a drag across replacement, released, settles into the takeaway sentence
    await goState(c.page, [5, 60]);
    const kb = await c.page.locator('.agv .tk2-handle:not(.is-quiet) .tk2-knob').boundingBox(), G = await c.page.evaluate(() => { const g = window.__age.G(), k = document.querySelector('.agv-svg').getBoundingClientRect().width / g.W; return { k, x1: g.x(1.5) }; });
    const sr = await c.page.locator('.agv-svg').boundingBox();
    await c.page.mouse.move(kb.x + kb.width / 2, kb.y + kb.height / 2); await c.page.mouse.down();
    for (let i = 1; i <= 8; i++) await c.page.mouse.move(kb.x + kb.width / 2 + (sr.x + G.x1 * G.k - kb.x - kb.width / 2) * i / 8, kb.y + kb.height / 2);
    await c.page.mouse.up(); await settle(c.page);
    const tk = await c.page.evaluate(() => ({ take: document.querySelector('.agv .tk2-cause').classList.contains('is-take'), t: window.__age.S().t }));
    states++; checks += 2;
    if (Math.abs(tk.t - 1.5) > 0.11) fails.push(`${w} ${theme}: a drag of the knob to 1.5 left the rate at ${tk.t}`);
    if (!tk.take) fails.push(`${w} ${theme}: no takeaway after a drag across replacement`);
    const ta = await c.page.evaluate(probe); ta.out.forEach(m => fails.push(`${w} ${theme} takeaway: ${m}`));
    checks++; if (w <= 640 && ta.causeH > Math.max(...causeH) + 1) fails.push(`${w} ${theme}: the takeaway is taller than the cause line (${ta.causeH} against ${Math.max(...causeH)})`);
    if (SHOTS && theme === 'light') await c.page.locator('.agv').screenshot({ path: join(SHOTS, `${W4(w)}-${theme}-takeaway.png`) });
    // grabbing the mother herself drags the rate (the cue says "Drag the mother")
    const mb = await c.page.locator('.agv-mom').boundingBox();
    await c.page.mouse.move(mb.x + mb.width / 2, mb.y + mb.height * 0.4); await c.page.mouse.down();
    await c.page.mouse.move(mb.x + mb.width / 2 + 80, mb.y + mb.height * 0.4, { steps: 6 }); await c.page.mouse.up(); await settle(c.page);
    const t2 = await c.page.evaluate(() => window.__age.S().t); states++; checks++;
    if (!(t2 > tk.t + 0.5)) fails.push(`${w} ${theme}: dragging the mother herself did not change the rate (${tk.t} to ${t2})`);
    const fit2 = await c.page.evaluate(fitProbe); checks += 6; fit2.forEach(m => fails.push(`${w}x${h} ${theme} screen fit after a drag: ${m}`));
    if (SHOTS && theme === 'light') await c.page.screenshot({ path: join(SHOTS, `${W4(w)}-${theme}-9-screen.png`) });
    c.errs.forEach(e => fails.push(`${w} ${theme}: console ${e}`));
    await c.ctx.close();
    const q = await open({ w, h, theme, hash: '#quiz' });
    const qb = await q.page.evaluate(() => { const out = []; if (!document.querySelector('.cd-step, .ls-drill input, .cd-problem, form')) out.push('no drill in Test yourself'); const st = document.querySelector('.agv'); if (st && st.getClientRects().length) out.push('the Explore stage shows in Test yourself'); if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll'); return out; });
    states++; checks += 3; qb.forEach(m => fails.push(`${w} ${theme} Test yourself: ${m}`)); q.errs.forEach(e => fails.push(`${w} ${theme} Test yourself: console ${e}`));
    if (SHOTS) await q.page.screenshot({ path: join(SHOTS, `${W4(w)}-${theme}-z-test-yourself.png`) });
    await q.ctx.close();
  }
  console.log(`${w}: done`);
}

/* ---------------------------------------------------------------- FRAMES */
if (FRAMES) for (const w of WIDTHS) {
  const h = HEIGHT(w);
  for (const touch of [false, true]) {
    const c = await open({ w, h, touch });
    await c.page.evaluate(() => {
      window.__fr = { on: false, bad: [], n: 0, lo: 1, hi: 7 };
      const X = window.__age;
      const loop = () => {
        const F = window.__fr; if (!F.on) return;
        F.n++;
        const say = m => { if (F.bad.length < 40) F.bad.push(`frame ${F.n}: ${m}`); };
        window.__agree(false).out.forEach(say);
        const S = X.S();
        // a row only holds rates the run passed through, and no row above leads the base
        S.T.forEach((t, i) => { if (t < F.lo - 1e-6 || t > F.hi + 1e-6) say('row ' + i + ' at rate ' + t.toFixed(3) + ' outside ' + F.lo + ' to ' + F.hi); });
        if (F.order) for (let i = 1; i < 17; i++) { const a = Math.abs(S.T[i] - S.t), b = Math.abs(S.T[i - 1] - S.t); if (a + 1e-6 < b && Math.sign(S.T[i] - S.t) === Math.sign(S.T[i - 1] - S.t)) { say('row ' + i + ' leads the row below it'); break; } }
        requestAnimationFrame(loop);
      };
      window.__frStart = (lo, hi, order) => { Object.assign(window.__fr, { lo, hi, order: !!order, on: true }); requestAnimationFrame(loop); };
    });
    // order: a change in one direction only (the rows above never lead the base); a reversal may leave them closer
    const run = async (label, lo, hi, act, order) => {
      await c.page.evaluate(([a, b, o]) => window.__frStart(a, b, o), [lo, hi, !!order]);
      await act(); await settle(c.page);
      const r = await c.page.evaluate(() => { window.__fr.on = false; const F = window.__fr, out = { n: F.n, bad: F.bad.slice() }; F.bad = []; F.n = 0; return out; });
      const end = await c.page.evaluate(() => window.__agree(true).out); end.forEach(m => r.bad.push('at the end: ' + m));
      states++; checks += r.n * 30 + 1; r.bad.forEach(m => fails.push(`${w}${touch ? ' touch' : ''} frames ${label}: ${m}`));
      console.log(`${w}${touch ? ' touch' : ''} frames ${label}: ${r.n} frames, ${r.bad.length} problems`);
    };
    const geo = async () => c.page.evaluate(() => { const g = window.__age.G(), r = document.querySelector('.agv-svg').getBoundingClientRect(), k = r.width / g.W; return { k, left: r.left, top: r.top, xs: [1, 2, 3, 4, 5, 6, 7].map(v => r.left + g.x(v) * k), y: r.top + g.yT * k, ey: r.top + g.eY * k, ex: [30, 85].map(v => r.left + g.ex(v) * k) }; });
    const g0 = await geo();
    const xAt = v => g0.xs[0] + (g0.xs[6] - g0.xs[0]) * (v - 1) / 6;
    if (!touch) {
      await run('slow drag 5 to 1', 1, 5, async () => { await c.page.mouse.move(xAt(5), g0.y); await c.page.mouse.down(); for (let i = 1; i <= 30; i++) { await c.page.mouse.move(xAt(5 - 4 * i / 30), g0.y); await c.page.waitForTimeout(16); } await c.page.mouse.up(); }, true);
      await run('fast drag 1 to 7', 1, 7, async () => { await c.page.mouse.move(xAt(1), g0.y); await c.page.mouse.down(); await c.page.mouse.move(xAt(7), g0.y, { steps: 3 }); await c.page.mouse.up(); }, true);
      await run('reversal mid change', 1, 7, async () => { await c.page.mouse.move(xAt(7), g0.y); await c.page.mouse.down(); await c.page.mouse.move(xAt(2), g0.y, { steps: 4 }); await c.page.waitForTimeout(120); await c.page.mouse.move(xAt(6), g0.y, { steps: 4 }); await c.page.waitForTimeout(60); await c.page.mouse.move(xAt(3), g0.y, { steps: 3 }); await c.page.mouse.up(); });
      await run('keyboard Home End Page', 1, 7, async () => { await c.page.locator('.agv .tk2-handle:not(.is-quiet) .tk2-knob').focus(); await c.page.keyboard.press('End'); await c.page.waitForTimeout(150); await c.page.keyboard.press('Home'); await c.page.waitForTimeout(90); await c.page.keyboard.press('PageUp'); await c.page.keyboard.press('PageUp'); await c.page.waitForTimeout(40); await c.page.keyboard.press('ArrowRight'); });
      await run('life knob both ways', 1, 7, async () => { await c.page.mouse.move(g0.ex[0] + (g0.ex[1] - g0.ex[0]) * 30 / 55, g0.ey); await c.page.mouse.down(); await c.page.mouse.move(g0.ex[1], g0.ey, { steps: 5 }); await c.page.waitForTimeout(100); await c.page.mouse.move(g0.ex[0], g0.ey, { steps: 5 }); await c.page.mouse.up(); });
      // leaving for Test yourself mid change stops the loop; back in Explore the picture is clean
      await c.page.evaluate(() => window.__age.set(7, null)); await c.page.waitForTimeout(80);
      await c.page.locator('.ls-modes button', { hasText: 'Test yourself' }).first().click(); await c.page.waitForTimeout(300);
      const off = await c.page.evaluate(() => window.__age.busy()); states++; checks++;
      if (off) fails.push(`${w} frames: still animating after leaving for Test yourself`);
      await c.page.locator('.ls-modes button', { hasText: 'Explore' }).first().click(); await c.page.waitForTimeout(600);
      const back = await c.page.evaluate(() => window.__agree(true).out); back.forEach(m => fails.push(`${w} frames back in Explore: ${m}`));
    } else {
      // a real touch drag (CDP touch events) of the mother, at the page as it opens and scrolled to the end
      const cdp = await c.ctx.newCDPSession(c.page);
      const touchDrag = async (a, b, n) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a[0], y: a[1] }] }); for (let i = 1; i <= n; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a[0] + (b[0] - a[0]) * i / n, y: a[1] + (b[1] - a[1]) * i / n }] }); await c.page.waitForTimeout(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
      await run('touch drag 5 to 2', 2, 5, async () => { await touchDrag([xAt(5), g0.y], [xAt(2), g0.y], 14); }, true);
      await c.page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await c.page.waitForTimeout(300);
      const g1 = await geo();
      if (g1.y > 0 && g1.y < h) {
        const before = await c.page.evaluate(() => window.__age.S().t);
        await run('touch drag at the scrolled end', 2, 6, async () => { await touchDrag([g1.xs[0] + (g1.xs[6] - g1.xs[0]) * (before - 1) / 6, g1.y], [g1.xs[5], g1.y], 12); });
        const after = await c.page.evaluate(() => window.__age.S().t); states++; checks++;
        if (!(after > before + 2)) fails.push(`${w} touch: a touch drag at the scrolled end did not move the rate (${before} to ${after})`);
      }
    }
    c.errs.forEach(e => fails.push(`${w} frames: console ${e}`));
    await c.ctx.close();
  }
  // reduced motion: the result at once, with a cross fade
  const rm = await open({ w, h, reduced: true });
  await rm.page.evaluate(() => window.__age.set(1.5, null)); await rm.page.waitForTimeout(40);
  const rr = await rm.page.evaluate(() => ({ busy: window.__age.busy(), fade: document.querySelector('.agv-fade').classList.contains('is-on'), bad: window.__agree(true).out }));
  states++; checks += 3;
  if (rr.busy || !rr.fade) fails.push(`${w} reduced motion: not at once with a cross fade (${JSON.stringify(rr)})`);
  rr.bad.forEach(m => fails.push(`${w} reduced motion: ${m}`));
  await rm.ctx.close();
}

/* ---------------------------------------------------------------- PERF */
if (PERF) {
  console.log(`machine load ${loadavg()[0].toFixed(1)} on ${cpus().length} cores`);
  const probeF = async (page, label, w, act, gate) => {
    await page.evaluate(() => { window.__f = []; let last = performance.now(); window.__on = true; const loop = t => { window.__f.push(t - last); last = t; if (window.__on) requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
    await act(); await page.waitForTimeout(600);
    const r = await page.evaluate(() => { window.__on = false; const f = window.__f.slice(1).sort((a, b) => a - b); if (!f.length) f.push(0); return { n: f.length, med: f[f.length >> 1], p95: f[Math.min(f.length - 1, Math.floor(f.length * 0.95))], max: f[f.length - 1] }; });
    console.log(`${w} px, CPU x${RATE}, ${label}: median ${r.med.toFixed(1)} ms, p95 ${r.p95.toFixed(1)} ms, max ${r.max.toFixed(0)} ms (${r.n} frames)`);
    if (gate && (r.med >= 20 || r.p95 > 50.2)) fails.push(`${w} ${label}: median ${r.med.toFixed(1)} ms, p95 ${r.p95.toFixed(1)} ms`);
  };
  for (const w of WIDTHS) {
    const h = HEIGHT(w);
    const c = await open({ w, h });
    const g = await c.page.evaluate(() => { const g = window.__age.G(), r = document.querySelector('.agv-svg').getBoundingClientRect(), k = r.width / g.W; return { x1: r.left + g.x(1) * k, x7: r.left + g.x(7) * k, x5: r.left + g.x(5) * k, y: r.top + g.yT * k, e0: r.left + g.ex(30) * k, e1: r.left + g.ex(85) * k, e60: r.left + g.ex(60) * k, ey: r.top + g.eY * k }; });
    const cdp = await c.ctx.newCDPSession(c.page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
    await probeF(c.page, 'Age structure, the mother dragged end to end and back', w, async () => {
      await c.page.mouse.move(g.x5, g.y); await c.page.mouse.down();
      for (let i = 0; i <= 24; i++) { await c.page.mouse.move(g.x5 + (g.x1 - g.x5) * i / 24, g.y); await c.page.waitForTimeout(16); }
      for (let i = 0; i <= 48; i++) { await c.page.mouse.move(g.x1 + (g.x7 - g.x1) * i / 48, g.y); await c.page.waitForTimeout(16); }
      await c.page.mouse.up(); await c.page.waitForTimeout(1500);
    }, true);
    await probeF(c.page, 'Age structure, life expectancy dragged end to end', w, async () => {
      await c.page.mouse.move(g.e60, g.ey); await c.page.mouse.down();
      for (let i = 0; i <= 20; i++) { await c.page.mouse.move(g.e60 + (g.e1 - g.e60) * i / 20, g.ey); await c.page.waitForTimeout(16); }
      for (let i = 0; i <= 30; i++) { await c.page.mouse.move(g.e1 + (g.e0 - g.e1) * i / 30, g.ey); await c.page.waitForTimeout(16); }
      await c.page.mouse.up(); await c.page.waitForTimeout(1200);
    }, true);
    await c.ctx.close();
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
    const fp = await ctx.newPage();
    await unlock(fp);
    await fp.goto(BASE + '/environmental-science/tools/water-pollution.html'); await fp.waitForSelector('.tk2-knob', { state: 'attached' }); await fp.waitForTimeout(1500);
    const cdp2 = await ctx.newCDPSession(fp); await cdp2.send('Emulation.setCPUThrottlingRate', { rate: RATE });
    await probeF(fp, 'FLAGSHIP water pollution, fertilizer knob end to end and back', w, async () => {
      const k = await fp.evaluate(() => { const e = [...document.querySelectorAll('.tk2-knob')].find(x => x.getBoundingClientRect().width > 0); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }), span = Math.min(260, w * 0.3);
      await fp.mouse.move(k.x, k.y); await fp.mouse.down();
      for (let i = 0; i <= 24; i++) { await fp.mouse.move(k.x + span * i / 24, k.y); await fp.waitForTimeout(16); }
      for (let i = 24; i >= 0; i--) { await fp.mouse.move(k.x + span * i / 24, k.y); await fp.waitForTimeout(16); }
      await fp.mouse.up();
    }, false);
    await ctx.close();
  }
}
await browser.close(); server.close();
if (fails.length) { console.log(`FAIL: ${fails.length} of ${checks} checks in ${states} states\n  ` + [...new Set(fails)].slice(0, 120).join('\n  ')); process.exit(1); }
console.log(`Age structure sweep: ${states} states, ${checks} checks, 0 failures` + (FRAMES ? ' (frames)' : PERF ? ' (perf)' : ''));
