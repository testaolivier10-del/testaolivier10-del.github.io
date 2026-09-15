/* ochem/assets/curriculum.js — the course map, and the arithmetic behind every
   mastery percentage the ochem section shows.

   Worth testing because the failure mode is a number that is wrong in the
   flattering direction and never throws. A topic with written notes but no
   interactive lesson cannot be scored; leaving those topics out of the
   denominator is what let a chapter report 100% mastered while containing a
   section nothing had ever measured. That is a lie about the course, and the
   only thing standing between it and a student is this arithmetic.

   scripts/check-curriculum.mjs asserts the same property against the REAL
   curriculum, so the guarantee holds as topics are added. These tests pin the
   behavior itself, including the cases the real curriculum does not currently
   contain (a fully tracked chapter, a chapter that is entirely notes). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

let store = null;

function fresh(){
  const b = createBrowser();
  b.load('ochem/assets/curriculum.js');
  store = b.localStorage;
  return { b, C: b.window.OchemCurriculum };
}

/* A completed run scoring `pct`, written straight into the store in the shape
   completeLessonRun leaves behind — so a test can set up a hundred finished
   lessons without walking each one through its questions. */
function score(_C, topicId, pct){
  const p = JSON.parse(store.getItem('ochem_progress') || '{}');
  p[topicId] = { step: 0, correct: 1, attempts: 1, completed: true, bestScore: pct };
  store.setItem('ochem_progress', JSON.stringify(p));
}

test('hasLesson distinguishes a lesson from a notes page, and href alone does not', () => {
  const { C } = fresh();
  assert.equal(C.hasLesson({ href: 'lessons/resonance.html' }), true);
  assert.equal(C.hasLesson({ href: 'mechanisms/sn2.html' }), true);
  // The case the whole design turns on: a notes-only topic HAS an href — it is
  // never a dead link — but it is not a lesson.
  assert.equal(C.hasLesson({ href: 'notes/skeletal-structures.html', notesOnly: true }), false);
  assert.equal(C.hasLesson({ href: null }), false);
  assert.equal(C.hasLesson(null), false);
});

test('every topic in the real curriculum is reachable, and notes-only ones are flagged', () => {
  const { C } = fresh();
  const topics = C.MODULES.flatMap(m => m.topics);
  assert.ok(topics.length > 0);
  for(const t of topics){
    assert.ok(t.href, `${t.id} must point somewhere — a topic is never a dead link`);
    assert.equal(t.href.startsWith('notes/'), !!t.notesOnly,
      `${t.id}: pointing at notes/ and being flagged notesOnly must agree`);
  }
});

test('masteryCoverage counts the whole course, and what of it can be scored', () => {
  const { C } = fresh();
  const all = C.masteryCoverage();
  const topics = C.MODULES.flatMap(m => m.topics);
  assert.equal(all.total, topics.length);
  assert.equal(all.tracked + all.untracked, all.total);
  assert.equal(all.untracked, C.untrackedTopics().length);
  assert.equal(all.tracked, topics.filter(t => C.hasLesson(t)).length);
});

test('a chapter with an untracked section cannot report 100%, even scored perfectly', () => {
  const { C } = fresh();
  const mod = C.MODULES.find(m => C.masteryCoverage(m).untracked > 0);
  assert.ok(mod, 'expected at least one chapter with a notes-only section');

  mod.topics.filter(t => C.hasLesson(t)).forEach(t => score(C, t.id, 100));
  const pct = C.moduleMastery(mod);
  assert.ok(pct < 100, `perfect scores still read ${pct}%, which must be under 100`);

  // And it is under 100 by exactly the untracked share, not some softer fudge:
  // n perfect scores over (n + untracked) topics.
  const n = mod.topics.filter(t => C.hasLesson(t)).length;
  const untracked = C.masteryCoverage(mod).untracked;
  assert.equal(pct, Math.round((100 * n) / (n + untracked)));
});

test('overall mastery cannot reach 100 while any topic is untracked', () => {
  const { C } = fresh();
  C.MODULES.flatMap(m => m.topics).filter(t => C.hasLesson(t)).forEach(t => score(C, t.id, 100));
  const overall = C.overallMastery();
  assert.ok(overall !== null);
  assert.ok(overall < 100, `a perfect run reads ${overall}%, which must be under 100 while topics are untracked`);
});

test('a fully tracked chapter still reaches 100 — the ceiling is the gap, not a permanent tax', () => {
  const { C } = fresh();
  const mod = C.MODULES.find(m => C.masteryCoverage(m).untracked === 0);
  assert.ok(mod, 'expected at least one chapter where every section has a lesson');
  mod.topics.forEach(t => score(C, t.id, 100));
  assert.equal(C.moduleMastery(mod), 100);
});

test('"not started" and "scored zero" stay different answers', () => {
  const { C } = fresh();
  const mod = C.MODULES[0];
  // Nothing attempted at all: null, not 0%. A blank slate is not a failure.
  assert.equal(C.moduleMastery(mod), null);
  assert.equal(C.overallMastery(), null);
  assert.equal(C.topicMastery(mod.topics[0].id), null);

  score(C, mod.topics[0].id, 0);
  assert.equal(C.topicMastery(mod.topics[0].id), 0);
  assert.equal(C.moduleMastery(mod), 0);
});

test('bestScore only ever moves up, so a bad retry cannot erase a good run', () => {
  const { C } = fresh();
  const id = C.MODULES[0].topics[0].id;

  C.beginLessonRun(id, 4);
  C.recordAttempt(id, true); C.recordAttempt(id, true);
  C.completeLessonRun(id);
  assert.equal(C.topicMastery(id), 100);

  C.beginLessonRun(id, 4);                  // deliberate redo, goes badly
  C.recordAttempt(id, false); C.recordAttempt(id, true);
  C.completeLessonRun(id);
  assert.equal(C.topicMastery(id), 100, 'a worse retry must not lower the best-ever score');
});
