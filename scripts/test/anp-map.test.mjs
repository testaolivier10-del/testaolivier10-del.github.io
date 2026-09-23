/* The A&P ordering check (scripts/lib/anp-map.mjs).

   The check's job is to fail. The real map passes it, so a check that
   silently accepted everything would look exactly like a check that works.
   These tests hand it small maps with one deliberate mistake each and assert
   it names that mistake, then do the same for pages: a term used before it
   is taught fails, and the same term inside a preview box does not. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadMap, validateMap, scanPage, stripForScan } from '../lib/anp-map.mjs';

function tiny() {
  return {
    coreConcepts: [{ id: 'homeostasis', name: 'Homeostasis' }],
    parts: [{ id: 'p', title: 'Part' }],
    chapters: [
      { id: 'one', title: 'One', part: 'p', course: 'I', tools: { feedbackLoops: [{ title: 'Loop', topic: 'a' }] } },
      { id: 'two', title: 'Two', part: 'p', course: 'II', tools: {} },
    ],
    topics: [
      { id: 'a', title: 'A', chapter: 'one', course: 'I', kind: 'physiology', coreConcepts: ['homeostasis'] },
      { id: 'b', title: 'B', chapter: 'two', course: 'II', kind: 'anatomy', coreConcepts: ['homeostasis'] },
    ],
    concepts: [
      { id: 'set-point', term: 'set point', aliases: [], taughtIn: 'a', dependsOn: [] },
      { id: 'hormone', term: 'hormone', aliases: ['hormones'], taughtIn: 'b', dependsOn: ['set-point'] },
    ],
  };
}

test('the real map passes', () => {
  const { errors } = validateMap(loadMap(new URL('../../docs/anp-dependency-map.json', import.meta.url)));
  assert.deepEqual(errors, []);
});

test('a small valid map passes', () => {
  assert.deepEqual(validateMap(tiny()).errors, []);
});

test('depending on something taught later fails', () => {
  const m = tiny();
  m.concepts[0].dependsOn = ['hormone'];
  const { errors } = validateMap(m);
  assert.ok(errors.some(e => e.startsWith('ORDER: set-point')), errors.join('\n'));
});

test('a declared preview allows the forward dependency, and must be used', () => {
  const m = tiny();
  m.concepts[0].dependsOn = ['hormone'];
  m.topics[0].previews = [{ concept: 'hormone', reason: 'needs the word' }];
  assert.deepEqual(validateMap(m).errors.filter(e => !e.startsWith('dependency cycle')), []);
  m.concepts[0].dependsOn = [];
  assert.ok(validateMap(m).errors.some(e => e.includes('no concept in this topic depends on it')));
});

test('a cycle fails even inside one topic', () => {
  const m = tiny();
  m.concepts.push({ id: 'x', term: 'x thing', aliases: [], taughtIn: 'a', dependsOn: ['y'] });
  m.concepts.push({ id: 'y', term: 'y thing', aliases: [], taughtIn: 'a', dependsOn: ['x'] });
  assert.ok(validateMap(m).errors.some(e => e.startsWith('dependency cycle')));
});

test('one word standing for two concepts fails', () => {
  const m = tiny();
  m.concepts[0].aliases = ['hormone'];
  assert.ok(validateMap(m).errors.some(e => e.includes('belongs to both')));
});

test('a page may not use a term before the topic that teaches it', () => {
  const html = '<html><head><title>A</title></head><body><p>Hormones change the set point.</p></body></html>';
  const problems = scanPage(tiny(), html, 'a');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /hormone/);
});

test('the same use inside a preview box passes', () => {
  const html = '<body><aside class="anp-preview"><div><p>A hormone is a messenger.</p></div></aside><p>The set point.</p></body>';
  assert.deepEqual(scanPage(tiny(), html, 'a'), []);
  assert.doesNotMatch(stripForScan(html), /hormone/);
});

test('a term is matched as a whole word, and acronyms by case', () => {
  const m = tiny();
  m.concepts[1].aliases = ['ADH'];
  assert.deepEqual(scanPage(m, '<p>Hormonelike? No: the add-on and adhesion.</p>', 'a'), []);
  assert.equal(scanPage(m, '<p>ADH rises.</p>', 'a').length, 1);
});

test('an allowed term that contains a later one is not a use of the later one', () => {
  const m = tiny();
  m.concepts.push({ id: 'acid', term: 'acid', aliases: [], taughtIn: 'b', dependsOn: [] });
  m.concepts.push({ id: 'amino-acid', term: 'amino acid', aliases: [], taughtIn: 'a', dependsOn: [] });
  const page = t => `<html><body><p>${t}</p></body></html>`;
  assert.deepEqual(scanPage(m, page('An amino acid joins the chain.'), 'a'), []);
  assert.equal(scanPage(m, page('An amino acid is an acid.'), 'a').length, 1);
});

test('subscripts join their word, and a capital-letter name keeps its case', () => {
  const m = tiny();
  m.concepts.push({ id: 'co', term: 'cardiac output', aliases: ['CO'], taughtIn: 'b', dependsOn: [] });
  m.concepts.push({ id: 'a-band', term: 'A band', aliases: [], taughtIn: 'b', dependsOn: [] });
  const page = t => `<html><body><p>${t}</p></body></html>`;
  assert.deepEqual(scanPage(m, page('You breathe out CO<sub>2</sub> through a band of tissue.'), 'a'), []);
  assert.equal(scanPage(m, page('The A band is dark.'), 'a').length, 1);
});

test('a Unicode subscript joins its word', () => {
  const m = tiny();
  m.concepts.push({ id: 'co', term: 'cardiac output', aliases: ['CO'], taughtIn: 'b', dependsOn: [] });
  assert.deepEqual(scanPage(m, '<html><body><p>You breathe out CO₂.</p></body></html>', 'a'), []);
});

test('a plural of a later term is a use of it', () => {
  const m = tiny();
  m.concepts.push({ id: 'keratin', term: 'keratin', aliases: [], taughtIn: 'b', dependsOn: [] });
  assert.equal(scanPage(m, '<html><body><p>Keratins are tough.</p></body></html>', 'a').length, 1);
});

test('an everyday word may be used early; the technical term may not', () => {
  const m = tiny();
  m.concepts.push({ id: 'nerve', term: 'nerve', aliases: ['nerves', 'spinal nerve'], taughtIn: 'b', dependsOn: [] });
  m.everydayWords = { words: ['nerve', 'nerves'] };
  assert.deepEqual(scanPage(m, '<html><body><p>A nerve in your arm.</p></body></html>', 'a'), []);
  assert.equal(scanPage(m, '<html><body><p>A spinal nerve.</p></body></html>', 'a').length, 1);
  m.everydayWords.words.push('nervez');
  assert.ok(validateMap(m).errors.some(e => e.includes('nervez')));
});
