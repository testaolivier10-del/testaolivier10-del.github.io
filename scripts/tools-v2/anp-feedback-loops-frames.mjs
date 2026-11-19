#!/usr/bin/env node
/* Frame test for the A&P Feedback loops v2 Explore (docs/tools-v2-anp-feedback-loops-brief.md). Every run is a pure
   function of its time, so the test seeks each run every 0.02 s and checks, on each frame, that the words and the
   numbers say what the picture shows at that frame:
   - the value pill, the thermometer or meter column, the monitor's "now" dot and any number on the cause line all
     read the drawn value;
   - the dot line's current part and the cause line's lead name the same part;
   - every label of an acting part is shown only while that part is drawn acting (nerve ending lit, hypothalamus lit,
     sweat gland on, arteriole wider or narrower, muscle shivering, heat leaving, beta or alpha cells lit, hormone in
     the blood, liver working, stretch sensors lit, nerve lit, posterior pituitary lit, oxytocin drawn, uterine wall
     contracting, the baby drawn);
   - negative runs stay inside the normal range after they first cross the set point (the overshoot is small), and
     the effectors are off at the end; the childbirth run climbs turn by turn and its stretch falls only after birth.

   Needs a static server at the repo root and Chromium:
     python3 -m http.server 8987 --bind 127.0.0.1 &
     node scripts/tools-v2/anp-feedback-loops-frames.mjs [--port 8987] [--width 1440] */
import { chromium } from 'playwright';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const PORT = arg('--port', '8987'), WIDTHS = arg('--width', '') ? [+arg('--width', '')] : [1440, 390];
const CASES = { temperature: [38.4, 37.6, 35.9, 36.6, 38.5, 35.5], glucose: [150, 160, 110, 60, 55, 76], childbirth: [0.35, 0.2, 0.06] };
const exe = '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: exe });
let fails = 0, frames = 0;
const fail = (m) => { fails++; if (fails < 60) console.log('FAIL ' + m); };

