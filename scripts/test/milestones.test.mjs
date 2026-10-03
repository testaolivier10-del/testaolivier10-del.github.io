/* assets/milestones.js — what counts as finishing a chapter, a course, or
   the NREMT exam milestone.

   A certificate is printed from these answers, so both directions are
   expensive: one earned too easily is a document that says something false,
   and one that never arrives is a promise the dashboard made and broke. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

function load(){
  const b = createBrowser();
  b.load('assets/milestones.js');
  return { b, M: b.window.LevlMilestones };
}

const CHAPTERS = [
  { id: 'a', title: 'Alpha', lessons: ['a1', 'a2'] },
  { id: 'b', title: 'Beta', lessons: ['b1'] },
];

test('a chapter is complete only when every lesson in it is', () => {
  const { M } = load();
  const r = M.evaluate(CHAPTERS, { a1: 100 });
  assert.equal(r[1].id, 'ch-a');
  assert.equal(r[1].earned, false);
  assert.equal(r[1].done, 1);
  assert.equal(M.evaluate(CHAPTERS, { a1: 100, a2: 200 })[1].earned, true);
});

test('the course is complete only when every chapter is', () => {
  const { M } = load();
  assert.equal(M.evaluate(CHAPTERS, { a1: 1, a2: 2 })[0].earned, false);
  const all = M.evaluate(CHAPTERS, { a1: 1, a2: 2, b1: 3 });
  assert.equal(all[0].id, 'course');
  assert.equal(all[0].earned, true);
  assert.equal(all[0].done, 2);
});

test('a chapter with nothing in it is never complete, and neither is an empty course', () => {
  const { M } = load();
  const r = M.evaluate([{ id: 'x', title: 'X', lessons: [] }], {});
  assert.equal(r[1].earned, false);
  assert.equal(r[0].earned, false);
  assert.equal(M.evaluate([], {})[0].earned, false);
});

test('the date earned is the last lesson that finished it, when every lesson has one', () => {
  const { M } = load();
  const r = M.evaluate(CHAPTERS, { a1: 500, a2: 300, b1: 900 });
  assert.equal(r[1].date, 500);
  assert.equal(r[2].date, 900);
  assert.equal(r[0].date, 900);
  // ochem keeps no dates: completion still counts, the date is left to the store.
  const u = M.evaluate(CHAPTERS, { a1: true, a2: 300 });
  assert.equal(u[1].earned, true);
  assert.equal(u[1].date, null);
});

test('NREMT: a full exam at 80% or more earns it, dated by the first such exam', () => {
  const { M } = load();
  const hist = [
    { score: 79, total: 100, date: 10 },
    { score: 80, total: 100, date: 20 },
    { score: 91, total: 100, date: 30 },
  ];
  const [m] = M.nremtExam(hist, { score: 91, total: 100 });
  assert.equal(m.earned, true);
  assert.equal(m.date, 20);
  assert.equal(m.best, 91);
});

test('NREMT: 79%, or a short set at 100%, does not', () => {
  const { M } = load();
  assert.equal(M.nremtExam([{ score: 79, total: 100, date: 1 }], { score: 79, total: 100 })[0].earned, false);
  assert.equal(M.nremtExam([{ score: 20, total: 20, date: 1 }], { score: 20, total: 20 })[0].earned, false);
  assert.equal(M.nremtExam([], null)[0].earned, false);
});

test('NREMT: an attempt that has aged out of the history still counts, without a date', () => {
  const { M } = load();
  const [m] = M.nremtExam([{ score: 60, total: 100, date: 5 }], { score: 85, total: 100 });
  assert.equal(m.earned, true);
  assert.equal(m.date, null);
});

test('A&P: built topics only, read from anp_progress_v1, first sighting recorded once', () => {
  const { b, M } = load();
  b.window.AnpCurriculum = {
    chapters: [{ id: 'cells', title: 'Cells' }, { id: 'tissues', title: 'Tissues' }],
    topics: [
      { id: 't1', chapter: 'cells', built: true },
      { id: 't2', chapter: 'cells', built: true },
      { id: 't3', chapter: 'cells', built: false },
      { id: 't4', chapter: 'tissues', built: true },
    ],
  };
  b.localStorage.setItem('anp_progress_v1', JSON.stringify({ v: 1, q: {}, lessons: { t1: 100, t2: 200 } }));
  const first = M.list('anp');
  const cells = first.find(m => m.id === 'ch-cells');
  assert.equal(cells.earned, true);
  assert.equal(cells.date, 200);
  assert.equal(first.fresh.map(m => m.id).join(','), 'ch-cells');
  // Listing it again (the dashboard redraws on every progress write) does not
  // use it up: only the lesson's own check() does, so it is still celebrated.
  assert.equal(M.list('anp').fresh.length, 1);
  M.markSeen('anp', first.fresh);
  assert.equal(M.list('anp').fresh.length, 0);
  assert.equal(M.list('anp').find(m => m.id === 'ch-cells').date, 200);
  // Progress gone, milestone gone: the certificate re-checks, it does not remember.
  b.localStorage.setItem('anp_progress_v1', JSON.stringify({ v: 1, q: {}, lessons: {} }));
  assert.equal(M.find('anp', 'ch-cells').earned, false);
});

test('ochem: a finished run counts and survives a redo; a notes-only topic holds its chapter open', () => {
  const { b, M } = load();
  b.window.OchemCurriculum = {
    MODULES: [
      { id: 'm1', title: 'One', topics: [{ id: 'x', href: 'x' }, { id: 'y', href: 'y' }] },
      { id: 'm2', title: 'Two', topics: [{ id: 'z', href: 'z', notesOnly: true }] },
    ],
    hasLesson: t => !!(t && t.href && !t.notesOnly),
  };
  // y is mid-redo: completed was reset, bestScore was not.
  b.localStorage.setItem('ochem_progress', JSON.stringify({
    x: { completed: true, bestScore: 90 }, y: { completed: false, bestScore: 40 }, z: { completed: true, bestScore: 100 },
  }));
  const r = M.list('ochem');
  const one = r.find(m => m.id === 'ch-m1');
  assert.equal(one.earned, true);
  // Undated progress takes the day it was first seen.
  assert.equal(one.date, b.now());
  assert.equal(r.find(m => m.id === 'ch-m2').earned, false);
  assert.equal(r.find(m => m.id === 'course').earned, false);
});

test('certificate wording never claims to be a credential', () => {
  const { M } = load();
  const m = { kind: 'exam', id: 'exam-80' };
  for (const s of [M.statement(m, 'nremt'), M.shareText(m, 'nremt'), M.heading(m, 'nremt')]) {
    assert.doesNotMatch(s, /certified|passed|official|licen[cs]e/i);
  }
  assert.equal(M.certUrl('anp', 'ch-cells'), '/certificate.html?course=anp&m=ch-cells');
});
