/* The AP® Macroeconomics generator against the real map and the placeholder
   sample in scripts/test/fixtures/apmacro-data (one Unit 3 topic, changes in
   the AD-AS model in the short run, items of every type including graph
   items, one data, one graph and one scenario set, one long and one short
   FRQ with graph parts; never in macroeconomics/data): with Unit 3
   published it writes every page kind with math rendered and graphs drawn,
   and the pages pass the course's own site rules (trademark, the "not yet
   reviewed" note, Report a problem); with nothing published every page is
   noindex; no output path carries the token "ap"; the FRQ types carry 10
   and 5 points; numeric keys are recomputed by ApMacroCalc; a tool is built
   only when its data file exists and its topic is published; the course is
   registered hidden. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import trademark from '../site-rules/apmacro-trademark.mjs';
import beta from '../site-rules/apmacro-beta-and-report.mjs';
import { trademarkProblems, hasApToken, FREE_UNITS, IDENTITY } from '../lib/apmacro-build.mjs';

const FIX = 'scripts/test/fixtures/apmacro-data';
const T = 'adas-short-run-changes';
const D = 'macroeconomics';
function build(published, data = FIX) {
  const root = mkdtempSync(join(tmpdir(), 'apmacro-build-'));
  execFileSync(process.execPath, ['scripts/build-apmacro.mjs', '--out', join(root, D)], { env: { ...process.env, APMACRO_DATA: data, APMACRO_PUBLISHED: published } });
  const files = [];
  const walk = d => { for (const n of readdirSync(d)) { const f = join(d, n); statSync(f).isDirectory() ? walk(f) : files.push(f); } };
  walk(root);
  return { root, files, html: files.filter(f => f.endsWith('.html')) };
}

test('a published unit builds every page kind, math rendered and graphs drawn, and the course rules pass', () => {
  const { root, files, html } = build('unit-3');
  const rel = files.map(f => f.slice(root.length + 1));
  for (const p of ['index.html', 'learn.html', 'glossary.html', 'units/unit-3.html', 'unit-sheets/unit-3.html', `lessons/${T}.html`, `notes/${T}.html`, 'practice.html', 'exams.html', 'frq.html', 'justify.html', 'formula-sheet.html', 'unit-tests/unit-3.html', 'assets/bank/unit-3.json', 'assets/bank/unit-3-why.json', 'assets/bank/index.json', 'assets/mac-curriculum.js']) assert.ok(rel.includes(`${D}/${p}`), p);
  assert.ok(!rel.includes(`${D}/score-calculator.html`), 'no score calculator');
  assert.ok(rel.every(r => !hasApToken(r.slice(D.length + 1))), 'no "ap" token in a served path');
  const fails = [];
  trademark({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  beta({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  assert.deepEqual(fails, []);
  const lesson = readFileSync(join(root, `${D}/lessons/${T}.html`), 'utf8');
  assert.match(lesson, /<title>Changes in the AD-AS Model.* — AP® Macroeconomics( Lesson)?( \| LevlPrep)?<\/title>/);
  assert.doesNotMatch(lesson, /"isAccessibleForFree": true/, 'Unit 3 lessons are Premium');
  assert.doesNotMatch(lesson, /noindex/);
  assert.match(lesson, /<body class="mac"/);
  assert.match(lesson, /<math class="mac-m"><semantics>/, 'math is MathML at build time');
  assert.match(lesson, /class="mac-stim"[^>]*><p class="mac-stim-k">Data<\/p>[\s\S]*?<table/);
  const bankRaw = readFileSync(join(root, `${D}/assets/bank/unit-3.json`), 'utf8');
  assert.match(bankRaw, /<svg class=\\"mac-graph-svg\\"[^>]*role=\\"img\\" aria-label=\\"Aggregate demand and aggregate supply graph: [^"]*short-run aggregate supply shifted left/, 'a graph stimulus drawn from its spec');
  assert.doesNotMatch(bankRaw + lesson, /mac-study|Invented study|988/);
  // The question engine loads the math, the calculations, the graphs and the grader before it; no setup parser.
  const srcs = [...lesson.matchAll(/<script src="([^"]+)"/g)].map(m => m[1].replace(/^.*assets\//, ''));
  const at = f => srcs.indexOf(f);
  assert.ok(at('mac-math.js') > -1 && at('mac-math.js') < at('mac-calc.js') && at('mac-calc.js') < at('mac-graph.js') && at('mac-graph.js') < at('mac-grade.js') && at('mac-grade.js') < at('mac-questions.js'), srcs.join(' '));
  assert.equal(at('mac-expr.js'), -1, 'no setup parser in this course');
  assert.equal(at('mac-stats.js'), -1, 'no statistics library');
  const desc = lesson.match(/name="description" content="([^"]*)"/)[1];
  assert.doesNotMatch(desc, /\bAP\b|<math|\$/);
  // The bank: keys recomputed by ApMacroCalc, graph specs kept, set kinds in the index.
  const bank = JSON.parse(bankRaw);
  const by = id => bank.items.find(q => q.id === `mac-${T}-${id}`);
  assert.equal(by(4).numeric.answer, 100, '20 x the multiplier 5');
  assert.equal(by(4).numeric.mistakes[0].value, 4, 'a mistake recipe gets its value');
  assert.equal(by(7).numeric.answer, 10, 'the inflation rate from 100 to 110');
  assert.equal(by(2).type, 'graph');
  assert.deepEqual(by(2).graph.key.shifts, [{ curve: 'SRAS', dir: 'left' }], 'the graph key travels with the item (graded in the browser)');
  assert.ok(by(12).specific.slots && Object.keys(by(12).specific.slots).length >= 2, 'specific slots');
  const idx = JSON.parse(readFileSync(join(root, `${D}/assets/bank/index.json`), 'utf8'));
  const codes = idx.t[T].split(',').map(e => e.split('.').pop());
  assert.deepEqual(['d', 'g', 't'].map(c => codes.filter(x => x === c).length), [4, 3, 3], 'each set kind marked: data, graph, scenario');
  assert.ok(idx.ty.includes('graph'));
  const cur = readFileSync(join(root, `${D}/assets/mac-curriculum.js`), 'utf8');
  const CU = JSON.parse(cur.match(/window\.ApMacroCurriculum = (.*);/)[1]);
  assert.equal(CU.units.filter(u => u.part === 'course').length, 6);
  assert.equal(CU.topics.filter(t => t.kind === 'concept').length, 42, 'every CED topic');
  assert.deepEqual(CU.topics.slice(0, 4).map(t => t.id), ['axes-points', 'slopes-curves', 'shifts-movements', 'curves-crossing'], 'the graph skills come first');
  assert.ok(CU.topics.find(t => t.id === 'axes-points').free, 'graph skills lessons are free');
  assert.ok(CU.topics.find(t => t.id === 'scarcity').free, 'Unit 1 is free');
  assert.ok(CU.topics.find(t => t.unit === 'unit-2').free, 'Unit 2 is free');
  assert.ok(!CU.topics.find(t => t.id === T).free, 'Unit 3 is Premium');
  // One free tier: the build's FREE_UNITS and premium.js agree; not on sale until the owner checklist.
  const prem = readFileSync('assets/premium.js', 'utf8');
  const block = prem.slice(prem.indexOf('    apmacro: {'), prem.indexOf('\n    },', prem.indexOf('    apmacro: {')));
  assert.deepEqual(FREE_UNITS, ['unit-1', 'unit-2']);
  assert.match(block, /freeChapters: \['unit-1', 'unit-2'\]/);
  assert.match(block, /onSale: false/, 'not on sale until the owner checklist');
  assert.match(block, /id: 'macro-2027', label: 'Through June 30, 2027', price: 25, until: '2027-06-30'/);
});

test('nothing published: no topic pages, every page noindex', () => {
  const { html } = build('');
  assert.ok(html.length > 5);
  assert.ok(!html.some(f => /\/(lessons|notes|units)\//.test(f)));
  for (const f of html) assert.match(readFileSync(f, 'utf8'), /<meta name="robots" content="noindex/, f);
});

test('nothing is published yet, and the course is registered hidden everywhere it is registered', () => {
  assert.deepEqual(JSON.parse(readFileSync(`${D}/data/published.json`, 'utf8')).chapters, []);
  assert.match(readFileSync('assets/courses.js', 'utf8'), /key: 'apmacro'[\s\S]*?aliases: \['macroeconomics', 'macro', 'mac'\], paid: true, status: 'hidden', order: 13/);
  assert.match(readFileSync('assets/site-search-all.js', 'utf8'), /key: 'apmacro'[^\n]*status: 'hidden'/);
  assert.doesNotMatch(readFileSync('premium.html', 'utf8'), /apmacro|macroeconomics/i, 'not on the pricing page');
  assert.doesNotMatch(readFileSync('sitemap.xml', 'utf8'), /macroeconomics/, 'not in the sitemap');
  assert.match(readFileSync('index.html', 'utf8'), /<!-- hub-mac:start -->\s*<!-- hub-mac:end -->/, 'no hub card');
  assert.match(readFileSync('404.html', 'utf8'), /<!-- nf-mac:start -->\s*<!-- nf-mac:end -->/, 'no 404 card');
  assert.match(readFileSync('worker/src/premium.js', 'utf8'), /'macro-2027': +\{ course: 'apmacro', until: '2027-06-30T23:59:59-10:00' \}/);
  assert.match(readFileSync('sw.js', 'utf8'), /COURSE_URLS\['macroeconomics'\]/);
  assert.match(readFileSync('assets/exam-date.js', 'utf8'), /apmacro: \{ date: '2027-05-07'/);
});

test('the course home has its own headline, accent and cover, not AP® Psychology\'s', () => {
  const { root } = build('unit-3');
  const home = readFileSync(join(root, `${D}/index.html`), 'utf8');
  assert.match(home, /<h1 class="mast" id="r3Title">AP®<span>Macroeconomics<\/span><\/h1>/);
  assert.match(home, /<p class="deck">AP® Macroeconomics, <span>every graph, every shift\.<\/span><\/p>/);
  assert.doesNotMatch(home, /Psychology|neuron|Curious Observer|Article analysis|Statistics you must know|score-calculator/);
  assert.match(home, /assets\/mac\.css/);
  assert.match(home, /data-cover="apmacro"/);
  assert.match(home, /assets\/covers\/apmacro\.svg/);
  assert.equal(IDENTITY.accent.ink, '#355A0A');
  const css = readFileSync(`${D}/assets/mac.css`, 'utf8');
  assert.match(css, /body\.mac\{--ctint:#EEF4E0;--cink:#355A0A;\}/);
  assert.match(readFileSync('assets/theme.css', 'utf8'), /body\[data-course="apmacro"\]\{--ctint:#EEF4E0;--cink:#355A0A;\}/);
  assert.ok(existsSync('assets/covers/apmacro.svg') && existsSync('assets/covers/art/apmacro.svg') && existsSync('assets/covers/thumb/apmacro.svg'));
  // The provisional accent is a hue no other course uses (every course's ink in theme.css, at least 15° apart).
  const theme = readFileSync('assets/theme.css', 'utf8');
  const hue = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; const x = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (x * 60 + 360) % 360; };
  const inks = [...theme.matchAll(/^body\[data-course="([a-z]+)"\]\{--ctint:#[0-9A-F]+;--cink:(#[0-9A-F]{6});\}/gm)].map(m => [m[1], hue(m[2])]);
  const mine = hue(IDENTITY.accent.ink);
  for (const [k, h] of inks) if (k !== 'apmacro') assert.ok(Math.min(Math.abs(h - mine), 360 - Math.abs(h - mine)) >= 15, `${k} at ${h.toFixed(0)}° is too close to ${mine.toFixed(0)}°`);
});

test('tools: the eight trainers pre-registered, built only with a data file and a published topic, loading their own model, the graphs and the plot helper', () => {
  const pages = JSON.parse(readFileSync(join(FIX, 'pages.json'), 'utf8'));
  assert.deepEqual(pages.tools.map(t => t.slug).sort(), ['adas-lab', 'forex-lab', 'graph-studio', 'indicators-lab', 'multiplier-lab', 'policy-chain', 'ppc-trade', 'reserves-lab']);
  assert.ok(pages.tools.every(t => t.studio === true && t.topic));
  assert.deepEqual(pages.tools.filter(t => !t.premium).map(t => t.slug).sort(), ['graph-studio', 'indicators-lab', 'ppc-trade'], 'three free trainers');
  assert.deepEqual(pages, JSON.parse(readFileSync(`${D}/data/pages.json`, 'utf8')), 'the fixture copies the real pages.json');
  const { root, files } = build('unit-3');
  assert.ok(!files.some(f => /\/tools\/[^/]+\.html$/.test(f)), 'no tool page without data');
  const cur = readFileSync(join(root, `${D}/assets/mac-curriculum.js`), 'utf8');
  const list = JSON.parse(cur.match(/window\.ApMacroToolList = (.*);/)[1]);
  assert.equal(list.length, 8);
  assert.ok(list.every(t => !t.live && t.arrives));
  const data = mkdtempSync(join(tmpdir(), 'apmacro-data-'));
  cpSync(FIX, data, { recursive: true });
  mkdirSync(join(data, 'tools'), { recursive: true });
  writeFileSync(join(data, 'tools', 'adas-lab.json'), JSON.stringify({ slug: 'adas-lab', kind: 'simulator', topic: 'long-run-self-adjustment', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: T }] }));
  writeFileSync(join(data, 'tools', 'ppc-trade.json'), JSON.stringify({ slug: 'ppc-trade', kind: 'simulator', topic: 'comparative-advantage', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'comparative-advantage' }] }));
  const { root: out } = build('unit-3', data);
  const page = readFileSync(join(out, `${D}/tools/adas-lab.html`), 'utf8');
  const srcs = [...page.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  const at = f => srcs.findIndex(s => s.endsWith(f));
  assert.ok(at('mac-calc.js') > -1 && at('mac-calc.js') < at('tools/math/adas-lab.js'), 'the calculations before the model');
  assert.ok(at('mac-graph.js') > -1 && at('mac-graph.js') < at('tools/math/adas-lab.js'), 'the graphs before the model');
  assert.ok(at('tools/mac-tool-math.js') < at('tools/math/adas-lab.js'), 'shared math before the model');
  assert.ok(at('tools/mac-tools.js') > at('tools/mac-tool-math.js'));
  assert.ok(at('tools/mac-plot.js') > -1, 'plot helper loaded');
  assert.ok(at('tools/adas-lab.js') > at('tools/mac-plot.js'));
  assert.ok(!existsSync(join(out, `${D}/tools/ppc-trade.html`)), 'Unit 1 is not published');
});

test('trademark wording', () => {
  assert.deepEqual(trademarkProblems('An AP® Macroeconomics course. AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.'), []);
  assert.equal(trademarkProblems('AP Macroeconomics').length, 1);
  assert.equal(trademarkProblems('AP Macro review').length > 0, true, 'no "AP Macro" shorthand');
  assert.equal(trademarkProblems('take two AP®s').length, 1);
  assert.equal(trademarkProblems('ready for the AP® exam').length, 1, 'use "AP® Macroeconomics exam"');
  assert.deepEqual(trademarkProblems('the AP&reg; Macroeconomics exam, a map, APA style'), []);
});

test('FRQ pages: long (10 points) then short (5), graph parts carried with their auto rubric points, the teachers page and share links', () => {
  const { root, files } = build('unit-3');
  const rel = files.map(f => f.slice(root.length + 1));
  for (const t of ['long', 'short']) assert.ok(rel.includes(`${D}/frq/frq-placeholder-${t}.html`), t);
  for (const p of ['assets/frq/index.json', 'teachers.html', 'assets/summaries.json']) assert.ok(rel.includes(`${D}/${p}`), p);
  const index = JSON.parse(readFileSync(join(root, `${D}/assets/frq/index.json`), 'utf8'));
  assert.deepEqual(index.map(f => [f.type, f.points]), [['long', 10], ['short', 5]]);
  const long = JSON.parse(readFileSync(join(root, `${D}/assets/frq/frq-placeholder-long.json`), 'utf8'));
  assert.equal(long.typeName, 'Long free-response question');
  assert.deepEqual(long.parts.map(p => `${p.label}:${p.points}`), ['A:4', 'B:2', 'C:2', 'D(i):1', 'D(ii):1']);
  const A = long.parts[0];
  assert.equal(A.type, 'graph');
  assert.deepEqual(A.graph.do, ['label', 'shift', 'equilibrium']);
  assert.deepEqual(A.rubric.map(r => r.auto), ['labels', 'shift', 'equilibrium', 'outcome'], 'one rubric point per graph check');
  assert.match(long.stimulus.html, /<table/);
  assert.match(long.scenario, /^A placeholder economy/, 'the scenario goes out with the question');
  const page = readFileSync(join(root, `${D}/frq/frq-placeholder-long.html`), 'utf8');
  assert.ok(page.indexOf('class="mac-frq-scenario"') > -1 && page.indexOf('class="mac-frq-scenario"') < page.indexOf('class="mac-frq-parts"'), 'the scenario before the parts');
  assert.match(page, /class="mac-lines"/, 'printable lined space');
  assert.match(page, /class="mac-frq-grid"/, 'a grid to draw the graph on paper');
  assert.match(page, /four-function calculator/);
  assert.match(page, /about 25 minutes/);
  for (const f of ['mac-math.js', 'mac-calc.js', 'mac-graph.js', 'mac-grade.js']) assert.ok(page.indexOf(`assets/${f}"`) > -1 && page.indexOf(`assets/${f}"`) < page.indexOf('pages/frq-kit.js'), `${f} before frq-kit.js`);
  assert.match(page, /placeholder question/i);
  assert.ok(!page.includes(long.parts[1].sample.slice(0, 50)), 'the sample answer is not in the page HTML');
  for (const p of ['frq/frq-placeholder-long.html', `lessons/${T}.html`, `notes/${T}.html`, 'unit-sheets/unit-3.html']) {
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
  const data = mkdtempSync(join(tmpdir(), 'apmacro-data-'));
  cpSync(FIX, data, { recursive: true });
  const p = join(data, 'lessons', `${T}.json`);
  writeFileSync(p, readFileSync(p, 'utf8').replace('"cause": "Input costs rise"', '"cause": "Input costs $\\\\frak{1}{2}$ rise"'));
  const out = mkdtempSync(join(tmpdir(), 'apmacro-build-'));
  assert.throws(() => execFileSync(process.execPath, ['scripts/build-apmacro.mjs', '--out', join(out, D)], { env: { ...process.env, APMACRO_DATA: data, APMACRO_PUBLISHED: 'unit-3' }, stdio: 'pipe' }), /frak/);
});

test('the real data passes the content check, and the fixture sample passes it too', () => {
  const run = env => execFileSync(process.execPath, ['scripts/check-apmacro-content.mjs', '--check'], { env: { ...process.env, ...env }, encoding: 'utf8' });
  assert.match(run({}), /0 failing/);
  assert.match(run({ APMACRO_DATA: FIX, APMACRO_PUBLISHED: 'unit-3' }), /1 topics, 19 items, 0 failing; bank 0, FRQ 0/);
});

function broken(edit) {
  const data = mkdtempSync(join(tmpdir(), 'apmacro-data-'));
  cpSync(FIX, data, { recursive: true });
  writeFileSync(join(data, 'published.json'), JSON.stringify({ chapters: ['unit-3'] }));
  edit(data);
  try { return execFileSync(process.execPath, ['scripts/check-apmacro-content.mjs', '--check'], { env: { ...process.env, APMACRO_DATA: data }, encoding: 'utf8', stdio: 'pipe' }); } catch (e) { return String(e.stdout) + String(e.stderr); }
}
const editQ = (data, fn) => { const p = join(data, 'questions', `${T}.json`); const q = JSON.parse(readFileSync(p, 'utf8')); fn(q); writeFileSync(p, JSON.stringify(q)); };
const item = (q, n) => q.items.find(x => x.id === `mac-${T}-${n}`);

test('a wrong numeric key, a taught slip, party politics, a microeconomics topic or a setup item fails the content check', () => {
  assert.match(broken(d => editQ(d, q => { item(q, 4).numeric.answer = 20; })), new RegExp(`mac-${T}-4: numeric\\.answer 20 disagrees with its recipe: totalChange gives 100`));
  assert.match(broken(d => editQ(d, q => { q.items[0].why.correct = 'Placeholder: to close the gap, multiply the gap by the multiplier.'; })), /teaches a slip: multiplying the gap/);
  assert.match(broken(d => editQ(d, q => { q.items[0].why.correct = 'Placeholder: in the long run aggregate demand returns the economy to full employment.'; })), /teaches a slip: self-adjustment through AD/);
  assert.match(broken(d => editQ(d, q => { q.items[0].q = 'Placeholder: Republicans raised spending. In the short run, what happens to output?'; })), /language: party politics/);
  assert.match(broken(d => editQ(d, q => { q.items[0].q = 'Placeholder: an oligopoly raises prices. In the short run, what happens to output here?'; })), /a microeconomics topic/);
  assert.match(broken(d => editQ(d, q => { const s = q.stimuli[`${T}-s1`]; delete s.invented; s.source = 'a website'; })), /must cite a real publisher and a year/);
  assert.match(broken(d => editQ(d, q => { q.items[0].type = 'setup'; })), /type must be one of single, multi, numeric, specific, order, graph/);
  assert.match(broken(d => editQ(d, q => { q.items[0].practice = '4.A'; })), /assessed only in the free-response section/);
  assert.doesNotMatch(broken(d => editQ(d, q => { q.items[0].why.correct = 'Placeholder: <span class="mac-slip">multiply the gap by the multiplier</span> is the classic slip; divide instead.'; })), /teaches a slip/);
});

test('a graph item the grader cannot score, or out of shape, fails the content check', () => {
  assert.match(broken(d => editQ(d, q => { item(q, 2).graph.key.outcome = { 'price level': 'down', output: 'down' }; })), /graph\.key\.outcome\.price level is "down" but the key shifts give "up"/);
  assert.match(broken(d => editQ(d, q => { item(q, 2).graph.key.shifts = [{ curve: 'MS', dir: 'left' }]; })), /unknown curve "MS"/);
  assert.match(broken(d => editQ(d, q => { delete item(q, 2).graph.key.because; })), /because/);
  assert.match(broken(d => editQ(d, q => { delete item(q, 2).graph.key.outcome; })), /say what happens to both axes/);
  assert.match(broken(d => editQ(d, q => { item(q, 2).graph.kind = 'is-lm'; })), /graph\.kind must be one of/);
  assert.match(broken(d => editQ(d, q => { item(q, 2).graph.slips = { AD: 'Placeholder: multiply the gap by the multiplier to close it here.' }; })), /teaches a slip/);
  assert.match(broken(d => editQ(d, q => { item(q, 2).practice = '4.C'; item(q, 1).practice = '4.C'; })), new RegExp(`mac-${T}-1: skill 4\\.C \\(graphing\\) is assessed only`), 'graphing only on graph items');
});

test('an FRQ out of the exam shape fails the content check', () => {
  const editF = (id, fn) => d => { const p = join(d, 'frq', `${id}.json`); const f = JSON.parse(readFileSync(p, 'utf8')); fn(f); writeFileSync(p, JSON.stringify(f)); };
  assert.match(broken(editF('frq-placeholder-long', f => { f.points = 7; })), /worth 10 points/);
  assert.match(broken(editF('frq-placeholder-short', f => { f.parts[1].points = 3; f.parts[1].rubric.push({ point: 'x', accept: [] }); })), /parts add up to 6 points, not 5/);
  assert.match(broken(editF('frq-placeholder-long', f => { f.parts[0].type = undefined; delete f.parts[0].graph; f.parts[0].rubric.forEach(r => delete r.auto); })), /at least one graph part/);
  assert.match(broken(editF('frq-placeholder-long', f => { f.parts[0].rubric[0].auto = 'point'; })), /rubric auto "point" is not a check this graph makes/);
  assert.match(broken(editF('frq-placeholder-long', f => { f.parts[0].graph.key.outcome = { output: 'up' }; })), /key shifts give "down"/);
  assert.match(broken(editF('frq-placeholder-long', f => { f.parts[2].label = 'third'; })), /label is A, B/);
  assert.match(broken(editF('frq-placeholder-short', f => { f.study = {}; })), /"study" is not used/);
  assert.match(broken(editF('frq-placeholder-long', f => { f.scenario = '<table><tr><td>A placeholder economy in a table</td></tr></table>'; })), /scenario is plain text/);
  assert.match(broken(editF('frq-placeholder-long', f => { f.scenario = 'A placeholder economy. <b>Draw</b> its graph.'; })), /the tasks .* go in the parts/);
});

test('an FRQ may not use a term taught after the topic it unlocks with; refiling it on that topic fixes it', () => {
  const editF = (id, fn) => d => { const p = join(d, 'frq', `${id}.json`); const f = JSON.parse(readFileSync(p, 'utf8')); fn(f); writeFileSync(p, JSON.stringify(f)); };
  // Short-run AD-AS changes (3.6) come before crowding out (5.5).
  const late = f => { f.parts[1].sample += ' Deficit spending may also cause crowding out.'; };
  assert.match(broken(editF('frq-placeholder-short', late)), /ORDER \(unlocks with adas-short-run-changes\): uses "crowding out"/);
  assert.doesNotMatch(broken(editF('frq-placeholder-short', f => { late(f); f.topics.push('crowding-out'); f.units.push('unit-5'); })), /ORDER/);
  assert.match(broken(editF('frq-placeholder-short', f => { f.topics.push('crowding-out'); })), /topic crowding-out is in unit-5; list that unit/);
});

test('no help note in this course: the field and the pasted line are refused', () => {
  const editL = fn => d => { const p = join(d, 'lessons', `${T}.json`); const L = JSON.parse(readFileSync(p, 'utf8')); fn(L); writeFileSync(p, JSON.stringify(L)); };
  assert.match(broken(editL(L => { L.help = true; })), /"help" is not used in macroeconomics/);
});

test('key position balance: no option holds the key in more than 40% of a topic, every position used once there are enough items', async () => {
  const { keyPositionTell } = await import('../check-apmacro-content.mjs');
  const q = (c, extra = {}) => ({ type: 'single', options: ['a', 'b', 'c', 'd'], correct: c, ...extra });
  assert.equal(keyPositionTell([0, 1, 2, 3, 0, 1, 2, 3].map(c => q(c))), null);
  assert.match(keyPositionTell([0, 0, 0, 1, 2, 3].map(c => q(c))), /option 1 in 3 of 6/);
  assert.match(keyPositionTell([0, 1, 2, 0, 1, 2, 0, 1, 2].map(c => q(c))), /never option 4/);
  assert.equal(keyPositionTell([0, 0, 0, 0, 0].map(c => q(c, { fixed: true }))), null, 'fixed items keep their order');
  assert.equal(keyPositionTell([0, 0, 1, 2].map(c => q(c))), null, 'too few items to judge');
});
