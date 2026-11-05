/* LevlClassModel (assets/class/class-model.js, docs/teacher-classes.md): the student's summary of a course, mastery
   from it, where a student stands on each kind of assignment (practice, review, exam, free response, late, missing)
   and the class's most missed questions with the answers picked. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
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
  const lateNotAccepted = M.status({ ...a, late_until: null }, M.summarize('apbio', store(q), NOW), NOW);
  assert.equal(lateNotAccepted.state, 'missing', 'finished after the due date with no late window is missing');
  const firstDone = M.status({ ...a, id: 'x1' }, M.summarize('apbio', store(q, { levlprep_class_done_v1: JSON.stringify({ x1: NOW - 2 * DAY }) }), NOW), NOW);
  assert.equal(firstDone.late, false, 'done on time the first time; a redo after the due date is not lateness');
});

test('review status: the misses from before it opened, redone after', () => {
  const opens = NOW - 2 * DAY, a = { kind: 'review', spec: { topics: [], count: 25 }, opens_at: opens };
  const q = { 'bio-a-1': rec('a', 'unit-1', 0, 5), 'bio-a-2': { ...rec('a', 'unit-1', 1, 1, 2), c: 1 }, 'bio-a-3': rec('a', 'unit-1', 1, 6), 'bio-a-4': rec('a', 'unit-1', 1, 1), 'bio-a-5': rec('a', 'unit-1', 1, 1, 2) };
  const st = M.status(a, M.summarize('apbio', store(q), NOW), NOW);
  assert.equal(M.status(a, M.summarize('apbio', store({}), NOW), NOW).state, 'not', 'no answers at all is not done');
  assert.equal(M.status(a, M.summarize('apbio', store({ 'bio-a-9': rec('a', 'unit-1', 1, 9) }), NOW), NOW).state, 'done', 'answers but nothing to redo counts as done');
  assert.equal(st.total, 2, 'one miss still waiting, one redone; a first answer or an always-right repeat is not a review'); assert.equal(st.answered, 1); assert.equal(st.state, 'progress');
});

test('exam and free-response status read the course history', () => {
  const sum = M.summarize('apbio', store({}, { apbio_prefs_v1: JSON.stringify({ examHistory: [{ ts: NOW - DAY, kind: 'unit', unit: 'unit-1', mcq: { c: 6, n: 10 } }, { ts: NOW - DAY, kind: 'mixed', mcq: { c: 3, n: 5 } }], frqScores: { f1: { got: 4, of: 8, ts: NOW - DAY } } }) }), NOW);
  const ex = M.status({ kind: 'exam', spec: { unit: 'unit-1' }, opens_at: NOW - 2 * DAY }, sum, NOW);
  assert.equal(ex.state, 'done'); assert.equal(ex.score, 0.6);
  assert.equal(M.status({ kind: 'exam', spec: { unit: null }, opens_at: NOW - 2 * DAY }, sum, NOW).state, 'not', 'a unit test or a mixed quiz is not the full exam');
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
    if (c.frq !== false) assert.ok(readFileSync(c.dir + '/assets/frq/index.json', 'utf8').length > 2, k + ' FRQ index');
    if (c.bank) assert.ok(existsSync(c.bank), k + ' bank file');
    assert.ok(existsSync(c.dir + '/index.html') && existsSync(c.dir + '/practice.html') && existsSync(c.dir + '/review.html') && existsSync(c.dir + '/exams.html'), k + ' pages');
    // No AP® on a course that is not AP.
    if (c.ap === false) assert.doesNotMatch(c.name, /AP/, k);
  }
  assert.deepEqual([...M.ORDER.slice(-3)], ['nremt', 'ochem', 'anp']);
});

test('mastery status: every topic at the target with at least min answers since it opened (v2)', () => {
  const opens = NOW - 5 * DAY;
  const a = { kind: 'mastery', spec: { topics: ['a', 'b'], target: 0.8, min: 10 }, opens_at: opens, due_at: NOW + DAY };
  const q = {};
  for (let i = 0; i < 12; i++) q['bio-a-' + i] = rec('a', 'unit-1', 1, 0);
  const half = M.status(a, M.summarize('apbio', store(q), NOW), NOW, CUR);
  assert.equal(half.state, 'progress'); assert.equal(half.met, 1); assert.equal(half.total, 2);
  assert.equal(Math.round(half.mastery * 100), 50);
  for (let i = 0; i < 12; i++) q['bio-b-' + i] = rec('b', 'unit-1', 1, 0.5);
  const done = M.status(a, M.summarize('apbio', store(q), NOW), NOW, CUR);
  assert.equal(done.state, 'done'); assert.equal(done.late, false); assert.ok(done.since >= 10);
  // Mastery built before it opened counts, but the minimum answers must come after.
  const old = {};
  for (let i = 0; i < 12; i++) { old['bio-a-' + i] = rec('a', 'unit-1', 1, 6); old['bio-b-' + i] = rec('b', 'unit-1', 1, 6); }
  const before = M.status(a, M.summarize('apbio', store(old), NOW), NOW, CUR);
  assert.equal(before.met, 2); assert.equal(before.state, 'not', 'no answers since it opened');
  assert.equal(M.status(a, M.summarize('apbio', store({}), NOW), NOW + 2 * DAY, CUR).state, 'missing');
});

test('mastery: done when the target was first reached, and the same answer without the curriculum (spec.qn)', () => {
  const opens = NOW - 10 * DAY;
  const q = {};
  for (let i = 0; i < 12; i++) q['bio-a-' + i] = { ...rec('a', 'unit-1', 1, 0), seen: NOW - 5 * DAY + i * 60000 };
  for (let i = 0; i < 4; i++) q['bio-a-late' + i] = rec('a', 'unit-1', 1, 0.1);
  const sum = M.summarize('apbio', store(q), NOW);
  const a = { kind: 'mastery', spec: { topics: ['a'], target: 0.8, min: 10, qn: { a: 12 } }, opens_at: opens, due_at: NOW - 2 * DAY, late_until: null };
  const withCur = M.status(a, sum, NOW, CUR), noCur = M.status(a, sum, NOW);
  assert.equal(withCur.state, 'done', 'reached before the due date, so not missing because of later answers');
  const tenth = Math.round((NOW - 5 * DAY + 9 * 60000) / 1000) * 1000;
  assert.ok(withCur.doneAt <= NOW - 5 * DAY + 11 * 60000 && withCur.doneAt >= tenth, 'doneAt is when the target was reached');
  assert.deepEqual({ ...noCur }, { ...withCur }, 'spec.qn gives the same answer as the curriculum');
});

test('timed work: the attempt record decides, with time used and tab leaves (v2)', () => {
  const opens = NOW - 2 * DAY;
  const a = { id: 'x1', kind: 'practice', spec: { topics: ['a'], count: 3, controls: { timeLimit: 20 } }, opens_at: opens, due_at: NOW + DAY };
  const att = { x1: { start: NOW - DAY, end: NOW - DAY + 15 * 60000, n: 3, c: 2, tabs: 4, answers: { 'bio-a-1': 0 } } };
  const sum = M.summarize('apbio', store({}, { levlprep_class_att_v1: JSON.stringify(att) }), NOW);
  assert.equal(sum.att.x1.tabs, 4);
  const st = M.status(a, sum, NOW);
  assert.equal(st.state, 'done'); assert.equal(st.tabs, 4); assert.equal(st.used, 15 * 60000); assert.equal(Math.round(st.score * 3), 2);
  const going = M.status(a, M.summarize('apbio', store({}, { levlprep_class_att_v1: JSON.stringify({ x1: { start: NOW - 60000, n: 1, c: 1, tabs: 0 } }) }), NOW), NOW);
  assert.equal(going.state, 'progress'); assert.equal(going.answered, 1);
  // Without a time limit the attempt record is ignored and the answers decide.
  const plain = { ...a, spec: { topics: ['a'], count: 3 } };
  assert.equal(M.status(plain, sum, NOW).state, 'not');
});

/* ---- NREMT, organic chemistry and A&P (stream B): each course's own records, read into the same summary. ---- */
const stub = () => ({ window: {}, localStorage: { getItem: () => null, setItem() {} }, document: { addEventListener() {}, dispatchEvent() {} }, CustomEvent: function () {} });
function load(file, g) { const c = stub(); vm.runInNewContext(readFileSync(file, 'utf8'), c); return c.window[g]; }
const RAW = { anp: load('anatomy-physiology/assets/anp-curriculum.js', 'AnpCurriculum'), ochem: load('ochem/assets/curriculum.js', 'OchemCurriculum'),
              nremt: load('assets/class/nremt-map.js', 'LevlClassNremt') };
