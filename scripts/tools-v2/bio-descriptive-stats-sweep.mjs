#!/usr/bin/env node
/* Tools v2 sweep: AP Biology, Descriptive statistics (docs/tools-v2-bio-descriptive-stats-brief.md; pattern of
   scripts/tools-v2/bio-confidence-intervals-sweep.mjs).
   Landmark states of Explore (the opening with its cue; one tall outlier; one short outlier; a plant at the top;
   8 plants (even n); 10 and 3 plants; bunched plants with a mode; mean and median far apart both ways; a plant held
   mid drag before the row sorts), the Challenges view and a Problems view, at widths 360 to 1920, light and dark,
   and the tallest plant at every 0.5 cm from 1 to 15 cm at 7 and 10 plants:
     - no sideways scroll; nothing clipped by the scene (labels, pills, knobs, the cue);
     - labels never overlap each other (4 px) and keep 2 px from drawn things (dots, the pivot, the other line,
       leaves); knobs 44 px; the cue covers nothing and points at the tallest plant's knob;
     - no rendered text under 11 px, leaves at least 11 px; phones: the cause line at most two rows, constant height;
     - the picture's top knob and the whole cause line fit the window together at load;
     - every number agrees with the plants AS DRAWN (AGREE: each plant's stem tip is measured from the DOM; the mean
       and median lines, the pills, the middle plants' glow, the knobs, the clipboard's dots, pivot, sorted values and
       worked lines, the plant count and the cause line are checked against those heights);
   and, frame by frame at 390 and 1440 (--frames): a real drag of the tallest plant up, down past the others and
   back, the release that sorts the row, a press in a plant's column away from its knob, keys, sowing and pulling
   (one on top of another still playing), Start over, leaving to Test yourself mid change, a real touch drag at 390,
   reduced motion. --perf: CPU x4 frame times beside the flagship. --shots <dir>: contact shots and mid animation.
   Usage: node scripts/tools-v2/bio-descriptive-stats-sweep.mjs [--width <px>] [--frames] [--perf] [--shots <dir>]
   With no --width it runs each of the ten widths in its own process, then the frame checks.
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
// the window height used at each width (phones, tablets, laptops): the picture is sized from it
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
  console.log(`\nbio-descriptive-stats sweep, all runs: ${pass} passed, ${fail} failed${bad ? ' (a run did not finish)' : ''}`);
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
const URL0 = `http://localhost:${PORT}/bio/tools/descriptive-stats.html`;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

let pass = 0; const fails = [];
const ok = (c, msg) => { if (c) pass++; else fails.push(msg); };

async function open(w, dark, opts = {}) {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: w, height: opts.h || VH[w] || 900 }, serviceWorkers: 'block', hasTouch: w < 500, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.addInitScript(([dark, noCue]) => { try { if (dark) localStorage.setItem('nremt_theme', 'dark'); if (noCue) localStorage.setItem('tk2c:apbio-ds', '1'); } catch (e) {} }, [dark, !!opts.noCue]);
  await page.goto(URL0 + (opts.hash || '')); await page.waitForSelector('.ds2-pl, .ds-fig', { timeout: 15000 }); await page.waitForTimeout(800);
  return { browser, page, errs };
}
async function until(page, fn, a) { for (let i = 0; i < 120; i++) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(50); } return false; }
const still = (page) => until(page, () => !window.__ds2.busy());

/* Read everything back from the DOM and check every number against the plants AS DRAWN (runs in the page). */
const AGREE = () => {
  const X = window.__ds2, G = X.G(), c = G.cb, out = [];
  const nums = (s) => ((s || '').replace(/−/g, '-').match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  const near = (a, b, t, what) => { if (!(Math.abs(a - b) <= t)) out.push(`${what}: ${a} vs ${b}`); };
  const vis = (e) => e && e.style.display !== 'none' && getComputedStyle(e).display !== 'none';
  const r1 = (v) => Math.round(v * 10 + 1e-9) / 10, r2 = (v) => Math.round(v * 100 + 1e-9) / 100;
  // the plants, measured: the stem's tip above the soil
  const pl = [...document.querySelectorAll('.ds2-plants .ds2-pl')].map(e => {
    const d = e.querySelector('.ds2-stem').getAttribute('d') || '', m = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)$/.exec(d);
    const tr = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(e.getAttribute('transform'));
    return { e, st: e.getAttribute('data-st'), h: m ? -parseFloat(m[2]) / G.k : 0, x: tr ? +tr[1] + (m ? +m[1] : 0) : NaN, y: tr ? +tr[2] + (m ? +m[2] : 0) : NaN, base: tr ? +tr[2] : NaN, mid: e.classList.contains('is-mid') };
  });
  pl.forEach(p => { if (p.st !== 'leave' && Math.abs(p.base - G.ySoil) > 0.06) out.push('a plant not on the soil'); if (p.h > 15.06 || (p.st === 'grown' && p.h < 0.94)) out.push(`plant drawn at ${p.h.toFixed(2)} cm`); });
  const cn = pl.filter(p => p.st === 'grown'), hs = cn.map(p => p.h), n = hs.length;
  if (n < 1) { out.push('no plant counted'); return out; }
  const srt = hs.slice().sort((a, b) => a - b), sum = hs.reduce((a, b) => a + b, 0), mean = sum / n;
  const med = n % 2 ? srt[(n - 1) / 2] : (srt[n / 2 - 1] + srt[n / 2]) / 2;
  const sd = Math.sqrt(hs.reduce((a, h) => a + (h - mean) ** 2, 0) / (n - 1)), se = sd / Math.sqrt(n);
  const yH = (h) => G.ySoil - h * G.k, xA = (v) => c.l + Math.max(0, Math.min(16, v)) * c.kx;
  // the clipboard lists the heights to 0.1 cm; every number shown is worked out exactly from that list
  const vals = [...document.querySelectorAll('.ds2-val')].filter(vis).map(e => +e.textContent);
  const Ls = vals.slice().sort((a, b) => a - b), Lm = Ls.reduce((a, b) => a + b, 0) / Ls.length, Lmed = Ls.length % 2 ? Ls[(Ls.length - 1) / 2] : (Ls[Ls.length / 2 - 1] + Ls[Ls.length / 2]) / 2;
  const Lsd = Math.sqrt(Ls.reduce((a, h) => a + (h - Lm) ** 2, 0) / (Ls.length - 1)), Lse = Lsd / Math.sqrt(Ls.length);
  // the lines
  near(+document.querySelector('.ds2-mline').getAttribute('y1'), yH(mean), 0.3, 'mean line vs the plants');
  near(+document.querySelector('.ds2-dline').getAttribute('y1'), yH(med), 0.3, 'median line vs the plants');
  // the middle plant(s) glow: the plant(s) at the middle rank by drawn height
  const mids = cn.filter(p => p.mid).map(p => p.h).sort((a, b) => a - b), want = n % 2 ? [srt[(n - 1) / 2]] : [srt[n / 2 - 1], srt[n / 2]];
  if (mids.length !== want.length || mids.some((h, i) => Math.abs(h - want[i]) > 0.051)) out.push(`middle plants lit ${mids.map(h => h.toFixed(2))} vs ${want.map(h => h.toFixed(2))}`);
  pl.filter(p => p.st !== 'grown' && p.mid).forEach(() => out.push('a plant that is not counted is lit'));
  // the names of the lines
  const pM = document.querySelector('.ds2-pill.is-mean text').textContent, pD = document.querySelector('.ds2-pill.is-median text').textContent;
  if (G.big) { near(nums(pM)[0], r2(Lm), 0.0051, 'mean pill'); near(nums(pD)[0], r2(Lmed), 0.0051, 'median pill'); }
  else if (pM !== 'mean' || pD !== 'median') out.push(`pill words ${pM} / ${pD}`);
  // the knobs sit on the plants' tops
  const sr = document.querySelector('.ds2-svg').getBoundingClientRect();
  const kn = [...document.querySelectorAll('.ds2 .ds2-hd:not([hidden]) .tk2-knob')].filter(k => k.style.visibility !== 'hidden').map(k => { const r = k.getBoundingClientRect(); return [r.left + r.width / 2 - sr.left, r.top + r.height / 2 - sr.top]; });
  cn.forEach(p => { if (!kn.some(k => Math.abs(k[0] - p.x) < 1.6 && Math.abs(k[1] - p.y) < 1.6)) out.push(`no knob on the plant at ${p.h.toFixed(2)} cm`); });
  // the clipboard: a dot per counted plant at its height, the pivot at the mean, the values in order, the working
  const dx = [...document.querySelectorAll('.ds2-dot')].map(e => +e.getAttribute('cx')).sort((a, b) => a - b), ex = srt.map(xA);
  if (dx.length !== n) out.push(`${dx.length} dots for ${n} plants`); else dx.forEach((x, i) => near(x, ex[i], 0.3, 'dot ' + i));
  const md = [...document.querySelectorAll('.ds2-dot.is-mid')].length; if (md !== want.length) out.push(`${md} amber dots`);
  near(+/^M([-\d.]+)/.exec(document.querySelector('.ds2-pivot').getAttribute('d'))[1], xA(mean), 0.3, 'pivot at the mean');
  if (vals.length !== n || vals.some((v, i) => Math.abs(v - srt[i]) > 0.0505 + 0.006)) out.push(`sorted values ${vals} vs ${srt.map(r1)}`);
  const vm = [...document.querySelectorAll('.ds2-val.is-mid')].map(e => +e.textContent); if (vm.length !== want.length) out.push(`${vm.length} amber values`);
  const f1 = document.querySelector('.ds2-work.is-mean');
  if (f1 && vis(f1)) { const a = nums(f1.textContent); near(a[0], Math.round(vals.reduce((s, v) => s + v, 0) * 10) / 10, 0.001, 'worked sum is the sum of the values shown'); near(a[0], sum, 0.0505 * n + 0.01, 'worked sum vs the plants'); near(a[1], n, 0, 'worked n'); near(a[2], r2(Lm), 0.0051, 'worked mean'); near(a[2], a[0] / a[1], 0.0051, 'worked mean is its own sum over n'); const b = nums(document.querySelector('.ds2-work.is-median').textContent); near(b[b.length - 1], r2(Lmed), 0.0051, 'worked median'); }
  near(nums(document.querySelector('.ds2-nv').textContent)[0], n, 0, 'plant count');
  // the cause line (unless the takeaway holds it)
  const take = document.querySelector('.ds2 .tk2-cause.is-take');
  if (!take) {
    const cz = [...document.querySelectorAll('.ds2 .tk2-cause .tk2-cz')];
    const get = (role) => cz.find(e => e.classList.contains('is-' + role));
    const czM = get('mean'), czD = get('median'), czS = get('sd'), czP = get('plant');
    if (!czM || !czD) out.push('cause line without mean or median'); else {
      near(nums(czM.textContent)[0], r2(Lm), 0.0051, 'cause mean');
      const b = nums(czD.textContent); near(/=/.test(czD.textContent) ? b[b.length - 1] : b[0], r2(Lmed), 0.0051, 'cause median');
      if (/=/.test(czD.textContent)) { near(b[0], Ls[n / 2 - 1], 0.001, 'cause middle 1'); near(b[1], Ls[n / 2], 0.001, 'cause middle 2'); }
    }
    if (czS) { const b = nums(czS.textContent); near(b[0], r2(Lsd), 0.0051, 'cause SD'); near(b[1], r2(Lse), 0.0051, 'cause SE'); }
    if (czP) { const v = nums(czP.textContent)[0]; if (/one plant/.test(czP.textContent)) { if (!hs.some(h => Math.abs(h - v) <= 0.0505 + 0.006)) out.push(`cause plant ${v} not drawn`); } else near(v, n, 0, 'cause plant count'); }
  }
  return out;
};

