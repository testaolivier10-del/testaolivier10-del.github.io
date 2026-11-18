/* "Was the tool used" (assets/course/tool-studio.js, watchUse; docs/analytics-plan.md "Tool use"):
   the time bands, what counts as a touch, and that each event is sent once, with no identity,
   and never when the tracker is not mounted (automation, opt-out, Do Not Track). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = readFileSync('assets/course/tool-studio.js', 'utf8');

// An element that is inside the listed selectors' boxes (closest) and inside the area or not.
const el = (inside = []) => ({ closest: (sel) => sel.split(',').map((x) => x.trim()).some((x) => inside.includes(x)) ? {} : null });

function page(path, { mounted = true, automated = false, kit2 = false } = {}){
  let now = 1000000;
  const timers = [];
  const doc = {}, win = {};
  const listen = (store) => (type, fn) => { (store[type] = store[type] || []).push(fn); };
  const sent = [];
  const document = { readyState: 'complete', visibilityState: 'visible', addEventListener: listen(doc), querySelector: () => null, querySelectorAll: () => [] };
  const window = {
    addEventListener: listen(win),
    __levlAnalyticsMounted: mounted,
    LevlAnalytics: {
      event: (name, data) => sent.push({ name, data, how: 'event' }),
      _beacon: (name, data) => sent.push({ name, data, how: 'beacon' }),
      _courseOf: (p) => p.indexOf('/environmental-science') > -1 ? 'apenv' : p.indexOf('/nremt') > -1 ? 'nremt' : 'site',
      _automated: () => automated,
    },
  };
  if(kit2) window.LevlKit2 = {};
  const sandbox = { window, document, location: { pathname: path, search: '' }, navigator: { userAgent: 'node' },
    Date: { now: () => now }, setTimeout: (fn, ms) => { timers.push({ fn, at: now + ms }); return timers.length; }, clearTimeout(){}, console };
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: 'tool-studio.js' });
  const fire = (store, type, e = {}) => (store[type] || []).forEach((fn) => fn(e));
  return {
    S: window.LevlStudio, sent, window,
    doc: (type, e) => fire(doc, type, e),
    win: (type, e) => fire(win, type, e),
    hide(){ document.visibilityState = 'hidden'; fire(doc, 'visibilitychange'); },
    // Move the clock, running the timers that come due (a timer may set another).
    wait(ms){
      const end = now + ms;
      for(;;){
        const due = timers.filter((t) => t.at <= end).sort((a, b) => a.at - b.at)[0];
        if(!due) break;
        timers.splice(timers.indexOf(due), 1);
        now = Math.max(now, due.at);
        due.fn();
      }
      now = end;
    },
  };
}

const names = (p) => p.sent.map((e) => e.name);

test('time bands: under 10 s, 10 to 60 s, 1 to 5 min, over 5 min', () => {
  const { band } = page('/x/tools/a.html').S._use;
  assert.deepEqual([0, 9.9, 10, 59.9, 60, 299, 300, 86400].map(band), ['<10s', '<10s', '10-60s', '10-60s', '1-5m', '1-5m', '5m+', '5m+']);
  assert.equal(band(NaN), '<10s');
});

test('a touch is inside the tool, not the frame around it', () => {
  const { inTool } = page('/x/tools/a.html').S._use;
  const area = { contains: (e) => !e.outside };
  assert.equal(inTool(el(), area), true, 'the stage or dock');
  for(const chrome of ['.ls-bar', '.ls-modes', '.ls-sheet', '.ls-lockp', '.ls-why', '.ls-detbtn', '.ls-enl', '.ls-zbar', 'a[href]', '.nx-slim-bar']){
    assert.equal(inTool(el([chrome]), area), false, chrome);
  }
  assert.equal(inTool(Object.assign(el(), { outside: true }), area), false, 'the rest of the page');
  assert.equal(inTool(null, area), false);
});

test('keys that only move focus, bare modifiers and shortcuts are not a touch', () => {
  const { realKey } = page('/x/tools/a.html').S._use;
  for(const key of ['a', '7', 'Enter', ' ', 'ArrowLeft', 'Backspace']) assert.equal(realKey({ key }), true, key);
  for(const key of ['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'Escape', 'F5', 'CapsLock']) assert.equal(realKey({ key }), false, key);
  assert.equal(realKey({ key: 'r', ctrlKey: true }), false);
  assert.equal(realKey({ key: 'l', metaKey: true }), false);
  assert.equal(realKey({}), false);
});

test('only tool pages are counted, and only fixed words name the tool and the mode', () => {
  const { slug, mode } = page('/x/tools/a.html').S._use;
  assert.equal(slug('/environmental-science/tools/water-pollution.html'), 'water-pollution');
  assert.equal(slug('/bio/tools/osmosis'), 'osmosis');
  assert.equal(slug('/calculus/formula-sheet.html'), '', 'a reference page is not a tool');
  assert.equal(slug('/nremt/body-map.html', true), 'body-map', 'NREMT tools are outside tools/ and ask to be counted');
  assert.equal(slug('/bio/tools/'), '');
  assert.deepEqual(['explore', 'Test', 'a b <c>', '', null].map(mode), ['explore', 'test', 'other', 'none', 'none']);
});

test('one visit: opened, first touch, a mode switch and one summary, each once', () => {
  const p = page('/environmental-science/tools/water-pollution.html', { kit2: true });
  let mode = 'explore';
  const area = { contains: () => true };
  const use = p.S.use({ area, mode: () => mode });
  assert.ok(use);
  assert.equal(p.S.use({ area }), use, 'a second mount does not count twice');
  assert.deepEqual(names(p), [], 'nothing before the open timer');
  p.wait(1500);
  assert.deepEqual(names(p), ['tool-open']);
  assert.deepEqual({ ...p.sent[0].data }, { tool: 'apenv/water-pollution', course: 'apenv', frame: 'v2', locked: 'no' });

  // A finger that starts a scroll: pointerdown, then pointercancel. Not a touch.
  p.doc('pointerdown', { target: el() }); p.doc('pointercancel', {});
  p.doc('pointerup', {});
  // Focus moving through the tool, and a press on the bar: not a touch either.
  p.doc('keydown', { key: 'Tab', target: el() });
  p.doc('pointerdown', { target: el(['.ls-bar']) }); p.doc('pointerup', {});
  assert.deepEqual(names(p), ['tool-open']);

  for(let i = 0; i < 3; i++){ p.doc('pointerdown', { target: el() }); p.doc('pointerup', {}); }
  p.doc('keydown', { key: 'ArrowRight', target: el() });
  assert.deepEqual(names(p), ['tool-open', 'tool-touch'], 'the first touch only');
  assert.equal(p.sent[1].data.mode, 'explore');

  // The student switches to Test yourself (a press, then the studio's s.mode).
  mode = 'test'; use.mode('test', 'explore');
  assert.deepEqual(names(p), ['tool-open', 'tool-touch', 'tool-mode']);
  assert.equal(p.sent[2].data.mode, 'test');
  assert.equal(p.sent[2].data.row, 'apenv/water-pollution test');
  // The tool setting a mode by itself, long after any press, is not a switch.
  p.wait(70000);
  use.mode('explore', 'test');
  use.mode('test', null);
  assert.equal(names(p).length, 3);

  p.hide(); p.win('pagehide'); p.hide();
  assert.deepEqual(names(p), ['tool-open', 'tool-touch', 'tool-mode', 'tool-use'], 'one summary');
  const sum = p.sent[3];
  assert.equal(sum.how, 'beacon');
  assert.deepEqual({ ...sum.data }, { tool: 'apenv/water-pollution', course: 'apenv', frame: 'v2', touched: 'yes', time: '1-5m', mode: 'test', locked: 'no', row: 'apenv/water-pollution v2 yes 1-5m' });

  // No identity and no free text: every value is one of a few short fixed words.
  for(const e of p.sent) for(const [k, v] of Object.entries(e.data)){
    assert.ok(['tool', 'course', 'frame', 'locked', 'mode', 'touched', 'time', 'row'].includes(k), k);
    assert.match(String(v), /^[a-z0-9<+\/ -]{1,96}$/);
  }
});

test('opened and left without touching: touched no, under 10 s; the old frame is named', () => {
  const p = page('/nremt/body-map.html');
  p.S.use({ area: { contains: () => true }, any: true });
  p.wait(3000);
  p.hide();
  assert.deepEqual(names(p), ['tool-open', 'tool-use']);
  assert.deepEqual({ ...p.sent[1].data }, { tool: 'nremt/body-map', course: 'nremt', frame: 'old', touched: 'no', time: '<10s', mode: 'none', locked: 'no', row: 'nremt/body-map old no <10s' });
});

test('a locked Premium tool is opened, never touched', () => {
  const p = page('/environmental-science/tools/cycles.html');
  p.S.use({ area: { contains: () => true }, locked: () => true });
  p.wait(1500);
  p.doc('pointerdown', { target: el() }); p.doc('pointerup', {});
  assert.deepEqual(names(p), ['tool-open']);
  assert.equal(p.sent[0].data.locked, 'yes');
});

test('a mode switch is counted a few times at most', () => {
  const p = page('/bio/tools/osmosis.html');
  const use = p.S.use({ area: { contains: () => true } });
  p.wait(1500);
  for(let i = 0; i < 20; i++){ p.doc('pointerup', {}); use.mode(i % 2 ? 'explore' : 'test', i % 2 ? 'test' : 'explore'); }
  assert.equal(names(p).filter((n) => n === 'tool-mode').length, 6);
});

test('the tracker loading late loses nothing; never mounted sends nothing', () => {
  const late = page('/bio/tools/osmosis.html', { mounted: false });
  late.S.use({ area: { contains: () => true } });
  late.wait(1500);
  late.doc('pointerdown', { target: el() }); late.doc('pointerup', {});
  assert.deepEqual(names(late), []);
  late.window.__levlAnalyticsMounted = true;
  late.wait(2000);
  assert.deepEqual(names(late), ['tool-open', 'tool-touch']);

  for(const opts of [{ mounted: false }, { automated: true }]){
    const p = page('/bio/tools/osmosis.html', opts);
    p.S.use({ area: { contains: () => true } });
    p.wait(1500);
    p.doc('pointerdown', { target: el() }); p.doc('pointerup', {});
    p.wait(60000);
    p.hide(); p.win('pagehide');
    assert.deepEqual(names(p), [], JSON.stringify(opts));
  }
});

test('a page that is not a tool is not watched', () => {
  const p = page('/calculus/formula-sheet.html');
  assert.equal(p.S.use({ area: { contains: () => true } }), null);
  p.wait(5000); p.hide();
  assert.deepEqual(names(p), []);
});

test('the report: one record per tool, most touched first, old and v2 apart', async () => {
  const { tally, table } = await import('../tool-use-report.mjs');
  const rows = tally({
    opens: [{ value: 'apbio/osmosis', total: 40 }, { value: 'apenv/water-pollution', total: 30 }, { value: 'nremt/formulary', total: 5 }],
    touches: [{ value: 'apbio/osmosis', total: 10 }, { value: 'apenv/water-pollution', total: 21 }],
    uses: [
      { value: 'apenv/water-pollution old no <10s', total: 8 }, { value: 'apenv/water-pollution old yes 10-60s', total: 4 },
      { value: 'apenv/water-pollution v2 yes 1-5m', total: 12 }, { value: 'apenv/water-pollution v2 yes 5m+', total: 3 },
      { value: 'apbio/osmosis old yes 10-60s', total: 9 }, { value: 'something else', total: 99 },
    ],
    modes: [{ value: 'apenv/water-pollution quiz', total: 6 }],
  });
  assert.deepEqual(rows.map((r) => r.tool), ['apenv/water-pollution', 'apbio/osmosis', 'nremt/formulary']);
  const wp = rows[0];
  assert.deepEqual(wp.frames.old, { left: 12, touched: 4, time: { '<10s': 8, '10-60s': 4, '1-5m': 0, '5m+': 0 } });
  assert.deepEqual(wp.frames.v2, { left: 15, touched: 15, time: { '<10s': 0, '10-60s': 0, '1-5m': 12, '5m+': 3 } });
  assert.deepEqual(wp.modes, { quiz: 6 });
  const text = table(rows);
  assert.match(text, /apenv\/water-pollution\tboth\t30\t21\t70%/);
  assert.match(text, /of the summaries\tv2\t15\t15\t100%\t0\t0\t12\t3/);
  assert.match(text, /apbio\/osmosis\told\t40\t10\t25%\t0\t9\t0\t0/);
  assert.match(text, /nremt\/formulary\t\?\t5\t0\t0%/);
});