vm.runInNewContext(readFileSync('assets/class/nremt-map.js', 'utf8'), ctx);   // the student's page loads it first (COURSES.nremt.need)
const getter = (s) => (k) => (k in s ? s[k] : null);
const plain = (x) => JSON.parse(JSON.stringify(x));

test('curriculum adapters: units and topics with ids and titles for NREMT, ochem and A&P', () => {
  for (const k of ['nremt', 'ochem', 'anp']) {
    const cur = M.curriculum(k, RAW[k]), units = new Set(cur.units.map((u) => u.id)), ids = new Set();
    assert.ok(cur.units.length >= 6 && cur.topics.length >= 20, k + ' has units and topics');
    for (const u of cur.units) { assert.ok(u.id && u.title, k + ' unit'); assert.equal(u.part, undefined, k + ' no skills tracks'); }
    for (const t of cur.topics) { assert.ok(t.id && t.title && units.has(t.unit), k + ' topic ' + t.id); assert.ok(!ids.has(t.id), k + ' unique ' + t.id); ids.add(t.id); }
  }
  const anp = M.curriculum('anp', RAW.anp);
  assert.equal(anp.units[0].n, 1); assert.equal(anp.topics[0].unit, RAW.anp.topics[0].chapter); assert.equal(anp.topics[0].qn, RAW.anp.topics[0].qn);
  assert.equal(M.curriculum('ochem', RAW.ochem).units.length, RAW.ochem.MODULES.length);
  assert.equal(M.curriculum('nremt', RAW.nremt).units.length, 6, 'the six topic areas');
});

