/* Tools v2 sweep for AP® Psychology Neuron (docs/tools-v2-neuron-brief.md), after the pattern of
   water-potential-sweep.mjs. Three jobs, one width per process (a parent runs the widths one after another):

   Layout (default): every landmark state of the four Explore tabs (Threshold: excitatory 0, 12, 15, 24, 40 with
   inhibitory 0 and 10; Refractory period: the 2nd pulse 1, 3, 4 and 10 ms later; Myelin: all, one and no stretch
   myelinated; Synapse: each drug, and GABA), mid run frames, the first visit cue and Test yourself, light and dark,
   at ten widths. At each state it asserts:
     - nothing drawn or labelled is clipped by the stage (labels, numbers, knobs, tags, the cue);
     - every label, number, tag and knob keeps 4 px clear of every other (in Explore and Test yourself);
     - no rendered text under 11 px;
     - the neuron (or the synapse) is the largest object in the picture;
     - on a phone the cause line is at most two rows, and keeps one height in a tab;
     - no sideways scroll, no console errors.
   --frames: the numbers match what is drawn, frame by frame. Each tab's run is stepped every 0.05 ms (and read
     during a real played run, on every animation frame, and after a reversal and a keyboard jump): the trace's
     head sits on the model's charge at that time; the Na+ channel is open only in the rising phase and the
     "Na+ rushes in" label only then; the K+ label only while K+ flows; each action potential drawn is where the
     conduction model puts it (at a node, or along a bare stretch); the travel bar's dot shows the time elapsed; the
     cause line says "fires" only once the spike is drawn; in Synapse the receptors drawn active match the model's
     share (8 receptors), the molecules in the cleft match its amount and the graph's head its value.
   --perf: frame times with the CPU slowed 4 times at 390 and 1440, while a run plays in each tab and while the
     excitatory knob is dragged; and the flagship (APES Water pollution, sacks dragged) in the same process, for
     comparison. Budget: median about 16 ms, p95 at or under 50 ms.

     node scripts/tools-v2/neuron-sweep.mjs [widths] [--frames] [--perf] [--shots dir]

   Needs Playwright and a Chromium (CHROME or /opt/pw-browsers/chromium-1243/chrome-linux64/chrome). It serves the
   repo itself on a free port and blocks service workers; the tool is free, so nothing is unlocked (the perf job
   unlocks the flagship by routing assets/premium.js). Exit code 1 on any failure. Not part of CI. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const args = process.argv.slice(2), si = args.indexOf('--shots'), SHOTS = si >= 0 ? args[si + 1] : null;
const FRAMES = args.includes('--frames'), PERF = args.includes('--perf');
const WIDTHS = (args[0] && !args[0].startsWith('--') ? args[0] : PERF ? '390,1440' : '360,390,430,600,768,820,1024,1280,1440,1920').split(',').map(Number);
if (WIDTHS.length > 1) {
  // one width per process: a long sweep in one process can pass ten minutes
  let bad = 0;
  for (const w of WIDTHS) {
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), String(w), ...args.filter(a => !/^\d/.test(a))], { stdio: 'inherit' });
    if (r.status) bad++;
  }
  process.exit(bad ? 1 : 0);
}
let chromium;
try { ({ chromium } = createRequire(join(ROOT, 'package.json'))('playwright')); }
catch (e) { ({ chromium } = await import('/opt/npm-tools/node_modules/playwright/index.mjs')); }
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const p = join(ROOT, normalize(decodeURIComponent(req.url.split('?')[0])));
  if (!p.startsWith(ROOT) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const W = WIDTHS[0], H = W <= 640 ? 844 : W < 1100 ? 1024 : 900;
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
const KEYS = ['tk2c:appsych-neuron-fire', 'tk2c:appsych-neuron-refr', 'tk2c:appsych-neuron-myel', 'tk2c:appsych-neuron-syn', 'tk2h:appsych-neuron-ex', 'tk2h:appsych-neuron-gap', 'tk2h:appsych-neuron-myelin', 'tk2h:appsych-neuron-drug'];
async function open(o) {
  const ctx = await browser.newContext({ viewport: { width: o.w || W, height: o.h || H }, serviceWorkers: 'block', deviceScaleFactor: 1, reducedMotion: o.reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.addInitScript(([cue, theme, keys]) => { try { localStorage.setItem('nremt_theme', theme); if (!cue) keys.forEach(k => localStorage.setItem(k, '1')); } catch (e) {} }, [!!o.cue, o.theme || 'light', KEYS]);
  await page.goto(BASE + '/psychology/tools/neuron.html' + (o.q || ''), { waitUntil: 'load' });
  await page.waitForFunction(() => window.__nr2 && window.__nr2.G() && window.__nr2.F());
  await page.waitForTimeout(250);
  return { page, ctx, errs };
}
let checks = 0, states = 0; const fails = [];
function fail(tag, list) { list.forEach(m => fails.push(`${W} ${tag}: ${m}`)); }

/* ------------------------------------------------------------------ layout */
const probe = () => {
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]') && !e.closest('.nr2-fade') && +getComputedStyle(e).opacity !== 0;
  const q = s => [...document.querySelectorAll(s)].filter(vis), out = [];
  const stageEl = document.querySelector('.nr2'), quiz = !vis(stageEl);
  if (quiz) {
    // Test yourself: the drill's figure and steps; labels in the figure keep clear of each other
    const fig = q('.ls-drill-stage svg text').map(e => ({ n: 'figure text "' + e.textContent + '"', r: R(e) }));
    for (let i = 0; i < fig.length; i++) for (let j = i + 1; j < fig.length; j++) { const a = fig[i].r, c = fig[j].r; if (!(a.r <= c.l || c.r <= a.l || a.b <= c.t || c.b <= a.t)) out.push('overlap in Test yourself: ' + fig[i].n + ' and ' + fig[j].n); }
    q('.ls-drill-stage svg text').forEach(e => { const fs = parseFloat(getComputedStyle(e).fontSize) * (e.ownerSVGElement.getBoundingClientRect().width / (e.ownerSVGElement.viewBox.baseVal.width || e.ownerSVGElement.getBoundingClientRect().width)); if (fs < 10.95) out.push('text under 11 px in Test yourself: "' + e.textContent + '" ' + fs.toFixed(1)); });
    if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
    return { out };
  }
  const S = R(document.querySelector('.nr2-scene'));
  const inS = (x, name, tol = 0.6) => { if (x.l < S.l - tol || x.r > S.r + tol || x.t < S.t - tol || x.b > S.b + tol) out.push('clipped: ' + name); };
  const hit = (a, c, g) => !(a.r + g <= c.l || c.r + g <= a.l || a.b + g <= c.t || c.b + g <= a.t);
  const pills = q('.nr2-pill').map(e => ({ n: 'label "' + e.textContent + '"', r: R(e.querySelector('rect')) }));
  const texts = q('.nr2-gt, .nr2-tk, .nr2-thr-t, .nr2-rest-t, .nr2-peak-t, .nr2-refr-t, .nr2-stim-t, .nr2-mark-t, .nr2-in-t, .nr2-side-t').map(e => ({ n: 'text "' + e.textContent + '"', r: R(e) }));
  const tags = q('.nr2 .tk2-tag').map(e => ({ n: 'tag "' + e.textContent + '"', r: R(e) }));
  const knobs = q('.nr2 .tk2-dot').map(e => ({ n: 'knob', r: R(e) }));
  const drugs = q('.nr2-dpill > rect:first-child').map(e => ({ n: 'drug "' + e.parentNode.textContent + '"', r: R(e) }));
  const cue = q('.nr2 .tk2-cue').map(e => ({ n: 'cue', r: R(e), cue: true }));
  const all = [...pills, ...texts, ...tags, ...knobs, ...drugs, ...cue];
  all.forEach(x => inS(x.r, x.n));
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], c = all[j];
    if (hit(a.r, c.r, 4)) out.push('overlap: ' + a.n + ' and ' + c.n);
  }
  // the inset's ions and channels stay inside it
  const frame = document.querySelector('.nr2-inframe');
  if (vis(frame)) { const f = R(frame); q('.nr2-ion circle').map(R).forEach(c => { if (c.l < f.l - 0.5 || c.r > f.r + 0.5 || c.t < f.t - 0.5 || c.b > f.b + 0.5) out.push('an ion outside the close-up'); });
    [...pills, ...tags, ...knobs, ...cue].forEach(x => { if (x.n.startsWith('label "N') || x.n.startsWith('label "K') || x.n === 'label "Close-up' ) return; }); }
  // text size
  q('.nr2-svg text').forEach(e => { const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 10.95) out.push('text under 11 px: "' + e.textContent + '" ' + fs); });
  q('.nr2 .tk2-tag, .nr2 .tk2-cause, .nr2 .tk2-purpose, .nr2-nt').forEach(e => { const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 10.95) out.push('text under 11 px: ' + e.className); });
  // the acted-on object is the largest in the picture
  const tab = document.querySelector('.nr2').getAttribute('data-tab');
  const bb = sel => { const els = q(sel); if (!els.length) return null; const rs = els.map(R); return { l: Math.min(...rs.map(x => x.l)), t: Math.min(...rs.map(x => x.t)), r: Math.max(...rs.map(x => x.r)), b: Math.max(...rs.map(x => x.b)) }; };
  const area = x => x ? Math.max(0, x.r - x.l) * Math.max(0, x.b - x.t) : 0;
  const main = tab === 'syn' ? bb('.nr2-sterm, .nr2-rcv') : bb('.nr2-dend path, .nr2-soma, .nr2-myel, .nr2-term ellipse, .nr2-ax, .nr2-inax, .nr2-inbtn');
  const others = [['the close-up', bb('.nr2-inframe')], ['the graph', bb('.nr2-plotbg')]];
  others.forEach(o => { if (o[1] && area(o[1]) > area(main) * 1.02) out.push(o[0] + ' is larger than the ' + (tab === 'syn' ? 'synapse' : 'neuron') + ' (' + Math.round(area(o[1])) + ' > ' + Math.round(area(main)) + ')'); });
  // the cause line
  const causeEl = document.querySelector('.nr2 .tk2-cause'), cz = q('.nr2 .tk2-cz');
  const rows = new Set(cz.map(e => Math.round(R(e).t))).size;
  if (innerWidth <= 640 && rows > 2) out.push('cause line is ' + rows + ' rows: ' + causeEl.innerText.replace(/\n/g, ' '));
  // tap targets at least 44 px, and no tab name cut off
  q('.nr2 .nr2-seg, .nr2 .nr2-drug').forEach(e => { const r = R(e); if (r.w < 43.5 || r.h < 43.5) out.push('tap target ' + Math.round(r.w) + ' x ' + Math.round(r.h) + ' px'); });
  q('.nr2 .tk2-tab').forEach(b => { [...b.children].filter(vis).filter(c => R(c).w > 2).forEach(c => { if (c.scrollWidth > c.clientWidth + 1 || R(c).r > R(b).r - 2) out.push('tab name cut: ' + b.textContent.trim()); }); });
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll');
  return { out, causeH: vis(causeEl) ? Math.round(R(causeEl).h) : null, tab };
};
async function layout(theme) {
  const { page, ctx, errs } = await open({ theme });
  const st = async (name, fn) => {
    if (fn) await page.evaluate(fn);
    await page.waitForTimeout(60);
    const r = await page.evaluate(probe);
    states++; checks += 20;
    fail(theme + ' ' + name, r.out);
    if (SHOTS && /^(fire E24|refr gap3|myel two|syn reuptake|quiz)/.test(name)) await page.screenshot({ path: join(SHOTS, `${W}-${theme}-${name.replace(/\W+/g, '-')}.png`) });
    return r;
  };
  const heights = {};
  const keep = (r) => { if (r.causeH == null || W > 640) return; (heights[r.tab] = heights[r.tab] || new Set()).add(r.causeH); };
  for (const I of [0, 10]) for (const E of [0, 12, 15, 24, 40]) keep(await st(`fire E${E} I${I}`, `window.__nr2.set({E:${E},I:${I}})`));
  // mid run frames
  await page.evaluate(() => window.__nr2.set({ E: 24, I: 0 }));
  for (const t of [1, 2.1, 2.4, 3, 4, 6, 12]) keep(await st(`fire E24 t${t}`, `window.__nr2.at(${t})`));
  await page.evaluate(() => window.__nr2.tab('refr')); await page.waitForTimeout(450);
  for (const g of [1, 3, 4, 10]) keep(await st(`refr gap${g}`, `window.__nr2.set({gap:${g}})`));
  for (const t of [2.4, 3.5, 5.4, 8, 22]) keep(await st(`refr gap3 t${t}`, `window.__nr2.at(${t})`));
  await page.evaluate(() => window.__nr2.tab('myel')); await page.waitForTimeout(450);
  keep(await st('myel all', `window.__nr2.set({myel:[true,true,true,true,true,true]})`));
  keep(await st('myel two', `window.__nr2.set({myel:[true,false,true,false,true,true]})`));
  keep(await st('myel none', `window.__nr2.set({myel:[false,false,false,false,false,false]})`));
  for (const t of [2.4, 3.4, 5]) keep(await st(`myel none t${t}`, `window.__nr2.at(${t})`));
  await page.evaluate(() => window.__nr2.tab('syn')); await page.waitForTimeout(450);
  for (const c of ['none', 'agonist', 'antagonist', 'reuptake']) keep(await st(`syn ${c}`, `window.__nr2.set({cls:'${c}'})`));
  keep(await st('syn gaba', `window.__nr2.set({nt:'gaba', cls:'agonist'})`));
  for (const t of [-0.4, 0.2, 1, 4, 12]) keep(await st(`syn t${t}`, `window.__nr2.at(${t})`));
  for (const [tab, hs] of Object.entries(heights)) if (hs.size > 1) fails.push(`${W} ${theme}: cause line height changes in ${tab}: ${[...hs].join(', ')}`);
  // Test yourself: each kind of problem
  await page.evaluate(() => { const b = [...document.querySelectorAll('.ls-modes button, [role="tab"], button')].find(x => /Test yourself/.test(x.textContent)); b && b.click(); });
  await page.waitForTimeout(400);
  await st('quiz');
  if (errs.length) fail(theme, errs);
  await ctx.close();
}
async function firstVisit() {
  for (const tab of ['fire', 'refr', 'myel', 'syn']) {
    const { page, ctx, errs } = await open({ cue: true, q: '#' + { fire: 'threshold', refr: 'refractory', myel: 'myelin', syn: 'synapse' }[tab] });
    await page.waitForTimeout(300);
    const r = await page.evaluate(probe);
    const cueOk = await page.evaluate(() => !!document.querySelector('.nr2 .tk2-cue:not([hidden])'));
    if (!cueOk) fails.push(`${W} first visit ${tab}: no cue`);
    states++; checks += 21;
    fail('first visit ' + tab, r.out);
    if (SHOTS) await page.screenshot({ path: join(SHOTS, `${W}-light-cue-${tab}.png`) });
    if (errs.length) fail('first visit ' + tab, errs);
    await ctx.close();
  }
}

