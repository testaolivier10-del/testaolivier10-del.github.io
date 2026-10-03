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

/* assets/site-search-all.js — what the site-wide /search.html searches. The
   builders are pure: each course's own data in, root-relative chunks out. The
   failure modes are again quiet: a link built relative to the course folder
   404s from the root page, a ?course= typo silently searches nothing, and a
   glossary in a shape the reader does not expect indexes zero terms. */
// Arrays made inside the sandbox have the sandbox's Array prototype, which
// deepStrictEqual refuses to equate with ours; compare the plain values.
const eq = (a, b, m) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b, m);

function searchAll() {
  const b = createBrowser();
  b.load('assets/site-search.js');
  b.load('assets/site-search-all.js');
  return { S: b.window.LevlSearch, A: b.window.LevlSearchAll };
}

test('?course= picks one course, and anything else means all of them', () => {
  const { A } = searchAll();
  assert.equal(A.parseCourse('nremt'), 'nremt');
  assert.equal(A.parseCourse('OCHEM'), 'ochem');
  assert.equal(A.parseCourse('anp'), 'anp');
  assert.equal(A.parseCourse('anatomy-physiology'), 'anp');
  assert.equal(A.parseCourse(''), 'all');
  assert.equal(A.parseCourse(null), 'all');
  assert.equal(A.parseCourse('chemistry'), 'all');
  // AP® Biology: key apbio, but a URL names it by its folder (no "ap" in URLs).
  assert.equal(A.parseCourse('bio'), 'apbio');
  assert.equal(A.parseCourse('biology'), 'apbio');
  assert.equal(A.parseCourse('ap'), 'anp');
  assert.equal(A.urlKey('apbio'), 'bio');
  assert.equal(A.urlKey('anp'), 'anp');
  assert.equal(A.urlKey('ochem'), 'ochem');
  eq(A.scopeKeys('all'), ['nremt', 'ochem', 'anp', 'apbio']);
  eq(A.scopeKeys('ochem'), ['ochem']);
});

test('HTML becomes plain text: tags out, entities decoded, blocks spaced', () => {
  const { A } = searchAll();
  assert.equal(A.stripHtml('<p>Give O<sub>2</sub> &amp; reassess&nbsp;&mdash; then</p><li>a</li><li>b</li>'), 'Give O 2 & reassess — then a b');
  assert.equal(A.stripHtml('<script>var x = "<p>"</script>kept'), 'kept');
  assert.equal(A.decodeEntities('&#8805; &#x2192; &unknown;'), '≥ → &unknown;');
});

test('long prose splits at sentence ends and never loses text', () => {
  const { A } = searchAll();
  const text = Array.from({ length: 40 }, (_, i) => `Sentence number ${i} is here.`).join(' ');
  const parts = A.splitText(text, 200);
  assert.ok(parts.length > 1);
  assert.ok(parts.every((p) => p.length <= 200));
  assert.ok(parts.slice(0, -1).every((p) => p.endsWith('.')));
  assert.equal(parts.join(' '), text);
  // One unbroken word longer than the limit still terminates.
  assert.equal(A.splitText('x'.repeat(1300), 500).length, 3);
});

test('a page of headings and divs becomes one chunk per heading', () => {
  const { A } = searchAll();
  const chunks = A.sectionChunks([
    { t: 'stray intro text that is long enough' },
    { h: 'OPQRST' }, { t: 'Onset — sudden or gradual.' }, { t: 'Provocation — what makes it worse.' },
    { h: 'AVPU' }, { t: 'short' },
  ], { course: 'nremt', kind: 'Reference', file: 'nremt/mnemonics.html', heading: 'Mnemonics', frag: true });
  assert.equal(chunks.length, 2, 'the AVPU section is too short to be a result');
  assert.equal(chunks[0].heading, 'Mnemonics');
  assert.equal(chunks[1].heading, 'Mnemonics — OPQRST');
  assert.match(chunks[1].text, /Onset — sudden or gradual\. Provocation/);
  assert.equal(chunks[1].file, 'nremt/mnemonics.html');
});

test('inline glossary terms are read from the page source', () => {
  const { A } = searchAll();
  const src = 'const TERMS = [\n  {term:"Ambulatory", def:"Able to walk."},\n  {term:"Say \\"ah\\"", def:"Open wide."}\n];';
  const terms = A.inlineTerms(src);
  eq(terms.map((t) => t.term), ['Ambulatory', 'Say "ah"']);
  assert.equal(terms[0].def, 'Able to walk.');
});