test('the NREMT map is up to date with the bank and decodes to each question’s topic area', async () => {
  const { buildNremtMap, render } = await import('../build-class-maps.mjs');
  const bank = JSON.parse(readFileSync('nremt/assets/questions.json', 'utf8'));
  assert.equal(readFileSync('assets/class/nremt-map.js', 'utf8'), render(buildNremtMap(bank)), 'run node scripts/build-class-maps.mjs');
  const q = bank.find((x) => x.system === 'Trauma' && x.topic === 'Bleeding & Shock');
  const sum = M.summarize('nremt', getter({ nremt_mastery: JSON.stringify({ [q.id]: { level: 1, timesCorrect: 1, timesWrong: 0, lastSeen: NOW } }) }), NOW);
  assert.deepEqual(plain(sum.items[q.id]).slice(0, 2), ['bleeding-shock', 'trauma']);
});

// Real ids: the first NREMT questions in two topics.
const NB = JSON.parse(readFileSync('nremt/assets/questions-core.json', 'utf8'));
const nid = (topic, i = 0) => NB.filter((x) => x.topic === topic && !x.type)[i].id;
test('NREMT reader: nremt_mastery, picks, flags, both exam histories and lessons', () => {
  const c1 = nid('Cardiac'), c2 = nid('Cardiac', 1), p1 = nid('Pharmacology');
  const s = { nremt_mastery: JSON.stringify({
                [c1]: { level: 2, timesCorrect: 2, timesWrong: 0, lastSeen: NOW - DAY },
                [c2]: { level: 0, timesCorrect: 1, timesWrong: 2, lastSeen: NOW - 2 * DAY },
                [p1]: { level: 1, timesCorrect: 1, timesWrong: 1, lastSeen: NOW - 3 * DAY },
                99999: { level: 0, timesCorrect: 0, timesWrong: 0, lastSeen: 0 } }),
              nremt_picks_v1: JSON.stringify({ [c2]: 3, 4242: 1 }), nremt_exam100_flagged: JSON.stringify([c2]),
              nremt_exam100_history: JSON.stringify([{ score: 71, total: 100, timeMs: 1, date: NOW - 5 * DAY, domainStats: {} }]),
              nremt_cat_history: JSON.stringify([{ date: NOW - 6 * DAY, n: 80, right: 50, pass: true }]),
              nremt_lessons_v1: JSON.stringify({ airway: NOW, shock: NOW }) };
  const sum = M.summarize('nremt', getter(s), NOW);
  assert.deepEqual(Object.keys(sum.items).sort(), [c1, c2, p1].map(String).sort(), 'answered only');
  assert.deepEqual(plain(sum.items[c2]), ['cardiac', 'cardiac-medical', 3, 1, 0, Math.round((NOW - 2 * DAY) / 1000), sum.items[c2][6]], 'missed last: level 0');
  assert.equal(sum.items[p1][4], 1, 'right last: level above 0');
  assert.deepEqual(plain(sum.picks), { [c2]: 3 }); assert.deepEqual(Object.keys(sum.flags), [String(c2)]);
  assert.deepEqual(plain(sum.exams.map((x) => [x.label, x.kind, x.c, x.n])), [['Adaptive exam', 'full', 50, 80], ['Timed exam', 'full', 71, 100]], 'oldest first');
  assert.equal(sum.lessons, 2);
  const cur = M.curriculum('nremt', RAW.nremt);
  const tm = M.topicMastery(sum, cur, NOW);
  assert.ok(tm.cardiac.value > 0 && tm.cardiac.wrong === 1);
  assert.equal(M.status({ kind: 'exam', spec: { unit: null }, opens_at: NOW - 7 * DAY }, sum, NOW).state, 'done', 'a full exam assignment');
  assert.equal(M.status({ kind: 'practice', spec: { topics: ['cardiac'], count: 2 }, opens_at: NOW - 3 * DAY }, sum, NOW).state, 'done');
  assert.equal(M.status({ kind: 'review', spec: { topics: ['cardiac'] }, opens_at: NOW - 10 * DAY }, sum, NOW).answered, 1, 'missed and redone');
});

