/* ApBioCore (bio/assets/bio-core.js): the progress store, mastery by topic,
   unit and science practice, the SM-2 review queue, XP through HubProgress
   (guarded), account merge, premium hooks that tolerate an absent or
   unregistered premium.js, and the lazy bank (index, units, explanations)
   against a bank built from the test map (docs/apbio-architecture.md). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { createBrowser } from './harness.mjs';

const CUR = {
  units: [{ id: 'unit-1', n: 1, part: 'course' }, { id: 'unit-3', n: 3, part: 'course' }],
  topics: [
    { id: 't1', unit: 'unit-1', built: true, free: true, qn: 15 },
    { id: 't2', unit: 'unit-1', built: true, free: true, qn: 15 },
    { id: 't3', unit: 'unit-3', built: true, free: false, qn: 15 },
  ],
  practices: [{ id: 1, name: 'Concept Explanation' }, { id: 4, name: 'Data' }],
  practiceCounts: { 1: 10, 4: 10 },
};
function boot(extra = {}) {
  const b = createBrowser();
  b.window.ApBioCurriculum = JSON.parse(JSON.stringify(CUR));
  Object.assign(b.window, extra);
  b.load('bio/assets/bio-core.js');
  return { ...b, Core: b.window.ApBioCore };
}
const meta = (topic, unit, practice, level = 'apply') => ({ topic, unit, practice, level, diff: 2 });

test('record stores unit, topic and practice as given, never inferred', () => {
  const { Core } = boot();
  Core.record('bio-t1-1', true, meta('t1', 'unit-1', '4.B'));
  const r = Core.load().q['bio-t1-1'];
  assert.equal(r.t, 't1'); assert.equal(r.u, 'unit-1'); assert.equal(r.p, '4.B'); assert.equal(r.l, 'p');
});

test('mastery by topic, unit and practice', () => {
  const { Core } = boot();
  for (let i = 1; i <= 6; i++) Core.record(`bio-t1-${i}`, true, meta('t1', 'unit-1', i % 2 ? '4.B' : '1.A'));
  Core.record('bio-t2-1', false, meta('t2', 'unit-1', '4.A'));
  assert.equal(Core.topicMastery('t1').value, 6 / 12);
  assert.equal(Core.topicMastery('t2').value, 0);
  assert.equal(Core.unitMastery('unit-1').value, 0.25);
  assert.equal(Core.unitMastery('unit-3').answered, 0);
  // Practice 4 counts 4.A and 4.B; "4.B" only that skill. Full is min(20, 10 built).
  assert.equal(Core.practiceMastery(4).answered, 4);
  assert.equal(Core.practiceMastery('4.B').answered, 3);
  assert.equal(Core.practiceMastery(4).value, 3 / 10);
  assert.equal(Core.practiceMastery(1).value, 3 / 10);
  assert.equal(Core.weakestPractice(5).length, 2, 'only practiced practices are ranked');
});

test('a miss enters review in ten minutes; right answers space it out and graduate it', () => {
  const b = boot(), { Core } = b;
  Core.record('bio-t1-1', false, meta('t1', 'unit-1', '1.A'));
  assert.deepEqual([...Core.reviewQueue()], []);
  b.setNow(b.now() + 11 * 60000);
  assert.deepEqual([...Core.reviewQueue()], ['bio-t1-1']);
  Core.record('bio-t1-1', true, meta('t1', 'unit-1', '1.A'));
  assert.equal(Core.load().q['bio-t1-1'].ivl, 1);
  let r;
  for (let i = 0; i < 6; i++) { b.advanceDays(40); Core.record('bio-t1-1', true, meta('t1', 'unit-1', '1.A')); r = Core.load().q['bio-t1-1']; if (!r.due) break; }
  assert.equal(r.due, 0, 'graduated');
  assert.deepEqual([...Core.missed()], []);
});

test('XP goes through HubProgress under the apbio key, and a missing or broken HubProgress is harmless', () => {
  const calls = [];
  const { Core } = boot({ HubProgress: { award: (c, n) => calls.push([c, n]), recordActivity() {} } });
  Core.record('bio-t1-1', true, meta('t1', 'unit-1', '1.A', 'analyze'));
  Core.lessonComplete('t1');
  assert.deepEqual(calls, [['apbio', 12], ['apbio', 40]]);
  const broken = boot({ HubProgress: { award() { throw new Error('unknown course'); } } });
  assert.doesNotThrow(() => broken.Core.record('x', true, meta('t1', 'unit-1', '1.A')));
  assert.doesNotThrow(() => boot().Core.record('y', true, meta('t1', 'unit-1', '1.A')));
});

test('premium: nothing locked without premium.js or before the course is registered', () => {
  assert.equal(boot().Core.locked('unit-3'), false);
  const P = { launched: () => true, has: () => false, isFreeChapter: (c, u) => u === 'unit-1', COURSES: {} };
  assert.equal(boot({ LevlPremium: P }).Core.locked('unit-3'), false, 'apbio not in COURSES yet');
  const reg = { ...P, COURSES: { apbio: {} }, quota: () => ({ take: () => false }) };
  const { Core } = boot({ LevlPremium: reg });
  assert.equal(Core.locked('unit-3'), true);
  assert.equal(Core.locked('unit-1'), false);
  assert.equal(Core.locked('unit-3', 't1'), false, 'a free topic is never locked');
  assert.equal(Core.serve({ id: 'q1', unit: 'unit-1' }), true);
  assert.equal(Core.serve({ id: 'q2', unit: 'unit-3' }), false, 'out of the daily allowance');
});

test('merge keeps the newer record per item and the earliest lesson completion', () => {
  const { Core } = boot();
  const a = JSON.stringify({ v: 1, q: { x: { seen: 5, right: 0 } }, lessons: { t1: 9 }, tools: {}, updated: 5 });
  const c = JSON.stringify({ v: 1, q: { x: { seen: 7, right: 1 }, y: { seen: 1 } }, lessons: { t1: 3 }, tools: {}, updated: 7 });
  const m = JSON.parse(Core.merge(a, c));
  assert.equal(m.q.x.right, 1); assert.ok(m.q.y); assert.equal(m.lessons.t1, 3);
});

test('lazy bank: the index, then only the units a set needs, then explanations', async () => {
  const out = mkdtempSync(join(tmpdir(), 'apbio-'));
  execFileSync(process.execPath, ['scripts/build-apbio.mjs', '--out', join(out, 'bio')], { env: { ...process.env, APBIO_MAP_STUB: '1', APBIO_PUBLISHED: 'unit-1,skills-stats' } });
  const fetched = [];
  const noop = () => {};
  const store = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
  const document = { readyState: 'complete', addEventListener: noop, getElementById: () => null, querySelector: () => null, documentElement: { classList: { add: noop } } };
  const window = { localStorage: store(), document, location: { href: 'http://localhost/' } };
  window.window = window;
  const sandbox = { window, document, localStorage: window.localStorage, location: window.location, console, setTimeout, clearTimeout,
    fetch: u => { fetched.push(u); try { const body = readFileSync(join(out, 'bio', u), 'utf8'); return Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(body)) }); } catch { return Promise.resolve({ ok: false, status: 404 }); } } };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  for (const f of [join(out, 'bio', 'assets', 'bio-curriculum.js'), 'bio/assets/bio-core.js']) vm.runInContext(readFileSync(f, 'utf8'), sandbox, { filename: f });
  const Core = window.ApBioCore;
  const stubs = await Core.loadIndex('');
  // Content-agnostic: the Unit 1 bank is authored content, so read the expected values from it.
  const src = JSON.parse(readFileSync('bio/data/questions/water-hydrogen-bonding.json', 'utf8'));
  const want = src.items.find(x => x.type === 'numeric' && x.stimulus && src.stimuli[x.stimulus].table);
  assert.ok(stubs.length >= src.items.length);
  const s = stubs.find(x => x.id === want.id);
  assert.deepEqual({ unit: s.unit, practice: s.practice, type: s.type, stimulus: s.stimulus }, { unit: 'unit-1', practice: want.practice, type: 'numeric', stimulus: want.stimulus });
  assert.ok(stubs.filter(x => x.stimulus).length >= 4, 'stimulus sets in the index');
  const qs = await Core.loadQuestions('', [s]);
  assert.equal(qs[0].numeric.answer, want.numeric.answer);
  assert.ok(qs[0].stim && /<table/.test(qs[0].stim.html), 'stimulus attached');
  assert.ok(!qs[0].why, 'no explanation yet');
  await Core.loadWhy('', qs[0]);
  assert.equal(qs[0].why.correct, want.why.correct);
  assert.deepEqual(fetched, ['assets/bank/index.json', 'assets/bank/unit-1.json', 'assets/bank/unit-1-why.json']);
});
