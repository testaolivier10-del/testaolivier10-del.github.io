/* Tools v2 layout sweep for the Organic Chemistry 3D Molecule Viewer (docs/tools-v2-viewer-3d-brief.md). Every
   molecule of the list in its opening view and four more turns (and an end atom tapped on some), the stereocenter
   and its mirror image at eight turns (the H at the back in half of them), and three molecules of "Name the shape",
   at ten widths. At each state it asserts:
     - nothing drawn or labelled is clipped by the stage (balls, letters, names, numbers, the card, the controls);
     - no two names overlap each other, the card, a control or a letter on a ball; no rendered text under 11 px;
     - the molecule is the largest object in the picture and at least a set share of the stage;
     - the words agree with the frame: the card names the tapped atom's shape, the angle on the picture is the one
       in the cause line, and R or S is shown only with the H at the back and reads the turn of 1, 2, 3 as drawn
       (from the balls' positions on screen, not from the model), the mirror image the other letter;
     - on a phone the line under the picture is at most two rows and keeps one height; no sideways scroll, no
       console errors; on a first visit the cue is whole and covers no name, number, control or ball.

     node scripts/tools-v2/viewer-3d-sweep.mjs [widths, comma separated] [--shots dir]

   Needs Playwright and a Chromium (CHROME or /opt/pw-browsers/chromium-1243/chrome-linux64/chrome). It serves the
   repo itself on a free port and blocks service workers. Exit code 1 on any failure. Not part of CI; run it after
   any change to the tool's layout, labels or wording (one width per process keeps each run short). */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
