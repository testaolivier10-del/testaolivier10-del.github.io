/* The AP® Macroeconomics ordering check (scripts/lib/apmacro-map.mjs), forked from
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
  splitMath, MAC_TOPICS, FRQ_TYPES,
} from '../lib/apmacro-map.mjs';

const real = loadMap(new URL('../../docs/apmacro-dependency-map.json', import.meta.url));

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
  for (const c of m.chapters) if (c.tools) c.tools.simulators = (c.tools.simulators || []).filter(s => s.id !== 'reserves-lab');
  assert.ok(validateMap(m).errors.some(e => e.includes('simulator reserves-lab')));
  const n = JSON.parse(JSON.stringify(real));
  for (const c of n.chapters) if (c.tools) c.tools.frqThemes = (c.tools.frqThemes || []).filter(f => f.type !== 'long');
  assert.ok(validateMap(n).errors.some(e => e.includes('type long')));
  const o = JSON.parse(JSON.stringify(real));
  delete o.chapters.find(c => c.id === 'unit-4').tools.frqThemes[0].graph;
  assert.ok(validateMap(o).errors.some(e => e.includes('at least one graph part')));
});

test('the real map has the 42 topics in 6 units, in CED order, with the official weights and focus skills', () => {
  const units = real.topics.filter(t => t.kind === 'concept');
  assert.equal(units.length, 42);
  assert.deepEqual(units.map(t => t.ced), MAC_TOPICS);
  const course = real.chapters.filter(c => c.part === 'course');
  assert.deepEqual(course.map(c => c.id), ['unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5', 'unit-6']);
  assert.deepEqual(course.map(c => units.filter(t => t.chapter === c.id).length), [6, 7, 9, 7, 7, 6]);
  assert.deepEqual(course.map(c => c.weight), [[5, 10], [12, 17], [17, 27], [18, 23], [20, 30], [10, 13]]);
  assert.equal(units.find(t => t.id === 'opportunity-cost-ppc').title, 'Opportunity Cost and the Production Possibilities Curve (PPC)');
  assert.equal(units.find(t => t.id === 'long-run-self-adjustment').ced, '3.7');
  assert.equal(units.find(t => t.id === 'real-rates-financial-flows').ced, '6.6');
  assert.ok(units.every(t => t.skills.length && t.bigIdeas.length === 1));
  for (const t of real.topics) assert.ok(!hasApToken(t.id) && !/ap/i.test(t.id), t.id);
  const types = new Set(real.chapters.flatMap(c => ((c.tools || {}).frqThemes || []).map(f => f.type)));
  assert.deepEqual([...types].sort(), [...FRQ_TYPES].sort(), 'every FRQ type is planned');
  const frqs = real.chapters.flatMap(c => ((c.tools || {}).frqThemes || []));
  assert.equal(frqs.filter(f => f.type === 'long').length, 6, 'spec 5a: 6 long');
  assert.equal(frqs.filter(f => f.type === 'short').length, 12, 'spec 5a: 12 short');
  assert.ok(frqs.every(f => /^[A-F]$/.test(f.author)), 'each theme names its author');
});

test('the graph skills chapter sits before Unit 1, in its order', () => {
  const order = courseOrder(real);
  assert.deepEqual(order.slice(0, 5).map(t => t.id), ['axes-points', 'slopes-curves', 'shifts-movements', 'curves-crossing', 'scarcity']);
  assert.ok(real.topics.filter(t => t.kind === 'skill').every(t => t.before === 'scarcity' && !t.after));
  const at = id => order.findIndex(t => t.id === id);
  const taught = id => at(real.concepts.find(c => c.id === id).taughtIn);
  for (const c of real.concepts) for (const d of c.dependsOn) assert.ok(taught(d) <= taught(c.id), `${c.id} uses ${d}`);
  const chain = ['curve-shift', 'ppc', 'equilibrium', 'gdp', 'cpi', 'real-gdp', 'ad', 'spending-multiplier', 'sras', 'lras', 'self-adjustment', 'real-rate', 'money-multiplier', 'money-market', 'ample-reserves', 'loanable-funds', 'srpc', 'crowding-out', 'current-account', 'fx-market', 'capital-flows'];
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
  assert.ok(hasApToken('apmacro-cells'));
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
  const html = '<body><aside class="mac-preview"><div><p>An organelle is a compartment.</p></div></aside><p>Water is polar.</p><a class="mac-nav-ref">Next: organelles</a></body>';
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
  assert.deepEqual(scanPage(real, page('Aggregate demand slopes down.'), 'aggregate-demand'), []);
  assert.match(scanPage(real, page('The money multiplier explains it.'), 'scarcity').join(' '), /money-multiplier/);
  assert.match(scanPage(real, page('This is crowding out.'), 'gdp-circular-flow').join(' '), /crowding-out/);
  // Everyday words are fine early: money, trade, inflation, interest.
  assert.deepEqual(scanPage(real, page('People trade goods for money, and inflation raises prices.'), 'scarcity'), []);
});

test('notation is read in math, and an unreadable pattern fails', () => {
  assert.deepEqual(scanPage(real, page('It costs \\$5 and \\$7.'), 'scarcity'), []);
  const m = JSON.parse(JSON.stringify(real));
  m.concepts.find(c => c.id === 'mpc').notation = ['(unclosed'];
  assert.ok(errorsOf(m).some(e => e.includes('notation')));
  m.concepts.find(c => c.id === 'mpc').notation = ['\\\\text\\{MPC\\}'];
  assert.ok(!errorsOf(m).some(e => e.includes('notation')));
  assert.match(scanPage(m, page('$\\text{MPC} = 0.8$'), 'scarcity').join(' '), /notation of mpc/);
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
    { id: 'mac-1', q: 'Why is water polar?', options: ['Because of organelles', 'Electronegativity'], why: 'Shared electrons.' },
    { id: 'set-1', stimulus: { text: 'Table of polar molecules', rows: [['organelle', '3']] }, questions: [{ id: 'mac-2', q: 'Which is polar?', options: [{ text: 'water' }], why: { text: 'It is.' } }] },
  ];
  const qs = bankQuestions(bank, 'water');
  assert.deepEqual(qs.map(q => q.id), ['mac-1', 'set-1 (stimulus)', 'mac-2']);
  const root = mkdtempSync(join(tmpdir(), 'apmacro-'));
  try {
    assert.deepEqual(scanQuestions(tiny(), root), []);       // no macroeconomics/ yet: nothing to read
    assert.deepEqual(scanPages(tiny(), root), []);
    mkdirSync(join(root, 'macroeconomics', 'data', 'questions'), { recursive: true });
    writeFileSync(join(root, 'macroeconomics', 'data', 'questions', 'water.json'), JSON.stringify({ questions: bank }));
    const res = scanQuestions(tiny(), root);
    assert.deepEqual(res.filter(r => r.problems.length).map(r => r.id), ['mac-1', 'set-1 (stimulus)']);
    writeFileSync(join(root, 'macroeconomics', 'water.html'), '<html><head><meta name="mac-topic" content="water"></head><body><p>Organelles.</p></body></html>');
    assert.equal(scanPages(tiny(), root)[0].problems.length, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