/* Geometry: clipping, overlaps, text size, the cause line, the fit (runs in the page). */
const GEO = () => {
  const out = [], st = document.querySelector('.ds2'), phone = innerWidth <= 640;
  const scene = document.querySelector('.ds2-scene').getBoundingClientRect();
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none' && !e.closest('[style*="display: none"]') && !e.closest('[hidden]'); };
  const inside = (r, b, what) => { if (r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1) out.push(`${what} clipped (${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)})`); };
  const hit = (a, b, p) => a.left < b.right + p && a.right > b.left - p && a.top < b.bottom + p && a.bottom > b.top - p;
  const lab = [];
  document.querySelectorAll('.ds2-scene [data-lab]').forEach(e => { if (!vis(e)) return; const r = e.getBoundingClientRect(); inside(r, scene, 'label ' + e.textContent.slice(0, 14)); lab.push([r, e.textContent, e.getAttribute('data-lab'), e]); });
  for (let i = 0; i < lab.length; i++) for (let j = i + 1; j < lab.length; j++) {
    const a = lab[i][0], b = lab[j][0];
    if (hit(a, b, 4)) {
      // numbers along one ruler or plank sit closer than 4 px only along it, never overlapping; the sorted values in a row likewise
      const row = lab[i][2] === lab[j][2] && /rnum|pnum|val/.test(lab[i][2]) && (a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
      if (!row) out.push(`overlap: "${lab[i][1]}" / "${lab[j][1]}"`);
    }
  }
  // labels keep 2 px from drawn things: the dots, the pivot, the leaves; the pills from the other line
  const things = [...document.querySelectorAll('.ds2-dot, .ds2-pivot, .ds2-plants .ds2-top')].filter(vis).map(e => [e.getBoundingClientRect(), e.getAttribute('class')]);
  lab.forEach(l => { if (/pnum|tray|rnum/.test(l[2])) return; things.forEach(t => { const a = t[0], r = l[0]; const sh = /ds2-top/.test(t[1]) ? 0.18 : 0; const b = { left: a.left + a.width * sh, right: a.right - a.width * sh, top: a.top + a.height * sh, bottom: a.bottom - a.height * sh }; if (hit(r, b, 2)) out.push(`"${l[1]}" touches ${t[1].replace('ds2-', '')}`); }); });
  const lineY = (sel) => { const e = document.querySelector(sel), r = e.getBoundingClientRect(); return r; };
  [['.ds2-pill.is-mean', '.ds2-dline'], ['.ds2-pill.is-median', '.ds2-mline']].forEach(([p, l]) => { const e = document.querySelector(p); if (!e || !vis(e)) return; const a = e.getBoundingClientRect(), b = lineY(l); if (hit(a, { left: b.left, right: b.right, top: b.top + 2, bottom: b.bottom - 2 }, 1)) out.push(`${p} on the other line`); });
  document.querySelectorAll('.ds2 .ds2-hd:not([hidden]) .tk2-knob').forEach(k => { if (k.style.visibility === 'hidden') return; const r = k.getBoundingClientRect(); if (r.width < 43.5 || r.height < 43.5) out.push(`knob ${Math.round(r.width)} px`); inside({ left: r.left + 14, right: r.right - 14, top: r.top + 14, bottom: r.bottom - 14 }, scene, 'knob'); lab.forEach(l => { const a = l[0], dot = { left: r.left + 15, right: r.right - 15, top: r.top + 15, bottom: r.bottom - 15 }; if (hit(a, dot, 0)) out.push(`knob covers "${l[1]}"`); }); });
  const cue = document.querySelector('.ds2 .tk2-cue');
  if (cue) {
    const r = cue.getBoundingClientRect(); lab.forEach(l => { if (hit(l[0], r, 0)) out.push(`cue covers "${l[1]}"`); }); inside(r, scene, 'cue');
    document.querySelectorAll('.ds2-plants .ds2-top, .ds2-mline, .ds2-dline, .ds2-dot').forEach(e => { if (!vis(e)) return; if (hit(e.getBoundingClientRect(), r, 0)) out.push(`cue covers ${e.getAttribute('class')}`); });
    // its arrow points at the tallest plant's knob, straight above it
    const X = window.__ds2, a = X.P().filter(p => p.st === 'grown').sort((p, q) => q.h - p.h)[0];
    const ar = cue.querySelector('.tk2-cue-ar').getBoundingClientRect(), km = a.hd.knob.getBoundingClientRect();
    const ax = ar.left + ar.width / 2, kx = km.left + km.width / 2;
    if (Math.abs(ax - kx) > 12 || ar.top > km.top + 22) out.push(`cue arrow ${Math.round(ax - kx)} px across from the tallest plant's knob`);
  }
  document.querySelectorAll('.ds2 text, .ds2 .tk2-cz, .ds2 .tk2-purpose, .ds2 button, .ds2 .ds2-nv').forEach(e => { if (!vis(e)) return; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 11) out.push(`text ${fs}px "${e.textContent.slice(0, 16)}"`); });
  const area = (r) => r.width * r.height;
  [...st.children].forEach(c => { if (c.matches('.ds2-scene') || !vis(c)) return; if (area(c.getBoundingClientRect()) > area(scene)) out.push(`${c.className} bigger than the scene`); });
  if (document.documentElement.scrollWidth > innerWidth + 1) out.push(`sideways scroll ${document.documentElement.scrollWidth}`);
  const cz = document.querySelector('.ds2 .tk2-cause'), cr = cz.getBoundingClientRect(), rows = new Set([...cz.querySelectorAll('.tk2-cz')].map(e => Math.round(e.getBoundingClientRect().top))).size;
  if (phone && rows > 2) out.push(`cause line ${rows} rows`);
  const lf = window.__ds2.G().leaf; if (lf < 10.9) out.push(`leaves ${lf} px`);
  // every plant's column at least 44 px; the mean line drawn under the median line, both halos under both
  { const G0 = window.__ds2.G(), n0 = window.__ds2.P().filter(p => p.st !== 'leave').length, sv0 = document.querySelector('.ds2-svg').getBoundingClientRect(), col = (G0.tx1 - G0.tx0) / n0 * sv0.width / G0.W; if (col < 43.9) out.push(`columns ${col.toFixed(1)} px`); }
  { const kids = [...document.querySelector('.ds2-live').children], ih = kids.map((e, i) => e.matches('.ds2-lhalo') ? i : -1).filter(i => i > -1), im = kids.findIndex(e => e.matches('.ds2-mline')), id = kids.findIndex(e => e.matches('.ds2-dline'));
    if (!(Math.max(...ih) < im && im < id)) out.push('draw order: halos, mean, median');
    if (!(parseFloat(getComputedStyle(kids[im]).strokeWidth) > parseFloat(getComputedStyle(kids[id]).strokeWidth) + 1.5)) out.push('the mean line is not wider than the median line'); }
  // Tab goes left to right: the knobs' order in the page is the row's
  { const xs = [...document.querySelectorAll('.ds2 .ds2-hd .tk2-knob')].filter(k => k.style.visibility !== 'hidden').map(k => k.getBoundingClientRect().left); if (xs.some((x, i) => i && x < xs[i - 1] - 1) && !window.__ds2.busy()) out.push('knob order is not left to right'); }
  // the clipboard's words stay on its paper
  const G = window.__ds2.G(), c = G.cb, sv = document.querySelector('.ds2-svg').getBoundingClientRect(), k = sv.width / G.W;
  const paper = { left: sv.left + c.px * k, top: sv.top + c.py * k, right: sv.left + (c.px + c.pw) * k, bottom: sv.top + (c.py + c.ph) * k };
  lab.filter(l => /val|work|cmean|cmed|ctitle|pnum/.test(l[2])).forEach(l => inside(l[0], paper, 'paper word ' + l[1]));
  document.querySelectorAll('.ds2-dot').forEach(e => inside(e.getBoundingClientRect(), paper, 'a dot'));
  return { out, causeH: Math.round(cr.height), rows };
};

