/* Shared-layer fixes from the integration pass (docs/aphug-reviews/integration.md):
   the drill's model step declares its feedback node before the model mounts
   (mount paints at once and calls onChange), passes the step's figure, and
   labels the picker's first option; the sign slip carries no Psychology
   wording; tool pages load hug-map.js; a free model item in a bank carries
   its figure (modelFigure) to the page; Model Studio's free drills are only
   the demographic transition model's. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBrowser } from './harness.mjs';

const read = f => readFileSync(f, 'utf8');

test('drill(): the feedback node exists before ApHugModel.mount runs; the step figure and the picker label pass through', () => {
  const s = read('human-geography/assets/tools/hug-tools.js');
  const fb = s.indexOf("var fb = el.querySelector('.cd-fb')"), mount = s.indexOf('window.ApHugModel.mount(');
  assert.ok(fb > 0 && mount > 0 && fb < mount, 'var fb before the mount call');
  assert.match(s, /ApHugModel\.html\(s\.model, sid \+ '-m', s\.figureHtml\)/);
  assert.match(s, /mixed: o\.mixedLabel/);
  assert.match(read('human-geography/assets/tools/model-studio.js'), /mixedLabel: 'Any model'/);
});

test('no Psychology leftovers in the runtime: the sign slip, z scores, hypotheses, participants', () => {
  const B = createBrowser();
  for (const f of ['hug-math.js', 'hug-calc.js', 'hug-grade.js', 'hug-map.js', 'hug-model.js', 'tools/hug-tool-math.js']) B.load(`human-geography/assets/${f}`);
  const M = B.window.ApHugMath;
  const d = M.diagnose(M.cell(12), -12);
  assert.equal(d.why, 'The size is right but the sign is wrong.');
  const files = ['hug-grade.js', 'hug-questions.js', 'hug-core.js', 'hug-model.js', 'hug-map.js', 'tools/hug-tools.js', 'tools/hug-tool-math.js', 'tools/hug-plot.js'];
  for (const f of files) {
    const t = read(`human-geography/assets/${f}`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.doesNotMatch(t, /z score|hypothesis|participants|psy-/i, f);
  }
});

test('tool pages load hug-map.js; the trainers no longer load it themselves', () => {
  assert.match(read('scripts/build-aphug.mjs'), /const extra = \['hug-questions\.js', 'hug-map\.js'/);
  for (const f of ['model-studio', 'map-reader', 'scale-lab', 'borders-lab', 'city-lab']) assert.doesNotMatch(read(`human-geography/assets/tools/${f}.js`), /assets\/hug-map\.js/, f);
});

test('a free model item in a bank carries its figure to the page (modelFigure), and the build refuses one without a drawing', async () => {
  const { mkdtempSync, cpSync, mkdirSync, writeFileSync, readFileSync: rf } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { loadCourse, questionForPage, questionHtml } = await import('../lib/aphug-build.mjs');
  const dir = mkdtempSync(join(tmpdir(), 'aphug-free-'));
  cpSync('scripts/test/fixtures/aphug-data', dir, { recursive: true });
  mkdirSync(join(dir, 'figures'), { recursive: true });
  writeFileSync(join(dir, 'figures', 'fixture.json'), JSON.stringify({ 'city-drawing': { file: 'figures/city-drawing.svg', ext: 'svg', w: 720, h: 420, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: 'An invented city with three centers' } }));
  const qf = join(dir, 'questions', 'population-composition.json'), bank = JSON.parse(rf(qf, 'utf8'));
  const model = { layout: 'free', figure: 'city-drawing', slots: [{ id: 'a', box: [10, 10, 20, 10] }, { id: 'b', box: [60, 60, 20, 10] }], pieces: [{ id: 'x', text: 'Central business district' }, { id: 'y', text: 'Heavy industry' }], key: { a: 'x', b: 'y' } };
  const base = bank.items.find(q => q.type === 'model') || bank.items[0];
  bank.items.push({ ...base, id: 'hug-free-1', type: 'model', model, options: undefined, correct: undefined, stimulus: undefined });
  bank.items.push({ ...base, id: 'hug-free-2', type: 'model', model: { ...model, figure: 'nowhere' }, options: undefined, correct: undefined, stimulus: undefined });
  writeFileSync(qf, JSON.stringify(bank));
  const C = loadCourse(undefined, { data: dir, published: ['unit-2'] });
  const q = C.questions['population-composition'].items.find(x => x.id === 'hug-free-1');
  const page = questionForPage(q);
  assert.match(page.modelFigure, /<img src="figures\/city-drawing\.svg" alt="An invented city with three centers"/);
  assert.match(questionHtml(q, 1, '../'), /src="\.\.\/figures\/city-drawing\.svg"[\s\S]*hug-model-spot/, 'the static page re-roots the figure');
  assert.ok(C.mathProblems.some(p => /hug-free-2.*"nowhere" is not in data\/figures/.test(p)));
});

test('Model Studio: only the demographic transition drills are free (spec section 6); the gate does not follow the topic', () => {
  const d = JSON.parse(read('human-geography/data/tools/model-studio.json'));
  assert.deepEqual(d.contexts.filter(c => c.free).map(c => c.id), ['dtm']);
  assert.ok(d.contexts.some(c => c.id === 'epidemiological' && c.topic === 'transition-model' && !c.free), 'the epidemiological drills share the free topic but are not free');
  const s = read('human-geography/assets/tools/model-studio.js');
  assert.match(s, /function locked\(ctx\)\{ var c = core\(\); if\(ctx && ctx\.free\) return false; try\{ return !!\(c && c\.locked && c\.locked\(\)\);/);
});

test('figures carry Enlarge (not labeled figures, not model drawings); hug-nav.js opens a full-size dialog', async () => {
  const { figureImg } = await import('../lib/aphug-build.mjs');
  const C = { figures: { a: { w: 720, h: 400, alt: 'A drawing', labels: [{ id: 'x', name: 'X', box: [1, 1, 10, 10] }] } } };
  assert.match(figureImg(C, 'a', '../'), /<button type="button" class="hug-fig-zoom" data-zoom>Enlarge<span class="sr-only"> the figure<\/span><\/button><\/div>$/);
  assert.doesNotMatch(figureImg(C, 'a', '../', { masks: true }), /hug-fig-zoom/, 'a labeled figure: a tap reveals a label instead');
  const nav = read('human-geography/assets/hug-nav.js');
  for (const w of ["role', 'dialog'", "aria-modal', 'true'", "e.key === 'Escape'", 'Close', 'z.back.focus()']) assert.ok(nav.includes(w), w);
  const css = read('human-geography/assets/hug.css');
  assert.match(css, /@media \(max-width:760px\)\{\.hug-fig-zoom\{display:block;\}/);
});

test('an FRQ page is gated by its latest topic in course order, not by the first unit listed', async () => {
  const { mkdtempSync, cpSync, readFileSync: rf, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { execFileSync } = await import('node:child_process');
  const dir = mkdtempSync(join(tmpdir(), 'aphug-frqgate-'));
  cpSync('scripts/test/fixtures/aphug-data', join(dir, 'data'), { recursive: true });
  const fp = join(dir, 'data', 'frq', 'frq-placeholder-one.json'), f = JSON.parse(rf(fp, 'utf8'));
  f.units = ['unit-1', 'unit-2']; f.topics = ['views-of-the-world', 'population-composition'];
  writeFileSync(fp, JSON.stringify(f));
  execFileSync(process.execPath, ['scripts/build-aphug.mjs', '--out', join(dir, 'out')], { env: { ...process.env, APHUG_DATA: join(dir, 'data'), APHUG_PUBLISHED: 'unit-1,unit-2' } });
  const page = rf(join(dir, 'out', 'frq', 'frq-placeholder-one.html'), 'utf8');
  assert.match(page, /data-frq="frq-placeholder-one" data-unit="unit-2" data-topic="population-composition"/);
});

test('\\$ is the literal dollar sign: never math, printed as $ (the order check reads it as prose)', async () => {
  const { renderMath } = await import('../lib/aphug-build.mjs');
  const { splitMath } = await import('../lib/aphug-map.mjs');
  const r = renderMath({ q: 'GNI per capita of \\$1,145 to \\$4,515, and $2 \\times 3$.' });
  assert.match(r.q, /^GNI per capita of \$1,145 to \$4,515, and <math /);
  assert.equal((r.q.match(/<math/g) || []).length, 1);
  assert.match(splitMath('costs \\$25 and $x$').prose, /costs \$25 and/);
});

test('no builder workaround is left for a shared fix (the mount wrapper, the dock grid)', () => {
  for (const f of ['model-studio', 'borders-lab', 'city-lab']) assert.doesNotMatch(read(`human-geography/assets/tools/${f}.js`), /Mdl\.mount = |MD\.mount = |__t4Safe|msWrapped/, f);
  for (const f of ['borders-lab', 'city-lab']) assert.doesNotMatch(read(`human-geography/assets/tools/${f}.css`), /\.ls-root \.hug-model-grid/, f);
  assert.match(read('human-geography/assets/tools/hug-tools.css'), /\.ls-root \.hug-model-grid\{grid-template-columns:minmax\(0,1fr\);\}/);
});

test('plots: the y-axis name has its own band above the data, one 0 at a shared corner, room under the x ticks', async () => {
  const { Plot } = await import('../lib/aphug-mathlib.mjs');
  const svg = Plot.svg({ label: 'A bid rent line for the plot test', x: [0, 10], y: [0, 400], xLabel: 'Distance (km)', yLabel: 'Bid rent', curves: [{ fn: x => 400 - 40 * x }] });
  const F = Plot.frame({ x: [0, 10], y: [0, 400], yLabel: 'Bid rent' });
  const yl = +svg.match(/<text class="hug-plot-axlabel" x="[\d.]+" y="([\d.]+)" text-anchor="start">Bid rent/)[1];
  assert.ok(yl < F.pad.t, 'the y-axis name sits above the plot area');
  const zeros = [...svg.matchAll(/<text x="[\d.]+" y="[\d.]+" text-anchor="(?:middle|end)">0<\/text>/g)];
  assert.equal(zeros.length, 1, 'one 0 at the corner');
  assert.match(svg, /y="[\d.]+" text-anchor="middle">Distance \(km\)/);
});
