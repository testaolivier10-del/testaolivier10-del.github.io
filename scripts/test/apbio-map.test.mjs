/* The AP® Biology ordering check (scripts/lib/apbio-map.mjs).

   The check's job is to fail. The real map passes it, so these tests hand it
   small maps with one deliberate mistake each and assert it names that
   mistake, then do the same for pages and question banks: a term used before
   it is taught fails, and the same term inside a preview box does not. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  loadMap, validateMap, scanPage, scanPages, scanQuestions, stripForScan, courseOrder, hasApToken, bankQuestions,
} from '../lib/apbio-map.mjs';

const real = loadMap(new URL('../../docs/apbio-dependency-map.json', import.meta.url));

function tiny() {
  return {
    bigIdeas: [{ id: 'SYI', name: 'Systems' }],
    practices: [{ id: 1, name: 'Concepts', mcqWeight: [25, 33] }, { id: 5, name: 'Stats', mcqWeight: [8, 14] }],
    parts: [{ id: 'course', title: 'Course' }, { id: 'skills', title: 'Skills' }],
    chapters: [
      { id: 'unit-1', n: 1, part: 'course', title: 'One', weight: [40, 60], tools: { pathways: [{ title: 'Path', topic: 'water' }] } },
      { id: 'unit-2', n: 2, part: 'course', title: 'Two', weight: [40, 60], tools: {} },
      { id: 'skills-stats', part: 'skills', title: 'Stats', tools: {} },
    ],
    topics: [
      { id: 'water', ced: '1.1', title: 'Water', chapter: 'unit-1', kind: 'concept', bigIdeas: ['SYI'], practices: [1] },
      { id: 'cells', ced: '2.1', title: 'Cells', chapter: 'unit-2', kind: 'concept', bigIdeas: ['SYI'], practices: [1] },
      { id: 'means', ced: null, title: 'Means', chapter: 'skills-stats', kind: 'skill', bigIdeas: [], practices: [5], after: 'water' },
    ],
    concepts: [
      { id: 'polarity', term: 'polarity', aliases: ['polar'], taughtIn: 'water', dependsOn: [] },
      { id: 'organelle', term: 'organelle', aliases: ['organelles'], taughtIn: 'cells', dependsOn: ['polarity'] },
      { id: 'mean', term: 'mean (statistics)', aliases: ['sample mean'], taughtIn: 'means', dependsOn: [] },
    ],
    circularDependencies: [],
  };
}
const errorsOf = m => validateMap(m, { requiredSimulators: [] }).errors;
const page = t => `<html><head><title>x</title></head><body><p>${t}</p></body></html>`;

test('the real map passes', () => {
  assert.deepEqual(errorsOf(real), []);
});

test('every simulator in the owner brief must be planned', () => {
  const m = JSON.parse(JSON.stringify(real));
  for (const c of m.chapters) if (c.tools) c.tools.simulators = (c.tools.simulators || []).filter(s => s.id !== 'operons');
  assert.ok(validateMap(m).errors.some(e => e.includes('simulator operons')));
});

test('the real map has the 61 CED topics in order and every skill lands where the plan says', () => {
  const units = real.topics.filter(t => t.kind === 'concept');
  assert.equal(units.length, 61);
  assert.deepEqual(real.chapters.filter(c => c.part === 'course').map(c => c.id), ['unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5', 'unit-6', 'unit-7', 'unit-8']);
  const order = courseOrder(real);
  const unitOf = id => {
    const t = real.topics.find(x => x.id === id);
    return Number((t.kind === 'concept' ? t : real.topics.find(x => x.id === t.after)).ced.split('.')[0]);
  };
  // Statistics, graphing, rates, water potential and every design drill
  // publish with Units 1-3; Hardy-Weinberg after 7.5; Simpson's after 8.6.
  for (const t of real.topics.filter(x => x.kind !== 'concept' && !['stats-hardy-weinberg', 'stats-simpson'].includes(x.id)))
    assert.ok(unitOf(t.id) <= 3, `${t.id} anchors in Unit ${unitOf(t.id)}`);
  const at = id => order.findIndex(t => t.id === id);
  assert.equal(order[at('stats-hardy-weinberg') - 1].ced, '7.5');
  assert.equal(order[at('stats-simpson') - 1].ced, '8.6');
  for (const t of real.topics) assert.ok(!hasApToken(t.id) && !/ap/i.test(t.id), t.id);
});

test('a small valid map passes, and a skill sits right after its anchor', () => {
  assert.deepEqual(errorsOf(tiny()), []);
  assert.deepEqual(courseOrder(tiny()).map(t => t.id), ['water', 'means', 'cells']);
});

test('depending on something taught later fails', () => {
  const m = tiny();
  m.concepts[0].dependsOn = ['organelle'];
  assert.ok(errorsOf(m).some(e => e.startsWith('ORDER: polarity')));
});

test('skill concepts are ordered by the anchor, not the array position', () => {
  const m = tiny();
  m.concepts[1].dependsOn = ['mean'];          // unit 2 uses a skill placed after 1.1: fine
  assert.deepEqual(errorsOf(m), []);
  m.topics[2].after = 'cells';                 // now the skill comes after unit 2
  assert.ok(errorsOf(m).some(e => e.startsWith('ORDER: organelle')));
});

test('a preview needs a topic preview box and a circularDependencies entry, and must be used', () => {
  const m = tiny();
  m.concepts[0].dependsOn = ['organelle'];
  m.topics[0].previews = [{ concept: 'organelle', reason: 'needs the word' }];
  assert.ok(errorsOf(m).some(e => e.includes('no circularDependencies entry')));
  m.circularDependencies.push({ id: 'x', problem: 'p', detail: 'd', resolution: 'preview', into: ['water'], concepts: ['organelle'], fullIn: ['cells'] });
  assert.deepEqual(errorsOf(m).filter(e => !e.startsWith('dependency cycle')), []);
  m.concepts[0].dependsOn = [];
  assert.ok(errorsOf(m).some(e => e.includes('no concept in this topic depends on it')));
});

test('a pulled-forward short version must be recorded', () => {
  const m = tiny();
  m.concepts[0].fullIn = ['cells'];
  assert.ok(errorsOf(m).some(e => e.includes('no pull-forward')));
  m.circularDependencies.push({ id: 'pf', problem: 'p', detail: 'd', resolution: 'pull-forward', into: ['water'], concepts: ['polarity'], fullIn: ['cells'] });
  assert.deepEqual(errorsOf(m), []);
  m.concepts[0].fullIn = ['water'];
  assert.ok(errorsOf(m).some(e => e.includes('is not after')));
});

test('a cycle fails even inside one topic', () => {
  const m = tiny();
  m.concepts.push({ id: 'x', term: 'x thing', aliases: [], taughtIn: 'water', dependsOn: ['y'] });
  m.concepts.push({ id: 'y', term: 'y thing', aliases: [], taughtIn: 'water', dependsOn: ['x'] });
  assert.ok(errorsOf(m).some(e => e.startsWith('dependency cycle')));
});

test('unknown ids fail', () => {
  const m = tiny();
  m.concepts[1].dependsOn = ['nope'];
  m.concepts[0].taughtIn = 'nowhere';
  const e = errorsOf(m);
  assert.ok(e.some(x => x.includes('unknown concept "nope"')));
  assert.ok(e.some(x => x.includes('taughtIn unknown topic "nowhere"')));
});

test('one word standing for two concepts fails, qualified labels included', () => {
  const m = tiny();
  m.concepts[1].aliases = ['Polar'];
  assert.ok(errorsOf(m).some(e => e.includes('belongs to both')));
  const n = tiny();
  n.concepts[1].aliases = ['mean (statistics)'];
  assert.ok(errorsOf(n).some(e => e.includes('belongs to both')));
});

test('bad skill anchors fail', () => {
  const m = tiny();
  delete m.topics[2].after;
  assert.ok(errorsOf(m).some(e => e.includes('needs an "after" anchor')));
  m.topics[2].after = 'ghost';
  assert.ok(errorsOf(m).some(e => e.includes('unknown topic "ghost"')));
  m.topics.push({ id: 'sd', ced: null, title: 'SD', chapter: 'skills-stats', kind: 'skill', bigIdeas: [], practices: [5], after: 'means' });
  m.concepts.push({ id: 'sd', term: 'standard deviation', aliases: [], taughtIn: 'sd', dependsOn: [] });
  m.topics[2].after = 'water';
  assert.ok(errorsOf(m).some(e => e.includes('must name a unit topic')));
  const u = tiny();
  u.topics[0].after = 'cells';
  assert.ok(errorsOf(u).some(e => e.includes('only skills and drills take "after"')));
});

test('the token "ap" in an id fails; "map" inside a word does not', () => {
  assert.ok(hasApToken('ap-water'));
  assert.ok(hasApToken('apbio-cells'));
  assert.ok(!hasApToken('gene-map'));
  assert.ok(!hasApToken('chapter-one'));
  const m = tiny();
  m.concepts[0].id = 'ap-polarity';
  m.concepts[1].dependsOn = ['ap-polarity'];
  assert.ok(errorsOf(m).some(e => e.includes('token "ap"')));
});

test('weights must be ranges that can add to 100%, and CED numbers must run in order', () => {
  const m = tiny();
  m.chapters[0].weight = [10, 20];
  assert.ok(errorsOf(m).some(e => e.includes('cannot add to 100%')));
  const n = tiny();
  n.chapters[1].weight = [60, 40];
  assert.ok(errorsOf(n).some(e => e.includes('weight must be')));
  const c = tiny();
  c.topics[1].ced = '2.2';
  assert.ok(errorsOf(c).some(e => e.includes('expected "2.1"')));
});

test('a page may not use a term before the topic that teaches it', () => {
  const problems = scanPage(tiny(), page('Water is polar and dissolves things in organelles.'), 'water');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /organelle/);
});

test('the same use inside a preview box or a nav reference passes', () => {
  const html = '<body><aside class="bio-preview"><div><p>An organelle is a compartment.</p></div></aside><p>Water is polar.</p><a class="bio-nav-ref">Next: organelles</a></body>';
  assert.deepEqual(scanPage(tiny(), html, 'water'), []);
  assert.doesNotMatch(stripForScan(html), /organelle/);
});

test('a skill page may use what its anchor taught but not what comes later', () => {
  assert.deepEqual(scanPage(tiny(), page('The sample mean of polar solvents.'), 'means'), []);
  assert.equal(scanPage(tiny(), page('Count organelles.'), 'means').length, 1);
});

test('a qualified label is not scanned; an acronym matches by case', () => {
  const m = tiny();
  m.concepts[1].aliases = ['ATP'];
  assert.deepEqual(scanPage(m, page('The mean of the data. Atp? No.'), 'water'), []);
  assert.equal(scanPage(m, page('ATP is made.'), 'water').length, 1);
});

test('an everyday word may be used early; the technical term may not', () => {
  const m = tiny();
  m.concepts[1].aliases = ['organelles', 'cell', 'cells'];
  m.everydayWords = { words: ['cell', 'cells'] };
  assert.deepEqual(scanPage(m, page('Water fills the cell.'), 'water'), []);
  assert.equal(scanPage(m, page('Water fills organelles.'), 'water').length, 1);
  m.everydayWords.words.push('celz');
  assert.ok(errorsOf(m).some(e => e.includes('celz')));
});

test('real map: an allowed term containing a later word is not a use of it', () => {
  // "competitive inhibitor" (3.3) holds no later term; "cell membrane" (1.5)
  // is taught by Lipids, so a Lipids page may say it.
  assert.deepEqual(scanPage(real, page('A phospholipid bilayer forms the cell membrane.'), 'lipids'), []);
  assert.equal(scanPage(real, page('The Golgi complex packages proteins.'), 'lipids').length, 1);
  assert.deepEqual(scanPage(real, page('Plants make sugar by photosynthesis; DNA holds genes.'), 'water-hydrogen-bonding'), []);
});

test('question banks: q, options, stimulus and why are all read; sets share their stimulus', () => {
  const bank = [
    { id: 'bio-1', q: 'Why is water polar?', options: ['Because of organelles', 'Electronegativity'], why: 'Shared electrons.' },
    { id: 'set-1', stimulus: { text: 'Table of polar molecules', rows: [['organelle', '3']] }, questions: [{ id: 'bio-2', q: 'Which is polar?', options: [{ text: 'water' }], why: { text: 'It is.' } }] },
  ];
  const qs = bankQuestions(bank, 'water');
  assert.deepEqual(qs.map(q => q.id), ['bio-1', 'set-1 (stimulus)', 'bio-2']);
  const root = mkdtempSync(join(tmpdir(), 'apbio-'));
  try {
    assert.deepEqual(scanQuestions(tiny(), root), []);       // no bio/ yet: nothing to read
    assert.deepEqual(scanPages(tiny(), root), []);
    mkdirSync(join(root, 'bio', 'data', 'questions'), { recursive: true });
    writeFileSync(join(root, 'bio', 'data', 'questions', 'water.json'), JSON.stringify({ questions: bank }));
    const res = scanQuestions(tiny(), root);
    assert.deepEqual(res.filter(r => r.problems.length).map(r => r.id), ['bio-1', 'set-1 (stimulus)']);
    writeFileSync(join(root, 'bio', 'water.html'), '<html><head><meta name="bio-topic" content="water"></head><body><p>Organelles.</p></body></html>');
    assert.equal(scanPages(tiny(), root)[0].problems.length, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
