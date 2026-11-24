/* Profile badges (assets/profile-badges.js, docs/progress-profile.md "Profile v2"): a course's numbers from its
   records, which badges they earn, what a locked one says, and that every badge draws. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = { window: {} };
vm.runInNewContext(readFileSync('assets/profile-badges.js', 'utf8'), ctx);
const B = ctx.window.LevlBadges;
const plain = (x) => JSON.parse(JSON.stringify(x));

const part = { q: { a: { n: 30 }, b: { n: 25 }, c: { n: 0 } }, lessons: 3, frq: { x: {}, y: {} },
  exams: [{ n: 10, c: 9, kind: 'unit' }, { n: 60, c: 30, kind: 'full' }, { n: 20, c: 20, kind: 'full', partial: true }, { n: 0, c: 0 }] };
const days = { '2026-11-01': { apbio: 3, nremt: 9 }, '2026-11-02': { nremt: 4 }, '2026-11-03': { apbio: 1 } };
const MS = [{ id: 'u1', kind: 'chapter', title: 'Unit 1: Chemistry of Life', earned: true, done: 5, total: 5 }, { id: 'u2', kind: 'chapter', title: 'Unit 2: Cells', earned: false, done: 2, total: 6 },
  { id: 'sk', kind: 'chapter', title: 'Math you need', earned: false, done: 0, total: 3 },
  { id: 'all', kind: 'course', earned: false, done: 1, total: 2 }];

test('a course’s numbers: every answer, every scored exam, the best full score, its own days', () => {
  assert.deepEqual(plain(B.stats('apbio', part, days)), { answers: 55, exams: 3, full: 1, best: 90, lessons: 3, frq: 2, days: 2 });
  assert.deepEqual(plain(B.stats('apchem', null, days)), { answers: 0, exams: 0, full: 0, best: 0, lessons: 0, frq: 0, days: 0 });
});

test('an AP course: units with certificates, tiers earned at their number, locked ones say how far', () => {
  const s = B.stats('apbio', part, days), list = B.forCourse('apbio', s, MS);
  const by = Object.fromEntries(list.map((b) => [b.id, b]));
  assert.equal(list.length, 3 + 1 + 4 + 3 + 3 + 2 + 2);
  assert.equal(new Set(list.map((b) => b.id)).size, list.length, 'ids are unique');
  assert.deepEqual(plain(list.filter((b) => b.earned).map((b) => b.label)), ['Unit 1 complete', '50 questions', 'First lesson', 'First practice exam', '3 exams', '80%+ exam', 'First free response']);
  assert.equal(by['ms-u1'].cert, 'u1'); assert.equal(by['ms-u2'].cert, null);
  assert.equal(by['ms-u2'].tip, 'Finish every lesson in Unit 2, Cells. 2 of 6 done.'); assert.equal(by['ms-u1'].sub, 'Chemistry of Life');
  assert.equal(by['ms-sk'].label, 'Math you need complete'); assert.equal(by['ms-sk'].glyph[0], 'check');
  assert.equal(by['q-250'].tip, 'Answer 250 questions in this course. 55 answered so far.');
  assert.equal(by['q-50'].sub, '55 answered');
  assert.equal(by['days-30'].tip, 'Study this course on 30 different days. 2 days studied so far.');
  assert.equal(by['lesson-10'].tip, 'Finish 10 lessons in this course. 3 lessons finished so far.');
});

test('a course with nothing done: nothing earned, tips without a count', () => {
  const list = B.forCourse('apchem', B.stats('apchem', {}, {}), []);
  assert.equal(list.filter((b) => b.earned).length, 0);
  assert.equal(list.find((b) => b.id === 'q-50').tip, 'Answer 50 questions in this course.');
});

test('NREMT keeps its six badges and its exam certificate; no free response; chapters elsewhere', () => {
  const s = { answers: 612, exams: 3, full: 3, best: 78, lessons: 0, frq: 0, days: 12 };
  const list = B.forCourse('nremt', s, [{ id: 'exam', kind: 'exam', earned: false }], { longest: 9, level: 4 });
  const labels = list.map((b) => b.label);
  for (const l of ['7-day streak', '30-day streak', 'First full exam', '90%+ exam', '500 questions', 'Level 10', 'Full exam at 80%']) assert.ok(labels.includes(l), l);
  assert.ok(!labels.some((l) => /free response/.test(l)));
  assert.deepEqual(plain(list.filter((b) => b.earned).map((b) => b.label)), ['50 questions', '250 questions', '500 questions', 'First full exam', '3 exams', '7-day streak']);
  assert.match(list.find((b) => b.label === '90%+ exam').tip, /Best so far 78%/);
  const anp = B.forCourse('anp', B.stats('anp', {}, {}), [{ id: 'c1', kind: 'chapter', title: 'Cells', earned: false, done: 0, total: 4 }]);
  assert.equal(anp[0].label, 'Chapter 1 complete'); assert.ok(!anp.some((b) => b.fam === 'frq'));
});

test('every badge draws, earned and locked, for every course', () => {
  for (const course of Object.keys(B.COLORS)) {
    const list = B.forCourse(course, B.stats(course, part, days), course === 'nremt' ? [{ id: 'exam', kind: 'exam', earned: true }] : MS, { longest: 40, level: 12 });
    for (const b of list) {
      const on = B.art(b, course), off = B.art(b, course, true);
      assert.match(on, /^<svg class="bd-art"[\s\S]*<\/svg>$/); assert.ok(!/undefined|NaN/.test(on), course + ' ' + b.id);
      assert.ok(off.includes('#94A3B8') && !off.includes('<text'), 'a locked badge shows only the lock');
    }
  }
  assert.equal(B.mix('#000000', '#ffffff', 0.5), '#808080');
});
