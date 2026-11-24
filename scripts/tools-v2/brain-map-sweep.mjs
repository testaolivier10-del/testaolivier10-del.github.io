#!/usr/bin/env node
/* Sweep test for the AP® Psychology Brain map v2 Explore (docs/tools-v2-brain-map-brief.md; docs/tools-v2-builder-brief.md
   step 5). At ten widths, light or dark (--dark):
     Outside and Inside: the landing cue (there, inside the picture, covering no pin, card, find or front chip); every
       part named in turn, healthy and damaged: the name card inside the picture and clear of its own pin, other pins,
       the find button and the front chip; every pin inside the picture and no two drawn on top of each other; the
       picture the largest thing on the stage; the cause line's pills inside it, at most two rows on phones, and the
       lines box one constant height; the body figure's words clear of the brain's pins; no text under 11 px.
     Split brain: every case (left or right field, corpus callosum cut or intact) at its end: every label inside the
       picture and at least 4 px from every other label; no text under 11 px; the cause line at most two rows on
       phones; the cue clear of the labels.
     Then: a real tap (touch on a phone) inside the motor strip away from its pin names the motor cortex (what is
     drawn under the finger), a tap on bare plate closes the card, find forgives and crosses views; no sideways
     scroll; no console errors.
   Needs a static server at the repo root and Chromium:
     python3 -m http.server 8961 --bind 127.0.0.1 &
     node scripts/tools-v2/brain-map-sweep.mjs [--port 8961] [--shots <dir>] [--dark] [--width 390]
   Run one width per process (--width) for long sweeps. */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const PORT = arg('--port', '8961'), SHOTS = arg('--shots', ''), DARK = process.argv.includes('--dark'), REDUCE = process.argv.includes('--reduce');
const ALL = [360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
const WIDTHS = arg('--width', '') ? [+arg('--width', '')] : ALL;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
let fails = 0, checks = 0;
const fail = (m) => { fails++; console.log('FAIL ' + m); };
const ok = (c, m) => { checks++; if (!c) fail(m); };
const URL = `http://127.0.0.1:${PORT}/psychology/tools/brain-map.html`;
const sfx = (DARK ? '-dark' : '') + (REDUCE ? '-reduce' : '');

async function ready(page) {
  for (let i = 0; i < 150; i++) {
    if (await page.evaluate(() => !!(window.BrainMapExplore && document.querySelector('.bmx-pic') && !document.querySelector('.bmx-pic.is-swap')))) break;
    await page.waitForTimeout(100);
  }
  // then until the layout has settled (the pins and the cue stop moving)
  let last = '';
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(150);
    const now = await page.evaluate(() => [...document.querySelectorAll('.tk2-spots:not([hidden]) .tk2-spot-pin, .tk2-cue, .bmx-pic')].map((e) => { const r = e.getBoundingClientRect(); return Math.round(r.left) + ',' + Math.round(r.top); }).join(';'));
    if (now === last) break;
    last = now;
  }
}

