/* The AP® Calculus AB ordering check (scripts/lib/apcalc-map.mjs).

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
  splitMath, AB_TOPICS, BC_ONLY, FRQ_TYPES,
} from '../lib/apcalc-map.mjs';

const real = loadMap(new URL('../../docs/apcalc-dependency-map.json', import.meta.url));

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
  for (const c of m.chapters) if (c.tools) c.tools.simulators = (c.tools.simulators || []).filter(s => s.id !== 'tangent-tracer');
  assert.ok(validateMap(m).errors.some(e => e.includes('simulator tangent-tracer')));
});

test('the real map has the 81 AB topics in 8 units, in CED order, BC-only numbers skipped, with the current weights', () => {
  const units = real.topics.filter(t => t.kind === 'concept');
  assert.equal(units.length, 81);
  assert.deepEqual(units.map(t => t.ced), AB_TOPICS);
  const course = real.chapters.filter(c => c.part === 'course');
  assert.deepEqual(course.map(c => c.id), ['unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5', 'unit-6', 'unit-7', 'unit-8']);
  assert.deepEqual(course.map(c => units.filter(t => t.chapter === c.id).length), [16, 10, 6, 7, 12, 11, 7, 12]);
  assert.deepEqual(course.map(c => c.weight), [[10, 15], [10, 15], [5, 10], [10, 15], [15, 20], [15, 20], [5, 10], [10, 15]]);
  for (const n of BC_ONLY) assert.ok(!units.some(t => t.ced === n), `${n} is BC only`);
  assert.equal(units.find(t => t.id === 'choosing-integration-methods').ced, '6.14');
  assert.equal(units.find(t => t.id === 'lhospitals-rule').ced, '4.7', "L'Hospital's rule is AB content");
  // BC-only and excluded content has no concept.
  assert.ok(!real.concepts.some(c => /parts|partial fraction|improper|euler|logistic|arc length|shell|series|polar|parametric/i.test([c.term, ...c.aliases].join(' '))));
  for (const t of real.topics) assert.ok(!hasApToken(t.id) && !/ap/i.test(t.id), t.id);
  const types = new Set(real.chapters.flatMap(c => ((c.tools || {}).frqThemes || []).map(f => f.type)));
  assert.deepEqual([...types].sort(), [...FRQ_TYPES].sort(), 'every FRQ type is planned');
});

test('the math chapter sits before the topic that first needs each skill', () => {
  const order = courseOrder(real);
  const at = id => order.findIndex(t => t.id === id);
  assert.deepEqual(order.slice(0, 3).map(t => t.id), ['math-functions', 'math-exponent-rules', 'change-at-an-instant']);
  assert.equal(order[at('math-limit-algebra') + 1].id, 'limit-algebra', 'factoring and rationalizing right before 1.6');
  assert.equal(order[at('math-trig') + 1].id, 'squeeze-theorem', 'trigonometry right before the squeeze theorem');
  assert.ok(at('math-exp-log') < at('continuity-on-intervals'));
  assert.ok(at('math-inverse-functions') < at('inverse-function-derivatives'));
  assert.ok(at('math-geometry') < at('related-rates-intro'));
  assert.ok(real.topics.filter(t => t.kind === 'skill').every(t => t.before && !t.after));
  const taught = id => at(real.concepts.find(c => c.id === id).taughtIn);
  for (const c of real.concepts) for (const d of c.dependsOn) assert.ok(taught(d) <= taught(c.id), `${c.id} uses ${d}`);
  // The calculus spine is in order.
  const chain = ['limit', 'derivative', 'chain-rule', 'related-rates', 'critical-point', 'riemann-sum', 'definite-integral', 'ftc', 'indefinite-integral', 'u-substitution', 'separation-of-variables', 'area-between-curves', 'washer-method'];
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
  assert.ok(hasApToken('apcalc-cells'));
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
  const html = '<body><aside class="calc-preview"><div><p>An organelle is a compartment.</p></div></aside><p>Water is polar.</p><a class="calc-nav-ref">Next: organelles</a></body>';
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
  assert.deepEqual(scanPage(real, page('The limit of the average rate of change gives the slope of the secant line.'), 'derivative-definition'), []);
  assert.match(scanPage(real, page('Use the chain rule here.'), 'power-rule').join(' '), /chain-rule/);
  // Concavity is pulled forward into local linearity (4.6) for over/underestimates.
  assert.deepEqual(scanPage(real, page('The curve is concave up, so the tangent line estimate is an underestimate.'), 'local-linearity'), []);
  assert.equal(scanPage(real, page('A Riemann sum and the Mean Value Theorem.'), 'chain-rule').length, 2);
});

test('notation is read in math: an integral sign before 6.3 fails, a limit after 1.2 passes', () => {
  // Authored text: $...$ is math.
  assert.deepEqual(scanPage(real, page('Find $\\lim_{x \\to 2} (x^2 - 4)$.'), 'limit-laws'), []);
  assert.match(scanPage(real, page('Find $\\int_0^1 x^2\\,dx$.'), 'riemann-sums').join(' '), /definite-integral/);
  assert.match(scanPage(real, page("If $f'(x) = 3$, then"), 'average-and-instant-rates').join(' '), /notation of derivative/);
  assert.deepEqual(scanPage(real, page("If $f'(x) = 3$, then"), 'derivative-definition'), []);
  // An antiderivative with + C belongs to 6.8, not 6.4.
  assert.match(scanPage(real, page('$\\int x\\,dx = \\frac{x^2}{2} + C$'), 'ftc-accumulation').join(' '), /indefinite-integral/);
  // A literal dollar is not math.
  assert.deepEqual(scanPage(real, page('It costs \\$5 and \\$7.'), 'change-at-an-instant'), []);
  // Built pages: the TeX is in the formula's annotation.
  const built = '<p>See <math><semantics><mrow><mo>∫</mo></mrow><annotation encoding="application/x-tex">\\int_0^1 f(x)\\,dx</annotation></semantics></math>.</p>';
  assert.match(scanPage(real, page(built), 'limit-laws').join(' '), /definite-integral/);
  // Words inside \text{} are prose.
  assert.match(scanPage(real, page('$\\text{by the chain rule}$'), 'power-rule').join(' '), /chain-rule/);
  // Bad notation patterns fail the map.
  const m = JSON.parse(JSON.stringify(real));
  m.concepts.find(c => c.id === 'limit').notation = ['(unclosed'];
  assert.ok(errorsOf(m).some(e => e.includes('notation')));
});

test('splitMath keeps prose and math apart', () => {
  const { prose, tex } = splitMath('Area $A = \\pi r^2$ and $$\\sum_{i=1}^n i$$ for \\$3.');
  assert.deepEqual(tex, ['A = \\pi r^2', '\\sum_{i=1}^n i']);
  assert.match(prose, /for \$3\./);
});

test('BC-only topics fail the map', () => {
  const m = JSON.parse(JSON.stringify(real));
  m.topics.find(t => t.id === 'choosing-integration-methods').ced = '6.11';
  assert.ok(errorsOf(m).some(e => e.includes('6.11')));
});

test('question banks: q, options, stimulus and why are all read; sets share their stimulus', () => {
  const bank = [
    { id: 'calc-1', q: 'Why is water polar?', options: ['Because of organelles', 'Electronegativity'], why: 'Shared electrons.' },
    { id: 'set-1', stimulus: { text: 'Table of polar molecules', rows: [['organelle', '3']] }, questions: [{ id: 'calc-2', q: 'Which is polar?', options: [{ text: 'water' }], why: { text: 'It is.' } }] },
  ];
  const qs = bankQuestions(bank, 'water');
  assert.deepEqual(qs.map(q => q.id), ['calc-1', 'set-1 (stimulus)', 'calc-2']);
  const root = mkdtempSync(join(tmpdir(), 'apcalc-'));
  try {
    assert.deepEqual(scanQuestions(tiny(), root), []);       // no calculus/ yet: nothing to read
    assert.deepEqual(scanPages(tiny(), root), []);
    mkdirSync(join(root, 'calculus', 'data', 'questions'), { recursive: true });
    writeFileSync(join(root, 'calculus', 'data', 'questions', 'water.json'), JSON.stringify({ questions: bank }));
    const res = scanQuestions(tiny(), root);
    assert.deepEqual(res.filter(r => r.problems.length).map(r => r.id), ['calc-1', 'set-1 (stimulus)']);
    writeFileSync(join(root, 'calculus', 'water.html'), '<html><head><meta name="calc-topic" content="water"></head><body><p>Organelles.</p></body></html>');
    assert.equal(scanPages(tiny(), root)[0].problems.length, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
