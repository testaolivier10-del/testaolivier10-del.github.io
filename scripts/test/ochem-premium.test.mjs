/* ochem/assets/ochem-premium.js — the ochem side of the Premium split.

   Two promises are pinned here. Before launch nothing changes: every chapter,
   question and tool is open, and Premium is only a badge. After launch a
   reader without a pass keeps the free chapters and the free tools, and the
   practice pool shrinks to the free chapters' questions instead of erroring.
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
  return { b, G: b.window.OchemPremium, P: b.window.LevlPremium };
}

test('before launch nothing is locked, and Premium only carries a badge', () => {
  const { G } = fresh({ launched: false });
  assert.equal(G.locked(), false);
  assert.equal(G.locked('stereochemistry'), false);
  assert.equal(G.topicLocked('sn2'), false);
  assert.equal(G.accessKey(), 'all');
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
  assert.equal(G.accessKey(), 'free');
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

test('the practice pool follows access, and rebuilds when it changes', () => {
  const { b, P } = fresh({ launched: true });
  b.load('ochem/assets/concepts.js');
  b.load('ochem/assets/mastery-engine.js');
  b.window.OchemInteractiveBank = { ALL: [] };
  const q = (n) => ({ q: 'Question ' + n, options: ['a', 'b'], answer: 0, tier: 1 });
  b.window.OchemPracticeBank = { pka: [q(1), q(2)], sn2: [q(3)] };
  b.load('ochem/assets/question-engine.js');
  const E = b.window.OchemQuestionEngine;
  const topics = () => [...new Set(E.all().map((x) => x.topic))].sort();
  assert.deepEqual(topics(), ['pka']);
  P._setLaunched(false);
  assert.deepEqual(topics(), ['pka', 'sn2'], 'before launch the whole bank is open');
});

/* ---- the pages ------------------------------------------------------------ */

const list = (dir) => readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => `${dir}/${f}`);
const GATED = [
  ...list('ochem/lessons'), ...list('ochem/mechanisms'), ...list('ochem/tools'),
  ...['tools', 'flashcards', 'dashboard', 'learn', 'practice', 'review', 'exams'].map((p) => `ochem/${p}.html`),
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
