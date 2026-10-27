/* The AP® Psychology ordering check (scripts/lib/appsych-map.mjs), forked from
   the AP® Environmental Science tests.

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
  splitMath, PSY_TOPICS, FRQ_TYPES,
} from '../lib/appsych-map.mjs';

const real = loadMap(new URL('../../docs/appsych-dependency-map.json', import.meta.url));

function tiny() {
  return {
    bigIdeas: [],
    practices: [{ id: 1, name: 'Concepts', mcqWeight: [60, 70] }, { id: 3, name: 'Data', mcqWeight: [5, 15] }],
    parts: [{ id: 'course', title: 'Course' }, { id: 'skills', title: 'Skills' }],
    chapters: [
      { id: 'unit-1', n: 1, part: 'course', title: 'One', weight: [40, 60], tools: { pathways: [{ title: 'Path', topic: 'water' }] } },
      { id: 'unit-2', n: 2, part: 'course', title: 'Two', weight: [40, 60], tools: {} },
      { id: 'skills-stats', part: 'skills', title: 'Stats', tools: {} },
    ],
    topics: [
      { id: 'water', ced: '1.1', title: 'Water', chapter: 'unit-1', kind: 'concept', skills: ['1.A'], practices: [1] },
      { id: 'cells', ced: '2.1', title: 'Cells', chapter: 'unit-2', kind: 'concept', skills: ['1.A'], practices: [1] },
      { id: 'means', ced: null, title: 'Means', chapter: 'skills-stats', kind: 'skill', skills: ['3.B'], practices: [3], after: 'water' },
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

test('every trainer in the spec must be planned, and every FRQ type six times', () => {
  const m = JSON.parse(JSON.stringify(real));
  for (const c of m.chapters) if (c.tools) c.tools.simulators = (c.tools.simulators || []).filter(s => s.id !== 'brain-map');
  assert.ok(validateMap(m).errors.some(e => e.includes('simulator brain-map')));
  const n = JSON.parse(JSON.stringify(real));
  for (const c of n.chapters) if (c.tools) c.tools.frqThemes = (c.tools.frqThemes || []).filter(f => f.type !== 'ebq');
  assert.ok(validateMap(n).errors.some(e => e.includes('type ebq')));
});

test('the real map has the 35 topics in 5 units, in CED order, with the official weights and focus skills', () => {
  const units = real.topics.filter(t => t.kind === 'concept');
  assert.equal(units.length, 35);
  assert.deepEqual(units.map(t => t.ced), PSY_TOPICS);
  const course = real.chapters.filter(c => c.part === 'course');
  assert.deepEqual(course.map(c => c.id), ['unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5']);
  assert.deepEqual(course.map(c => units.filter(t => t.chapter === c.id).length), [6, 8, 9, 7, 5]);
  assert.deepEqual(course.map(c => c.weight), [[15, 25], [15, 25], [15, 25], [15, 25], [15, 25]]);
  assert.equal(units.find(t => t.id === 'neural-firing').title, 'The Neuron and Neural Firing');
  assert.equal(units.find(t => t.id === 'attribution').title, 'Attribution Theory and Person Perception', 'the official title, without "Locus of Control"');
  assert.equal(units.find(t => t.id === 'treatment').ced, '5.5');
  assert.ok(units.every(t => t.skills.length && t.skills.every(s => !['4.A', '4.B'].includes(s))), 'argumentation is Section II only');
  for (const t of real.topics) assert.ok(!hasApToken(t.id) && !/ap/i.test(t.id), t.id);
  const types = new Set(real.chapters.flatMap(c => ((c.tools || {}).frqThemes || []).map(f => f.type)));
  assert.deepEqual([...types].sort(), [...FRQ_TYPES].sort(), 'every FRQ type is planned');
  const frqs = real.chapters.flatMap(c => ((c.tools || {}).frqThemes || []));
  for (const ty of FRQ_TYPES) assert.ok(frqs.filter(f => f.type === ty).length >= 6, ty);
  assert.ok(frqs.every(f => /^[A-G]$/.test(f.author)), 'each theme names its author');
});

test('the research skills chapter sits right before the topic that first needs each skill', () => {
  const order = courseOrder(real);
  const at = id => order.findIndex(t => t.id === id);
  assert.ok(at('research-methods') < at('heredity-environment') && at('research-sampling') < at('heredity-environment') && at('stats-correlation') < at('heredity-environment'), 'twin studies need methods, samples and correlation');
  assert.equal(order[at('research-ethics') + 1].id, 'brain', 'lesioning and animal research first appear in 1.4');
  assert.ok(['stats-descriptive', 'stats-normal', 'stats-significance'].every(id => at(id) < at('intelligence') && at(id) > at('forgetting')), 'the statistics land right before 2.8, where IQ needs them');
  assert.ok(real.topics.filter(t => t.kind === 'skill').every(t => t.before && !t.after));
  const taught = id => at(real.concepts.find(c => c.id === id).taughtIn);
  for (const c of real.concepts) for (const d of c.dependsOn) assert.ok(taught(d) <= taught(c.id), `${c.id} uses ${d}`);
  const chain = ['experiment', 'random-sampling', 'twin-study', 'action-potential', 'informed-consent', 'split-brain', 'rem', 'opponent-process', 'schema', 'working-memory', 'misinformation', 'normal-curve', 'iq', 'conservation', 'classical-conditioning', 'variable-ratio', 'fae', 'cognitive-dissonance', 'bystander', 'big-five', 'gas', 'diathesis-stress', 'mdd', 'cbt'];
  for (let i = 1; i < chain.length; i++) assert.ok(taught(chain[i - 1]) <= taught(chain[i]), `${chain[i - 1]} before ${chain[i]}`);
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
  m.topics.push({ id: 'sd', ced: null, title: 'SD', chapter: 'skills-stats', kind: 'skill', skills: ['3.B'], practices: [3], after: 'means' });
  m.concepts.push({ id: 'sd', term: 'standard deviation', aliases: [], taughtIn: 'sd', dependsOn: [] });
  m.topics[2].after = 'water';
  assert.ok(errorsOf(m).some(e => e.includes('must name a unit topic')));
  const u = tiny();
  u.topics[0].after = 'cells';
  assert.ok(errorsOf(u).some(e => e.includes('only skills take "after" or "before"')));
});

test('the token "ap" in an id fails; "map" inside a word does not', () => {
  assert.ok(hasApToken('ap-water'));
  assert.ok(hasApToken('appsych-cells'));
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
  const html = '<body><aside class="psy-preview"><div><p>An organelle is a compartment.</p></div></aside><p>Water is polar.</p><a class="psy-nav-ref">Next: organelles</a></body>';
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

test('real map: a term taught later fails', () => {
  assert.deepEqual(scanPage(real, page('Neurons fire when a stimulus is strong enough.'), 'neural-firing'), []);
  assert.match(scanPage(real, page('Operant conditioning explains the habit.'), 'brain').join(' '), /operant-conditioning/);
  assert.match(scanPage(real, page('This is the fundamental attribution error.'), 'sleep').join(' '), /fae/);
  // Everyday words are fine early: the brain, memory, stress, sleep.
  assert.deepEqual(scanPage(real, page('The brain stores memory, and stress hurts sleep.'), 'heredity-environment'), []);
});

test('notation is read in math: a mean or a z score before its skill fails', () => {
  assert.match(scanPage(real, page('$\\bar{x} = 5$'), 'research-methods').join(' '), /notation of mean/);
  assert.deepEqual(scanPage(real, page('$\\bar{x} = 5$'), 'intelligence'), []);
  assert.match(scanPage(real, page('$z = 2$'), 'forgetting').join(' '), /notation of z-score/);
  assert.deepEqual(scanPage(real, page('It costs \\$5 and \\$7.'), 'heredity-environment'), []);
  const m = JSON.parse(JSON.stringify(real));
  m.concepts.find(c => c.id === 'mean').notation = ['(unclosed'];
  assert.ok(errorsOf(m).some(e => e.includes('notation')));
});

test('splitMath keeps prose and math apart', () => {
  const { prose, tex } = splitMath('Area $A = \\pi r^2$ and $$\\sum_{i=1}^n i$$ for \\$3.');
  assert.deepEqual(tex, ['A = \\pi r^2', '\\sum_{i=1}^n i']);
  assert.match(prose, /for \$3\./);
});

test('a CED number out of order, an unknown skill, a missing skill, or argumentation as a focus fails the map', () => {
  const m = JSON.parse(JSON.stringify(real));
  m.topics.find(t => t.id === 'nervous-system').ced = '1.7';
  assert.ok(errorsOf(m).some(e => e.includes('1.7')));
  const n = JSON.parse(JSON.stringify(real));
  n.topics.find(t => t.id === 'nervous-system').skills = ['7.G'];
  assert.ok(errorsOf(n).some(e => e.includes('unknown skill')));
  const o = JSON.parse(JSON.stringify(real));
  o.topics.find(t => t.id === 'nervous-system').skills = ['4.A'];
  o.topics.find(t => t.id === 'nervous-system').practices = [4];
  assert.ok(errorsOf(o).some(e => e.includes('not assessed')));
  const p = JSON.parse(JSON.stringify(real));
  p.topics.find(t => t.id === 'nervous-system').skills = [];
  assert.ok(errorsOf(p).some(e => e.includes('no focus skills')));
});

test('question banks: q, options, stimulus and why are all read; sets share their stimulus', () => {
  const bank = [
    { id: 'psy-1', q: 'Why is water polar?', options: ['Because of organelles', 'Electronegativity'], why: 'Shared electrons.' },
    { id: 'set-1', stimulus: { text: 'Table of polar molecules', rows: [['organelle', '3']] }, questions: [{ id: 'psy-2', q: 'Which is polar?', options: [{ text: 'water' }], why: { text: 'It is.' } }] },
  ];
  const qs = bankQuestions(bank, 'water');
  assert.deepEqual(qs.map(q => q.id), ['psy-1', 'set-1 (stimulus)', 'psy-2']);
  const root = mkdtempSync(join(tmpdir(), 'appsych-'));
  try {
    assert.deepEqual(scanQuestions(tiny(), root), []);       // no psychology/ yet: nothing to read
    assert.deepEqual(scanPages(tiny(), root), []);
    mkdirSync(join(root, 'psychology', 'data', 'questions'), { recursive: true });
    writeFileSync(join(root, 'psychology', 'data', 'questions', 'water.json'), JSON.stringify({ questions: bank }));
    const res = scanQuestions(tiny(), root);
    assert.deepEqual(res.filter(r => r.problems.length).map(r => r.id), ['psy-1', 'set-1 (stimulus)']);
    writeFileSync(join(root, 'psychology', 'water.html'), '<html><head><meta name="psy-topic" content="water"></head><body><p>Organelles.</p></body></html>');
    assert.equal(scanPages(tiny(), root)[0].problems.length, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