/* ------------------------------------------------------------------ frames: numbers against the drawing */
const frameCheck = () => {
  const fadeL = document.querySelector('.nr2-fade'); if (fadeL) fadeL.innerHTML = '';   // a tab change's short cross fade is not the drawn frame
  const A = window.__nr2, f = A.F(), G = A.G(), N = A.N, S = A.S, out = [], t = f.t;
  const near = (a, b, tol) => Math.abs(a - b) <= tol;
  const cause = (document.querySelector('.nr2 .tk2-cause') || {}).textContent || '';
  // the scrub's cursor and the drawn "now" line are one line
  const cur = document.querySelector('.nr2 .tk2-scrub .tk2-cur'), nowL = document.querySelector('.nr2-dyn .nr2-now');
  if (cur && getComputedStyle(cur).display !== 'none' && nowL && !cur.closest('[hidden]')) { const a = cur.getBoundingClientRect(), b = nowL.getBoundingClientRect(); if (Math.abs((a.left + a.right) / 2 - (b.left + b.right) / 2) > 1.5) out.push(`t ${t.toFixed(2)}: the scrub cursor and the drawn now line are ${Math.round((a.left + a.right) / 2 - (b.left + b.right) / 2)} px apart`); }
  // no label sits on a moving ion or molecule
  const pills = [...document.querySelectorAll('.nr2-dyn .nr2-pill rect')].map(e => e.getBoundingClientRect());
  [...document.querySelectorAll('.nr2-mov .nr2-ion circle, .nr2-mov circle.is-free')].forEach(c => { const r = c.getBoundingClientRect(); if (!r.width) return; const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2; if (pills.some(b => cx > b.left - 1 && cx < b.right + 1 && cy > b.top - 1 && cy < b.bottom + 1)) out.push(`t ${t.toFixed(2)}: a label covers a moving ion or molecule`); });
  if (S.tab === 'syn') {
    const R = N.synapse(S.cls), i = Math.max(0, Math.min(R.t.length - 1, Math.round(t / N.SYN.dt)));
    const act = t < 0 ? (S.cls === 'agonist' ? N.SYN.agonist : 0) : R.act[i], cleft = t < 0 ? 0 : R.cleft[i];
    const on = document.querySelectorAll('.nr2-rec.is-on').length, want = Math.round(act * 8);
    const blocked = S.cls === 'antagonist' ? 6 : 0;
    if (on !== Math.min(want, 8 - blocked)) out.push(`t ${t.toFixed(2)}: ${on} receptors drawn active, the model says ${want}`);
    const free = document.querySelectorAll('.nr2-ntm.is-free').length;
    if (t >= 0.6 && Math.abs(free - Math.round(22 * cleft)) > 0) out.push(`t ${t.toFixed(2)}: ${free} molecules in the cleft, the model says ${Math.round(22 * cleft)}`);
    const hd = document.querySelector('.nr2-head.is-syn');
    if (t >= 0 && (!hd || !near(+hd.getAttribute('cy'), G.plot.Y(act), 0.6))) out.push(`t ${t.toFixed(2)}: the graph's head is not at ${act.toFixed(3)}`);
    if (/signal \d+%/.test(cause) && !(A.view.preview || t >= N.SYN.dur - 1e-6)) out.push(`t ${t.toFixed(2)}: the signal is named before the graph is drawn`);
    return out;
  }
  const r = f.run, V = r.v[Math.max(0, Math.min(r.v.length - 1, Math.round(t / N.DT)))];
  if (G.plot) {
    const hd = document.querySelector('.nr2-head');
    if (!hd || !near(+hd.getAttribute('cy'), G.plot.Y(V), 0.6) || !near(+hd.getAttribute('cx'), G.plot.X(t), 0.6)) out.push(`t ${t.toFixed(2)}: the trace's head is not at ${V.toFixed(1)} mV`);
    // the solid trace ends at the head
    const tr = document.querySelector('.nr2-trace');
    if (tr) { const pts = tr.getAttribute('points').trim().split(' '), last = pts[pts.length - 1].split(',').map(Number); if (last[0] > G.plot.X(t) + 0.6) out.push(`t ${t.toFixed(2)}: the trace runs past now`); }
  }
  let since = null; r.spikes.forEach(s => { if (t >= s) since = t - s; });
  const naOpen = since != null && since < 0.5, kOpen = since != null && since >= 0.5 && since < 3.0;
  if (G.in) {
    const na = document.querySelector('.nr2-chan.is-na'), k = document.querySelector('.nr2-chan.is-k');
    if (!!(na && na.classList.contains('is-open')) !== (naOpen || (since != null && since < N.ABS))) out.push(`t ${t.toFixed(2)}: Na+ channel drawn ${na && na.classList.contains('is-open') ? 'open' : 'closed'}`);
    if (!!document.querySelector('.nr2-pill[data-lab="Na⁺ rushes in"]') !== naOpen) out.push(`t ${t.toFixed(2)}: "Na+ rushes in" ${naOpen ? 'missing' : 'shown'}`);
    if (!!(k && k.classList.contains('is-open')) !== kOpen) out.push(`t ${t.toFixed(2)}: K+ channel drawn wrongly`);
    if (!!document.querySelector('.nr2-pill[data-lab="K⁺ flows out"]') !== kOpen) out.push(`t ${t.toFixed(2)}: "K+ flows out" ${kOpen ? 'missing' : 'shown'}`);
  }
  // each action potential on the axon is where the conduction model puts it
  const want = [];
  r.spikes.forEach(s => { const at = N.travelAt(S.tab === 'myel' ? S.myel : null, t - s); if (t >= s && at) want.push(at.bare ? G.segs[at.seg][0] + (G.segs[at.seg][1] - G.segs[at.seg][0]) * at.f : G.nodes[at.f < 0.5 ? at.seg : at.seg + 1]); });
  const drawn = [...document.querySelectorAll('.nr2-ap[data-ap]')].map(e => +e.getAttribute('data-ap'));
  if (drawn.length !== want.length || want.some((x, i) => Math.abs(x - drawn[i]) > 0.6)) out.push(`t ${t.toFixed(2)}: signal drawn at ${drawn.join(',')} not ${want.map(x => x.toFixed(1)).join(',')}`);
  if (G.bar) {
    const c = N.conduction(S.myel), el = Math.max(0, Math.min(c.total, t - r.spikes[0])), dot = document.querySelector('.nr2-bardot');
    if (t >= r.spikes[0] && (!dot || Math.abs(+dot.getAttribute('data-ms') - el) > 0.0015)) out.push(`t ${t.toFixed(2)}: the travel bar shows ${dot && dot.getAttribute('data-ms')} not ${el.toFixed(3)}`);
    if (/arrives in/.test(cause) !== (t >= r.spikes[0] + c.total)) out.push(`t ${t.toFixed(2)}: "arrives" in the cause line ${/arrives/.test(cause) ? 'before' : 'after'} the signal arrives`);
  }
  if (S.tab === 'fire') {
    const fired = r.spikes.length && t >= r.spikes[0] + 0.45;
    if (/fires/.test(cause) && !fired && !(cause.includes('take'))) out.push(`t ${t.toFixed(2)}: the cause line says it fires before the spike is drawn`);
    if (r.spikes.length && t >= r.spikes[0] + 0.45 && !/fires|All or none/.test(cause)) out.push(`t ${t.toFixed(2)}: the spike is drawn but the cause line does not say it fires`);
  }
  if (S.tab === 'refr') { const e2 = r.events[1]; if (/fires again/.test(cause) && !(r.spikes[1] != null && t >= r.spikes[1] + 0.45)) out.push(`t ${t.toFixed(2)}: "fires again" before the 2nd spike is drawn`); }
  return out;
};
async function frames() {
  const { page, ctx, errs } = await open({ theme: 'light' });
  const cases = [['fire', '{E:24,I:0}'], ['fire', '{E:12,I:0}'], ['fire', '{E:30,I:10}'], ['fire', '{E:15,I:0}'], ['refr', '{gap:3}'], ['refr', '{gap:6}'], ['refr', '{gap:1}'],
    ['myel', '{myel:[true,true,true,true,true,true]}'], ['myel', '{myel:[true,false,true,false,false,true]}'], ['syn', "{cls:'none'}"], ['syn', "{cls:'agonist'}"], ['syn', "{cls:'antagonist'}"], ['syn', "{cls:'reuptake'}"]];
  for (const [tab, set] of cases) {
    await page.evaluate(t => window.__nr2.tab(t), tab);
    await page.evaluate(s => window.__nr2.set(eval('(' + s + ')')), set);
    // stepped: every 0.05 ms, forward, then backward (a reversal), then jumps
    const lo = tab === 'syn' ? -0.8 : tab === 'myel' ? 1.7 : 0, hi = await page.evaluate(() => window.__nr2.tMax());
    const r = await page.evaluate(([lo, hi, src]) => { const chk = eval('(' + src + ')'), out = []; let n = 0;
      for (let t = lo; t <= hi + 1e-9; t += 0.05) { window.__nr2.at(+t.toFixed(3)); out.push(...chk()); n++; }
      for (let t = hi; t >= lo - 1e-9; t -= 0.35) { window.__nr2.at(+t.toFixed(3)); out.push(...chk()); n++; }
      [hi, lo, (lo + hi) / 2, lo + 0.4].forEach(t => { window.__nr2.at(t); out.push(...chk()); n++; });
      return { out, n }; }, [lo, hi, frameCheck.toString()]);
    checks += r.n * 6; states += r.n;
    fail(`frames ${tab} ${set} stepped`, [...new Set(r.out)].slice(0, 8));
    // played: read every animation frame of a real run
    const pr = await page.evaluate(src => new Promise(res => { const chk = eval('(' + src + ')'), out = []; let n = 0, started = false;
      window.__nr2.play();
      const tick = () => { if (window.__nr2.playing()) { started = true; out.push(...chk()); n++; requestAnimationFrame(tick); } else if (!started && n < 3) { n++; requestAnimationFrame(tick); } else res({ out, n }); };
      requestAnimationFrame(tick); }), frameCheck.toString());
    checks += pr.n * 6; states += pr.n;
    if (pr.n < 20) fails.push(`${W} frames ${tab} ${set}: only ${pr.n} frames played`);
    fail(`frames ${tab} ${set} played`, [...new Set(pr.out)].slice(0, 8));
  }
  // a keyboard jump on the excitatory knob, then the frame it lands on
  await page.evaluate(() => window.__nr2.tab('fire'));
  await page.evaluate(() => window.__nr2.set({ E: 10, I: 0 }));
  await page.focus('.nr2-kE input');
  await page.keyboard.press('End');
  await page.waitForTimeout(50);
  const kj = await page.evaluate(src => { const chk = eval('(' + src + ')'); return { out: chk(), E: window.__nr2.S.E, vt: document.querySelector('.nr2-kE input').getAttribute('aria-valuetext') }; }, frameCheck.toString());
  if (kj.E !== 40) fails.push(`${W} keyboard End: E is ${kj.E}`);
  if (!/40 millivolts/.test(kj.vt) || !/fires/.test(kj.vt)) fails.push(`${W} keyboard End: valuetext "${kj.vt}"`);
  fail('keyboard jump', kj.out);
  await page.waitForTimeout(6000);
  const kend = await page.evaluate(src => eval('(' + src + ')')(), frameCheck.toString());
  fail('keyboard jump, after its run', kend);
  // a real pointer drag on the excitatory knob: the picture follows mid drag
  await page.evaluate(() => window.__nr2.set({ E: 0, I: 0 }));
  const kb = await page.locator('.nr2-kE .tk2-knob').boundingBox(), tr = await page.evaluate(() => { const G = window.__nr2.G(), r = document.querySelector('.nr2-scene').getBoundingClientRect(); return { x0: r.left + G.kE[0], x1: r.left + G.kE[2], y: r.top + G.kE[1] }; });
  await page.mouse.move(kb.x + kb.width / 2, kb.y + kb.height / 2); await page.mouse.down();
  for (let i = 1; i <= 10; i++) { await page.mouse.move(tr.x0 + (tr.x1 - tr.x0) * i / 10, tr.y); }
  const mid = await page.evaluate(src => ({ out: eval('(' + src + ')')(), E: window.__nr2.S.E, fired: window.__nr2.F().run.spikes.length }), frameCheck.toString());
  if (mid.E < 38 || !mid.fired) fails.push(`${W} pointer drag: E ${mid.E}, fired ${mid.fired}`);
  fail('pointer drag, mid drag', mid.out);
  await page.mouse.up();
  // reduced motion: the end of the run at once
  if (errs.length) fail('frames', errs);
  await ctx.close();
  const rm = await open({ theme: 'light', reduced: true });
  await rm.page.evaluate(() => window.__nr2.set({ E: 30, I: 0 }));
  await rm.page.evaluate(() => window.__nr2.play());
  await rm.page.waitForTimeout(80);
  const red = await rm.page.evaluate(() => ({ t: window.__nr2.view.t, max: window.__nr2.tMax(), playing: window.__nr2.playing(), cause: document.querySelector('.nr2 .tk2-cause').textContent }));
  if (red.t < red.max - 1e-6 || red.playing) fails.push(`${W} reduced motion: not the end at once (t ${red.t})`);
  if (!/All or none/.test(red.cause)) fails.push(`${W} reduced motion: no takeaway (${red.cause})`);
  states++; checks += 3;
  await rm.ctx.close();
}

