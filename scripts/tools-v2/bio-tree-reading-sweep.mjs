#!/usr/bin/env node
/* Tools v2 sweep: AP Biology, Phylogenetic tree reading (docs/tools-v2-bio-tree-reading-brief.md; pattern of
   scripts/tools-v2/bio-descriptive-stats-sweep.mjs).
   Landmark states (the opening with its cue; sister taxa; a pair that is not a clade; a pair compared with the one
   before; three tips; a rotated tree; the plant tree; the primate DNA tree; one trait; every trait; the plant traits on
   a rotated tree; Place the traits checked; Build a tree; the questions; "?"), at widths 360 to 1920, light and dark
   (dark asserted to render dark):
     - no sideways scroll; nothing clipped by the scene (names, the pill, tick labels, chips, the cue);
     - labels never overlap each other or a node's number (4 px) and keep 2 px from other organisms;
     - no rendered text under 11 px; tap targets 44 px; phones: the cause line at most two rows, constant height;
     - the picture is the largest thing; the picture, the tips and the cause line fit the window together at load
       (and at 375 x 667, 360 x 740, 390 x 844, 1024 x 768, 1280 x 800);
     - AGREE: everything shown agrees with what is DRAWN: the tapped tips (read from the picture), their common
       ancestor's knot, the pill beside it, the glowing branches (each joins the drawn knots), the cause line, "a
       clade" and "sister taxa" only when true; each tick on the branch of its trait, the rings on exactly the tips
       that inherit the newest trait, the chips pressed for exactly the ticks drawn;
   and, frame by frame at 390 and 1440 (--frames): the glow growing (the ancestor is named only once it is reached),
   a node swing (the pill and glow follow the knots on every frame, moving names hidden, then back), fast reversed
   rotations, a trait's climb and its paint, a trait taken off mid climb, Start over mid swing, leaving to Test yourself
   mid animation and back, real touch taps on every tip and node (at 360 and 390), keys, reduced motion, the real
   locked state. --perf: CPU x4 frame times beside the flagship. --shots <dir>: contact shots and mid animation.
   Usage: node scripts/tools-v2/bio-tree-reading-sweep.mjs [--width <px>] [--frames] [--perf] [--shots <dir>]
   With no --width it runs each of the ten widths in its own process, then the frame checks.
   Needs playwright (PW_ROOT names a folder whose node_modules has it) and Chromium (CHROMIUM_PATH). */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, mkdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const WIDTHS = [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
const VH = { 360: 780, 390: 844, 430: 932, 600: 960, 768: 1024, 820: 1180, 1024: 768, 1280: 800, 1440: 900, 1920: 1080 };
const ONE = arg('--width', null), FRAMES = process.argv.includes('--frames'), PERF = process.argv.includes('--perf'), SHOTS = arg('--shots', null);

if (!ONE && !FRAMES && !PERF) {
  let pass = 0, fail = 0, bad = false;
  const runs = WIDTHS.map(w => ['--width', String(w)]).concat([['--frames']]);
  for (const a of runs) {
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...a, ...(SHOTS ? ['--shots', SHOTS] : [])], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
    process.stdout.write(r.stdout);
    const m = /(\d+) passed, (\d+) failed/.exec(r.stdout || '');
    if (m) { pass += +m[1]; fail += +m[2]; } else bad = true;
  }
  console.log(`\nbio-tree-reading sweep, all runs: ${pass} passed, ${fail} failed${bad ? ' (a run did not finish)' : ''}`);
  process.exit(fail || bad ? 1 : 0);
}

let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) {
  const roots = [process.env.PW_ROOT, '/opt/npm-tools', '/home/claude/testaolivier10-del.github.io'].filter(Boolean);
  for (const r of roots) { try { ({ chromium } = createRequire(r + '/')('playwright')); break; } catch (e2) {} }
  if (!chromium) { console.error('This sweep needs playwright (set PW_ROOT).'); process.exit(0); }
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
const URL0 = `http://localhost:${PORT}/bio/tools/tree-reading.html`;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

let pass = 0; const fails = [];
const ok = (c, msg) => { if (c) pass++; else fails.push(msg); };

async function open(w, dark, opts = {}) {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: w, height: opts.h || VH[w] || 900 }, serviceWorkers: 'block', hasTouch: w < 500, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
  // the tool is Premium: unlocked in this test only (never committed to the page)
  if (!opts.locked) await ctx.route(u => u.href.includes('/assets/premium.js'), async r => { const resp = await r.fetch(); const body = (await resp.text()).replace('function has(course) {', 'function has(course) { return true;'); await r.fulfill({ response: resp, body }); });
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.addInitScript(([dark, noCue]) => { try { if (dark) localStorage.setItem('nremt_theme', 'dark'); if (noCue) { localStorage.setItem('tk2c:apbio-tree', '1'); localStorage.setItem('tk2c:apbio-tree-traits', '1'); } } catch (e) {} }, [dark, !!opts.noCue]);
  await page.goto(URL0 + (opts.hash || ''));
  if (!opts.locked) { await page.waitForSelector(opts.hash === '#build' ? '.tr2-bstage' : '.tr2-tip', { timeout: 15000 }); await page.waitForTimeout(900); }
  return { browser, ctx, page, errs };
}
async function until(page, fn, a) { for (let i = 0; i < 120; i++) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(40); } return false; }
const still = (page) => until(page, () => !window.__tr2.busy());

