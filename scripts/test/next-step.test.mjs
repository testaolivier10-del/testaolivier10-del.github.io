/* assets/next-step.js — the order the end-of-session step is picked in.

   The order is the feature. Due work first, because it is the only option
   that gets worse by waiting; then the course path; then the weakest area;
   then home, so no end screen is ever a dead end. A tier that silently stops
   firing does not throw — the student just gets "Back to home" after a
   session that left forty items due, and nobody finds out. So each tier is
   pinned against the one below it, for each course, with the course's real
   curriculum loaded where the picker reads one. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const DAY = 86400000;

function fresh(){
  const b = createBrowser();
  b.load('assets/next-step.js');
  return b;
}

/* ---- NREMT: localStorage only, as on the flashcard and scenario pages ---- */

test('nremt: due questions come first, counted the way the Review page counts them', () => {
  const b = fresh();
  const now = b.now();
  b.localStorage.setItem('nremt_mastery', JSON.stringify({
    1: { level: 0, lastSeen: now },              // missed: due
    2: { level: 5, lastSeen: now },              // mastered, fresh: not due
    3: { level: 5, lastSeen: now - 9 * DAY },    // mastered, decayed two levels: due
  }));
  b.localStorage.setItem('nremt_domain_stats_all', JSON.stringify({ Trauma: { correct: 2, total: 20 } }));
  const p = b.window.LevlNext.pick('nremt', {});
  assert.equal(p.kind, 'review');
  assert.equal(p.label, 'Review 2 due questions');
  assert.equal(p.href, '/nremt/review.html?start=spaced');
});

test('nremt: right after a review the queue is skipped, and the weakest domain with ten answers is drilled', () => {
  const b = fresh();
  b.localStorage.setItem('nremt_mastery', JSON.stringify({ 1: { level: 0, lastSeen: b.now() } }));
  b.localStorage.setItem('nremt_domain_stats_all', JSON.stringify({
    Trauma: { correct: 14, total: 20 },
    Assessment: { correct: 1, total: 4 },          // worse, but too little evidence to name
    'Airway & Respiratory': { correct: 10, total: 20 },
  }));
  const p = b.window.LevlNext.pick('nremt', { skip: ['review'] });
  assert.equal(p.kind, 'drill');
  assert.equal(p.label, 'Drill 20 questions on Airway & Respiratory');
  assert.equal(p.href, '/nremt/practice.html?domain=Airway%20%26%20Respiratory');
});

test('nremt: with nothing due and no weak domain, home — never nothing', () => {
  const b = fresh();
  b.localStorage.setItem('nremt_domain_stats_all', JSON.stringify({ Trauma: { correct: 19, total: 20 } }));
  const p = b.window.LevlNext.pick('nremt', {});
  assert.equal(p.kind, 'home');
  assert.equal(p.href, '/nremt/');
});

test('a queue the page holds open outranks the course queue, with its own label and action', () => {
  const b = fresh();
  b.localStorage.setItem('nremt_mastery', JSON.stringify({ 1: { level: 0, lastSeen: b.now() } }));
  const act = () => {};
  const p = b.window.LevlNext.pick('nremt', { due: { n: 12, label: 'Keep going · 12 cards', act } });
  assert.equal(p.kind, 'review');
  assert.equal(p.label, 'Keep going · 12 cards');
  assert.equal(p.act, act);
  // An empty page queue falls back to the course's own.
  assert.equal(b.window.LevlNext.pick('nremt', { due: { n: 0, act } }).label, 'Review 1 due question');
});

/* ---- ochem: the real curriculum, a stubbed mastery engine ---------------- */

function ochem({ due = [], weakest = [], completed = [] } = {}){
  const b = fresh();
  const progress = {};
  completed.forEach(id => { progress[id] = { completed: true, bestScore: 90 }; });
  b.localStorage.setItem('ochem_progress', JSON.stringify(progress));
  b.load('ochem/assets/curriculum.js');
  b.window.OchemMastery = {
    due: () => due, leeches: () => due.filter(p => p.leech), reviewsRemainingToday: () => 3,
    weakest: () => weakest,
  };
  return b;
}

test('ochem: due concepts first, without leeches and under the daily cap', () => {
  const due = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e', leech: true }];
  const p = ochem({ due }).window.LevlNext.pick('ochem', {});
  assert.equal(p.kind, 'review');
  assert.equal(p.label, 'Review 3 due concepts');     // 4 non-leech, capped at 3 today
  assert.equal(p.href, '/ochem/review.html');
});

