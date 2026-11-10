/* The AP® Microeconomics ordering check (scripts/lib/apmicro-map.mjs), forked from
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
  splitMath, MIC_TOPICS, FRQ_TYPES,
} from '../lib/apmicro-map.mjs';

const real = loadMap(new URL('../../docs/apmicro-dependency-map.json', import.meta.url));

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

test('every trainer in the spec must be planned, and enough FRQ themes of each type, a long one with a graph part', () => {
  const m = JSON.parse(JSON.stringify(real));
  for (const c of m.chapters) if (c.tools) c.tools.simulators = (c.tools.simulators || []).filter(s => s.id !== 'game-lab');
  assert.ok(validateMap(m).errors.some(e => e.includes('simulator game-lab')));
  const n = JSON.parse(JSON.stringify(real));
  for (const c of n.chapters) if (c.tools) c.tools.frqThemes = (c.tools.frqThemes || []).filter(f => f.type !== 'long');
  assert.ok(validateMap(n).errors.some(e => e.includes('type long')));
  const o = JSON.parse(JSON.stringify(real));
  delete o.chapters.find(c => c.id === 'unit-4').tools.frqThemes[0].graph;
  assert.ok(validateMap(o).errors.some(e => e.includes('at least one graph part')));
});

test('the real map has the 36 topics in 6 units, in CED order, with the official weights and focus skills', () => {
  const units = real.topics.filter(t => t.kind === 'concept');
  assert.equal(units.length, 36);
  assert.deepEqual(units.map(t => t.ced), MIC_TOPICS);
  const course = real.chapters.filter(c => c.part === 'course');
  assert.deepEqual(course.map(c => c.id), ['unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5', 'unit-6']);
  assert.deepEqual(course.map(c => units.filter(t => t.chapter === c.id).length), [6, 9, 7, 5, 4, 5]);
  assert.deepEqual(course.map(c => c.weight), [[12, 15], [20, 25], [22, 25], [15, 22], [10, 13], [8, 13]]);
  assert.equal(units.find(t => t.id === 'firm-decisions').title, "Firms' Short-Run Decisions to Produce and Long-Run Decisions to Enter or Exit a Market");
  assert.equal(units.find(t => t.id === 'perfect-competition').ced, '3.7');
  assert.equal(units.find(t => t.id === 'oligopoly-game-theory').ced, '4.5');
  assert.equal(units.find(t => t.id === 'inequality').ced, '6.5');
  assert.deepEqual([...new Set(units.map(t => t.bigIdeas[0]))].sort(), ['CBA', 'MKT', 'POL', 'PRD']);
  assert.ok(units.every(t => t.skills.length && t.bigIdeas.length === 1));
  for (const t of real.topics) assert.ok(!hasApToken(t.id) && !/ap/i.test(t.id), t.id);
  const types = new Set(real.chapters.flatMap(c => ((c.tools || {}).frqThemes || []).map(f => f.type)));
  assert.deepEqual([...types].sort(), [...FRQ_TYPES].sort(), 'every FRQ type is planned');
  const frqs = real.chapters.flatMap(c => ((c.tools || {}).frqThemes || []));
  assert.equal(frqs.filter(f => f.type === 'long').length, 6, 'spec 5a: 6 long');
  assert.equal(frqs.filter(f => f.type === 'short').length, 12, 'spec 5a: 12 short');
  assert.ok(frqs.every(f => /^[A-E]$/.test(f.author)), 'each theme names its author (A to E, spec 5a)');
  const per = a => ['long', 'short'].map(ty => frqs.filter(f => f.author === a && f.type === ty).length);
  assert.deepEqual(['A', 'B', 'C', 'D', 'E'].map(per), [[0, 2], [2, 3], [1, 2], [2, 2], [1, 3]], 'the split of spec 5a');
});

test('the graph skills chapter sits before Unit 1, in its order', () => {
  const order = courseOrder(real);
  assert.deepEqual(order.slice(0, 5).map(t => t.id), ['axes-points', 'slopes-curves', 'shifts-movements', 'curves-crossing', 'scarcity']);
  assert.ok(real.topics.filter(t => t.kind === 'skill').every(t => t.before === 'scarcity' && !t.after));
  const at = id => order.findIndex(t => t.id === id);
  const taught = id => at(real.concepts.find(c => c.id === id).taughtIn);
  for (const c of real.concepts) for (const d of c.dependsOn) assert.ok(taught(d) <= taught(c.id), `${c.id} uses ${d}`);
  const chain = ['shift-curve', 'ppc', 'marginal-utility', 'demand', 'price-elasticity', 'equilibrium', 'consumer-surplus', 'deadweight-loss', 'tariff', 'marginal-product', 'average-costs', 'profit-max-rule', 'firm-demand', 'monopoly', 'nash-equilibrium', 'mrp', 'hiring-rule', 'monopsony', 'externality', 'public-good', 'lorenz'];
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
  assert.ok(hasApToken('apmicro-cells'));
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
  const html = '<body><aside class="mic-preview"><div><p>An organelle is a compartment.</p></div></aside><p>Water is polar.</p><a class="mic-nav-ref">Next: organelles</a></body>';
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
  assert.deepEqual(scanPage(real, page('Demand slopes down: the law of demand.'), 'demand'), []);
  assert.match(scanPage(real, page('The deadweight loss explains it.'), 'scarcity').join(' '), /deadweight-loss/);
  assert.match(scanPage(real, page('This firm hires where MRP equals the wage.'), 'perfect-competition').join(' '), /mrp/);
  // Everyday words are fine early: trade, demand, supply, a tax, a wage.
  assert.deepEqual(scanPage(real, page('People trade, and a tax raises the price buyers pay; supply and demand meet.'), 'scarcity'), []);
});

test('notation is read in math, and an unreadable pattern fails', () => {
  assert.deepEqual(scanPage(real, page('It costs \\$5 and \\$7.'), 'scarcity'), []);
  const m = JSON.parse(JSON.stringify(real));
  m.concepts.find(c => c.id === 'mrp').notation = ['(unclosed'];
  assert.ok(errorsOf(m).some(e => e.includes('notation')));
  m.concepts.find(c => c.id === 'mrp').notation = ['\\\\text\\{MRP\\}'];
  assert.ok(!errorsOf(m).some(e => e.includes('notation')));
  assert.match(scanPage(m, page('$\\text{MRP} = 40$'), 'scarcity').join(' '), /notation of mrp/);
});

test('splitMath keeps prose and math apart', () => {
  const { prose, tex } = splitMath('Area $A = \\pi r^2$ and $$\\sum_{i=1}^n i$$ for \\$3.');
  assert.deepEqual(tex, ['A = \\pi r^2', '\\sum_{i=1}^n i']);
  assert.match(prose, /for \$3\./);
});

test('a CED number out of order, an unknown skill or a missing skill fails the map; graphing may be a topic focus', () => {
  const m = JSON.parse(JSON.stringify(real));
  m.topics.find(t => t.id === 'demand').ced = '1.7';
  assert.ok(errorsOf(m).some(e => e.includes('1.7')));
  const n = JSON.parse(JSON.stringify(real));
  n.topics.find(t => t.id === 'demand').skills = ['7.G'];
  assert.ok(errorsOf(n).some(e => e.includes('unknown skill')));
  const o = JSON.parse(JSON.stringify(real));
  o.topics.find(t => t.id === 'demand').skills = ['4.A'];
  o.topics.find(t => t.id === 'demand').practices = [4];
  assert.deepEqual(errorsOf(o), [], 'graphing is a topic focus (FRQ only on items)');
  const p = JSON.parse(JSON.stringify(real));
  p.topics.find(t => t.id === 'demand').skills = [];
  assert.ok(errorsOf(p).some(e => e.includes('no focus skills')));
});

test('question banks: q, options, stimulus and why are all read; sets share their stimulus', () => {
  const bank = [
    { id: 'mic-1', q: 'Why is water polar?', options: ['Because of organelles', 'Electronegativity'], why: 'Shared electrons.' },
    { id: 'set-1', stimulus: { text: 'Table of polar molecules', rows: [['organelle', '3']] }, questions: [{ id: 'mic-2', q: 'Which is polar?', options: [{ text: 'water' }], why: { text: 'It is.' } }] },
  ];
  const qs = bankQuestions(bank, 'water');
  assert.deepEqual(qs.map(q => q.id), ['mic-1', 'set-1 (stimulus)', 'mic-2']);
  const root = mkdtempSync(join(tmpdir(), 'apmicro-'));
  try {
    assert.deepEqual(scanQuestions(tiny(), root), []);       // no microeconomics/ yet: nothing to read
    assert.deepEqual(scanPages(tiny(), root), []);
    mkdirSync(join(root, 'microeconomics', 'data', 'questions'), { recursive: true });
    writeFileSync(join(root, 'microeconomics', 'data', 'questions', 'water.json'), JSON.stringify({ questions: bank }));
    const res = scanQuestions(tiny(), root);
    assert.deepEqual(res.filter(r => r.problems.length).map(r => r.id), ['mic-1', 'set-1 (stimulus)']);
    writeFileSync(join(root, 'microeconomics', 'water.html'), '<html><head><meta name="mic-topic" content="water"></head><body><p>Organelles.</p></body></html>');
    assert.equal(scanPages(tiny(), root)[0].problems.length, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

/* Integration 2026-11-09 (docs/apmicro-reviews/integration.md). */
test('the mark "AP®" is not the average-product alias "AP"; a bare "AP" still is', () => {
  for (const mark of ['AP®', 'AP&reg;', 'AP&#174;', 'AP<sup>®</sup>'])
    assert.deepEqual(scanPage(real, `<p>Practice for the ${mark} Microeconomics exam.</p>`, 'scarcity'), [], mark);
  assert.equal(scanPage(real, '<p>The AP of labor falls.</p>', 'scarcity').length, 1);
});
test('a declared preview is honored by its mic-preview class (not psy-preview)', () => {
  const m = tiny();
  m.topics[0].previews = [{ concept: 'organelle', reason: 'a look ahead' }];
  m.circularDependencies = [{ id: 'x', problem: 'p', detail: 'd', resolution: 'preview', into: ['water'], concepts: ['organelle'] }];
  const page = c => `<p>Organelles are named here.</p><div class="${c}" data-concept="organelle">organelles</div>`;
  assert.deepEqual(scanPage(m, page('mic-preview'), 'water'), []);
  assert.equal(scanPage(m, page('psy-preview'), 'water').length, 1);
});
test('engine words in a mic-noscan span are not read', () => {
  assert.deepEqual(scanPage(real, '<li>Key: <span class="mic-noscan">shade consumer surplus</span></li>', 'axes-points'), []);
  assert.equal(scanPage(real, '<li>Key: shade consumer surplus</li>', 'axes-points').length, 1);
});
test('general cost words: total cost from 1.5, marginal cost from 1.6, technology everyday from 1.3, lump-sum tax from 3.2', () => {
  assert.ok(scanPage(real, '<p>Compare total benefit with total cost.</p>', 'comparative-advantage').some(p => p.includes('(total-cost)')));
  assert.deepEqual(scanPage(real, '<p>Compare total benefit with total cost.</p>', 'cost-benefit'), []);
  assert.ok(scanPage(real, '<p>Stop where MB = MC: marginal cost.</p>', 'cost-benefit').some(p => p.includes('(marginal-cost)')));
  assert.deepEqual(scanPage(real, '<p>Stop where MB = MC: marginal cost.</p>', 'marginal-analysis'), []);
  assert.deepEqual(scanPage(real, '<p>Better technology shifts the PPC out.</p>', 'production-possibilities'), []);
  assert.ok(scanPage(real, '<p>The determinants of supply.</p>', 'production-possibilities').some(p => p.includes('(supply-shifter)')));
  assert.ok(scanPage(real, '<p>A lump-sum tax raises ATC.</p>', 'production-function').some(p => p.includes('(lump-sum-tax)')));
  assert.deepEqual(scanPage(real, '<p>A lump-sum tax raises ATC.</p>', 'short-run-costs'), []);
  const C = id => real.concepts.find(c => c.id === id);
  assert.deepEqual(C('productive-efficiency').fullIn, ['perfect-competition']);
  assert.equal(C('allocative-efficiency').taughtIn, 'perfect-competition');
  assert.deepEqual(validateMap(real).errors, []);
});
