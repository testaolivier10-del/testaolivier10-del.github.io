/* ochem/assets/ochem-premium.js — the ochem side of the Premium split.

   Two promises are pinned here. Before launch nothing changes: every chapter,
   question and tool is open, and Premium is only a badge. After launch a
   reader without a pass keeps the free chapters and the free tools, may be
   served 15 questions a day from any other chapter (then only the free
   chapters' questions, instead of erroring), and gets one free exam.
   The page tests check that every page that gates actually loads the code
   that gates it, in an order that lets it work. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createBrowser } from './harness.mjs';

const FREE = ['foundations', 'electron-movement', 'nomenclature', 'acids-bases'];

function fresh({ launched, member = false } = {}) {
  const b = createBrowser();
  if (member) {
    b.window.StudyHubAccount = { user: () => ({ id: 'u1' }) };
    b.localStorage.setItem('levlprep_premium_v1', JSON.stringify({ userId: 'u1', courses: { ochem: '2027-06-01T00:00:00Z' } }));
  }
  b.load('assets/premium.js');
  b.window.LevlPremium.COURSES.ochem.freeChapters = FREE.slice();
  b.window.LevlPremium._setLaunched(launched);
  b.load('ochem/assets/curriculum.js');
  b.load('ochem/assets/ochem-premium.js');
  // The question allowance and the free exam are added by question-engine.js.
  b.load('ochem/assets/concepts.js');
  b.load('ochem/assets/mastery-engine.js');
  b.window.OchemInteractiveBank = { ALL: [] };
  const q = (n) => ({ q: 'Question ' + n, options: ['a', 'b'], answer: 0, tier: 1 });
  b.window.OchemPracticeBank = { pka: [q(1), q(2)], sn2: [q(3), q(4)] };
  b.load('ochem/assets/question-engine.js');
  return { b, G: b.window.OchemPremium, P: b.window.LevlPremium, E: b.window.OchemQuestionEngine };
}

test('before launch nothing is locked, and Premium only carries a badge', () => {
  const { G } = fresh({ launched: false });
  assert.equal(G.locked(), false);
  assert.equal(G.locked('stereochemistry'), false);
  assert.equal(G.topicLocked('sn2'), false);
  assert.equal(G.limitReached(), false);
  assert.equal(G.quotaNote(), '', 'no allowance line before launch');
  assert.equal(G.freeExam().available, true);
  assert.match(G.badge('stereochemistry'), /premium-badge/);
  assert.match(G.badge(), /premium-badge/, 'whole-course features are badged');
  assert.equal(G.badge('foundations'), '', 'a free chapter carries no badge');
  assert.match(G.pill(), /^<span class="premium-badge">/);
  let ran = false;
  G.whenOpen(() => { ran = true; });
  assert.equal(ran, true, 'a lesson starts at once before launch');
});

test('after launch, without a pass, only the free part is open', () => {
  const { G } = fresh({ launched: true });
  assert.equal(G.locked(), true, 'whole-course Premium features lock');
  for (const ch of FREE) assert.equal(G.locked(ch), false, ch);
  assert.equal(G.locked('stereochemistry'), true);
  assert.equal(G.topicLocked('pka'), false);
  assert.equal(G.topicLocked('sn2'), true);
  assert.equal(G.quota().limit, 15);
  assert.match(G.quotaNote(), /15 of 15 free questions left today/);
  let ran = false;
  G.whenOpen(() => { ran = true; });
  assert.equal(ran, false, 'a locked lesson must not start, or it writes progress');
});

test('a pass opens everything and removes the badges', () => {
  const { G } = fresh({ launched: true, member: true });
  assert.equal(G.locked(), false);
  assert.equal(G.topicLocked('sn2'), false);
  assert.equal(G.badge('stereochemistry'), '');
  assert.equal(G.pill(), '');
});

test('the free tools are real tools and leave most of them Premium', () => {
  const { b, G } = fresh({ launched: true });
  b.load('ochem/assets/tools-registry.js');
  const slugs = b.window.OchemTools.ALL.map((t) => t.slug);
  for (const s of G.FREE_TOOLS) assert.ok(slugs.includes(s), `${s} is not a tool`);
  assert.ok(G.FREE_TOOLS.length < slugs.length / 2);
});

test('the whole bank stays in the pool; the allowance decides what is served', () => {
  const { E, G, P } = fresh({ launched: true });
  const topics = (list) => [...new Set(list.map((x) => x.topic))].sort();
  assert.deepEqual(topics(E.all()), ['pka', 'sn2'], 'nothing is filtered out of the bank');
  const sn2 = E.all().find((x) => x.topic === 'sn2');
  const pka = E.all().find((x) => x.topic === 'pka');
  const plan = { mode: 'topic', topic: 'sn2', count: 10 };
  assert.equal(E.availableCount(plan), 2, 'a Premium chapter is open while the allowance lasts');

  // A free chapter's question never touches the allowance.
  for (let i = 0; i < 20; i++) assert.equal(G.takeQuestion(pka), true);
  assert.equal(G.quota().used, 0);

  for (let i = 0; i < 15; i++) assert.equal(G.takeQuestion(sn2), true, `question ${i + 1} of 15`);
  assert.equal(G.takeQuestion(sn2), false, 'the 16th is refused');
  assert.equal(G.limitReached(), true);
  assert.match(G.quotaNote(), /used today.s 15 free questions/);
  assert.match(G.limitGate('practice'), /data-premium-feature="daily-limit"/);

  E.resetLimited();
  assert.equal(E.availableCount(plan), 0, 'spent: a Premium chapter serves nothing');
  assert.equal(E.wasLimited(), true, 'and says it was the allowance');
  E.resetLimited();
  assert.equal(E.availableCount({ mode: 'topic', topic: 'pka', count: 10 }), 2, 'free chapters stay unlimited');
  assert.equal(E.wasLimited(), false);
  assert.ok(E.byId(sn2.id), 'a spent allowance hides nothing already in the bank');

  P._setLaunched(false);
  assert.equal(E.availableCount(plan), 2, 'before launch the whole bank is open');
});

test('members are never limited', () => {
  const ctx = fresh({ launched: true, member: true });
  const { G } = ctx;
  for (let i = 0; i < 30; i++) assert.equal(G.takeQuestion({ topic: 'sn2' }), true);
  assert.equal(G.limitReached(), false);
  assert.equal(G.quotaNote(), '');
  assert.equal(G.freeExam().unlimited, true);
});

test('one free exam, taken when it starts', () => {
  const { G } = fresh({ launched: true });
  assert.equal(G.freeExam().available, true);
  assert.equal(G.freeExam().use(), true);
  assert.equal(G.freeExam().available, false);
  assert.equal(G.freeExam().use(), false, 'a second exam is refused');
  assert.equal(G.quota().used, 0, 'the exam does not touch the daily allowance');
});

/* ---- the pages ------------------------------------------------------------ */

