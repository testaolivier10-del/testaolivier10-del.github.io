/* ochem/assets/question-engine.js — no question from a topic the student has
   not reached.

   The owner's rule: every normal practice mode stays inside the student's
   frontier (every topic up to and including the next unfinished lesson), and
   only Cumulative review mixes topics on purpose, and then only finished
   ones. The failure is silent: a concept's questions span the whole course,
   so an unbounded pick hands a first-week student a carbonyl question and
   nothing throws. Before the bound, about 90% of a new student's adaptive
   picks came from topics they had not reached.

   Runs the real engine against both real banks (interactive-bank.js and the
   legacy practice bank) at three frontiers. The engine samples at random, so
   each mode is exercised many times and every pick is checked. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBrowser } from './harness.mjs';

const core = JSON.parse(readFileSync('ochem/assets/practice-bank-core.json', 'utf8'));

function boot(){
  const b = createBrowser();
  // legacy-rules.js registers itself on the object legacy-diagnosis.js makes.
  for (const f of ['curriculum.js', 'concepts.js', 'interactive-bank.js', 'mastery-engine.js',
                   'legacy-diagnosis.js', 'legacy-rules.js', 'question-engine.js']) {
    b.load('ochem/assets/' + f);
  }
  b.window.OchemPracticeBank = core;
  b.window.OchemPracticeWhy = {};
  b.window.OchemQuestionEngine.invalidate();
  return b;
}

/* A student who has finished the first `done` lessons in path order, with
   answers on every concept met in them (a third of those weak), then twelve
   days away so some are due for review. */
function student(done){
  const b = boot();
  const CU = b.window.OchemCurriculum, M = b.window.OchemMastery, E = b.window.OchemQuestionEngine;
  const order = CU.MODULES.flatMap(m => m.topics);
  const at = Object.fromEntries(order.map((t, i) => [t.id, i]));
  const lessons = order.filter(t => CU.hasLesson(t));
  if (done < 0) done = lessons.length + done;
  const progress = {};
  lessons.slice(0, done).forEach(t => {
    progress[t.id] = { step: 0, correct: 8, attempts: 10, completed: true, bestScore: 80 };
  });
  b.localStorage.setItem('ochem_progress', JSON.stringify(progress));

  const last = done ? at[lessons[done - 1].id] : -1;
  const frontier = lessons[done] ? at[lessons[done].id] : Infinity;
  const met = new Set();
  E.all().forEach(q => { if (at[q.topic] <= last) q.concepts.forEach(c => met.add(c)); });
  let k = 0;
  for (const c of met) {
    const weak = k++ % 3 === 0;
    for (let i = 0; i < 4; i++) M.record(c, weak ? i === 0 : i !== 1, { tier: 2 });
  }
  b.advanceDays(12);
  return { b, E, M, at, frontier, completed: last >= 0 ? last : frontier };
}

function serve(E, plan, n){
  const S = { askedIds: [], recentTopics: [], recentConcepts: [], recentKinds: [] };
  const out = [];
  for (let i = 0; i < n; i++) {
    const q = E.next(plan, S);
    if (!q) break;
    S.askedIds.push(q.id); S.recentTopics.unshift(q.topic); S.recentKinds.unshift(q.kind);
    out.push(q);
  }
  return out;
}

function assertWithin(qs, at, bound, what){
  for (const q of qs) {
    assert.ok(at[q.topic] <= bound,
      `${what}: served ${q.id} from ${q.topic} (#${at[q.topic]}), past #${bound}`);
  }
}

const STUDENTS = [['a new student', 0], ['a student partway through', 20], ['a student near the end', -5]];

for (const [who, done] of STUDENTS) {
  test(`${who}: adaptive, quick, diagnostic and weak drills stay inside the frontier`, () => {
    const { E, M, at, frontier } = student(done);
    const served = [];
    for (let r = 0; r < 12; r++) {
      served.push(...serve(E, E.makePlan('adaptive', { count: 10 }), 10));
      served.push(...serve(E, E.makePlan('quick', {}), 5));
      for (const rec of E.recommendations()) {
        if (rec.plan && (rec.key === 'diagnostic' || rec.key === 'weak' || rec.key === 'adaptive')) {
          served.push(...serve(E, rec.plan, 8));
        }
      }
    }
    M.weakest(6, 2).forEach(p => served.push(...serve(E, E.makePlan('weak', { concepts: [p.id] }), 8)));
    assert.ok(served.length > 100, 'the modes should actually serve questions');
    assertWithin(served, at, frontier, who);
  });

  test(`${who}: spaced review stays inside the frontier`, () => {
    const { E, at, frontier } = student(done);
    const picks = [];
    for (let r = 0; r < 4; r++) {
      E.reviewQueue().today.forEach(p => { const q = E.reviewQuestion(p.id, 2, [], []); if (q) picks.push(q); });
    }
    if (done) assert.ok(picks.length, 'a student with history has something due');
    assertWithin(picks, at, frontier, 'review');
  });

  test(`${who}: cumulative review never passes the last completed topic`, () => {
    const { E, at, completed } = student(done);
    const plan = E.makePlan('cumulative', { count: 10 });
    assert.equal(plan.label, 'Cumulative review');
    const served = [];
    for (let r = 0; r < 20; r++) served.push(...serve(E, plan, 10));
    assert.ok(served.length, 'cumulative review should serve questions');
    assertWithin(served, at, completed, 'cumulative');
    // The old name still resolves to the same bounded mode, for old links.
    const old = E.makePlan('mixed', { count: 10 });
    assert.equal(old.mode, 'cumulative');
    assertWithin(serve(E, old, 10), at, completed, 'mixed alias');
  });

  test(`${who}: a Check never passes the missed question's topic`, () => {
    const { E, at, frontier } = student(done);
    // Every reached question as the miss, as a topic drill would serve it,
    // checked on its primary concept and on every authored diagnosis.
    const misses = E.all().filter(q => at[q.topic] <= frontier);
    let checks = 0;
    for (const q of misses) {
      const concepts = new Set([E.primaryConcept(q)]);
      Object.values(q.diag || {}).forEach(d => d && d.concept && concepts.add(d.concept));
      for (const c of concepts) {
        const x = E.checkQuestion(c, q.tier || 2, [q.id], q.kind, q.topic);
        if (!x) continue;
        checks++;
        assert.ok(at[x.topic] <= at[q.topic],
          `check for ${q.id} (${q.topic}) was ${x.id} from later topic ${x.topic}`);
      }
    }
    assert.ok(checks > 0, 'some misses should earn a Check');
  });
}

test('a lesson finished out of order counts as reached', () => {
  const { b, E, at } = student(0);
  const CU = b.window.OchemCurriculum;
  const later = CU.MODULES.flatMap(m => m.topics).filter(t => CU.hasLesson(t))[30];
  CU.completeLessonRun(later.id);
  const plan = E.makePlan('cumulative', { count: 10 });
  assert.equal(plan.maxTopicIndex, at[later.id]);
  assert.equal(E.makePlan('adaptive', {}).maxTopicIndex, at[later.id]);
});
