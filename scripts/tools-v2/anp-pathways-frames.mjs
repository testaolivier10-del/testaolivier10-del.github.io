#!/usr/bin/env node
/* Frame by frame test for the A&P Pathway tracer v2 Explore (docs/tools-v2-anp-pathways-brief.md). Draws every screen
   every 0.01 of a step (and each break) and checks that the words on the cause line and the labels say only what the
   picture shows at that frame: a valve said to open is drawn open, a muscle said to contract is drawn contracting, a
   hormone said to be released is drawn released, oxygen rich blood is drawn red, and so on. The state checked is the
   one the frame was painted from (the picture is a pure function of it).
     python3 -m http.server 8923 --bind 127.0.0.1 &
     node scripts/tools-v2/anp-pathways-frames.mjs [--port 8923] [--width 1440] */
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
await page.goto(`http://127.0.0.1:${PORT}/anatomy-physiology/tools/pathways.html`, { waitUntil: 'load' });
for (let i = 0; i < 150 && !(await page.evaluate(() => !!(window.AnpPathExplore && window.AnpPathExplore.current))); i++) await page.waitForTimeout(100);
await page.waitForTimeout(500);

// rule: [words contain, state test, what it means]
const RULES = {
  heart: [
    ['tricuspid valve opens', (s) => s.tri >= 0.9, 'tricuspid drawn open'], ['tricuspid valve shuts', (s) => s.tri < 0.98 && s.rvSq > 0, 'tricuspid shutting, ventricle squeezing'],
    ['opens the pulmonary valve', (s) => s.pv >= 0.9, 'pulmonary valve open'], ['mitral valve opens', (s) => s.mit >= 0.9, 'mitral open'],
    ['mitral valve shuts', (s) => s.mit < 0.98 && s.lvSq > 0, 'mitral shutting, LV squeezing'], ['opens the aortic valve', (s) => s.av >= 0.9, 'aortic valve open'],
    ['O₂ rich', (s) => s.ox >= 0.9, 'token red'], ['low O₂', (s) => s.ox <= 0.1, 'token blue'], ['O₂ in, CO₂ out', (s) => s.lungX >= 0.5, 'gas moving in the lung'],
    ['Body cells take O₂', (s) => s.bodyX >= 0.5, 'O₂ leaving to the cells'], ['picks up no new O₂', (s) => s.ox <= 0.1, 'token stays blue']
  ],
  reflex: [
    ['sensory neuron fires', (s) => s.fire >= 0.3, 'ending lit'], ['one synapse', (s) => s.synOn >= 0.3, 'synapse lit'],
    ['knee straightens', (s) => s.kick > 0, 'leg kicking'], ['Quadriceps contracts', (s) => s.squeeze > 0.3, 'muscle shortening'],
    ['no kick', (s) => s.kick === 0, 'leg still'], ['Tap stretches', (s) => s.stretch >= 0.5, 'spindle stretched']
  ],
  hormone: [
    ['releases CRH', (s) => s.crh >= 0.9, 'CRH drawn'], ['carry CRH', (s) => s.crhDown >= 0.5, 'CRH moving down'], ['releases ACTH', (s) => s.acth >= 0.9, 'ACTH drawn'],
    ['releases cortisol', (s) => s.cort >= 0.9, 'cortisol drawn'], ['blood glucose rises', (s) => s.glu >= 0.9, 'glucose drawn'], ['brakes CRH', (s) => s.brake >= 0.9, 'brakes drawn'],
    ['builds up', (s) => s.pile >= 0.9, 'pile drawn'], ['no ACTH', (s) => s.acth === 0, 'no ACTH drawn'], ['no cortisol', (s) => s.cort === 0, 'no cortisol drawn']
  ],
  synapse: [
    ['Ca²⁺ rushes in', (s) => s.caIn >= 0.5, 'Ca²⁺ drawn entering'], ['vesicles fuse', (s) => s.fuse >= 0.9, 'vesicles fused'], ['diffuses across', (s) => s.cross >= 0.3, 'transmitter in the cleft'],
    ['binds receptor', (s) => s.bind >= 0.9, 'bound'], ['| channels open', (s) => s.open >= 0.9, 'channels open'], ['EPSP', (s) => s.epsp >= 0.5 || s.stop, 'EPSP glow'],
    ['threshold reached', (s) => s.sum >= 0.999, 'bar at threshold'], ['add up at the trigger zone', (s) => s.sum > 0 && s.sum < 1, 'bar rising'], ['transmitter cleared', (s) => s.clear >= 0.9, 'cleft emptied'],
    ['no Ca²⁺ in', (s) => s.caIn === 0, 'no Ca²⁺'], ['cannot bind', (s) => s.bind === 0, 'nothing bound']
  ]
};
// labels that may only show with their picture
const LABELS = {
  heart: [['O₂ in', (s) => s.lungX > 0.2], ['O₂ out', (s) => s.bodyX > 0.2 && !s.noAir]],
  reflex: [['Knee straightens', (s) => s.kick >= 0.9], ['No kick', (s) => !!s.stop]],
  hormone: [['Glucose up', (s) => s.glu >= 0.5], ['Cortisol brakes', (s) => s.brake >= 0.5], ['CRH builds up', (s) => s.pile > 0.5], ['ACTH builds up', (s) => s.pile > 0.5], ['Cortisol', (s) => s.v >= 3.9 && !s.stop]],
  synapse: [['Fires', (s) => s.fire > 0.3 || s.v >= 7.88], ['Cleared', (s) => s.clear > 0.5]],
  hormone2: []
};
const LAST = { heart: 13, reflex: 6, hormone: 6, synapse: 8 };
const BREAKS = { heart: ['air'], reflex: ['dorsal', 'ventral'], hormone: ['pit', 'adr'], synapse: ['ca', 'rec'] };
// a broken run reaches its last real step (the step before the one that fails) and stops there with the words of the
// break; what that last step does is drawn
const LASTREAL = {
  dorsal: (s) => s.fire > 0 || s.v >= 1.9, ventral: (s) => s.synOn > 0.3, pit: (s) => s.crhDown >= 0.9, adr: (s) => s.acth >= 0.9 && s.cort === 0,
  ca: (s) => s.caIn === 0, rec: (s) => s.cross >= 0.5 && s.bind === 0
};
let fails = 0, frames = 0;
for (const tab of Object.keys(RULES)) {
  for (const br of [null, ...BREAKS[tab]]) {
    const res = await page.evaluate(([t, br, last, rules, labels, lr]) => {
      const A = window.AnpPathExplore.current; A.tab(t); A._reset();
      if (br) A._break(br);
      const R = rules.map((r) => [r[0], new Function('s', 'return (' + r[1] + ')(s)'), r[2]]), L = labels.map((l) => [l[0], new Function('s', 'return (' + l[1] + ')(s)')]);
      const bad = []; let n = 0; const lastReal = Object.fromEntries(Object.entries(lr).map(([k, v]) => [k, new Function('s', 'return (' + v + ')(s)')]));
      const lim = br ? A._scenes.filter((x) => x.id === t)[0].breaks.filter((b) => b.id === br)[0] : null;
      if (lim && !lim.pass) A._frame(0);
      const top = lim && !lim.pass ? A._lim() : last;
      if (lim && !lim.pass){
        if (top < lim.step - 1) bad.push(`stops at ${top}, before step ${lim.step} (its last real step) happens`);
        A._frame(top); const f = A._st();
        if (!f.st.stop) bad.push(`at its stop (${top}) the run does not say what fails`);
        if (lastReal[br] && !lastReal[br](f.st)) bad.push(`at its stop (${top}) the last real step is not drawn`);
        if (f.labels.indexOf(lim.tag) < 0) bad.push(`at its stop the break is not labeled`);
      }
      for (let v = 0; v <= top + 1e-9; v += 0.01) {
        A._frame(+v.toFixed(2)); n++;
        const f = A._st(), w = f.words.join(' | ');
        R.forEach((r) => { if (w.indexOf(r[0]) > -1 && !r[1](f.st)) bad.push(`v=${v.toFixed(2)} words "${r[0]}" but not ${r[2]}`); });
        L.forEach((l) => { if (f.labels.indexOf(l[0]) > -1 && !l[1](f.st)) bad.push(`v=${v.toFixed(2)} label "${l[0]}" before its picture`); });
      }
      return { n, bad };
    }, [tab, br, LAST[tab], RULES[tab].map((r) => [r[0], r[1].toString(), r[2]]), LABELS[tab].map((l) => [l[0], l[1].toString()]), Object.fromEntries(Object.entries(LASTREAL).map(([k, v]) => [k, v.toString()]))]);
    frames += res.n;
    const seen = new Set();
    res.bad.forEach((b) => { const k = b.replace(/^v=\S+ /, ''); if (seen.has(k)) return; seen.add(k); fails++; console.log(`FAIL ${tab}${br ? ' (' + br + ')' : ''}: ${b}`); });
  }
}
await browser.close();
console.log(`${frames} frames, ${fails} failures`);
process.exit(fails ? 1 : 0);
