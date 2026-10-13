/* The AP® Physics 1 ordering check (scripts/lib/apphys-map.mjs).

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
} from '../lib/apphys-map.mjs';

const real = loadMap(new URL('../../docs/apphys-dependency-map.json', import.meta.url));

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

test('every trainer in the spec must be planned', () => {
  const m = JSON.parse(JSON.stringify(real));
  for (const c of m.chapters) if (c.tools) c.tools.simulators = (c.tools.simulators || []).filter(s => s.id !== 'free-body-diagrams');
  assert.ok(validateMap(m).errors.some(e => e.includes('simulator free-body-diagrams')));
});

test('the real map has the 43 CED topics in 8 units, in order, with the 2024-25 weights', () => {
  const units = real.topics.filter(t => t.kind === 'concept');
  assert.equal(units.length, 43);
  const course = real.chapters.filter(c => c.part === 'course');
  assert.deepEqual(course.map(c => c.id), ['unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5', 'unit-6', 'unit-7', 'unit-8']);
  assert.deepEqual(course.map(c => units.filter(t => t.chapter === c.id).length), [5, 9, 5, 4, 6, 6, 4, 4]);
  assert.deepEqual(course.find(c => c.n === 2).weight, [18, 23]);
  assert.deepEqual(course.find(c => c.n === 7).weight, [5, 8]);
  // Fluids are Unit 8 since the 2024-25 revision; waves and circuits are gone.
  assert.equal(units.find(t => t.id === 'fluid-flow').ced, '8.4');
  assert.ok(!real.concepts.some(c => /wave|circuit|current/i.test(c.term)));
  for (const t of real.topics) assert.ok(!hasApToken(t.id) && !/ap/i.test(t.id), t.id);
  // Every FRQ theme is one of the four exam types.
  const types = new Set(real.chapters.flatMap(c => ((c.tools || {}).frqThemes || []).map(f => f.type)));
  assert.deepEqual([...types].sort(), ['LAB', 'MR', 'QQT', 'TBR']);
});

test('the math chapter sits before the topic that first needs each skill', () => {
  const order = courseOrder(real);
  const at = id => order.findIndex(t => t.id === id);
  assert.equal(order[0].id, 'math-units', 'units and prefixes come first');
  assert.ok(at('math-symbols') < at('motion-quantities'), 'symbols before the first equation');
  assert.ok(at('math-proportional') < at('motion-representations') && at('math-slopes-areas') < at('motion-representations'), 'proportions, slopes and areas before motion graphs');
  assert.equal(order[at('math-trig-components') + 1].id, 'motion-2d', 'trigonometry right before 2D motion');
  assert.ok(real.topics.filter(t => t.kind === 'skill').every(t => t.before && !t.after));
  // The concepts make the ordering meaningful: the first vector-component use is after trig.
  const taught = id => at(real.concepts.find(c => c.id === id).taughtIn);
  for (const c of real.concepts) for (const d of c.dependsOn) assert.ok(taught(d) <= taught(c.id), `${c.id} uses ${d}`);
});

test('a small valid map passes, and a skill sits right after (or before) its anchor', () => {
  assert.deepEqual(errorsOf(tiny()), []);
  assert.deepEqual(courseOrder(tiny()).map(t => t.id), ['water', 'means', 'cells']);
  const m = tiny();
  delete m.topics[2].after; m.topics[2].before = 'cells';
  assert.deepEqual(courseOrder(m).map(t => t.id), ['water', 'means', 'cells']);
  m.topics[2].before = 'water';
  assert.deepEqual(courseOrder(m).map(t => t.id), ['means', 'water', 'cells']);
  assert.deepEqual(errorsOf(m), []);
  m.topics[2].after = 'water';
  assert.ok(errorsOf(m).some(e => e.includes('not both')));
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
  assert.ok(errorsOf(m).some(e => e.includes('needs an "after" or "before" anchor')));
  m.topics[2].after = 'ghost';
  assert.ok(errorsOf(m).some(e => e.includes('unknown topic "ghost"')));
  m.topics.push({ id: 'sd', ced: null, title: 'SD', chapter: 'skills-stats', kind: 'skill', bigIdeas: [], practices: [5], after: 'means' });
  m.concepts.push({ id: 'sd', term: 'standard deviation', aliases: [], taughtIn: 'sd', dependsOn: [] });
  m.topics[2].after = 'water';
  assert.ok(errorsOf(m).some(e => e.includes('must name a unit topic')));
  const u = tiny();
  u.topics[0].after = 'cells';
  assert.ok(errorsOf(u).some(e => e.includes('only skills take "after" or "before"')));
});

test('the token "ap" in an id fails; "map" inside a word does not', () => {
  assert.ok(hasApToken('ap-water'));
  assert.ok(hasApToken('apphys-cells'));
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
  const html = '<body><aside class="phys-preview"><div><p>An organelle is a compartment.</p></div></aside><p>Water is polar.</p><a class="phys-nav-ref">Next: organelles</a></body>';
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

test('real map: a term taught later fails; the short pulled-forward version is allowed', () => {
  assert.deepEqual(scanPage(real, page('A runner covers a distance of 400 m at an average velocity of 5 m/s.'), 'motion-quantities'), []);
  assert.match(scanPage(real, page('The kinetic energy of the runner grows.'), 'motion-quantities').join(' '), /kinetic-energy/);
  // "weight" is pulled forward into free-body diagrams (2.2).
  assert.deepEqual(scanPage(real, page('Draw the weight from the center of mass.'), 'forces-fbd'), []);
  assert.equal(scanPage(real, page('Buoyancy and torque both matter here.'), 'motion-2d').length, 2);
});

test('question banks: q, options, stimulus and why are all read; sets share their stimulus', () => {
  const bank = [
    { id: 'phys-1', q: 'Why is water polar?', options: ['Because of organelles', 'Electronegativity'], why: 'Shared electrons.' },
    { id: 'set-1', stimulus: { text: 'Table of polar molecules', rows: [['organelle', '3']] }, questions: [{ id: 'phys-2', q: 'Which is polar?', options: [{ text: 'water' }], why: { text: 'It is.' } }] },
  ];
  const qs = bankQuestions(bank, 'water');
  assert.deepEqual(qs.map(q => q.id), ['phys-1', 'set-1 (stimulus)', 'phys-2']);
  const root = mkdtempSync(join(tmpdir(), 'apphys-'));
  try {
    assert.deepEqual(scanQuestions(tiny(), root), []);       // no physics/ yet: nothing to read
    assert.deepEqual(scanPages(tiny(), root), []);
    mkdirSync(join(root, 'physics', 'data', 'questions'), { recursive: true });
    writeFileSync(join(root, 'physics', 'data', 'questions', 'water.json'), JSON.stringify({ questions: bank }));
    const res = scanQuestions(tiny(), root);
    assert.deepEqual(res.filter(r => r.problems.length).map(r => r.id), ['phys-1', 'set-1 (stimulus)']);
    writeFileSync(join(root, 'physics', 'water.html'), '<html><head><meta name="phys-topic" content="water"></head><body><p>Organelles.</p></body></html>');
    assert.equal(scanPages(tiny(), root)[0].problems.length, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