/* At load: the top of the plants (a knob) and the whole cause line in the window together. */
const FIT = () => {
  const knobs = [...document.querySelectorAll('.ds2 .ds2-hd .tk2-knob')].filter(k => k.style.visibility !== 'hidden').map(k => k.getBoundingClientRect());
  const top = Math.min(...knobs.map(r => r.top + r.height / 2)), cz = document.querySelector('.ds2 .tk2-cause').getBoundingClientRect(), acts = document.querySelector('.ds2-acts').getBoundingClientRect();
  return { top: Math.round(top), causeBottom: Math.round(cz.bottom), acts: Math.round(acts.bottom), vh: innerHeight, scrollY };
};

// the heights the tool opens on (in sowing order). A narrow phone holds fewer plants (each column at least 44 px)
// and keeps the first ones, so every state lists the plant it is about first.
const OPEN = [3.8, 4.4, 5.2, 6.6, 7.6, 4.9, 5.9];
const STATES = [
  ['open', OPEN], ['outlier', [14.0, 3.8, 4.4, 5.2, 6.6, 4.9, 5.9]], ['low', [1.0, 4.4, 5.2, 6.6, 7.6, 4.9, 5.9]], ['top', [15.0, 3.8, 4.4, 5.2, 6.6, 4.9, 5.9]],
  ['even4', [3.8, 4.4, 5.2, 6.6]], ['even6', [3.8, 4.4, 5.2, 6.6, 7.6, 4.9]], ['even8', OPEN.concat([5.5])], ['n10', OPEN.concat([5.5, 4.6, 6.2])], ['n3', [3.8, 4.4, 5.2]],
  ['bunched', [5.3, 5.4, 5.4, 5.5, 5.4, 5.3, 5.5]], ['skew-up', [15.0, 14.8, 3.8, 4.4, 5.2, 14.6, 5.0]], ['skew-down', [1.0, 1.2, 5.9, 6.3, 1.4, 7.2, 5.4]],
  ['n10-wide', [15.0, 1.0, 8.0, 2.0, 15.0, 3.0, 4.0, 5.0, 6.0, 7.0]], ['n10-out', [15.0, 3.8, 4.4, 5.2, 6.6, 7.6, 4.9, 5.9, 5.5, 4.6]],
  ['mid-drag', 'drag']];
