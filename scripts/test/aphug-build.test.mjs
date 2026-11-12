/* The AP® Human Geography generator against the real map and the placeholder
   sample in scripts/test/fixtures/aphug-data (one Unit 2 topic, population
   composition: items of every type, map, data, image and text sets, maps in
   every rendering, a population pyramid, model items, and one FRQ of each
   type; never in human-geography/data): with Unit 2 published it writes every
   page kind with math rendered, plots and maps drawn from their data, and the
   pages pass the course's own site rules (trademark, the "not yet reviewed"
   note, Report a problem); with nothing published every page is noindex; no
   output path carries the token "ap"; the three FRQ types carry seven
   one-point parts with their task verbs; numeric keys are recomputed by
   ApHugCalc; a tool is built only when its data file exists and its topic is
   published. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import trademark from '../site-rules/aphug-trademark.mjs';
import beta from '../site-rules/aphug-beta-and-report.mjs';
import { trademarkProblems, hasApToken, FREE_UNITS, FREE_TOPICS, IDENTITY } from '../lib/aphug-build.mjs';

const FIX = 'scripts/test/fixtures/aphug-data';
const T = 'population-composition';
const D = 'human-geography';
function build(published, data = FIX) {
  const root = mkdtempSync(join(tmpdir(), 'aphug-build-'));
  execFileSync(process.execPath, ['scripts/build-aphug.mjs', '--out', join(root, D)], { env: { ...process.env, APHUG_DATA: data, APHUG_PUBLISHED: published } });
  const files = [];
  const walk = d => { for (const n of readdirSync(d)) { const f = join(d, n); statSync(f).isDirectory() ? walk(f) : files.push(f); } };
  walk(root);
  return { root, files, html: files.filter(f => f.endsWith('.html')) };
}
let cached = null;
const unit2 = () => cached || (cached = build('unit-2'));

test('a published unit builds every page kind, math rendered, maps and plots drawn, and the course rules pass', () => {
  const { root, files, html } = unit2();
  const rel = files.map(f => f.slice(root.length + 1));
  for (const p of ['index.html', 'learn.html', 'glossary.html', 'units/unit-2.html', 'unit-sheets/unit-2.html', `lessons/${T}.html`, `notes/${T}.html`, 'practice.html', 'exams.html', 'frq.html', 'justify.html', 'formula-sheet.html', 'unit-tests/unit-2.html', 'assets/bank/unit-2.json', 'assets/bank/unit-2-why.json', 'assets/bank/index.json', 'assets/hug-curriculum.js']) assert.ok(rel.includes(`${D}/${p}`), p);
  assert.ok(!rel.includes(`${D}/score-calculator.html`), 'no score calculator');
  assert.ok(rel.every(r => !hasApToken(r.slice(D.length + 1))), 'no "ap" token in a served path');
  const fails = [];
  trademark({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  beta({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  assert.deepEqual(fails, []);
  const lesson = readFileSync(join(root, `${D}/lessons/${T}.html`), 'utf8');
  assert.match(lesson, /<title>[^<]+ — AP® Human Geography( Lesson)? \| LevlPrep<\/title>/);
  assert.match(lesson, /"isAccessibleForFree": true/, 'topic 2.3 is in the free tier (FREE_TOPICS)');
  assert.doesNotMatch(lesson, /noindex/);
  assert.match(lesson, /<body class="hug"/);
  // The question engine loads the math, the arithmetic, the grader and the model item before it.
  const srcs = [...lesson.matchAll(/<script src="([^"]+)"/g)].map(m => m[1].replace(/^.*assets\//, ''));
  const at = f => srcs.indexOf(f);
  assert.ok(at('hug-math.js') > -1 && at('hug-math.js') < at('hug-calc.js') && at('hug-calc.js') < at('hug-grade.js') && at('hug-grade.js') < at('hug-model.js') && at('hug-model.js') < at('hug-questions.js'), srcs.join(' '));
  const desc = lesson.match(/name="description" content="([^"]*)"/)[1];
  assert.doesNotMatch(desc, /\bAP\b|<math|\$/);
  // The bank: keys recomputed by ApHugCalc, set kinds in the index, maps as files.
  const bank = JSON.parse(readFileSync(join(root, `${D}/assets/bank/unit-2.json`), 'utf8'));
  const num = bank.items.filter(q => q.type === 'numeric');
  assert.equal(num[0].numeric.answer, 104, 'the sex ratio, 14 to 13.5, rounded');
  assert.equal(num[1].numeric.answer, 150, 'percent change from 10 to 25');
  assert.equal(num[1].numeric.mistakes[0].value, 15, 'a mistake recipe gets its value');
  assert.ok(bank.items.some(q => q.type === 'model' && q.model.layout === 'rings'), 'model items reach the bank');
  const idx = JSON.parse(readFileSync(join(root, `${D}/assets/bank/index.json`), 'utf8'));
  const codes = idx.t[T].split(',').map(e => e.split('.').pop());
  assert.deepEqual(['m', 'd', 'i', 't'].map(c => codes.filter(x => x === c).length), [18, 9, 3, 3], 'each set kind marked: map, data, image, text');
  const stim = JSON.stringify(bank.stimuli);
  assert.match(stim, /<img src=\\"figures\/maps\/population-composition-s1\.svg\\"/, 'a map is an image file');
  assert.match(stim, /Borders follow Natural Earth/, 'the border note');
  assert.match(stim, /class=\\"hug-legend\\"/, 'an HTML legend');
  assert.match(stim, /<svg class=\\"hug-plot\\"[^>]*aria-label=\\"Placeholder population pyramid/, 'the pyramid drawn from its numbers');
  assert.match(stim, /Scene to be drawn/, 'an image placeholder carries its alt text');
  for (const k of ['s1', 's2', 's3', 's4', 's5', 's11']) {
    const svg = readFileSync(join(root, `${D}/figures/maps/${T}-${k}.svg`), 'utf8');
    assert.match(svg, /^<\?xml[\s\S]*<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"[^>]*role="img"/);
    assert.doesNotMatch(svg, /<text/, 'no text inside a map picture');
  }
  // The curriculum: 7 units and the skills chapter, the free tier.
  const cur = readFileSync(join(root, `${D}/assets/hug-curriculum.js`), 'utf8');
  const CU = JSON.parse(cur.match(/window\.ApHugCurriculum = (.*);/)[1]);
  assert.equal(CU.units.filter(u => u.part === 'course').length, 7);
  assert.equal(CU.topics.filter(t => t.kind === 'concept').length, 68, 'every CED topic');
  const order = CU.topics.map(t => t.id);
  assert.ok(order.indexOf('skills-scale') < order.indexOf('views-of-the-world'), 'the skills chapter comes before Unit 1');
  assert.ok(CU.topics.find(t => t.id === 'skills-frq').free, 'skills lessons are free');
  assert.ok(CU.topics.find(t => t.id === 'regional-analysis').free, 'Unit 1 is free');
  assert.ok(CU.topics.find(t => t.id === 'transition-model').free, '2.5 is free');
  assert.ok(!CU.topics.find(t => t.id === 'malthusian-theory').free, '2.6 is Premium');
  // One free tier: the build's FREE_UNITS and premium.js agree; on sale since launch (spec decision 12).
  const prem = readFileSync('assets/premium.js', 'utf8');
  const block = prem.slice(prem.indexOf('    aphug: {'), prem.indexOf('\n    },', prem.indexOf('    aphug: {')));
  assert.deepEqual(FREE_UNITS, ['geo-skills', 'unit-1']);
  assert.equal(FREE_TOPICS.length, 5);
  assert.match(block, /freeChapters: \['geo-skills', 'unit-1'\]/);
  assert.doesNotMatch(block, /onSale: false/, 'on sale since launch (spec decision 12)');
  assert.match(block, /id: 'hug-2027', label: 'Through June 30, 2027', price: 25, until: '2027-06-30'/);
});

test('nothing published: no topic pages, every page noindex', () => {
  const { html } = build('');
  assert.ok(html.length > 5);
  assert.ok(!html.some(f => /\/(lessons|notes|units)\//.test(f)));
  for (const f of html) assert.match(readFileSync(f, 'utf8'), /<meta name="robots" content="noindex/, f);
});

test('published and live everywhere it is registered (spec decision 11), Premium on sale (decision 12)', () => {
  assert.deepEqual(JSON.parse(readFileSync(`${D}/data/published.json`, 'utf8')).chapters, ['geo-skills', 'unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5', 'unit-6', 'unit-7']);
  assert.match(readFileSync('assets/courses.js', 'utf8'), /key: 'aphug'[\s\S]*?aliases: \['human-geography', 'geography', 'humangeo', 'hug'\], paid: true, status: 'live', order: 15/);
  assert.match(readFileSync('assets/site-search-all.js', 'utf8'), /key: 'aphug'[^\n]*status: 'live'/);
  assert.match(readFileSync('premium.html', 'utf8'), /AP® Human Geography/, 'on the pricing page');
  // The notes page is the one listed for each topic (scripts/lib/topic-twin.mjs).
  assert.match(readFileSync('sitemap.xml', 'utf8'), /human-geography\/notes\//, 'in the sitemap');
  assert.match(readFileSync('sitemap.xml', 'utf8'), /human-geography\/models\.html/, 'the models page in the sitemap');
  assert.match(readFileSync('index.html', 'utf8'), /<!-- hub-hug:start -->\s*<a class="ccard" href="human-geography\/"/, 'a hub card');
  assert.match(readFileSync('404.html', 'utf8'), /<!-- nf-hug:start -->\s*\S/, 'a 404 card');
  assert.match(readFileSync('worker/src/premium.js', 'utf8'), /'hug-2027': +\{ course: 'aphug', until: '2027-06-30T23:59:59-10:00' \}/);
  assert.match(readFileSync('sw.js', 'utf8'), /COURSE_URLS\['human-geography'\]/);
  assert.match(readFileSync('robots.txt', 'utf8'), /Disallow: \/human-geography\/data\/notes\//);
});

test('the course home has its own headline, accent and cover', () => {
  const { root } = unit2();
  const home = readFileSync(join(root, `${D}/index.html`), 'utf8');
  assert.match(home, /AP® Human<span>Geography<\/span>/);
  assert.doesNotMatch(home, /Psychology|Macroeconomics|Statistics|Curious Observer|AAQ|EBQ/);
  assert.match(home, /assets\/hug\.css/);
  assert.match(home, /data-cover="aphug"/);
  assert.match(home, /assets\/covers\/art\/aphug\.svg/);
  assert.equal(IDENTITY.accent.ink, '#094953');
  const css = readFileSync(`${D}/assets/hug.css`, 'utf8');
  assert.match(css, /body\.hug\{--ctint:#E1F1F4;--cink:#094953;\}/);
  assert.match(readFileSync('assets/theme.css', 'utf8'), /body\[data-course="aphug"\]\{--ctint:#E1F1F4;--cink:#094953;\}/);
  assert.ok(existsSync('assets/covers/aphug.svg') && existsSync('assets/covers/art/aphug.svg') && existsSync('assets/covers/thumb/aphug.svg'));
});

test('tools: the eight trainers pre-registered, built only with a data file and a published topic, loading their own model, the plot helper and the model item', () => {
  const pages = JSON.parse(readFileSync(join(FIX, 'pages.json'), 'utf8'));
  assert.deepEqual(pages.tools.map(t => t.slug).sort(), ['borders-lab', 'city-lab', 'diffusion-lab', 'frq-coach', 'map-reader', 'model-studio', 'population-lab', 'scale-lab']);
  assert.ok(pages.tools.every(t => t.studio === true && t.topic));
  assert.deepEqual(pages.tools.filter(t => !t.premium).map(t => t.slug).sort(), ['map-reader', 'model-studio', 'scale-lab'], 'three free trainers (spec section 6)');
  assert.deepEqual(pages, JSON.parse(readFileSync(`${D}/data/pages.json`, 'utf8')), 'the fixture copies the real pages.json');
  const { root, files } = unit2();
  assert.ok(!files.some(f => /\/tools\/[^/]+\.html$/.test(f)), 'no tool page without data');
  const cur = readFileSync(join(root, `${D}/assets/hug-curriculum.js`), 'utf8');
  const list = JSON.parse(cur.match(/window\.ApHugToolList = (.*);/)[1]);
  assert.equal(list.length, 8);
  assert.ok(list.every(t => !t.live && t.arrives));
  const data = mkdtempSync(join(tmpdir(), 'aphug-data-'));
  cpSync(FIX, data, { recursive: true });
  mkdirSync(join(data, 'tools'), { recursive: true });
  writeFileSync(join(data, 'tools', 'population-lab.json'), JSON.stringify({ slug: 'population-lab', kind: 'simulator', topic: T, intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: T }] }));
  writeFileSync(join(data, 'tools', 'scale-lab.json'), JSON.stringify({ slug: 'scale-lab', kind: 'simulator', topic: 'scales-of-analysis', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'scales-of-analysis' }] }));
  const { root: out } = build('unit-2', data);
  const page = readFileSync(join(out, `${D}/tools/population-lab.html`), 'utf8');
  const srcs = [...page.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  const at = f => srcs.findIndex(s => s.endsWith(f));
  assert.ok(at('hug-calc.js') > -1 && at('hug-calc.js') < at('tools/math/population-lab.js'), 'the arithmetic before the model');
  assert.ok(at('hug-model.js') > -1 && at('hug-model.js') < at('tools/hug-tools.js'), 'the model item before the drill runner');
  assert.ok(at('tools/hug-tool-math.js') < at('tools/math/population-lab.js'), 'shared math before the model');
  assert.ok(at('tools/hug-plot.js') > -1, 'plot helper loaded');
  assert.ok(!existsSync(join(out, `${D}/tools/scale-lab.html`)), 'Unit 1 is not published');
});

test('trademark wording', () => {
  assert.deepEqual(trademarkProblems('An AP® Human Geography course. AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.'), []);
  assert.equal(trademarkProblems('AP Human Geography').length, 1);
  assert.ok(trademarkProblems('APHG review').length > 0, 'no "APHG" shorthand');
  assert.ok(trademarkProblems('AP® HuG notes').length > 0, 'no "HuG" shorthand');
  assert.equal(trademarkProblems('take two AP®s').length, 1);
  assert.equal(trademarkProblems('ready for the AP® exam').length, 1, 'use "AP® Human Geography exam"');
  assert.deepEqual(trademarkProblems('the AP&reg; Human Geography exam, a map, an apple'), []);
});

test('FRQ pages: the three types, seven one-point parts with their task verbs, the index, the teachers page and share links', () => {
  const { root, files } = unit2();
  const rel = files.map(f => f.slice(root.length + 1));
  for (const t of ['none', 'one', 'two']) assert.ok(rel.includes(`${D}/frq/frq-placeholder-${t}.html`), t);
  for (const p of ['assets/frq/index.json', 'teachers.html', 'assets/summaries.json', 'figures/maps/frq-placeholder-two-1.svg']) assert.ok(rel.includes(`${D}/${p}`), p);
  const index = JSON.parse(readFileSync(join(root, `${D}/assets/frq/index.json`), 'utf8'));
  assert.deepEqual(index.map(f => f.type), ['none', 'one', 'two'], 'in exam order');
  assert.ok(index.every(f => f.points === 7));
  const two = JSON.parse(readFileSync(join(root, `${D}/assets/frq/frq-placeholder-two.json`), 'utf8'));
  assert.equal(two.typeName, 'Q3: Two stimuli');
  assert.deepEqual(two.parts.map(p => `${p.label}:${p.points}`), ['A:1', 'B:1', 'C:1', 'D:1', 'E:1', 'F:1', 'G:1']);
  assert.deepEqual(two.parts.map(p => p.verb), ['identify', 'describe', 'explain', 'explain', 'compare', 'explain-degree', 'define']);
  assert.ok(two.parts.every(p => p.verbName && p.demand && p.rubric.length === 1), 'each part names its verb, its demand and one rubric line');
  assert.deepEqual(two.readings.map(r => r.title.split(':')[0]), ['Source 1', 'Source 2']);
  assert.deepEqual(two.readings.map(r => r.kind), ['map', 'data']);
  const none = JSON.parse(readFileSync(join(root, `${D}/assets/frq/frq-placeholder-none.json`), 'utf8'));
  assert.equal(none.readings.length, 0, 'Q1 has no stimulus');
  const one = JSON.parse(readFileSync(join(root, `${D}/assets/frq/frq-placeholder-one.json`), 'utf8'));
  assert.equal(one.readings.length, 1);
  const page = readFileSync(join(root, `${D}/frq/frq-placeholder-two.html`), 'utf8');
  assert.match(page, /class="hug-lines"/, 'printable lined space');
  assert.equal((page.match(/class="hug-stim"/g) || []).length, 2, 'two sources on the page');
  assert.equal((page.match(/class="hug-verb"/g) || []).length, 7, 'every part shows its verb');
  assert.match(page, /Explain the degree means:<\/b> State the degree first/);
  assert.match(page, /no calculator/);
  for (const f of ['hug-math.js', 'hug-calc.js', 'hug-grade.js']) assert.ok(page.indexOf(`assets/${f}"`) > -1 && page.indexOf(`assets/${f}"`) < page.indexOf('pages/frq-kit.js'), `${f} before frq-kit.js`);
  assert.match(page, /placeholder question/i);
  assert.ok(!page.includes(two.parts[0].sample.slice(0, 50)), 'the sample answer is not in the page HTML');
  for (const p of ['frq/frq-placeholder-one.html', `lessons/${T}.html`, `notes/${T}.html`, 'unit-sheets/unit-2.html']) {
    const h = readFileSync(join(root, D, p), 'utf8');
    const gc = h.match(/href="(https:\/\/classroom\.google\.com\/share\?url=[^"]+)"/);
    assert.ok(gc, `${p}: Share to Google Classroom`);
    const u = new URL(gc[1].replace(/&amp;/g, '&'));
    assert.equal(u.searchParams.get('url'), `https://levlprep.com/${D}/${p}`);
    assert.doesNotMatch(u.searchParams.get('title'), /\bAP\b/);
  }
  const teachers = readFileSync(join(root, `${D}/teachers.html`), 'utf8');
  assert.match(teachers, new RegExp(`practice\\.html\\?topic=${T}`));
});

test('a TeX typo in a built topic stops the build', () => {
  const data = mkdtempSync(join(tmpdir(), 'aphug-data-'));
  cpSync(FIX, data, { recursive: true });
  const p = join(data, 'lessons', `${T}.json`);
  writeFileSync(p, readFileSync(p, 'utf8').replace('"cause": "Many children are born for years"', '"cause": "Many children $\\\\frak{1}{2}$ are born for years"'));
  const out = mkdtempSync(join(tmpdir(), 'aphug-build-'));
  assert.throws(() => execFileSync(process.execPath, ['scripts/build-aphug.mjs', '--out', join(out, D)], { env: { ...process.env, APHUG_DATA: data, APHUG_PUBLISHED: 'unit-2' }, stdio: 'pipe' }), /frak/);
});

test('the real data passes the content check, and the fixture sample passes it too', () => {
  const run = env => execFileSync(process.execPath, ['scripts/check-aphug-content.mjs', '--check'], { env: { ...process.env, ...env }, encoding: 'utf8' });
  assert.match(run({}), /0 failing/);
  assert.match(run({ APHUG_DATA: FIX }), /1 topics, 44 items, 0 failing; bank 0, FRQ 0/);
});

function broken(edit) {
  const data = mkdtempSync(join(tmpdir(), 'aphug-data-'));
  cpSync(FIX, data, { recursive: true });
  edit(data);
  try { return execFileSync(process.execPath, ['scripts/check-aphug-content.mjs', '--check'], { env: { ...process.env, APHUG_DATA: data, APHUG_PUBLISHED: 'unit-2' }, encoding: 'utf8', stdio: 'pipe' }); } catch (e) { return String(e.stdout) + String(e.stderr); }
}
const editQ = (data, fn) => { const p = join(data, 'questions', `${T}.json`); const q = JSON.parse(readFileSync(p, 'utf8')); fn(q); writeFileSync(p, JSON.stringify(q)); };
const item = (q, type) => q.items.find(x => x.type === type);

test('a wrong numeric key, loaded language, an undated "today", an unnamed model keyed, a calculator, an undated source or a setup item fails the content check', () => {
  assert.match(broken(d => editQ(d, q => { item(q, 'numeric').numeric.answer = 99; })), /numeric\.answer 99 disagrees with its recipe/);
  assert.match(broken(d => editQ(d, q => { q.items[0].why.correct = 'Placeholder: a primitive farming region.'; })), /language: a place or people called backward, primitive/);
  assert.match(broken(d => editQ(d, q => { q.items[0].why.correct = 'Placeholder: Third World countries grow fastest.'; })), /"Third World"/);
  assert.match(broken(d => editQ(d, q => { q.items[0].q = 'Placeholder: where do illegal immigrants settle in this pattern?'; })), /"illegal" for people/);
  assert.match(broken(d => editQ(d, q => { q.items[0].q = 'Placeholder: which country currently has the most people on this map?'; })), /dated: "currently"/);
  assert.match(broken(d => editQ(d, q => { q.items[0].q = 'Placeholder: which stage of Zelinsky\'s mobility transition does the map show?'; })), /Zelinsky.*CED does not name/);
  assert.match(broken(d => editQ(d, q => { q.items[0].q = 'Placeholder: use a calculator to find the share on this map.'; })), /a calculator/);
  assert.match(broken(d => editQ(d, q => { const s = q.stimuli[`${T}-s7`]; delete s.invented; s.source = 'UN World Population Prospects'; })), /has no year/);
  assert.match(broken(d => editQ(d, q => { q.items[0].type = 'setup'; })), /type must be one of single, multi, numeric, specific, order, model/);
  assert.match(broken(d => editQ(d, q => { q.items[0].practice = '6.A'; })), /not a skill id/);
});

test('a map, a model item or an image out of its rules fails the content check', () => {
  assert.match(broken(d => editQ(d, q => { q.stimuli[`${T}-s1`].map.values['western-sahara'] = 2; })), /Western Sahara is disputed/);
  assert.match(broken(d => editQ(d, q => { q.stimuli[`${T}-s5`].map.marks.push({ at: 'germany', text: 'E' }); })), /would overlap at 360 px/);
  assert.match(broken(d => editQ(d, q => { delete q.stimuli[`${T}-s1`].map.invented; })), /dated source line/);
  assert.match(broken(d => editQ(d, q => { const m = item(q, 'model').model; m.key.t1 = m.key.t2; })), /model: piece "mid" is the key of two slots/);
  assert.match(broken(d => editQ(d, q => { q.stimuli[`${T}-s9`].image.alt = 'Short'; })), /image\.alt/);
});

test('an FRQ out of the exam shape, or a sample that does not do what its verb demands, fails the content check', () => {
  const editF = (id, fn) => d => { const p = join(d, 'frq', `${id}.json`); const f = JSON.parse(readFileSync(p, 'utf8')); fn(f); writeFileSync(p, JSON.stringify(f)); };
  assert.match(broken(editF('frq-placeholder-none', f => { f.parts.pop(); })), /parts must be the exam's, in order/);
  assert.match(broken(editF('frq-placeholder-one', f => { f.stimuli = []; })), /a one FRQ has 1 stimulus, not 0/);
  assert.match(broken(editF('frq-placeholder-two', f => { f.points = 10; })), /worth 7 points/);
  assert.match(broken(editF('frq-placeholder-none', f => { f.parts[0].verb = 'list'; })), /verb must be one of/);
  assert.match(broken(editF('frq-placeholder-none', f => { f.parts[2].verb = 'compare'; })), /the prompt does not use its task verb "compare"/);
  assert.match(broken(editF('frq-placeholder-none', f => { f.parts[2].sample = 'Placeholder: Country A has a wide base and many children there.'; })), /explain sample has no link/);
  assert.match(broken(editF('frq-placeholder-none', f => { f.parts[5].sample = 'Placeholder: the wide base shows many children, so Country A grows.'; })), /does not state its degree first/);
});

test('an FRQ may not use a term taught after the topic it unlocks with; refiling it on that topic fixes it', () => {
  const editF = (id, fn) => d => { const p = join(d, 'frq', `${id}.json`); const f = JSON.parse(readFileSync(p, 'utf8')); fn(f); writeFileSync(p, JSON.stringify(f)); };
  // Population composition (2.3) comes before the dependency ratio (2.9).
  const late = f => { f.parts[0].sample += ' The dependency ratio will rise.'; };
  assert.match(broken(editF('frq-placeholder-none', late)), /ORDER \(unlocks with population-composition\): uses "dependency ratio"/);
  assert.doesNotMatch(broken(editF('frq-placeholder-none', f => { late(f); f.topics.push('aging-populations'); })), /ORDER/);
  assert.match(broken(editF('frq-placeholder-none', f => { f.topics.push('city-structure'); })), /topic city-structure is in unit-6; list that unit/);
});
