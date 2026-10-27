/* The AP® Psychology generator against the real map and the placeholder
   sample in scripts/test/fixtures/appsych-data (one Unit 3 topic, operant
   conditioning, items of every type, one study, one data and one figure set,
   one AAQ and one EBQ; never in psychology/data): with Unit 3 published it
   writes every page kind with math rendered and plots drawn from their data,
   and the pages pass the course's own site rules (trademark, the "not yet
   reviewed" note, Report a problem); with nothing published every page is
   noindex; no output path carries the token "ap"; the two FRQ types carry 7
   points; numeric keys are recomputed by ApPsychStats; a tool is built only
   when its data file exists and its topic is published. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import trademark from '../site-rules/appsych-trademark.mjs';
import beta from '../site-rules/appsych-beta-and-report.mjs';
import { trademarkProblems, hasApToken, FREE_UNITS, IDENTITY } from '../lib/appsych-build.mjs';

const FIX = 'scripts/test/fixtures/appsych-data';
const T = 'operant-conditioning';
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
  assert.match(lesson, /<title>Operant Conditioning.* — AP® Psychology( Lesson)?( \| LevlPrep)?<\/title>/);
  assert.doesNotMatch(lesson, /"isAccessibleForFree": true/, 'Unit 3 lessons are Premium');
  assert.doesNotMatch(lesson, /noindex/);
  assert.match(lesson, /<body class="psy"/);
  assert.match(lesson, /<math class="psy-m"><semantics>/, 'math is MathML at build time');
  // Stimuli: a labeled data table; a study summary in the exam's sections; the normal curve drawn from its numbers.
  assert.match(lesson, /class="psy-stim"[^>]*><p class="psy-stim-k">Data<\/p>[\s\S]*?<table/);
  const ut = readFileSync(join(root, `${D}/unit-tests/unit-3.html`), 'utf8') + lesson;
  assert.match(readFileSync(join(root, `${D}/assets/bank/unit-3.json`), 'utf8'), /<div class=\\"psy-study\\"><h4>Introduction<\/h4>[\s\S]*Invented study for practice/);
  assert.match(readFileSync(join(root, `${D}/assets/bank/unit-3.json`), 'utf8'), /<svg class=\\"psy-plot\\"[^>]*role=\\"img\\" aria-label=\\"Placeholder normal curve/);
  void ut;
  // The question engine loads the math, statistics and grader before it; no setup parser.
  const srcs = [...lesson.matchAll(/<script src="([^"]+)"/g)].map(m => m[1].replace(/^.*assets\//, ''));
  const at = f => srcs.indexOf(f);
  assert.ok(at('psy-math.js') > -1 && at('psy-math.js') < at('psy-stats.js') && at('psy-stats.js') < at('psy-grade.js') && at('psy-grade.js') < at('psy-questions.js'), srcs.join(' '));
  assert.equal(at('psy-expr.js'), -1, 'no setup parser in this course');
  const desc = lesson.match(/name="description" content="([^"]*)"/)[1];
  assert.doesNotMatch(desc, /\bAP\b|<math|\$/);
  // The bank: keys recomputed by ApPsychStats, specific slots, set kinds in the index.
  const bank = JSON.parse(readFileSync(join(root, `${D}/assets/bank/unit-3.json`), 'utf8'));
  const by = id => bank.items.find(q => q.id === `psy-${T}-${id}`);
  assert.equal(by(2).numeric.answer, 5, 'mean of 3, 5, 7, 5');
  assert.equal(by(2).numeric.mistakes[0].value, 20, 'a mistake recipe gets its value (the sum)');
  assert.equal(by(4).numeric.answer, 4, 'median of 2, 4, 4, 9, 16');
  assert.equal(by(9).numeric.answer, 68, 'the 68-95-99.7 rule');
  assert.ok(by(14).specific.slots && Object.keys(by(14).specific.slots).length >= 2, 'specific slots');
  assert.ok(!bank.items.some(q => q.type === 'setup'), 'no setup items');
  const idx = JSON.parse(readFileSync(join(root, `${D}/assets/bank/index.json`), 'utf8'));
  const codes = idx.t[T].split(',').map(e => e.split('.').pop());
  assert.deepEqual(['s', 'd', 'v'].map(c => codes.filter(x => x === c).length), [3, 3, 3], 'each set kind marked: study, data, figure');
  const cur = readFileSync(join(root, `${D}/assets/psy-curriculum.js`), 'utf8');
  const CU = JSON.parse(cur.match(/window\.ApPsychCurriculum = (.*);/)[1]);
  assert.equal(CU.units.filter(u => u.part === 'course').length, 5);
  assert.equal(CU.topics.filter(t => t.kind === 'concept').length, 35, 'every CED topic');
  const order = CU.topics.map(t => t.id);
  assert.ok(order.indexOf('stats-normal') < order.indexOf('intelligence'), 'the research skills come before they are used');
  assert.ok(CU.topics.find(t => t.id === 'research-methods').free, 'research skills lessons are free');
  assert.ok(CU.topics.find(t => t.id === 'brain').free, 'Unit 1 is free');
  assert.ok(!CU.topics.find(t => t.unit === 'unit-2').free, 'Unit 2 is Premium');
  assert.ok(!CU.topics.find(t => t.id === T).free, 'Unit 3 is Premium');
  // One free tier: the build's FREE_UNITS and premium.js agree; not on sale until the owner checklist.
  const prem = readFileSync('assets/premium.js', 'utf8');
  const block = prem.slice(prem.indexOf('    appsych: {'), prem.indexOf('    appsych: {') + 2000);
  assert.deepEqual(FREE_UNITS, ['unit-1']);
  assert.match(block, /freeChapters: \['unit-1'\]/);
  assert.match(block, /onSale: false/, 'not on sale until the owner checklist');
  assert.match(block, /id: 'psy-2027', label: 'Through June 30, 2027', price: 25, until: '2027-06-30'/);
});

test('nothing published: no topic pages, every page noindex', () => {
  const { html } = build('');
  assert.ok(html.length > 5);
  assert.ok(!html.some(f => /\/(lessons|notes|units)\//.test(f)));
  for (const f of html) assert.match(readFileSync(f, 'utf8'), /<meta name="robots" content="noindex/, f);
});

test('the real published list is empty until a unit passes its review, and the course is registered hidden', () => {
  assert.deepEqual(JSON.parse(readFileSync(`${D}/data/published.json`, 'utf8')).chapters, []);
  assert.match(readFileSync('assets/courses.js', 'utf8'), /key: 'appsych'[\s\S]*?aliases: \['psychology', 'psych', 'psy'\], paid: true, status: 'hidden', order: 10/);
});

test('the course home has its own headline, cerulean and its own cover, not Environmental Science\'s', () => {
  const { root } = build('unit-3');
  const home = readFileSync(join(root, `${D}/index.html`), 'utf8');
  assert.match(home, /<h1 class="mast" id="r3Title">AP®<span>Psychology<\/span><\/h1>/);
  assert.match(home, /<p class="deck">AP® Psychology, <span>from neuron to society\.<\/span><\/p>/);
  assert.doesNotMatch(home, /Environmental|Statistics|Chemistry|Calculus|Field Observer|kWh|score-calculator/);
  assert.match(home, /assets\/psy\.css/);
  assert.match(home, /data-cover="appsych"/);
  assert.match(home, /assets\/covers\/appsych\.svg/);
  assert.equal(IDENTITY.accent.ink, '#084F78');
  const css = readFileSync(`${D}/assets/psy.css`, 'utf8');
  assert.match(css, /body\.psy\{--ctint:#E3F0F8;--cink:#084F78;\}/);
  assert.match(readFileSync('assets/theme.css', 'utf8'), /body\[data-course="appsych"\]\{--ctint:#E3F0F8;--cink:#084F78;\}/);
  assert.ok(existsSync('assets/covers/appsych.svg') && existsSync('assets/covers/art/appsych.svg'));
});

test('tools: the ten trainers pre-registered, built only with a data file and a published topic, loading their own model and the plot helper', () => {
  const pages = JSON.parse(readFileSync(join(FIX, 'pages.json'), 'utf8'));
  assert.deepEqual(pages.tools.map(t => t.slug).sort(), ['article-studio', 'brain-map', 'conditioning-lab', 'development', 'evidence-builder', 'memory-lab', 'neuron', 'sensation', 'social-influence', 'stats-lab']);
  assert.ok(pages.tools.every(t => t.studio === true && t.topic));
  assert.deepEqual(pages.tools.filter(t => !t.premium).map(t => t.slug).sort(), ['article-studio', 'brain-map', 'neuron'], 'three free trainers');
  assert.deepEqual(pages, JSON.parse(readFileSync(`${D}/data/pages.json`, 'utf8')), 'the fixture copies the real pages.json');
  const { root, files } = build('unit-3');
  assert.ok(!files.some(f => /\/tools\/[^/]+\.html$/.test(f)), 'no tool page without data');
  const cur = readFileSync(join(root, `${D}/assets/psy-curriculum.js`), 'utf8');
  const list = JSON.parse(cur.match(/window\.ApPsychToolList = (.*);/)[1]);
  assert.equal(list.length, 10);
  assert.ok(list.every(t => !t.live && t.arrives));
  const data = mkdtempSync(join(tmpdir(), 'appsych-data-'));
  cpSync(FIX, data, { recursive: true });
  mkdirSync(join(data, 'tools'), { recursive: true });
  writeFileSync(join(data, 'tools', 'conditioning-lab.json'), JSON.stringify({ slug: 'conditioning-lab', kind: 'simulator', topic: 'classical-conditioning', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: T }] }));
  writeFileSync(join(data, 'tools', 'brain-map.json'), JSON.stringify({ slug: 'brain-map', kind: 'simulator', topic: 'brain', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'brain' }] }));
  const { root: out } = build('unit-3', data);
  const page = readFileSync(join(out, `${D}/tools/conditioning-lab.html`), 'utf8');
  const srcs = [...page.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  const at = f => srcs.findIndex(s => s.endsWith(f));
  assert.ok(at('psy-stats.js') > -1 && at('psy-stats.js') < at('tools/math/conditioning-lab.js'), 'the statistics before the model');
  assert.ok(at('tools/psy-tool-math.js') < at('tools/math/conditioning-lab.js'), 'shared math before the model');
  assert.ok(at('tools/psy-tools.js') > at('tools/psy-tool-math.js'));
  assert.ok(at('tools/psy-plot.js') > -1, 'plot helper loaded');
  assert.ok(at('tools/conditioning-lab.js') > at('tools/psy-plot.js'));
  assert.equal(at('psy-expr.js'), -1);
  assert.ok(!existsSync(join(out, `${D}/tools/brain-map.html`)), 'Unit 1 is not published');
});

test('trademark wording', () => {
  assert.deepEqual(trademarkProblems('An AP® Psychology course. AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.'), []);
  assert.equal(trademarkProblems('AP Psychology').length, 1);
  assert.equal(trademarkProblems('AP Psych review').length > 0, true, 'no "AP Psych" shorthand');
  assert.equal(trademarkProblems('take two AP®s').length, 1);
  assert.equal(trademarkProblems('ready for the AP® exam').length, 1, 'use "AP® Psychology exam"');
  assert.deepEqual(trademarkProblems('the AP&reg; Psychology exam, a map, APA style'), []);
});

test('FRQ pages: the AAQ and the EBQ, 7 points, the index, the teachers page and share links', () => {
  const { root, files } = build('unit-3');
  const rel = files.map(f => f.slice(root.length + 1));
  for (const t of ['aaq', 'ebq']) assert.ok(rel.includes(`${D}/frq/frq-placeholder-${t}.html`), t);
  for (const p of ['assets/frq/index.json', 'teachers.html', 'assets/summaries.json']) assert.ok(rel.includes(`${D}/${p}`), p);
  const index = JSON.parse(readFileSync(join(root, `${D}/assets/frq/index.json`), 'utf8'));
  assert.deepEqual(index.map(f => f.type), ['aaq', 'ebq']);
  assert.ok(index.every(f => f.points === 7));
  const aaq = JSON.parse(readFileSync(join(root, `${D}/assets/frq/frq-placeholder-aaq.json`), 'utf8'));
  assert.equal(aaq.typeName, 'Q1: Article Analysis Question (AAQ)');
  assert.deepEqual(aaq.parts.map(p => `${p.label}:${p.points}`), ['A:1', 'B:1', 'C:1', 'D:1', 'E:1', 'F:2']);
  assert.equal(aaq.readings.length, 1);
  assert.match(aaq.readings[0].html, /<h4>Participants<\/h4>/);
  const ebq = JSON.parse(readFileSync(join(root, `${D}/assets/frq/frq-placeholder-ebq.json`), 'utf8'));
  assert.deepEqual(ebq.parts.map(p => `${p.label}:${p.points}`), ['A:1', 'B(i):1', 'B(ii):2', 'C(i):1', 'C(ii):2']);
  assert.deepEqual(ebq.readings.map(r => r.title.split(':')[0]), ['Source 1', 'Source 2', 'Source 3']);
  assert.ok(ebq.restricted.includes('random assignment'));
  assert.ok(ebq.parts.find(p => p.label === 'B(i)').write.cite, 'the citation hint rides with its part');
  const page = readFileSync(join(root, `${D}/frq/frq-placeholder-ebq.html`), 'utf8');
  assert.match(page, /class="psy-lines"/, 'printable lined space');
  assert.equal((page.match(/class="psy-stim"/g) || []).length, 3, 'three sources on the page');
  assert.match(page, /no calculator/);
  for (const f of ['psy-math.js', 'psy-stats.js', 'psy-grade.js']) assert.ok(page.indexOf(`assets/${f}"`) > -1 && page.indexOf(`assets/${f}"`) < page.indexOf('pages/frq-kit.js'), `${f} before frq-kit.js`);
  assert.match(page, /placeholder question/i);
  assert.ok(!page.includes(ebq.parts[0].sample.slice(0, 50)), 'the sample answer is not in the page HTML');
  for (const p of ['frq/frq-placeholder-aaq.html', `lessons/${T}.html`, `notes/${T}.html`, 'unit-sheets/unit-3.html']) {
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
  const data = mkdtempSync(join(tmpdir(), 'appsych-data-'));
  cpSync(FIX, data, { recursive: true });
  const p = join(data, 'lessons', `${T}.json`);
  writeFileSync(p, readFileSync(p, 'utf8').replace('"cause": "A behavior is followed by a pleasant consequence"', '"cause": "A behavior $\\\\frak{1}{2}$ is followed by a pleasant consequence"'));
  const out = mkdtempSync(join(tmpdir(), 'appsych-build-'));
  assert.throws(() => execFileSync(process.execPath, ['scripts/build-appsych.mjs', '--out', join(out, D)], { env: { ...process.env, APPSYCH_DATA: data, APPSYCH_PUBLISHED: 'unit-3' }, stdio: 'pipe' }), /frak/);
});

test('the real data passes the content check, and the fixture sample passes it too', () => {
  const run = env => execFileSync(process.execPath, ['scripts/check-appsych-content.mjs', '--check'], { env: { ...process.env, ...env }, encoding: 'utf8' });
  assert.match(run({}), /0 failing/);
  assert.match(run({ APPSYCH_DATA: FIX }), /1 topics, 16 items, 0 failing/);
});

function broken(edit) {
  const data = mkdtempSync(join(tmpdir(), 'appsych-data-'));
  cpSync(FIX, data, { recursive: true });
  edit(data);
  try { return execFileSync(process.execPath, ['scripts/check-appsych-content.mjs', '--check'], { env: { ...process.env, APPSYCH_DATA: data, APPSYCH_PUBLISHED: 'unit-3' }, encoding: 'utf8', stdio: 'pipe' }); } catch (e) { return String(e.stdout) + String(e.stderr); }
}
const editQ = (data, fn) => { const p = join(data, 'questions', `${T}.json`); const q = JSON.parse(readFileSync(p, 'utf8')); fn(q); writeFileSync(p, JSON.stringify(q)); };

test('a wrong numeric key, a myth, disrespectful language, a calculator, an uncited study or a setup item fails the content check', () => {
  assert.match(broken(d => editQ(d, q => { q.items.find(x => x.id === `psy-${T}-2`).numeric.answer = 6; })), /psy-operant-conditioning-2: numeric\.answer 6 disagrees with its recipe: mean gives 5/);
  assert.match(broken(d => editQ(d, q => { q.items[0].why.correct = 'Placeholder: matching lessons to learning styles helps students.'; })), /teaches a myth: learning styles/);
  assert.match(broken(d => editQ(d, q => { q.items[0].why.correct = 'Placeholder: we use only 10% of our brains.'; })), /10% brain myth/);
  assert.match(broken(d => editQ(d, q => { q.items[0].q = 'Placeholder: a schizophrenic hears voices. Which concept explains the habit here?'; })), /language: a person named by a diagnosis/);
  assert.match(broken(d => editQ(d, q => { q.items[0].q = 'Placeholder: use a calculator to find the mean of the scores here.'; })), /a calculator/);
  assert.match(broken(d => editQ(d, q => { const s = q.stimuli[`${T}-s3`]; delete s.invented; s.source = 'A study I read'; })), /must cite a real study/);
  assert.match(broken(d => editQ(d, q => { q.items[0].type = 'setup'; })), /type must be one of single, multi, numeric, specific, order/);
  assert.match(broken(d => editQ(d, q => { q.items[0].practice = '4.A'; })), /assessed only in the free-response section/);
  // A myth named inside a correcting box is fine.
  assert.doesNotMatch(broken(d => editQ(d, q => { q.items[0].why.correct = 'Placeholder: <span class="psy-myth">learning styles</span> are not how memory works.'; })), /teaches a myth/);
});

test('an AAQ or EBQ out of the exam shape fails the content check', () => {
  const editF = (id, fn) => d => { const p = join(d, 'frq', `${id}.json`); const f = JSON.parse(readFileSync(p, 'utf8')); fn(f); writeFileSync(p, JSON.stringify(f)); };
  assert.match(broken(editF('frq-placeholder-aaq', f => { f.parts.pop(); })), /parts must be the exam's, in order/);
  assert.match(broken(editF('frq-placeholder-aaq', f => { delete f.study.ethics; })), /study\.ethics is required/);
  assert.match(broken(editF('frq-placeholder-ebq', f => { f.sources.pop(); })), /exactly three/);
  assert.match(broken(editF('frq-placeholder-ebq', f => { f.points = 10; })), /worth 7 points/);
  assert.match(broken(editF('frq-placeholder-ebq', f => { delete f.restricted; })), /restricted/);
});
