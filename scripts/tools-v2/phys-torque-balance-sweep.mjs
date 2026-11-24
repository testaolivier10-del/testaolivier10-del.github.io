/* Tools v2 sweep for AP® Physics 1 Torque balance (docs/tools-v2-phys-torque-balance-brief.md), after the pattern of
   units-sig-figs-sweep.mjs. Three runs:

     node scripts/tools-v2/phys-torque-balance-sweep.mjs [widths] [--dark] [--shots dir]
       Every landmark state of the three Explore tabs, the first visits and Test yourself. At each state it asserts:
       - nothing drawn or labelled is clipped by the stage (texts, knobs, the hold button, the tray);
       - no two labels or numbers come within 4 px of each other (stick numbers, mass labels, the curl numbers, the
         distance, the scale's reading, the angle, the lever arm, the stands' names and times, knob tags), and no
         knob covers a label; no rendered text is under 11 px;
       - the thing acted on is the largest object (the stick; the stands' arms);
       - the words agree with the drawing: the curl numbers and the cause line are the torques of the masses where
         they are drawn (recomputed here from the hooks' marks), the curl arrows' lengths are in proportion to them,
         the result word matches the drawn tilt; Angle: the reading, the angle and the lever arm match the drawn pull;
       - on a phone the cause line is at most two rows and keeps one height in each tab; no sideways scroll; no
         console errors; a first visit's cue is whole and covers no label or number.
     ... --frames      Every animated change sampled on every frame (let go to balance and to tip, a fast drag, a
                       reversal mid turn, keyboard jumps, a mass flying in from the tray and back, the Angle tab let
                       go, the race and its rewind, leaving mid animation): the masses ride the drawn stick, the curl
                       numbers and arrows and the cause line follow what is drawn on that frame, result words only
                       when the picture shows the result, the race's times only when each weight is down.
     ... --perf        A full drag at CPU x4 (median and p95 frame time) on this tool and on the flagship (Water
                       pollution's sacks), in the same run.

   Needs Playwright and a Chromium (CHROME or /opt/pw-browsers/chromium-1243/chrome-linux64/chrome). It serves the
   repo on a free port, blocks service workers, and unlocks Premium only in the browser (premium.js's has() is
   routed to return true; nothing is written to disk). Exit code 1 on any failure. Run one width per process. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const require = createRequire(join(ROOT, 'package.json'));
const { chromium } = require('playwright');
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const p = join(ROOT, normalize(decodeURIComponent(req.url.split('?')[0])));
  if (!p.startsWith(ROOT) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const args = process.argv.slice(2), si = args.indexOf('--shots'), SHOTS = si >= 0 ? args[si + 1] : null;
const DARK = args.includes('--dark'), FRAMES = args.includes('--frames'), PERF = args.includes('--perf');
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const WIDTHS = (args[0] && !args[0].startsWith('--') ? args[0] : '360,390,430,600,768,820,1024,1280,1440,1920').split(',').map(Number);
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
const PREMIUM = readFileSync(join(ROOT, 'assets/premium.js'), 'utf8').replace('function has(course) {', 'function has(course) { return true;');
async function open(o) {
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, serviceWorkers: 'block', deviceScaleFactor: 1, reducedMotion: o.reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|supabase/.test(m.text() + (m.location().url || ''))) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.route('**/assets/premium.js', r => r.fulfill({ body: PREMIUM, contentType: 'application/javascript' }));
  await page.addInitScript(o2 => { try { if (o2.dark) localStorage.setItem('nremt_theme', 'dark'); if (!o2.cue) ['bal', 'ang', 'ine'].forEach(k => localStorage.setItem('tk2c:apphys-torque-balance-' + k, '1')); } catch (e) {} }, { dark: DARK, cue: !!o.cue });
  await page.goto(BASE + (o.path || '/physics/tools/torque-balance.html'), { waitUntil: 'load' });
  if (!o.path) { await page.waitForSelector('.tb2-svg .tb2-stick', { timeout: 15000 }); await page.waitForTimeout(500); }
  return { page, errs, ctx };
}
const W4 = w => String(w).padStart(4, '0') + (DARK ? 'd' : 'l');
const shot = async (page, name) => { if (!SHOTS) return; const narrow = (await page.viewportSize()).width < 900 && await page.locator('.tb2').isVisible(); return narrow ? page.locator('.tb2').screenshot({ path: join(SHOTS, name) }) : page.screenshot({ path: join(SHOTS, name), fullPage: (await page.viewportSize()).width < 900 }); };
const tab = async (page, v) => { await page.click(`.tk2-tab[data-v=${v}]`); await page.waitForTimeout(450); };
/* page.waitForFunction evaluates a string, which the page's CSP refuses (no unsafe-eval): poll with evaluate instead. */
async function until(page, fn, arg, ms = 8000) { const t0 = Date.now(); for (;;) { if (await page.evaluate(fn, arg)) return; if (Date.now() - t0 > ms) throw new Error('timed out: ' + fn.toString().slice(0, 80)); await page.waitForTimeout(40); } }
const settle = page => until(page, () => { const t = document.querySelector('.tb2').__tb, s = t.st[t.st.tab]; return t.st.tab === 'ine' ? ['ready', 'done'].includes(t.st.ine.phase) : !s.held && s.postT === 0 && s.om === 0 && !s.fly.length; }).then(() => page.waitForTimeout(260));   // a stage redrawn for more rows settles too
/* Move a mass (by index) to a mark with a real pointer drag; the stick is held level while it moves. */
async function dragMass(page, i, cm, o = {}) {
  const k = page.locator('.tb2-mk .tk2-knob').nth(i), b = await k.boundingBox(), box = await page.locator('.tb2-scene').boundingBox();
  const g = await page.evaluate(() => { const g = document.querySelector('.tb2').__tb.geo(); return { x0: g.x0, ppm: g.ppm }; });
  const x = b.x + b.width / 2, y = b.y + b.height / 2, tx = box.x + g.x0 + cm / 100 * g.ppm;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(tx, y + (o.dy || 0), { steps: o.steps || 8 });
  if (!o.keep) await page.mouse.up();
}

