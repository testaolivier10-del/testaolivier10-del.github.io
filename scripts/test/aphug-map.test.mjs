/* The AP® Human Geography ordering check (scripts/lib/aphug-map.mjs), forked from
   the AP® Psychology tests.

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
  splitMath, HUG_TOPICS, FRQ_TYPES,
} from '../lib/aphug-map.mjs';

const real = loadMap(new URL('../../docs/aphug-dependency-map.json', import.meta.url));

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

test('every trainer in the spec must be planned, and every FRQ type seven times', () => {
  const m = JSON.parse(JSON.stringify(real));
  for (const c of m.chapters) if (c.tools) c.tools.simulators = (c.tools.simulators || []).filter(s => s.id !== 'model-studio');
  assert.ok(validateMap(m).errors.some(e => e.includes('simulator model-studio')));
  const n = JSON.parse(JSON.stringify(real));
  for (const c of n.chapters) if (c.tools) c.tools.frqThemes = (c.tools.frqThemes || []).filter(f => !(f.type === 'two' && f.author === 'G'));
  assert.ok(validateMap(n).errors.some(e => e.includes('type two')));
});

test('the real map has the 68 topics in 7 units, in CED order, with the official titles, weights and big ideas', () => {
  const units = real.topics.filter(t => t.kind === 'concept');
  assert.equal(units.length, 68);
  assert.deepEqual(units.map(t => t.ced), HUG_TOPICS);
  const course = real.chapters.filter(c => c.part === 'course');
  assert.deepEqual(course.map(c => c.id), ['unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5', 'unit-6', 'unit-7']);
  assert.deepEqual(course.map(c => units.filter(t => t.chapter === c.id).length), [7, 12, 8, 10, 12, 11, 8]);
  assert.deepEqual(course.map(c => c.weight), [[8, 10], [12, 17], [12, 17], [12, 17], [12, 17], [12, 17], [12, 17]]);
  const title = ced => units.find(t => t.ced === ced).title;
  assert.equal(title('1.1'), 'Introduction to Maps');
  assert.equal(title('2.5'), 'The Demographic Transition Model');
  assert.equal(title('4.10'), 'Consequences of Centrifugal and Centripetal Forces');
  assert.equal(title('5.8'), 'Von Thünen Model');
  assert.equal(title('6.11'), 'Challenges of Urban Sustainability');
  assert.equal(title('7.8'), 'Sustainable Development');
  assert.ok(units.every(t => t.skills.length && t.bigIdeas.length === 1), 'focus skills and one big idea each');
  for (const t of real.topics) assert.ok(!hasApToken(t.id) && !/ap/i.test(t.id), t.id);
  const frqs = real.chapters.flatMap(c => ((c.tools || {}).frqThemes || []));
  assert.equal(frqs.length, 21);
  for (const ty of FRQ_TYPES) assert.equal(frqs.filter(f => f.type === ty).length, 7, ty);
  for (const a of 'ABCDEFG') assert.deepEqual(frqs.filter(f => f.author === a).map(f => f.type).sort(), ['none', 'one', 'two'], `author ${a}: one of each type`);
});

test('the "Skills you need" chapter sits before Unit 1, and no concept leans on a later one', () => {
  const order = courseOrder(real);
  const at = id => order.findIndex(t => t.id === id);
  assert.deepEqual(order.slice(0, 4).map(t => t.id), ['skills-reading', 'skills-scale', 'skills-frq', 'views-of-the-world']);
  assert.ok(real.topics.filter(t => t.kind === 'skill').every(t => t.before === 'views-of-the-world' && !t.after));
  const taught = id => at(real.concepts.find(c => c.id === id).taughtIn);
  for (const c of real.concepts) for (const d of c.dependsOn) assert.ok(taught(d) <= taught(c.id), `${c.id} uses ${d}`);
  const chain = ['map-scale', 'scale-of-analysis', 'population-density', 'physiological-density', 'population-pyramid', 'rate-of-natural-increase', 'demographic-transition-model', 'dependency-ratio', 'push-factor', 'diffusion', 'stimulus-diffusion', 'sovereignty', 'devolution', 'supranationalism', 'bid-rent-theory', 'von-thunen-model', 'rank-size-rule', 'concentric-zone-model', 'galactic-city-model', 'least-cost-theory', 'world-system-theory', 'comparative-advantage'];
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
  assert.ok(hasApToken('aphug-cells'));
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
  const html = '<body><aside class="hug-preview"><div><p>An organelle is a compartment.</p></div></aside><p>Water is polar.</p><a class="hug-nav-ref">Next: organelles</a></body>';
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
  assert.deepEqual(scanPage(real, page('A choropleth map shades each region by its value.'), 'views-of-the-world'), []);
  assert.match(scanPage(real, page('The von Thünen model explains the rings.'), 'population-distribution').join(' '), /von-thunen-model/);
  assert.match(scanPage(real, page('This is a stimulus diffusion.'), 'culture-intro').join(' '), /stimulus-diffusion/);
  // Everyday words are fine early: population, migration, cities, farms, borders.
  assert.deepEqual(scanPage(real, page('Population and migration shape cities, farms and borders.'), 'views-of-the-world'), []);
});

test('notation is read in math, and a bad notation pattern fails the map', () => {
  const m = JSON.parse(JSON.stringify(real));
  m.concepts.find(c => c.id === 'doubling-time').notation = ['\\\\frac\\{70\\}'];
  assert.match(scanPage(m, page('$\\frac{70}{2} = 35$'), 'population-distribution').join(' '), /notation of doubling-time/);
  assert.deepEqual(scanPage(m, page('$\\frac{70}{2} = 35$'), 'population-dynamics'), []);
  assert.deepEqual(scanPage(real, page('It costs \\$5 and \\$7.'), 'views-of-the-world'), []);
  m.concepts.find(c => c.id === 'doubling-time').notation = ['(unclosed'];
  assert.ok(errorsOf(m).some(e => e.includes('notation')));
});

test('splitMath keeps prose and math apart', () => {
  const { prose, tex } = splitMath('Area $A = \\pi r^2$ and $$\\sum_{i=1}^n i$$ for \\$3.');
  assert.deepEqual(tex, ['A = \\pi r^2', '\\sum_{i=1}^n i']);
  assert.match(prose, /for \$3\./);
});

test('a CED number out of order, an unknown skill, a missing skill or a missing big idea fails the map', () => {
  const m = JSON.parse(JSON.stringify(real));
  m.topics.find(t => t.id === 'data-sources').ced = '1.7';
  assert.ok(errorsOf(m).some(e => e.includes('1.7')));
  const n = JSON.parse(JSON.stringify(real));
  n.topics.find(t => t.id === 'data-sources').skills = ['7.G'];
  assert.ok(errorsOf(n).some(e => e.includes('unknown skill')));
  const o = JSON.parse(JSON.stringify(real));
  o.topics.find(t => t.id === 'data-sources').bigIdeas = [];
  assert.ok(errorsOf(o).some(e => e.includes('big idea')));
  const p = JSON.parse(JSON.stringify(real));
  p.topics.find(t => t.id === 'data-sources').skills = [];
  assert.ok(errorsOf(p).some(e => e.includes('no focus skills')));
});

test('question banks: q, options, stimulus and why are all read; sets share their stimulus', () => {
  const bank = [
    { id: 'hug-1', q: 'Why is water polar?', options: ['Because of organelles', 'Electronegativity'], why: 'Shared electrons.' },
    { id: 'set-1', stimulus: { text: 'Table of polar molecules', rows: [['organelle', '3']] }, questions: [{ id: 'hug-2', q: 'Which is polar?', options: [{ text: 'water' }], why: { text: 'It is.' } }] },
  ];
  const qs = bankQuestions(bank, 'water');
  assert.deepEqual(qs.map(q => q.id), ['hug-1', 'set-1 (stimulus)', 'hug-2']);
  const root = mkdtempSync(join(tmpdir(), 'aphug-'));
  try {
    assert.deepEqual(scanQuestions(tiny(), root), []);       // no human-geography/ yet: nothing to read
    assert.deepEqual(scanPages(tiny(), root), []);
    mkdirSync(join(root, 'human-geography', 'data', 'questions'), { recursive: true });
    writeFileSync(join(root, 'human-geography', 'data', 'questions', 'water.json'), JSON.stringify({ questions: bank }));
    const res = scanQuestions(tiny(), root);
    assert.deepEqual(res.filter(r => r.problems.length).map(r => r.id), ['hug-1', 'set-1 (stimulus)']);
    writeFileSync(join(root, 'human-geography', 'water.html'), '<html><head><meta name="hug-topic" content="water"></head><body><p>Organelles.</p></body></html>');
    assert.equal(scanPages(tiny(), root)[0].problems.length, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