/* Everything shown agrees with what is drawn (runs in the page). */
const AGREE = () => {
  const X = window.__tr2, P = X.P, r = X.root(), t = X.tree(), St = X.St, out = [];
  const num = (e, a) => +e.getAttribute(a);
  const knots = {}; document.querySelectorAll('.tr2-node').forEach(g => { const c = g.querySelector('.tr2-knot'); knots[g.getAttribute('data-node')] = { x: num(c, 'cx'), y: num(c, 'cy'), r: num(c, 'r'), m: g.classList.contains('is-m') }; });
  const pads = {}; document.querySelectorAll('.tr2-tip').forEach(g => { const p = g.querySelector('.tr2-pad'); pads[g.getAttribute('data-tip')] = { x: num(p, 'cx'), y: num(p, 'cy') - 1 }; });
  const at = (nd) => nd.kids.length ? knots[nd.id] : pads[nd.name];
  const name = (id) => { const x = t.taxa.find(y => y.id === id); return (x.short || x.name).toLowerCase(); };
  // every limb joins what is drawn: tips in the order the model has them, each knot over the middle of its children
  const xs = P.leaves(r).map(l => pads[l.name].x);
  for (let i = 1; i < xs.length; i++) if (!(xs[i] > xs[i - 1])) out.push('tips not drawn in the model order');
  P.internal(r).forEach(nd => { const m = nd.kids.reduce((s, k) => s + at(k).x, 0) / nd.kids.length; if (Math.abs(m - knots[nd.id].x) > 0.15) out.push(`knot ${nd.id} not over its children`); });
  const cause = document.querySelector('.tr2 .tk2-cause'), ctext = cause ? cause.textContent : '', take = cause && cause.classList.contains('is-take');
  if (St.mode === 'explore' && St.tab === 'anc') {
    const sel = [...document.querySelectorAll('.tr2-tip.is-sel')].map(g => g.getAttribute('data-tip')).sort();
    if (sel.join() !== St.sel.slice().sort().join()) out.push('tapped tips drawn differ from the taps');
    const pill = document.querySelector('.tr2-pill'), pon = pill.getAttribute('opacity') === '1';
    const mk = Object.keys(knots).filter(k => knots[k].m);
    if (sel.length >= 2) {
      const m = P.mrca(r, sel), c = P.classify(r, sel);
      if (pon) {
        if (mk.length !== 1 || +mk[0] !== m.id) out.push(`ancestor knot ${mk} vs model ${m.id}`);
        const rc = pill.querySelector('rect'), b = [num(rc, 'x'), num(rc, 'y'), num(rc, 'x') + num(rc, 'width'), num(rc, 'y') + num(rc, 'height')], k = knots[m.id];
        const dx = Math.max(b[0] - k.x, 0, k.x - b[2]), dy = Math.max(b[1] - k.y, 0, k.y - b[3]);
        if (Math.hypot(dx, dy) > k.r + 30) out.push(`the pill is ${Math.hypot(dx, dy).toFixed(0)} px from the ancestor`);
        const w2 = (pill.getAttribute('data-words') || '|').split('|')[1], sis = sel.length === 2 && m.kids.length === 2 && m.kids.every(x => !x.kids.length);
        const want = c.kind === 'clade' ? (sis ? 'sister taxa' : 'a clade') : '';
        if (w2 !== want) out.push(`pill says "${w2}", want "${want}"`);
        // the glowing branches: exactly the way down from each tapped tip to the ancestor, each joining drawn points
        const want2 = new Set(); sel.forEach(id => { let nd = P.find(r, [id]); while (nd && nd !== m) { want2.add(nd.kids.length ? 'n' + nd.id : 't' + nd.name); nd = nd.parent; } });
        const lit = [...document.querySelectorAll('.tr2-glow')].filter(e => e.getAttribute('opacity') === '1');
        const litK = new Set(lit.map(e => e.getAttribute('data-k')));
        if ([...want2].some(k => !litK.has(k)) || [...litK].some(k => !want2.has(k))) out.push(`glow on ${[...litK]} vs ${[...want2]}`);
        lit.forEach(e => { if (parseFloat(e.style.strokeDashoffset) > 0.001) out.push('a lit branch not fully lit while the pill shows'); });
        lit.forEach(e => {
          const k = e.getAttribute('data-k'), nd = P.nodes(r).find(n => (n.kids.length ? 'n' + n.id : 't' + n.name) === k), a = at(nd), p = knots[nd.parent.id];
          const L = e.getTotalLength(), s = e.getPointAtLength(0), f = e.getPointAtLength(L);
          if (Math.hypot(s.x - a.x, s.y - a.y) > 1.2 || Math.hypot(f.x - p.x, f.y - p.y) > 1.2) out.push(`glow ${k} does not join its drawn ends`);
        });
        if (!take) {
          sel.forEach(id => { if (sel.length <= 3 && !ctext.includes(name(id))) out.push(`cause line lacks ${name(id)}`); });
          const mm = /common ancestor (\d+)/.exec(ctext); if (!mm || +mm[1] !== m.id) out.push(`cause line ancestor ${mm && mm[1]} vs ${m.id}`);
          const dn = /([\d.]+)% of DNA/.exec(ctext); if (dn && Math.abs(+dn[1] - P.distance(r, sel[0], sel[1])) > 0.051) out.push('DNA difference wrong');
          if (/not a clade/.test(ctext) && c.kind === 'clade') out.push('says not a clade for a clade');
          if (/(^|→)a clade/.test(ctext) && c.kind !== 'clade') out.push('says a clade for a non clade');
        }
      } else if (!take && /common ancestor \d/.test(ctext)) out.push('the cause line names the ancestor before the pill shows');
    } else {
      if (pon) out.push('a pill with fewer than two tips');
      if (!take && /common ancestor \d/.test(ctext)) out.push('ancestor named with fewer than two tips');
    }
  }
  if (St.mode === 'explore' && St.tab === 'traits') {
    const ticks = [...document.querySelectorAll('.tr2-tick')].filter(g => +g.getAttribute('opacity') > 0.99);
    const on = [...document.querySelectorAll('.tr2-chip[aria-pressed="true"]')].map(b => b.getAttribute('data-ch')).sort();
    if (ticks.map(g => g.getAttribute('data-cid')).sort().join() !== on.join()) out.push(`chips pressed ${on} vs ticks drawn ${ticks.map(g => g.getAttribute('data-cid'))}`);
    ticks.forEach(g => {
      const c = t.characters.find(x => x.id === g.getAttribute('data-cid')), nd = P.find(r, c.has), b = g.querySelector('.tr2-bar');
      if (g.getAttribute('data-br') !== c.has.slice().sort().join(',')) out.push(`${c.id} tick on the wrong branch`);
      if (b.getAttribute('opacity') !== '1') return;
      const x = num(b, 'x') + num(b, 'width') / 2, y = num(b, 'y') + num(b, 'height') / 2, h = document.querySelector(`.tr2-halo[data-k="${nd.kids.length ? 'n' + nd.id : 't' + nd.name}"]`);
      let best = 1e9; const L = h.getTotalLength(); for (let i = 0; i <= 80; i++) { const p = h.getPointAtLength(L * i / 80); best = Math.min(best, Math.hypot(p.x - x, p.y - y)); }
      if (best > 2) out.push(`${c.id} tick ${best.toFixed(1)} px off its branch`);
    });
    const rings = [...document.querySelectorAll('.tr2-tip')].filter(g => +g.querySelector('.tr2-ring').getAttribute('opacity') > 0.99).map(g => g.getAttribute('data-tip')).sort();
    const nw = St.traits[t.id] && St.traits[t.id].length ? t.characters.find(x => x.id === St.traits[t.id][St.traits[t.id].length - 1]) : null;
    if (nw && rings.join() !== nw.has.slice().sort().join()) out.push(`rings on ${rings}, want ${nw.has}`);
    if (!nw && rings.length) out.push('rings with no trait');
    if (nw && !take && !ctext.includes(nw.short)) out.push('cause line lacks the newest trait');
  }
  return out;
};

