#!/usr/bin/env node
/* Tools v2 sweep: NREMT Sound trainer (docs/tools-v2-builder-brief.md, step 5; the pattern of nremt-mnemonics-sweep.mjs).
   Every landmark state of Explore (lung and heart tabs: the opening with the cue, every sound at its best spot while it
   plays and once stopped, normal at the same spot, the back of the chest, a faint spot, the takeaway) at widths 360 to
   1920, light and dark:
     - no sideways scroll; nothing clipped by the picture (labels, keys, switches, Play, the stethoscope, the cue);
     - no overlap (4 px at least) between the labels, the keys, the switches, Play and the cue, nor between the
       strip's event pills; the spot's label clear of the stethoscope;
     - the chest is the largest thing in the picture; the picture the largest thing on the stage;
     - every visible text is at least 11 px; keys and switches at least 40 px tall;
     - phones (640 px and under): the cause line is at most two rows and its height never changes.
   And with --frames (390 and 1440, motion on), frame by frame (rule 14): the sound's pill appears only once the trace
   is drawn; every event pill (S1, S2, S3 ...) only over trace that is drawn; the spot's label never while the
   stethoscope moves; then a mouse drag and a real touch drag onto a spot, the keyboard, leaving mid sound for Test
   yourself and for "?" (the sound, the frame loop and every timer stop; coming back is clean and finished), reduced
   motion (the whole trace at once), Test yourself's three parts with a right and a wrong answer, the deep links, and a
   drag with the CPU throttled x4 (median frame about 16 ms, p95 at most 50 ms). No console errors anywhere.
   The lung clips stream from Wikimedia; the sweep serves a local test tone in their place (with a CORS header, so the
   live trace is exercised; --nocors fails the CORS address, to check the fallback).
   One width per process: with no --width it runs itself once per width, in turn, then --frames.
   Usage: node scripts/tools-v2/nremt-sound-trainer-sweep.mjs [--width <w>] [--frames] [--shots <dir>] [--nocors]
   Needs playwright (PW_ROOT names a folder whose node_modules has it) and Chromium (CHROMIUM_PATH). */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, mkdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const SELF = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(dirname(SELF)));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const WIDTHS = [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
const SHOTS = arg('--shots', null);
const NOCORS = process.argv.includes('--nocors');

if (!arg('--width', null) && !process.argv.includes('--frames')) {
  let pass = 0, fail = 0;
  const runs = WIDTHS.map(w => ['--width', String(w)]).concat([['--frames']]);
  for (const a of runs) {
    const r = spawnSync(process.execPath, [SELF, ...a, ...(SHOTS ? ['--shots', SHOTS] : []), ...(NOCORS ? ['--nocors'] : [])], { encoding: 'utf8', timeout: 9 * 60 * 1000 });
    const out = (r.stdout || '') + (r.stderr || '');
    const m = /(\d+) passed, (\d+) failed/.exec(out);
    if (m) { pass += +m[1]; fail += +m[2]; } else fail++;
    process.stdout.write(out.split('\n').filter(l => l.trim()).map(l => `[${a.join(' ')}] ${l}`).join('\n') + '\n');
  }
  console.log(`TOTAL ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) {
  try { ({ chromium } = createRequire((process.env.PW_ROOT || '/home/claude/testaolivier10-del.github.io') + '/')('playwright')); }
  catch (e2) { console.error('This sweep needs playwright (set PW_ROOT).'); process.exit(0); }
}
const EXE = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome') ? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' : undefined);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const file = resolve(ROOT, '.' + p);
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }); createReadStream(file).pipe(res);
});
await new Promise(ok => server.listen(+arg('--port', 0), ok));
const PORT = server.address().port;
const URL0 = `http://localhost:${PORT}/nremt/sound-trainer.html`;
let pass = 0; const fails = [];
const ok = (c, msg) => { if (c) pass++; else fails.push(msg); };

// a 6 s test tone with breath-like bursts, in place of the Wikimedia clips
function wav() {
  const sr = 22050, n = sr * 6, b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) { const t = i / sr, env = (t % 2.5) < 1 ? Math.sin(Math.PI * (t % 2.5)) : 0.05; b.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 420 * t) * env * 0.6 * 32000), 44 + i * 2); }
  return b;
}
const CLIP = wav();

