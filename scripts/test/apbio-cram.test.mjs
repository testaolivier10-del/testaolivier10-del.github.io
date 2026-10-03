/* The AP® Biology cram plan generator (window.ApBioCramPlan in
   bio/assets/pages/cram.js; docs/apbio-spec.md decision 26): weights sum to
   one, dates count back from the exam across month and leap-year boundaries,
   the two practice exams, rest days and the eve sit where the templates put
   them, every unit and topic is covered, and mastery shifts sessions toward
   the weakest units. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const W = (lo, hi) => [lo, hi];
const UNITS = [
  { id: 'unit-1', n: 1, part: 'course', title: 'Chemistry of Life', weight: W(8, 11) },
  { id: 'unit-2', n: 2, part: 'course', title: 'Cells', weight: W(10, 13) },
  { id: 'unit-3', n: 3, part: 'course', title: 'Energetics', weight: W(12, 16) },
  { id: 'unit-4', n: 4, part: 'course', title: 'Communication', weight: W(10, 15) },
  { id: 'unit-5', n: 5, part: 'course', title: 'Heredity', weight: W(8, 11) },
  { id: 'unit-6', n: 6, part: 'course', title: 'Gene Expression', weight: W(12, 16) },
  { id: 'unit-7', n: 7, part: 'course', title: 'Natural Selection', weight: W(13, 20) },
  { id: 'unit-8', n: 8, part: 'course', title: 'Ecology', weight: W(10, 15) },
  { id: 'skills-stats', n: null, part: 'skills', title: 'Statistics', weight: null },
];
const TOPICS = [];
UNITS.filter(u => u.part === 'course').forEach(u => { for (let i = 1; i <= 5 + u.n % 3; i++) TOPICS.push({ id: `${u.id}-t${i}`, unit: u.id, title: `T${i}`, built: true }); });
const FRQS = [
  { id: 'f-a', type: 'iee', units: ['unit-1'] }, { id: 'f-b', type: 'model', units: ['unit-7'] }, { id: 'f-c', type: 'data', units: ['unit-3'] },
];

function Plan() { const b = createBrowser(); b.load('bio/assets/pages/cram.js'); return b.window.ApBioCramPlan; }
const P = Plan();
const build = (o = {}) => P.build({ exam: '2027-05-03', weeks: 3, units: UNITS, topics: TOPICS, mastery: null, frqs: FRQS, ...o });

test('unit shares sum to 1 and follow exam weight without data', () => {
  for (const weeks of [3, 2]) {
    const p = build({ weeks });
    const sum = Object.values(p.shares).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9, `shares sum ${sum}`);
    assert.equal(Object.keys(p.shares).length, 8, 'course units only, skills left out');
    assert.ok(p.shares['unit-7'] > p.shares['unit-1'], 'heavier unit, larger share');
    assert.equal(p.personal, false);
  }
});

test('study sessions: every slot used, every unit at least one, every topic once', () => {
  for (const weeks of [3, 2]) {
    const p = build({ weeks });
    const studyDays = p.days.filter(d => d.kind === 'study').length;
    const slots = Object.values(p.slots).reduce((a, b) => a + b, 0);
    assert.equal(slots, studyDays * 2);
    for (const u of UNITS.filter(u => u.part === 'course')) assert.ok(p.slots[u.id] >= 1, `${u.id} has a session`);
    const seen = p.days.filter(d => d.kind === 'study').flatMap(d => d.topics);
    assert.deepEqual([...seen].sort(), TOPICS.map(t => t.id).sort(), 'each topic exactly once in the course-order pass');
    // Course order: a unit never comes back after a later one.
    const order = p.days.filter(d => d.kind === 'study').flatMap(d => d.units).map(u => +u.split('-')[1]);
    for (let i = 1; i < order.length; i++) assert.ok(order[i] >= order[i - 1], 'units in course order');
  }
  assert.ok(build().slots['unit-7'] > build().slots['unit-1'], 'Unit 7 (13-20%) gets more sessions than Unit 1 (8-11%)');
});

test('dates count back from the exam: 21 or 14 consecutive days ending the day before', () => {
  const p3 = build();
  assert.equal(p3.length, 21); assert.equal(p3.days.length, 21);
  assert.equal(p3.start, '2027-04-12'); assert.equal(p3.end, '2027-05-02');
  assert.equal(p3.days[20].date, '2027-05-02');
  const p2 = build({ weeks: 2 });
  assert.equal(p2.days.length, 14); assert.equal(p2.start, '2027-04-19');
  for (const p of [p3, p2]) p.days.forEach((d, i) => { assert.equal(d.n, i + 1); if (i) assert.equal(P.daysBetween(p.days[i - 1].date, d.date), 1); });
});

test('month boundaries, year ends and leap days', () => {
  // April -> May (the default exam).
  assert.deepEqual([...build().days.slice(18).map(d => d.date)], ['2027-04-30', '2027-05-01', '2027-05-02']);
  // February in a common year: 28 days.
  const feb = build({ exam: '2027-03-10', weeks: 2 });
  assert.equal(feb.start, '2027-02-24');
  assert.ok(feb.days.some(d => d.date === '2027-02-28') && feb.days.some(d => d.date === '2027-03-01'));
  assert.ok(!feb.days.some(d => d.date === '2027-02-29'));
  // A leap year: 29 February is a day of the plan.
  const leap = build({ exam: '2028-03-05', weeks: 3 });
  assert.equal(leap.start, '2028-02-13');
  assert.ok(leap.days.some(d => d.date === '2028-02-29'));
  assert.equal(leap.end, '2028-03-04');
  // Across a year end.
  assert.equal(build({ exam: '2027-01-05', weeks: 2 }).start, '2026-12-22');
  // A daylight-saving change in the plan (14 March 2027 in the US) still gives one date per day.
  const dst = build({ exam: '2027-03-20', weeks: 3 });
  assert.equal(new Set(dst.days.map(d => d.date)).size, 21);
  // A bad date falls back to the default exam.
  assert.equal(build({ exam: 'soon' }).exam, '2027-05-03');
});

test('two full practice exams placed sensibly, each followed by its review (after a rest day at most); rest days and the eve', () => {
  for (const weeks of [3, 2]) {
    const p = build({ weeks }), L = p.length;
    const exams = p.days.filter(d => d.kind === 'exam');
    assert.equal(exams.length, 2);
    assert.deepEqual([...exams.map(d => d.exam)], [1, 2]);
    const [a, b] = exams.map(d => d.n);
    assert.ok(a > 3 && a <= L / 2, `first exam on day ${a}: after some study, in the first half`);
    assert.ok(b >= L - 6 && b <= L - 4, `second exam on day ${b}: four to six days before the real one`);
    // Its review is the next day, or the day after a rest day.
    for (const x of exams) { const next = p.days.slice(x.n).find(d => d.kind !== 'rest'); assert.ok(next.n - x.n <= 2); assert.equal(next.kind, 'review'); assert.equal(next.exam, x.exam); }
    assert.equal(p.days[L - 1].kind, 'eve', 'the last day is light review');
    assert.ok(!p.days.some((d, i) => d.kind === 'exam' && p.days[i - 1] && p.days[i - 1].kind === 'exam'));
    const rest = p.days.filter(d => d.kind === 'rest').length;
    assert.equal(rest, weeks === 3 ? 2 : 1);
    assert.equal(p.days.filter(d => d.kind === 'study' || d.kind === 'weak').length, weeks === 3 ? 14 : 8);
    // Days with work carry a timed set and an FRQ; sets grow through the plan.
    const work = p.days.filter(d => d.kind === 'study' || d.kind === 'weak');
    for (const d of work) { assert.ok([10, 20, 30].includes(d.set)); assert.ok(d.frq); }
    assert.ok(work[0].set <= work[work.length - 1].set);
  }
});

test('mastery data makes the plan personal: weak units get more sessions and come first on weak-spot days', () => {
  const units = {}, topics = {};
  UNITS.filter(u => u.part === 'course').forEach(u => { units[u.id] = { value: 0.9, answered: 40 }; });
  units['unit-1'] = { value: 0.05, answered: 30 };
  TOPICS.forEach(t => { topics[t.id] = { value: t.unit === 'unit-1' ? 0.1 : 0.9, answered: 5 }; });
  const base = build(), p = build({ mastery: { units, topics } });
  assert.equal(p.personal, true);
  assert.ok(p.shares['unit-1'] > base.shares['unit-1'], 'weak unit share grows');
  assert.ok(p.slots['unit-1'] > base.slots['unit-1'], 'weak unit gets more sessions');
  const sum = Object.values(p.shares).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
  const weak = p.days.filter(d => d.kind === 'weak');
  assert.equal(weak[0].units[0], 'unit-1');
  assert.ok(weak[0].topics.length && weak[0].topics.every(t => t.startsWith('unit-1')), 'weakest topics listed');
  // Mastery with nothing answered is not personal.
  assert.equal(build({ mastery: { units: { 'unit-1': { value: 0, answered: 0 } }, topics: {} } }).personal, false);
});

test('FRQs prefer the day\'s units and do not repeat until all are used', () => {
  const p = build();
  const d1 = p.days.find(d => d.kind === 'study' && d.units.includes('unit-1'));
  assert.equal(d1.frq, 'f-a');
  const firstThree = p.days.filter(d => d.frq).slice(0, 3).map(d => d.frq);
  assert.equal(new Set(firstThree).size, 3);
  assert.equal(build({ frqs: [] }).days.find(d => d.kind === 'study').frq, null);
});
