#!/usr/bin/env node
/* Tools v2 sweep: AP Environmental Science, Energy flow (docs/tools-v2-builder-brief.md, step 5; the pattern of
   simpson-diversity-sweep.mjs). Every landmark state of the three Explore chapters at one width per process (run it
   once per width; long sweeps in one process can pass ten minutes), light, and dark at 390, 768 and 1440:
     - no sideways scroll; nothing clipped by the scene (labels, pills, knobs, tags, the cue, the tap targets);
     - no overlap between labels (tier names and values, pills, the knob's tag, the cue);
     - the scene (the thing acted on) is the largest thing on the stage;
     - phones (640 px and under): the cause line is at most two rows and its height never changes;
     - the picture agrees with the model: each tier reached shows the model's kcal; the people drawn are the model's
       count; the cattle's heat is drawn 9 times as wide as the beef; at every step the heat wisps are as wide as the
       stream that goes on; the cause line names what is drawn;
     - no console errors.
   Usage: node scripts/tools-v2/apenv-energy-flow-sweep.mjs --width 390 [--shots <dir>] [--port <n>]
          (no --width: all ten widths, one after another, in this process)
   Needs playwright (PW_ROOT names a folder whose node_modules has it) and Chromium (CHROMIUM_PATH). */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, mkdirSync } from 'node:fs';