for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, serviceWorkers: 'block', hasTouch: w < 900 });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await ctx.addInitScript(() => { try { localStorage.setItem('tk2c:anp-loops', '1'); } catch (e) {} });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/anatomy-physiology/tools/feedback-loops.html`, { waitUntil: 'load' });
  for (let i = 0; i < 150 && !(await page.evaluate(() => !!(window.AnpLoopExplore && window.AnpLoopExplore.current && document.querySelector('.fe-lab')))); i++) await page.waitForTimeout(100);
  for (const tab of Object.keys(CASES)) {
    await page.evaluate((t) => window.AnpLoopExplore.current.tab(t), tab);
    await page.waitForTimeout(200);
    for (const push of CASES[tab]) {
      const out = await page.evaluate(([tab, push]) => {
        const api = window.AnpLoopExplore.current, sc = api._cur(), bad = [];
        const q = (s) => document.querySelector('.fe-svg:not(.fe-fade) ' + s);
        const qa = (s) => [...document.querySelectorAll('.fe-svg:not(.fe-fade) ' + s)];
        const op = (el) => el ? +(getComputedStyle(el).opacity) : 0;
        const labs = () => qa('.fe-lab').map((g) => ({ t: g.getAttribute('data-lab'), strong: g.classList.contains('is-strong') }));
        const has = (L, t) => L.some((x) => x.t === t);
        const NAMES = ['Stimulus', 'Sensor', 'Afferent', 'Control center', 'Efferent', 'Effector', 'Response'];
        document.querySelector('.fe-reset').click();
        api._push(push);
        const end = api._end(); let n = 0, crossed = false, prevS = -1, born = false;
        for (let t = 0; t <= end + 1e-6; t += 0.02) {
          api._seek(Math.min(t, end - 1e-4)); n++;
          const st = api._state(), L = labs(), f = (m) => bad.push(`${tab} ${push} t=${t.toFixed(2)}: ${m}`);
          const cause = document.querySelector('.fe .tk2-cause').textContent;
          const rail = document.querySelector('.fe-rail').textContent;
          // the drawn value and everything that reads it
          if (sc.kind === 'neg') {
            const val = sc.fmt(st.x), pill = L.find((x) => /°C|mg\/dL/.test(x.t));
            if (!pill || pill.t !== val) f(`value pill ${pill && pill.t} vs drawn ${val}`);
            const nums = (cause.match(/\d+(\.\d)? (°C|mg\/dL)/g) || []);
            nums.forEach((s) => { if (s !== val) f(`cause line number ${s} vs drawn ${val}`); });
            const col = q(tab === 'temperature' ? '[data-r="tcol"]' : '[data-r="mcol"]'), top = +col.getAttribute('y');
            const want = 300 * (sc.max - st.x) / (sc.max - sc.min);
            if (Math.abs(top - want) > 0.2) f(`column ${top} vs ${want.toFixed(1)}`);
            const dev = st.x - sc.set;
            if (st.t > sc.TM.resp && Math.sign(dev) !== Math.sign(st.run.d)) crossed = true;
            if (crossed && (st.x < sc.band[0] || st.x > sc.band[1])) f(`overshoot leaves the normal range: ${val}`);
          } else {
            if (born && st.x > prevS + 1e-6 && st.birthing) f('stretch rises again after birth');
            if (!st.birthing && st.x < prevS - 1e-6) f(`stretch falls before birth (${prevS.toFixed(3)} to ${st.x.toFixed(3)})`);
            prevS = st.x; if (st.born > 0) born = true;
          }
          const dot = document.querySelector('.fe-mon [data-m="now"]');
          if (!dot) f('no now dot');
          // the current part: the dot line and the cause line agree
          const curDot = [...document.querySelectorAll('.fe-dot')].findIndex((d) => d.classList.contains('is-cur'));
          if (!st.done && !st.birthing && st.k >= 0) {
            if (curDot !== st.k) f(`current dot ${curDot} vs part ${st.k}`);
            if (rail.indexOf('Part ' + (st.k + 1) + ' of 7') < 0) f(`rail "${rail}" vs part ${st.k + 1}`);
            const lead = cause.split(':')[0];
            if (!(lead.indexOf(NAMES[st.k]) === 0 || (st.k === 0 && /^Turn \d/.test(lead)))) f(`cause lead "${lead}" vs part ${NAMES[st.k]}`);
          }
          // labels only with their drawn action
          const on = (s) => { const e = q(s); return !!e && e.classList.contains('is-on'); };
          if (tab === 'temperature') {
            if (has(L, 'Nerve ending') && !on('[data-r="nend"]')) f('Nerve ending label, ending not lit');
            if (L.some((x) => x.t === 'Hypothalamus' && x.strong) && !on('[data-r="hypo"]')) f('Hypothalamus strong, not lit');
            if (has(L, 'Sweat gland') && !on('[data-r="gland"]')) f('Sweat gland label, gland off');
            const lw = parseFloat((q('[data-r="artl"]').getAttribute('style') || '').replace(/[^\d.]/g, ''));
            if (has(L, 'Arteriole widens') && !(lw > 14.6)) f(`Arteriole widens at ${lw}`);
            if (has(L, 'Arteriole narrows') && !(lw < 13.4)) f(`Arteriole narrows at ${lw}`);
            if (has(L, 'Muscle shivers') && !(op(q('[data-r="heatin"]')) > 0.05)) f('Muscle shivers label, no shivering');
            if (has(L, 'Heat lost') && !(op(q('[data-r="heat"]')) > 0.12)) f('Heat lost label, no heat drawn');
            if (has(L, 'Efferent nerve') && !qa('.fe-pulse-c.is-eff').some((c) => op(c) > 0.2)) f('Efferent nerve label, no command drawn');
            if (has(L, 'Sensory nerve') && !qa('.fe-pulse-c.is-aff').some((c) => op(c) > 0.2)) f('Sensory nerve label, no signal drawn');
            if (st.done && (op(q('[data-r="heat"]')) > 0.05 || op(q('[data-r="heatin"]')) > 0.05 || op(q('[data-r="drop"]')) > 0.05)) f('effectors still drawn at the end');
          }
          if (tab === 'glucose') {
            if (has(L, 'Beta cells') && !qa('.fe-beta.is-on').length) f('Beta cells label, none lit');
            if (has(L, 'Alpha cells') && !qa('.fe-alpha.is-on').length) f('Alpha cells label, none lit');
            const ins = qa('.fe-hmol.is-ins, .fe-hmol.is-gcg').some((c) => op(c) > 0.2) || qa('.fe-gran').some((c) => op(c) > 0.2);
            if ((has(L, 'Insulin') || has(L, 'Glucagon')) && !ins) f('hormone label, no hormone drawn');
            if (L.some((x) => x.t === 'Liver' && x.strong) && !on('[data-r="liver"]')) f('Liver strong, liver idle');
            if ((has(L, 'Glucose stored') || has(L, 'Glucose released')) && !qa('.fe-gmol.is-up').some((c) => op(c) > 0.05)) f('glucose moving label, none drawn moving');
            const shown = qa('[data-r="glu"] .fe-gmol').reduce((a, c) => a + op(c), 0);
            if (Math.abs(shown - st.x / sc.set * 8) > 0.05) f(`glucose drawn ${shown.toFixed(2)} vs level ${(st.x / sc.set * 8).toFixed(2)}`);
          }
          if (tab === 'childbirth') {
            if (has(L, 'Stretch sensors') && !on('[data-r="sens"]')) f('Stretch sensors label, not lit');
            if (has(L, 'Spinal cord') && !on('[data-r="affb"]')) f('Spinal cord label, nerve not lit');
            if (L.some((x) => x.t === 'Hypothalamus' && x.strong) && !on('[data-r="hypo"]')) f('Hypothalamus strong, not lit');
            if (has(L, 'Posterior pituitary') && !on('[data-r="pitp"]')) f('Posterior pituitary label, not lit');
            if (has(L, 'Oxytocin') && !qa('.fe-hmol.is-oxy').some((c) => op(c) > 0.2)) f('Oxytocin label, none drawn');
            if (L.some((x) => x.t === 'Uterine muscle' && x.strong) && !(op(q('[data-r="sq"]')) > 0.05)) f('Uterine muscle strong, no contraction drawn');
            if (has(L, 'Baby born') && !(op(q('[data-r="baby"]')) > 0.4)) f('Baby born label, baby not drawn');
            if (/Baby born/.test(cause) && !(op(q('[data-r="baby"]')) > 0.4)) f('cause says born, baby not drawn');
          }
        }
        return { bad, n };
      }, [tab, push]);
      frames += out.n;
      out.bad.forEach((m) => fail(`${w}: ${m}`));
    }
  }
  errs.forEach((e) => fail(`${w}: console ${e}`));
  await ctx.close();
}
await browser.close();
console.log(`${frames} frames, ${fails} failures`);
process.exit(fails ? 1 : 0);
