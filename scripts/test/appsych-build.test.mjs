/* The AP® Psychology generator against the real map and the
   placeholder sample in scripts/test/fixtures/appsych-data (one Unit 3 topic,
   human population dynamics, and one FRQ per type; never in
   psychology/data): with Unit 3 published it writes every page
   kind with math rendered and plots drawn from their data, and the pages pass
   the course's own site rules (trademark, Beta, Report a problem); with
   nothing published every page is noindex; no output path carries the token
   "ap"; the three FRQ types carry 10 points; numeric and setup keys are
   recomputed by ApPsychCalc; a tool is built only when its data file exists and
   its topic is published. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import trademark from '../site-rules/appsych-trademark.mjs';
import beta from '../site-rules/appsych-beta-and-report.mjs';
import { trademarkProblems, hasApToken } from '../lib/appsych-build.mjs';

const FIX = 'scripts/test/fixtures/appsych-data';
const T = 'human-population';
const D = 'psychology';
function build(published, data = FIX) {
  const root = mkdtempSync(join(tmpdir(), 'appsych-build-'));
  execFileSync(process.execPath, ['scripts/build-appsych.mjs', '--out', join(root, D)], { env: { ...process.env, APPSYCH_DATA: data, APPSYCH_PUBLISHED: published } });
  const files = [];
  const walk = d => { for (const n of readdirSync(d)) { const f = join(d, n); statSync(f).isDirectory() ? walk(f) : files.push(f); } };
  walk(root);
  return { root, files, html: files.filter(f => f.endsWith('.html')) };
}

test('a published unit builds every page kind, math rendered and plots drawn, and the course rules pass', () => {
  const { root, files, html } = build('unit-3');
  const rel = files.map(f => f.slice(root.length + 1));
  for (const p of ['index.html', 'learn.html', 'glossary.html', 'units/unit-3.html', 'unit-sheets/unit-3.html', `lessons/${T}.html`, `notes/${T}.html`, 'practice.html', 'exams.html', 'frq.html', 'justify.html', 'formula-sheet.html', 'unit-tests/unit-3.html', 'assets/bank/unit-3.json', 'assets/bank/unit-3-why.json', 'assets/bank/index.json', 'assets/psy-curriculum.js']) assert.ok(rel.includes(`${D}/${p}`), p);
  assert.ok(!rel.includes(`${D}/score-calculator.html`), 'no score calculator');
  assert.ok(rel.every(r => !hasApToken(r.slice(D.length + 1))), 'no "ap" token in a served path');
  const fails = [];
  trademark({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  beta({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  assert.deepEqual(fails, []);
  const lesson = readFileSync(join(root, `${D}/lessons/${T}.html`), 'utf8');
  assert.match(lesson, /<title>Human Population Dynamics.* — AP® Psychology( Lesson)?( \| LevlPrep)?<\/title>/);
  assert.doesNotMatch(lesson, /"isAccessibleForFree": true/, 'Unit 3 lessons are Premium');
  assert.doesNotMatch(lesson, /noindex/);
  assert.match(lesson, /<body class="psy"/);
  assert.match(lesson, /<math class="psy-m"><semantics>/, 'math is MathML at build time');
  assert.doesNotMatch(lesson.replace(/<script[\s\S]*?<\/script>/g, ''), /\$[^<]*\\(frac|times)/);
  // Stimuli: a labeled data table; the pyramid drawn from its numbers.
  assert.match(lesson, /class="psy-stim"[^>]*><p class="psy-stim-k">Data<\/p>[\s\S]*?<table/);
  assert.match(readFileSync(join(root, `${D}/unit-tests/unit-3.html`), 'utf8'), /<svg class="psy-plot"[^>]*role="img" aria-label="Placeholder population pyramid/);
  // The question engine loads the parser, math, calculator and grader before it.
  const srcs = [...lesson.matchAll(/<script src="([^"]+)"/g)].map(m => m[1].replace(/^.*assets\//, ''));
  const at = f => srcs.indexOf(f);
  assert.ok(at('psy-expr.js') > -1 && at('psy-expr.js') < at('psy-math.js') && at('psy-math.js') < at('psy-calc.js') && at('psy-calc.js') < at('psy-grade.js') && at('psy-grade.js') < at('psy-questions.js'), srcs.join(' '));
  const desc = lesson.match(/name="description" content="([^"]*)"/)[1];
  assert.doesNotMatch(desc, /\bAP\b|<math|\$/);
  // The bank: keys recomputed by ApPsychCalc, setup keys rendered, specific slots, set kinds in the index.
  const bank = JSON.parse(readFileSync(join(root, `${D}/assets/bank/unit-3.json`), 'utf8'));
  const by = id => bank.items.find(q => q.id === `psy-${T}-${id}`);
  assert.equal(by(2).numeric.answer, 2, 'natural increase (30 - 10) / 10 = 2%');
  assert.equal(by(4).numeric.answer, 2055, 'doubling year 2020 + 70 / 2');
  assert.equal(by(4).numeric.mistakes[0].value, 35, 'a mistake recipe gets its value');
  assert.equal(by(5).setup.then.answer, 25, 'the setup value step: percent change 120 to 150');
  assert.match(by(5).setup.answerHtml, /<mfrac>/);
  assert.ok(by(15).specific.slots && Object.keys(by(15).specific.slots).length >= 2, 'specific slots');
  assert.ok(bank.items.some(q => (q.stim || '').length || q.stimulus), 'stimuli ride with their items');
  const idx = JSON.parse(readFileSync(join(root, `${D}/assets/bank/index.json`), 'utf8'));
  const codes = idx.t[T].split(',').map(e => e.split('.').pop());
  assert.deepEqual(['q', 'v', 'x'].map(c => codes.filter(x => x === c).length), [3, 3, 3], 'each set kind marked: quantitative, visual, text');
  const cur = readFileSync(join(root, `${D}/assets/psy-curriculum.js`), 'utf8');
  const CU = JSON.parse(cur.match(/window\.ApPsychCurriculum = (.*);/)[1]);
  assert.equal(CU.units.filter(u => u.part === 'course').length, 9);
  assert.equal(CU.topics.filter(t => t.kind === 'concept').length, 99, 'every CED topic');
  const order = CU.topics.map(t => t.id);
  assert.ok(order.indexOf('math-doubling') < order.indexOf('population-growth'), 'the math you need comes before it is used');
  assert.ok(CU.topics.find(t => t.id === 'math-percents').free, 'math lessons are free');
  assert.ok(CU.topics.find(t => t.id === 'carbon-cycle').free, 'Unit 1 is free');
  assert.ok(CU.topics.find(t => t.unit === 'unit-2').free, 'Unit 2 is free');
  assert.ok(!CU.topics.find(t => t.id === T).free, 'Unit 3 is Premium');
  assert.ok(!CU.topics.find(t => t.unit === 'unit-9').free, 'Unit 9 is Premium');
  // One free tier: the build's FREE_UNITS and premium.js agree.
  const prem = readFileSync('assets/premium.js', 'utf8');
  const block = prem.slice(prem.indexOf('    appsych: {'), prem.indexOf('    appsych: {') + 2000);
  assert.match(block, /freeChapters: \['unit-1', 'unit-2'\]/);
  assert.doesNotMatch(block, /onSale: false/, 'on sale since 2026-10-20 (Polar product created, launch checklist)');
  assert.match(block, /id: 'psy-2027', label: 'Through June 30, 2027', price: 25, until: '2027-06-30'/);
});

test('nothing published: no topic pages, every page noindex', () => {
  const { html } = build('');
  assert.ok(html.length > 5);
  assert.ok(!html.some(f => /\/(lessons|notes|units)\//.test(f)));
  for (const f of html) assert.match(readFileSync(f, 'utf8'), /<meta name="robots" content="noindex/, f);
});

test('the real published list holds every chapter since the launch', () => {
  assert.deepEqual(JSON.parse(readFileSync(`${D}/data/published.json`, 'utf8')).chapters,
    ['skills-math', 'unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5', 'unit-6', 'unit-7', 'unit-8', 'unit-9']);
});

test('the course home has its own headline, olive and its own icon, not Statistics\'', () => {
  const { root } = build('unit-3');
  const home = readFileSync(join(root, `${D}/index.html`), 'utf8');
  assert.match(home, /<h1 class="mast" id="r3Title">AP® Environmental<span>Science<\/span><\/h1>/);
  assert.match(home, /<p class="deck">AP® Psychology, <span>one system at a time\.<\/span><\/p>/);
  assert.doesNotMatch(home, /Statistics|Chemistry|Calculus|Physics|Data Collector|bell curve|score-calculator/);
  assert.match(home, /assets\/env\.css/);
  assert.match(home, /data-cover="appsych"/);
  assert.match(home, /assets\/covers\/appsych\.svg/);
  const css = readFileSync(`${D}/assets/psy.css`, 'utf8');
  assert.match(css, /body\.env\{--ctint:#EFF0DA;--cink:#474A10;\}/);
  assert.match(readFileSync('assets/theme.css', 'utf8'), /body\[data-course="appsych"\]\{--ctint:#EFF0DA;--cink:#474A10;\}/);
});

test('tools: pre-registered, built only with a data file and a published topic, loading their own model and the plot helper', () => {
  const pages = JSON.parse(readFileSync(join(FIX, 'pages.json'), 'utf8'));
  assert.deepEqual(pages.tools.map(t => t.slug).sort(), ['age-structure', 'air-pollution', 'calculation-studio', 'climate-change', 'cycles', 'dose-response', 'earth-climate', 'energy-chain', 'energy-flow', 'population-growth', 'soil-texture', 'water-pollution']);
  assert.ok(pages.tools.every(t => t.studio === true && t.topic));
  assert.deepEqual(pages.tools.filter(t => !t.premium).map(t => t.slug).sort(), ['calculation-studio', 'cycles', 'energy-flow'], 'three free trainers');
  assert.deepEqual(pages, JSON.parse(readFileSync(`${D}/data/pages.json`, 'utf8')), 'the fixture copies the real pages.json');
  const { root, files } = build('unit-3');
  assert.ok(!files.some(f => /\/tools\/[^/]+\.html$/.test(f)), 'no tool page without data');
  const cur = readFileSync(join(root, `${D}/assets/psy-curriculum.js`), 'utf8');
  const list = JSON.parse(cur.match(/window\.ApPsychToolList = (.*);/)[1]);
  assert.equal(list.length, 12);
  assert.ok(list.every(t => !t.live && t.arrives));
  const data = mkdtempSync(join(tmpdir(), 'appsych-data-'));
  cpSync(FIX, data, { recursive: true });
  mkdirSync(join(data, 'tools'), { recursive: true });
  // Move a Unit 3 trainer onto the fixture topic, so it can be built.
  const pj = JSON.parse(readFileSync(join(data, 'pages.json'), 'utf8'));
  pj.tools.find(t => t.slug === 'age-structure').topic = T;
  writeFileSync(join(data, 'pages.json'), JSON.stringify(pj));
  writeFileSync(join(data, 'tools', 'age-structure.json'), JSON.stringify({ slug: 'age-structure', kind: 'simulator', topic: T, intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: T }] }));
  writeFileSync(join(data, 'tools', 'dose-response.json'), JSON.stringify({ slug: 'dose-response', kind: 'simulator', topic: pj.tools.find(t => t.slug === 'dose-response').topic, intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1' }] }));
  const { root: out } = build('unit-3', data);
  const page = readFileSync(join(out, `${D}/tools/age-structure.html`), 'utf8');
  const srcs = [...page.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  const at = f => srcs.findIndex(s => s.endsWith(f));
  assert.ok(at('psy-expr.js') > -1 && at('psy-expr.js') < at('tools/psy-tool-math.js'), 'the parser before the shared math');
  assert.ok(at('psy-calc.js') > -1 && at('psy-calc.js') < at('tools/math/age-structure.js'), 'the calculator before the model');
  assert.ok(at('tools/psy-tool-math.js') < at('tools/math/age-structure.js'), 'shared math before the model');
  assert.ok(at('tools/psy-tools.js') > at('tools/psy-tool-math.js'));
  assert.ok(at('tools/psy-plot.js') > -1, 'plot helper loaded');
  assert.ok(at('tools/age-structure.js') > at('tools/psy-plot.js'));
  const hasCss = existsSync(`${D}/assets/tools/age-structure.css`);
  assert.equal(/<link [^>]*href="[^"]*tools\/age-structure\.css"/.test(page), hasCss);
  assert.ok(!existsSync(join(out, `${D}/tools/dose-response.html`)), 'Unit 8 is not published');
});

test('trademark wording', () => {
  assert.deepEqual(trademarkProblems('An AP® Psychology course. AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.'), []);
  assert.equal(trademarkProblems('AP Psychology').length, 1);
  assert.equal(trademarkProblems('APES review').length, 1, 'no APES shorthand');
  assert.equal(trademarkProblems('take two AP®s').length, 1);
  assert.equal(trademarkProblems('ready for the AP® exam').length, 1, 'use "AP® Psychology exam"');
  assert.deepEqual(trademarkProblems('the AP&reg; Psychology exam, a map, APA style'), []);
});

test('FRQ pages: the three types, 10 points, the index, the teachers page and share links', () => {
  const { root, files } = build('unit-3');
  const rel = files.map(f => f.slice(root.length + 1));
  const TYPES = ['design', 'data', 'calc'];
  for (const t of TYPES) assert.ok(rel.includes(`${D}/frq/frq-placeholder-${t}.html`), t);
  for (const p of ['assets/frq/index.json', 'teachers.html', 'assets/summaries.json']) assert.ok(rel.includes(`${D}/${p}`), p);
  const index = JSON.parse(readFileSync(join(root, `${D}/assets/frq/index.json`), 'utf8'));
  assert.deepEqual(index.map(f => f.type), TYPES);
  assert.ok(index.every(f => f.points === 10));
  const one = JSON.parse(readFileSync(join(root, `${D}/assets/frq/frq-placeholder-calc.json`), 'utf8'));
  assert.equal(one.typeName, 'Q3: Analyze an environmental problem with calculations');
  assert.ok(one.parts.every(p => p.rubric.length === p.points && p.sample));
  const checks = one.parts.filter(p => p.check);
  assert.equal(checks[0].check.numeric.answer, 2, 'a numeric check computed from its recipe');
  assert.equal(checks[1].check.setup.then.answer, 2055, 'a setup check with its value step');
  const page = readFileSync(join(root, `${D}/frq/frq-placeholder-calc.html`), 'utf8');
  assert.match(page, /class="psy-lines"/, 'printable lined space');
  // "Check my number" grades a setup with ApPsychExpr: the page loads it (Launch fix).
  for (const f of ['psy-expr.js', 'psy-math.js', 'psy-calc.js', 'psy-grade.js']) assert.ok(page.indexOf(`assets/${f}"`) > -1 && page.indexOf(`assets/${f}"`) < page.indexOf('pages/frq-kit.js'), `${f} before frq-kit.js`);
  assert.match(page, /placeholder question/i);
  assert.ok(!page.includes(one.parts[0].sample.slice(0, 50)), 'the sample answer is not in the page HTML');
  for (const p of ['frq/frq-placeholder-design.html', `lessons/${T}.html`, `notes/${T}.html`, 'unit-sheets/unit-3.html']) {
    const h = readFileSync(join(root, D, p), 'utf8');
    const gc = h.match(/href="(https:\/\/classroom\.google\.com\/share\?url=[^"]+)"/);
    assert.ok(gc, `${p}: Share to Google Classroom`);
    const u = new URL(gc[1].replace(/&amp;/g, '&'));
    assert.equal(u.searchParams.get('url'), `https://levlprep.com/${D}/${p}`);
    assert.doesNotMatch(u.searchParams.get('title'), /\bAP\b/);
  }
  const teachers = readFileSync(join(root, `${D}/teachers.html`), 'utf8');
  assert.match(teachers, new RegExp(`practice\\.html\\?topic=${T}`));
  assert.match(teachers, /privacy\.html#schools/);
});

test('a TeX typo in a built topic stops the build', () => {
  const data = mkdtempSync(join(tmpdir(), 'appsych-data-'));
  cpSync(FIX, data, { recursive: true });
  const p = join(data, 'lessons', `${T}.json`);
  writeFileSync(p, readFileSync(p, 'utf8').replace('"cause": "Births outnumber deaths"', '"cause": "Births $\\\\frak{1}{2}$ outnumber deaths"'));
  const out = mkdtempSync(join(tmpdir(), 'appsych-build-'));
  assert.throws(() => execFileSync(process.execPath, ['scripts/build-appsych.mjs', '--out', join(out, D)], { env: { ...process.env, APPSYCH_DATA: data, APPSYCH_PUBLISHED: 'unit-3' }, stdio: 'pipe' }), /frak/);
});

test('the real data passes the content check, and the fixture sample passes it too', () => {
  const run = env => execFileSync(process.execPath, ['scripts/check-appsych-content.mjs', '--check'], { env: { ...process.env, ...psy }, encoding: 'utf8' });
  assert.match(run({}), /0 failing/);
  assert.match(run({ APPSYCH_DATA: FIX }), /1 topics, 16 items, 0 failing/);
});

test('a wrong numeric key in the data fails the content check', () => {
  const data = mkdtempSync(join(tmpdir(), 'appsych-data-'));
  cpSync(FIX, data, { recursive: true });
  const p = join(data, 'questions', `${T}.json`);
  const q = JSON.parse(readFileSync(p, 'utf8'));
  q.items.find(x => x.id === `psy-${T}-2`).numeric.answer = 3;
  writeFileSync(p, JSON.stringify(q));
  let out = '';
  try { out = execFileSync(process.execPath, ['scripts/check-appsych-content.mjs', '--check'], { env: { ...process.env, APPSYCH_DATA: data }, encoding: 'utf8', stdio: 'pipe' }); } catch (e) { out = String(e.stdout) + String(e.stderr); }
  assert.match(out, /psy-human-population-2: numeric\.answer 3 disagrees with its recipe: naturalIncrease gives 2/);
  assert.match(out, /\+1 in unpublished chapters/);
});