/* Layout checks of the current state (runs in the page). */
const LAYOUT = ([w]) => {
  const out = [], scene = document.querySelector('.tr2-scene'), sr = scene.getBoundingClientRect();
  const vis = (e) => { if (!e) return false; for (let x = e; x && x.nodeType === 1; x = x.parentNode) { if (x.getAttribute && (x.getAttribute('opacity') === '0' || x.hidden)) return false; const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden') return false; } return true; };
  if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push('sideways scroll');
  const box = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, e }; };
  const labels = [];
  document.querySelectorAll('.tr2-tip .tr2-name').forEach(g => { if (vis(g)) labels.push({ ...box(g.querySelector('.tr2-nt')), k: 'name ' + g.parentNode.getAttribute('data-tip') }); });
  const pill = document.querySelector('.tr2-pill'); if (pill && vis(pill)) labels.push({ ...box(pill.querySelector('rect')), k: 'pill' });
  document.querySelectorAll('.tr2-tick .tr2-tl').forEach(g => { if (vis(g) && vis(g.parentNode)) labels.push({ ...box(g.querySelector('rect')), k: 'tick ' + g.parentNode.getAttribute('data-cid') }); });
  const nums = []; document.querySelectorAll('.tr2-node .tr2-knot').forEach(c => { if (vis(c)) nums.push({ ...box(c), k: 'knot ' + c.parentNode.getAttribute('data-node') }); });
  const orgs = []; document.querySelectorAll('.tr2-tip').forEach(g => { const u = g.querySelector('.tr2-org, .tr2-disc'); if (u) orgs.push({ ...box(u), k: 'org ' + g.getAttribute('data-tip') }); });
  const chips = [...document.querySelectorAll('.tr2-chip')].filter(vis).map(b => ({ ...box(b), k: 'chip ' + b.getAttribute('data-ch') }));
  const cueEl = document.querySelector('.tr2 .tk2-cue'); const cue = cueEl && vis(cueEl) ? { ...box(cueEl), k: 'cue' } : null;
  const inside = (b) => b.l >= sr.left - 0.5 && b.r <= sr.right + 0.5 && b.t >= sr.top - 0.5 && b.b <= sr.bottom + 0.5;
  labels.concat(nums, orgs, chips, cue ? [cue] : []).forEach(b => { if (!inside(b)) out.push(`${b.k} clipped by the scene`); });
  const gap = (a, b) => Math.max(a.l - b.r, b.l - a.r, a.t - b.b, b.t - a.b);
  for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) if (gap(labels[i], labels[j]) < 4) out.push(`${labels[i].k} touches ${labels[j].k}`);
  labels.forEach(a => nums.forEach(n => { if (gap(a, n) < 4) out.push(`${a.k} touches ${n.k} (${gap(a, n).toFixed(1)}: ${[a.l, a.t, a.r, a.b].map(Math.round)} vs ${[n.l, n.t, n.r, n.b].map(Math.round)})`); }));
  labels.forEach(a => orgs.forEach(o => { if (a.k !== 'name ' + o.k.slice(4) && gap(a, o) < 2) out.push(`${a.k} on ${o.k}`); }));
  labels.forEach(a => chips.forEach(c => { if (gap(a, c) < 4) out.push(`${a.k} touches ${c.k}`); }));
  if (cue) labels.concat(nums).forEach(a => { if (gap(a, cue) < 2) out.push(`the cue covers ${a.k}`); });
  // text at least 11 px as rendered
  document.querySelectorAll('.tr2 text, .tr2 .tk2-cz, .tr2-chip, .tr2-tb, .tr2 .tk2-purpose').forEach(e => { if (!vis(e) || !e.textContent.trim()) return; const fs = parseFloat(getComputedStyle(e).fontSize) * (sr.width / (document.querySelector('.tr2-svg').viewBox.baseVal.width || sr.width)); if (fs < 10.95) out.push(`text "${e.textContent.slice(0, 20)}" ${fs.toFixed(1)} px`); });
  // 44 px targets
  [...document.querySelectorAll('.tr2-chip, .tr2-tb, .tr2-reset')].filter(vis).forEach(b => { const r = b.getBoundingClientRect(); if (r.height < 43.5) out.push(`target ${b.textContent} ${r.height.toFixed(0)} px tall`); });
  [...document.querySelectorAll('.tr2-key')].filter(b => !b.hidden).forEach(b => { const r = b.getBoundingClientRect(); if (r.height < 43.5 || r.width < 40) out.push(`key ${b.getAttribute('aria-label').slice(0, 20)} ${r.width.toFixed(0)}x${r.height.toFixed(0)}`); });
  // the picture is the largest thing on the stage
  const area = sr.width * sr.height;
  if (window.__tr2.St.mode === 'explore') document.querySelectorAll('.tr2 > *, .ls-dock > *').forEach(e => { if (e === scene || !vis(e)) return; const r = e.getBoundingClientRect(); if (r.width * r.height > area) out.push('something larger than the picture'); });
  // phones: the cause line at most two rows
  const cz = [...document.querySelectorAll('.tr2 .tk2-cause .tk2-cz')];
  if (w < 600 && cz.length) { const rows = new Set(cz.map(e => Math.round(e.getBoundingClientRect().top / 6))); if (rows.size > 2) out.push(`cause line ${rows.size} rows`); }
  const c = document.querySelector('.tr2 .tk2-cause');
  return { out, causeH: c && vis(c) ? Math.round(c.getBoundingClientRect().height) : null };
};