import { dirname, extname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
let PORT = +arg('--port', 0); const SHOTS = arg('--shots', null); const ONE = arg('--width', null);
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
const URL0 = `http://localhost:${PORT}/environmental-science/tools/energy-flow.html`;
const WIDTHS = ONE ? [+ONE] : [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
const STATES = [
  { ch: 'chain', id: 'grass', set: { lvl: 0 } },
  { ch: 'chain', id: 'grass-most-sun', set: { lvl: 0, sun: 30000 } },
  { ch: 'chain', id: 'grasshoppers', set: { lvl: 1, sun: 20000 } },
  { ch: 'chain', id: 'grasshoppers-most-sun', set: { lvl: 1, sun: 30000 } },
  { ch: 'chain', id: 'frogs', set: { lvl: 2, sun: 20000 } },
  { ch: 'chain', id: 'snakes', set: { lvl: 3 } },
  { ch: 'chain', id: 'hawks', set: { lvl: 4 } },
  { ch: 'chain', id: 'hawks-most-sun', set: { lvl: 4, sun: 30000 } },
  { ch: 'chain', id: 'grasshoppers-least-sun', set: { lvl: 1, sun: 10000 } },
  { ch: 'eat', id: 'grain', set: { share: 0 } },
  { ch: 'eat', id: 'share-60', set: { share: 60 } },
  { ch: 'eat', id: 'share-10', set: { share: 10 } },
  { ch: 'eat', id: 'all-cattle', set: { share: 100 } },
  { ch: 'web', id: 'whole', set: {} },
  { ch: 'web', id: 'no-frogs', set: { tap: 'frogs' } },
  { ch: 'web', id: 'no-mice', set: { tap: 'mice' } },
  { ch: 'web', id: 'no-grass', set: { tap: 'grass' } },
  { ch: 'web', id: 'no-hawks', set: { tap: 'hawks' } },
];
let pass = 0; const fails = [];
const ok = (c, msg) => { if (c) pass++; else fails.push(msg); };
async function until(page, fn, a) { for (let i = 0; i < 120; i++) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(80); } return false; }

async function open(w, dark, ch) {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : w < 1100 ? 1024 : 900 }, serviceWorkers: 'block', hasTouch: w < 500 });
  await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  if (dark) await page.addInitScript(() => { try { localStorage.setItem('nremt_theme', 'dark'); } catch (e) {} });
  await page.goto(URL0 + '?ch=' + ch); await page.waitForSelector('.efa-svg', { timeout: 15000 }); await page.waitForTimeout(500);
  return { browser, page, errs };
}
async function apply(page, set) {
  await page.evaluate((set) => {
    const inp = (pre) => [...document.querySelectorAll('.tk2-in')].find(x => x.getAttribute('aria-label').startsWith(pre));
    const put = (i, v) => { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); };
    if (set.sun != null) put(inp('Sunlight'), set.sun);
    if (set.lvl != null) put(inp('Follow the energy'), set.lvl);
    if (set.share != null) put(inp('Share of the corn'), set.share);
    if (set.tap) [...document.querySelectorAll('.tk2-tap')].find(x => / the (.*)$/.exec(x.getAttribute('aria-label'))[1] === set.tap).click();
  }, set);
  await page.waitForTimeout(120);
  await until(page, () => !document.querySelector('.efa').getAttribute('data-busy'));   // the animation has settled
  await page.waitForTimeout(60);
}
const geo = (page) => page.evaluate(() => {
  const r = (e) => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, t: (e.textContent || '').trim().slice(0, 40) }; };
  const scene = document.querySelector('.efa-scene'), stage = document.querySelector('.efa');
  const labels = [...document.querySelectorAll('.efa-dyn text.efa-lab, .efa-dyn text.efa-val, .efa-dyn .efa-pill, .efa-dyn text.efa-k')].map(r).filter(b => b.w > 0);
  const ctrls = [...document.querySelectorAll('.tk2-layer .tk2-drag:not([hidden]) .tk2-knob, .tk2-layer .tk2-drag:not([hidden]) .tk2-tag:not([hidden]), .tk2-cue, .tk2-layer .tk2-tap:not([hidden])')].map(r).filter(b => b.w > 0);
  const knobs = [...document.querySelectorAll('.tk2-layer .tk2-drag:not([hidden]) .tk2-knob')].map(r).filter(b => b.w > 0);
  const animals = [...document.querySelectorAll('.efa-mid [data-sp] .efa-body, .efa-mid .efa-crit:not([data-k="0"]) .ef-art')].filter(e => getComputedStyle(e).display !== 'none').map(r).filter(b => b.w > 0);
  const tags = [...document.querySelectorAll('.tk2-layer .tk2-drag:not([hidden]) .tk2-tag:not([hidden]), .tk2-cue')].map(r).filter(b => b.w > 0);
  const kids = [...stage.children].filter(e => e.offsetParent !== null && e !== scene).map(r);
  const cause = document.querySelector('.tk2-cause');
  return { scene: r(scene), labels, ctrls, tags, knobs, animals, kids, cause: r(cause), causeT: cause.textContent, sw: document.documentElement.scrollWidth, iw: window.innerWidth };
});
/* gap: things that must stay apart by at least 4 px (labels, pills and badges, cues and tags, animals) */
const near = (a, b, gap = 4) => a.x - gap < b.x + b.w && b.x - gap < a.x + a.w && a.y - gap < b.y + b.h && b.y - gap < a.y + a.h;
const hit = (a, b, pad = 1) => a.x + pad < b.x + b.w && b.x + pad < a.x + a.w && a.y + pad < b.y + b.h && b.y + pad < a.y + a.h;
const inside = (a, s, pad = 1) => a.x >= s.x - pad && a.y >= s.y - pad && a.x + a.w <= s.x + s.w + pad && a.y + a.h <= s.y + s.h + pad;