test('ochem: the question engine’s own review queue is used when the page has it', () => {
  const b = ochem({ due: [{ id: 'a' }] });
  b.window.OchemQuestionEngine = { reviewQueue: () => ({ today: [1, 2, 3, 4, 5] }) };
  assert.equal(b.window.LevlNext.pick('ochem', {}).label, 'Review 5 due concepts');
});

test('ochem: next is the first unfinished lesson after the furthest finished one', () => {
  const p = ochem({ completed: ['atomic-structure', 'orbitals'] }).window.LevlNext.pick('ochem', {});
  assert.equal(p.kind, 'lesson');
  assert.equal(p.label, 'Next lesson: Hybridization');
  assert.equal(p.href, '/ochem/lessons/hybridization.html');
  // Came in at pKa: sent on from there, not back to chapter 1.
  assert.equal(ochem({ completed: ['pka'] }).window.LevlNext.pick('ochem', {}).href, '/ochem/lessons/acidity-factors.html');
  // Nothing finished at all: the start of the course.
  assert.equal(ochem().window.LevlNext.pick('ochem', {}).href, '/ochem/lessons/atomic-structure.html');
});

test('ochem: a lesson outranks the weakest concept; skipping lessons reaches the drill', () => {
  const weakest = [{ id: 'resonance-contributors', strength: 0.42, concept: { title: 'Resonance contributors' } }];
  const b = ochem({ weakest });
  assert.equal(b.window.LevlNext.pick('ochem', {}).kind, 'lesson');
  const p = b.window.LevlNext.pick('ochem', { skip: ['lesson'] });
  assert.equal(p.kind, 'drill');
  assert.equal(p.href, '/ochem/practice.html?concept=resonance-contributors');
  assert.match(p.reason, /42%/);
});

test('ochem: an engine that throws falls through to the next tier instead of breaking the screen', () => {
  const b = ochem();
  b.window.OchemMastery.due = () => { throw new Error('boom'); };
  assert.equal(b.window.LevlNext.pick('ochem', {}).kind, 'lesson');
});

/* ---- A&P: the real curriculum, a stubbed AnpCore ------------------------ */

function anp({ due = [], q = {}, done = {}, weakest = [] } = {}){
  const b = fresh();
  b.load('anatomy-physiology/assets/anp-curriculum.js');
  b.window.AnpCore = { reviewQueue: () => due, load: () => ({ q }), lessonsDone: () => done, weakest: () => weakest };
  return b;
}

test('anp: due items first, called questions only when every one is a question', () => {
  const p = anp({ due: ['x', 'y'], q: { x: { src: 'q' }, y: { src: 'predict' } } }).window.LevlNext.pick('anp', {});
  assert.equal(p.label, 'Review 2 due items');
  const p2 = anp({ due: ['x'], q: { x: { src: 'q' } } }).window.LevlNext.pick('anp', {});
  assert.equal(p2.label, 'Review 1 due question');
});

test('anp: next lesson follows chapter order, then topic order', () => {
  const b = anp();
  const C = b.window.AnpCurriculum;
  const first = C.topics.filter(t => t.chapter === 'orientation').sort((a, x) => a.n - x.n);
  const done = {};
  first.forEach(t => { done[t.id] = 1; });
  const p = anp({ done }).window.LevlNext.pick('anp', {});
  const ch2 = C.topics.filter(t => t.chapter === 'chem-physics').sort((a, x) => a.n - x.n)[0];
  assert.equal(p.kind, 'lesson');
  assert.equal(p.href, '/anatomy-physiology/lessons/' + ch2.id + '.html');
});

test('anp: the weakest topic needs three answers and under 70% before it is named', () => {
  const b = anp({ weakest: [{ id: 'skull', title: 'The skull', value: 0.2, answered: 2 }, { id: 'nephron', title: 'The nephron', value: 0.5, answered: 6 }] });
  const p = b.window.LevlNext.pick('anp', { skip: ['lesson'] });
  assert.equal(p.kind, 'drill');
  assert.equal(p.href, '/anatomy-physiology/practice.html?topic=nephron');
});

/* ---- tags for the cross-course suggestion ------------------------------ */

test('tags: ochem concepts count for their first topic and its chapter; A&P topics for theirs', () => {
  const b = ochem();
  b.window.OchemConcepts = { get: id => ({ 'k-acid': { topics: ['pka', 'carbohydrates'] } })[id] || null };
  const t = b.window.LevlNext.tagsFor('ochem', { concepts: ['k-acid'] });
  assert.deepEqual([...t].sort(), ['ochem:acids-bases', 'ochem:pka']);
  const a = anp();
  assert.deepEqual([...a.window.LevlNext.tagsFor('anp', { topics: ['acids-bases-ph'] })].sort(), ['anp:acids-bases-ph', 'anp:chem-physics']);
});