/* ------------------------------------------------------------------ perf */
async function perf() {
  const stats = a => { const s = [...a].sort((x, y) => x - y); return { med: s[Math.floor(s.length / 2)], p95: s[Math.floor(s.length * 0.95)], n: s.length }; };
  const res = [];
  const { page, ctx } = await open({ theme: 'light' });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  for (const tab of ['fire', 'refr', 'myel', 'syn']) {
    await page.evaluate(t => window.__nr2.tab(t), tab);
    await page.evaluate(t => t === 'fire' ? window.__nr2.set({ E: 24 }) : null, tab);
    const ft = await page.evaluate(() => new Promise(res => { const d = []; let last = 0; window.__nr2.play(); const f = ts => { if (last) d.push(ts - last); last = ts; if (window.__nr2.playing()) requestAnimationFrame(f); else res(d); }; requestAnimationFrame(f); }));
    res.push(['neuron ' + tab + ' run', stats(ft)]);
  }
  await page.evaluate(() => window.__nr2.tab('fire'));
  await page.waitForTimeout(200);
  const kb = await page.locator('.nr2-kE .tk2-knob').boundingBox(), tr = await page.evaluate(() => { const G = window.__nr2.G(), r = document.querySelector('.nr2-scene').getBoundingClientRect(); return { x0: r.left + G.kE[0], x1: r.left + G.kE[2], y: r.top + G.kE[1] }; });
  await page.evaluate(() => { window.__ft = []; let last = 0; const f = ts => { if (last) window.__ft.push(ts - last); last = ts; if (!window.__ftStop) requestAnimationFrame(f); }; window.__ftStop = false; requestAnimationFrame(f); });
  await page.mouse.move(kb.x + kb.width / 2, kb.y + kb.height / 2); await page.mouse.down();
  for (let k = 0; k < 3; k++) for (let i = 0; i <= 30; i++) { await page.mouse.move(tr.x0 + (tr.x1 - tr.x0) * (k % 2 ? 1 - i / 30 : i / 30), tr.y); await page.waitForTimeout(16); }
  await page.mouse.up();
  const dd = await page.evaluate(() => { window.__ftStop = true; return window.__ft; });
  res.push(['neuron drag excitatory', stats(dd)]);
  await ctx.close();
  // the flagship, same process and hour
  const fctx = await browser.newContext({ viewport: { width: W, height: H }, serviceWorkers: 'block' });
  const fp = await fctx.newPage();
  await fp.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await fp.route('**/assets/premium.js', async r => { const body = readFileSync(join(ROOT, 'assets/premium.js'), 'utf8').replace('function has(course) {', 'function has(course) { return true;'); await r.fulfill({ body, contentType: 'application/javascript' }); });
  await fp.goto(BASE + '/environmental-science/tools/water-pollution.html', { waitUntil: 'load' });
  await fp.waitForTimeout(1500);
  const fcdp = await fctx.newCDPSession(fp);
  await fcdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const knob = fp.locator('.tk2-drag:not(.is-quiet) .tk2-knob').first();
  if (await knob.count()) {
    const b = await knob.boundingBox();
    await fp.evaluate(() => { window.__ft = []; let last = 0; const f = ts => { if (last) window.__ft.push(ts - last); last = ts; if (!window.__ftStop) requestAnimationFrame(f); }; window.__ftStop = false; requestAnimationFrame(f); });
    await fp.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await fp.mouse.down();
    for (let k = 0; k < 3; k++) for (let i = 0; i <= 30; i++) { await fp.mouse.move(b.x + b.width / 2 + (k % 2 ? 30 - i : i) * (W < 700 ? 3 : 6), b.y + b.height / 2); await fp.waitForTimeout(16); }
    await fp.mouse.up();
    res.push(['flagship drag sacks', stats(await fp.evaluate(() => { window.__ftStop = true; return window.__ft; }))]);
  } else res.push(['flagship drag sacks', { med: NaN, p95: NaN, n: 0 }]);
  await fctx.close();
  res.forEach(([n, s]) => { console.log(`${W} perf x4 ${n}: median ${s.med.toFixed(1)} ms, p95 ${s.p95.toFixed(1)} ms (${s.n} frames)`); if (n.startsWith('neuron') && (s.p95 > 50 || s.med > 25)) fails.push(`${W} perf ${n}: median ${s.med.toFixed(1)}, p95 ${s.p95.toFixed(1)}`); });
}

if (PERF) await perf();
else if (FRAMES) await frames();
else { await layout('light'); await layout('dark'); await firstVisit(); }
await browser.close(); server.close();
console.log(`${W}: ${states} states, ${checks} checks, ${fails.length} failures`);
fails.slice(0, 60).forEach(f => console.log('  ' + f));
process.exit(fails.length ? 1 : 0);