async function setState(page, s) {
  if (s === 'drag') { await page.evaluate((o) => window.__ds2.set(o), OPEN); await page.evaluate(() => window.__ds2.drag(0, 9.4)); return; }
  await page.evaluate((hs) => window.__ds2.set(hs), s); await still(page);
}

if (ONE) {
  const w = +ONE;
  for (const theme of ['light', 'dark']) {
    const { browser, page, errs } = await open(w, theme === 'dark');
    // the theme really renders (the site's key is localStorage nremt_theme): the board is dark in dark, light in light
    const th = await page.evaluate(() => { const c = getComputedStyle(document.querySelector('.ds2-board')).fill, m = /(\d+),\s*(\d+),\s*(\d+)/.exec(c); return { attr: document.documentElement.getAttribute('data-theme'), lum: m ? (+m[1] + +m[2] + +m[3]) / 3 : -1 }; });
    ok(theme === 'dark' ? th.attr === 'dark' && th.lum < 90 : th.attr !== 'dark' && th.lum > 180, `${w} ${theme}: the theme renders ${JSON.stringify(th)}`);
    const g0 = await page.evaluate(GEO);
    ok(!g0.out.length, `${w} ${theme} first visit: ${g0.out.join('; ')}`);
    ok(await page.evaluate(() => !!document.querySelector('.ds2 .tk2-cue')), `${w} ${theme}: the first visit cue shows`);
    const a0 = await page.evaluate(AGREE); ok(!a0.length, `${w} ${theme} first visit: ${a0.join('; ')}`);
    const fit = await page.evaluate(FIT); ok(fit.top >= 0 && fit.causeBottom <= fit.vh, `${w} ${theme}: plants and the cause line fit the window together ${JSON.stringify(fit)}`);
    if (SHOTS && [390, 768, 1440].includes(w)) await page.screenshot({ path: join(SHOTS, `sweep-${w}-${theme}-00-first.png`) });
    await page.evaluate(() => window.__ds2.noCue());
    const heights = new Set();
    for (const [name, s] of STATES) {
      await setState(page, s);
      const g = await page.evaluate(GEO); ok(!g.out.length, `${w} ${theme} ${name}: ${g.out.join('; ')}`);
      const a = await page.evaluate(AGREE); ok(!a.length, `${w} ${theme} ${name}: ${a.join('; ')}`);
      heights.add(g.causeH);
      if (SHOTS && [390, 768, 1440].includes(w)) await page.screenshot({ path: join(SHOTS, `sweep-${w}-${theme}-${name}.png`) });
      if (name === 'mid-drag') await page.evaluate(() => { window.__ds2.end(); }), await still(page);
    }
    if (theme === 'light') {
      // the tallest plant at every 0.5 cm from 1 to 15 cm, at 7 and at 10 plants: every check, no exceptions
      const bad = [];
      for (const base of [OPEN, OPEN.concat([5.5, 4.6, 6.2])]) for (let v = 1; v <= 15.001; v += 0.5) {
        await page.evaluate(([b, v]) => { const hs = b.slice(); hs[0] = Math.round(v * 10) / 10; window.__ds2.set(hs); }, [base, v]); await still(page);
        const g = await page.evaluate(GEO), a = await page.evaluate(AGREE);
        if (g.out.length || a.length) bad.push(`${base.length} ${v}: ${g.out.concat(a).join('; ')}`);
      }
      ok(!bad.length, `${w} every 0.5 cm: ${bad.length} bad: ${bad.slice(0, 3).join(' | ')}`);
    }
    if (w <= 640) ok(heights.size === 1, `${w} ${theme}: the cause line changes height ${[...heights]}`);
    ok(!errs.length, `${w} ${theme}: console ${errs.join(' | ')}`);
    // Challenges, from the opening
    await page.goto('about:blank'); await page.goto(URL0 + '#goals'); await page.waitForSelector('.ds2-pl'); await page.waitForTimeout(900); await still(page);
    const gg = await page.evaluate(GEO); ok(!gg.out.length, `${w} ${theme} goals: ${gg.out.join('; ')}`);
    const ag = await page.evaluate(AGREE); ok(!ag.length, `${w} ${theme} goals: ${ag.join('; ')}`);
    ok(await page.evaluate(() => window.__ds2.drawn().n === window.__ds2.openN() && !!document.querySelector('.tk2-chal')), `${w} ${theme} goals: from the opening with the challenge card`);
    if (SHOTS && [390, 1440].includes(w)) await page.screenshot({ path: join(SHOTS, `sweep-${w}-${theme}-goals.png`) });
    // Challenge 3 starts on 3 plants with "+" on; each plant added makes the SE smaller, up to a full tray, and it is met
    await page.evaluate(() => window.__ds2.chal('n')); await page.waitForTimeout(200); await still(page);
    const c3 = await page.evaluate(() => ({ n: window.__ds2.drawn().n, add: !document.querySelector('.ds2-add').disabled, se: window.__ds2.drawn().se }));
    const ses = [c3.se];
    const sdPill = [];
    for (let i = 0; i < 10; i++) { if (await page.evaluate(() => document.querySelector('.ds2-add').disabled)) break; await page.click('.ds2-add'); await still(page); await page.waitForTimeout(80); ses.push(await page.evaluate(() => window.__ds2.drawn().se)); sdPill.push(await page.evaluate(() => !!document.querySelector('.ds2 .tk2-cause.is-take') || !!document.querySelector('.ds2 .tk2-cause .tk2-cz.is-sd'))); }
    ok(sdPill.every(Boolean), `${w} ${theme} challenge 3: the SD and SE pill stays at every count ${sdPill}`);
    const c3e = await page.evaluate(() => ({ n: window.__ds2.drawn().n, cap: window.__ds2.cap(), met: !!document.querySelector('.tk2-chal .is-met, .tk2-chal [class*="met"], .tk2-chal-ok') || /SE = s ÷ √n is/.test(document.querySelector('.tk2-chal') ? document.querySelector('.tk2-chal').textContent : '') }));
    ok(c3.n === 3 && c3.add && ses.every((v, i) => !i || v < ses[i - 1]) && c3e.n === c3e.cap && c3e.met, `${w} ${theme} challenge 3: from 3 plants, SE falls each step to a full tray and is met ${JSON.stringify({ c3, ses: ses.map(v => +v.toFixed(3)), c3e })}`);
    if (SHOTS && [360, 390, 1440].includes(w)) await page.screenshot({ path: join(SHOTS, `sweep-${w}-${theme}-challenge3.png`) });
    // Problems
    await page.goto('about:blank'); await page.goto(URL0 + '#practice'); await page.waitForSelector('.ds-fig'); await page.waitForTimeout(500);
    const pf = await page.evaluate(() => { const f = [...document.querySelectorAll('.ds-fig')].find(e => e.getBoundingClientRect().width > 0); const r = f.getBoundingClientRect(), vb = f.viewBox.baseVal, k = Math.min(r.width / vb.width, r.height / vb.height); const small = [...f.querySelectorAll('text')].map(t => parseFloat(getComputedStyle(t).fontSize) * k).filter(s => s < 10.95); return { h: r.height, small, sw: document.documentElement.scrollWidth, vw: innerWidth }; });
    ok(pf.h >= 120, `${w} ${theme} practice: figure ${pf.h} px tall`);
    ok(!pf.small.length, `${w} ${theme} practice: text under 11 px ${pf.small.slice(0, 3)}`);
    ok(pf.sw <= pf.vw + 1, `${w} ${theme} practice: sideways scroll`);
    if (SHOTS && [390, 1440].includes(w)) await page.screenshot({ path: join(SHOTS, `sweep-${w}-${theme}-practice.png`) });
    await browser.close();
  }
}