let require = createRequire(join(ROOT, 'package.json'));
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { require = createRequire('/opt/npm-tools/node_modules/'); ({ chromium } = require('playwright')); }
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const p = join(ROOT, normalize(decodeURIComponent(req.url.split('?')[0])));
  if (!p.startsWith(ROOT) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const launch = () => chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
async function open(browser, o) {
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, serviceWorkers: 'block', deviceScaleFactor: 1, colorScheme: o.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.route(/supabase|umami|api\.levlprep|polar/, r => r.abort());
  await page.addInitScript((cue) => { try { if (!cue) ['tk2c:ochem-v3-shape', 'tk2c:ochem-v3-hand'].forEach(k => localStorage.setItem(k, '1')); } catch (e) {} }, !!o.cue);
  await page.goto(BASE + '/ochem/tools/viewer-3d.html' + (o.query || ''), { waitUntil: 'load' });
  await page.waitForTimeout(800);
  return { page, errs };
}
const args = process.argv.slice(2), si = args.indexOf('--shots'), SHOTS = si >= 0 ? args[si + 1] : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const shot = (loc, name) => SHOTS ? loc.screenshot({ path: join(SHOTS, name) }) : null;
const WIDTHS = (args[0] && !args[0].startsWith('--') ? args[0] : '360,390,430,600,768,820,1024,1280,1440,1920').split(',').map(Number);
const TURNS = [null, [0, 0], [-1.2, 1.0], [0.6, 2.4], [1.3, 4.0]];
const HAND_TURNS = [null, 'back', [0, 0], [-0.9, 2.2], [0.5, 4.4], [1.2, 1.0], [-0.35, 0.6], [0.3, 5.5]];

/* everything one state is checked for, in the page */
const probe = (o) => {
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none' && !e.closest('[hidden]') && !(e.closest('g') && getComputedStyle(e.closest('g')).display === 'none');
  const S = R(document.querySelector('.v3-scene')), out = [];
  const inS = (x, name, tol = 0.6) => { if (x.l < S.l - tol || x.r > S.r + tol || x.t < S.t - tol || x.b > S.b + tol) out.push('clipped: ' + name + ' ' + [x.l - S.l, S.r - x.r, x.t - S.t, S.b - x.b].map(v => v.toFixed(0)).join(',')); };
  const hit = (a, c, g = 0) => !(a.r + g <= c.l || c.r + g <= a.l || a.b + g <= c.t || c.b + g <= a.t);
  const q = s => [...document.querySelectorAll(s)].filter(vis);
  const groups = o.tab === 'hand' ? ['.v3-molA', '.v3-molB'] : ['.v3-molA'];
  const balls = groups.map(g => q(g + ' .v3-ball').map(R));
  balls.flat().forEach(x => inS(x, 'a ball'));
  const letters = q('.v3-al').map(e => ({ t: e.textContent, r: R(e), fs: parseFloat(e.getAttribute('font-size')) }));
  letters.forEach(x => { inS(x.r, 'letter ' + x.t); if (x.fs < 11) out.push('letter "' + x.t + '" at ' + x.fs + ' px'); });
  const labs = q('.v3-lab').map(e => ({ t: e.textContent, c: e.className, r: R(e), fs: parseFloat(getComputedStyle(e).fontSize) }));
  const card = q('.tk2-spot-card').map(e => ({ t: e.textContent, c: 'card', r: R(e), fs: parseFloat(getComputedStyle(e).fontSize) }));
  const names = labs.concat(card);
  names.forEach(x => { inS(x.r, 'label "' + x.t + '"'); if (x.fs < 11) out.push('label "' + x.t + '" at ' + x.fs + ' px'); });
  const ctl = q('.v3-pick, .v3-btn').map(e => ({ n: e.className, r: R(e) }));
  ctl.forEach(c => inS(c.r, c.n));
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) if (hit(names[i].r, names[j].r, 4)) out.push('labels overlap: "' + names[i].t + '" and "' + names[j].t + '"');
  names.forEach(x => ctl.forEach(c => { if (hit(x.r, c.r, 4)) out.push('label "' + x.t + '" on a control (' + c.n + ')'); }));
  // a name never sits on the letters of an atom drawn in front (a letter shown is an atom you can see)
  names.forEach(x => letters.forEach(l => { if (hit(x.r, l.r, 1)) out.push('label "' + x.t + '" over the letter "' + l.t + '"'); }));
  // review round 1: no label on a ball, a stick, the angle's arc or the reading arrow (true shapes, 2 px clear)
  const offX = 0, rc = (b, x, y, r) => { const dx = Math.max(b.l - x, 0, x - b.r), dy = Math.max(b.t - y, 0, y - b.b); return dx * dx + dy * dy < r * r; };
  const circ = [];
  groups.forEach(g => q(g + ' .v3-ball').forEach(e => { const r = R(e); circ.push({ x: (r.l + r.r) / 2, y: (r.t + r.b) / 2, r: r.w / 2, what: 'a ball' }); }));
  groups.forEach(g => q(g + ' .v3-bo').forEach(e => { const m = e.getCTM(), sw = parseFloat(e.getAttribute('stroke-width')) / 2, svgR = e.ownerSVGElement.getBoundingClientRect();
    const x1 = +e.getAttribute('x1') + svgR.left, y1 = +e.getAttribute('y1') + svgR.top, x2 = +e.getAttribute('x2') + svgR.left, y2 = +e.getAttribute('y2') + svgR.top, n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 3));
    for (let j = 0; j <= n; j++) circ.push({ x: x1 + (x2 - x1) * j / n, y: y1 + (y2 - y1) * j / n, r: sw, what: 'a stick' }); }));
  q('.v3-read, .v3-arc').forEach(e => { const svgR = e.ownerSVGElement.getBoundingClientRect(), L = e.getTotalLength(), n = Math.max(2, Math.ceil(L / 3)), arrow = e.classList.contains('v3-read');
    for (let j = 0; j <= n; j++) { const p = e.getPointAtLength(L * j / n); circ.push({ x: p.x + svgR.left, y: p.y + svgR.top, r: j === n && arrow ? 6 : 2, what: arrow ? 'the reading arrow' : 'the arc' }); } });
  labs.forEach(x => { const c = circ.find(c => rc(x.r, c.x, c.y, c.r + 2)); if (c) out.push('label "' + x.t + '" on ' + c.what); });
  card.forEach(x => { const c = circ.find(c => c.what !== 'a stick' && rc(x.r, c.x, c.y, c.r)); if (c) out.push('the card on ' + c.what); });
  if (o.tab === 'hand') { const n = labs.filter(x => /is-prio/.test(x.c)).length; if (n !== 8) out.push(n + ' priority numbers shown, not 8'); }
  // the molecule is the largest thing
  const uni = a => a.length ? { l: Math.min(...a.map(x => x.l)), t: Math.min(...a.map(x => x.t)), r: Math.max(...a.map(x => x.r)), b: Math.max(...a.map(x => x.b)) } : null;
  const area = u => u ? (u.r - u.l) * (u.b - u.t) : 0, M = uni(balls[0].concat(o.tab === 'shape' ? q('.v3-molA .v3-lpb').map(R) : [])), share = area(M) / (S.w * S.h);
  if (!M) out.push('no molecule drawn');
  else { const big = names.map(x => area(x.r)).concat(ctl.map(c => area(c.r))); if (big.some(a => a >= area(M))) out.push('the molecule is not the largest object'); }
  // the words agree with the frame
  const st = window.OchemViewer3DModel.view.state(), Mo = window.OchemViewer3DModel;
  const cz = q('.tk2-cz').map(e => e.textContent);
  if (o.tab === 'shape' && !o.drill) {
    const mol = window.OchemMol3DLibrary.get(st.mol), r = Mo.readAtom(mol, st.sel);
    const c0 = card[0];
    if (!c0) out.push('no card'); else if (c0.t !== r.name) out.push('card "' + c0.t + '" for ' + r.name);
    const ang = labs.filter(x => /is-angle/.test(x.c))[0];
    if (r.shape) {
      // the angle is named whenever its arc can be seen (an arc seen exactly edge on, behind its atom, has no name)
      const arcEl = document.querySelector('.v3-arc'), seen = arcEl && getComputedStyle(arcEl).display !== 'none' && arcEl.getAttribute('data-seen') === '1';
      if (!ang && st.style !== 'space' && seen) out.push('no angle shown');
      if (ang && !seen) out.push('an angle shown with its arc out of sight');
      // recheck 1: the number sits within 40 px of its arc, or a leader joins them
      if (ang && seen) {
        const L = arcEl.getTotalLength(), sr = arcEl.ownerSVGElement.getBoundingClientRect(); let dmin = 1e9;
        for (let j = 0; j <= 60; j++) { const p = arcEl.getPointAtLength(L * j / 60), x = p.x + sr.left, y = p.y + sr.top;
          dmin = Math.min(dmin, Math.hypot(Math.max(ang.r.l - x, 0, x - ang.r.r), Math.max(ang.r.t - y, 0, y - ang.r.b))); }
        const lead = document.querySelector('.v3-alead'), led = lead && getComputedStyle(lead).display !== 'none';
        if (dmin > 42 && !led) out.push('angle "' + ang.t + '" ' + dmin.toFixed(0) + ' px from its arc, no leader');
        if (dmin <= 40 && led) out.push('a leader on an angle already beside its arc');
      }
      if (ang && !cz[cz.length - 1].endsWith(ang.t)) out.push('angle "' + ang.t + '" but the line says "' + cz[cz.length - 1] + '"');
      if (!cz.some(t => t.indexOf(r.shape.m.toLowerCase()) === 0)) out.push('cause line does not name ' + r.shape.m);
    } else if (ang) out.push('an angle shown for an end atom');
  }
  if (o.tab === 'hand') {
    const mol = window.OchemMol3DLibrary.get('chiral-carbon'), pr = Mo.priorities(mol, 0);
    const hd = Mo.rotate((() => { const a = mol.atoms[pr[3]].pos, c = mol.atoms[0].pos, d = { x: a.x - c.x, y: a.y - c.y, z: a.z - c.z }, l = Math.hypot(d.x, d.y, d.z); return { x: d.x / l, y: d.y / l, z: d.z / l }; })(), st.hand.rx, st.hand.ry);
    const back = -hd.z >= Mo.BACK;
    const cfgs = labs.filter(x => /is-cfg/.test(x.c));
    if (!back && cfgs.length) out.push('R or S shown with the H not at the back');
    if (back && cfgs.length !== 2) out.push('H at the back but ' + cfgs.length + ' letters shown');
    // read the turn from the balls on screen (DOM order is depth order: find each atom's circle by its letter)
    const read = g => {
      const cs = [...document.querySelectorAll(g + ' .v3-atom')].map(a => ({ t: a.querySelector('text').textContent, c: a.querySelector('circle') }));
      const at = el => { const x = cs.filter(y => y.t === el)[0].c; return [+x.getAttribute('cx'), +x.getAttribute('cy')]; };
      const P = ['Br', 'Cl', 'F'].map(at), cr = (P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[1][1] - P[0][1]) * (P[2][0] - P[0][0]);
      return cr > 0 ? 'R' : 'S';
    };
    if (back && cfgs.length === 2) {
      const a = read('.v3-molA'), b = read('.v3-molB');
      if (a === b) out.push('the mirror image reads the same as the molecule');
      if (!cfgs.some(x => x.t === a) || !cfgs.some(x => x.t === b)) out.push('letters ' + cfgs.map(x => x.t).join(',') + ' but the balls read ' + a + ' and ' + b);
      if (cz.indexOf(a) < 0) out.push('cause line does not say ' + a);
    }
    if (!back && !cz.some(t => /not at the back/.test(t))) out.push('cause line does not say the H is not at the back');
  }
  const rows = new Set(q('.tk2-cz').map(e => Math.round(R(e).t))).size, cause = R(document.querySelector('.tk2-cause'));
  if (innerWidth <= 640 && rows > 2) out.push('cause line is ' + rows + ' rows: ' + document.querySelector('.tk2-cause').innerText.replace(/\n/g, ' '));
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  return { out, share, causeH: Math.round(cause.h) };
};

