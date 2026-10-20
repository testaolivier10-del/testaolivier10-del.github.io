/* The AP® Environmental Science ordering check (scripts/lib/apenv-map.mjs), forked from
   the AP® Statistics tests.

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
  splitMath, ENV_TOPICS, FRQ_TYPES,
} from '../lib/apenv-map.mjs';

const real = loadMap(new URL('../../docs/apenv-dependency-map.json', import.meta.url));

function tiny() {
  return {
    bigIdeas: [{ id: 'ERT', name: 'Earth systems' }],
    practices: [{ id: 1, name: 'Concepts', mcqWeight: [25, 33] }, { id: 5, name: 'Stats', mcqWeight: [8, 14] }],
    parts: [{ id: 'course', title: 'Course' }, { id: 'skills', title: 'Skills' }],
    chapters: [
      { id: 'unit-1', n: 1, part: 'course', title: 'One', weight: [40, 60], tools: { pathways: [{ title: 'Path', topic: 'water' }] } },
      { id: 'unit-2', n: 2, part: 'course', title: 'Two', weight: [40, 60], tools: {} },
      { id: 'skills-stats', part: 'skills', title: 'Stats', tools: {} },
    ],
    topics: [
      { id: 'water', ced: '1.1', title: 'Water', chapter: 'unit-1', kind: 'concept', bigIdeas: ['ERT'], practices: [1] },
      { id: 'cells', ced: '2.1', title: 'Cells', chapter: 'unit-2', kind: 'concept', bigIdeas: ['ERT'], practices: [1] },
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

test('every trainer in the spec must be planned, and every FRQ type four times', () => {
  const m = JSON.parse(JSON.stringify(real));
  for (const c of m.chapters) if (c.tools) c.tools.simulators = (c.tools.simulators || []).filter(s => s.id !== 'dose-response');
  assert.ok(validateMap(m).errors.some(e => e.includes('simulator dose-response')));
  const n = JSON.parse(JSON.stringify(real));
  for (const c of n.chapters) if (c.tools) c.tools.frqThemes = (c.tools.frqThemes || []).filter(f => f.type !== 'calc');
  assert.ok(validateMap(n).errors.some(e => e.includes('type calc')));
});

test('the real map has the 99 topics in 9 units, in CED order, with the official weights and one big idea each', () => {
  const units = real.topics.filter(t => t.kind === 'concept');
  assert.equal(units.length, 99);
  assert.deepEqual(units.map(t => t.ced), ENV_TOPICS);
  const course = real.chapters.filter(c => c.part === 'course');
  assert.deepEqual(course.map(c => c.id), ['unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5', 'unit-6', 'unit-7', 'unit-8', 'unit-9']);
  assert.deepEqual(course.map(c => units.filter(t => t.chapter === c.id).length), [11, 7, 9, 9, 17, 13, 8, 15, 10]);
  assert.deepEqual(course.map(c => c.weight), [[6, 8], [6, 8], [10, 15], [10, 15], [10, 15], [10, 15], [7, 10], [7, 10], [15, 20]]);
  assert.equal(units.find(t => t.id === 'energy-flow').ced, '1.10');
  assert.equal(units.find(t => t.id === 'el-nino-la-nina').title, 'El Niño and La Niña');
  assert.equal(units.find(t => t.id === 'lethal-dose-50').ced, '8.12');
  assert.ok(units.every(t => t.bigIdeas.length === 1 && ['ENG', 'ERT', 'EIN', 'STB'].includes(t.bigIdeas[0])));
  assert.ok(units.every(t => t.skills.every(s => !['3.D', '3.E', '4.D'].includes(s))), 'no topic focuses on an unassessed skill');
  for (const t of real.topics) assert.ok(!hasApToken(t.id) && !/ap/i.test(t.id), t.id);
  const types = new Set(real.chapters.flatMap(c => ((c.tools || {}).frqThemes || []).map(f => f.type)));
  assert.deepEqual([...types].sort(), [...FRQ_TYPES].sort(), 'every FRQ type is planned');
  // Spec 5a: 14 FRQs, each with its author.
  const frqs = real.chapters.flatMap(c => ((c.tools || {}).frqThemes || []));
  assert.equal(frqs.length, 14);
  assert.deepEqual([...new Set(frqs.map(f => f.author))].sort(), ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
});

test('the math chapter sits before the topic that first needs each skill', () => {
  const order = courseOrder(real);
  const at = id => order.findIndex(t => t.id === id);
  assert.equal(order[at('math-sci-notation') + 1].id, 'carbon-cycle');
  assert.ok(at('math-rates') < at('primary-productivity') && at('math-units') < at('primary-productivity'));
  assert.equal(order[at('math-percents') + 1].id, 'energy-flow');
  assert.equal(order[at('math-doubling') + 1].id, 'population-growth');
  assert.ok(real.topics.filter(t => t.kind === 'skill').every(t => t.before && !t.after));
  const taught = id => at(real.concepts.find(c => c.id === id).taughtIn);
  for (const c of real.concepts) for (const d of c.dependsOn) assert.ok(taught(d) <= taught(c.id), `${c.id} uses ${d}`);
  // The spine is in order.
  const chain = ['ecosystem', 'carbon-cycle', 'npp', 'ten-percent-rule', 'carrying-capacity', 'rule-of-70', 'natural-increase', 'soil-texture', 'el-nino', 'drip-irrigation', 'nuclear-fission', 'photochemical-smog', 'eutrophication', 'ld50', 'ozone-depletion', 'greenhouse-effect', 'ocean-acidification'];
  for (let i = 1; i < chain.length; i++) assert.ok(taught(chain[i - 1]) < taught(chain[i]), `${chain[i - 1]} before ${chain[i]}`);
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
  assert.ok(hasApToken('apenv-cells'));
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
  const html = '<body><aside class="env-preview"><div><p>An organelle is a compartment.</p></div></aside><p>Water is polar.</p><a class="env-nav-ref">Next: organelles</a></body>';
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
  assert.deepEqual(scanPage(real, page('Producers capture sunlight by photosynthesis.'), 'primary-productivity'), []);
  assert.match(scanPage(real, page('Nitrogen fixation feeds the soil.'), 'carbon-cycle').join(' '), /nitrogen-fixation/);
  assert.match(scanPage(real, page('The population passed its carrying capacity.'), 'intro-ecosystems').join(' '), /carrying-capacity/);
  // Everyday words are fine early: a predator, fertilizer, erosion.
  assert.deepEqual(scanPage(real, page('A predator eats prey; fertilizer runs off and erosion follows.'), 'intro-ecosystems'), []);
});

test('notation is read in math: NPP before 1.8 fails, scientific notation before its skill fails', () => {
  assert.match(scanPage(real, page('$\\text{NPP} = 300$'), 'carbon-cycle').join(' '), /notation of npp/);
  assert.deepEqual(scanPage(real, page('$\\text{NPP} = \\text{GPP} - R$'), 'energy-flow'), []);
  assert.match(scanPage(real, page('$2.5 \\times 10^6$ people'), 'terrestrial-biomes').join(' '), /scientific-notation/);
  assert.deepEqual(scanPage(real, page('It costs \\$5 and \\$7.'), 'intro-ecosystems'), []);
  const m = JSON.parse(JSON.stringify(real));
  m.concepts.find(c => c.id === 'npp').notation = ['(unclosed'];
  assert.ok(errorsOf(m).some(e => e.includes('notation')));
});

test('splitMath keeps prose and math apart', () => {
  const { prose, tex } = splitMath('Area $A = \\pi r^2$ and $$\\sum_{i=1}^n i$$ for \\$3.');
  assert.deepEqual(tex, ['A = \\pi r^2', '\\sum_{i=1}^n i']);
  assert.match(prose, /for \$3\./);
});

test('a CED number out of order, an unknown or unassessed skill, or a missing big idea fails the map', () => {
  const m = JSON.parse(JSON.stringify(real));
  m.topics.find(t => t.id === 'food-webs').ced = '1.12';
  assert.ok(errorsOf(m).some(e => e.includes('1.12')));
  const n = JSON.parse(JSON.stringify(real));
  n.topics.find(t => t.id === 'food-webs').skills = ['7.G'];
  assert.ok(errorsOf(n).some(e => e.includes('unknown skill')));
  const o = JSON.parse(JSON.stringify(real));
  o.topics.find(t => t.id === 'food-webs').skills = ['3.D'];
  o.topics.find(t => t.id === 'food-webs').practices = [3];
  assert.ok(errorsOf(o).some(e => e.includes('not assessed')));
  const p = JSON.parse(JSON.stringify(real));
  p.topics.find(t => t.id === 'food-webs').bigIdeas = ['SYI'];
  assert.ok(errorsOf(p).some(e => e.includes('big idea')));
});

test('question banks: q, options, stimulus and why are all read; sets share their stimulus', () => {
  const bank = [
    { id: 'env-1', q: 'Why is water polar?', options: ['Because of organelles', 'Electronegativity'], why: 'Shared electrons.' },
    { id: 'set-1', stimulus: { text: 'Table of polar molecules', rows: [['organelle', '3']] }, questions: [{ id: 'env-2', q: 'Which is polar?', options: [{ text: 'water' }], why: { text: 'It is.' } }] },
  ];
  const qs = bankQuestions(bank, 'water');
  assert.deepEqual(qs.map(q => q.id), ['env-1', 'set-1 (stimulus)', 'env-2']);
  const root = mkdtempSync(join(tmpdir(), 'apenv-'));
  try {
    assert.deepEqual(scanQuestions(tiny(), root), []);       // no environmental-science/ yet: nothing to read
    assert.deepEqual(scanPages(tiny(), root), []);
    mkdirSync(join(root, 'environmental-science', 'data', 'questions'), { recursive: true });
    writeFileSync(join(root, 'environmental-science', 'data', 'questions', 'water.json'), JSON.stringify({ questions: bank }));
    const res = scanQuestions(tiny(), root);
    assert.deepEqual(res.filter(r => r.problems.length).map(r => r.id), ['env-1', 'set-1 (stimulus)']);
    writeFileSync(join(root, 'environmental-science', 'water.html'), '<html><head><meta name="env-topic" content="water"></head><body><p>Organelles.</p></body></html>');
    assert.equal(scanPages(tiny(), root)[0].problems.length, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
