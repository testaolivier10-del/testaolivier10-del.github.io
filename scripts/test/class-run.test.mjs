/* LevlClassRun's pure parts (assets/class/class-run.js, docs/teacher-classes.md v2 A2): finding the assignment,
   its controls with extra time, answer release, the class clock, attempt records, teacher questions (escaped,
   kept out of progress), mixing them in without splitting a stimulus set, and mastery progress. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = { window: {} };
vm.runInNewContext(readFileSync('assets/class/class-run.js', 'utf8'), ctx);
const R = ctx.window.LevlClassRun.pure;
const NOW = Date.UTC(2026, 10, 4, 18), MIN = 60000;
const plain = (x) => JSON.parse(JSON.stringify(x));

const a1 = { id: 'a1', kind: 'practice', title: 'Cells', due_at: new Date(NOW + 86400000).toISOString(),
  spec: { topics: ['t1'], count: 5, controls: { timeLimit: 20, shuffle: true, release: 'after_due', questions: [7] } } };
const cache = { at: NOW, list: [{ id: 'c1', course: 'apbio', extra_time: 1.5, assignments: [a1, { id: 'a2', kind: 'exam', spec: {} }] }] };

test('find: the assignment and its class, in the cache or a bare list', () => {
  assert.equal(R.find(cache, 'a1').a.title, 'Cells');
  assert.equal(R.find(cache, 'a1').cls.id, 'c1');
  assert.equal(R.find(cache.list, 'a2').a.kind, 'exam');
  assert.equal(R.find(cache, 'nope'), null);
  assert.equal(R.find(null, 'a1'), null);
  assert.equal(R.find({ list: 'x' }, 'a1'), null);
});

test('controls: time limit times extra time, defaults, bad values', () => {
  const c = R.controls(a1, cache.list[0]);
  assert.deepEqual(plain(c), { timeLimit: 20, limitMs: 30 * MIN, extra: 1.5, shuffle: true, release: 'after_due', questions: ['7'] });
  const d = R.controls({ spec: {} }, {});
  assert.deepEqual(plain(d), { timeLimit: 0, limitMs: 0, extra: 1, shuffle: false, release: 'now', questions: [] });
  assert.equal(R.controls({ spec: { controls: { release: 'whenever', timeLimit: -3 } } }, { extra_time: 'x' }).release, 'now');
  assert.equal(R.controls({ spec: { controls: { timeLimit: -3 } } }, { extra_time: 0 }).limitMs, 0);
});

test('held and released', () => {
  const c = R.controls(a1, cache.list[0]);
  assert.equal(R.held('practice', c), true);
  assert.equal(R.held('mastery', c), false, 'mastery always gives feedback');
  assert.equal(R.held('practice', R.controls({ spec: {} }, {})), false);
  assert.equal(R.released(a1, c, { end: NOW }, NOW), false, 'after_due: not before the due date');
  assert.equal(R.released(a1, c, { end: NOW }, NOW + 2 * 86400000), true);
  const noDue = { ...a1, due_at: null };
  assert.equal(R.released(noDue, c, { end: 0 }, NOW), false, 'after_due without a due date: after hand-in');
  assert.equal(R.released(noDue, c, { end: NOW }, NOW), true);
  const sub = R.controls({ spec: { controls: { release: 'after_submit' } } }, {});
  assert.equal(R.released(a1, sub, null, NOW), false);
  assert.equal(R.released(a1, sub, { end: NOW }, NOW), true);
});

test('the class clock and an exam pace', () => {
  const c = R.controls(a1, cache.list[0]);
  assert.equal(R.timed('practice', c), true);
  assert.equal(R.timed('practice', R.controls({ spec: {} }, {})), false);
  assert.equal(R.timed('exam', R.controls({ spec: {} }, {})), true, 'exams are always timed');
  assert.equal(R.remaining(c, null, NOW), 30 * MIN);
  assert.equal(R.remaining(c, { start: NOW - 10 * MIN }, NOW), 20 * MIN, 'a reload keeps the clock');
  assert.equal(R.remaining(c, { start: NOW - 99 * MIN }, NOW), 0);
  assert.equal(R.remaining(R.controls({ spec: {} }, {}), { start: NOW }, NOW), null);
  // 30 min left for 20 questions at 90 s each (1800 s): pace 1.
  assert.equal(R.examK(c, null, NOW, 1800), 1);
  assert.equal(R.examK(c, { start: NOW - 15 * MIN }, NOW, 1800), 0.5);
  assert.equal(R.examK(R.controls({ spec: {} }, { extra_time: 2 }), null, NOW, 1800), 2, 'no limit: standard pace times extra time');
  assert.ok(R.examK(c, { start: NOW - 99 * MIN }, NOW, 1800) > 0, 'never 0 (0 means untimed to the engines)');
});

test('attempt records', () => {
  const s = {};
  R.attStart(s, 'a1', NOW); R.attStart(s, 'a1', NOW + 5);
  R.attAnswer(s, 'a1', 'q1', 2, true); R.attAnswer(s, 'a1', 'q1', 0, false); R.attAnswer(s, 'a1', 'q2', [0, 1], false);
  R.attTab(s, 'a1'); R.attTab(s, 'a1');
  assert.deepEqual(plain(s.a1), { start: NOW, end: 0, n: 2, c: 1, tabs: 2, answers: { q1: 2, q2: [0, 1] } });
  R.attEnd(s, 'a1', NOW + 9, { n: 20, c: 14 });
  assert.equal(s.a1.end, NOW + 9); assert.equal(s.a1.n, 20); assert.equal(s.a1.c, 14);
  const big = {};
  for(let i = 0; i < 320; i++) R.attAnswer(big, 'x', 'q' + i, 0, true);
  assert.equal(Object.keys(big.x.answers).length, 300, 'answers capped');
});

test('teacher questions: escaped, own, filtered', () => {
  const rows = [
    { id: 7, course: 'apbio', topic: 't1', unit: 'unit-1', type: 'single', q: '<img src=x onerror=alert(1)>Which?', options: ['<b>A</b>', 'B'], correct: 1, why: 'Because & so' },
    { id: 8, course: 'apchem', q: 'Other course', options: ['a', 'b'], correct: 0 },
    { id: 9, course: 'apbio', q: 'Bad key', options: ['a', 'b'], correct: 5 },
    { id: 10, course: 'apbio', q: 'One option', options: ['a'], correct: 0 }
  ];
  const it = R.teacherItems(rows, 'apbio', true);
  assert.equal(it.length, 1);
  assert.equal(it[0].id, '7');
  assert.equal(it[0].q, '&lt;img src=x onerror=alert(1)&gt;Which?');
  assert.equal(it[0].options[0], '&lt;b&gt;A&lt;/b&gt;');
  assert.equal(it[0].why.correct, 'Because &amp; so');
  assert.equal(it[0].own, true); assert.equal(it[0].fixed, true); assert.equal(it[0].correct, 1);
  assert.deepEqual(plain(R.teacherItems(null, 'apbio')), []);
  // Held: class_questions_for leaves out the key and why; the item is ungraded until class_submit answers.
  const held = R.teacherItems([{ id: 11, q: 'Held?', options: ['a', 'b', 'c'] }], 'apbio', false);
  assert.equal(held.length, 1); assert.equal(held[0].ungraded, true); assert.equal(held[0].correct, -1); assert.equal(held[0].why, null);
});

test('class_submit answers grade the teacher questions once', () => {
  assert.deepEqual(plain(R.submitted([{ id: 11, correct: 2, why: 'w' }, null])), { 11: { id: 11, correct: 2, why: 'w' } });
  assert.deepEqual(plain(R.submitted({ 11: { correct: 1 } })), { 11: { correct: 1 } });
  assert.deepEqual(plain(R.submitted(null)), {});
  const rec = { n: 3, c: 1, answers: { b1: 0, 11: 2, 12: 0 } };
  const keys = R.submitted([{ id: 11, correct: 2 }, { id: 12, correct: 1 }]);
  R.gradeTeacher(rec, keys, ['11', '12']);
  assert.equal(rec.c, 2);
  R.gradeTeacher(rec, keys, ['11', '12']);
  assert.equal(rec.c, 2, 'a second hand-in does not count it again');
  R.gradeTeacher(rec, {}, ['13']);
  assert.equal(rec.c, 2);
});

test('mixing: practice steps and an exam list, sets kept whole', () => {
  const steps = [{ items: [{ id: 'a' }] }, { items: [{ id: 'b' }] }];
  const tq = [{ id: 'T', topic: 't', unit: 'u' }];
  assert.deepEqual(R.mixSteps(steps, tq, false).map((s) => s.items[0].id), ['a', 'b', 'T']);
  let k = 0; const seq = [0.99, 0, 0.5];
  const mixed = R.mixSteps(steps, tq, true, () => seq[k++ % 3]);
  assert.deepEqual(mixed.map((s) => s.items[0].id).sort(), ['T', 'a', 'b']);
  const flat = [{ id: 1, stimulus: 's' }, { id: 2, stimulus: 's' }, { id: 3, stimulus: 's' }, { id: 4 }, { id: 5, stimulus: 'r' }, { id: 6, stimulus: 'r' }];
  for(let r = 0; r < 1; r += 0.05){
    const out = R.mixFlat(flat, [{ id: 'T' }], true, () => r);
    const i = out.findIndex((q) => q.id === 'T');
    assert.equal(out.length, 7);
    assert.ok(!(out[i - 1] && out[i + 1] && out[i - 1].stimulus && out[i - 1].stimulus === out[i + 1].stimulus), 'never inside a set (r=' + r + ')');
  }
  assert.deepEqual(R.mixFlat(flat, [{ id: 'T' }], false).map((q) => q.id), [1, 2, 3, 4, 5, 6, 'T']);
});

test('mastery progress', () => {
  const prog = { q: { x: { t: 't1', n: 1, seen: NOW }, y: { t: 't2', n: 2, seen: NOW - 5 }, z: { t: 't1', n: 1, seen: NOW - 999 }, w: { t: 't9', n: 1, seen: NOW } } };
  assert.equal(R.answeredSince(prog, ['t1', 't2'], NOW - 10), 2);
  const v = { t1: 0.85, t2: 0.6 };
  let m = R.masteryState({ topics: ['t1', 't2'], target: 0.8, min: 2 }, (t) => v[t], 2);
  assert.equal(m.met, false); assert.equal(m.topics[0].ok, true); assert.equal(m.topics[1].ok, false);
  v.t2 = 0.8;
  m = R.masteryState({ topics: ['t1', 't2'], target: 0.8, min: 2 }, (t) => v[t], 2);
  assert.equal(m.met, true);
  assert.equal(R.masteryState({ topics: ['t1', 't2'], target: 0.8, min: 3 }, (t) => v[t], 2).met, false, 'needs min answers');
  const d = R.masteryState({ topics: ['t1'] }, () => 1, 10);
  assert.equal(d.target, 0.8); assert.equal(d.min, 10); assert.equal(d.met, true);
  assert.equal(R.masteryState({ topics: [] }, () => 1, 99).met, false);
});
