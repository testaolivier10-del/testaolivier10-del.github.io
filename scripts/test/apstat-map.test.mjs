/* The AP® Statistics ordering check (scripts/lib/apstat-map.mjs), forked from
   the AP® Calculus AB tests.

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
  splitMath, STAT_TOPICS, FRQ_TYPES,
} from '../lib/apstat-map.mjs';

const real = loadMap(new URL('../../docs/apstat-dependency-map.json', import.meta.url));

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
  for (const c of m.chapters) if (c.tools) c.tools.simulators = (c.tools.simulators || []).filter(s => s.id !== 'ci-capture');
  assert.ok(validateMap(m).errors.some(e => e.includes('simulator ci-capture')));
});

test('the real map has the 55 topics in 5 units, in CED order, with the current weights', () => {
  const units = real.topics.filter(t => t.kind === 'concept');
  assert.equal(units.length, 55);
  assert.deepEqual(units.map(t => t.ced), STAT_TOPICS);
  const course = real.chapters.filter(c => c.part === 'course');
  assert.deepEqual(course.map(c => c.id), ['unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5']);
  assert.deepEqual(course.map(c => units.filter(t => t.chapter === c.id).length), [13, 12, 15, 10, 5]);
  assert.deepEqual(course.map(c => c.weight), [[20, 30], [15, 25], [15, 25], [10, 20], [10, 20]]);
  assert.equal(units.find(t => t.id === 'two-categorical-displays').ced, '2.1', 'two-way tables open Unit 2');
  assert.equal(units.find(t => t.id === 'sampling-distributions').chapter, 'unit-2', 'the CLT is in Unit 2');
  assert.equal(units.find(t => t.id === 'least-squares-regression').ced, '5.5');
  // Content removed for 2026-27 has no concept (decision 8).
  assert.ok(!real.concepts.some(c => /geometric|goodness|transformation|slope t|inference for (the )?slope|combining random|pooled t|pooled two-sample t/i.test([c.term, ...c.aliases].join(' '))));
  for (const t of real.topics) assert.ok(!hasApToken(t.id) && !/ap/i.test(t.id), t.id);
  const types = new Set(real.chapters.flatMap(c => ((c.tools || {}).frqThemes || []).map(f => f.type)));
  assert.deepEqual([...types].sort(), [...FRQ_TYPES].sort(), 'every FRQ type is planned');
});

test('the math chapter sits before the topic that first needs each skill', () => {
  const order = courseOrder(real);
  const at = id => order.findIndex(t => t.id === id);
  assert.equal(order[at('math-fractions-percents') + 1].id, 'one-categorical-tables');
  assert.equal(order[at('math-formulas') + 1].id, 'summary-statistics');
  assert.equal(order[at('math-inequality-words') + 1].id, 'probability-intro');
  assert.equal(order[at('math-counting') + 1].id, 'binomial-distribution');
  assert.equal(order[at('math-lines') + 1].id, 'scatterplots');
  assert.ok(real.topics.filter(t => t.kind === 'skill').every(t => t.before && !t.after));
  const taught = id => at(real.concepts.find(c => c.id === id).taughtIn);
  for (const c of real.concepts) for (const d of c.dependsOn) assert.ok(taught(d) <= taught(c.id), `${c.id} uses ${d}`);
  // The statistics spine is in order.
  const chain = ['variable', 'mean', 'z-score', 'random-assignment', 'conditional-probability', 'binomial', 'normal-distribution', 'clt', 'confidence-interval', 'p-value', 'type-i', 'chi-square', 't-distribution', 'two-sample-t-test', 'correlation', 'lsrl'];
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
  assert.ok(hasApToken('apstat-cells'));
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
  const html = '<body><aside class="stat-preview"><div><p>An organelle is a compartment.</p></div></aside><p>Water is polar.</p><a class="stat-nav-ref">Next: organelles</a></body>';
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
  assert.deepEqual(scanPage(real, page('The median and the quartiles of the data resist outliers.'), 'summary-statistics'), []);
  assert.match(scanPage(real, page('Find the p-value of the test.'), 'binomial-distribution').join(' '), /p-value/);
  assert.match(scanPage(real, page('A simple random sample of 40 students.'), 'variables').join(' '), /srs/);
  // Everyday words are fine early: a random draw, a likely outcome.
  assert.deepEqual(scanPage(real, page('Draw a name at random; the outcome is likely.'), 'intro-statistics'), []);
});

test('notation is read in math: a p-hat before 1.3 fails, H_0 after 3.5 passes', () => {
  assert.match(scanPage(real, page('The value $\\hat{p} = 0.4$.'), 'variables').join(' '), /notation of sample-proportion/);
  assert.deepEqual(scanPage(real, page('The value $\\hat{p} = 0.4$.'), 'one-categorical-tables'), []);
  assert.match(scanPage(real, page('$H_0: p = 0.5$'), 'ci-one-proportion').join(' '), /hypotheses/);
  assert.deepEqual(scanPage(real, page('$H_0: p = 0.5$'), 'test-one-proportion-setup'), []);
  assert.match(scanPage(real, page('$P(A \\mid B) = 0.3$'), 'mutually-exclusive').join(' '), /conditional-probability/);
  assert.match(scanPage(real, page('$\\chi^2 = 4.1$'), 'test-two-proportions').join(' '), /chi-square/);
  assert.deepEqual(scanPage(real, page('It costs \\$5 and \\$7.'), 'intro-statistics'), []);
  const built = '<p>See <math><semantics><mrow><mi>p</mi></mrow><annotation encoding="application/x-tex">\\hat{p}_1 - \\hat{p}_2</annotation></semantics></math>.</p>';
  assert.match(scanPage(real, page(built), 'p-values').join(' '), /diff-proportions/);
  const m = JSON.parse(JSON.stringify(real));
  m.concepts.find(c => c.id === 'hypotheses').notation = ['(unclosed'];
  assert.ok(errorsOf(m).some(e => e.includes('notation')));
});

test('splitMath keeps prose and math apart', () => {
  const { prose, tex } = splitMath('Area $A = \\pi r^2$ and $$\\sum_{i=1}^n i$$ for \\$3.');
  assert.deepEqual(tex, ['A = \\pi r^2', '\\sum_{i=1}^n i']);
  assert.match(prose, /for \$3\./);
});

test('a CED number out of order, or an unknown skill, fails the map', () => {
  const m = JSON.parse(JSON.stringify(real));
  m.topics.find(t => t.id === 'residuals').ced = '5.6';
  assert.ok(errorsOf(m).some(e => e.includes('5.6')));
  const n = JSON.parse(JSON.stringify(real));
  n.topics.find(t => t.id === 'residuals').skills = ['3.F'];
  assert.ok(errorsOf(n).some(e => e.includes('unknown skill')));
});

test('question banks: q, options, stimulus and why are all read; sets share their stimulus', () => {
  const bank = [
    { id: 'stat-1', q: 'Why is water polar?', options: ['Because of organelles', 'Electronegativity'], why: 'Shared electrons.' },
    { id: 'set-1', stimulus: { text: 'Table of polar molecules', rows: [['organelle', '3']] }, questions: [{ id: 'stat-2', q: 'Which is polar?', options: [{ text: 'water' }], why: { text: 'It is.' } }] },
  ];
  const qs = bankQuestions(bank, 'water');
  assert.deepEqual(qs.map(q => q.id), ['stat-1', 'set-1 (stimulus)', 'stat-2']);
  const root = mkdtempSync(join(tmpdir(), 'apstat-'));
  try {
    assert.deepEqual(scanQuestions(tiny(), root), []);       // no statistics/ yet: nothing to read
    assert.deepEqual(scanPages(tiny(), root), []);
    mkdirSync(join(root, 'statistics', 'data', 'questions'), { recursive: true });
    writeFileSync(join(root, 'statistics', 'data', 'questions', 'water.json'), JSON.stringify({ questions: bank }));
    const res = scanQuestions(tiny(), root);
    assert.deepEqual(res.filter(r => r.problems.length).map(r => r.id), ['stat-1', 'set-1 (stimulus)']);
    writeFileSync(join(root, 'statistics', 'water.html'), '<html><head><meta name="stat-topic" content="water"></head><body><p>Organelles.</p></body></html>');
    assert.equal(scanPages(tiny(), root)[0].problems.length, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
