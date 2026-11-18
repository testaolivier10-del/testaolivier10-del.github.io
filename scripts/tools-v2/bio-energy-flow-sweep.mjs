#!/usr/bin/env node
/* Sweep test for the tools v2 AP Biology Energy flow tool (docs/tools-v2-bio-energy-flow-brief.md;
   docs/tools-v2-builder-brief.md step 5). Every landmark state at ten widths, light and dark at three of them.
   At each: nothing is clipped by the stage, no two labels overlap, the picture is the largest thing, every plant and
   animal stands on its own level's ground, the counts drawn match the numbers written, the cause line is at most two
   rows on a phone with the same height in every state, and the page does not scroll sideways.
   The tool is Premium: here only, assets/premium.js is answered with has() returning true. Nothing leaves the machine.
   Usage: node scripts/tools-v2/bio-energy-flow-sweep.mjs [--shots <dir>]   (needs playwright) */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, createReadStream, mkdirSync } from 'node:fs';
import { dirname, extname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) { try { ({ chromium } = createRequire('/opt/npm-tools/')('playwright')); } catch (e2) { console.error('This check needs playwright (' + e.message + ')'); process.exit(0); } }
const EXE = existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome') ? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' : undefined;
const si = process.argv.indexOf('--shots'), SHOTS = si > 0 ? process.argv[si + 1] : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  const file = resolve(ROOT, '.' + p);
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  if (p === '/assets/premium.js') {
    const src = readFileSync(file, 'utf8');
    if (!src.includes('function has(course) {')) { res.writeHead(500); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME['.js'] }); res.end(src.replace('function has(course) {', 'function has(course) { return true;')); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, r));
const ORIGIN = 'http://localhost:' + server.address().port;