/* Real touch taps on every plant, on its knob (centre, ±6, ±12 px across) and on its stem: each must move that
   plant and only that plant. */
async function tapTest(page, w) {
  await page.evaluate(() => window.__ds2.reset()); await still(page);
  // a full tray: the most plants this width holds
  for (let i = 0; i < 10; i++) { if (await page.evaluate(() => document.querySelector('.ds2-add').disabled)) break; await page.click('.ds2-add'); await still(page); }
  const cdp = await page.context().newCDPSession(page);
  const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  let tries = 0, wrong = 0; const bad = [];
  const n = await page.evaluate(() => window.__ds2.P().filter(p => p.st !== 'leave').length);
  for (let i = 0; i < n; i++) for (const spot of ['k0', 'k-6', 'k6', 'k-12', 'k12', 'stem']) {
    const t = await page.evaluate(([i, spot]) => { const X = window.__ds2, p = X.P().filter(q => q.st !== 'leave')[i], r = p.hd.knob.getBoundingClientRect(), G = X.G(), sv = document.querySelector('.ds2-svg').getBoundingClientRect(), k = sv.width / G.W;
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = spot === 'stem' ? 0 : +spot.slice(1);
      return { id: p.id, x: cx + dx, y: spot === 'stem' ? (cy + (sv.top + G.ySoil * k)) / 2 : cy, before: X.P().map(q => [q.id, q.v]) }; }, [i, spot]);
    await tp('touchStart', t.x, t.y); for (let d = 0; d >= -18; d -= 6) await tp('touchMove', t.x, t.y + d); await tp('touchEnd'); await still(page);
    const moved = await page.evaluate((before) => { const m = new Map(before); return window.__ds2.P().filter(q => q.st !== 'leave' && Math.abs(q.v - m.get(q.id)) > 0.05).map(q => q.id); }, t.before);
    tries++; if (moved.length !== 1 || moved[0] !== t.id) { wrong++; if (bad.length < 3) bad.push(`plant ${i} ${spot}: moved ${moved}`); }
    // put it back where it was (keeps the tray the same for the next tap)
    await page.evaluate((before) => { window.__ds2.set(before.map(b => b[1])); }, t.before.slice().sort((a, b) => a[0] - b[0])); await still(page);
  }
  ok(!wrong, `${w} real touch taps: ${wrong} of ${tries} moved the wrong plant ${bad.join(' | ')}`);
  return tries;
}

