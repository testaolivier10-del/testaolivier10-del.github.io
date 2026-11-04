/* LevlClassModel (assets/class/class-model.js, docs/teacher-classes.md): the student's summary of a course, mastery
   from it, where a student stands on each kind of assignment (practice, review, exam, free response, late, missing)
   and the class's most missed questions with the answers picked. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = { window: {} };
vm.runInNewContext(readFileSync('assets/class/class-model.js', 'utf8'), ctx);
const M = ctx.window.LevlClassModel;
const DAY = 86400000, NOW = Date.UTC(2026, 10, 4, 18);
const CUR = { units: [{ id: 'unit-1', n: 1 }, { id: 'unit-2', n: 2 }], topics: [
  { id: 'a', unit: 'unit-1', qn: 12 }, { id: 'b', unit: 'unit-1', qn: 12 }, { id: 'c', unit: 'unit-2', qn: 12 }] };

function store(q, extra = {}) {
  const s = { apbio_progress_v1: JSON.stringify({ v: 1, q, lessons: { a: 1 } }), ...extra };
  return (k) => (k in s ? s[k] : null);
}
const rec = (t, u, right, daysAgo, n = 1) => ({ t, u, n, c: right ? n : 0, right: right ? 1 : 0, seen: NOW - daysAgo * DAY, l: 'p' });

test('summarize keeps only answered items, compact, with picks, flags, exams and FRQs', () => {
  const sum = M.summarize('apbio', store(
    { 'bio-a-1': rec('a', 'unit-1', 1, 1), 'bio-a-2': rec('a', 'unit-1', 0, 2), 'bio-a-3': { t: 'a', n: 0 } },
    { apbio_picks_v1: JSON.stringify({ 'bio-a-2': 3, 'bio-x-9': 1 }), apbio_flagged_v1: JSON.stringify({ 'bio-a-2': NOW }),
      apbio_prefs_v1: JSON.stringify({ examHistory: [{ ts: NOW, kind: 'unit', label: 'U1', unit: 'unit-1', mcq: { c: 8, n: 10 } }], frqScores: { f1: { got: 5, of: 8, ts: NOW } } }) }), NOW);
  assert.deepEqual(Object.keys(sum.items).sort(), ['bio-a-1', 'bio-a-2']);
  assert.deepEqual([...sum.items['bio-a-2']], ['a', 'unit-1', 1, 0, 0, Math.round((NOW - 2 * DAY) / 1000), 'p']);
  assert.deepEqual({ ...sum.picks }, { 'bio-a-2': 3 }, 'picks only for items in the summary');
  assert.equal(sum.exams[0].c, 8); assert.equal(sum.frq.f1.of, 8); assert.equal(sum.lessons, 1);
});

test('mastery: right answers count, wrong ones do not, units average their topics', () => {
  const q = {}; for (let i = 0; i < 12; i++) q['bio-a-' + i] = rec('a', 'unit-1', 1, 0);
  q['bio-b-1'] = rec('b', 'unit-1', 0, 0);
  const sum = M.summarize('apbio', store(q), NOW), tm = M.topicMastery(sum, CUR, NOW);
  assert.equal(Math.round(tm.a.value * 100), 100);
  assert.equal(tm.b.value, 0); assert.equal(tm.b.wrong, 1);
  assert.equal(Math.round(M.unitMastery(tm, CUR, 'unit-1') * 100), 50);
  assert.equal(M.lastActive(sum), NOW);
});

test('practice status: counts answers since it opened, in its topics, and marks late and missing', () => {
  const opens = NOW - 3 * DAY;
  const a = { kind: 'practice', spec: { topics: ['a'], count: 3 }, opens_at: opens, due_at: NOW - DAY, late_until: NOW + DAY };
  const q = { 'bio-a-1': rec('a', 'unit-1', 1, 2), 'bio-a-2': rec('a', 'unit-1', 0, 1.5), 'bio-a-3': rec('a', 'unit-1', 1, 0.5), 'bio-a-4': rec('a', 'unit-1', 1, 9), 'bio-c-1': rec('c', 'unit-2', 1, 1) };
  const st = M.status(a, M.summarize('apbio', store(q), NOW), NOW);
  assert.equal(st.state, 'done'); assert.equal(st.answered, 3); assert.equal(Math.round(st.score * 3), 2);
  assert.equal(st.late, true, 'the third answer came after the due date');
  const none = M.status(a, M.summarize('apbio', store({}), NOW), NOW);
  assert.equal(none.state, 'not'); assert.equal(none.late, true, 'past due but inside the late window');
  assert.equal(M.status({ ...a, late_until: null }, M.summarize('apbio', store({}), NOW), NOW).state, 'missing');
});

test('review status: the misses from before it opened, redone after', () => {
  const opens = NOW - 2 * DAY, a = { kind: 'review', spec: { topics: [], count: 25 }, opens_at: opens };
  const q = { 'bio-a-1': rec('a', 'unit-1', 0, 5), 'bio-a-2': rec('a', 'unit-1', 1, 1, 2), 'bio-a-3': rec('a', 'unit-1', 1, 6), 'bio-a-4': rec('a', 'unit-1', 1, 1) };
  const st = M.status(a, M.summarize('apbio', store(q), NOW), NOW);
  assert.equal(M.status(a, M.summarize('apbio', store({}), NOW), NOW).state, 'done', 'nothing to redo counts as done');
  assert.equal(st.total, 2, 'one miss still waiting, one redone; a first answer since is not a review'); assert.equal(st.answered, 1); assert.equal(st.state, 'progress');
});

test('exam and free-response status read the course history', () => {
  const sum = M.summarize('apbio', store({}, { apbio_prefs_v1: JSON.stringify({ examHistory: [{ ts: NOW - DAY, unit: 'unit-1', mcq: { c: 6, n: 10 } }], frqScores: { f1: { got: 4, of: 8, ts: NOW - DAY } } }) }), NOW);
  const ex = M.status({ kind: 'exam', spec: { unit: 'unit-1' }, opens_at: NOW - 2 * DAY }, sum, NOW);
  assert.equal(ex.state, 'done'); assert.equal(ex.score, 0.6);
  assert.equal(M.status({ kind: 'exam', spec: { unit: null }, opens_at: NOW - 2 * DAY }, sum, NOW).state, 'not', 'a unit test is not the full exam');
  assert.equal(M.status({ kind: 'frq', spec: { frq: 'f1' }, opens_at: NOW - 2 * DAY }, sum, NOW).score, 0.5);
  assert.equal(M.status({ kind: 'frq', spec: { frq: 'f1' }, opens_at: NOW }, sum, NOW).state, 'not', 'scored before it was assigned');
});

test('itemStats: worst first, with the answers picked and who missed it', () => {
  const mk = (name, right, pick) => ({ name, summary: M.summarize('apbio', store({ 'bio-a-1': rec('a', 'unit-1', right, 1), 'bio-b-1': rec('b', 'unit-1', 1, 1) }, { apbio_picks_v1: JSON.stringify({ 'bio-a-1': pick }), apbio_flagged_v1: right ? '{}' : JSON.stringify({ 'bio-a-1': NOW }) }), NOW) });
  const st = M.itemStats([mk('Ana', 0, 2), mk('Ben', 0, 2), mk('Cy', 1, 0)]);
  assert.equal(st[0].id, 'bio-a-1'); assert.equal(st[0].wrong, 2); assert.deepEqual({ ...st[0].picks }, { 0: 1, 2: 2 });
  assert.deepEqual([...st[0].who], ['Ana', 'Ben']); assert.equal(st[0].flags, 2);
  assert.equal(M.flagCounts([mk('Ana', 0, 2)])['bio-a-1'], 1);
});

test('every class course points at a curriculum file and a question folder that exist', () => {
  for (const k of M.ORDER) {
    const c = M.COURSES[k];
    assert.match(readFileSync(c.cur, 'utf8'), new RegExp('window\\.' + c.g + '\\s*='), k);
    assert.ok(readFileSync(c.dir + '/assets/frq/index.json', 'utf8').length > 2, k + ' FRQ index');
  }
});
