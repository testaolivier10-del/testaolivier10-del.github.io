/* assets/site-search.js — matching, ranking and snippets for both search pages.

   This is the one piece of the site a reader interacts with by typing, and
   every way it can be wrong is quiet. AND vs OR decides whether a two-word
   query narrows or returns the entire bank. The escape/highlight ORDER decides
   whether a snippet renders its own markup as text or, worse, renders a
   question's text as markup. And the text-fragment link decides whether a
   result opens the paragraph it promised or the top of a 40-chapter page —
   a broken fragment is ignored by the browser rather than reported, so the
   only symptom is a link that quietly stops working. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

function search() {
  const b = createBrowser();
  b.load('assets/site-search.js');
  return b.window.LevlSearch;
}

const INDEX = [
  { page: 'Lessons', file: 'lessons/e2.html', heading: 'E2 elimination', text: 'Anti-periplanar geometry is required for E2.', weight: 3 },
  { page: 'Textbook', file: 'learn.html#e2', heading: 'E2', text: 'The hydrogen and the leaving group must be anti-periplanar, which means 180 degrees apart.' },
  { page: 'Textbook', file: 'learn.html#sn1', heading: 'SN1', text: 'The carbocation is flat, so the nucleophile attacks either face and the product is racemic.' },
  { page: 'Practice questions', file: 'learn.html#e2', heading: 'E2', text: 'Which conformation allows E2? Anti-periplanar.', weight: 0.8 },
];

test('every term has to appear — AND, not OR', () => {
  const S = search();
  // OR would return the SN1 chunk for this too, because it contains "the".
  const hits = S.rank(INDEX, 'anti-periplanar e2');
  assert.ok(hits.length >= 2);
  assert.ok(hits.every((h) => /anti-periplanar/i.test(h.text)));
  assert.equal(S.rank(INDEX, 'anti-periplanar unicorn').length, 0);
});

test('a heading match outranks a body match', () => {
  const S = search();
  const hits = S.rank([
    { page: 'a', file: 'a', heading: 'Nothing relevant', text: 'racemic appears only down here in the body text' },
    { page: 'b', file: 'b', heading: 'Racemic mixtures', text: 'unrelated body' },
  ], 'racemic');
  assert.equal(hits[0].file, 'b');
});

test('the whole phrase intact beats its words scattered', () => {
  const S = search();
  const hits = S.rank([
    { page: 'a', file: 'scattered', heading: '', text: 'flat carbocation here, and much later the word racemic' },
    { page: 'b', file: 'intact', heading: '', text: 'the product is racemic because the carbocation is flat' },
  ], 'carbocation is flat');
  assert.equal(hits[0].file, 'intact');
});

test('weight tilts between kinds of result', () => {
  const S = search();
  const hits = S.rank(INDEX, 'e2');
  // Someone searching "e2" wants the lesson, not the ninetieth practice
  // question that mentions it.
  assert.equal(hits[0].page, 'Lessons');
});

test('a snippet is escaped, and the marks survive it', () => {
  const S = search();
  const hits = S.rank([{ page: 'p', file: 'f', heading: 'h', text: 'Use <b>bold</b> & "quotes" for emphasis' }], 'bold');
  const snip = hits[0].snippet;
  assert.ok(snip.includes('&lt;b&gt;'), 'raw HTML survived into the snippet');
  assert.ok(snip.includes('&amp;'), 'ampersand was not escaped');
  assert.ok(snip.includes('<mark>bold</mark>'), 'the match was not marked');
  // Marking first and escaping afterwards eats the mark tags; this is the
  // assertion that catches that ordering being swapped back.
  assert.ok(!snip.includes('&lt;mark&gt;'));
});

test('a term containing markup characters still highlights', () => {
  const S = search();
  const hits = S.rank([{ page: 'p', file: 'f', heading: 'h', text: 'The rate is k[R&ndash;X] under these conditions' }], 'r&ndash;x');
  // Matching a raw pattern against escaped text finds nothing here, which
  // looked like "no highlight" rather than like a bug.
  assert.ok(hits[0].snippet.includes('<mark>'), hits[0].snippet);
});

test('a text fragment is appended to a hash, not added as a second one', () => {
  const S = search();
  const href = S.textFragment('learn.html#e2', ['anti-periplanar', 'e2']);
  // 'learn.html#e2#:~:text=...' is a URL with one fragment reading
  // 'e2#:~:text=...' — which matches no element and is not a text directive
  // either, so the link silently stops opening the right chapter.
  assert.equal(href, 'learn.html#e2:~:text=anti-periplanar');
  assert.equal(href.split('#').length, 2);
});

test('a text fragment on a plain file still gets its hash', () => {
  const S = search();
  assert.equal(S.textFragment('study-notes.html', ['airway']), 'study-notes.html#:~:text=airway');
  // Built from the longest term, since the whole query rarely appears verbatim.
  assert.equal(S.textFragment('a.html', ['is', 'pneumothorax']), 'a.html#:~:text=pneumothorax');
  assert.equal(S.textFragment('a.html', []), 'a.html');
});

test('one long section cannot fill the whole result list', () => {
  const S = search();
  const many = Array.from({ length: 12 }, (_, i) => (
    { page: 'Textbook', file: 'learn.html#e2', heading: 'E2', text: 'paragraph ' + i + ' about geometry' }
  ));
  const capped = S.rank(many.concat([{ page: 'Lessons', file: 'lessons/x.html', heading: 'X', text: 'geometry' }]),
    'geometry', { maxPerSource: 2 });
  const fromE2 = capped.filter((h) => h.file === 'learn.html#e2');
  assert.equal(fromE2.length, 2);
  // And the other source is not crowded out.
  assert.ok(capped.some((h) => h.file === 'lessons/x.html'));
});

test('an empty query matches nothing rather than everything', () => {
  const S = search();
  assert.equal(S.rank(INDEX, '').length, 0);
  assert.equal(S.rank(INDEX, '   ').length, 0);
});

test('the limit is honoured', () => {
  const S = search();
  const many = Array.from({ length: 200 }, (_, i) => ({ page: 'p', file: 'f' + i, heading: 'h' + i, text: 'common word' }));
  assert.equal(S.rank(many, 'common', { limit: 40 }).length, 40);
});

test('ranking does not mutate the index it was given', () => {
  const S = search();
  const before = JSON.parse(JSON.stringify(INDEX));
  S.rank(INDEX, 'e2');
  // The page re-ranks on every keystroke against the same array; writing
  // score/snippet back onto it would accumulate a previous query's state.
  assert.deepEqual(JSON.parse(JSON.stringify(INDEX)), before);
});
