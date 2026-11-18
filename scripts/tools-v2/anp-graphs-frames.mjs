#!/usr/bin/env node
/* Frame by frame checks for the A&P Graphs v2 Explore (docs/tools-v2-anp-graphs-brief.md, "Review round 1"). Each
   screen is drawn at many moments in a row (no tween: the frame for that x), and what is drawn is checked against the
   cause line and the science, so a picture and its words can never disagree between the landmark states the sweep
   looks at:
   - Axon: whenever K+ channels are still drawn open after the spike, the line does not say "Resting potential"; the
     inactivated Na+ channel keeps its pore open with the plug in until repolarization, then the pore shuts before
     the plug leaves.
   - Lungs: the diaphragm is drawn contracting (and its down arrows) only on a breath in by the muscles, never on
     "Muscles let go"; belly push arrows on every forced breath out; the lung bases never below the diaphragm.
   - Red blood cell: dissolved O2 never outnumbers bound O2 and is a handful at most; the saturation number sits on no
     alveolus.
   - Heart: the papillary muscles start on the cavity wall; the cavity's top stays at the valve ring.
   - Graph: no curve name across the cursor line.

   Needs a static server at the repo root (see anp-graphs-sweep.mjs):
     node scripts/tools-v2/anp-graphs-frames.mjs [--port 8923] [--width 1440] */
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const PORT = arg('--port', '8923'), W = +arg('--width', '1440');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
const ctx = await browser.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 }, serviceWorkers: 'block' });
await ctx.route('**/assets/premium.js', (r) => r.fulfill({ contentType: 'application/javascript',
  body: readFileSync(join(ROOT, 'assets/premium.js'), 'utf8').replace('function has(course) {', 'function has(course) { return true;') }));
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(`http://127.0.0.1:${PORT}/anatomy-physiology/tools/graphs.html`, { waitUntil: 'load' });
for (let i = 0; i < 150 && !(await page.evaluate(() => !!(window.AnpGraphExplore && window.AnpGraphExplore.current && document.querySelector('.gx-gsvg text')))); i++) await page.waitForTimeout(100);
await page.waitForTimeout(300);