/* Runs in the page: the layout and agreement checks for the tab showing. */
const probe = (o) => {
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]') && getComputedStyle(e).display !== 'none' && (e.textContent || '').trim() !== '';
  const q = s => [...document.querySelectorAll(s)].filter(vis), out = [];
  const shown = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]');
  const qa = s => [...document.querySelectorAll(s)].filter(shown);
  const T = document.querySelector('.tb2').__tb, st = T.st, tabv = st.tab, S = R(document.querySelector('.tb2-scene'));
  const inS = (x, name, tol = 0.6) => { if (x.l < S.l - tol || x.r > S.r + tol || x.t < S.t - tol || x.b > S.b + tol) out.push('clipped: ' + name); };
  const gap = (a, c) => Math.max(c.l - a.r, a.l - c.r, c.t - a.b, a.t - c.b);
  const area = x => x.w * x.h;
  const causeEl = document.querySelector('.tb2 .tk2-cause'), cause = causeEl.innerText.replace(/\s+/g, ' ').trim();
  // text boxes: glyph bounds (a text's box from getBoundingClientRect)
  const texts = q('.tb2-svg text').map(e => ({ n: 'text "' + e.textContent.trim() + '"', r: R(e), el: e }));
  texts.forEach(x => { const fs = parseFloat(getComputedStyle(x.el).fontSize) * (x.el.ownerSVGElement.getBoundingClientRect().width / x.el.ownerSVGElement.viewBox.baseVal.width); if (fs < 10.95) out.push('text under 11 px: ' + x.n + ' ' + fs.toFixed(1)); inS(x.r, x.n); });
  const tags = q('.tb2 .tk2-tag').map(e => ({ n: 'tag "' + e.textContent + '"', r: R(e) }));
  const reads = q('.tb2-read').map(e => ({ n: 'reading', r: R(e) }));
  const knobs = qa('.tb2 .tk2-handle .tk2-dot, .tb2 .tk2-drag .tk2-dot').map(e => ({ n: 'knob', r: R(e), el: e }));
  const btns = qa('.tb2-hold').map(e => ({ n: 'hold button', r: R(e) }));
  const trays = [...document.querySelectorAll('.tb2-traytap')].filter(e => e.getClientRects().length).map(e => ({ n: 'tray tap', r: R(e) }));
  [...tags, ...reads, ...btns, ...trays].forEach(x => inS(x.r, x.n));
  knobs.forEach(x => inS(x.r, 'knob', 2));
  // labels and numbers keep 4 px apart; a stick's number may sit under a hook's clamp (the real thing), never under another label
  const labs = [...texts.filter(x => !x.el.closest('.tb2-tm') && !x.el.closest('.tb2-flym') && !x.el.closest('.tb2-read')), ...tags, ...reads];
  for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) {
    const a = labs[i], c = labs[j];
    if (a.el && c.el && a.el.closest('.tb2-mass') && a.el.closest('.tb2-mass') === c.el.closest('.tb2-mass')) continue;
    if (gap(a.r, c.r) < 4) out.push('labels closer than 4 px: ' + a.n + ' and ' + c.n);
  }
  labs.forEach(a => knobs.forEach(k => { if (gap(a.r, k.r) < 0) out.push('a knob covers ' + a.n); }));
  labs.forEach(a => btns.forEach(k => { if (gap(a.r, k.r) < 4) out.push('the hold button touches ' + a.n); }));
  // the agreement checks
  const n2 = x => x.toFixed(2), F3 = x => x.toFixed(3);
  if (tabv !== 'ine') {
    const s = st[tabv], g = T.geo(), stick = R(document.querySelector('.tb2-wood'));
    // the fulcrum's stand is a thin rod under the stick (taller than wide on a phone, where the masses need room to hang), not a competing object
    const others = q('.tb2-mass, .tb2-pullg, .tb2-tray').map(e => ({ n: e.getAttribute('class'), r: R(e) }));
    // the stick is the longest thing drawn (a stand's box is mostly empty wall, so sizes are compared by length)
    others.forEach(x => { if (Math.max(x.r.w, x.r.h) > Math.max(stick.w, stick.h)) out.push('the stick is not the largest object (' + x.n + ')'); });
    // torques from the drawn hooks (each mass's data-x and the drawn fulcrum), with the stick level
    const piv = s.pivot, gg = 9.8, ms = [...document.querySelectorAll('.tb2-mass')].map(e => ({ x: +e.getAttribute('data-x'), m: s.masses.find(q => String(q.id) === e.getAttribute('data-id')).m }));
    let ccw = 0, cw = 0;
    const add = t => { if (t > 1e-12) ccw += t; else if (t < -1e-12) cw -= t; };
    if (s.useMb) add(-0.12 * gg * (0.5 - piv / 100));
    ms.forEach(q2 => add(-q2.m * gg * (q2.x - piv) / 100));
    const pl = document.querySelector('.tb2-pullg');
    if (tabv === 'ang') { const f = +pl.getAttribute('data-f'), a = +pl.getAttribute('data-ang'); add((s.pull.x - piv) / 100 * f * Math.sin(a * Math.PI / 180)); }
    const d = Math.abs(ccw - cw) > 1e-9 && n2(ccw) === n2(cw) ? 3 : 2, t1 = ccw.toFixed(d), t2 = cw.toFixed(d);
    if (!cause.includes('↺ ' + t1 + ' vs ↻ ' + t2) && !causeEl.classList.contains('is-take')) out.push(`cause line "${cause}" is not ↺ ${t1} vs ↻ ${t2}`);
    if (tabv === 'bal' && s.useMb && s.pivot !== 50 && !q('.tb2-swt').length) out.push('the stick\u2019s weight is a torque but is not named');
    if (!causeEl.classList.contains('is-take') && tabv === 'bal' && !/from fulcrum|on the fulcrum|fulcrum at/.test(cause)) out.push('the first pill does not say from where: ' + cause);
    if (tabv === 'bal') { const L = document.querySelector('.tb2-tq.is-ccw').textContent, Rr = document.querySelector('.tb2-tq.is-cw').textContent; if (L !== '↺ ' + t1 + ' N·m' || Rr !== '↻ ' + t2 + ' N·m') out.push(`curl numbers ${L} / ${Rr}, drawn masses give ${t1} / ${t2}`); }
    const arcs = document.querySelector('.tb2-arcs'), dc = +arcs.getAttribute('data-ccw'), dw = +arcs.getAttribute('data-cw');
    if (tabv === 'bal' && ccw > 0.01 && cw > 0.01 && Math.abs(dc / dw - ccw / cw) > 0.02 * (ccw / cw) + 0.01) out.push(`curl arrows ${dc.toFixed(1)}° : ${dw.toFixed(1)}° are not in proportion to ${F3(ccw)} : ${F3(cw)}`);
    if (Math.max(dc, dw) > 68.5) out.push('a curl arrow longer than 68°');
    // the result word follows the drawn tilt
    const th = +document.querySelector('.tb2-stick').getAttribute('data-th'), res = causeEl.getAttribute('data-res');
    if (!causeEl.classList.contains('is-take')) {
      if (res === 'down-left' && !(th > 9.9)) out.push('says left end down with the stick at ' + th);
      if (res === 'down-right' && !(th < -9.9)) out.push('says right end down with the stick at ' + th);
      if ((res === 'level' || res === 'held') && Math.abs(th) > 0.01) out.push('says ' + res + ' with the stick at ' + th);
      if (res === 'level' && Math.abs(ccw - cw) > 1e-9) out.push('says balanced with unequal torques');
    }
    if (tabv === 'ang') {
      const f = +pl.getAttribute('data-f'), a = +pl.getAttribute('data-ang'), th2 = a <= 90 ? a : 180 - a, arm = Math.abs((s.pull.x - piv) / 100 * Math.sin(a * Math.PI / 180));
      const rd = document.querySelector('.tb2-read text').textContent, an = document.querySelector('.tb2-anglet').textContent, am = document.querySelector('.tb2-armt').textContent;
      if (rd !== f.toFixed(1) + ' N') out.push('the scale reads ' + rd + ', the pull is ' + f);
      if (an !== th2 + '°') out.push('the angle says ' + an + ', the pull is at ' + th2);
      if (am !== 'lever arm ' + arm.toFixed(2) + ' m') out.push(am + ', drawn lever arm ' + arm.toFixed(3));
      if (!cause.includes(f.toFixed(1) + ' N at ' + th2 + '°') || !cause.includes('lever arm ' + arm.toFixed(2) + ' m')) out.push('cause line disagrees with the pull: ' + cause);
      // the lever arm's name is attached to its line (within 16 px of the green segment; 30 px when the arm lies along the tilted stick and the name must clear the stick's numbers)
      const al = R(document.querySelector('.tb2-armt')), gl = document.querySelector('.tb2-arm'), seg = [[gl.x1.baseVal.value, gl.y1.baseVal.value], [gl.x2.baseVal.value, gl.y2.baseVal.value]], svgR = R(document.querySelector('.tb2-svg'));
      let dmin = 1e9; for (let i = 0; i <= 40; i++) { const px = svgR.l + seg[0][0] + (seg[1][0] - seg[0][0]) * i / 40, py = svgR.t + seg[0][1] + (seg[1][1] - seg[0][1]) * i / 40; dmin = Math.min(dmin, Math.max(al.l - px, px - al.r, 0) ** 2 + Math.max(al.t - py, py - al.b, 0) ** 2); }
      if (Math.sqrt(dmin) > (Math.abs(Math.sin(a * Math.PI / 180)) > 0.97 ? 30 : 16)) out.push('the lever arm\u2019s name is ' + Math.sqrt(dmin).toFixed(0) + ' px from its line');
      // the angle's number sits inside its own arc (between the stick and the pull, seen from the hook)
      const ag = document.querySelector('.tb2-anglet'), hk = T.pullGeo().h, ax = +ag.getAttribute('x') - hk[0], ay = hk[1] - (+ag.getAttribute('y') - 4);
      const thr = +document.querySelector('.tb2-stick').getAttribute('data-th'), dirA = ((Math.atan2(ay, ax) * 180 / Math.PI - thr) % 360 + 540) % 360 - 180, lo = a <= 90 ? 0 : a, hi = a <= 90 ? a : 180;
      if (!(dirA > lo - 1 && dirA < hi + 1)) out.push('the angle\u2019s number is outside its arc (' + dirA.toFixed(0) + '° for ' + lo + ' to ' + hi + ')');
      // the lever arm is drawn square to the line of action and as long as it says
      const ln = document.querySelector('.tb2-arm'), L2 = Math.hypot(ln.x2.baseVal.value - ln.x1.baseVal.value, ln.y2.baseVal.value - ln.y1.baseVal.value) / g.ppm;
      if (Math.abs(L2 - arm) > 0.004) out.push('the drawn lever arm is ' + L2.toFixed(3) + ' m, the label ' + arm.toFixed(3));
    }
  } else {
    const s = st.ine, arms = qa('.tb2-armr').map(R), wts = qa('.tb2-wt').map(R);
    const armW = 2 * T.geo().arm;   // the arm's length (it turns in depth, so its drawn width changes)
    wts.forEach(w => { if (w.w > armW) out.push('a weight is larger than the stand’s arm'); });
    const I = d => 0.0015 + 2 * 0.25 * (d / 100) ** 2, ra = I(s.dB) / I(s.dA), more = ra >= 1 ? 'B' : 'A', rr = ra >= 1 ? ra : 1 / ra;
    if (!causeEl.classList.contains('is-take')) {
      if (!cause.includes('A ' + s.dA + ' cm, B ' + s.dB + ' cm out')) out.push('cause line does not name the sliders: ' + cause);
      if (Math.abs(ra - 1) > 1e-9 && !cause.includes('I of ' + more + ' ' + rr.toFixed(1) + '×')) out.push('cause line ratio: ' + cause);
    }
    const times = q('.tb2-time');
    if (s.phase === 'ready' && times.length) out.push('landing times shown before a race');
  }
  const rows = new Set(q('.tb2 .tk2-cz').map(e => Math.round(R(e).t))).size;
  if (innerWidth <= 640 && rows > 2) out.push('cause line is ' + rows + ' rows: ' + cause);
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  // a desktop shows the picture and the cause line together, without scrolling
  if (innerWidth >= 1000 && R(causeEl).b > innerHeight + 0.5) out.push('the cause line is below the screen (' + Math.round(R(causeEl).b) + ' > ' + innerHeight + ')');
  return { out, causeH: Math.round(R(causeEl).h) };
};