test('ochem reader: ochem_items_v1, older misses from the mastery store, chapter tests as unit tests', () => {
  const cur = M.curriculum('ochem', RAW.ochem), sn = cur.topics.find((t) => t.id === 'sn2'), ch = sn.unit;
  const s = { ochem_items_v1: JSON.stringify({ v: 1, q: { 'lb:sn2:0': { t: 'sn2', n: 2, c: 1, right: 1, seen: NOW - DAY, l: 'p' }, 'sn2-click-nuc': { t: 'sn2', n: 1, c: 0, right: 0, seen: NOW - 2 * DAY, l: 'r' } } }),
              ochem_mastery_v1: JSON.stringify({ v: 1, concepts: {}, sessions: [], mistakes: [
                { qid: 'lb:sn2:4', topicId: 'sn2', tier: 3, ts: NOW - 9 * DAY, fixed: false },
                { qid: 'lb:sn2:5', topicId: 'sn2', tier: 1, ts: NOW - 9 * DAY, fixed: true, fixedTs: NOW - 4 * DAY },
                { qid: 'lb:sn2:0', topicId: 'sn2', tier: 2, ts: NOW - 30 * DAY, fixed: true } ] }),
              ochem_picks_v1: JSON.stringify({ 'lb:sn2:0': 2 }), ochem_flagged_v1: JSON.stringify({ 'lb:sn2:4': NOW }),
              ochem_exam_history_v1: JSON.stringify([{ ts: NOW - 2 * DAY, kind: 'chapter', label: 'Chapter test', right: 15, total: 20, answered: 20, chapters: [[ch, 15, 20]] },
                                                     { ts: NOW - 3 * DAY, kind: 'final', label: 'Cumulative final', right: 30, total: 50, answered: 50, chapters: [] }]),
              ochem_progress: JSON.stringify({ sn2: { completed: true, bestScore: 80 }, e2: { completed: false } }) };
  const sum = M.summarize('ochem', getter(s), NOW, { cur });
  assert.deepEqual(plain(sum.items['lb:sn2:0']).slice(0, 5), ['sn2', ch, 2, 1, 1], 'the item store wins over an old mistake');
  assert.deepEqual(plain(sum.items['lb:sn2:4']).slice(0, 5), ['sn2', ch, 1, 0, 0]); assert.equal(sum.items['lb:sn2:4'][6], 'a', 'tier 3 is applying');
  assert.deepEqual(plain(sum.items['lb:sn2:5']).slice(2, 5), [2, 1, 1], 'a fixed miss: missed, then right');
  assert.equal(sum.picks['lb:sn2:0'], 2); assert.ok(sum.flags['lb:sn2:4']); assert.equal(sum.lessons, 1);
  assert.deepEqual(plain(sum.exams.map((x) => [x.kind, x.unit])), [['full', null], ['chapter', ch]]);
  assert.equal(M.status({ kind: 'exam', spec: { unit: ch }, opens_at: NOW - 5 * DAY }, sum, NOW).score, 0.75);
  assert.equal(M.status({ kind: 'exam', spec: { unit: null }, opens_at: NOW - 5 * DAY }, sum, NOW).state, 'done');
  // Without opts.cur the page's own curriculum (window.OchemCurriculum) gives the unit, as on the student's page.
  ctx.window.OchemCurriculum = RAW.ochem;
  assert.equal(M.summarize('ochem', getter(s), NOW).items['lb:sn2:4'][1], ch);
});

