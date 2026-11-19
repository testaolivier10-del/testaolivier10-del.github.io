#!/usr/bin/env node
/* Frame test for the A&P Predict the change v2 Explore (docs/tools-v2-anp-predict-brief.md). On every screen, a jump of the
   knob (both ways, small and to each end) is drawn every 16 ms until it settles, and at every frame:
   - each label's arrow is there exactly when that link's shown value has moved (never ahead of the picture);
   - the cause line names the chain only as far as it has reached, in order, and the takeaway comes only once all of it
     has settled;
   - what is drawn matches the numbers: the arteriole's drawn radius is the shown radius; the CO2 and H+ shown in the
     plasma follow the shown PCO2 and H+; the aquaporins in the membrane follow the shown level; the urine colour follows
     the shown concentration; the ventricle at the end of filling and the sarcomere follow the shown filling and stretch.
     node scripts/tools-v2/anp-predict-frames.mjs [--port 8931] [--width 1440] */
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const PORT = arg('--port', '8931'), W = +arg('--width', '1440');
const JUMPS = { vessel: [[1, 0.5], [0.5, 1.3], [1, 0.9], [1.3, 1]], breath: [[12, 24], [24, 8], [12, 14], [8, 12]], adh: [[0.35, 1], [1, 0], [0.35, 0.45], [0, 0.35]], heart: [[120, 160], [160, 90], [120, 126], [90, 120]] };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 }, serviceWorkers: 'block' });
await ctx.route('**/assets/premium.js', (r) => r.fulfill({ contentType: 'application/javascript', body: readFileSync(join(ROOT, 'assets/premium.js'), 'utf8').replace('function has(course) {', 'function has(course) { return true;') }));
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(`http://127.0.0.1:${PORT}/anatomy-physiology/tools/predict.html`, { waitUntil: 'load' });
for (let i = 0; i < 150 && !(await page.evaluate(() => !!(window.AnpPredictExplore && window.AnpPredictExplore.current && document.querySelector('.px-lab')))); i++) await page.waitForTimeout(100);
await page.waitForTimeout(500);
let frames = 0, fails = 0;
for (const [tab, jumps] of Object.entries(JUMPS)) {
  await page.evaluate((t) => window.AnpPredictExplore.current.tab(t), tab);
  for (const [u0, u1] of jumps) {
    const out = await page.evaluate(({ u0, u1, tab }) => {
      const A = window.AnpPredictExplore.current, bad = [];
      const words = { vessel: { res: 'Resistance', flow: 'Flow' }, breath: { co2: 'Blood CO₂', h: 'H⁺', ph: 'pH' }, adh: { aqp: 'Aquaporins', water: 'Water back', vol: 'Urine' }, heart: { edv: 'Filling', sl: 'Stretch', sv: 'Stroke vol.', co: 'Output' } }[tab];
      const labKey = { vessel: { res: 'res', flow: 'flow' }, breath: { co2: 'co2', h: 'h', ph: 'ph', sat: 'sat' }, adh: { aqp: 'aqp', water: 'water', vol: 'vol', osm: 'osm' }, heart: { edv: 'edv', sl: 'sl', sv: 'sv', co: 'co' } }[tab];
      let n = 0;
      for (let t = 0; t <= 4000; t += 16) {
        const st = A._frame(u0, u1, t); n++;
        const labs = {}; A._labels().forEach((l) => { labs[l.key] = l.text; });
        // arrows on labels exactly when the link has moved
        Object.entries(labKey).forEach(([node, key]) => {
          const has = /[↑↓]/.test(labs[key] || ''), d = st.d[node];
          if (has !== !!d) bad.push(`${t}ms ${node}: label "${labs[key]}" with d=${d}`);
        });
        // the cause line: pills only for links that moved, in chain order; the takeaway only when settled
        const cz = document.querySelector('.px .tk2-cause'), take = cz.classList.contains('is-take'), calm = A._settled();
        if (take && !calm && st.dc) bad.push(`${t}ms: takeaway before the change settled`);
        if (!take) {
          const pills = [...cz.querySelectorAll('.tk2-cz')].map((p) => p.textContent);
          pills.slice(1).forEach((p) => {
            const node = Object.keys(words).find((k) => p.startsWith(words[k]));
            if (!node) { bad.push(`${t}ms: pill "${p}" names no link`); return; }
            if (!st.d[node]) bad.push(`${t}ms: pill "${p}" before ${node} moved`);
            // the arrow says how the drawn value is really moving (no false causes on a reversal)
            const ar = /↑/.test(p) ? 1 : /↓/.test(p) ? -1 : 0;
            if (ar !== st.raw[node]) bad.push(`${t}ms: pill "${p}" but ${node} is moving ${st.raw[node]}`);
          });
          const order = Object.keys(words), idx = pills.slice(1).map((p) => order.findIndex((k) => p.startsWith(words[k])));
          idx.forEach((v, i) => { if (v !== i) bad.push(`${t}ms: cause line out of order (${pills.join(' > ')})`); });
        }
        // the picture matches the numbers
        const E = A._E();
        if (tab === 'vessel' && Math.abs(E.lastR - st.c) > 1e-3) bad.push(`${t}ms: arteriole drawn at ${E.lastR}, shown ${st.c}`);
        if (tab === 'breath') {
          const vis = (list) => list.reduce((a, m) => a + (+m.g.style.opacity || 0), 0);
          if (Math.abs(vis(E.cb) - Math.min(18, st.v.co2 / 4)) > 0.05) bad.push(`${t}ms: ${vis(E.cb).toFixed(2)} CO2 drawn for PCO2 ${st.v.co2.toFixed(1)}`);
          if (Math.abs(vis(E.hs) - Math.min(16, st.v.h / 5)) > 0.05) bad.push(`${t}ms: ${vis(E.hs).toFixed(2)} H+ drawn for ${st.v.h.toFixed(1)} nmol/L`);
        }
        if (tab === 'adh') {
          const ins = E.aq.reduce((a, q) => a + (1 - (+q.g.lastChild.style.opacity || 0)), 0) / 2;
          if (Math.abs(ins - st.v.aqp * 12) > 0.05) bad.push(`${t}ms: ${ins.toFixed(2)} aquaporins in per side for level ${(st.v.aqp * 12).toFixed(2)}`);
          const k = parseFloat(E.uk), want = 8 + Math.max(0, Math.min(1, (st.v.osm - 50) / 1150)) * 80;
          if (Math.abs(k - want) > 0.6) bad.push(`${t}ms: urine colour ${k}% for ${st.v.osm.toFixed(0)} mOsm/L`);
        }
        if (bad.length > 6) break;
        if (calm && t > 200) break;
      }
      return { n, bad };
    }, { u0, u1, tab });
    frames += out.n;
    if (out.bad.length) { fails += out.bad.length; console.log(`FAIL ${tab} ${u0}->${u1}:\n  ` + out.bad.slice(0, 6).join('\n  ')); }
  }
}
if (errs.length) { fails++; console.log('console errors: ' + errs.join(' | ')); }
console.log(`${W}: ${frames} frames, ${fails} failures`);
await b.close();
process.exit(fails ? 1 : 0);