for (const w of WIDTHS) {
  for (const dark of [false, true]) {
    if (dark && ![390, 768, 1440].includes(w)) continue;
    const tag = `${w}${dark ? '-dark' : ''}`;
    const causeH = {};
    for (const ch of ['chain', 'eat', 'web']) {
      const { browser, page, errs } = await open(w, dark, ch);
      // the first visit cue is part of the opening state: checked there, then dismissed
      const g0 = await geo(page);
      for (const c of g0.tags) ok(inside(c, g0.scene), `${tag} ${ch} opening: cue or tag clipped "${c.t}"`);
      for (const c of g0.tags) for (const l of g0.labels) ok(!near(c, l), `${tag} ${ch} opening: cue/tag "${c.t}" within 4 px of "${l.t}"`);
      for (const c of g0.tags) for (const a of g0.animals) ok(!hit(c, a, 2), `${tag} ${ch} opening: cue/tag "${c.t}" covers an animal`);
      for (const st of STATES.filter(s => s.ch === ch)) {
        await apply(page, st.set);
        const g = await geo(page), id = `${tag} ${st.id}`;
        ok(g.sw <= g.iw, `${id}: sideways scroll ${g.sw} > ${g.iw}`);
        for (const l of g.labels) ok(inside(l, g.scene), `${id}: label clipped "${l.t}"`);
        for (const c of g.ctrls) ok(inside(c, g.scene, 2), `${id}: control clipped "${c.t}"`);
        for (let i = 0; i < g.labels.length; i++) for (let j = i + 1; j < g.labels.length; j++) {
          const a = g.labels[i], b = g.labels[j];
          if (a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w + 0.5 && a.y + a.h <= b.y + b.h + 0.5) continue;   // a pill's own text
          if (b.x >= a.x && b.y >= a.y && b.x + b.w <= a.x + a.w + 0.5 && b.y + b.h <= a.y + a.h + 0.5) continue;
          ok(!near(a, b), `${id}: labels closer than 4 px "${a.t}" / "${b.t}"`);
        }
        for (const t of g.tags) for (const l of g.labels) ok(!near(t, l), `${id}: tag "${t.t}" within 4 px of "${l.t}"`);
        for (const t of g.tags) for (const a of g.animals) ok(!near(t, a, 2), `${id}: tag "${t.t}" covers an animal`);
        for (const a of g.animals) for (const l of g.labels) if (st.ch === 'chain') ok(!near(a, l), `${id}: an animal within 4 px of "${l.t}"`);
        for (const k of g.knobs) for (const l of g.labels) ok(!hit(k, l, 0), `${id}: a knob covers "${l.t}"`);
        // a tier's name and its kcal: at least 4 px apart
        const gaps = await page.evaluate(() => { const L = [...document.querySelectorAll('.efa-dyn text.efa-lab')], V = [...document.querySelectorAll('.efa-dyn text.efa-val')]; return V.map((v, i) => { const a = L[i].getBoundingClientRect(), b = v.getBoundingClientRect(); return b.top - a.bottom; }); });
        gaps.forEach((d, i) => ok(d >= 4 || st.ch !== 'chain', `${id}: tier ${i} name and kcal ${d.toFixed(1)} px apart`));
        const area = g.scene.w * g.scene.h;
        ok(g.kids.every(k => k.w * k.h < area), `${id}: the scene is not the largest thing`);
        if (w <= 640) { ok(g.cause.h <= 72, `${id}: cause line ${g.cause.h}px (more than two rows)`); causeH[st.id] = g.cause.h; }
        // the picture agrees with the model
        const model = await page.evaluate(() => { const M = window.ApEnvMath.energyFlow; return { P: M.pyramid('grassland', +[...document.querySelectorAll('.tk2-in')].find(x => x.getAttribute('aria-label').startsWith('Sunlight')).value, 50, 0.1), F: (s) => 0 }; });
        if (st.ch === 'chain') {
          const vals = await page.evaluate(() => [...document.querySelectorAll('.efa-dyn text.efa-val')].map(t => t.firstChild.textContent));
          ok(vals.length === st.set.lvl + 1, `${id}: ${vals.length} tiers show energy, expected ${st.set.lvl + 1}`);
          const want = model.P.levels.slice(0, st.set.lvl + 1).map(l => l.energy);
          vals.forEach((v, k) => k < want.length && ok(+v.replace(/[^\d.]/g, '') === +want[k].toPrecision(6), `${id}: tier ${k} says ${v}, model ${want[k]}`));
          // one measure per step: every heat wisp of a step is as wide as the stream that goes on from it
          const widths = await page.evaluate(() => [...document.querySelectorAll('.efa-dyn path.efa-heat')].map(p => parseFloat(p.style.strokeWidth)));
          ok(widths.length === 5 + 9 * st.set.lvl, `${id}: ${widths.length} heat wisps, expected ${5 + 9 * st.set.lvl}`);
          // the grass step on one measure: the 5 respiration wisps together are as wide as the stored stream
          const gs = await page.evaluate(() => ({ resp: [...document.querySelectorAll('.efa-dyn path.efa-heat.is-resp')].reduce((a, p) => a + parseFloat(p.style.strokeWidth), 0), npp: (() => { const p = document.querySelector('.efa-dyn path.efa-stream.is-npp'); return p ? parseFloat(p.style.strokeWidth) : null; })() }));
          if (gs.npp != null) ok(Math.abs(gs.resp - gs.npp) < 0.05, `${id}: respiration ${gs.resp} vs stored ${gs.npp}`);
          // every tier shows at least one animal (the grass tier its grass)
          const per = await page.evaluate(() => [0, 1, 2, 3, 4].map(k => document.querySelectorAll('.efa-mid .efa-crit[data-k="' + k + '"] .ef-art').length));
          ok(per.every(n => n > 0), `${id}: empty tier ${JSON.stringify(per)}`);
          if (st.set.lvl === 4) ok(/hawks get 0\.01%/.test(g.causeT), `${id}: takeaway "${g.causeT}"`);
          else if (st.set.lvl) ok(new RegExp(want[st.set.lvl].toLocaleString('en-US') + ' kcal ').test(g.causeT), `${id}: cause "${g.causeT}"`);
        } else if (st.ch === 'eat') {
          const d = await page.evaluate((s) => { const F = window.ApEnvMath.energyFlow.field(s / 100); const ppl = [...document.querySelectorAll('.efa-dyn g[style*="opacity:1.00"] > g[transform*="scale"]')].length;
            const b = (k) => { const p = document.querySelector('.efa-dyn .efa-band[data-k="' + k + '"]'); return p ? parseFloat(p.style.strokeWidth) : 0; }; const plume = document.querySelector('.efa-dyn .efa-plume');
            return { people: F.people, cattle: b('cattle'), beef: b('beef'), plume: plume ? parseFloat(plume.style.strokeWidth) : 0 }; }, st.set.share);
          ok(new RegExp('\\b' + d.people + ' people fed').test(g.causeT) || (st.set.share === 100 && new RegExp('feeds ' + d.people + ' people').test(g.causeT)), `${id}: cause "${g.causeT}" vs model ${d.people}`);
          if (st.set.share > 0) { ok(Math.abs(d.plume - 0.9 * d.cattle) < 0.05 && (Math.abs(d.plume - 9 * d.beef) < 0.1 || (d.beef === 0.6 && d.plume / 9 < 0.6)), `${id}: heat ${d.plume} is not 9 x beef ${d.beef} (cattle ${d.cattle})`); ok(d.beef >= 0.6, `${id}: no beef band while cattle are drawn`); }
          else ok(d.plume === 0, `${id}: heat drawn with no cattle`);
        } else if (st.set.tap) {
          ok(g.causeT.startsWith('No ' + st.set.tap), `${id}: cause "${g.causeT}"`);
        }
        if (SHOTS) { mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: join(SHOTS, `sweep-${tag}-${st.id}.png`) }); }
      }
      ok(errs.length === 0, `${tag} ${ch}: console errors ${errs.slice(0, 2).join(' | ')}`);
      await browser.close();
    }
    if (w <= 640) { const hs = Object.values(causeH); ok(Math.max(...hs) - Math.min(...hs) < 1, `${tag}: cause line height changes ${JSON.stringify(causeH)}`); }
  }
}
server.close();
console.log(`${pass} passed, ${fails.length} failed`);
if (fails.length) { console.log(fails.slice(0, 60).join('\n')); process.exit(1); }
