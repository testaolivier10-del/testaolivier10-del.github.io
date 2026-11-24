/* K.spots (assets/course/tool-kit2.js), the shared named-places piece of the explorer tools: tap, miss, Escape, find
   and the "find it" ask mode, in a real browser on a bare page (no course, no server).
   Needs playwright and Chromium (CHROMIUM_PATH, or Playwright's own); skipped where they are not installed, as
   scripts/check-tool-use.mjs is.   node --test scripts/test/kit2-spots.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
let chromium = null;
try { ({ chromium } = await import('playwright')); } catch (e) { chromium = null; }
const EXE = process.env.CHROMIUM_PATH || ['/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(existsSync);

const KIT = readFileSync(join(ROOT, 'assets/course/tool-kit2.js'), 'utf8');
const CSS = readFileSync(join(ROOT, 'assets/course/tool-kit2.css'), 'utf8');
// a 400 x 300 picture: a grey "drawing" on the left half, blank on the right; three parts on the drawing
const PAGE = `<!DOCTYPE html><html><head><style>${CSS} body{margin:0} #pic{position:relative;width:400px;height:300px}</style></head><body>
<div id="pic"><svg viewBox="0 0 400 300" width="400" height="300"><rect x="0" y="0" width="200" height="300" fill="#999"/></svg></div>
<script>${KIT}</script>
<script>
  var K = window.LevlKit2, layer = K.layer(document.getElementById('pic')), log = [];
  window.S = K.spots(layer, { label: 'Parts', chip: false,
    items: [{ id: 'a', name: 'Aorta', at: [[50, 50]] }, { id: 'v', name: 'Superior vena cava', accept: ['svc'], at: [[150, 50]] },
            { id: 'm', name: 'Mitral (bicuspid) valve', at: [[100, 250], [140, 260]] }],
    blank: function(x, y){ return x > 200; },
    onPick: function(it, how){ log.push((it ? it.id : 'none') + ':' + how); },
    onMiss: function(n){ log.push('miss:' + (n && n.id)); } });
  window.log = log;
</script></body></html>`;

test('K.spots: tap, miss, blank, Escape, find, ask', { skip: !chromium || !EXE ? 'playwright or Chromium not installed' : false }, async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  try {
    const page = await (await browser.newContext({ viewport: { width: 500, height: 400 } })).newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.setContent(PAGE);
    // a cold first browser start can be slow: wait until the pins are placed (up to 15 s), then a moment more
    await page.waitForFunction(() => { const b = document.querySelector('.tk2-spot'); return !!(b && b.style.left); }, null, { timeout: 15000 });
    await page.waitForTimeout(150);
    const card = () => page.evaluate(() => { const c = document.querySelector('.tk2-spot-card'); return c.hidden ? null : c.textContent; });
    const log = () => page.evaluate(() => window.log.slice());

    // a tap beside a pin names it
    await page.mouse.click(56, 47);
    assert.equal(await card(), 'Aorta');
    // a tap on the drawing near no pin keeps the card and rings the nearest pins
    await page.mouse.click(100, 150);
    assert.equal(await card(), 'Aorta');
    assert.deepEqual((await log()).slice(-1), ['miss:m']);
    await page.waitForTimeout(40);
    assert.ok(await page.evaluate(() => document.querySelectorAll('.tk2-spot.is-hint').length === 2));
    // a tap on blank picture closes it
    await page.mouse.click(300, 150);
    assert.equal(await card(), null);
    // the second point of an item counts as the item
    await page.mouse.click(141, 262);
    assert.equal(await card(), 'Mitral (bicuspid) valve');
    // Escape on a focused pin closes the card
    await page.focus('.tk2-spot[data-id="m"]');
    await page.keyboard.press('Escape');
    assert.equal(await card(), null);
    // find forgives: case, an accepted name, a start, one slip in a long word
    for (const [q, want] of [['AORTA', 'a'], ['svc', 'v'], ['mitr', 'm'], ['superior vena cavva', 'v']]) {
      const got = await page.evaluate((q) => { const it = window.S.find(q); return it && it.id; }, q);
      assert.equal(got, want, q);
    }
    // ask: the next tap answers; a wrong tap is marked wrong and the asked part's card opens
    await page.evaluate(() => { window.answers = []; window.S.ask('v', function(ok, it){ window.answers.push([ok, it && it.id]); }); });
    assert.equal(await card(), null);
    // while it waits, find neither answers nor gives the answer away
    assert.equal(await page.evaluate(() => window.S.find('vena cava')), null);
    assert.equal(await page.evaluate(() => window.S.asking()), true);
    await page.mouse.click(52, 52);
    assert.deepEqual(await page.evaluate(() => window.answers), [[false, 'a']]);
    assert.equal(await card(), 'Superior vena cava');
    assert.ok(await page.evaluate(() => document.querySelector('.tk2-spot[data-id="a"]').classList.contains('is-bad')));
    assert.equal(await page.evaluate(() => window.S.asking()), false);
    // a right answer
    await page.evaluate(() => { window.S.ask('m', function(ok, it){ window.answers.push([ok, it && it.id]); }); });
    await page.mouse.click(101, 249);
    assert.deepEqual(await page.evaluate(() => window.answers.slice(-1)), [[true, 'm']]);
    assert.ok(await page.evaluate(() => document.querySelector('.tk2-spot[data-id="m"]').classList.contains('is-good')));
    // a miss while asking answers nothing
    await page.evaluate(() => { window.S.ask('a', function(ok, it){ window.answers.push([ok, it && it.id]); }); });
    await page.mouse.click(100, 150);
    assert.equal(await page.evaluate(() => window.answers.length), 2);
    assert.equal(await page.evaluate(() => window.S.asking()), true);
    // ask(null) leaves the mode
    await page.evaluate(() => window.S.ask(null));
    assert.equal(await page.evaluate(() => window.S.asking()), false);
    assert.deepEqual(errs, []);
  } finally {
    await browser.close();
  }
});