const STATES = [
  ['open', null],
  ['sisters', (X) => { X.tap('kangaroo'); X.tap('mouse'); }],
  ['pair', (X) => { X.tap('frog'); X.tap('lizard'); }],
  ['compare', async (X, w) => { X.tap('frog'); X.tap('lizard'); await w(); X.tap('lizard'); X.tap('shark'); }],
  ['three', (X) => { X.tap('shark'); X.tap('frog'); X.tap('mouse'); }],
  ['rotated', async (X, w) => { X.tap('frog'); X.tap('lizard'); await w(); X.rot(2); await w(); X.rot(4); await w(); X.rot(6); }],
  ['plants', async (X, w) => { X.setTree('plants'); await w(); X.tap('rose'); X.tap('grass'); }],
  ['plants-far', async (X, w) => { X.setTree('plants'); await w(); X.tap('alga'); X.tap('grass'); X.tap('moss'); }],
  ['primates', async (X, w) => { X.setTree('primates'); await w(); X.tap('human'); X.tap('chimp'); }],
  ['primates-cmp', async (X, w) => { X.setTree('primates'); await w(); X.tap('human'); X.tap('gorilla'); await w(); X.tap('gorilla'); X.tap('macaque'); await w(); X.rot(1); }],
  ['trait-one', async (X, w) => { X.tab('traits'); await w(); X.trait('limbs'); }],
  ['trait-all', async (X, w) => { X.tab('traits'); await w(); ['backbone', 'jaws', 'limbs', 'amnion', 'hair'].forEach(c => X.trait(c)); }],
  ['trait-rot', async (X, w) => { X.tab('traits'); await w(); ['backbone', 'jaws', 'limbs', 'amnion', 'hair'].forEach(c => X.trait(c)); await w(); X.rot(2); await w(); X.rot(5); await w(); X.rot(3); }],
  ['trait-plants', async (X, w) => { X.tab('traits'); await w(); X.setTree('plants'); await w(); ['embryo', 'vascular', 'seeds', 'flowers'].forEach(c => X.trait(c)); await w(); X.rot(1); await w(); X.rot(4); }],
];