const res = await page.evaluate(() => {
  const A = window.AnpGraphExplore.current, out = [], counts = {};
  const sc = (id) => A._scenes.filter((s) => s.id === id)[0];
  const words = () => [...document.querySelectorAll('.gx .tk2-cause .tk2-cz')].map((e) => e.textContent.trim()).join(' | ');
  const frame = (x) => A._frame(x);
  const bb = (e) => e.getBoundingClientRect();
  const inter = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
  function sweep(id, x0, x1, step, check){
    A.tab(id); let n = 0;
    for (let x = x0; x <= x1 + 1e-9; x += step){ const xx = Math.round(x * 1000) / 1000; frame(xx); check(xx, sc(id)); n++;
      // no curve name across the cursor line
      const knob = document.querySelector('.gx-plot .tk2-in'), PLx = document.querySelector('.gx-pt');
      if (PLx){ const cx = bb(PLx).left + bb(PLx).width / 2; document.querySelectorAll('.gx-cname').forEach((t) => { const r = bb(t); if (cx > r.left - 2 && cx < r.right + 2) out.push(id + ' x=' + xx + ': curve name "' + t.textContent + '" across the cursor'); }); }
    }
    counts[id] = n;
  }
  // Axon
  sweep('axon', 0, 8, 0.01, (t) => {
    const w = words(), kArrows = document.querySelectorAll('.gx-dyn .gx-flow.is-k').length;
    const na = [...document.querySelectorAll('.gx-dyn .gx-ch.is-na')].map((g) => ({ gap: +g.getAttribute('data-gap'), plug: +g.getAttribute('data-plug') }))[0];
    const k = [...document.querySelectorAll('.gx-dyn .gx-ch.is-k')].map((g) => +g.getAttribute('data-gap'))[0];
    if (t > 3.6 && k > 8 && /Resting potential/.test(w)) out.push('axon t=' + t + ': K+ channels drawn open (' + k + ') but the line says resting');
    if (/K⁺ out/.test(w) && !kArrows) out.push('axon t=' + t + ': the line says K+ out, no K+ arrows');
    if (kArrows && /Resting potential/.test(w)) out.push('axon t=' + t + ': K+ arrows with the resting line');
    if (t >= 3.6 && t <= 4.1 && !(na.gap >= 26 && na.plug > 0.9)) out.push('axon t=' + t + ': inactivated Na+ channel not drawn open and plugged (gap ' + na.gap + ', plug ' + na.plug + ')');
    if (t >= 4.45 && t <= 4.7 && !(na.gap <= 8 && na.plug > 0.3)) out.push('axon t=' + t + ': the Na+ gate should shut before the plug leaves (gap ' + na.gap + ', plug ' + na.plug + ')');
    if (t >= 5.1 && !(na.gap <= 8 && na.plug < 0.05)) out.push('axon t=' + t + ': Na+ channel not reset');
    if (/plugged/.test(w) && !(na.plug >= 0.5)) out.push('axon t=' + t + ': the line says plugged, no plug drawn');
  });
  // Lungs
  sweep('lungs', 0, 30, 0.05, (t, s) => {
    const w = words(), dia = document.querySelector('.gx-dyn .gx-dia'), on = dia.classList.contains('is-on');
    const arrows = [...document.querySelectorAll('.gx-dyn .gx-flow.is-mus')].map((p) => { const L = p.getTotalLength(), a = p.getPointAtLength(0), b = p.getPointAtLength(L); return b.y > a.y ? 'down' : 'up'; });
    if (/Muscles let go/.test(w) && (on || arrows.includes('down'))) out.push('lungs t=' + t + ': diaphragm drawn contracting while the muscles let go');
    if (/Diaphragm contracts|Diaphragm and rib muscles/.test(w) && !(on && arrows.includes('down'))) out.push('lungs t=' + t + ': the line says the diaphragm contracts, picture does not');
    if (!/Diaphragm contracts|Diaphragm and rib muscles|Chest as big/.test(w) && on) out.push('lungs t=' + t + ': diaphragm drawn contracting, line says ' + w);
    if (/belly muscles push|Belly muscles push/.test(w) && !arrows.includes('up')) out.push('lungs t=' + t + ': belly push in the line, no push arrows');
    if (arrows.includes('up') && !/elly muscles push/.test(w)) out.push('lungs t=' + t + ': push arrows without the belly words');
    const dy = s._domeY;
    document.querySelectorAll('.gx-dyn .gx-lung').forEach((p) => { const L = p.getTotalLength(); for (let u = 0; u <= L; u += 4){ const q = p.getPointAtLength(u); if (q.x > 32 && q.x < 488 && q.y > dy(q.x) - 4) { out.push('lungs t=' + t + ': lung below the diaphragm at x=' + Math.round(q.x)); return; } } });
  });
  // Red blood cell
  sweep('rbc', 0, 100, 1, (p, s) => {
    const o = s._o2;
    if (o.dissolved > 4) out.push('rbc p=' + p + ': ' + o.dissolved + ' dissolved O2');
    if (o.bound > 0 && o.dissolved >= o.bound) out.push('rbc p=' + p + ': dissolved ' + o.dissolved + ' vs bound ' + o.bound);
    if (o.bound === 0 && o.dissolved > 0) out.push('rbc p=' + p + ': dissolved O2 with no bound O2');
    const num = document.querySelector('.gx-dyn .gx-num text'), nr = bb(num);
    document.querySelectorAll('.gx-dyn .gx-sac').forEach((c) => { if (+getComputedStyle(c.parentNode).opacity > 0.05 && inter(bb(c), nr)) out.push('rbc p=' + p + ': the saturation number sits on an alveolus'); });
    if (p < 10 && /Working muscle/.test(words())) out.push('rbc p=' + p + ': working muscle below 10 mm Hg');
  });
  // Heart
  sweep('heart', 0, 0.8, 0.005, (t, s) => {
    const g = s._G, c = g.cavity, cav = document.querySelector('.gx-dyn .gx-lv-cav'), r = cav.getBBox();
    if (Math.abs(r.y - c[1]) > 1.5) out.push('heart t=' + t + ': cavity top left the valve ring');
    g.pap.forEach((p) => { if (!cav.isPointInFill(new DOMPoint(p[0], p[1])) && !cav.isPointInStroke(new DOMPoint(p[0], p[1]))) { const q = new DOMPoint(p[0], p[1]); let near = false; const L = cav.getTotalLength(); for (let u = 0; u < L; u += 2){ const z = cav.getPointAtLength(u); if (Math.hypot(z.x - q.x, z.y - q.y) < 2.5) { near = true; break; } } if (!near) out.push('heart t=' + t + ': papillary muscle not on the wall'); } });
  });
  sweep('sarcomere', 60, 180, 1, () => {});
  return { out, counts };
});
errs.forEach((e) => res.out.push('console error ' + e));
await browser.close();
const n = Object.values(res.counts).reduce((a, b) => a + b, 0);
res.out.slice(0, 60).forEach((m) => console.log('FAIL ' + m));
console.log(`${n} frames checked at ${W} px (${Object.entries(res.counts).map(([k, v]) => k + ' ' + v).join(', ')}): ${res.out.length ? res.out.length + ' problems' : 'clean'}`);
process.exit(res.out.length ? 1 : 0);