let checks = 0, states = 0; const fails = [];
async function runSweep(w, h) {
  // first visits: the cue is whole, inside the stage, and covers no label or number
  for (const tv of ['bal', 'ang', 'ine']) {
    const c = await open({ w, h, cue: true });
    if (tv !== 'bal') await tab(c.page, tv);
    const bad = await c.page.evaluate(() => {
      const R = e => e.getBoundingClientRect(), cue = [...document.querySelectorAll('.tk2-cue')].filter(e => e.getClientRects().length)[0];
      if (!cue) return ['no cue shown'];
      const r = R(cue), S = R(document.querySelector('.tb2-scene')), out = [];
      if (r.left < S.left - 0.5 || r.right > S.right + 0.5 || r.top < S.top - 0.5 || r.bottom > S.bottom + 0.5) out.push('the cue is clipped by the stage');
      [...document.querySelectorAll('.tb2-svg text, .tb2 .tk2-tag, .tb2-read, .tb2 .tk2-dot')].filter(e => e.getClientRects().length && (e.textContent.trim() || e.classList.contains('tk2-dot'))).forEach(e => { const x = R(e); if (!(r.right <= x.left || x.right <= r.left || r.bottom <= x.top || x.bottom <= r.top)) out.push('the cue covers ' + (e.textContent.trim() || 'a knob').slice(0, 24)); });
      return out;
    });
    states++; checks += 2; bad.forEach(m => fails.push(`${w} first visit ${tv}: ${m}`));
    await shot(c.page, `${W4(w)}-0-first-${tv}.png`);
    await c.ctx.close();
  }
  const { page, errs, ctx } = await open({ w, h });
  const heights = { bal: new Set(), ang: new Set(), ine: new Set() };
  const check = async (what) => {
    const r = await page.evaluate(probe, {}); states++; checks += 9;
    r.out.forEach(m => fails.push(`${w} ${what}: ${m}`));
    const tv = await page.evaluate(() => document.querySelector('.tb2').__tb.st.tab);
    if (w <= 640) heights[tv].add(r.causeH);
  };
  await check('balance landing'); await shot(page, `${W4(w)}-1-bal-landing.png`);
  await dragMass(page, 1, 90); await settle(page); await check('balance balanced'); await shot(page, `${W4(w)}-1-bal-balanced.png`);
  await page.click('.tb2-again'); await settle(page);
  await dragMass(page, 1, 60); await settle(page); await check('balance 100 g at 60');
  await dragMass(page, 0, 6); await settle(page); await check('balance 200 g at 6'); await shot(page, `${W4(w)}-1-bal-right-down.png`);
  for (const i of [2, 0]) { await page.locator('.tb2-traytap').nth(i).click(); await settle(page); }
  await check('balance four masses'); await shot(page, `${W4(w)}-1-bal-four.png`);
  // crowd them: three hooks 4 cm apart hang at different heights
  await dragMass(page, 2, 70); await settle(page); await dragMass(page, 3, 74); await settle(page);
  await check('balance crowded'); await shot(page, `${W4(w)}-1-bal-crowded.png`);
  // the fulcrum to each end (keys on its quiet knob)
  await page.focus('.tb2-ful input'); await page.keyboard.press('Home'); await settle(page); await check('fulcrum at 25'); await shot(page, `${W4(w)}-1-bal-fulcrum25.png`);
  await page.keyboard.press('End'); await settle(page); await check('fulcrum at 75');
  await page.click('.tb2-hold'); await page.waitForTimeout(450); await check('held level'); await shot(page, `${W4(w)}-1-bal-held.png`);
  await page.click('.tb2-hold'); await settle(page);
  await page.click('.tb2-again'); await settle(page);
  // Angle
  await tab(page, 'ang'); await settle(page); await check('angle landing'); await shot(page, `${W4(w)}-2-ang-landing.png`);
  const setPull = (F, a) => page.evaluate(([F, a]) => { const t = document.querySelector('.tb2').__tb, s = t.st.ang; s.pull.F = F; s.pull.ang = a; const k = document.querySelector('.tb2 .tk2-handle .tk2-knob'); k.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })); k.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); }, [F, a]);
  for (const [F, a] of [[1.1, 60], [3, 15], [0.2, 165], [3, 165], [1, 90], [2.5, 120], [1.6, 40]]) {
    await setPull(F, a); await settle(page); await check(`angle ${F} N at ${a}`);
    if (a === 90 || a === 15 || a === 120) await shot(page, `${W4(w)}-2-ang-${F}N-${a}.png`);
  }
  // Inertia: ready, then a race to the end
  await tab(page, 'ine'); await check('inertia ready'); await shot(page, `${W4(w)}-3-ine-ready.png`);
  await page.focus('.tb2 .tk2-handle:not(.is-quiet) .tk2-knob'); await page.keyboard.press('End');
  await until(page, () => document.querySelector('.tb2').__tb.st.ine.phase === 'race', null, 5000);
  await page.waitForTimeout(600); await check('inertia racing'); await shot(page, `${W4(w)}-3-ine-racing.png`);
  await until(page, () => document.querySelector('.tb2').__tb.st.ine.phase === 'done', null, 9000);
  await page.waitForTimeout(200); await check('inertia done'); await shot(page, `${W4(w)}-3-ine-done.png`);
  await page.focus('.tb2 .tk2-handle.is-quiet .tk2-knob'); await page.keyboard.press('End'); await page.waitForTimeout(150); await check('inertia rewinding, same I');
  // Test yourself: the drill on the same frame
  await page.click('.ls-root button:has-text("Test yourself")'); await page.waitForTimeout(600);
  const ty = await page.evaluate(() => ({ fig: !!document.querySelector('.ls-drill-stage svg, .ls-drill-stage .tb-fig'), step: !!document.querySelector('.ls-drill input, .ls-drill button'), sw: document.documentElement.scrollWidth > innerWidth, ex: !!document.querySelector('.tb2') && document.querySelector('.tb2').getClientRects().length > 0 }));
  checks += 4; if (!ty.fig) fails.push(`${w} Test yourself: no figure on the stage`); if (!ty.step) fails.push(`${w} Test yourself: no step to answer`); if (ty.sw) fails.push(`${w} Test yourself: sideways scroll`); if (ty.ex) fails.push(`${w} Test yourself: the Explore stage still shows`);
  await shot(page, `${W4(w)}-4-test.png`);
  if (w <= 640) for (const t of ['bal', 'ang', 'ine']) { checks++; if (heights[t].size > 1) fails.push(`${w}: cause line height not constant in ${t}: ${[...heights[t]]}`); }
  checks++; if (errs.length) fails.push(`${w}: console ${errs.join('|')}`);
  await ctx.close();
}

