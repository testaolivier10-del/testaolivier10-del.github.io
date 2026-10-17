/* The AP® Statistics generator against the real map and the placeholder
   sample in scripts/test/fixtures/apstat-data (one Unit 4 topic, 4.5
   carrying out a test for a mean, and one FRQ per type; never in
   statistics/data): with Unit 4 published it writes every page kind with
   math rendered and plots drawn from their data, and the pages pass the
   course's own site rules (trademark, Beta, Report a problem); with nothing
   published every page is noindex; no output path carries the token "ap";
   the four FRQ types carry 10 points; there is no score calculator; a tool
   is built only when its data file exists and its topic is published. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import trademark from '../site-rules/apstat-trademark.mjs';
import beta from '../site-rules/apstat-beta-and-report.mjs';
import { trademarkProblems, hasApToken } from '../lib/apstat-build.mjs';

const FIX = 'scripts/test/fixtures/apstat-data';
const T = 'test-one-mean';
function build(published) {
  const root = mkdtempSync(join(tmpdir(), 'apstat-build-'));
  execFileSync(process.execPath, ['scripts/build-apstat.mjs', '--out', join(root, 'statistics')], { env: { ...process.env, APSTAT_DATA: FIX, APSTAT_PUBLISHED: published } });
  const files = [];
  const walk = d => { for (const n of readdirSync(d)) { const f = join(d, n); statSync(f).isDirectory() ? walk(f) : files.push(f); } };
  walk(root);
  return { root, files, html: files.filter(f => f.endsWith('.html')) };
}

test('a published unit builds every page kind, math rendered and plots drawn, and the course rules pass', () => {
  const { root, files, html } = build('unit-4');
  const rel = files.map(f => f.slice(root.length + 1));
  for (const p of ['statistics/index.html', 'statistics/learn.html', 'statistics/glossary.html', 'statistics/units/unit-4.html', 'statistics/unit-sheets/unit-4.html', `statistics/lessons/${T}.html`, `statistics/notes/${T}.html`, 'statistics/practice.html', 'statistics/exams.html', 'statistics/frq.html', 'statistics/formula-sheet.html', 'statistics/unit-tests/unit-4.html', 'statistics/assets/bank/unit-4.json', 'statistics/assets/bank/unit-4-why.json', 'statistics/assets/bank/index.json', 'statistics/assets/stat-curriculum.js']) assert.ok(rel.includes(p), p);
  assert.ok(!rel.includes('statistics/score-calculator.html'), 'no score calculator (spec decision 6)');
  assert.ok(rel.every(r => !hasApToken(r.slice(5))));
  const fails = [];
  trademark({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  beta({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  assert.deepEqual(fails, []);
  const lesson = readFileSync(join(root, `statistics/lessons/${T}.html`), 'utf8');
  assert.match(lesson, /<title>Carrying Out a Test for a Population Mean.* — AP® Statistics( Lesson)?( \| LevlPrep)?<\/title>/);
  assert.doesNotMatch(lesson, /"isAccessibleForFree": true/, 'Unit 4 lessons are Premium');
  assert.doesNotMatch(lesson, /noindex/);
  assert.match(lesson, /<body class="stat"/);
  // Math is MathML at build time, with its TeX kept; no raw $ is left.
  assert.match(lesson, /<math class="stat-m"><semantics>/);
  assert.match(readFileSync(join(root, `statistics/notes/${T}.html`), 'utf8'), /<mover accent="true"><mi>x<\/mi>/, 'x-bar is an accent');
  assert.doesNotMatch(lesson.replace(/<script[\s\S]*?<\/script>/g, ''), /\$[^<]*\\(frac|bar|hat)/);
  // The boxplot stimulus is drawn from its data, and its kind is labeled.
  assert.match(lesson, /class="stat-stim"[\s\S]*Graph[\s\S]*<svg class="stat-plot"[^>]*role="img" aria-label="Boxplot of warm-up times/);
  // The question engine is loaded with the parser, renderer, distributions and graders before it.
  const srcs = [...lesson.matchAll(/<script src="([^"]+)"/g)].map(m => m[1].replace(/^.*assets\//, ''));
  const at = f => srcs.indexOf(f);
  assert.ok(at('stat-expr.js') > -1 && at('stat-expr.js') < at('stat-math.js') && at('stat-math.js') < at('stat-dist.js') && at('stat-dist.js') < at('stat-grade.js') && at('stat-grade.js') < at('stat-questions.js'));
  const desc = lesson.match(/name="description" content="([^"]*)"/)[1];
  assert.doesNotMatch(desc, /\bAP\b|<math|\$/);
  // The bank: keys recomputed from their recipe, setup keys rendered, conclude slots generated, set kinds in the index.
  const bank = JSON.parse(readFileSync(join(root, 'statistics/assets/bank/unit-4.json'), 'utf8'));
  const by = id => bank.items.find(q => q.id === `stat-${T}-${id}`);
  assert.equal(by(2).numeric.answer, 15.5, 'median recomputed by ApStatDist.summary');
  assert.equal(by(3).numeric.answer, 7, 'IQR by the AP quartile rule');
  assert.ok(by(8).interval.lo < 18.36 && by(8).interval.hi > 18.36);
  assert.match(by(9).setup.answerHtml, /<mfrac>/);
  assert.equal(by(11).conclude.slots.decision.correct, 0);
  assert.ok(bank.items.every(q => q.calc === undefined), 'no calculator flags');
  const idx = JSON.parse(readFileSync(join(root, 'statistics/assets/bank/index.json'), 'utf8'));
  assert.ok(idx.t[T].split(',').filter(e => e.endsWith('.p')).length === 3, 'the probability set\'s three items are marked');
  const cur = readFileSync(join(root, 'statistics/assets/stat-curriculum.js'), 'utf8');
  const CU = JSON.parse(cur.match(/window\.ApStatCurriculum = (.*);/)[1]);
  assert.equal(CU.units.filter(u => u.part === 'course').length, 5);
  assert.equal(CU.topics.filter(t => t.kind === 'concept').length, 55);
  const order = CU.topics.map(t => t.id);
  assert.ok(order.indexOf('math-counting') < order.indexOf('binomial-distribution'), 'the math you need comes before it is used');
  assert.ok(CU.topics.find(t => t.id === 'math-lines').free, 'math lessons are free');
  assert.ok(CU.topics.find(t => t.id === 'experimental-design').free, 'Unit 1 is free (decision 10)');
  assert.ok(!CU.topics.find(t => t.id === 'conditional-probability').free, 'Unit 2 is Premium (decision 10)');
  assert.equal(CU.topics.find(t => t.id === T).bank, undefined);
});

test('nothing published: no topic pages, every page noindex', () => {
  const { html } = build('');
  assert.ok(html.length > 5);
  assert.ok(!html.some(f => /\/(lessons|notes|units)\//.test(f)));
  for (const f of html) assert.match(readFileSync(f, 'utf8'), /<meta name="robots" content="noindex/, f);
});

test('the course home has its own headline, plum and the bell curve, not Calculus\'', () => {
  const { root } = build('unit-4');
  const home = readFileSync(join(root, 'statistics/index.html'), 'utf8');
  assert.match(home, /<h1>AP&reg; Statistics, one idea at a time\.<\/h1>/);
  assert.doesNotMatch(home, /Chemistry|Biology|Physics|Calculus|derivative|integral|Limit Seeker|score-calculator/);
  assert.match(home, /assets\/stat\.css/);
  assert.match(home, /Data Collector/);
  assert.match(home, /--pc:#9B3F98/);
  const css = readFileSync('statistics/assets/stat.css', 'utf8');
  assert.match(css, /body\.stat\{--ctint:#F5E6F4;--cink:#6E2470;\}/);
  assert.match(readFileSync('assets/theme.css', 'utf8'), /body\[data-course="apstat"\]\{--ctint:#F5E6F4;--cink:#6E2470;\}/);
});

test('tools: pre-registered, built only with a data file and a published topic, loading their own model and the plot helper', () => {
  const pages = JSON.parse(readFileSync(join(FIX, 'pages.json'), 'utf8'));
  assert.equal(pages.tools.length, 10);
  assert.deepEqual(pages.tools.map(t => t.slug).sort(), ['chi-square-lab', 'ci-capture', 'data-explorer', 'design-randomizer', 'distribution-areas', 'p-value-explorer', 'probability-trees', 'regression-lab', 'sampling-distributions', 'sampling-lab']);
  assert.ok(pages.tools.every(t => t.studio === true && t.topic));
  assert.deepEqual(pages.tools.filter(t => !t.premium).map(t => t.slug).sort(), ['data-explorer', 'probability-trees', 'sampling-distributions'], 'three free trainers (spec section 6)');
  assert.deepEqual(pages, JSON.parse(readFileSync('statistics/data/pages.json', 'utf8')).tools ? { ...pages, about: pages.about } : pages);
  assert.deepEqual(pages.tools, JSON.parse(readFileSync('statistics/data/pages.json', 'utf8')).tools, 'the fixture copies the real pages.json');
  const { root, files } = build('unit-4');
  assert.ok(!files.some(f => /\/tools\/[^/]+\.html$/.test(f)), 'no tool page without data');
  const cur = readFileSync(join(root, 'statistics/assets/stat-curriculum.js'), 'utf8');
  const list = JSON.parse(cur.match(/window\.ApStatToolList = (.*);/)[1]);
  assert.equal(list.length, 10);
  assert.ok(list.every(t => !t.live && t.arrives));
  const data = mkdtempSync(join(tmpdir(), 'apstat-data-'));
  cpSync(FIX, data, { recursive: true });
  mkdirSync(join(data, 'tools'), { recursive: true });
  // Move a Unit 4 trainer onto the fixture topic, so it can be built.
  const pj = JSON.parse(readFileSync(join(data, 'pages.json'), 'utf8'));
  pj.tools.find(t => t.slug === 'ci-capture').topic = T;
  writeFileSync(join(data, 'pages.json'), JSON.stringify(pj));
  writeFileSync(join(data, 'tools', 'ci-capture.json'), JSON.stringify({ slug: 'ci-capture', kind: 'simulator', topic: T, intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: T }] }));
  writeFileSync(join(data, 'tools', 'regression-lab.json'), JSON.stringify({ slug: 'regression-lab', kind: 'simulator', topic: 'least-squares-regression', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'least-squares-regression' }] }));
  const out = mkdtempSync(join(tmpdir(), 'apstat-build-'));
  execFileSync(process.execPath, ['scripts/build-apstat.mjs', '--out', join(out, 'statistics')], { env: { ...process.env, APSTAT_DATA: data, APSTAT_PUBLISHED: 'unit-4' } });
  const page = readFileSync(join(out, 'statistics/tools/ci-capture.html'), 'utf8');
  const srcs = [...page.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  const at = f => srcs.findIndex(s => s.endsWith(f));
  assert.ok(at('stat-expr.js') > -1 && at('stat-expr.js') < at('tools/stat-tool-math.js'), 'the parser before the shared math');
  assert.ok(at('stat-dist.js') > -1 && at('stat-dist.js') < at('tools/math/ci-capture.js'), 'distributions before the model');
  assert.ok(at('tools/stat-tool-math.js') < at('tools/math/ci-capture.js'), 'shared math before the model');
  assert.ok(at('tools/stat-tools.js') > at('tools/stat-tool-math.js'));
  assert.ok(at('tools/stat-plot.js') > -1, 'plot helper loaded');
  assert.ok(at('tools/ci-capture.js') > at('tools/stat-plot.js'));
  // A tool's own stylesheet is linked exactly when the file exists.
  const hasCss = existsSync('statistics/assets/tools/ci-capture.css');
  assert.equal(/<link [^>]*href="[^"]*tools\/ci-capture\.css"/.test(page), hasCss, hasCss ? 'its stylesheet is linked' : 'no link to a missing stylesheet');
  assert.ok(!existsSync(join(out, 'statistics/tools/regression-lab.html')), 'Unit 5 is not published');
});

test('trademark wording', () => {
  assert.deepEqual(trademarkProblems('An AP® Statistics course. AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.'), []);
  assert.equal(trademarkProblems('AP Statistics').length, 1);
  assert.equal(trademarkProblems('take two AP®s').length, 1);
  assert.equal(trademarkProblems("the AP®'s format").length, 1);
  assert.equal(trademarkProblems('ready for the AP® exam').length, 1, 'lowercase noun: use "AP® Statistics exam"');
  assert.deepEqual(trademarkProblems('the AP&reg; Statistics exam, a map, APA style'), []);
});

test('FRQ pages: the four types, 10 points, the index, the teachers page and share links', () => {
  const { root, files } = build('unit-4');
  const rel = files.map(f => f.slice(root.length + 1));
  const TYPES = ['collect', 'analyze', 'inference', 'multi'];
  for (const t of TYPES) assert.ok(rel.includes(`statistics/frq/frq-placeholder-${t}.html`), t);
  for (const p of ['statistics/assets/frq/index.json', 'statistics/teachers.html', 'statistics/assets/summaries.json']) assert.ok(rel.includes(p), p);
  const index = JSON.parse(readFileSync(join(root, 'statistics/assets/frq/index.json'), 'utf8'));
  assert.deepEqual(index.map(f => f.type), TYPES);
  assert.ok(index.every(f => f.points === 10 && f.calc === undefined));
  const one = JSON.parse(readFileSync(join(root, 'statistics/assets/frq/frq-placeholder-inference.json'), 'utf8'));
  assert.ok(one.stimulus.html.includes('<svg class="stat-plot"') && one.parts.every(p => p.rubric.length === p.points && p.sample));
  assert.equal(one.typeName, 'Q3: Inference (a test or an interval)');
  assert.equal(one.parts[2].check.numeric.kind, 'pvalue', 'a "check my number" box rides along');
  const page = readFileSync(join(root, 'statistics/frq/frq-placeholder-inference.html'), 'utf8');
  assert.match(page, /class="stat-lines"/, 'printable lined space');
  assert.match(page, /calculator allowed/);
  assert.match(page, /placeholder question/);
  assert.ok(!page.includes(one.parts[3].sample.slice(0, 50)), 'the sample answer is not in the page HTML');
  for (const p of ['statistics/frq/frq-placeholder-multi.html', `statistics/lessons/${T}.html`, `statistics/notes/${T}.html`, 'statistics/unit-sheets/unit-4.html']) {
    const h = readFileSync(join(root, p), 'utf8');
    const gc = h.match(/href="(https:\/\/classroom\.google\.com\/share\?url=[^"]+)"/);
    assert.ok(gc, `${p}: Share to Google Classroom`);
    const u = new URL(gc[1].replace(/&amp;/g, '&'));
    assert.equal(u.searchParams.get('url'), `https://levlprep.com/statistics/${p.slice('statistics/'.length)}`);
    assert.doesNotMatch(u.searchParams.get('title'), /\bAP\b/);
  }
  const teachers = readFileSync(join(root, 'statistics/teachers.html'), 'utf8');
  assert.match(teachers, new RegExp(`practice\\.html\\?topic=${T}`));
  assert.match(teachers, /privacy\.html#schools/);
});

test('a TeX typo in a built topic stops the build', () => {
  const data = mkdtempSync(join(tmpdir(), 'apstat-data-'));
  cpSync(FIX, data, { recursive: true });
  const p = join(data, 'lessons', `${T}.json`);
  writeFileSync(p, readFileSync(p, 'utf8').replace('The mean and standard deviation use every value', 'The mean $\\\\frak{1}{2}$ and standard deviation use every value'));
  const out = mkdtempSync(join(tmpdir(), 'apstat-build-'));
  assert.throws(() => execFileSync(process.execPath, ['scripts/build-apstat.mjs', '--out', join(out, 'statistics')], { env: { ...process.env, APSTAT_DATA: data, APSTAT_PUBLISHED: 'unit-4' }, stdio: 'pipe' }), /frak/);
});

test('the real statistics/data passes the content check, and the fixture sample passes it too', () => {
  const run = env => execFileSync(process.execPath, ['scripts/check-apstat-content.mjs', '--check'], { env: { ...process.env, ...env }, encoding: 'utf8' });
  assert.match(run({}), /0 failing/);
  assert.match(run({ APSTAT_DATA: FIX }), /1 topics, 15 items, 0 failing/);
});
