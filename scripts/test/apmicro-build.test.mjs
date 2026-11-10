/* The AP® Microeconomics generator against the real map and the placeholder
   sample in scripts/test/fixtures/apmicro-data (one Unit 6 topic, inequality,
   items of every type including graph items of the new kinds (areas, points,
   lines, two panels) and a payoff matrix, one data, one graph and one
   scenario set, one long FRQ with graph parts and one short FRQ with a
   matrix part; never in microeconomics/data): with the fixture's units
   published it writes every page kind with math rendered and graphs drawn,
   and the pages pass the course's own site rules (trademark, the "not yet
   reviewed" note, Report a problem); with nothing published every page is
   noindex; no output path carries the token "ap"; the FRQ types carry 10
   and 5 points; numeric keys are recomputed by ApMicroCalc; a tool is built
   only when its data file exists and its topic is published; the course is
   registered hidden (spec decision 3). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import trademark from '../site-rules/apmicro-trademark.mjs';
import beta from '../site-rules/apmicro-beta-and-report.mjs';
import { trademarkProblems, hasApToken, FREE_UNITS, FREE_TOPICS, IDENTITY } from '../lib/apmicro-build.mjs';

const FIX = 'scripts/test/fixtures/apmicro-data';
const T = 'inequality';
const D = 'microeconomics';
// The fixture's topic is in Unit 6; its FRQs unlock with Units 3 and 4 as well.
const PUB = 'unit-3,unit-4,unit-6';
function build(published, data = FIX) {
  const root = mkdtempSync(join(tmpdir(), 'apmicro-build-'));
  execFileSync(process.execPath, ['scripts/build-apmicro.mjs', '--out', join(root, D)], { env: { ...process.env, APMICRO_DATA: data, APMICRO_PUBLISHED: published } });
  const files = [];
  const walk = d => { for (const n of readdirSync(d)) { const f = join(d, n); statSync(f).isDirectory() ? walk(f) : files.push(f); } };
  walk(root);
  return { root, files, html: files.filter(f => f.endsWith('.html')) };
}

test('a published unit builds every page kind, math rendered and graphs drawn, and the course rules pass', () => {
  const { root, files, html } = build(PUB);
  const rel = files.map(f => f.slice(root.length + 1));
  for (const p of ['index.html', 'learn.html', 'glossary.html', 'units/unit-6.html', 'unit-sheets/unit-6.html', `lessons/${T}.html`, `notes/${T}.html`, 'practice.html', 'exams.html', 'frq.html', 'justify.html', 'formula-sheet.html', 'unit-tests/unit-6.html', 'assets/bank/unit-6.json', 'assets/bank/unit-6-why.json', 'assets/bank/index.json', 'assets/mic-curriculum.js']) assert.ok(rel.includes(`${D}/${p}`), p);
  assert.ok(!rel.includes(`${D}/score-calculator.html`), 'no score calculator');
  assert.ok(rel.every(r => !hasApToken(r.slice(D.length + 1))), 'no "ap" token in a served path');
  const fails = [];
  trademark({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  beta({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  assert.deepEqual(fails, []);
  const lesson = readFileSync(join(root, `${D}/lessons/${T}.html`), 'utf8');
  assert.match(lesson, /<title>[^<]+ — AP® Microeconomics( Lesson)? \| LevlPrep<\/title>/);
  assert.doesNotMatch(lesson, /"isAccessibleForFree": true/, 'Unit 6 lessons are Premium');
  assert.doesNotMatch(lesson, /noindex/);
  assert.match(lesson, /<body class="mic"/);
  assert.match(lesson, /<math class="mic-m"><semantics>/, 'math is MathML at build time');
  assert.match(lesson, /class="mic-gr-cell/, 'a shade item drawn with its tappable regions');
  assert.match(lesson, /class="mic-mx-cell/, 'the payoff matrix drawn in the lesson check');
  const bankRaw = readFileSync(join(root, `${D}/assets/bank/unit-6.json`), 'utf8');
  assert.match(bankRaw, /<svg class=\\"mic-graph-svg\\"[^>]*role=\\"img\\" aria-label=\\"Supply and demand graph: [^"]*A per-unit subsidy of 2 to sellers/, 'a graph stimulus drawn from its spec');
  // The question engine loads the math, the calculations, the graphs, the matrix and the grader before it; no setup parser.
  const srcs = [...lesson.matchAll(/<script src="([^"]+)"/g)].map(m => m[1].replace(/^.*assets\//, ''));
  const at = f => srcs.indexOf(f);
  assert.ok(at('mic-math.js') > -1 && at('mic-math.js') < at('mic-calc.js') && at('mic-calc.js') < at('mic-graph.js') && at('mic-graph.js') < at('mic-matrix.js') && at('mic-matrix.js') < at('mic-grade.js') && at('mic-grade.js') < at('mic-questions.js'), srcs.join(' '));
  assert.equal(at('mic-expr.js'), -1, 'no setup parser in this course');
  assert.equal(at('mic-stats.js'), -1, 'no statistics library');
  const desc = lesson.match(/name="description" content="([^"]*)"/)[1];
  assert.doesNotMatch(desc, /\bAP\b|<math|\$/);
  // The bank: keys recomputed by ApMicroCalc, graph and matrix specs kept, set kinds in the index.
  const bank = JSON.parse(bankRaw);
  const by = id => bank.items.find(q => q.id === `mic-${T}-${id}`);
  assert.equal(by(4).numeric.answer, 20, 'the deadweight loss triangle, half of 10 by 4');
  assert.equal(by(4).numeric.mistakes[0].value, 40, 'a mistake recipe gets its value');
  assert.equal(by(7).numeric.answer, 20, 'the poorest two fifths, 5 + 15');
  assert.equal(by(2).type, 'graph');
  assert.equal(by(2).graph.key.shade, 'tax-revenue', 'the graph key travels with the item (graded in the browser)');
  assert.deepEqual(by(19).graph.key.shifts, [{ curve: 'D', dir: 'right' }]);
  assert.equal(by(20).type, 'matrix');
  assert.deepEqual(by(20).matrix.do, ['dominant', 'nash']);
  assert.ok(by(13).specific.slots && Object.keys(by(13).specific.slots).length >= 2, 'specific slots');
  const idx = JSON.parse(readFileSync(join(root, `${D}/assets/bank/index.json`), 'utf8'));
  const codes = idx.t[T].split(',').map(e => e.split('.').pop());
  assert.deepEqual(['d', 'g', 't'].map(c => codes.filter(x => x === c).length), [4, 3, 3], 'each set kind marked: data, graph, scenario');
  assert.ok(idx.ty.includes('graph') && idx.ty.includes('matrix'));
  const cur = readFileSync(join(root, `${D}/assets/mic-curriculum.js`), 'utf8');
  const CU = JSON.parse(cur.match(/window\.ApMicroCurriculum = (.*);/)[1]);
  assert.equal(CU.units.filter(u => u.part === 'course').length, 6);
  assert.equal(CU.topics.filter(t => t.kind === 'concept').length, 36, 'every CED topic');
  assert.deepEqual(CU.topics.slice(0, 4).map(t => t.id), ['axes-points', 'slopes-curves', 'shifts-movements', 'curves-crossing'], 'the graph skills come first');
  assert.ok(CU.topics.find(t => t.id === 'axes-points').free, 'graph skills lessons are free');
  assert.ok(CU.topics.find(t => t.id === 'scarcity').free, 'Unit 1 is free');
  for (const id of ['demand', 'supply', 'price-elasticity-demand', 'price-elasticity-supply']) assert.ok(CU.topics.find(t => t.id === id).free, `${id} is free`);
  assert.ok(!CU.topics.find(t => t.id === 'other-elasticities').free, 'the rest of Unit 2 is Premium');
  assert.ok(!CU.topics.find(t => t.id === T).free, 'Unit 6 is Premium');
  // One free tier: the build's FREE_UNITS and premium.js agree; not on sale until the launch steps.
  const prem = readFileSync('assets/premium.js', 'utf8');
  const block = prem.slice(prem.indexOf('    apmicro: {'), prem.indexOf('\n    },', prem.indexOf('    apmicro: {')));
  assert.deepEqual(FREE_UNITS, ['unit-1']);
  assert.deepEqual(FREE_TOPICS, ['demand', 'supply', 'price-elasticity-demand', 'price-elasticity-supply']);
  assert.match(block, /freeChapters: \['unit-1'\]/);
  assert.match(block, /onSale: false/);
  assert.match(block, /id: 'micro-2027', label: 'Through June 30, 2027', price: 25, until: '2027-06-30'/);
});

test('nothing published: no topic pages, every page noindex', () => {
  const { html } = build('');
  assert.ok(html.length > 5);
  assert.ok(!html.some(f => /\/(lessons|notes|units)\//.test(f)));
  for (const f of html) assert.match(readFileSync(f, 'utf8'), /<meta name="robots" content="noindex/, f);
});

test('registered hidden everywhere Macro is registered (spec decision 3), Premium not on sale', () => {
  assert.deepEqual(JSON.parse(readFileSync(`${D}/data/published.json`, 'utf8')).chapters, []);
  assert.match(readFileSync('assets/courses.js', 'utf8'), /key: 'apmicro'[\s\S]*?aliases: \['microeconomics', 'micro', 'mic'\], paid: true, status: 'hidden', order: 14/);
  assert.match(readFileSync('assets/site-search-all.js', 'utf8'), /key: 'apmicro'[^\n]*status: 'hidden'/);
  assert.doesNotMatch(readFileSync('sitemap.xml', 'utf8'), /microeconomics\//, 'not in the sitemap while hidden');
  assert.match(readFileSync('index.html', 'utf8'), /<!-- hub-mic:start -->\s*<!-- hub-mic:end -->/, 'an empty hub card slot');
  assert.match(readFileSync('404.html', 'utf8'), /<!-- nf-mic:start -->\s*<!-- nf-mic:end -->/, 'an empty 404 card slot');
  assert.match(readFileSync('worker/src/premium.js', 'utf8'), /'micro-2027': +\{ course: 'apmicro', until: '2027-06-30T23:59:59-10:00' \}/);
  assert.match(readFileSync('worker/src/index.js', 'utf8'), /apmicro:/);
  assert.match(readFileSync('sw.js', 'utf8'), /COURSE_URLS\['microeconomics'\]/);
  assert.match(readFileSync('assets/exam-date.js', 'utf8'), /apmicro: \{ date: '2027-05-04'/);
  assert.match(readFileSync('scripts/vault/rules.mjs', 'utf8'), /microeconomics: 'apmicro'/);
  assert.ok(existsSync('scripts/sql/migrations/2026-11i-apmicro.sql'), 'the migration is written (applied at launch)');
});

test('the course home has its own headline, accent and cover, not AP® Macroeconomics\'s', () => {
  const { root } = build(PUB);
  const home = readFileSync(join(root, `${D}/index.html`), 'utf8');
  assert.match(home, /<h1 class="mast mast-long" id="r3Title">AP®<span>Microeconomics<\/span><\/h1>/); // one long word scales on a phone
  assert.doesNotMatch(home, /<p class="deck">/); // the second tagline is off course homes (owner 2026-11-02)
  assert.doesNotMatch(home, /Macroeconomics|aggregate demand|Policy Thinker|Statistics you must know|score-calculator/);
  assert.match(home, /assets\/mic\.css/);
  assert.match(home, /data-cover="apmicro"/);
  assert.match(home, /assets\/covers\/art\/apmicro\.svg/); // the band drawing; the notes card cover is off the home (owner 2026-11-02)
  assert.equal(IDENTITY.accent.ink, '#7E1A5E');
  const css = readFileSync(`${D}/assets/mic.css`, 'utf8');
  assert.match(css, /body\.mic\{--ctint:#F8E6F1;--cink:#7E1A5E;\}/);
  assert.match(readFileSync('assets/theme.css', 'utf8'), /body\[data-course="apmicro"\]\{--ctint:#F8E6F1;--cink:#7E1A5E;\}/);
  assert.ok(existsSync('assets/covers/apmicro.svg') && existsSync('assets/covers/art/apmicro.svg') && existsSync('assets/covers/thumb/apmicro.svg'));
  // The accent is a hue no other course uses (every course's ink in theme.css, at least 15° apart).
  const theme = readFileSync('assets/theme.css', 'utf8');
  const hue = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; const x = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (x * 60 + 360) % 360; };
  const inks = [...theme.matchAll(/^body\[data-course="([a-z]+)"\]\{--ctint:#[0-9A-F]+;--cink:(#[0-9A-F]{6});\}/gm)].map(m => [m[1], hue(m[2])]);
  assert.ok(inks.length > 10, 'read the inks');
  const mine = hue(IDENTITY.accent.ink);
  for (const [k, h] of inks) if (k !== 'apmicro') assert.ok(Math.min(Math.abs(h - mine), 360 - Math.abs(h - mine)) >= 15, `${k} at ${h.toFixed(0)}° is too close to ${mine.toFixed(0)}°`);
});

test('tools: the eight trainers pre-registered, built only with a data file and a published topic, loading their own model, the graphs, the matrix and the plot helper', () => {
  const pages = JSON.parse(readFileSync(join(FIX, 'pages.json'), 'utf8'));
  assert.deepEqual(pages.tools.map(t => t.slug).sort(), ['cost-lab', 'elasticity-lab', 'externality-lab', 'factor-lab', 'firm-market', 'game-lab', 'graph-studio', 'surplus-lab']);
  assert.ok(pages.tools.every(t => t.studio === true && t.topic));
  assert.deepEqual(pages.tools.filter(t => !t.premium).map(t => t.slug).sort(), ['elasticity-lab', 'game-lab', 'graph-studio'], 'three free trainers');
  assert.deepEqual(pages, JSON.parse(readFileSync(`${D}/data/pages.json`, 'utf8')), 'the fixture copies the real pages.json');
  for (const t of pages.tools) for (const f of [`${D}/assets/tools/${t.slug}.js`, `${D}/assets/tools/math/${t.slug}.js`, `scripts/lib/apmicro-tool-checks/${t.slug}.mjs`, `scripts/test/apmicro-tool-${t.slug}.test.mjs`]) assert.ok(existsSync(f), f);
  const { root, files } = build(PUB);
  assert.ok(!files.some(f => /\/tools\/[^/]+\.html$/.test(f)), 'no tool page without data');
  const cur = readFileSync(join(root, `${D}/assets/mic-curriculum.js`), 'utf8');
  const list = JSON.parse(cur.match(/window\.ApMicroToolList = (.*);/)[1]);
  assert.equal(list.length, 8);
  assert.ok(list.every(t => !t.live && t.arrives));
  const data = mkdtempSync(join(tmpdir(), 'apmicro-data-'));
  cpSync(FIX, data, { recursive: true });
  mkdirSync(join(data, 'tools'), { recursive: true });
  writeFileSync(join(data, 'tools', 'factor-lab.json'), JSON.stringify({ slug: 'factor-lab', kind: 'simulator', topic: 'competitive-factor-markets', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: T }] }));
  writeFileSync(join(data, 'tools', 'externality-lab.json'), JSON.stringify({ slug: 'externality-lab', kind: 'simulator', topic: 'externalities', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: T }] }));
  const { root: out } = build('unit-5,unit-6', data);
  const page = readFileSync(join(out, `${D}/tools/factor-lab.html`), 'utf8');
  const srcs = [...page.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  const at = f => srcs.findIndex(s => s.endsWith(f));
  assert.ok(at('mic-calc.js') > -1 && at('mic-calc.js') < at('tools/math/factor-lab.js'), 'the calculations before the model');
  assert.ok(at('mic-graph.js') > -1 && at('mic-graph.js') < at('tools/math/factor-lab.js'), 'the graphs before the model');
  assert.ok(at('mic-matrix.js') > -1 && at('mic-matrix.js') < at('tools/math/factor-lab.js'), 'the matrix before the model');
  assert.ok(at('tools/mic-tool-math.js') < at('tools/math/factor-lab.js'), 'shared math before the model');
  assert.ok(at('tools/mic-tools.js') > at('tools/mic-tool-math.js'));
  assert.ok(at('tools/mic-plot.js') > -1, 'plot helper loaded');
  assert.ok(at('tools/factor-lab.js') > at('tools/mic-plot.js'));
  assert.ok(existsSync(join(out, `${D}/tools/externality-lab.html`)), 'Unit 6 is published');
  const { root: out2 } = build('unit-6', data);
  assert.ok(!existsSync(join(out2, `${D}/tools/factor-lab.html`)), 'Unit 5 is not published');
});

test('trademark wording', () => {
  assert.deepEqual(trademarkProblems('An AP® Microeconomics course. AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.'), []);
  assert.equal(trademarkProblems('AP Microeconomics').length, 1);
  assert.equal(trademarkProblems('AP Micro review').length > 0, true, 'no "AP Micro" shorthand');
  assert.equal(trademarkProblems('take two AP®s').length, 1);
  assert.equal(trademarkProblems('ready for the AP® exam').length, 1, 'use "AP® Microeconomics exam"');
  assert.deepEqual(trademarkProblems('the AP&reg; Microeconomics exam, a map, APA style'), []);
});

test('FRQ pages: long (10 points) then short (5), graph and matrix parts carried with their auto rubric points, the teachers page and share links', () => {
  const { root, files } = build(PUB);
  const rel = files.map(f => f.slice(root.length + 1));
  for (const t of ['long', 'short']) assert.ok(rel.includes(`${D}/frq/frq-placeholder-${t}.html`), t);
  for (const p of ['assets/frq/index.json', 'teachers.html', 'assets/summaries.json']) assert.ok(rel.includes(`${D}/${p}`), p);
  const index = JSON.parse(readFileSync(join(root, `${D}/assets/frq/index.json`), 'utf8'));
  assert.deepEqual(index.map(f => [f.type, f.points]), [['long', 10], ['short', 5]]);
  const long = JSON.parse(readFileSync(join(root, `${D}/assets/frq/frq-placeholder-long.json`), 'utf8'));
  assert.equal(long.typeName, 'Long free-response question');
  assert.deepEqual(long.parts.map(p => `${p.label}:${p.points}`), ['A:4', 'B:1', 'C:2', 'D(i):1', 'D(ii):2']);
  const [A, B] = long.parts;
  assert.equal(A.type, 'graph');
  assert.equal(A.graph.kind, 'pc', 'the two-panel market and firm graph');
  assert.deepEqual(A.graph.do, ['label', 'shift', 'line', 'point']);
  assert.deepEqual(A.rubric.map(r => r.auto), ['labels', 'shift', 'line', 'point'], 'one rubric point per graph check');
  assert.deepEqual([B.graph.do, B.rubric.map(r => r.auto)], [['shade'], ['shade']]);
  assert.match(long.stimulus.html, /<table/);
  assert.match(long.scenario, /^A placeholder market/, 'the scenario goes out with the question');
  const short = JSON.parse(readFileSync(join(root, `${D}/assets/frq/frq-placeholder-short.json`), 'utf8'));
  assert.equal(short.parts[0].type, 'matrix');
  assert.deepEqual(short.parts[0].matrix.do, ['dominant', 'nash'], 'the matrix travels with the part');
  assert.deepEqual(short.parts[0].rubric.map(r => r.auto), ['dominant', 'nash']);
  const page = readFileSync(join(root, `${D}/frq/frq-placeholder-long.html`), 'utf8');
  assert.ok(page.indexOf('class="mic-frq-scenario"') > -1 && page.indexOf('class="mic-frq-scenario"') < page.indexOf('class="mic-frq-parts"'), 'the scenario before the parts');
  assert.match(page, /class="mic-lines"/, 'printable lined space');
  assert.match(page, /class="mic-frq-grid"/, 'a grid to draw the graph on paper');
  assert.match(page, /four-function calculator/);
  assert.match(page, /about 25 minutes/);
  for (const f of ['mic-math.js', 'mic-calc.js', 'mic-graph.js', 'mic-matrix.js', 'mic-grade.js']) assert.ok(page.indexOf(`assets/${f}"`) > -1 && page.indexOf(`assets/${f}"`) < page.indexOf('pages/frq-kit.js'), `${f} before frq-kit.js`);
  assert.match(page, /placeholder question/i);
  assert.ok(!page.includes(long.parts[2].sample.slice(0, 50)), 'the sample answer is not in the page HTML');
  assert.match(readFileSync(join(root, `${D}/frq/frq-placeholder-short.html`), 'utf8'), /about 12 minutes/);
  for (const p of ['frq/frq-placeholder-long.html', `lessons/${T}.html`, `notes/${T}.html`, 'unit-sheets/unit-6.html']) {
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
  const data = mkdtempSync(join(tmpdir(), 'apmicro-data-'));
  cpSync(FIX, data, { recursive: true });
  const p = join(data, 'lessons', `${T}.json`);
  const L = JSON.parse(readFileSync(p, 'utf8'));
  L.summary = [...(Array.isArray(L.summary) ? L.summary : [String(L.summary)])];
  L.summary[0] += ' The share is $\\frak{1}{2}$ here.';
  writeFileSync(p, JSON.stringify(L));
  const out = mkdtempSync(join(tmpdir(), 'apmicro-build-'));
  assert.throws(() => execFileSync(process.execPath, ['scripts/build-apmicro.mjs', '--out', join(out, D)], { env: { ...process.env, APMICRO_DATA: data, APMICRO_PUBLISHED: PUB }, stdio: 'pipe' }), /frak/);
});

test('the real data passes the content check, and the fixture sample passes it too', () => {
  const run = env => execFileSync(process.execPath, ['scripts/check-apmicro-content.mjs', '--check'], { env: { ...process.env, ...env }, encoding: 'utf8' });
  assert.match(run({}), /0 failing/);
  assert.match(run({ APMICRO_DATA: FIX, APMICRO_PUBLISHED: PUB }), /1 topics, 23 items, 0 failing; bank 0, FRQ 0/);
});

function broken(edit) {
  const data = mkdtempSync(join(tmpdir(), 'apmicro-data-'));
  cpSync(FIX, data, { recursive: true });
  writeFileSync(join(data, 'published.json'), JSON.stringify({ chapters: PUB.split(',') }));
  edit(data);
  try { return execFileSync(process.execPath, ['scripts/check-apmicro-content.mjs', '--check'], { env: { ...process.env, APMICRO_DATA: data }, encoding: 'utf8', stdio: 'pipe' }); } catch (e) { return String(e.stdout) + String(e.stderr); }
}
const editQ = (data, fn) => { const p = join(data, 'questions', `${T}.json`); const q = JSON.parse(readFileSync(p, 'utf8')); fn(q); writeFileSync(p, JSON.stringify(q)); };
const editF = (id, fn) => d => { const p = join(d, 'frq', `${id}.json`); const f = JSON.parse(readFileSync(p, 'utf8')); fn(f); writeFileSync(p, JSON.stringify(f)); };
const item = (q, n) => q.items.find(x => x.id === `mic-${T}-${n}`);

test('a wrong numeric key, a taught slip, party politics, a macroeconomics topic or a setup item fails the content check', () => {
  assert.match(broken(d => editQ(d, q => { item(q, 4).numeric.answer = 40; })), new RegExp(`mic-${T}-4: numeric\\.answer 40 disagrees with its recipe: dwl gives 20`));
  assert.match(broken(d => editQ(d, q => { q.items[0].why.correct = 'Placeholder: the monopolist charges the price read from the MR curve at that quantity.'; })), /teaches a slip: the monopoly price read from MR/);
  assert.match(broken(d => editQ(d, q => { q.items[0].why.correct = 'Placeholder: a firm shuts down when the price falls below minimum ATC in the short run.'; })), /teaches a slip: shutting down below minimum ATC/);
  assert.match(broken(d => editQ(d, q => { q.items[0].why.correct = 'Placeholder: a dominant strategy is the one with the highest payoff in the matrix.'; })), /teaches a slip: a dominant strategy as the strategy with the highest payoff/);
  assert.match(broken(d => editQ(d, q => { q.items[0].why.correct = 'Placeholder: MRP = MR x P for a competitive firm.'; })), /teaches a slip: MRP as MR times P/);
  assert.match(broken(d => editQ(d, q => { q.items[0].q = 'Placeholder: Republicans raised the tax. What happens to the Gini coefficient?'; })), /language: party politics/);
  assert.match(broken(d => editQ(d, q => { q.items[0].q = 'Placeholder: aggregate demand falls. What happens to the Gini coefficient here?'; })), /a macroeconomics topic/);
  assert.match(broken(d => editQ(d, q => { const s = q.stimuli[`${T}-s1`]; delete s.invented; s.source = 'a website'; })), /must cite a real publisher and a year/);
  assert.match(broken(d => editQ(d, q => { q.items[0].type = 'setup'; })), /type must be one of single, multi, numeric, specific, order, graph, matrix/);
  assert.match(broken(d => editQ(d, q => { q.items[0].practice = '4.A'; })), /assessed only in the free-response section/);
  assert.doesNotMatch(broken(d => editQ(d, q => { q.items[0].why.correct = 'Placeholder: <span class="mic-slip">The monopolist charges the price read from the MR curve.</span> That is the classic slip; read the price from demand instead.'; })), /teaches a slip/);
});

test('a graph or matrix item the grader cannot score, or out of shape, fails the content check', () => {
  assert.match(broken(d => editQ(d, q => { item(q, 2).graph.key.shade = 'nowhere'; })), /graph\.key\.shade: "nowhere" is not a region of this graph/);
  assert.match(broken(d => editQ(d, q => { item(q, 21).graph.key.shade = 'tax-revenue'; })), /mic-inequality-21: graph\.key\.shade: "tax-revenue" is not a region of this graph \(wage-bill, dwl\)/);
  assert.match(broken(d => editQ(d, q => { item(q, 18).graph.key.point = { at: 'mrp=mfc' }; })), /"mrp=mfc" is not a named point of a monopoly graph/);
  assert.match(broken(d => editQ(d, q => { item(q, 19).graph.key.line = { to: 'moon' }; })), /graph\.key\.line\.to: "moon" is not a named point/);
  assert.match(broken(d => editQ(d, q => { item(q, 19).graph.key.shifts = [{ curve: 'AD', dir: 'left' }]; })), /unknown curve "AD"/);
  assert.match(broken(d => editQ(d, q => { delete item(q, 19).graph.key.because; })), /because/);
  assert.match(broken(d => editQ(d, q => { item(q, 2).graph.kind = 'is-lm'; })), /graph\.kind must be one of/);
  assert.match(broken(d => editQ(d, q => { item(q, 20).matrix.payoffs[0][0][0] = 20; })), /a tie leaves "better" undecided/);
  assert.match(broken(d => editQ(d, q => { item(q, 20).matrix.do = ['guess']; })), /matrix\.do: unknown task "guess"/);
  assert.match(broken(d => editQ(d, q => { item(q, 2).practice = '4.C'; item(q, 1).practice = '4.C'; })), new RegExp(`mic-${T}-1: skill 4\\.C \\(graphing\\) is assessed only`), 'graphing only on graph items');
});

test('an FRQ out of the exam shape fails the content check', () => {
  assert.match(broken(editF('frq-placeholder-long', f => { f.points = 7; })), /worth 10 points/);
  assert.match(broken(editF('frq-placeholder-short', f => { f.parts[1].points = 3; f.parts[1].rubric.push({ point: 'x', accept: [] }); })), /parts add up to 6 points, not 5/);
  assert.match(broken(editF('frq-placeholder-long', f => { for (const p of f.parts) { delete p.type; delete p.graph; (p.rubric || []).forEach(r => delete r.auto); } })), /at least one graph part/);
  assert.match(broken(editF('frq-placeholder-long', f => { f.parts[0].rubric[0].auto = 'shade'; })), /rubric auto "shade" is not a check this graph makes/);
  assert.match(broken(editF('frq-placeholder-short', f => { f.parts[0].rubric[0].auto = 'joint'; })), /rubric auto "joint" is not a check this matrix makes/);
  assert.match(broken(editF('frq-placeholder-long', f => { f.parts[2].label = 'third'; })), /label is A, B/);
  assert.match(broken(editF('frq-placeholder-short', f => { f.study = {}; })), /"study" is not used/);
  assert.match(broken(editF('frq-placeholder-long', f => { f.scenario = '<table><tr><td>A placeholder market in a table</td></tr></table>'; })), /scenario is plain text/);
  assert.match(broken(editF('frq-placeholder-long', f => { f.scenario = 'A placeholder market. <b>Draw</b> its graph.'; })), /the tasks .* go in the parts/);
});

test('an FRQ may not use a term taught after the topic it unlocks with; refiling it on that topic fixes it', () => {
  // Game theory (4.5) comes before the Lorenz curve (6.6).
  const late = f => { f.parts[1].sample += ' The firms would also face a Lorenz curve.'; };
  assert.match(broken(editF('frq-placeholder-short', late)), /ORDER \(unlocks with oligopoly-game-theory\): uses "Lorenz curve"/);
  assert.doesNotMatch(broken(editF('frq-placeholder-short', f => { late(f); f.topics.push('inequality'); f.units.push('unit-6'); })), /ORDER/);
  assert.match(broken(editF('frq-placeholder-short', f => { f.topics.push('inequality'); })), /topic inequality is in unit-6; list that unit/);
});

test('no help note in this course: the field and the pasted line are refused', () => {
  const editL = fn => d => { const p = join(d, 'lessons', `${T}.json`); const L = JSON.parse(readFileSync(p, 'utf8')); fn(L); writeFileSync(p, JSON.stringify(L)); };
  assert.match(broken(editL(L => { L.help = true; })), /"help" is not used in microeconomics/);
});

test('key position balance: no option holds the key in more than 40% of a topic, every position used once there are enough items', async () => {
  const { keyPositionTell } = await import('../check-apmicro-content.mjs');
  const q = (c, extra = {}) => ({ type: 'single', options: ['a', 'b', 'c', 'd'], correct: c, ...extra });
  assert.equal(keyPositionTell([0, 1, 2, 3, 0, 1, 2, 3].map(c => q(c))), null);
  assert.match(keyPositionTell([0, 0, 0, 1, 2, 3].map(c => q(c))), /option 1 in 3 of 6/);
  assert.match(keyPositionTell([0, 1, 2, 0, 1, 2, 0, 1, 2].map(c => q(c))), /never option 4/);
  assert.equal(keyPositionTell([0, 0, 0, 0, 0].map(c => q(c, { fixed: true }))), null, 'fixed items keep their order');
  assert.equal(keyPositionTell([0, 0, 1, 2].map(c => q(c))), null, 'too few items to judge');
});