if (ONE) {
  const w = +ONE;
  for (const dark of [false, true]) {
    const tag = `${w} ${dark ? 'dark' : 'light'}`;
    // the opening with its cue (a first visit)
    {
      const { browser, page, errs } = await open(w, dark);
      const isDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark' && getComputedStyle(document.querySelector('.tr2-scene')).backgroundColor !== 'rgb(230, 241, 244)');
      ok(isDark === dark, `${tag}: theme renders ${dark ? 'dark' : 'light'}`);
      ok(await page.evaluate(() => !!document.querySelector('.tr2 .tk2-cue')), `${tag}: first visit cue shown`);
      const L = await page.evaluate(LAYOUT, [w]); L.out.forEach(f => fails.push(`${tag} open: ${f}`)); if (!L.out.length) pass++;
      const A = await page.evaluate(AGREE); A.forEach(f => fails.push(`${tag} open: ${f}`)); if (!A.length) pass++;
      // the fit: the tips (the main control), the picture and the cause line in the window at load
      const fitOk = await page.evaluate(() => { const s = document.querySelector('.tr2-scene').getBoundingClientRect(), c = document.querySelector('.tr2 .tk2-cause').getBoundingClientRect(); return s.top >= 0 && s.bottom <= innerHeight && c.bottom <= innerHeight + 0.5; });
      ok(fitOk, `${tag}: picture and cause line fit the window`);
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/sweep-${w}-${dark ? 'dark' : 'light'}-00-open.png` });
      ok(!errs.length, `${tag}: console errors ${errs.join(' | ')}`);
      await browser.close();
    }
    const { browser, page, errs } = await open(w, dark, { noCue: true });
    const heights = new Set();
    for (const [name, fn] of STATES.slice(1)) {
      await page.evaluate(() => { const X = window.__tr2; X.stopAll(); X.St.traits = {}; if (X.St.tab !== 'anc') X.tab('anc'); ['plants', 'primates', 'vertebrates'].forEach(id => { X.setTree(id); X.reset(); X.stopAll(); }); X.St.lastPair = X.St.prevPair = null; });
      await page.evaluate(async (src) => { const X = window.__tr2, w = () => new Promise(r => { const t0 = performance.now(); (function k(){ if (!X.busy() || performance.now() - t0 > 3000) r(); else requestAnimationFrame(k); })(); }); await w(); await (0, eval)(src)(X, w); }, fn.toString());
      await still(page); await page.waitForTimeout(60);
      const L = await page.evaluate(LAYOUT, [w]); L.out.forEach(f => fails.push(`${tag} ${name}: ${f}`)); if (!L.out.length) pass++;
      const A = await page.evaluate(AGREE); A.forEach(f => fails.push(`${tag} ${name}: ${f}`)); if (!A.length) pass++;
      if (L.causeH) heights.add(L.causeH);
      if (SHOTS && (w === 390 || w === 768 || w === 1440 || w === 360 || w === 1024)) await page.screenshot({ path: `${SHOTS}/sweep-${w}-${dark ? 'dark' : 'light'}-${name}.png` });
    }
    if (w < 600) ok(heights.size <= 1, `${tag}: the cause line keeps one height (${[...heights]})`);
    // the cause line texts expected in two states
    await page.evaluate(() => { const X = window.__tr2; X.tab('anc'); X.setTree('vertebrates'); X.reset(); X.stopAll(); X.St.lastPair = X.St.prevPair = null; });
    await page.evaluate(() => { const X = window.__tr2; X.tap('frog'); X.tap('lizard'); X.stopAll(); X.tap('lizard'); X.tap('shark'); X.stopAll(); });
    ok(/less close than frog \+ lizard/.test(await page.evaluate(() => document.querySelector('.tr2 .tk2-cause').textContent)), `${tag}: frog + shark is less close than frog + lizard`);
    // Test yourself: Place the traits, checked with one wrong
    await page.evaluate(() => document.querySelector('.ls-modes [data-v="quiz"], [data-mode-btn="quiz"], .ls-mode[data-v="quiz"]') && 0);
    await page.goto('about:blank'); await page.goto(URL0 + '#place'); await page.waitForSelector('.tr2-tip'); await page.waitForTimeout(700);
    await page.evaluate(() => { const X = window.__tr2; X.place('backbone', 'frog,kangaroo,lamprey,lizard,mouse,shark'); X.place('jaws', 'frog,kangaroo,lizard,mouse,shark'); X.place('limbs', 'kangaroo,lizard,mouse'); });
    await still(page);
    { const L = await page.evaluate(LAYOUT, [w]); L.out.forEach(f => fails.push(`${tag} place: ${f}`)); if (!L.out.length) pass++; }
    if (SHOTS && (w === 390 || w === 1440)) await page.screenshot({ path: `${SHOTS}/sweep-${w}-${dark ? 'dark' : 'light'}-place.png` });
    await page.evaluate(() => document.querySelector('.tr2-pdock [data-c="check"]').click()); await still(page);
    ok(/2 of 5 placed/.test(await page.evaluate(() => document.querySelector('.tr2-pfb').textContent)), `${tag}: Place the traits grades 2 of 5`);
    { const L = await page.evaluate(LAYOUT, [w]); L.out.forEach(f => fails.push(`${tag} place checked: ${f}`)); if (!L.out.length) pass++; }
    // Build a tree and the questions: no sideways scroll, text readable
    for (const h of ['#build', '#questions']) {
      await page.goto('about:blank'); await page.goto(URL0 + h); await page.waitForTimeout(900);
      const r = await page.evaluate(() => ({ sx: document.documentElement.scrollWidth > innerWidth + 1, small: [...document.querySelectorAll('.ls-root text, .tr2-still text')].filter(e => e.getBoundingClientRect().height > 0 && parseFloat(getComputedStyle(e).fontSize) * (e.ownerSVGElement.getBoundingClientRect().width / e.ownerSVGElement.viewBox.baseVal.width) < 10.4).length, drawn: document.querySelectorAll('.tr-draw2 svg, .tr2-bstage table').length }));
      ok(!r.sx, `${tag} ${h}: sideways scroll`); ok(r.drawn > 0, `${tag} ${h}: drawings or table shown`);
      if (h === '#questions') ok(r.small === 0, `${tag} ${h}: ${r.small} question drawing words under 11 px`);
      if (SHOTS && (w === 390 || w === 1440)) await page.screenshot({ path: `${SHOTS}/sweep-${w}-${dark ? 'dark' : 'light'}-${h.slice(1)}.png` });
    }
    ok(!errs.length, `${tag}: console errors ${errs.join(' | ')}`);
    await browser.close();
  }
  // the fit at the short and common screens named in the builder brief
  if (w === 390 || w === 1024 || w === 1280) {
    const sizes = w === 390 ? [[390, 844], [375, 667], [360, 740]] : w === 1024 ? [[1024, 768]] : [[1280, 800]];
    for (const [W, H] of sizes) for (const tab of ['anc', 'traits']) {
      const { browser, page } = await open(W, false, { noCue: true, h: H });
      if (tab === 'traits') { await page.evaluate(() => window.__tr2.tab('traits')); await page.waitForTimeout(400); }
      const f = await page.evaluate(() => { const s = document.querySelector('.tr2-scene').getBoundingClientRect(), c = document.querySelector('.tr2 .tk2-cause').getBoundingClientRect(), t = document.querySelector('.tr2-tip .tr2-org').getBoundingClientRect(); return { s: [s.top, s.bottom], c: c.bottom, t: t.top, vh: innerHeight, inner: document.querySelector('.ls-stage, .ls-main') ? [...document.querySelectorAll('.ls-stage, .ls-main')].some(e => e.scrollHeight > e.clientHeight + 2 && getComputedStyle(e).overflowY !== 'visible') : false }; });
      ok(f.s[0] >= 0 && f.s[1] <= f.vh && f.c <= f.vh + 0.5 && f.t >= 0, `fit ${W}x${H} ${tab}: scene ${f.s.map(Math.round)}, cause line ${Math.round(f.c)}, window ${f.vh}`);
      ok(!f.inner, `fit ${W}x${H} ${tab}: no inner scroll`);
      await browser.close();
    }
  }
}

if (FRAMES) {
  for (const w of [390, 1440]) {
    const { browser, page, errs } = await open(w, false, { noCue: true });
    // watch every frame of an action: each frame runs AGREE plus the checks for that action
    const watch = async (src, extra, ms) => page.evaluate(async ([src, extra, ms, AG]) => {
      const X = window.__tr2, agree = (0, eval)('(' + AG + ')'), chk = extra ? (0, eval)('(' + extra + ')') : null, bad = [];
      let frames = 0; const t0 = performance.now();
      await (0, eval)(src)(X);
      await new Promise(res => { (function f(){ frames++; agree().forEach(e => bad.push(e)); if (chk) chk(X).forEach(e => bad.push(e)); if (performance.now() - t0 > ms && !X.busy()) res(); else requestAnimationFrame(f); })(); });
      return { frames, bad: [...new Set(bad)].slice(0, 6) };
    }, [src, extra, ms, AGREE.toString()]);
    const reset = () => page.evaluate(() => { const X = window.__tr2; X.stopAll(); if (X.St.tab !== 'anc') X.tab('anc'); X.setTree('vertebrates'); X.reset(); X.stopAll(); X.St.lastPair = X.St.prevPair = null; });
    const run = async (name, src, extra, ms = 500) => { await reset(); const r = await watch(src, extra, ms); ok(!r.bad.length && r.frames > 3, `${w} frames ${name} (${r.frames} frames): ${r.bad.join('; ')}`); return r.frames; };
    let total = 0;
    // the glow grows from the tips; the ancestor is named only once it is reached
    total += await run('glow', async (X) => { X.tap('frog'); X.tap('mouse'); }, ((X) => { const o = [], c = document.querySelector('.tr2 .tk2-cause').textContent, lit = [...document.querySelectorAll('.tr2-glow')].filter(e => e.getAttribute('opacity') === '1'); if (/common ancestor/.test(c) && /\d/.test(c) && lit.some(e => parseFloat(e.style.strokeDashoffset) > 0.001)) o.push('ancestor named before the glow reached it'); return o; }).toString());
    // a node swings: moving names hidden while they move, the pill and glow follow the knots (AGREE every frame)
    total += await run('swing', async (X) => { X.tap('frog'); X.tap('lizard'); X.stopAll(); X.rot(4); }, ((X) => { const o = [], sw = X.V.swing; if (sw) document.querySelectorAll('.tr2-tip').forEach(g => { const id = g.getAttribute('data-tip'), op = g.querySelector('.tr2-name').getAttribute('opacity'); if (sw.moving[id] && op !== '0') o.push('a moving name shows mid swing'); if (!sw.moving[id] && op !== '1') o.push('a still name hidden'); }); return o; }).toString(), 400);
    // fast reversed rotations
    total += await run('reversals', async (X) => { X.tap('shark'); X.tap('kangaroo'); X.stopAll(); X.rot(4); await new Promise(r => setTimeout(r, 90)); X.rot(4); await new Promise(r => setTimeout(r, 60)); X.rot(3); await new Promise(r => setTimeout(r, 40)); X.rot(1); }, null, 600);
    // a trait climbs: its label only once it has arrived; the rings and the cause line only once painted
    total += await run('trait climb', async (X) => { X.tab('traits'); X.stopAll(); X.trait('amnion'); }, ((X) => { const o = []; document.querySelectorAll('.tr2-tick').forEach(g => { const arr = g.querySelector('.tr2-bar').getAttribute('opacity') === '1', lab = g.querySelector('.tr2-tl').getAttribute('opacity') === '1'; if (lab && !arr) o.push('label before arrival'); }); const k = X.V.ticks[X.V.ticks.length - 1], c = document.querySelector('.tr2 .tk2-cause').textContent; if (k && k.paint < 1 && /inherit/.test(c)) o.push('cause line before the paint'); if (k && k.s < 1 && [...document.querySelectorAll('.tr2-ring')].some(r => +r.getAttribute('opacity') > 0)) o.push('rings before arrival'); return o; }).toString(), 900);
    // a trait taken off mid climb, another added
    total += await run('trait off mid climb', async (X) => { X.tab('traits'); X.stopAll(); X.trait('hair'); await new Promise(r => setTimeout(r, 150)); X.trait('hair'); X.trait('jaws'); }, null, 900);
    // Start over mid swing
    total += await run('start over mid swing', async (X) => { X.tap('frog'); X.tap('lizard'); X.stopAll(); X.rot(2); await new Promise(r => setTimeout(r, 120)); X.reset(); }, null, 600);
    // the tree switch: a new tree grows from the ground
    total += await run('new tree grows', async (X) => { X.setTree('primates'); }, null, 700);
    // leaving to Test yourself mid animation and back: nothing keeps running, the picture returns clean
    await reset();
    await page.evaluate(() => { const X = window.__tr2; X.tap('frog'); X.tap('mouse'); X.rot(3); });
    await page.waitForTimeout(80);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Test yourself/.test(x.textContent) && x.getBoundingClientRect().width > 0); b && b.click(); });
    await page.waitForTimeout(300);
    ok(await page.evaluate(() => !window.__tr2.busy()), `${w}: nothing runs in Test yourself`);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /^\s*Explore\s*$/.test(x.textContent) && x.getBoundingClientRect().width > 0); b && b.click(); });
    await page.waitForTimeout(500);
    { const A = await page.evaluate(AGREE); ok(!A.length, `${w}: back in Explore clean: ${A.join('; ')}`); }
    // keys: a tip button and a node button
    await reset();
    await page.evaluate(() => document.querySelector('.tr2-key[data-tip="frog"]').focus()); await page.keyboard.press('Enter');
    await page.evaluate(() => document.querySelector('.tr2-key[data-tip="lizard"]').focus()); await page.keyboard.press('Enter');
    await still(page);
    ok(await page.evaluate(() => window.__tr2.St.sel.join() === 'frog,lizard' && document.querySelector('.tr2-pill').getAttribute('opacity') === '1'), `${w}: keys tap tips`);
    const before = await page.evaluate(() => window.__tr2.P.leaves(window.__tr2.root()).map(l => l.name).join());
    await page.evaluate(() => document.querySelector('.tr2-key[data-node="4"]').focus()); await page.keyboard.press(' ');
    await still(page);
    ok(await page.evaluate((b) => window.__tr2.P.leaves(window.__tr2.root()).map(l => l.name).join() !== b && document.activeElement.getAttribute('data-node') === '4', before), `${w}: keys rotate a node, focus kept`);
    ok(await page.evaluate(() => /never changes/.test(document.querySelector('.tr2 .tk2-cause').textContent)), `${w}: rotation takeaway`);
    // real taps act on what is drawn under the finger: every organism, every name, every knot (and near it)
    for (const tw of (w === 390 ? [360, 390] : [w])) {
      const { browser: b2, page: p2 } = await open(tw, false, { noCue: true });
      const pts = await p2.evaluate(() => {
        const out = [];
        document.querySelectorAll('.tr2-tip').forEach(g => { const id = g.getAttribute('data-tip'); out.push({ kind: 'tip', id, sel: '.tr2-org' }, { kind: 'tip', id, sel: '.tr2-nt' }); });
        document.querySelectorAll('.tr2-node').forEach(g => { const id = g.getAttribute('data-node'); [[0, 0], [8, 0], [-8, 0], [0, 8]].forEach(d => out.push({ kind: 'node', id, d })); });
        return out;
      });
      let wrong = 0;
      for (const q of pts) {
        const was = await p2.evaluate(() => ({ sel: window.__tr2.St.sel.join(), order: window.__tr2.P.leaves(window.__tr2.root()).map(l => l.name).join() }));
        // where the target is drawn now (the knots and tips move after a swing)
        const [x, y] = await p2.evaluate((q) => {
          const e = q.kind === 'tip' ? document.querySelector(`.tr2-tip[data-tip="${q.id}"] ${q.sel}`) : document.querySelector(`.tr2-node[data-node="${q.id}"] .tr2-knot`);
          const r = e.getBoundingClientRect(); return [r.left + r.width / 2 + (q.d ? q.d[0] : 0), r.top + r.height / 2 + (q.d ? q.d[1] : 0)];
        }, q);
        await p2.touchscreen.tap(x, y); await still(p2);
        const now = await p2.evaluate(() => ({ sel: window.__tr2.St.sel.join(), order: window.__tr2.P.leaves(window.__tr2.root()).map(l => l.name).join() }));
        if (q.kind === 'tip') { const s0 = was.sel ? was.sel.split(',') : [], want = s0.includes(q.id) ? s0.filter(z => z !== q.id) : s0.concat(q.id); if (now.sel !== want.join() || now.order !== was.order) wrong++; }
        else if (now.order === was.order || now.sel !== was.sel) wrong++;
      }
      ok(wrong === 0, `${tw}: real touch taps on ${pts.length} drawn tips, names and knots: ${wrong} wrong`);
      await b2.close();
    }
    ok(!errs.length, `${w} frames: console errors ${errs.join(' | ')}`);
    console.log(`  frames at ${w}: ${total} watched`);
    if (SHOTS) {
      await reset();
      await page.evaluate(() => { const X = window.__tr2; X.tap('frog'); X.tap('lizard'); X.stopAll(); X.rot(4); }); await page.waitForTimeout(130);
      await page.screenshot({ path: `${SHOTS}/mid-${w}-swing.png` }); await still(page);
      await reset();
      await page.evaluate(() => { const X = window.__tr2; X.tap('shark'); X.tap('mouse'); }); await page.waitForTimeout(200);
      await page.screenshot({ path: `${SHOTS}/mid-${w}-glow.png` }); await still(page);
      await page.evaluate(() => { const X = window.__tr2; X.tab('traits'); X.stopAll(); X.trait('jaws'); }); await page.waitForTimeout(260);
      await page.screenshot({ path: `${SHOTS}/mid-${w}-climb.png` }); await still(page);
      await page.evaluate(() => { const X = window.__tr2; X.tab('anc'); X.setTree('plants'); }); await page.waitForTimeout(250);
      await page.screenshot({ path: `${SHOTS}/mid-${w}-grow.png` }); await still(page);
    }
    await browser.close();
  }
  // reduced motion: the result at once with a short cross fade
  {
    const { browser, page, errs } = await open(390, false, { noCue: true, reduced: true });
    await page.evaluate(() => { const X = window.__tr2; X.tap('frog'); X.tap('lizard'); });
    const r = await page.evaluate(() => ({ busy: window.__tr2.busy(), pill: document.querySelector('.tr2-pill').getAttribute('opacity'), fade: document.querySelector('.tr2-scene').classList.contains('is-fade'), c: document.querySelector('.tr2 .tk2-cause').textContent }));
    ok(!r.busy && r.pill === '1' && r.fade && /common ancestor 4/.test(r.c), `reduced motion: at once with a fade (${JSON.stringify(r)})`);
    await page.evaluate(() => window.__tr2.rot(4));
    ok(await page.evaluate(() => !window.__tr2.busy() && /never changes/.test(document.querySelector('.tr2 .tk2-cause').textContent)), 'reduced motion: rotation at once');
    { const A = await page.evaluate(AGREE); ok(!A.length, `reduced motion agree: ${A.join('; ')}`); }
    ok(!errs.length, `reduced motion: console errors ${errs.join(' | ')}`);
    await browser.close();
  }
  // the real locked state: without Premium the page shows its locked card, no errors
  {
    const { browser, page, errs } = await open(390, false, { locked: true });
    await page.waitForTimeout(2500);
    const r = await page.evaluate(() => ({ tips: document.querySelectorAll('.tr2-tip').length, lock: !!document.querySelector('.premium-lock, .pm-lock, [data-premium-lock], .lock-card, .bt-locked, .premium-card') || /Premium/.test(document.querySelector('#app, main').textContent) }));
    ok(r.lock, `locked: a Premium card shows (${JSON.stringify(r)})`);
    ok(!errs.length, `locked: console errors ${errs.join(' | ')}`);
    await browser.close();
  }
}

if (PERF) {
  const frameProbe = async (page, act, ms) => {
    await page.evaluate(() => { window.__ft = []; window.__fon = true; let last = performance.now(); (function loop(t){ if (!window.__fon) return; window.__ft.push(t - last); last = t; requestAnimationFrame(loop); })(performance.now()); });
    await act(); await page.waitForTimeout(ms);
    const ft = (await page.evaluate(() => { window.__fon = false; return window.__ft.slice(2); })).sort((a, b) => a - b);
    const q = (p) => ft[Math.min(ft.length - 1, Math.floor(ft.length * p))];
    return `${ft.length} frames, median ${q(0.5).toFixed(1)} ms, p95 ${q(0.95).toFixed(1)} ms, max ${ft[ft.length - 1].toFixed(1)} ms`;
  };
  for (const w of [390, 1440]) {
    for (const which of ['tree swings (rotate a node every 330 ms, 3 s)', 'tree traits climb and glow', 'FLAGSHIP fertilizer']) {
      const browser = await chromium.launch({ executablePath: EXE });
      const ctx = await browser.newContext({ viewport: { width: w, height: VH[w] }, serviceWorkers: 'block' });
      await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
      await ctx.route(u => u.href.includes('/assets/premium.js'), async r => { const resp = await r.fetch(); const body = (await resp.text()).replace('function has(course) {', 'function has(course) { return true;'); await r.fulfill({ response: resp, body }); });
      const page = await ctx.newPage();
      await page.addInitScript(() => { localStorage.setItem('tk2c:apbio-tree', '1'); localStorage.setItem('tk2c:apbio-tree-traits', '1'); });
      const flag = /FLAG/.test(which);
      await page.goto(flag ? `http://localhost:${PORT}/environmental-science/tools/water-pollution.html` : URL0);
      if (flag) await page.waitForSelector('.tk2-knob', { state: 'attached', timeout: 15000 }); else await page.waitForSelector('.tr2-tip', { timeout: 15000 });
      await page.waitForTimeout(1500);
      const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      let res;
      if (flag) {
        const k = await page.evaluate(() => { const e = [...document.querySelectorAll('.tk2-knob')].find(x => x.getBoundingClientRect().width > 0); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
        const span = Math.min(260, w * 0.3);
        res = await frameProbe(page, async () => { await page.mouse.move(k[0], k[1]); await page.mouse.down(); for (let i = 0; i <= 24; i++) { await page.mouse.move(k[0] + span * i / 24, k[1]); await page.waitForTimeout(16); } for (let i = 24; i >= 0; i--) { await page.mouse.move(k[0] + span * i / 24, k[1]); await page.waitForTimeout(16); } await page.mouse.up(); }, 700);
      } else if (/swings/.test(which)) {
        await page.evaluate(() => { const X = window.__tr2; X.tap('frog'); X.tap('mouse'); X.stopAll(); });
        res = await frameProbe(page, async () => { await page.evaluate(() => new Promise(r => { let i = 0; const ids = [2, 4, 3, 6, 5, 1, 4, 2, 3]; (function k(){ window.__tr2.rot(ids[i++]); if (i < ids.length) setTimeout(k, 330); else r(); })(); })); }, 500);
      } else {
        await page.evaluate(() => { window.__tr2.tab('traits'); window.__tr2.stopAll(); });
        res = await frameProbe(page, async () => { await page.evaluate(() => new Promise(r => { let i = 0; const ids = ['backbone', 'jaws', 'limbs', 'amnion', 'hair', 'hair', 'limbs']; (function k(){ window.__tr2.trait(ids[i++]); if (i < ids.length) setTimeout(k, 380); else r(); })(); })); }, 900);
      }
      console.log(`  perf ${w} ${which} (CPU x4): ${res}`);
      await browser.close();
    }
  }
  pass++;
}

server.close();
const label = ONE ? `width ${ONE}` : FRAMES ? 'frames' : 'perf';
fails.slice(0, 40).forEach(f => console.log('  FAIL ' + f));
console.log(`bio-tree-reading sweep ${label}: ${pass} passed, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
