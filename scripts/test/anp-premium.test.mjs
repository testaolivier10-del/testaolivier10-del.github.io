/* The A&P free/premium split (AnpCore over assets/premium.js).

   Before launch nothing may change but the pills; after launch, without a
   pass, everything outside the Foundations chapters is locked down to the
   gate, and a pass opens it again. Earned progress is never touched. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const MAP = JSON.parse(readFileSync('docs/anp-dependency-map.json', 'utf8'));
const FOUNDATIONS = MAP.chapters.filter((c) => c.part === 'foundations').map((c) => c.id);

function store() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

/* premium.js, the curriculum and AnpCore in one sandbox. fetch records the
   bank files asked for and answers each with an empty chapter. */
function boot({ launched = false, pass = false, withPremium = true } = {}) {
  const fetched = [];
  const localStorage = store();
  const noop = () => {};
  const document = {
    readyState: 'complete', addEventListener: noop, removeEventListener: noop,
    documentElement: { classList: { add: noop } },
    querySelector: () => null, querySelectorAll: () => [], getElementById: () => null,
    createElementNS: () => ({ setAttribute: noop, appendChild: noop, style: {} }),
    body: { appendChild: noop, insertBefore: noop }, head: { appendChild: noop },
  };
  const window = {
    localStorage, document, location: { search: '', href: 'http://localhost/', reload: noop },
    addEventListener: noop, removeEventListener: noop, ANP_BASE: '../',
  };
  window.window = window;
  const sandbox = {
    window, document, localStorage, location: window.location, console, setTimeout, clearTimeout,
    URLSearchParams,
    fetch: (u) => { fetched.push(u); return Promise.resolve({ ok: true, json: () => Promise.resolve([]) }); },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  const load = (p) => vm.runInContext(readFileSync(p, 'utf8'), sandbox, { filename: p });
  if (withPremium) {
    load('assets/premium.js');
    window.LevlPremium.COURSES.anp.freeChapters = FOUNDATIONS.slice();
    window.LevlPremium._setLaunched(launched);
    if (pass) localStorage.setItem('levlprep_premium_v1', JSON.stringify({ userId: 'u1', courses: { anp: '2099-01-01T00:00:00Z' } }));
  }
  load('anatomy-physiology/assets/anp-curriculum.js');
  load('anatomy-physiology/assets/anp-core.js');
  return { Core: window.AnpCore, window, fetched, localStorage };
}

const TOOL = {
  scenarios: [
    { id: 'a', topic: MAP.topics.find((t) => t.chapter === 'cells').id },
    { id: 'b', topic: MAP.topics.find((t) => t.chapter === 'cardiovascular').id },
  ],
  sets: [{ id: 'c', chapter: 'tissues' }, { id: 'd', chapter: 'respiratory' }],
  groups: [{ id: 'g', title: 'No topic' }],
};
const copy = (o) => JSON.parse(JSON.stringify(o));

test('the Foundations part of the map is the five opening chapters', () => {
  assert.deepEqual(FOUNDATIONS, ['orientation', 'chem-physics', 'cells', 'tissues', 'cell-communication']);
});

test('before launch nothing is locked, and Premium features carry the pill', () => {
  const { Core } = boot({ launched: false });
  for (const ch of ['cardiovascular', 'cells', '']) assert.equal(Core.locked(ch), false, ch);
  for (const f of ['exams', 'flashcards', 'weak-spot-analytics', 'graphs']) assert.equal(Core.allowed(f), true, f);
  assert.equal(Core.gate('lessons', 'lesson', 'heart-anatomy'), '');
  assert.deepEqual(Core.freeItems(copy(TOOL)), TOOL);
  assert.match(Core.badge('cardiovascular'), /premium-badge/);
  assert.match(Core.badge(), /premium-badge/);
  assert.equal(Core.badge('cells'), '', 'a Foundations surface is free, so no pill');
});

test('without premium.js the course behaves as before: open, no pills', () => {
  const { Core } = boot({ withPremium: false });
  assert.equal(Core.locked('cardiovascular'), false);
  assert.equal(Core.allowed('exams'), true);
  assert.equal(Core.badge(), '');
  assert.equal(Core.gate('exams', 'exams'), '');
});

test('launched without a pass: Foundations open, everything else gated', async () => {
  const { Core, fetched } = boot({ launched: true });
  for (const ch of FOUNDATIONS) assert.equal(Core.locked(ch), false, ch);
  assert.equal(Core.locked('cardiovascular'), true);
  assert.equal(Core.locked(), true, 'a course-wide feature is locked');
  assert.equal(Core.allowed('exams'), false);
  assert.equal(Core.allowed('flashcards'), false);
  assert.equal(Core.allowed('weak-spot-analytics'), false);
  assert.equal(Core.allowed('graphs'), true, 'tools are trimmed to Foundations, not closed');

  const g = Core.gate('lessons', 'lesson', 'heart-anatomy');
  assert.match(g, /premium-lock/);
  assert.match(g, /data-premium-open="anp"/);
  assert.match(g, /href="\.\.\/notes\/heart-anatomy\.html"/, 'the gate links the topic\'s free notes');
  assert.match(Core.gate('exams', 'exams'), /href="\.\.\/learn\.html"/);

  const d = Core.freeItems(copy(TOOL));
  assert.deepEqual(d.scenarios.map((x) => x.id), ['a']);
  assert.deepEqual(d.sets.map((x) => x.id), ['c']);
  assert.equal(d.groups.length, 1, 'items without a topic are left alone');

  await Core.loadBank('../', { why: false });
  const chapters = fetched.map((u) => u.match(/bank\/(.+)\.json$/)[1]);
  assert.deepEqual(chapters.sort(), FOUNDATIONS.slice().sort(), 'only the free chapters\' questions are fetched');
});

test('a pass opens everything again', async () => {
  const { Core, fetched } = boot({ launched: true, pass: true });
  assert.equal(Core.locked('cardiovascular'), false);
  assert.equal(Core.allowed('exams'), true);
  assert.equal(Core.gate('exams', 'exams'), '');
  assert.equal(Core.badge('cardiovascular'), '', 'members see no pills');
  assert.deepEqual(Core.freeItems(copy(TOOL)), TOOL);
  await Core.loadBank('../', { why: false });
  assert.equal(fetched.length, 27);
});

test('locking never touches earned progress', () => {
  const { Core, localStorage } = boot({ launched: true });
  const rec = { v: 1, q: { 'anp-heart-anatomy-1': { t: 'heart-anatomy', k: [], l: 'r', d: 1, n: 1, c: 0, right: 0, seen: 1, due: 1 } }, lessons: { 'heart-anatomy': 1 }, tools: {}, updated: 1 };
  localStorage.setItem('anp_progress_v1', JSON.stringify(rec));
  Core.freeItems(copy(TOOL));
  Core.gate('review', 'review');
  assert.deepEqual([...Core.reviewQueue()], ['anp-heart-anatomy-1'], 'a locked chapter\'s item stays in the queue');
  assert.ok(Core.load().lessons['heart-anatomy'], 'a finished lesson stays finished');
  assert.ok(Core.topicMastery('heart-anatomy').answered >= 1);
});