if (FRAMES) {
  { const t = await open(360, false, { noCue: true }); const n = await tapTest(t.page, 360); console.log(`  360: ${n} real touch taps`); await t.browser.close(); }
  for (const w of [390, 1440]) {
    const { browser, page, errs } = await open(w, false, { noCue: true });
    let frames = 0;
    async function watch(label, act) {
      await page.evaluate(() => { window.__dsF = { n: 0, bad: [], on: true }; const AG = window.__dsAgree; (function loop(){ if (!window.__dsF.on) return; const o = AG(); window.__dsF.n++; if (o.length) window.__dsF.bad.push(o.join('; ')); requestAnimationFrame(loop); })(); });
      await act(); await page.waitForTimeout(60); await still(page); await page.waitForTimeout(60);
      const r = await page.evaluate(() => { window.__dsF.on = false; return window.__dsF; });
      frames += r.n;
      ok(!r.bad.length, `${w} frames ${label}: ${r.bad.length} bad of ${r.n}: ${r.bad.slice(0, 2).join(' | ')}`);
      ok(r.n >= 3, `${w} frames ${label}: only ${r.n} frames`);
    }
    await page.evaluate(`window.__dsAgree = ${AGREE.toString()}`);
    const tallKnob = () => page.evaluate(() => { const a = window.__ds2.P().filter(p => p.st === 'grown').sort((p, q) => q.h - p.h)[0], r = a.hd.knob.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    const kOf = (i) => page.evaluate((i) => { const a = window.__ds2.P().filter(p => p.st !== 'leave')[i], r = a.hd.knob.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, i);
    const G = await page.evaluate(() => { const G = window.__ds2.G(), r = document.querySelector('.ds2-svg').getBoundingClientRect(); return { k: G.k * r.width / G.W }; });
    await watch('drag the tallest plant up, down past the others and back; the row sorts on release', async () => {
      const k = await tallKnob(); await page.mouse.move(k[0], k[1]); await page.mouse.down();
      for (let d = 0; d >= -6.5 * G.k; d -= G.k / 3) await page.mouse.move(k[0], k[1] + d);
      for (let d = -6.5 * G.k; d <= 5 * G.k; d += G.k / 2) await page.mouse.move(k[0], k[1] + d);
      await page.mouse.up();
    });
    if (SHOTS) { await page.evaluate(() => window.__ds2.reset()); await still(page); const k = await tallKnob(); await page.mouse.move(k[0], k[1]); await page.mouse.down(); for (let d = 0; d <= 4.5 * G.k; d += G.k / 2) await page.mouse.move(k[0], k[1] + d); await page.mouse.up(); await page.waitForTimeout(140); await page.screenshot({ path: join(SHOTS, `mid-${w}-sort.png`) }); await still(page); }
    await watch('Start over', async () => { await page.evaluate(() => window.__ds2.reset()); });
    // a press while the row still slides: the slide goes on (no plant jumps more than a third of its way in a frame)
    { await page.evaluate(() => window.__ds2.reset()); await still(page);
      const k = await tallKnob(); await page.mouse.move(k[0], k[1]); await page.mouse.down();
      for (let d = 0; d <= 6.5 * G.k; d += G.k / 2) await page.mouse.move(k[0], k[1] + d);
      await page.evaluate(() => { const X = window.__ds2; window.__dsJ = { on: true, last: null, steps: [], from: null }; (function loop(){ const J = window.__dsJ; if (!J.on) return; const xs = {}; X.P().forEach(p => { const tr = /translate\(([-\d.]+)/.exec(p.el && p.el.getAttribute('transform') || ''); if (tr) xs[p.id] = +tr[1]; }); if (J.last) for (const id in xs) if (id in J.last) J.steps.push([id, Math.abs(xs[id] - J.last[id])]); if (!J.from) J.from = xs; J.last = xs; requestAnimationFrame(loop); })(); });
      await page.mouse.up(); await page.waitForTimeout(60);
      const m = await kOf(3); await page.mouse.move(m[0], m[1]); await page.mouse.down(); await page.mouse.move(m[0], m[1] - 10); await page.waitForTimeout(450); await page.mouse.up(); await still(page);
      const r = await page.evaluate(() => { const J = window.__dsJ; J.on = false; const travel = {}; for (const id in J.last) travel[id] = Math.abs(J.last[id] - J.from[id]); let worst = 0, wid = null; J.steps.forEach(([id, s]) => { const t = travel[id] || 0; if (t > 20 && s / t > worst) { worst = s / t; wid = id; } }); return { worst: +worst.toFixed(2), wid, travel: travel[wid] }; });
      ok(r.worst < 0.34, `${w}: a press mid slide lets the slide go on ${JSON.stringify(r)}`); }
    await still(page); const H0 = await page.evaluate(() => { const o = {}; window.__ds2.P().forEach(p => { o[p.id] = p.v; }); return o; });
    await watch('a press in a plant\'s column away from its knob takes that plant', async () => {
      const k = await kOf(2); await page.mouse.move(k[0] + 2, k[1] + 1.2 * G.k); await page.mouse.down();
      for (let d = 0; d >= -4 * G.k; d -= G.k / 2) await page.mouse.move(k[0] + 2, k[1] + 1.2 * G.k + d);
      await page.mouse.up();
    });
    ok(await page.evaluate((h0) => { const a = window.__ds2.P().filter(p => p.st !== 'leave'), moved = a.filter(p => Math.abs(p.v - h0[p.id]) > 0.05); return moved.length === 1 && Math.abs(moved[0].v - h0[moved[0].id] - 4) < 0.6; }, H0), `${w}: the column press moved only that plant, up about 4 cm`);
    await watch('keys on a plant: PageUp x3, End, Home, ArrowDown', async () => {
      await page.evaluate(() => window.__ds2.P().filter(p => p.st !== 'leave')[3].hd.knob.focus());
      for (const key of ['PageUp', 'PageUp', 'PageUp', 'End', 'Home', 'ArrowDown']) { await page.keyboard.press(key); await page.waitForTimeout(90); }
    });
    await watch('Start over', async () => { await page.click('.ds2-reset'); });
    if (SHOTS) { await page.evaluate(() => { window.__ds2.drag(window.__ds2.P().filter(p => p.st !== 'leave').length - 1, 14); window.__ds2.end(); }); await still(page); await page.click('.ds2-reset'); await page.waitForTimeout(220); await page.screenshot({ path: join(SHOTS, `mid-${w}-startover.png`) }); await still(page); }
    await watch('sow a plant (it sprouts, the row makes room)', async () => { await page.click('.ds2-add'); });
    if (SHOTS) { await page.click('.ds2-rm'); await still(page); await page.click('.ds2-add'); await page.waitForTimeout(360); await page.screenshot({ path: join(SHOTS, `mid-${w}-sprout.png`) }); await still(page); }
    await watch('pull, then sow while it still leaves, then pull while that one grows', async () => { await page.click('.ds2-rm'); await page.waitForTimeout(150); await page.click('.ds2-add'); await page.waitForTimeout(200); await page.click('.ds2-rm'); });
    if (SHOTS) { await page.click('.ds2-rm'); await page.waitForTimeout(200); await page.screenshot({ path: join(SHOTS, `mid-${w}-pull.png`) }); await still(page); await page.click('.ds2-add'); await still(page); }
    await watch('pull down to 3 plants', async () => { for (let i = 0; i < 8; i++) { if (await page.evaluate(() => document.querySelector('.ds2-rm').disabled)) break; await page.click('.ds2-rm'); await page.waitForTimeout(120); } });
    ok(await page.evaluate(() => window.__ds2.drawn().n === 3 && document.querySelector('.ds2-rm').disabled), `${w}: 3 plants at least, Remove then off`);
    await watch('Start over from 3 plants (four sprout)', async () => { await page.click('.ds2-reset'); });
    await watch('drag while a plant sprouts', async () => { await page.click('.ds2-add'); await page.waitForTimeout(80); const k = await kOf(0); await page.mouse.move(k[0], k[1]); await page.mouse.down(); for (let d = 0; d >= -3 * G.k; d -= G.k / 2) await page.mouse.move(k[0], k[1] + d); await page.mouse.up(); });
    // leaving mid change: Test yourself and back, the screen is clean and the plants are whole
    await page.click('.ds2-reset'); await still(page); await page.click('.ds2-add'); await page.waitForTimeout(150);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button, [role=tab]')].find(x => /Test yourself/.test(x.textContent)); b && b.click(); }); await page.waitForTimeout(300);
    ok(await page.evaluate(() => !window.__ds2.busy()), `${w}: leaving mid change stops it`);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button, [role=tab]')].find(x => /^Explore$/.test(x.textContent.trim())); b && b.click(); }); await page.waitForTimeout(400);
    const back = await page.evaluate(() => window.__dsAgree()); ok(!back.length, `${w}: back from Test yourself: ${back.join('; ')}`);
    ok(await page.evaluate(() => window.__ds2.drawn().n === window.__ds2.openN() + 1), `${w}: back from Test yourself with the plants as they were`);
    if (w < 500) { const n = await tapTest(page, w); console.log(`  ${w}: ${n} real touch taps`); }
    // real touch drag of a plant at the phone width (the page must not scroll)
    if (w < 500) {
      await page.click('.ds2-reset'); await still(page);
      const y0 = await page.evaluate(() => scrollY), k = await tallKnob(), cdp = await page.context().newCDPSession(page);
      const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
      await tp('touchStart', k[0], k[1]); for (let d = 0; d >= -4 * G.k; d -= 6) await tp('touchMove', k[0], k[1] + d); await tp('touchEnd');
      await still(page);
      const r = await page.evaluate((y0) => ({ max: window.__ds2.drawn().max, dy: scrollY - y0 }), y0);
      ok(r.max > 10.5 && Math.abs(r.dy) < 2, `${w} touch drag grows the plant, not the page ${JSON.stringify(r)}`);
    }
    // reduced motion: the result at once with a cross fade
    const rm = await open(w, false, { noCue: true, reduced: true });
    await rm.page.click('.ds2-add'); await rm.page.waitForTimeout(80);
    const rmR = await rm.page.evaluate(() => ({ want: window.__ds2.openN() + 1, busy: window.__ds2.busy(), n: window.__ds2.drawn().n, fade: document.querySelector('.ds2-scene').classList.contains('is-fade') }));
    ok(!rmR.busy && rmR.n === rmR.want && rmR.fade, `${w} reduced motion: at once with a cross fade ${JSON.stringify(rmR)}`);
    await rm.page.evaluate(`window.__dsAgree = ${AGREE.toString()}`);
    const rmA = await rm.page.evaluate(() => window.__dsAgree()); ok(!rmA.length, `${w} reduced motion agrees: ${rmA.join('; ')}`);
    await rm.browser.close();
    ok(!errs.length, `${w} frames: console ${errs.join(' | ')}`);
    console.log(`  ${w}: ${frames} frames checked`);
    await browser.close();
  }
}

if (PERF) {
  const probe = async (page, k, span) => {
    await page.evaluate(() => { window.__ft = []; window.__fon = true; let last = performance.now(); (function loop(t){ if (!window.__fon) return; window.__ft.push(t - last); last = t; requestAnimationFrame(loop); })(performance.now()); });
    await page.mouse.move(k[0], k[1]); await page.mouse.down();
    for (let i = 0; i <= 24; i++) { await page.mouse.move(k[0] + span[0] * i / 24, k[1] + span[1] * i / 24); await page.waitForTimeout(16); }
    for (let i = 24; i >= 0; i--) { await page.mouse.move(k[0] + span[0] * i / 24, k[1] + span[1] * i / 24); await page.waitForTimeout(16); }
    await page.mouse.up(); await page.waitForTimeout(700);
    const ft = (await page.evaluate(() => { window.__fon = false; return window.__ft.slice(2); })).sort((a, b) => a - b);
    const q = (p) => ft[Math.min(ft.length - 1, Math.floor(ft.length * p))];
    return `${ft.length} frames, median ${q(0.5).toFixed(1)} ms, p95 ${q(0.95).toFixed(1)} ms, max ${ft[ft.length - 1].toFixed(1)} ms`;
  };
  for (const w of [390, 1440]) {
    for (const which of ['ds drag a plant (10 plants)', 'ds sow (sprout and slide)', 'FLAGSHIP fertilizer']) {
      const browser = await chromium.launch({ executablePath: EXE });
      const ctx = await browser.newContext({ viewport: { width: w, height: VH[w] }, serviceWorkers: 'block' });
      await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !u.href.startsWith('data:'), r => r.abort());
      // the flagship is Premium: unlocked in this test only (never committed to the page)
      await ctx.route(u => u.href.includes('/assets/premium.js'), async r => { const resp = await r.fetch(); const body = (await resp.text()).replace('function has(course) {', 'function has(course) { return true;'); await r.fulfill({ response: resp, body }); });
      const page = await ctx.newPage();
      await page.addInitScript(() => { localStorage.setItem('tk2c:apbio-ds', '1'); });
      const flag = /FLAG/.test(which);
      await page.goto(flag ? `http://localhost:${PORT}/environmental-science/tools/water-pollution.html` : URL0);
      if (flag) await page.waitForSelector('.tk2-knob', { state: 'attached', timeout: 15000 }); else await page.waitForSelector('.ds2-pl', { timeout: 15000 });
      await page.waitForTimeout(1500);
      if (!flag && /drag/.test(which)) { await page.evaluate(() => window.__ds2.set([3.8, 4.4, 5.2, 6.6, 7.6, 4.9, 5.9, 5.5, 4.6, 6.2])); await page.waitForTimeout(300); }
      const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      if (/sow/.test(which)) {
        await page.evaluate(() => { window.__ft = []; window.__fon = true; let last = performance.now(); (function loop(t){ if (!window.__fon) return; window.__ft.push(t - last); last = t; requestAnimationFrame(loop); })(performance.now()); });
        for (let i = 0; i < 3; i++) { await page.click('.ds2-add'); await page.waitForTimeout(900); }
        const ft = (await page.evaluate(() => { window.__fon = false; return window.__ft.slice(2); })).sort((a, b) => a - b); const q = (p) => ft[Math.min(ft.length - 1, Math.floor(ft.length * p))];
        console.log(`  perf ${w} ${which} (CPU x4): ${ft.length} frames, median ${q(0.5).toFixed(1)} ms, p95 ${q(0.95).toFixed(1)} ms, max ${ft[ft.length - 1].toFixed(1)} ms`);
      } else {
        const k = flag ? await page.evaluate(() => { const e = [...document.querySelectorAll('.tk2-knob')].find(x => x.getBoundingClientRect().width > 0); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })
          : await page.evaluate(() => { const a = window.__ds2.P().filter(p => p.st === 'grown').sort((p, q) => q.h - p.h)[0], r = a.hd.knob.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
        const span = flag ? [Math.min(260, w * 0.3), 0] : [0, w < 500 ? -110 : -220];
        console.log(`  perf ${w} ${which} (CPU x4): ${await probe(page, k, span)}`);
      }
      await browser.close();
    }
  }
  pass++;
}

server.close();
const label = ONE ? `width ${ONE}` : FRAMES ? 'frames' : 'perf';
fails.slice(0, 40).forEach(f => console.log('  FAIL ' + f));
console.log(`bio-descriptive-stats sweep ${label}: ${pass} passed, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