async function open(w, dark, opts = {}) {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: w, height: opts.h || (w < 500 ? 844 : w < 1100 ? 1024 : 900) }, serviceWorkers: 'block', hasTouch: w < 500, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  // --nocors: the direct (CORS) address fails, as it would without a CORS header (a fulfilled route passes CORS in
  // Playwright, so failing the request is how the fallback is reached); the plain address still plays
  await ctx.route(/wikimedia\.org/, r => NOCORS && /upload\.wikimedia/.test(r.request().url()) ? r.abort()
    : r.fulfill({ status: 200, body: CLIP, headers: { 'content-type': 'audio/wav', 'access-control-allow-origin': '*' } }));
  await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`) && !/wikimedia\.org/.test(u.href) && !u.href.startsWith('data:'), r => r.abort());
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  if (dark) await page.addInitScript(() => { try { localStorage.setItem('nremt_theme', 'dark'); } catch (e) {} });
  if (opts.noCue) await page.addInitScript(() => { try { localStorage.setItem('tk2c:nremt-sound-trainer', '1'); } catch (e) {} });
  await page.goto(URL0 + (opts.q || ''));
  await page.waitForSelector('.snd2-img', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(700);
  return { browser, ctx, page, errs };
}
const S = page => page.evaluate(() => window.NremtSoundExplore.last._state());
async function until(page, fn, a, n = 150) { for (let i = 0; i < n; i++) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(50); } return false; }
async function tab(page, id) { await page.click(`.tk2-tab[data-v="${id}"]`); await page.waitForTimeout(300); }
async function view(page, v) { const b = await page.$(`.snd2-view [data-view="${v}"]`); if (b && await b.isVisible()) { await b.click(); await page.waitForTimeout(300); } }
async function key(page, id) { await page.click(`.snd2-key[data-key="${id}"]`); await page.waitForTimeout(120); }
async function site(page, id) { await page.click(`.snd2-hit[data-site="${id}"]`, { force: true }); }
async function stopPlay(page) { if ((await S(page)).playing) await page.click('.snd2-play'); await page.waitForTimeout(250); }

/* ---- the layout checks, run on one state */
async function measure(page) {
  return page.evaluate(() => {
    const box = document.querySelector('.snd2-scene'), B = box.getBoundingClientRect();
    const vis = e => e && !e.hidden && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > 0.05 && e.getBoundingClientRect().width > 0;
    const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
    const items = [];
    [['site label', '.snd2-sitelab'], ['lens label', '.snd2-lenslab'], ['compare switch', '.snd2-ab'], ['play', '.snd2-play'], ['front back', '.snd2-view'], ['keys', '.snd2-keys'], ['cue', '.tk2-cue']]
      .forEach(([n, s]) => { const e = box.querySelector(s); if (vis(e)) items.push({ n, ...R(e) }); });
    const steth = R(box.querySelector('.snd2-steth'));
    const rings = [...box.querySelectorAll('.snd2-ring')].map(e => ({ n: 'spot ' + e.parentNode.getAttribute('data-site'), on: e.parentNode.classList.contains('is-on'), ...R(e) }));
    const marks = [...box.querySelectorAll('.snd2-rl')].map(e => ({ n: 'mark ' + e.textContent, ...R(e) }));
    const pills = [...box.querySelectorAll('.snd2-ev')].filter(g => +g.style.opacity > 0.5).map(g => ({ n: 'pill ' + g.textContent, ...R(g.querySelector('.snd2-ev-b')) }));
    const img = box.querySelector('.snd2-img'), lens = box.querySelector('.snd2-lens-rim'), mon = box.querySelector('.snd2-mon');
    // text sizes: every visible element with its own text, in the tool (HTML and SVG)
    const small = [];
    document.querySelectorAll('.snd2 *, .tk2-cue, .snd2-ref *').forEach(e => {
      if (!vis(e) && !(e instanceof SVGElement)) return;
      const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      if (!own) return;
      if (e instanceof SVGElement && (+getComputedStyle(e).opacity === 0 || e.closest('[style*="opacity: 0"], [style*="opacity:0"]'))) return;
      if (e.closest('[hidden]')) return;
      const fs = parseFloat(getComputedStyle(e).fontSize);
      if (fs < 11) small.push((e.className && e.className.baseVal != null ? e.className.baseVal : e.className) + ' ' + fs + ' ' + e.textContent.trim().slice(0, 20));
    });
    const cz = [...document.querySelectorAll('.snd2 .tk2-cause .tk2-cz')].map(e => Math.round(e.getBoundingClientRect().top));
    const cause = document.querySelector('.snd2 .tk2-cause');
    const stage = document.querySelector('.snd2'), sr = stage.getBoundingClientRect();
    return { B: { l: B.left, t: B.top, r: B.right, b: B.bottom, w: B.width, h: B.height }, items, steth, pills, rings, marks,
      img: img ? R(img) : null, lens: lens ? R(lens) : null, mon: mon ? R(mon) : null,
      scroll: document.documentElement.scrollWidth > innerWidth + 1, small,
      rows: new Set(cz).size, causeH: cause.getBoundingClientRect().height, causeTake: cause.classList.contains('is-take'),
      keys: [...box.querySelectorAll('.snd2-key, .snd2-ab button, .snd2-view button')].filter(vis).map(e => e.getBoundingClientRect().height),
      stageH: sr.height, sceneH: B.height };
  });
}
const gap = (a, b) => Math.max(a.l - b.r, b.l - a.r, a.t - b.b, b.t - a.b);
function checkLayout(m, tag, w) {
  ok(!m.scroll, `${tag}: sideways scroll`);
  for (const it of m.items.concat([{ n: 'stethoscope', ...m.steth }])) ok(it.l >= m.B.l - 0.5 && it.r <= m.B.r + 0.5 && it.t >= m.B.t - 0.5 && it.b <= m.B.b + 0.5, `${tag}: ${it.n} clipped`);
  for (let i = 0; i < m.items.length; i++) for (let j = i + 1; j < m.items.length; j++) {
    const a = m.items[i], b = m.items[j];
    if ((a.n === 'front back' && b.n === 'keys') || (a.n === 'keys' && b.n === 'front back')) { ok(gap(a, b) >= 4, `${tag}: ${a.n} and ${b.n} touch`); continue; }
    ok(gap(a, b) >= 4, `${tag}: ${a.n} and ${b.n} overlap (${gap(a, b).toFixed(1)} px)`);
  }
  const ab = m.items.find(x => x.n === 'compare switch');
  if (ab) ok(ab.h <= 56, `${tag}: the compare switch wraps (${ab.h.toFixed(0)} px tall)`);
  const sl = m.items.find(x => x.n === 'site label');
  if (sl) ok(gap(sl, m.steth) >= 4, `${tag}: the site label touches the stethoscope (${gap(sl, m.steth).toFixed(1)})`);
  const cue = m.items.find(x => x.n === 'cue');
  if (cue) {
    ok(gap(cue, m.steth) >= 0, `${tag}: the cue covers the stethoscope`);
    for (const x of m.rings.concat(m.marks)) ok(gap(cue, x) >= 0, `${tag}: the cue covers ${x.n}`);
  }
  // the chest piece never covers another spot
  for (const x of m.rings) if (!x.on) ok(gap(m.steth, x) >= 0, `${tag}: the stethoscope covers ${x.n}`);
  // the R and L marks clear of every label and switch
  for (const mk of m.marks) for (const it of m.items) if (it.n !== 'cue') ok(gap(mk, it) >= 4, `${tag}: ${mk.n} under ${it.n}`);
  for (let i = 0; i < m.pills.length; i++) {
    for (let j = i + 1; j < m.pills.length; j++) ok(gap(m.pills[i], m.pills[j]) >= 4, `${tag}: ${m.pills[i].n} and ${m.pills[j].n} overlap`);
    const pl = m.items.find(x => x.n === 'play'); if (pl) ok(gap(m.pills[i], pl) >= 4, `${tag}: ${m.pills[i].n} under Play`);
    ok(m.pills[i].l >= m.mon.l && m.pills[i].r <= m.mon.r, `${tag}: ${m.pills[i].n} outside the strip`);
  }
  if (m.img) {
    const ai = m.img.w * m.img.h;
    ok(ai > m.lens.w * m.lens.h && ai > m.mon.w * m.mon.h, `${tag}: the chest is not the largest thing in the picture`);
  } else ok(false, `${tag}: no chest drawn`);
  ok(m.sceneH > m.stageH * 0.55, `${tag}: the picture is not the largest thing on the stage`);
  ok(!m.small.length, `${tag}: text under 11 px: ${m.small.slice(0, 3).join(' | ')}`);
  ok(m.keys.every(h => h >= 40), `${tag}: a key under 40 px tall (${m.keys.map(Math.round).join(',')})`);
  if (w <= 640 && !m.causeTake) ok(m.rows <= 2, `${tag}: the cause line takes ${m.rows} rows`);
}

/* ---- one width: every landmark state, light and dark */
async function sweepWidth(w) {
  for (const dark of [false, true]) {
    const th = dark ? 'dark' : 'light';
    const { browser, page, errs } = await open(w, dark);
    const shot = async name => { if (SHOTS) { mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: `${SHOTS}/sweep-${w}-${th}-${name}.png` }); } };
    const causeH = []; const tagged = async (name) => { const m = await measure(page); checkLayout(m, `${w} ${th} ${name}`, w); if (!m.causeTake) causeH.push(m.causeH); await shot(name); return m; };
    // the opening: the cue beside the stethoscope, nothing heard
    const m0 = await tagged('open');
    ok(m0.items.some(x => x.n === 'cue'), `${w} ${th}: no first visit cue`);
    ok((await S(page)).chain.startsWith('Off the chest'), `${w} ${th}: opening chain`);
    ok(await page.evaluate(() => document.querySelector('.snd2-lenslab').hidden && document.querySelector('.snd2-lens').classList.contains('is-idle')), `${w} ${th}: the lens is named while nothing is heard`);
    // lung sounds at their best spots, mid sound and stopped
    for (const [k, sid, v] of [['wheeze', 'lung-ru', 'front'], ['crackles', 'back-rl', 'back'], ['stridor', 'trachea', 'front']]) {
      await view(page, v); await key(page, k); await site(page, sid);
      await until(page, () => window.NremtSoundExplore.last._state().started);
      await page.waitForTimeout(900);
      const st = await S(page);
      ok(st.playing && /loudest here/.test(st.chain), `${w} ${th} ${k}: not playing loudest at ${sid} (${st.chain})`);
      await tagged(`${k}-mid`);
      await stopPlay(page); await tagged(`${k}-stopped`);
    }
    // normal at the same spot (lung: no clip, says so), and a faint spot
    await view(page, 'front'); await key(page, 'stridor'); await site(page, 'lung-rl'); await page.waitForTimeout(900);
    ok(/faint here/.test((await S(page)).chain), `${w} ${th}: stridor at the base is not faint (${(await S(page)).chain})`);
    await stopPlay(page);
    // Normal is never silent: a recording over the lung fields, a generated tracheal breath over the trachea
    await page.click('.snd2-ab [data-ab="n"]');
    await until(page, () => window.NremtSoundExplore.last._state().started); await page.waitForTimeout(900);
    let sn = await S(page);
    ok(sn.playing && sn.strip.title === 'This recording' && /Normal breath sounds, heard here/.test(sn.chain), `${w} ${th}: normal at the base does not play the recording (${sn.chain} | ${sn.strip.title})`);
    await tagged('lung-normal');
    await site(page, 'trachea'); await until(page, () => window.NremtSoundExplore.last._state().started); await page.waitForTimeout(900);
    sn = await S(page);
    ok(sn.playing && sn.strip.title === 'Generated breath' && /Normal tracheal breath sounds, louder, harsher here/.test(sn.chain), `${w} ${th}: normal at the trachea (${sn.chain} | ${sn.strip.title})`);
    await tagged('trachea-normal');
    await stopPlay(page);
    // heart sounds
    await tab(page, 'heart');
    await tagged('heart-open');
    for (const [k, sid] of [['heart-s3', 'mitral'], ['heart-s4', 'mitral'], ['heart-split-s2', 'pulmonic'], ['heart-systolic-murmur', 'aortic'], ['heart-diastolic-murmur', 'erb']]) {
      await key(page, k); await site(page, sid);
      await until(page, () => window.NremtSoundExplore.last._state().started);
      await page.waitForTimeout(1200);
      const st = await S(page);
      ok(st.playing && /loudest here/.test(st.chain), `${w} ${th} ${k}: not loudest at ${sid} (${st.chain})`);
      await tagged(`${k}-mid`);
      await stopPlay(page); await tagged(`${k}-stopped`);
    }
    await page.click('.snd2-ab [data-ab="n"]'); await page.waitForTimeout(1200); await tagged('heart-normal-mid');
    // the takeaway: a heart sound played to its end
    await page.click('.snd2-ab [data-ab="a"]');
    await until(page, () => document.querySelector('.snd2 .tk2-cause').classList.contains('is-take'), null, 200);
    const mt = await tagged('takeaway');
    ok(mt.causeTake, `${w} ${th}: no takeaway after the sound ended`);
    if (w <= 640) ok(Math.max(...causeH) - Math.min(...causeH) < 1, `${w} ${th}: the cause line changes height (${Math.min(...causeH)} to ${Math.max(...causeH)})`);
    // Test yourself: Where to listen's chest and When in the beat's strip, every text at least 11 px on screen
    for (const q of ['?mode=timing&q=s3', '?mode=where&q=s1']) {
      await page.goto(URL0 + q); await page.waitForTimeout(1200);
      if (q.includes('where')) { await page.click('.st-site[data-site="aortic"]', { force: true }); await page.waitForTimeout(300); }
      else { await page.click('.st-strip--tap', { position: { x: 60, y: 40 } }); await page.waitForTimeout(300); }
      const small = await page.evaluate(() => [...document.querySelectorAll('.st-fig svg text, .st-timing svg text')].filter(t => {
        const r = t.getBoundingClientRect(); if (!r.width || getComputedStyle(t).display === 'none' || +getComputedStyle(t).opacity === 0 || t.classList.contains('is-dim')) return false;
        const m = t.getScreenCTM(); const k = Math.hypot(m.a, m.b); return parseFloat(getComputedStyle(t).fontSize) * k < 10.95;
      }).map(t => t.textContent + ' ' + (parseFloat(getComputedStyle(t).fontSize) * Math.hypot(t.getScreenCTM().a, t.getScreenCTM().b)).toFixed(1)));
      ok(!small.length, `${w} ${th} ${q}: Test yourself text under 11 px: ${small.slice(0, 4).join(', ')}`);
      await shot('test-' + q.replace(/[^a-z0-9]/gi, '_'));
    }
    ok(!errs.length, `${w} ${th}: console errors ${errs.slice(0, 2).join(' | ')}`);
    await browser.close();
  }
}

/* ---- frame by frame, interaction, leaving, Test yourself, deep links, performance */
async function recorder(page) {
  await page.evaluate(() => {
    window.__frames = [];
    (function f() {
      const ex = window.NremtSoundExplore.last, s = ex._state(), lab = document.querySelector('.snd2-sitelab');
      const ev = [...document.querySelectorAll('.snd2-ev')].map(g => { const t = g.querySelector('.snd2-ev-t'), sp = g.querySelector('.snd2-ev-s');
        return { k: g.textContent, on: +g.style.opacity > 0.5, x: t ? +t.getAttribute('x1') : +sp.getAttribute('x') }; });
      const clips = [...document.querySelectorAll('#snd2-sc rect')].map(r => [+r.getAttribute('x'), +r.getAttribute('x') + +r.getAttribute('width')]);
      const pills = [...document.querySelectorAll('.snd2 .tk2-cause .tk2-cz')].map(p => p.className.replace('tk2-cz is-', ''));
      window.__frames.push({ t: performance.now(), chain: s.chain, pills, kind: s.strip && s.strip.kind, live: s.strip && s.strip.live, started: s.started, lensOn: s.lensOn, ev, clips,
        lab: !!lab && !lab.hidden, moving: !!document.querySelector('.snd2-steth.is-drag') || s.anim, playing: s.playing });
      if (window.__frames.length < 4000) requestAnimationFrame(f);
    })();
  });
}
function checkFrames(frames, tag) {
  let n = 0;
  for (const f of frames) {
    n++;
    const drawn = f.clips.reduce((a, c) => a + Math.max(0, c[1] - c[0]), 0);
    if (f.pills.includes('snd') && f.kind === 'heart' && f.playing) ok(drawn > 2, `${tag} frame ${n}: the sound's pill before any trace`);
    if (f.pills.includes('snd') && f.playing) ok(f.started, `${tag} frame ${n}: the sound's pill before the sound started`);
    if (f.pills.includes('why') && f.playing) ok(f.lensOn, `${tag} frame ${n}: the cause before the lens moves`);
    for (const e of f.ev) if (e.on && f.playing && f.kind === 'heart') ok(f.clips.some(c => e.x >= c[0] - 1 && e.x <= c[1] + 1), `${tag} frame ${n}: ${e.k} named over undrawn trace`);
    if (f.moving) ok(!f.lab, `${tag} frame ${n}: the spot's label shown while the stethoscope moves`);
  }
  return n;
}
async function frames() {
  for (const w of [390, 1440]) {
    const { browser, ctx, page, errs } = await open(w, false, { noCue: true });
    const tag = `frames ${w}`;
    await recorder(page);
    // mouse drag of the stethoscope from its rest to the mitral area (heart tab) and to the right base (lungs)
    const drag = async (sid) => {
      const a = await page.locator('.snd2-steth').boundingBox(), b = await page.locator(`.snd2-hit[data-site="${sid}"]`).boundingBox();
      await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
      for (let i = 1; i <= 24; i++) { await page.mouse.move(a.x + a.width / 2 + (b.x + b.width / 2 - a.x - a.width / 2) * i / 24, a.y + a.height / 2 + (b.y + b.height / 2 - a.y - a.height / 2) * i / 24); await page.waitForTimeout(16); }
      await page.mouse.up();
    };
    await drag('lung-ru');
    ok(await until(page, () => window.NremtSoundExplore.last._state().started), `${tag}: the drag did not start the wheeze`);
    ok((await S(page)).per.lung.site === 'lung-ru', `${tag}: the drag did not land on the right apex`);
    if (w < 640) { await page.waitForTimeout(700); ok(await page.evaluate(() => document.querySelector('.snd2 .tk2-cause').getBoundingClientRect().bottom <= innerHeight + 1), `${tag}: the cause line is off screen after the drop`); }
    ok(await page.evaluate(() => /stethoscope\. Right apex/.test(document.querySelector('.snd2-svg').getAttribute('aria-label'))), `${tag}: the picture's screen reader name does not follow the state`);
    await page.waitForTimeout(1500);
    const lv = await S(page);
    if (!NOCORS) ok(lv.strip.live > 10, `${tag}: no live trace of the recording (${lv.strip.live})`);
    else ok(lv.strip.live === 0 && /Typical breath/.test(lv.strip.title), `${tag}: the no CORS fallback (${lv.strip.title})`);
    await tab(page, 'heart');
    await drag('mitral'); await page.waitForTimeout(400);
    await key(page, 'heart-s4'); await page.waitForTimeout(2600);
    await page.click('.snd2-ab [data-ab="n"]'); await page.waitForTimeout(1600);
    await key(page, 'heart-split-s2'); await page.waitForTimeout(600);
    // fast drag across the heart spots and back, landing on the aortic area
    await drag('aortic'); await page.waitForTimeout(1800);
    // keyboard: the stethoscope moves spot to spot with the arrows and plays there
    const HS = ['aortic', 'pulmonic', 'erb', 'tricuspid', 'mitral'], was = (await S(page)).per.heart.site, next = HS[(HS.indexOf(was) + 1) % 5];
    await page.focus('.snd2-steth'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(700);
    ok((await S(page)).per.heart.site === next && (await S(page)).playing, `${tag}: ArrowRight did not move from ${was} to ${next} and play`);
    await page.keyboard.press('End'); await page.waitForTimeout(500);
    ok((await S(page)).per.heart.site === 'mitral', `${tag}: End did not move to the mitral area`);
    // leave mid sound for Test yourself: everything stops; back: finished and clean
    await page.evaluate(() => { window.__stops = 0; const b = window.LevlSoundBank, s0 = b.stop; b.stop = function(){ window.__stops++; return s0.apply(this, arguments); }; });
    await page.waitForTimeout(300);
    await page.click('.ls-modes button:has-text("Test yourself")');
    await page.waitForTimeout(500);
    let st = await S(page);
    ok(!st.playing && !st.raf && !st.timers && !st.on && !st.anim, `${tag}: Explore still running after Test yourself (${JSON.stringify({ p: st.playing, r: st.raf, t: st.timers, on: st.on })})`);
    ok(await page.evaluate(() => window.__stops > 0), `${tag}: the sound bank was not stopped`);
    await page.click('.ls-modes button:has-text("Explore")'); await page.waitForTimeout(600);
    st = await S(page);
    ok(st.on && !st.playing && st.strip.kind === 'heart' && st.strip.to - st.strip.from > 100, `${tag}: Explore not clean and finished on return (${JSON.stringify(st.strip)})`);
    // "?" mid sound stops it
    await page.click('.snd2-play'); await until(page, () => window.NremtSoundExplore.last._state().started); await page.waitForTimeout(400);
    await page.click('.ls-root .ls-help').catch(() => {});
    await page.waitForTimeout(400);
    const sheet = await page.evaluate(() => !!document.querySelector('.ls-root.is-sheet'));
    if (sheet) ok(!(await S(page)).playing, `${tag}: the sound still plays under "?"`);
    else ok(false, `${tag}: could not open "?"`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    const fr = await page.evaluate(() => window.__frames);
    const n = checkFrames(fr, tag);
    ok(n > 200, `${tag}: only ${n} frames recorded`);
    console.log(`${tag}: ${n} frames`);
    ok(!errs.length, `${tag}: console errors ${errs.slice(0, 2).join(' | ')}`);
    // performance: a full drag with the CPU throttled x4
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const a0 = await page.locator('.snd2-steth').boundingBox(); // one drag first: the audio context starts once
    await page.mouse.move(a0.x + a0.width / 2, a0.y + a0.height / 2); await page.mouse.down(); await page.mouse.move(a0.x + 30, a0.y + 30, { steps: 5 }); await page.mouse.up(); await page.waitForTimeout(800);
    await page.evaluate(() => { window.__ft = []; let last = 0; (function f(t){ if(last) window.__ft.push(t - last); last = t; if(window.__ft.length < 400) requestAnimationFrame(f); })(); });
    const a = await page.locator('.snd2-steth').boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
    for (let i = 0; i < 60; i++) { await page.mouse.move(a.x + a.width / 2 - 120 * Math.sin(i / 10), a.y + a.height / 2 - 80 * (1 - Math.cos(i / 10))); await page.waitForTimeout(16); }
    await page.mouse.up(); await page.waitForTimeout(300);
    const ft = (await page.evaluate(() => window.__ft)).slice(2).sort((x, y) => x - y);
    const med = ft[Math.floor(ft.length / 2)], p95 = ft[Math.floor(ft.length * .95)];
    console.log(`${tag}: drag x4 median ${med.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms`);
    ok(med < 20 && p95 <= 50, `${tag}: drag too slow with CPU x4 (median ${med.toFixed(1)}, p95 ${p95.toFixed(1)})`);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await browser.close();
  }
  // a real touch drag at 390, at the scrolled end of the page
  {
    const { browser, ctx, page, errs } = await open(390, false, { noCue: true });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(300);
    await page.locator('.snd2-steth').scrollIntoViewIfNeeded();
    const cdp = await ctx.newCDPSession(page);
    const a = await page.locator('.snd2-steth').boundingBox(), b = await page.locator('.snd2-hit[data-site="lung-lu"]').boundingBox();
    const pt = (x, y) => [{ x, y, id: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(a.x + a.width / 2, a.y + a.height / 2) });
    for (let i = 1; i <= 16; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(a.x + a.width / 2 + (b.x + 22 - a.x - a.width / 2) * i / 16, a.y + a.height / 2 + (b.y + 22 - a.y - a.height / 2) * i / 16) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(900);
    const st = await S(page);
    ok(st.per.lung.site === 'lung-lu' && st.playing, `touch 390: the touch drag did not land and play (${st.per.lung.site})`);
    ok(!errs.length, `touch 390: console errors ${errs.join(' | ')}`);
    await browser.close();
  }
  // reduced motion: the whole trace at once, a still lens
  {
    const { browser, page, errs } = await open(1440, false, { reduced: true, noCue: true });
    await tab(page, 'heart'); await key(page, 'heart-s3'); await site(page, 'mitral');
    await until(page, () => window.NremtSoundExplore.last._state().started);
    await page.waitForTimeout(80);
    const st = await S(page);
    ok(st.strip.to - st.strip.from > 300, `reduced: the trace is not drawn whole at once (${st.strip.from}-${st.strip.to})`);
    ok(!errs.length, `reduced: console errors ${errs.join(' | ')}`);
    await browser.close();
  }
  // Test yourself: three parts, right and wrong answers, record ids
  {
    const { browser, page, errs } = await open(1440, false, { noCue: true, q: '?mode=where&q=s1' });
    await page.evaluate(() => { window.__rec = []; const R = window.NremtToolResults; if (R) { const r0 = R.record; R.record = function(x){ window.__rec.push(x); return r0.apply(this, arguments); }; } });
    ok(await page.evaluate(() => /S1 loudest/.test((document.querySelector('.st-q strong') || {}).textContent || '')), 'where: the deep link question is not S1');
    await page.click('.st-site[data-site="aortic"]', { force: true }); await page.waitForTimeout(300);
    ok(await page.evaluate(() => /Not there/.test(document.querySelector('.st-verdict').textContent)), 'where: a wrong spot is not marked wrong');
    await page.click('.st-next'); await page.waitForTimeout(300);
    const okIds = await page.evaluate(() => { const P = window.SoundStage.pure, q = document.querySelector('.st-q strong').textContent; const w = P.WHERE.find(x => x.ask === q); return w.ok; });
    await page.click(`.st-site[data-site="${okIds[0]}"]`, { force: true }); await page.waitForTimeout(300);
    ok(await page.evaluate(() => /^Right/.test(document.querySelector('.st-verdict').textContent)), 'where: a right spot is not marked right');
    // name the sound: no autoplay; a right and a wrong answer
    await page.selectOption('.ls-root select', 'name').catch(async () => { await page.click('text=Where to listen'); await page.click('text=Name the sound'); });
    await page.waitForTimeout(400);
    ok(await page.evaluate(() => !document.querySelector('#quizPlayBtn.playing')), 'name: the clip played on its own');
    // answer rounds until a right and a wrong answer have both been seen; the marking must match the verdict
    const seen = { right: 0, wrong: 0 }; const ids = [];
    for (let r = 0; r < 10 && !(seen.right && seen.wrong); r++) {
      const choices = await page.$$eval('#quizChoices [data-choice]', bs => bs.map(b => b.dataset.choice));
      const pickId = choices[(r * 3) % choices.length];
      await page.click(`#quizChoices [data-choice="${pickId}"]`); await page.waitForTimeout(150);
      const res = await page.evaluate((id) => ({ v: document.querySelector('.feedback-verdict').textContent, right: document.querySelector('#quizChoices .correct').dataset.choice, id }), pickId);
      ids.push(res.right);
      if (res.right === pickId) { seen.right++; ok(/^Correct/.test(res.v), `name: a right answer marked "${res.v}"`); }
      else { seen.wrong++; ok(/^Not quite/.test(res.v), `name: a wrong answer marked "${res.v}"`); }
      await page.click('#nextRoundBtn'); await page.waitForTimeout(150);
    }
    ok(seen.right && seen.wrong, `name: did not see both a right and a wrong answer (${JSON.stringify(seen)})`);
    const right = ids[0];
    const rec = await page.evaluate(() => window.__rec.map(r => r.id));
    ok(rec.includes('where-s1') && rec.includes(right), `record ids changed: ${rec.join(',')}`);
    ok(!errs.length, `test yourself: console errors ${errs.join(' | ')}`);
    await browser.close();
  }
  // deep links (fresh loads)
  for (const [q, want] of [['', 'explore'], ['#test', 'quiz'], ['?mode=timing&q=s4', 'quiz'], ['?mode=explore', 'explore'], ['#snd-crackles', 'explore'], ['#snd-snoring', 'sheet'], ['?studio=0', 'old']]) {
    const { browser, page, errs } = await open(1440, false, { noCue: true, q });
    const got = await page.evaluate(() => {
      if (document.querySelector('.ls-root.is-sheet')) return 'sheet';
      if (!document.querySelector('.snd2')) return 'old';
      return document.querySelector('.ls-root').getAttribute('data-mode') === 'quiz' ? 'quiz' : 'explore';
    });
    ok(got === want, `deep link ${q || '(none)'}: ${got}, wanted ${want}`);
    if (q === '#snd-crackles') { const st = await S(page); ok(st.per.lung.key === 'crackles' && st.per.lung.site === 'back-rl' && !st.playing, `#snd-crackles: ${JSON.stringify(st.per.lung)}`); }
    if (q.startsWith('?mode=timing')) ok(await page.evaluate(() => !document.querySelector('.st-timing').hidden), 'timing deep link: the strip is hidden');
    ok(!errs.length, `deep link ${q}: console errors ${errs.join(' | ')}`);
    await browser.close();
  }
}

const w = arg('--width', null);
if (w) await sweepWidth(+w); else await frames();
server.close();
for (const f of fails.slice(0, 40)) console.log('FAIL ' + f);
console.log(`${pass} passed, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
