#!/usr/bin/env node
/* Frame by frame check for the AP® Psychology Brain map v2 (docs/tools-v2-brain-map-brief.md; builder brief "Caught in
   reviews": every word is derived from what is DRAWN at that frame). At 390 and 1440:
     Split brain, every case (left or right field, cut or intact), every 50 ms of the flash: the cause line names the
       hemisphere only once it glows, "crosses over" only once the other hemisphere glows, what the person says only
       once the bubble shows it (and the bubble's words match: the word only if the left hemisphere has it), a hand
       only once that hand holds the object, and a hand holds it only if the hemisphere that runs it glows.
     Damage, in real time: the cause line says "damaged" only once the lesion has spread over at least 40% of the part.
     Leaving mid animation (to Test yourself, to another tab) stops the run; coming back shows a clean end state.
     Reduced motion: a flash shows its end at once.
   Usage: node scripts/tools-v2/brain-map-frames.mjs [--port 8961] [--shots <dir>] */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const PORT = arg('--port', '8961'), SHOTS = arg('--shots', '');
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const URL = `http://127.0.0.1:${PORT}/psychology/tools/brain-map.html`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
let fails = 0, checks = 0, frames = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('FAIL ' + m); } };
async function ready(page) {
  for (let i = 0; i < 150; i++) { if (await page.evaluate(() => !!(window.BrainMapExplore && !document.querySelector('.bmx-pic.is-swap')))) break; await page.waitForTimeout(100); }
  await page.waitForTimeout(400);
}
for (const [w, h] of [[390, 844], [1440, 900]]) {
  for (const reduce of [false, true]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', hasTouch: w < 900, isMobile: w < 500, reducedMotion: reduce ? 'reduce' : 'no-preference' });
    await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(`${URL}#view/split`, { waitUntil: 'load' }); await page.reload({ waitUntil: 'load' }); await ready(page);
    if (!reduce) {
      for (const cut of [true, false]) for (const field of ['left', 'right']) {
        await page.evaluate((c) => window.BrainMapExplore.cut(c), cut); await page.waitForTimeout(650);
        const bad = await page.evaluate(({ field, cut }) => {
          const A = window.BrainMapExplore, errs = [], op = (sel) => { const e = document.querySelector(sel); return e ? parseFloat(getComputedStyle(e).opacity) : 0; };
          const to = field === 'left' ? 'right' : 'left', other = to === 'left' ? 'right' : 'left', word = [];
          let n = 0;
          for (let t = 0; t <= A._dur + 0.2; t += 0.05) {
            A._seek(field, t); n++;
            const line = document.querySelector('.bmx .tk2-cause').textContent;
            const gTo = op(`[data-sb="glow-${to}"]`), gOther = op(`[data-sb="glow-${other}"]`), bub = op('[data-sb="bub"]'), say = document.querySelector('[data-sb="bub"] text').textContent;
            const hold = { left: op('[data-sb="hold-left"]'), right: op('[data-sb="hold-right"]') };
            const T = t.toFixed(2);
            if (line.includes(to + ' hemisphere') && gTo < 0.5) errs.push(`${T}: names the ${to} hemisphere before it glows (${gTo})`);
            if (/crosses over/.test(line) && gOther < 0.25 && op('[data-sb="cross"]') < 0.5) errs.push(`${T}: "crosses over" before the signal crosses`);
            if (/names it|can’t name it/.test(line) && bub < 0.6) errs.push(`${T}: says what the person said before the bubble shows (${bub})`);
            if (bub > 0 && !say) errs.push(`${T}: an empty bubble shows`);
            if (bub > 0 && /saw nothing/.test(say) !== (to === 'right' && cut)) errs.push(`${T}: the bubble says "${say}"`);
            if (/both hands/.test(line) && (hold.left < 1 || hold.right < 1)) errs.push(`${T}: "both hands" before both hold it`);
            const one = /(left|right) hand finds it/.exec(line); if (one && hold[one[1]] < 1) errs.push(`${T}: the ${one[1]} hand is named before it holds the object`);
            ['left', 'right'].forEach((hd) => { const runs = hd === 'left' ? 'right' : 'left', g = runs === to ? gTo : gOther; if (hold[hd] > 0 && g < 0.5) errs.push(`${T}: the ${hd} hand holds the object but the ${runs} hemisphere has not got the word`); });
            if (cut && gOther > 0) errs.push(`${T}: the cut corpus callosum let the word across`);
            if (t > 1.45 && op('[data-sb="rays"]') > 0.01) errs.push(`${T}: light still drawn from the screen after the flash`);
            if (t > 1.25 && op('[data-sb="word"]') > 0.01) errs.push(`${T}: the word still on the screen after its flash`);
          }
          return { errs, n };
        }, { field, cut });
        frames += bad.n;
        ok(!bad.errs.length, `${w} split ${field} ${cut ? 'cut' : 'intact'}: ${bad.errs.slice(0, 4).join('; ')}`);
        if (SHOTS) for (const t of [0.2, 0.55, 1.1, 1.7, 2.2, 2.7, 3.1]) { await page.evaluate(({ f, t }) => window.BrainMapExplore._seek(f, t), { f: field, t }); await page.screenshot({ path: join(SHOTS, `mid-split-${field}-${cut ? 'cut' : 'intact'}-t${String(t).replace('.', '')}-${w}.png`) }); }
      }
      // leaving mid run: to Test yourself, then back
      await page.evaluate(() => window.BrainMapExplore.cut(true)); await page.waitForTimeout(600);
      await page.evaluate(() => window.BrainMapExplore.flash('left')); await page.waitForTimeout(900);
      ok(await page.evaluate(() => window.BrainMapExplore.running()), `${w}: the flash is not running`);
      await page.evaluate(() => document.querySelector('[data-m="quiz"], .ls-modes [data-v="quiz"], button[data-mode="quiz"]')?.click() || [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Test yourself')?.click());
      await page.waitForTimeout(300);
      ok(await page.evaluate(() => !window.BrainMapExplore.running()), `${w}: the flash kept running in Test yourself`);
      await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Explore')?.click());
      await page.waitForTimeout(500);
      const back = await page.evaluate(() => ({ run: window.BrainMapExplore.running(), line: document.querySelector('.bmx .tk2-cause').textContent }));
      ok(!back.run && /left hand finds it/.test(back.line), `${w}: back in Explore after leaving mid run: ${JSON.stringify(back)}`);
      // switching tab mid run
      await page.evaluate(() => window.BrainMapExplore.flash('right')); await page.waitForTimeout(700);
      await page.evaluate(() => window.BrainMapExplore.tab('outside')); await page.waitForTimeout(300);
      ok(await page.evaluate(() => !window.BrainMapExplore.running()), `${w}: the flash kept running on another tab`);
      // damage in real time: the words wait until the lesion has spread over 40% of the part
      await page.evaluate(() => window.BrainMapExplore.pick('broca')); await page.waitForTimeout(500);
      const dm = await page.evaluate(() => new Promise((res) => {
        const out = [], t0 = performance.now();
        window.BrainMapExplore.damage(true);
        (function st(){
          const c = document.querySelector('.bm-fx-on.is-dmg clipPath circle'), reach = 0;
          const r = c ? +c.getAttribute('r') : 0, line = document.querySelector('.bmx .tk2-cause').textContent;
          out.push([r, /damaged/.test(line)]);
          if (performance.now() - t0 < 900) requestAnimationFrame(st); else res(out);
        })();
      }));
      const maxR = Math.max(...dm.map((x) => x[0]));
      const early = dm.filter((x) => x[1] && x[0] < maxR * 0.4);
      frames += dm.length;
      ok(maxR > 0 && !early.length, `${w}: "damaged" named before the lesion spread (${early.length} frames, max r ${maxR})`);
      ok(dm[dm.length - 1][1], `${w}: "damaged" never named`);
      await page.evaluate(() => window.BrainMapExplore.damage(false));
    } else {
      await page.evaluate(() => window.BrainMapExplore.flash('left')); await page.waitForTimeout(150);
      const r = await page.evaluate(() => ({ run: window.BrainMapExplore.running(), line: document.querySelector('.bmx .tk2-cause').textContent, hold: document.querySelector('[data-sb="hold-left"]').getAttribute('opacity') }));
      ok(!r.run && /left hand finds it/.test(r.line) && r.hold === '1', `${w} reduced motion: the flash end is not shown at once ${JSON.stringify(r)}`);
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `reduced-split-${w}.png`) });
    }
    ok(!errs.length, `${w}: page errors ${errs.join(' | ')}`);
    await ctx.close();
  }
}
await browser.close();
console.log(`${frames} frames, ${checks} checks, ${fails} failing`);
process.exit(fails ? 1 : 0);