const list = (dir) => readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => `${dir}/${f}`);
const GATED = [
  ...list('ochem/lessons'), ...list('ochem/mechanisms'), ...list('ochem/tools'),
  ...['tools', 'dashboard', 'learn', 'practice', 'review', 'exams'].map((p) => `ochem/${p}.html`),
];

test('every gated page loads premium.js and ochem-premium.js, deferred, after account.js', () => {
  for (const page of GATED) {
    const html = readFileSync(page, 'utf8');
    const at = (name) => html.search(new RegExp(`<script src="[./]*assets/${name}" defer></script>`));
    const account = at('account\\.js'), premium = at('premium\\.js'), ochem = at('ochem-premium\\.js');
    assert.ok(account !== -1 && premium !== -1 && ochem !== -1, `${page} is missing a script`);
    assert.ok(account < premium && premium < ochem, `${page} loads them out of order`);
  }
});

test('every lesson and mechanism names its chapter, so it can tell whether it is free', () => {
  const b = createBrowser();
  b.load('ochem/assets/curriculum.js');
  const ids = new Set(b.window.OchemCurriculum.MODULES.map((m) => m.id));
  for (const page of [...list('ochem/lessons'), ...list('ochem/mechanisms')]) {
    const html = readFileSync(page, 'utf8');
    const m = html.match(/class="(?:xshell lesson-shell|eyebrow)" data-chapter="([a-z0-9-]+)"/);
    assert.ok(m, `${page} has no data-chapter on its shell or eyebrow`);
    assert.ok(ids.has(m[1]), `${page} names an unknown chapter "${m[1]}"`);
    assert.ok(/class="xshell lesson-shell"/.test(html) && html.includes('id="card"'), `${page} has no lesson shell to gate`);
  }
});