const b = await launch();
let checks = 0, states = 0; const fails = [], minShare = {};
for (const w of WIDTHS) {
  const h = w <= 430 ? 844 : w <= 820 ? 1024 : w >= 1920 ? 1080 : 900;
  // first visit: the cue on both tabs
  {
    const c = await open(b, { w, h, cue: true });
    const cueCheck = () => c.page.evaluate(() => { const R = e => e.getBoundingClientRect(), q = document.querySelector('.tk2-cue'); if (!q) return ['no cue shown'];
      const r = R(q), S = R(document.querySelector('.v3-scene')), out = [];
      if (r.left < S.left || r.right > S.right || r.top < S.top || r.bottom > S.bottom) out.push('the cue is clipped by the stage');
      [...document.querySelectorAll('.v3-lab, .tk2-spot-card, .v3-pick, .v3-btn, .v3-ball')].filter(e => e.getClientRects().length && !e.closest('[hidden]')).forEach(e => { const x = R(e); if (!(r.right <= x.left || x.right <= r.left || r.bottom <= x.top || x.bottom <= r.top)) out.push('the cue covers "' + (e.textContent.trim() || e.getAttribute('class')) + '"'); });
      return out; });
    states++; checks += 2; (await cueCheck()).forEach(m => fails.push(`${w} first visit, Shape: ${m}`));
    await shot(c.page.locator('.v3-scene'), `${String(w).padStart(4, '0')}-0-cue-1.png`);
    await c.page.locator('.tk2-tab[data-v="hand"]').click({ force: true }); await c.page.waitForTimeout(600);
    states++; checks += 2; (await cueCheck()).forEach(m => fails.push(`${w} first visit, Handedness: ${m}`));
    await shot(c.page.locator('.v3-scene'), `${String(w).padStart(4, '0')}-0-cue-2.png`);
    await c.page.context().close();
  }
  const { page, errs } = await open(b, { w, h });
  const heights = new Set(); let lo = 9;
  const check = async (o, what) => {
    await page.waitForTimeout(40);
    const r = await page.evaluate(probe, o); states++; checks += 12;
    r.out.forEach(m => fails.push(`${w} ${what}: ${m}`));
    if (w <= 640) heights.add(r.causeH);
    lo = Math.min(lo, r.share);
    const floor = o.tab === 'hand' ? (w <= 640 ? 0.025 : 0.03) : (w <= 640 ? 0.06 : 0.035);
    if (r.share < floor) fails.push(`${w} ${what}: the molecule is ${(r.share * 100).toFixed(1)}% of the stage (floor ${floor * 100}%)`);
  };
  {
    // review round 1: a mouse drag over the picture selects no text; Reset view has a name at every width
    const sb = await page.locator('.v3-scene').boundingBox();
    await page.mouse.move(sb.x + sb.width * 0.3, sb.y + sb.height * 0.5); await page.mouse.down();
    await page.mouse.move(sb.x + sb.width * 0.9, sb.y + sb.height * 0.2, { steps: 8 }); await page.mouse.move(sb.x + sb.width * 0.5, sb.y + sb.height + 120, { steps: 6 }); await page.mouse.up();
    const sel = await page.evaluate(() => String(window.getSelection()));
    checks++; if (sel.trim()) fails.push(`${w}: a mouse drag selected "${sel.trim().slice(0, 40)}"`);
    const nm = await page.evaluate(() => { const b = [...document.querySelectorAll('.v3-btn')].find(e => /Reset/.test(e.textContent)); return b.getAttribute('aria-label') || b.innerText.trim(); });
    checks++; if (!/Reset view/.test(nm)) fails.push(`${w}: Reset view has no name`);
    await page.locator('.v3-btn', { hasText: 'Reset view' }).click(); await page.waitForTimeout(700);
  }
  const ids = await page.evaluate(() => window.OchemMol3DLibrary.ALL.map(m => m.id));
  for (const id of ids) {
    await page.locator('.v3-pick select').selectOption(id);
    await page.waitForFunction(() => window.OchemViewer3DModel.view.state().ready, null, { timeout: 5000 }); await page.waitForTimeout(80);
    for (const t of TURNS) {
      if (t) { await page.evaluate(([rx, ry]) => window.OchemViewer3DModel.view.turn(rx, ry), t); }
      await check({ tab: 'shape' }, `${id} ${t ? t.join('/') : 'home'}`);
      if (!t && ['ammonia', 'water', 'sulfur-hexafluoride', 'phosphorus-pentachloride', 'formamide'].includes(id)) await shot(page.locator('.v3'), `${String(w).padStart(4, '0')}-1-${id}.png`);
    }
    if (['methane', 'acetonitrile', 'methanol', 'benzene-3d'].includes(id)) {
      // an end atom, then a second centre where there is one
      await page.evaluate(() => { const V = window.OchemViewer3DModel.view, m = window.OchemMol3DLibrary.get(V.state().mol); const i = m.atoms.findIndex((a, k) => k !== m.focus && a.el === 'H'); V.select(i); });
      await page.waitForTimeout(60); await page.waitForFunction(() => window.OchemViewer3DModel.view.state().ready, null, { timeout: 5000 }); await page.waitForTimeout(60);
      await check({ tab: 'shape' }, `${id} end atom`);
    }
  }
  await page.locator('.tk2-tab[data-v="hand"]').click(); await page.waitForTimeout(500);
  for (const t of HAND_TURNS) {
    if (t === 'back') { await page.locator('.v3-btn', { hasText: 'H to the back' }).click(); await page.waitForTimeout(900); }
    else if (t) await page.evaluate(([rx, ry]) => window.OchemViewer3DModel.view.turn(rx, ry), t);
    await check({ tab: 'hand' }, `hand ${t ? (t.join ? t.join('/') : t) : 'home'}`);
    if (t === 'back' || !t) await shot(page.locator('.v3'), `${String(w).padStart(4, '0')}-2-hand-${t || 'home'}.png`);
  }
  // Name the shape: the question hides the answer, then shows it
  await page.locator('.tk2-tab[data-v="shape"]').click(); await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Test yourself' }).click(); await page.waitForTimeout(500);
  for (let k = 0; k < 3; k++) {
    const srBad = await page.evaluate(() => { const V = window.OchemViewer3DModel, st = V.view.state(), m = window.OchemMol3DLibrary.get(st.mol), r = V.readAtom(m, st.sel);
      const t = (document.querySelector('.tk2-sr').textContent + ' ' + (document.querySelector('.v3-turn').getAttribute('aria-label') || '')).toLowerCase();
      return [r.shape.m.toLowerCase(), m.name.toLowerCase(), 'lone pair', 'groups'].filter(w => t.indexOf(w) >= 0); });
    checks++; if (srBad.length) fails.push(`${w} drill ${k}: the screen reader text gives away "${srBad.join(', ')}"`);
    const hidden = await page.evaluate(() => !document.querySelector('.tk2-spot-card:not([hidden])') && !document.querySelector('.v3-lab.is-angle:not([hidden])') && ![...document.querySelectorAll('.v3-al')].some(e => getComputedStyle(e).display !== 'none'));
    checks++; if (!hidden) fails.push(`${w} drill ${k}: the answer shows before Check`);
    const r = await page.evaluate(probe, { tab: 'shape', drill: true }); states++; checks += 12;
    r.out.filter(m => !/no card|no angle|cause line/.test(m)).forEach(m => fails.push(`${w} drill ${k}: ${m}`));
    if (k === 0) await shot(page.locator('.v3-scene'), `${String(w).padStart(4, '0')}-3-drill.png`);
    await page.locator('.v3q [data-shape]').first().click();
    const a = page.locator('.v3q [data-angle]'); if (await a.count()) await a.first().click();
    await page.locator('#v3Check').click(); await page.waitForTimeout(500);
    const r2 = await page.evaluate(probe, { tab: 'shape' }); states++; checks += 12;
    r2.out.forEach(m => fails.push(`${w} drill ${k} answered: ${m}`));
    await page.locator('#v3Next').click(); await page.waitForTimeout(300);
  }
  if (w <= 640) { checks++; if (heights.size !== 1) fails.push(`${w}: cause line height not constant: ${[...heights]}`); }
  minShare[w] = (lo * 100).toFixed(1) + '%';
  const real = errs.filter(e => !/ERR_FAILED/.test(e)); checks++; if (real.length) fails.push(`${w}: console ${real.join('|')}`);
  await page.context().close();
}
await b.close();
const uniq = [...new Set(fails)];
console.log(`states ${states}, checks ${checks}, failures ${uniq.length}`); console.log('molecule share (min):', JSON.stringify(minShare));
const kinds = {}; uniq.forEach(f => { const k = f.replace(/^\d+ [^:]*: /, '').replace(/".*?"/g, '""').replace(/[-\d.,]+/g, '#'); kinds[k] = (kinds[k] || 0) + 1; });
console.log(Object.entries(kinds).sort((a, c) => c[1] - a[1]).slice(0, 25).map(([k, n]) => n + ' x ' + k).join('\n'));
console.log(uniq.slice(0, 30).join('\n'));
server.close();
process.exit(uniq.length ? 1 : 0);