test('a glossary JSON is read in either shape the site uses', () => {
  const { A } = searchAll();
  const map = A.termsFromJson({ 'c-1': { t: 'anatomy', d: 'The study of <b>structure</b>.', p: 'body-org' } });
  assert.equal(map.length, 1);
  assert.equal(map[0].id, 'c-1');
  assert.equal(map[0].def, 'The study of structure .');
  assert.equal(map[0].topic, 'body-org');
  const list = A.termsFromJson([{ term: 'nucleophile', def: 'Donates a pair.' }, { id: 'pka', name: 'pKa', definition: '-log Ka' }, { term: 'orphan' }]);
  eq(list.map((t) => t.term), ['nucleophile', 'pKa']);
  assert.equal(list[1].id, 'pka');
  assert.equal(A.termsFromJson({ terms: [{ term: 'a', def: 'b' }] }).length, 1);
  assert.equal(A.termsFromJson(null).length, 0);
});

test('every link is relative to the site root, not the course folder', () => {
  const { A } = searchAll();
  const nremtNotes = A.nremtNotesChunks({ chapters: [{ num: 3, title: 'Airway', intro: 'Intro <i>text</i>.',
    sections: [{ title: 'Adjuncts', id: 'ch3-adjuncts', topics: [{ heading: 'OPA', html: '<p>Measure from the corner of the mouth.</p>' }] }] }] });
  eq(nremtNotes.map((c) => c.file), ['nremt/study-notes.html#chapter-3', 'nremt/study-notes.html#ch3-adjuncts']);
  assert.equal(nremtNotes[1].heading, 'Ch. 3 Airway — OPA');
  assert.ok(nremtNotes.every((c) => c.frag && c.course === 'nremt'));

  const q = A.nremtQuestionChunks([{ id: 42, domain: 'Airway', topic: 'OPA', q: 'Size an OPA how?' }, { domain: 'Cardiology', q: 'Rate?' }], ['Corner of mouth.']);
  eq(q.map((c) => c.file), ['nremt/practice.html?q=42', 'nremt/practice.html?q=1']);
  assert.match(q[0].text, /Size an OPA how\? Corner of mouth\./);

  const CU = { MODULES: [{ title: 'Substitution', topics: [
    { id: 'sn2', title: 'SN2', href: 'lessons/sn2.html', mechanism: 'mechanisms/sn2.html' },
    { id: 'future', title: 'Coming soon' },
  ] }] };
  const oc = A.ochemStructureChunks(CU);
  eq(oc.map((c) => c.file), ['ochem/lessons/sn2.html', 'ochem/mechanisms/sn2.html']);
  eq(oc.map((c) => c.kind), ['Lessons', 'Mechanisms']);
  eq(A.ochemToolChunks({ ALL: [{ slug: 'pka', name: 'pKa table', tagline: 't', blurb: 'b', teaches: 'acidity' }] }).map((c) => c.file), ['ochem/tools/pka.html']);
  const oq = A.ochemQuestionChunks({ sn2: [{ q: 'Inversion?' }] }, { sn2: ['Backside attack.'] }, CU);
  assert.equal(oq[0].file, 'ochem/learn.html#sn2');
  assert.equal(oq[0].heading, 'SN2');
  assert.ok(oq[0].opensSection);

  const anp = A.anpStructureChunks({ chapters: [{ id: 'heart', title: 'The heart' }], topics: [
    { id: 'valves', title: 'Heart valves', chapter: 'heart', built: true }, { id: 'later', title: 'Later', chapter: 'heart', built: false },
  ] }, [{ slug: 'graphs', name: 'Graph reader', blurb: 'Read graphs.' }]);
  eq(anp.map((c) => c.file), ['anatomy-physiology/lessons/valves.html', 'anatomy-physiology/tools/graphs.html']);
  const g = A.glossaryChunks('anp', A.termsFromJson({ c7: { t: 'systole', d: 'Contraction.' } }), (x) => ({ file: 'glossary.html#t-' + x.id }));
  assert.equal(g[0].file, 'anatomy-physiology/glossary.html#t-c7');
});

test('results group by course, best course first, fixed order on ties', () => {
  const { S, A } = searchAll();
  const index = [
    { course: 'nremt', file: 'nremt/a', heading: 'Cardiac arrest', text: 'The heart stops.' },
    { course: 'anp', file: 'anatomy-physiology/b', heading: 'Heart', text: 'The heart pumps blood.', weight: 3 },
    { course: 'ochem', file: 'ochem/c', heading: 'SN2', text: 'Backside attack.' },
  ];
  const groups = A.groupByCourse(S.rank(index, 'heart'));
  eq(groups.map((g) => g.course), ['anp', 'nremt'], 'the A&P heading match outranks a body match; ochem has none');
  assert.equal(groups[0].name, 'Anatomy & Physiology');
  const tie = A.groupByCourse([{ course: 'anp', score: 1 }, { course: 'nremt', score: 1 }]);
  eq(tie.map((g) => g.course), ['nremt', 'anp']);
  eq(A.countByCourse([{ course: 'anp' }, { course: 'anp' }, { course: 'ochem' }]), { anp: 2, ochem: 1 });
});