test('A&P reader: anp_progress_v1 without units, picks, flags, and the exam history exams.js writes', () => {
  const cur = M.curriculum('anp', RAW.anp), t0 = cur.topics.find((t) => t.unit === 'blood');
  const rec = (right, d, n = 1) => ({ t: t0.id, k: [], l: 'r', d: 1, n, c: right ? n : 0, right: right ? 1 : 0, seen: NOW - d * DAY, due: 0, ivl: 0, ease: 2.3, lapses: 0, src: 'q' });
  const s = { anp_progress_v1: JSON.stringify({ v: 1, q: { 'anp-blood-composition-1': rec(1, 1), 'anp-blood-composition-2': rec(0, 2) }, lessons: { [t0.id]: NOW }, tools: {}, updated: NOW }),
              anp_picks_v1: JSON.stringify({ 'anp-blood-composition-2': 0 }), anp_flagged_v1: JSON.stringify({ 'anp-blood-composition-2': NOW }),
              anp_prefs_v1: JSON.stringify({ examTiming: 'std', examHistory: [
                { ts: NOW - DAY, kind: 'unit', label: 'Unit quiz: Blood', unit: 'blood', partial: true, mcq: { c: 9, n: 15 } },
                { ts: NOW - DAY / 2, kind: 'system', label: 'System exam: Blood', unit: 'blood', partial: false, mcq: { c: 30, n: 40 } },
                { ts: NOW - DAY / 3, kind: 'full', label: 'A&P II cumulative final', unit: null, partial: false, mcq: { c: 40, n: 50 } }] }) };
  const sum = M.summarize('anp', getter(s), NOW, { cur });
  assert.deepEqual(plain(sum.items['anp-blood-composition-2']).slice(0, 5), [t0.id, 'blood', 1, 0, 0]);
  assert.equal(sum.items['anp-blood-composition-1'][6], 'r'); assert.equal(sum.picks['anp-blood-composition-2'], 0); assert.equal(sum.lessons, 1);
  assert.equal(M.status({ kind: 'exam', spec: { unit: 'blood' }, opens_at: NOW - 2 * DAY }, sum, NOW).score, 0.75, 'the system exam, not the partial quiz');
  assert.equal(M.status({ kind: 'exam', spec: {}, opens_at: NOW - 2 * DAY }, sum, NOW).score, 0.8, 'the cumulative final is the full exam');
  assert.equal(M.overall(M.topicMastery(sum, cur, NOW), cur) > 0, true);
});