/* ---------------------------------------------------------------- frame by frame */
const frameProbe = () => {
  // one sample: the drawn state, checked against itself
  const T = document.querySelector('.tb2').__tb, st = T.st, tabv = st.tab, g = T.geo(), out = [];
  const causeEl = document.querySelector('.tb2 .tk2-cause'), cause = causeEl.innerText.replace(/\s+/g, ' ');
  if (tabv === 'ine') {
    const s = st.ine, times = [...document.querySelectorAll('.tb2-time')].map(e => e.textContent), wts = [...document.querySelectorAll('.tb2-wt')].map(e => +e.getAttribute('data-y'));
    const down = wts.map(y => y >= 0.8 - 1e-6);
    if (times.length > down.filter(Boolean).length) out.push(`${times.length} landing times with ${down.filter(Boolean).length} weights down`);
    if (/sooner|a tie/.test(cause) && !causeEl.classList.contains('is-take') && !(down[0] && down[1])) out.push('says who lands first before both are down');
    if (/racing/.test(cause) && down[0] && down[1]) out.push('says racing with both weights down');
    return { out, k: 'ine:' + s.phase + ':' + wts.map(y => y.toFixed(3)).join(',') };
  }
  const s = st[tabv], th = +document.querySelector('.tb2-stick').getAttribute('data-th') * Math.PI / 180, P = g.x0 + s.pivot / 100 * g.ppm;
  // every mass hangs from its hook on the drawn stick
  document.querySelectorAll('.tb2-mass').forEach(e => {
    const x = +e.getAttribute('data-x'), r = (x - s.pivot) / 100 * g.ppm, hx = P + r * Math.cos(th), hy = g.py - r * Math.sin(th) + g.thick / 2;
    const str = [...document.querySelectorAll('.tb2-string')].find(l => Math.abs(+l.getAttribute('x1') - hx) < 0.6);
    if (!str || Math.abs(+str.getAttribute('y1') - hy) > 0.8) out.push('a mass at ' + x + ' does not hang from the drawn stick');
    const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(e.getAttribute('transform')); if (!m || Math.abs(+m[1] - hx) > 0.6) out.push('a mass body is off its hook at ' + x);
  });
  // the curl numbers and the cause line are the torques of what is drawn
  let ccw = 0, cw = 0; const add = t => { if (t > 1e-12) ccw += t; else if (t < -1e-12) cw -= t; };
  if (s.useMb) add(-0.12 * 9.8 * (0.5 - s.pivot / 100));
  document.querySelectorAll('.tb2-mass').forEach(e => { const q = s.masses.find(q2 => String(q2.id) === e.getAttribute('data-id')); if (!q) { out.push('a drawn mass that is not hung'); return; } add(-q.m * 9.8 * (+e.getAttribute('data-x') - s.pivot) / 100); });
  if (tabv === 'ang') { const pl = document.querySelector('.tb2-pullg'); add((s.pull.x - s.pivot) / 100 * +pl.getAttribute('data-f') * Math.sin(+pl.getAttribute('data-ang') * Math.PI / 180)); }
  const d = Math.abs(ccw - cw) > 1e-9 && ccw.toFixed(2) === cw.toFixed(2) ? 3 : 2;
  if (!causeEl.classList.contains('is-take') && !cause.includes('↺ ' + ccw.toFixed(d) + ' vs ↻ ' + cw.toFixed(d))) out.push('cause line ' + cause + ' against drawn ' + ccw.toFixed(3) + ' / ' + cw.toFixed(3));
  if (tabv === 'bal' && document.querySelector('.tb2-tq.is-ccw').textContent !== '↺ ' + ccw.toFixed(d) + ' N·m') out.push('curl number against the drawn masses');
  const arcs = document.querySelector('.tb2-arcs'), dc = +arcs.getAttribute('data-ccw'), dw = +arcs.getAttribute('data-cw'), k = +arcs.getAttribute('data-k');
  if (tabv === 'bal' && (Math.abs(dc - ccw * k) > 0.35 || Math.abs(dw - cw * k) > 0.35)) out.push(`curl arrows ${dc.toFixed(2)}/${dw.toFixed(2)}° for ${(ccw * k).toFixed(2)}/${(cw * k).toFixed(2)}`);
  // result words only when the picture shows them
  const res = causeEl.getAttribute('data-res'), deg = th * 180 / Math.PI;
  if (!causeEl.classList.contains('is-take')) {
    if (res === 'down-left' && !(deg > 9.9 && s.om === 0)) out.push('left end down at ' + deg.toFixed(2) + '°');
    if (res === 'down-right' && !(deg < -9.9 && s.om === 0)) out.push('right end down at ' + deg.toFixed(2) + '°');
    if (res === 'held' && Math.abs(deg) > 0.01) out.push('held level at ' + deg.toFixed(2) + '°');
    if (res === 'level' && (Math.abs(deg) > 0.01 || Math.abs(ccw - cw) > 1e-9)) out.push('balanced at ' + deg.toFixed(2) + '°');
    if (/^turn/.test(res) && s.om === 0 && (s.postT === 0 || s.postT === 1) && Math.abs(Math.abs(deg) - 10) < 1e-4) out.push('turning with the stick at rest on a support');
    if (/^turn/.test(res) && Math.abs(deg) < 1e-6 && s.om === 0) out.push('turning with the stick still and level');
    if (res === 'turn-ccw' && s.om < 0 || res === 'turn-cw' && s.om > 0) out.push('turning the wrong way');
  }
  // the stick never turns toward the smaller torque from rest, and stays inside the supports' stops
  if (Math.abs(deg) > 10.001) out.push('the stick passes its stop: ' + deg.toFixed(3));
  return { out, k: tabv + ':' + deg.toFixed(3) + ':' + res };
};
async function sample(page, label, ms) {
  // read the drawn state after every animation frame for ms milliseconds
  // the probe goes in as an inline script (the CSP allows those, not eval)
  if (!(await page.evaluate(() => !!window.__fp))) await page.addScriptTag({ content: 'window.__fp = ' + frameProbe.toString() + ';' });
  const res = await page.evaluate(async ([ms]) => {
    const f = window.__fp, out = [], seen = new Set(); let n = 0;
    const t0 = performance.now();
    await new Promise(done => { function tick() { const r = f(); n++; seen.add(r.k); r.out.forEach(m => out.push(m)); if (performance.now() - t0 < ms) requestAnimationFrame(tick); else done(); } requestAnimationFrame(tick); });
    return { out: [...new Set(out)], n, distinct: seen.size };
  }, [ms]);
  states += res.n; checks += res.n * 6;
  res.out.forEach(m => fails.push(`frames ${label}: ${m}`));
  return res;
}
async function runFrames(w, h) {
  const { page, errs, ctx } = await open({ w, h });
  const sampleWhile = async (label, act, ms) => { const p = sample(page, label, ms); await page.waitForTimeout(30); await act(); return p; };
  let r;
  r = await sampleWhile('let go balanced', async () => { await dragMass(page, 1, 90); }, 1400); console.log('  let go balanced: frames ' + r.n + ', distinct drawn states ' + r.distinct);
  r = await sampleWhile('let go tips', async () => { await dragMass(page, 1, 70); }, 1600); console.log('  let go tips: ' + r.n + ' / ' + r.distinct);
  r = await sampleWhile('fast drag across', async () => { await dragMass(page, 1, 98, { steps: 2 }); }, 1400); console.log('  fast drag: ' + r.n + ' / ' + r.distinct);
  // a reversal: grab mid turn and drag the other way
  r = await sampleWhile('reversal mid turn', async () => { await dragMass(page, 1, 60, { steps: 3 }); await page.waitForTimeout(260); await dragMass(page, 1, 96, { steps: 3 }); }, 2000); console.log('  reversal: ' + r.n + ' / ' + r.distinct);
  r = await sampleWhile('keyboard jumps', async () => { await page.focus('.tb2-mk .tk2-knob >> nth=1'); for (const k of ['PageDown', 'PageDown', 'PageUp', 'End', 'Home', 'ArrowRight']) { await page.keyboard.press(k); await page.waitForTimeout(90); } }, 2200); console.log('  keys: ' + r.n + ' / ' + r.distinct);
  r = await sampleWhile('tray fly in and back', async () => { await page.locator('.tb2-traytap').nth(2).click(); await page.waitForTimeout(1300); await page.focus('.tb2-mk .tk2-knob >> nth=2'); await page.keyboard.press('Delete'); }, 2600); console.log('  tray: ' + r.n + ' / ' + r.distinct);
  r = await sampleWhile('fulcrum drag', async () => { const k = await page.locator('.tb2-ful .tk2-knob').boundingBox(); await page.mouse.move(k.x + k.width / 2, k.y + k.height / 2); await page.mouse.down(); await page.mouse.move(k.x - 140, k.y + k.height / 2, { steps: 6 }); await page.mouse.up(); }, 1600); console.log('  fulcrum: ' + r.n + ' / ' + r.distinct);
  await settle(page);
  await tab(page, 'ang');
  r = await sampleWhile('angle drag and let go', async () => { const k = await page.locator('.tb2 .tk2-handle .tk2-knob').boundingBox(); await page.mouse.move(k.x + k.width / 2, k.y + k.height / 2); await page.mouse.down(); await page.mouse.move(k.x + 60, k.y - 30, { steps: 6 }); await page.mouse.move(k.x - 80, k.y + 10, { steps: 6 }); await page.mouse.up(); }, 1800); console.log('  angle: ' + r.n + ' / ' + r.distinct);
  await settle(page);
  await tab(page, 'ine');
  r = await sampleWhile('race', async () => { await page.focus('.tb2 .tk2-handle:not(.is-quiet) .tk2-knob'); await page.keyboard.press('End'); }, 4800); console.log('  race: ' + r.n + ' / ' + r.distinct);
  r = await sampleWhile('rewind mid race', async () => { await page.keyboard.press('Home'); await page.waitForTimeout(1500); await page.keyboard.press('ArrowRight'); }, 3200); console.log('  rewind: ' + r.n + ' / ' + r.distinct);
  // leaving mid animation: Test yourself mid race, mid tip; back to a clean Explore with nothing running
  await page.keyboard.press('End'); await page.waitForTimeout(900);
  await page.click('.ls-root button:has-text("Test yourself")'); await page.waitForTimeout(300);
  await page.click('.ls-root button:has-text("Explore")'); await page.waitForTimeout(500);
  const clean = await page.evaluate(() => { const s = document.querySelector('.tb2').__tb.st; return s.ine.phase; });
  checks++; if (!['done', 'ready'].includes(clean)) fails.push('frames: leaving mid race left phase ' + clean);
  await tab(page, 'bal'); await dragMass(page, 1, 60); await page.waitForTimeout(220);
  await page.click('.ls-root button:has-text("Test yourself")'); await page.waitForTimeout(300);
  const stopped = await page.evaluate(async () => { const s = document.querySelector('.tb2').__tb.st.bal, a = s.th; await new Promise(r => setTimeout(r, 300)); return { moved: s.th !== a, om: s.om, held: s.held }; });
  checks++; if (stopped.moved || stopped.om !== 0) fails.push('frames: the stick kept moving after leaving for Test yourself');
  await page.click('.ls-root button:has-text("Explore")'); await page.waitForTimeout(500);
  r = await sample(page, 'back to explore', 600);
  // reduced motion: the end state at once
  const rm = await open({ w, h, reduced: true });
  const k = rm.page.locator('.tb2-mk .tk2-knob').nth(1); await k.focus(); await rm.page.keyboard.press('End');
  await rm.page.waitForTimeout(1100);
  const rr = await rm.page.evaluate(() => { const t = document.querySelector('.tb2').__tb; return { th: t.st.bal.th * 57.2958, res: document.querySelector('.tb2 .tk2-cause').getAttribute('data-res') }; });
  checks++; if (!(rr.th > 9.99 || rr.th < -9.99 || rr.res === 'level')) fails.push('reduced motion: not at the end state ' + JSON.stringify(rr));
  if (rm.errs.length) fails.push('reduced motion console: ' + rm.errs.join('|'));
  await rm.ctx.close();
  checks++; if (errs.length) fails.push(`frames ${w}: console ${errs.join('|')}`);
  await ctx.close();
}