for (const w of WIDTHS) {
  const h = w < 500 ? 844 : w < 900 ? 1024 : w >= 1900 ? 1080 : 900;
  const touch = w < 900;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', hasTouch: touch, isMobile: w < 500, reducedMotion: REDUCE ? 'reduce' : 'no-preference' });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await ctx.addInitScript((d) => { try { localStorage.setItem('nremt_theme', d ? 'dark' : 'light'); } catch (e) {} }, DARK);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });

  for (const view of ['outside', 'inside']) {
    await page.goto(`${URL}#view/${view}`, { waitUntil: 'load' });
    await page.evaluate(() => { try { Object.keys(localStorage).forEach((k) => { if (/^tk2c:/.test(k)) localStorage.removeItem(k); }); } catch (e) {} });
    await page.reload({ waitUntil: 'load' });
    await ready(page);
    // the landing cue
    const cue = await page.evaluate(() => {
      const c = document.querySelector('.tk2-cue'); if (!c) return { none: true };
      const r = c.getBoundingClientRect(), pic = document.querySelector('.bmx-pic').getBoundingClientRect(), hits = [];
      document.querySelectorAll('.tk2-spots:not([hidden]) .tk2-spot-pin, .tk2-spot-card:not([hidden]), .bmx-find-b, .bmx-front').forEach((e) => {
        const q = e.getBoundingClientRect();
        if (q.width && q.left < r.right - 1 && q.right > r.left + 1 && q.top < r.bottom - 1 && q.bottom > r.top + 1) hits.push(e.className || e.parentElement.getAttribute('data-id'));
      });
      return { hits, out: r.left < pic.left - 2 || r.right > pic.right + 2 || r.top < pic.top - 2 || r.bottom > pic.bottom + 2 };
    });
    ok(!cue.none, `${w} ${view}: no first visit cue`);
    if (!cue.none) { ok(!cue.hits.length, `${w} ${view}: the cue covers ${cue.hits.join(', ')}`); ok(!cue.out, `${w} ${view}: the cue sticks out of the picture`); }
    if (SHOTS) await page.screenshot({ path: join(SHOTS, `${view}-land-${w}${sfx}.png`) });

    const ids = await page.evaluate(() => window.BrainMapExplore._spots().items.map((x) => x.id));
    const lineH = new Set();
    for (const dmg of [false, true]) {
      await page.evaluate((d) => window.BrainMapExplore.damage(d), dmg);
      for (const id of ids) {
        await page.evaluate((i) => window.BrainMapExplore.pick(i), id);
        await page.waitForTimeout(dmg ? 680 : 420);
        const r = await page.evaluate((id) => {
          const out = { errs: [] }, R = (e) => e.getBoundingClientRect();
          const pic = R(document.querySelector('.bmx-pic')), card = document.querySelector('.tk2-spot-card'), c = R(card);
          const inside = (q, b, m = 0) => q.left >= b.left - m && q.right <= b.right + m && q.top >= b.top - m && q.bottom <= b.bottom + m;
          const meet = (a, b, g) => a.left < b.right + g && a.right > b.left - g && a.top < b.bottom + g && a.bottom > b.top - g;
          if (card.hidden) out.errs.push('no card');
          const on = document.querySelector('.tk2-spots:not([hidden]) .tk2-spot[aria-pressed="true"]');
          if (!on || on.getAttribute('data-id') !== id) out.errs.push('the pressed pin is not ' + id);
          if (card.textContent.trim() !== (on && on.getAttribute('aria-label'))) out.errs.push('card names another part');
          if (!inside(c, pic, 1)) out.errs.push('card outside the picture');
          if (card.scrollWidth > card.clientWidth + 1) out.errs.push('card text clipped');
          const pins = [...document.querySelectorAll('.tk2-spots:not([hidden]) .tk2-spot')];
          pins.forEach((b) => { const p = R(b.querySelector('.tk2-spot-pin')); if (meet(p, c, 0)) out.errs.push('card covers the ' + b.getAttribute('data-id') + ' pin'); });
          [document.querySelector('.bmx-find-b'), document.querySelector('.bmx-front')].forEach((e) => { if (e && e.offsetParent && meet(R(e), c, 4)) out.errs.push('card on ' + e.className); });
          const P = pins.map((b) => R(b.querySelector('.tk2-spot-pin')));
          P.forEach((p, i) => {
            if (!inside(p, pic, 1)) out.errs.push('pin ' + pins[i].getAttribute('data-id') + ' outside the picture');
            [document.querySelector('.bmx-find-b'), document.querySelector('.bmx-front')].forEach((e) => { if (e && e.offsetParent && meet(p, R(e), 4)) out.errs.push('pin ' + pins[i].getAttribute('data-id') + ' under ' + e.className); });
            P.forEach((q, j) => { if (j > i && Math.hypot(p.left - q.left, p.top - q.top) < p.width * 0.9) out.errs.push('pins ' + pins[i].getAttribute('data-id') + ' and ' + pins[j].getAttribute('data-id') + ' drawn on top of each other'); });
          });
          // the body figure's words: clear of the pins and inside the picture
          const bt = document.querySelector('.bm-body.is-on .bm-bd-t');
          if (bt && bt.textContent) { const q = R(bt); if (!inside(q, pic, 1)) out.errs.push('body words outside'); P.forEach((p, i) => { if (meet(p, q, 4)) out.errs.push('body words on the ' + pins[i].getAttribute('data-id') + ' pin'); }); if (meet(q, c, 4)) out.errs.push('body words under the card'); const fs = q.height / 1.2; if (fs < 10.5) out.errs.push('body words ' + fs.toFixed(1) + ' px'); }
          // the picture is the biggest thing on the stage
          const area = (q) => q.width * q.height, big = area(pic);
          document.querySelectorAll('.bmx .tk2-tabs, .bmx .tk2-head, .bmx-lines').forEach((e) => { if (area(R(e)) >= big) out.errs.push(e.className + ' bigger than the picture'); });
          // the cause line
          const cz = document.querySelector('.bmx .tk2-cause'), zr = R(cz);
          cz.querySelectorAll('.tk2-cz').forEach((p) => { const q = R(p); if (q.right > zr.right + 1 || q.left < zr.left - 1) out.errs.push('a pill sticks out of the cause line'); if (p.scrollWidth > p.clientWidth + 1) out.errs.push('pill text clipped'); });
          const tops = new Set(); cz.querySelectorAll('.tk2-cz, .tk2-cz-a').forEach((p) => { const q = R(p); tops.add(Math.round(q.top / 6)); });
          let rows = 0; cz.querySelectorAll('.tk2-cz').forEach((p) => { rows = Math.max(rows, Math.round((R(p).bottom - zr.top) / 30)); });
          out.causeH = Math.round(zr.height); out.rows = rows;
          out.lines = Math.round(R(document.querySelector('.bmx-lines')).height);
          // the words in the cause line name the picked part
          if (!cz.textContent.includes(on ? on.getAttribute('aria-label') : '#')) out.errs.push('the cause line does not name the picked part');
          // no text under 11 px on the stage
          document.querySelectorAll('.bmx .tk2-cz, .bmx .tk2-spot-card, .bmx-front, .bmx .tk2-purpose, .bmx-dmg span').forEach((e) => { const f = parseFloat(getComputedStyle(e).fontSize); if (f < 11) out.errs.push(e.className + ' text ' + f + ' px'); });
          out.hscroll = document.scrollingElement.scrollWidth > innerWidth + 1;
          return out;
        }, id);
        ok(!r.errs.length, `${w} ${view}/${id}${dmg ? ' damaged' : ''}: ${r.errs.join('; ')}`);
        ok(!r.hscroll, `${w} ${view}/${id}: sideways scroll`);
        lineH.add(r.lines);
        if (w <= 640) ok(r.causeH <= 80, `${w} ${view}/${id}${dmg ? ' damaged' : ''}: cause line ${r.causeH}px, more than two rows`);
        if (SHOTS && (id === ids[0] || id === 'motor' || id === 'hippocampus')) await page.screenshot({ path: join(SHOTS, `${view}-${id}${dmg ? '-dmg' : ''}-${w}${sfx}.png`) });
      }
    }
    await page.evaluate(() => window.BrainMapExplore.damage(false));
    // a real tap on each pin (mouse, or touch on a phone) names that pin's part, never the part drawn around it
    for (const id of ids) {
      const c = await page.evaluate((i) => { const r = document.querySelector('.tk2-spots:not([hidden]) .tk2-spot[data-id="' + i + '"] .tk2-spot-pin').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, id);
      if (touch) await page.touchscreen.tap(c[0], c[1]); else await page.mouse.click(c[0], c[1]);
      await page.waitForTimeout(120);
      const got = await page.evaluate(() => document.querySelector('.tk2-spots:not([hidden]) .tk2-spot[aria-pressed="true"]')?.getAttribute('data-id'));
      ok(got === id, `${w} ${view}: a tap on the ${id} pin named ${got}`);
    }
    if (w <= 1100) ok(lineH.size === 1, `${w} ${view}: the lines box changes height (${[...lineH].join(', ')})`);
  }

  // a real tap inside the motor strip, away from its pin, names the motor cortex; bare plate closes the card
  await page.goto(`${URL}#view/outside`, { waitUntil: 'load' });
  await page.reload({ waitUntil: 'load' });
  await ready(page);
  const at = await page.evaluate(() => {
    const A = window.BrainMapExplore, pic = document.querySelector('.bmx-pic').getBoundingClientRect(), t = A._t();
    const pin = A._G.outside.reg.motor.pin;
    for (let y = 330; y > 150; y -= 6) for (let x = 380; x < 560; x += 4) { if (A._regAt('outside', x, y) === 'motor' && Math.hypot(x - pin[0], y - pin[1]) > 60) return [pic.left + (x + t.tx) * t.px, pic.top + (y + t.ty) * t.px]; }
    return null;
  });
  ok(!!at, `${w}: no point in the motor strip found`);
  if (at) {
    if (touch) await page.touchscreen.tap(at[0], at[1]); else await page.mouse.click(at[0], at[1]);
    await page.waitForTimeout(420);
    const t = await page.evaluate(() => ({ card: document.querySelector('.tk2-spot-card').textContent, cause: document.querySelector('.bmx .tk2-cause').textContent, cue: !!document.querySelector('.tk2-cue') }));
    ok(t.card === 'Motor cortex' && /opposite side/.test(t.cause), `${w}: a tap in the motor strip gave "${t.card}" / "${t.cause}"`);
    ok(!t.cue, `${w}: the cue stayed after the first tap`);
  }
  const bare = await page.evaluate(() => { const p = document.querySelector('.bmx-pic').getBoundingClientRect(); return [p.left + p.width * 0.04, p.bottom - p.height * 0.05]; });
  if (touch) await page.touchscreen.tap(bare[0], bare[1]); else await page.mouse.click(bare[0], bare[1]);
  await page.waitForTimeout(250);
  ok(await page.evaluate(() => document.querySelector('.tk2-spots:not([hidden]) ~ .tk2-spot-card, .tk2-spot-card') && [...document.querySelectorAll('.tk2-spots:not([hidden]) .tk2-spot-card')].every((c) => c.hidden)), `${w}: a tap on bare plate left the card open`);
  for (const [q, want] of [['BROCAS AREA', 'Broca’s area'], ['wernike', 'Wernicke’s area'], ['motor strip', 'Motor cortex'], ['occip', 'Occipital lobe']]) {
    const got = await page.evaluate((q) => { const it = window.BrainMapExplore._spots().match(q); return it ? it.name : null; }, q);
    ok(got === want, `${w}: find "${q}" gave ${got}`);
  }
  // find crosses views: the thalamus is only inside
  await page.evaluate(() => { const f = document.querySelector('.bmx-find-in'); document.querySelector('.bmx-find-b').click(); f.value = 'thalamus'; f.form.requestSubmit(); });
  await page.waitForTimeout(900);
  ok(await page.evaluate(() => window.BrainMapExplore.tab() === 'inside' && document.querySelector('.tk2-spots:not([hidden]) .tk2-spot[aria-pressed="true"]')?.getAttribute('data-id') === 'thalamus'), `${w}: find "thalamus" from outside did not open it inside`);

  // split brain: every case at its end
  await page.goto(`${URL}#view/${REDUCE ? 'outside' : 'split'}`, { waitUntil: 'load' });
  await page.evaluate(() => { try { Object.keys(localStorage).forEach((k) => { if (/^tk2c:/.test(k)) localStorage.removeItem(k); }); } catch (e) {} });
  await page.reload({ waitUntil: 'load' });
  await ready(page);
  if (REDUCE) {   // the way a student gets there: a tap on the tab (tool-studio's phone text bump must leave the labels alone)
    const tb = await page.evaluate(() => { const r = [...document.querySelectorAll('.bmx .tk2-tab')].find((b) => /Split/.test(b.textContent)).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    if (touch) await page.touchscreen.tap(tb[0], tb[1]); else await page.mouse.click(tb[0], tb[1]);
    await page.waitForTimeout(1200);
  }
  const scue = await page.evaluate(() => {
    const c = document.querySelector('.tk2-cue'); if (!c) return { none: true };
    const r = c.getBoundingClientRect(), pic = document.querySelector('.bmx-pic').getBoundingClientRect(), hits = [];
    document.querySelectorAll('.bmx-svg text, .tk2-tap .tk2-badge').forEach((e) => { const q = e.getBoundingClientRect(); if (e.textContent !== '' || e.classList.contains('tk2-badge')) if (q.width && q.left < r.right - 1 && q.right > r.left + 1 && q.top < r.bottom - 1 && q.bottom > r.top + 1) hits.push(e.textContent || 'tap badge'); });
    return { hits, out: r.left < pic.left - 2 || r.right > pic.right + 2 || r.top < pic.top - 2 || r.bottom > pic.bottom + 2 };
  });
  ok(!scue.none, `${w} split: no first visit cue`);
  if (!scue.none) ok(!scue.hits.length && !scue.out, `${w} split: the cue ${JSON.stringify(scue)}`);
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `split-land-${w}${sfx}.png`) });
  const sH = new Set();
  for (const cut of [true, false]) for (const field of ['left', 'right']) {
    await page.evaluate((c) => window.BrainMapExplore.cut(c), cut);
    await page.waitForTimeout(650);
    await page.evaluate((f) => window.BrainMapExplore.flash(f), field);
    await page.waitForTimeout(3800);
    const r = await page.evaluate(() => {
      const out = { errs: [] }, R = (e) => e.getBoundingClientRect(), pic = R(document.querySelector('.bmx-pic'));
      const inside = (q, b, m = 0) => q.left >= b.left - m && q.right <= b.right + m && q.top >= b.top - m && q.bottom <= b.bottom + m;
      const meet = (a, b, g) => a.left < b.right + g && a.right > b.left - g && a.top < b.bottom + g && a.bottom > b.top - g;
      const texts = [...document.querySelectorAll('.bmx-svg text')].filter((t) => t.textContent && getComputedStyle(t).display !== 'none' && +(t.closest('[opacity]')?.getAttribute('opacity') ?? 1) > 0);
      const boxes = texts.map((t) => { const g = t.closest('.sb-pill-g'); return { n: t.textContent, r: R(g ? g.querySelector('rect') : t), fs: R(t).height / 1.25 }; });
      boxes.forEach((b, i) => {
        if (!inside(b.r, pic, 1)) out.errs.push('"' + b.n + '" outside the picture');
        if (b.fs < 10.5) out.errs.push('"' + b.n + '" text ' + b.fs.toFixed(1) + ' px');
        boxes.forEach((c, j) => { if (j > i && meet(b.r, c.r, 4) && !(b.n.length < 3 || c.n.length < 3)) out.errs.push('"' + b.n + '" and "' + c.n + '" overlap'); });
      });
      const cz = document.querySelector('.bmx .tk2-cause'), zr = R(cz);
      out.causeH = Math.round(zr.height); out.lines = Math.round(R(document.querySelector('.bmx-lines')).height);
      cz.querySelectorAll('.tk2-cz').forEach((p) => { const q = R(p); if (q.right > zr.right + 1) out.errs.push('a pill sticks out'); });
      out.text = cz.textContent;
      // the flashed object is in each tray, and the hand that finds it holds that object
      ['left', 'right'].forEach((hd) => { if (document.querySelectorAll(`[data-sb="tray-${hd}"] [data-pick]`).length !== 1) out.errs.push('the flashed object is not in the ' + hd + ' tray'); });
      // the words keep their own size (no phone text bump)
      document.querySelectorAll('.bmx-svg text').forEach((t) => { if (t.style.fontSize) out.errs.push('"' + t.textContent + '" has an inline font size ' + t.style.fontSize); });
      if (document.querySelector('.bmx-svg').hasAttribute('data-ls-fs0') || document.querySelector('.bmx-svg [data-ls-fs0]')) out.errs.push('the phone text bump touched the picture');
      out.hscroll = document.scrollingElement.scrollWidth > innerWidth + 1;
      return out;
    });
    ok(!r.errs.length, `${w} split ${field} ${cut ? 'cut' : 'intact'}: ${r.errs.join('; ')}`);
    ok(!r.hscroll, `${w} split: sideways scroll`);
    if (w <= 640) ok(r.causeH <= 80, `${w} split ${field} ${cut ? 'cut' : 'intact'}: cause line ${r.causeH}px (${r.text})`);
    const want = field === 'left' ? (cut ? /Left field.*right hemisphere.*can’t name it.*left hand finds it/ : /Left field.*right hemisphere.*crosses over.*names it.*both hands/) : (cut ? /Right field.*left hemisphere.*names it.*right hand finds it/ : /Right field.*left hemisphere.*crosses over.*names it.*both hands/);
    ok(want.test(r.text), `${w} split ${field} ${cut ? 'cut' : 'intact'}: the cause line says "${r.text}"`);
    sH.add(r.lines);
    if (SHOTS) await page.screenshot({ path: join(SHOTS, `split-${field}-${cut ? 'cut' : 'intact'}-${w}${sfx}.png`) });
  }
  if (w <= 1100) ok(sH.size === 1, `${w} split: the lines box changes height (${[...sH].join(', ')})`);
  ok(!errs.length, `${w}: console errors: ${errs.join(' | ')}`);
  console.log(`${w}${DARK ? ' dark' : ''}: done (${fails} failing so far)`);
  await ctx.close();
}
await browser.close();
console.log(`${checks} checks, ${fails} failing`);
process.exit(fails ? 1 : 0);