const WIDTHS = [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
const DARK = new Set([390, 768, 1440]);
// [name, share passed on (%), sunlight (GPP)]
const STATES = [['default', 10, 20000], ['share-5', 5, 20000], ['share-20', 20, 20000], ['sun-low', 10, 10000], ['sun-high', 10, 30000], ['least', 5, 10000], ['most', 20, 30000], ['one-snake-edge', 15, 15000]];
let fails = 0, checks = 0;
const bad = (where, msg) => { fails++; console.log('FAIL ' + where + ': ' + msg); };

const browser = await chromium.launch({ executablePath: EXE });
for (const w of WIDTHS) for (const dark of DARK.has(w) ? [false, true] : [false]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 700 ? 844 : 900 }, serviceWorkers: 'block', hasTouch: w < 700 });
  await ctx.route(u => !u.href.startsWith(ORIGIN), r => r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::/.test(m.text())) errs.push(m.text()); });
  await page.addInitScript(d => { try { localStorage.setItem('tk2c:apbio-energy-flow', '1'); if (d) localStorage.setItem('nremt_theme', 'dark'); } catch (e) {} }, dark);
  await page.goto(ORIGIN + '/bio/tools/energy-flow.html');
  await page.waitForSelector('.ef2-svg', { timeout: 15000 });
  await page.waitForTimeout(700);
  const heights = new Set();
  for (const [name, eff, gpp] of STATES) {
    const where = `${w}${dark ? ' dark' : ''} ${name}`;
    await page.evaluate(([eff, gpp]) => {
      const ins = document.querySelectorAll('.ef2 .tk2-in');
      [[ins[0], eff], [ins[1], gpp]].forEach(([i, v]) => { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
    }, [eff, gpp]);
    await page.waitForFunction(() => document.querySelectorAll('.ef2 .tk2-cause .tk2-cz').length === 4, null, { timeout: 8000 }).catch(() => bad(where, 'the cause line never got its result'));
    await page.waitForTimeout(380);
    const r = await page.evaluate(() => {
      const out = { issues: [] }, scene = document.querySelector('.ef2-scene').getBoundingClientRect();
      const box = e => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
      const shown = e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
      out.sideways = document.documentElement.scrollWidth > window.innerWidth + 1;
      // labels: every pill, every loose word, the knob tags
      const labels = [];
      document.querySelectorAll('.ef2-scene .ef2-pill rect, .ef2-scene text:not(.ef2-nm):not(.ef2-val), .ef2-scene .tk2-tag, .ef2-scene .tk2-knob').forEach(e => {
        if (e.tagName === 'text' && e.closest('.ef2-pill')) return;
        if (shown(e)) labels.push({ n: (e.closest('.ef2-pill') || e).textContent.trim().slice(0, 24) || e.className, ...box(e) });
      });
      labels.forEach(a => { if (a.l < scene.left - 0.5 || a.r > scene.right + 0.5 || a.t < scene.top - 0.5 || a.b > scene.bottom + 0.5) out.issues.push('clipped: ' + a.n); });
      for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
        const a = labels[i], b = labels[j], ox = Math.min(a.r, b.r) - Math.max(a.l, b.l), oy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
        if (ox > 1 && oy > 1) out.issues.push('overlap: "' + a.n + '" and "' + b.n + '"');
      }
      // every plant and animal on its own ground
      const kinds = ['grass', 'hop', 'frog', 'snake']; out.counts = [];
      kinds.forEach((k, i) => {
        const g = box(document.querySelector('.ef2-ground.is-' + k)); let n = 0, off = 0;
        document.querySelectorAll('.ef2-lay.is-' + k + ' .ef2-o.is-on').forEach(e => { n++; const b = box(e); if (b.l < g.l - 9 || b.r > g.r + 9 || b.b > g.b + 1 || b.t < g.t - 1) off++; });
        out.counts.push(n); if (off) out.issues.push(off + ' ' + k + ' off its ground');
      });
      out.vals = [].map.call(document.querySelectorAll('.ef2-top .ef2-val'), e => parseFloat(e.textContent.replace(/,/g, '')));
      out.none = !!document.querySelector('.ef2-pill.is-none');
      // the picture is the largest thing
      const sa = scene.width * scene.height;
      document.querySelectorAll('.ef2 > *, .ls-top, .ls-bar').forEach(e => { if (e.classList.contains('ef2-scene')) return; const b = e.getBoundingClientRect(); if (b.width * b.height >= sa) out.issues.push('larger than the picture: ' + e.className); });
      const c = document.querySelector('.ef2 .tk2-cause'), cb = c.getBoundingClientRect(), tops = new Set([].map.call(c.querySelectorAll('.tk2-cz'), e => Math.round(e.getBoundingClientRect().top)));
      out.rows = tops.size; out.ch = Math.round(cb.height); out.cause = c.textContent;
      out.cright = Math.max(...[].map.call(c.querySelectorAll('.tk2-cz'), e => e.getBoundingClientRect().right)) > window.innerWidth;
      return out;
    });
    checks += 7;
    r.issues.forEach(m => bad(where, m));
    if (r.sideways) bad(where, 'the page scrolls sideways');
    if (r.cright) bad(where, 'a cause pill runs off the screen');
    if (w <= 640 && r.rows > 2) bad(where, 'cause line has ' + r.rows + ' rows');
    if (w <= 640) heights.add(r.ch);
    r.vals.forEach((v, i) => { const want = Math.floor(v / 10 + 1e-6); if (v >= 99.5 ? Math.abs(r.counts[i] - want) > 0 : r.counts[i] !== want && Math.abs(v / 10 - Math.round(v / 10)) > 0.06) bad(where, 'level ' + i + ' draws ' + r.counts[i] + ' for ' + v + ' kcal'); });
    if (r.none !== (r.counts[3] === 0)) bad(where, '"too little energy" shown: ' + r.none + ' with ' + r.counts[3] + ' snakes');
    if (!new RegExp('→' + r.counts[3] + ' snakes?$').test(r.cause)) bad(where, 'cause line "' + r.cause + '" against ' + r.counts[3] + ' snakes drawn');
    if (SHOTS) await page.locator('.ef2').screenshot({ path: join(SHOTS, `sweep-${String(w).padStart(4, '0')}${dark ? '-dark' : ''}-${name}.png`) });
  }
  if (heights.size > 1) bad(`${w}`, 'cause line height changes between states: ' + [...heights].join(', '));
  errs.forEach(e => bad(`${w}`, 'console: ' + e));
  await ctx.close();
}
await browser.close(); server.close();
console.log(`${WIDTHS.length} widths, ${STATES.length} states, ${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