/* ---------------------------------------------------------------- perf at CPU x4 */
async function frameTimes(page, run) {
  await page.evaluate(() => { window.__ft = []; let last = performance.now(); window.__ftOn = true; (function tick(t) { if (!window.__ftOn) return; window.__ft.push(t - last); last = t; requestAnimationFrame(tick); })(performance.now()); });
  await run();
  return page.evaluate(() => { window.__ftOn = false; const a = window.__ft.slice(2).sort((x, y) => x - y); return { n: a.length, med: a[Math.floor(a.length / 2)], p95: a[Math.floor(a.length * 0.95)] }; });
}
async function runPerf(w, h) {
  const res = {};
  { const { page, ctx } = await open({ w, h }); const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    res.torque = await frameTimes(page, async () => { const k = await page.locator('.tb2-mk .tk2-knob').nth(1).boundingBox(), box = await page.locator('.tb2-scene').boundingBox();
      await page.mouse.move(k.x + 22, k.y + 22); await page.mouse.down();
      for (let i = 0; i <= 40; i++) await page.mouse.move(box.x + box.width * (0.55 + 0.4 * Math.abs(Math.sin(i / 7))), k.y + 22);
      await page.mouse.up(); await page.waitForTimeout(1400); });
    await ctx.close(); }
  { const { page, ctx } = await open({ w, h, path: '/environmental-science/tools/water-pollution.html' }); await page.waitForSelector('.tk2-drag .tk2-knob', { timeout: 15000 }); await page.waitForTimeout(500);
    const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    res.flagship = await frameTimes(page, async () => { const k = await page.locator('.tk2-drag .tk2-knob').first().boundingBox(); await page.mouse.move(k.x + 22, k.y + 22); await page.mouse.down();
      for (let i = 0; i <= 40; i++) await page.mouse.move(k.x + 22 + 140 * Math.abs(Math.sin(i / 7)), k.y + 22);
      await page.mouse.up(); await page.waitForTimeout(1400); });
    await ctx.close(); }
  console.log(`  perf ${w}: torque balance median ${res.torque.med.toFixed(1)} ms, p95 ${res.torque.p95.toFixed(1)} ms (${res.torque.n} frames); flagship median ${res.flagship.med.toFixed(1)} ms, p95 ${res.flagship.p95.toFixed(1)} ms (${res.flagship.n} frames)`);
  checks += 2; if (res.torque.med > 20) fails.push(`perf ${w}: median ${res.torque.med.toFixed(1)} ms`); if (res.torque.p95 > 50) fails.push(`perf ${w}: p95 ${res.torque.p95.toFixed(1)} ms`);
}

for (const w of WIDTHS) {
  // each width at a real screen's height (1024 × 768 and 1280 × 800 laptops among them)
  const h = { 360: 740, 390: 844, 430: 932, 600: 960, 768: 1024, 820: 1180, 1024: 768, 1280: 800, 1440: 900, 1920: 1080 }[w] || (w < 600 ? 844 : 900);
  if (PERF) await runPerf(w, h);
  else if (FRAMES) await runFrames(w, h);
  else await runSweep(w, h);
}
await browser.close();
const uniq = [...new Set(fails)];
console.log(`${PERF ? 'perf' : FRAMES ? 'frames' : 'sweep'} ${WIDTHS.join(',')} ${DARK ? 'dark' : 'light'}: states ${states}, checks ${checks}, failures ${uniq.length}`);
console.log(uniq.slice(0, 60).join('\n'));
server.close();
process.exit(uniq.length ? 1 : 0);