test('links: each course’s real practice, review and exam pages with the parameters they read', () => {
  const pr = (topics, extra = {}) => ({ kind: 'practice', spec: { topics, count: 10, ...extra } });
  assert.equal(M.href('apbio', pr(['t1'])), 'practice.html?topic=t1');
  assert.equal(M.href('apbio', { kind: 'exam', spec: { unit: 'unit-3' } }), 'exams.html?unit=unit-3');
  assert.equal(M.href('anp', pr(['blood-composition'])), 'practice.html?topic=blood-composition');
  assert.equal(M.href('anp', { kind: 'exam', spec: { unit: 'blood' } }), 'exams.html?mode=system&chapter=blood');
  assert.equal(M.href('anp', { kind: 'exam', spec: {} }), 'exams.html?mode=final');
  assert.equal(M.href('ochem', pr(['sn2'])), 'practice.html?topic=sn2&count=10');
  assert.equal(M.href('ochem', { kind: 'review', spec: {} }), 'practice.html?mode=mistakes');
  assert.equal(M.href('ochem', { kind: 'exam', spec: { unit: 'substitution-elimination' } }), 'exams.html?kind=chapter&chapter=substitution-elimination');
  assert.equal(M.href('ochem', { kind: 'exam', spec: {} }), 'exams.html?kind=final');
  assert.equal(M.href('nremt', pr(['pharmacology'])), 'practice.html?system=' + encodeURIComponent('Cardiac & Medical'), 'the topic area drill');
  assert.equal(M.href('nremt', { kind: 'review', spec: {} }), 'review.html?start=review');
  assert.equal(M.href('nremt', { kind: 'exam', spec: {} }), 'exams.html');
  // The pages really read those parameters.
  assert.match(readFileSync('anatomy-physiology/assets/apps/practice.js', 'utf8'), /p\.get\('topic'\)/);
  assert.match(readFileSync('anatomy-physiology/assets/apps/exams.js', 'utf8'), /p\.get\('chapter'\)[\s\S]*p\.get\('mode'\)/);
  assert.match(readFileSync('ochem/assets/practice-page.js', 'utf8'), /params\.topic[\s\S]*'mistakes'/);
  assert.match(readFileSync('ochem/assets/exams-page.js', 'utf8'), /p\.get\('kind'\)[\s\S]*p\.get\('chapter'\)/);
  assert.match(readFileSync('nremt/practice-engine.js', 'utf8'), /params\.get\('system'\)[\s\S]*review: loadMissed/);
  for (const u of RAW.nremt.units) assert.ok(readFileSync('nremt/practice.html', 'utf8').includes('value="system:' + u.system.replace(/&/g, '&amp;') + '"'), u.system);
});

test('the teacher page reads each new course’s bank with the ids its records use', () => {
  const nb = M.bankItems('nremt', NB), n0 = nb.find((x) => x.id === String(nid('Cardiac')));
  assert.equal(n0.type, 'single'); assert.equal(n0.topic, 'cardiac'); assert.equal(M.bankUrl('nremt', 'trauma'), '/nremt/assets/questions-core.json');
  const ob = M.bankItems('ochem', JSON.parse(readFileSync('ochem/assets/practice-bank-core.json', 'utf8')));
  assert.ok(ob.find((x) => x.id === 'lb:sn2:0' && x.type === 'single' && x.options.length > 1), 'ids as question-engine.js makes them');
  assert.match(readFileSync('ochem/assets/question-engine.js', 'utf8'), /id: 'lb:' \+ topicId \+ ':' \+ index/);
  const ab = M.bankItems('anp', JSON.parse(readFileSync('anatomy-physiology/assets/bank/blood.json', 'utf8')));
  assert.ok(ab.length > 10 && ab[0].id.startsWith('anp-blood')); assert.equal(M.bankUrl('anp', 'blood'), '/anatomy-physiology/assets/bank/blood.json');
  assert.equal(M.whyUrl('nremt', 'x'), null); assert.equal(M.whyUrl('anp', 'blood'), '/anatomy-physiology/assets/bank/blood-why.json');
});

test('answer-pick hooks: one line where each course records an answer', () => {
  assert.match(readFileSync('anatomy-physiology/assets/anp-questions.js', 'utf8'), /'anp' \+ '_picks_v1'/);
  assert.match(readFileSync('anatomy-physiology/assets/apps/exams.js', 'utf8'), /anp_picks_v1[\s\S]*setPref\('examHistory'/);
  const nr = readFileSync('nremt/practice-engine.js', 'utf8');
  assert.match(nr, /function updateMastery\(qIdx, correct, ans\)[\s\S]*nremt_picks_v1[\s\S]*nremt:progress/);
  assert.match(nr, /updateMastery\(qIdx, correct, answers\[i\]\)/); assert.match(nr, /updateMastery\(qIdx, correct, answers\[current\]\)/);
  assert.match(readFileSync('ochem/assets/diagnostic-engine.js', 'utf8'), /ochem_items_v1[\s\S]*ochem_picks_v1[\s\S]*noteItem\(q, d\.correct, response, tier\)/);
  assert.match(readFileSync('assets/site-chrome.js', 'utf8'), /\|nremt\|ochem\|anatomy-physiology\)/);
});
