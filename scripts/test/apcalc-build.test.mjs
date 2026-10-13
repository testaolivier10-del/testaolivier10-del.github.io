/* The AP® Calculus AB generator against the real map and the placeholder
   sample in scripts/test/fixtures/apcalc-data (one Unit 6 topic, 6.8
   antiderivatives, and one FRQ per type; never in calculus/data): with Unit 6
   published it writes every page kind with math rendered and graphs
   plotted, and the pages pass the course's own site rules (trademark, Beta,
   Report a problem); with nothing published every page is noindex; no
   output path carries the token "ap"; the FRQ types carry 9 points and a
   calculator flag; a tool is built only when its data file exists and its
   topic is published. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import trademark from '../site-rules/apcalc-trademark.mjs';
import beta from '../site-rules/apcalc-beta-and-report.mjs';
import { trademarkProblems, hasApToken } from '../lib/apcalc-build.mjs';

const FIX = 'scripts/test/fixtures/apcalc-data';
const T = 'antiderivatives';
function build(published) {
  const root = mkdtempSync(join(tmpdir(), 'apcalc-build-'));
  execFileSync(process.execPath, ['scripts/build-apcalc.mjs', '--out', join(root, 'calculus')], { env: { ...process.env, APCALC_DATA: FIX, APCALC_PUBLISHED: published } });
  const files = [];
  const walk = d => { for (const n of readdirSync(d)) { const f = join(d, n); statSync(f).isDirectory() ? walk(f) : files.push(f); } };
  walk(root);
  return { root, files, html: files.filter(f => f.endsWith('.html')) };
}

test('a published unit builds every page kind, math rendered and graphs plotted, and the course rules pass', () => {
  const { root, files, html } = build('unit-6');
  const rel = files.map(f => f.slice(root.length + 1));
  for (const p of ['calculus/index.html', 'calculus/learn.html', 'calculus/glossary.html', 'calculus/units/unit-6.html', 'calculus/unit-sheets/unit-6.html', `calculus/lessons/${T}.html`, `calculus/notes/${T}.html`, 'calculus/practice.html', 'calculus/exams.html', 'calculus/frq.html', 'calculus/formula-sheet.html', 'calculus/score-calculator.html', 'calculus/unit-tests/unit-6.html', 'calculus/assets/bank/unit-6.json', 'calculus/assets/bank/unit-6-why.json', 'calculus/assets/bank/index.json', 'calculus/assets/calc-curriculum.js']) assert.ok(rel.includes(p), p);
  assert.ok(rel.every(r => !hasApToken(r.slice(5))));
  const fails = [];
  trademark({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  beta({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  assert.deepEqual(fails, []);
  const lesson = readFileSync(join(root, `calculus/lessons/${T}.html`), 'utf8');
  assert.match(lesson, /<title>Antiderivatives and Indefinite Integrals — AP® Calculus AB( Lesson)?( \| LevlPrep)?<\/title>/);
  assert.doesNotMatch(lesson, /"isAccessibleForFree": true/, 'Unit 6 lessons are Premium');
  assert.doesNotMatch(lesson, /noindex/);
  // Math is MathML at build time, with its TeX kept; no raw $ is left.
  assert.match(lesson, /<math class="calc-m"><semantics>/);
  assert.match(lesson, /<annotation encoding="application\/x-tex">\\int 3x\^2\\,dx = x\^3 \+ C<\/annotation>/);
  assert.doesNotMatch(lesson.replace(/<script[\s\S]*?<\/script>/g, ''), /\$[^<]*\\(frac|int)/);
  // The graph stimulus is drawn from its spec, and its kind is labeled.
  assert.match(lesson, /class="calc-stim"[\s\S]*Graph[\s\S]*<svg class="calc-plot"[^>]*role="img" aria-label="Graph of f\(x\) = 3x squared/);
  assert.doesNotMatch(lesson, /periodic-table/, 'no periodic table in calculus');
  // The question engine is loaded with the parser and the renderer before it.
  const srcs = [...lesson.matchAll(/<script src="([^"]+)"/g)].map(m => m[1].replace(/^.*assets\//, ''));
  assert.ok(srcs.indexOf('calc-expr.js') > -1 && srcs.indexOf('calc-expr.js') < srcs.indexOf('calc-math.js') && srcs.indexOf('calc-math.js') < srcs.indexOf('calc-questions.js'));
  const desc = lesson.match(/name="description" content="([^"]*)"/)[1];
  assert.doesNotMatch(desc, /\bAP\b|<math|\$/);
  assert.match(desc, /∫|antiderivative/);
  // The static (no-JavaScript) key of an expr item is rendered math, with + C.
  assert.match(lesson, /Answer: <math class="calc-m">[\s\S]*?<annotation encoding="application\/x-tex">\\int f\(x\)\\,dx =<\/annotation>[\s\S]*?x\^\{3\} \+ C<\/annotation>/);
  // The bank: rendered math, the expr key's HTML, the exact numeric key's value, the calculator flag.
  const bank = JSON.parse(readFileSync(join(root, 'calculus/assets/bank/unit-6.json'), 'utf8'));
  const by = id => bank.items.find(q => q.id === `calc-${T}-${id}`);
  assert.match(by(3).expr.answerHtml, /<math/); assert.equal(by(3).expr.answer, 'x^3');
  assert.ok(Math.abs(by(11).numeric.value - 1 / 3) < 1e-15); assert.match(by(11).numeric.answerHtml, /<mfrac>/);
  assert.equal(by(9).calc, true); assert.equal(by(10).calc, undefined);
  const cur = readFileSync(join(root, 'calculus/assets/calc-curriculum.js'), 'utf8');
  const CU = JSON.parse(cur.match(/window\.ApCalcCurriculum = (.*);/)[1]);
  assert.equal(CU.units.filter(u => u.part === 'course').length, 8);
  assert.equal(CU.topics.filter(t => t.kind === 'concept').length, 81);
  const order = CU.topics.map(t => t.id);
  assert.ok(order.indexOf('math-functions') < order.indexOf('change-at-an-instant'), 'the math you need comes first');
  assert.ok(CU.topics.find(t => t.id === 'math-trig').free, 'math lessons are free');
  // One fixture topic fits one file; the real Unit 6 is split by gzipped size (bankPlan).
  assert.equal(CU.topics.find(t => t.id === T).bank, undefined);
});

test('nothing published: no topic pages, every page noindex', () => {
  const { html } = build('');
  assert.ok(html.length > 5);
  assert.ok(!html.some(f => /\/(lessons|notes|units)\//.test(f)));
  for (const f of html) assert.match(readFileSync(f, 'utf8'), /<meta name="robots" content="noindex/, f);
});

test('the course home has its own headline, crimson and the integral sign, not Physics\'', () => {
  const { root } = build('unit-6');
  const home = readFileSync(join(root, 'calculus/index.html'), 'utf8');
  assert.match(home, /<h1>AP&reg; Calculus AB, one idea at a time\.<\/h1>/);
  assert.doesNotMatch(home, /Chemistry|Biology|Physics|force|pendulum|Point Particle/);
  assert.match(home, /assets\/calc\.css/);
  assert.match(home, /Limit Seeker/);
  assert.match(home, /--pc:#C2305A/);
  const css = readFileSync('calculus/assets/calc.css', 'utf8');
  assert.match(css, /body\.calc\{--ctint:#FCE8EE;--cink:#8C1036;\}/);
  assert.match(readFileSync('assets/theme.css', 'utf8'), /body\[data-course="apcalc"\]\{--ctint:#FCE8EE;--cink:#8C1036;\}/);
});

test('tools: pre-registered, built only with a data file and a published topic, loading their own model and the plot helper', () => {
  const pages = JSON.parse(readFileSync(join(FIX, 'pages.json'), 'utf8'));
  assert.equal(pages.tools.length, 10);
  assert.deepEqual(pages.tools.map(t => t.slug).sort(), ['accumulation', 'area-volume', 'curve-analyzer', 'limit-explorer', 'motion-lab', 'related-rates', 'riemann-sums', 'rule-drills', 'slope-fields', 'tangent-tracer']);
  assert.ok(pages.tools.every(t => t.studio === true && t.topic));
  assert.deepEqual(pages.tools.filter(t => !t.premium).map(t => t.slug).sort(), ['limit-explorer', 'rule-drills', 'tangent-tracer'], 'three free trainers (spec section 6)');
  const { root, files } = build('unit-6');
  assert.ok(!files.some(f => /\/tools\/[^/]+\.html$/.test(f)), 'no tool page without data');
  const cur = readFileSync(join(root, 'calculus/assets/calc-curriculum.js'), 'utf8');
  const list = JSON.parse(cur.match(/window\.ApCalcToolList = (.*);/)[1]);
  assert.equal(list.length, 10);
  assert.ok(list.every(t => !t.live && t.arrives));
  const data = mkdtempSync(join(tmpdir(), 'apcalc-data-'));
  cpSync(FIX, data, { recursive: true });
  mkdirSync(join(data, 'tools'), { recursive: true });
  writeFileSync(join(data, 'tools', 'riemann-sums.json'), JSON.stringify({ slug: 'riemann-sums', kind: 'simulator', topic: 'riemann-sums', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'riemann-sums' }] }));
  writeFileSync(join(data, 'tools', 'tangent-tracer.json'), JSON.stringify({ slug: 'tangent-tracer', kind: 'simulator', topic: 'derivative-definition', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'derivative-definition' }] }));
  const out = mkdtempSync(join(tmpdir(), 'apcalc-build-'));
  execFileSync(process.execPath, ['scripts/build-apcalc.mjs', '--out', join(out, 'calculus')], { env: { ...process.env, APCALC_DATA: data, APCALC_PUBLISHED: 'unit-6' } });
  const page = readFileSync(join(out, 'calculus/tools/riemann-sums.html'), 'utf8');
  const srcs = [...page.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  const at = f => srcs.findIndex(s => s.endsWith(f));
  assert.ok(at('calc-expr.js') > -1 && at('calc-expr.js') < at('tools/calc-tool-math.js'), 'the parser before the shared math');
  assert.ok(at('tools/calc-tool-math.js') < at('tools/math/riemann-sums.js'), 'shared math before the model');
  assert.ok(at('tools/calc-tools.js') > at('tools/calc-tool-math.js'));
  assert.ok(at('tools/calc-plot.js') > -1, 'plot helper loaded');
  assert.ok(at('tools/riemann-sums.js') > at('tools/calc-plot.js'));
  // A tool's own stylesheet is linked exactly when the file exists.
  const hasCss = existsSync('calculus/assets/tools/riemann-sums.css');
  assert.equal(/<link [^>]*href="[^"]*tools\/riemann-sums\.css"/.test(page), hasCss, hasCss ? 'its stylesheet is linked' : 'no link to a missing stylesheet');
  assert.ok(!existsSync(join(out, 'calculus/tools/tangent-tracer.html')), 'Unit 2 is not published');
});

test('trademark wording', () => {
  assert.deepEqual(trademarkProblems('An AP® Calculus AB course. AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.'), []);
  assert.equal(trademarkProblems('AP Calculus AB').length, 1);
  assert.equal(trademarkProblems('take two AP®s').length, 1);
  assert.equal(trademarkProblems("the AP®'s format").length, 1);
  assert.equal(trademarkProblems('ready for the AP® exam').length, 1, 'lowercase noun: use "AP® Calculus AB exam"');
  assert.deepEqual(trademarkProblems('the AP&reg; Calculus AB exam, a map, APA style'), []);
});

test('FRQ pages: every type, 9 points, a calculator flag, graph space, the index, the teachers page and share links', () => {
  const { root, files } = build('unit-6');
  const rel = files.map(f => f.slice(root.length + 1));
  const TYPES = ['table', 'model', 'motion', 'area', 'de', 'graph', 'implicit', 'fg'];
  for (const t of TYPES) assert.ok(rel.includes(`calculus/frq/frq-placeholder-${t}.html`), t);
  for (const p of ['calculus/assets/frq/index.json', 'calculus/teachers.html', 'calculus/assets/summaries.json']) assert.ok(rel.includes(p), p);
  const index = JSON.parse(readFileSync(join(root, 'calculus/assets/frq/index.json'), 'utf8'));
  assert.deepEqual(index.map(f => f.type), TYPES);
  assert.ok(index.every(f => f.points === 9 && typeof f.calc === 'boolean'));
  assert.deepEqual(index.filter(f => f.calc).map(f => f.type), ['table', 'model']);
  const one = JSON.parse(readFileSync(join(root, 'calculus/assets/frq/frq-placeholder-graph.json'), 'utf8'));
  assert.ok(one.stimulus.html.includes('<svg class="calc-plot"') && one.parts.every(p => p.rubric.length === p.points && p.sample));
  assert.equal(one.typeName, 'Graph of f′ or graphical FTC');
  assert.equal(one.parts[0].space, 'graph');
  const de = JSON.parse(readFileSync(join(root, 'calculus/assets/frq/frq-placeholder-de.json'), 'utf8'));
  assert.match(de.stimulus.html, /<g class="calc-plot-field">/, 'a slope field is plotted');
  const page = readFileSync(join(root, 'calculus/frq/frq-placeholder-graph.html'), 'utf8');
  assert.match(page, /class="calc-lines"/, 'printable lined space');
  assert.match(page, /class="calc-frq-grid"/, 'a grid for the sketch part');
  assert.match(page, /Part B: no calculator/);
  assert.match(readFileSync(join(root, 'calculus/frq/frq-placeholder-table.html'), 'utf8'), /Part A: graphing calculator allowed/);
  assert.match(page, /placeholder question/);
  assert.ok(!page.includes(one.parts[3].sample.slice(0, 50)), 'the sample answer is not in the page HTML');
  for (const p of ['calculus/frq/frq-placeholder-fg.html', `calculus/lessons/${T}.html`, `calculus/notes/${T}.html`, 'calculus/unit-sheets/unit-6.html']) {
    const h = readFileSync(join(root, p), 'utf8');
    const gc = h.match(/href="(https:\/\/classroom\.google\.com\/share\?url=[^"]+)"/);
    assert.ok(gc, `${p}: Share to Google Classroom`);
    const u = new URL(gc[1].replace(/&amp;/g, '&'));
    assert.equal(u.searchParams.get('url'), `https://levlprep.com/calculus/${p.slice('calculus/'.length)}`);
    assert.doesNotMatch(u.searchParams.get('title'), /\bAP\b/);
  }
  const teachers = readFileSync(join(root, 'calculus/teachers.html'), 'utf8');
  assert.match(teachers, new RegExp(`practice\\.html\\?topic=${T}`));
  assert.match(teachers, /privacy\.html#schools/);
});

test('a TeX typo in a built topic stops the build', () => {
  const data = mkdtempSync(join(tmpdir(), 'apcalc-data-'));
  cpSync(FIX, data, { recursive: true });
  const p = join(data, 'lessons', `${T}.json`);
  writeFileSync(p, readFileSync(p, 'utf8').replace('An antiderivative undoes a derivative.', 'An antiderivative $\\\\frak{1}{2}$ undoes a derivative.'));
  const out = mkdtempSync(join(tmpdir(), 'apcalc-build-'));
  assert.throws(() => execFileSync(process.execPath, ['scripts/build-apcalc.mjs', '--out', join(out, 'calculus')], { env: { ...process.env, APCALC_DATA: data, APCALC_PUBLISHED: 'unit-6' }, stdio: 'pipe' }), /frak/);
});

test('the real calculus/data passes the content check, and the fixture sample passes it too', () => {
  const run = env => execFileSync(process.execPath, ['scripts/check-apcalc-content.mjs', '--check'], { env: { ...process.env, ...env }, encoding: 'utf8' });
  assert.match(run({}), /0 failing/);
  assert.match(run({ APCALC_DATA: FIX }), /1 topics, 15 items, 0 failing/);
});
