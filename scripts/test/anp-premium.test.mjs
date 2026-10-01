/* The A&P free/premium split (AnpCore over assets/premium.js).

   Before launch nothing may change but the pills. After launch, without a
   pass (the unified free tier, spec decision 72): Foundations questions are
   unlimited, other chapters' questions draw on the daily allowance practice
   and review share, one exam is free, flashcards and three tools are free,
   and the Premium tools and deeper analytics close whole. A pass opens it
   all. Earned progress is never touched. */
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

const PAGES = JSON.parse(readFileSync('anatomy-physiology/data/pages.json', 'utf8'));
const premiumOf = (slug) => [...PAGES.apps, ...PAGES.tools].find((e) => e.slug === slug).premium;
const q = (id, chapter) => ({ id, chapter });

test('the Foundations part of the map is the five opening chapters', () => {
  assert.deepEqual(FOUNDATIONS, ['orientation', 'chem-physics', 'cells', 'tissues', 'cell-communication']);
});

test('pages.json: three free tools, four Premium; flashcards free; practice, review and exams on the free tier', () => {
  for (const s of ['word-roots', 'feedback-loops', 'calculators', 'flashcards', 'dashboard']) assert.equal(premiumOf(s), undefined, s);
  for (const s of ['lab-practical', 'predict', 'pathways', 'graphs']) assert.equal(premiumOf(s), 'tools', s);
  assert.equal(premiumOf('practice'), 'question-bank');
  assert.equal(premiumOf('review'), 'review');
  assert.equal(premiumOf('exams'), 'exams');
});

test('before launch nothing is locked, nothing is counted, and Premium features carry the pill', () => {
  const { Core, localStorage } = boot({ launched: false });
  for (const ch of ['cardiovascular', 'cells', '']) assert.equal(Core.locked(ch), false, ch);
  for (const f of ['tools', 'analytics']) assert.equal(Core.allowed(f), true, f);
  assert.equal(Core.gate('lessons', 'lesson', 'heart-anatomy'), '');
  assert.equal(Core.quota().limit, Infinity);
  for (let i = 0; i < 30; i++) assert.equal(Core.serve(q('cv-' + i, 'cardiovascular')), true);
  assert.equal(localStorage.getItem('levlprep_quota_v1'), null, 'nothing is counted');
  assert.equal(Core.freeExam().available, true);
  assert.match(Core.badge('cardiovascular'), /premium-badge/);
  assert.equal(Core.badge('cells'), '', 'a Foundations surface is free, so no pill');
});

test('without premium.js the course behaves as before: open, no pills', () => {
  const { Core } = boot({ withPremium: false });
  assert.equal(Core.locked('cardiovascular'), false);
  assert.equal(Core.allowed('tools'), true);
  assert.equal(Core.serve(q('x', 'cardiovascular')), true);
  assert.equal(Core.freeExam().use(), true);
  assert.equal(Core.badge(), '');
  assert.equal(Core.gate('exam', 'exams'), '');
});

test('launched without a pass: Foundations unlimited, 15 other questions a day, counted once each', async () => {
  const { Core, fetched } = boot({ launched: true });
  for (const ch of FOUNDATIONS) assert.equal(Core.locked(ch), false, ch);
  assert.equal(Core.locked('cardiovascular'), true);
  assert.equal(Core.quota().limit, 15);
  for (let i = 0; i < 40; i++) assert.equal(Core.serve(q('cells-' + i, 'cells')), true, 'Foundations never counts');
  assert.equal(Core.quota().left, 15);
  for (let i = 0; i < 15; i++) assert.equal(Core.serve(q('cv-' + i, 'cardiovascular')), true, 'question ' + (i + 1));
  assert.equal(Core.serve(q('cv-0', 'cardiovascular')), true, 'a question already shown costs nothing again');
  assert.equal(Core.quota().left, 0);
  assert.equal(Core.serve(q('resp-1', 'respiratory')), false, 'the sixteenth is refused');
  assert.equal(Core.serve({ id: 'by-topic', topic: 'heart-anatomy' }), false, 'a question known only by its topic counts too');
  assert.equal(Core.serve(q('cells-99', 'cells')), true, 'Foundations stays open after the limit');
  const g = Core.gate('daily-limit', 'practice-limit');
  assert.match(g, /premium-lock/);
  assert.match(g, /15 free questions/);

  await Core.loadBank('../', { why: false });
  assert.equal(fetched.length, 27, 'the whole bank loads: other chapters are served under the allowance');
});

test('launched without a pass: one free exam, then the card; an in-progress exam is not re-checked', () => {
  const { Core } = boot({ launched: true });
  const fe = Core.freeExam();
  assert.equal(fe.unlimited, false);
  assert.equal(fe.available, true);
  assert.equal(fe.use(), true, 'starting the free exam');
  assert.equal(Core.freeExam().available, false);
  assert.equal(Core.freeExam().use(), false, 'a second exam is refused');
  assert.match(Core.gate('exam', 'exams'), /free timed exam/);
  assert.match(Core.gate('exam', 'exams'), /href="\.\.\/learn\.html"/);
  assert.equal(Core.quota().left, 15, 'the exam does not touch the daily allowance');
});

test('launched without a pass: Premium tools and deeper analytics closed, lessons outside Foundations gated', () => {
  const { Core } = boot({ launched: true });
  assert.equal(Core.allowed('tools'), false);
  assert.equal(Core.allowed('analytics'), false);
  assert.equal(Core.allowed('flashcards'), true, 'flashcards are free');
  assert.equal(Core.allowed('graphs'), true, 'an unnamed feature is not closed');
  const g = Core.gate('lessons', 'lesson', 'heart-anatomy');
  assert.match(g, /data-premium-open="anp"/);
  assert.match(g, /href="\.\.\/notes\/heart-anatomy\.html"/, 'the gate links the topic\'s free notes');
});

test('a pass opens everything again', async () => {
  const { Core, fetched, localStorage } = boot({ launched: true, pass: true });
  assert.equal(Core.locked('cardiovascular'), false);
  assert.equal(Core.allowed('tools'), true);
  assert.equal(Core.allowed('analytics'), true);
  for (let i = 0; i < 40; i++) assert.equal(Core.serve(q('cv-' + i, 'cardiovascular')), true);
  assert.equal(localStorage.getItem('levlprep_quota_v1'), null, 'members are never counted');
  assert.equal(Core.freeExam().use(), true);
  assert.equal(Core.freeExam().use(), true, 'members take any number of exams');
  assert.equal(Core.gate('exam', 'exams'), '');
  assert.equal(Core.badge('cardiovascular'), '', 'members see no pills');
  await Core.loadBank('../', { why: false });
  assert.equal(fetched.length, 27);
});

test('locking never touches earned progress', () => {
  const { Core, localStorage } = boot({ launched: true });
  const rec = { v: 1, q: { 'anp-heart-anatomy-1': { t: 'heart-anatomy', k: [], l: 'r', d: 1, n: 1, c: 0, right: 0, seen: 1, due: 1 } }, lessons: { 'heart-anatomy': 1 }, tools: {}, updated: 1 };
  localStorage.setItem('anp_progress_v1', JSON.stringify(rec));
  for (let i = 0; i < 20; i++) Core.serve(q('cv-' + i, 'cardiovascular'));
  Core.gate('daily-limit', 'review-limit');
  assert.deepEqual([...Core.reviewQueue()], ['anp-heart-anatomy-1'], 'a gated item stays in the queue');
  assert.ok(Core.load().lessons['heart-anatomy'], 'a finished lesson stays finished');
  assert.ok(Core.topicMastery('heart-anatomy').answered >= 1);
});
