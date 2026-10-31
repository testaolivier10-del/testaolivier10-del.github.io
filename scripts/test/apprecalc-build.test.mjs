/* The AP® Precalculus generator against the real map and the placeholder
   sample in scripts/test/fixtures/apprecalc-data (one Unit 3 topic, 3.15
   polar-rates, with every item format and both stimulus kinds, and one FRQ
   of each of the four types; never in precalculus/data): with Unit 3
   published it writes every page kind with math rendered and graphs
   plotted, and the pages pass the course's own site rules (trademark, the
   "not yet reviewed" note, Report a problem); with nothing published every
   page is noindex; no output path carries the token "ap"; the FRQ types are
   Q1-Q4, 6 points, the calculator flag fixed by the type; a tool is built
   only when its data file exists and its topic is published; the course
   identity (forest green, the unit-circle icon, the headline). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import trademark from '../site-rules/apprecalc-trademark.mjs';
import beta from '../site-rules/apprecalc-beta-and-report.mjs';
import { trademarkProblems, hasApToken, FREE_UNITS, IDENTITY } from '../lib/apprecalc-build.mjs';

const FIX = 'scripts/test/fixtures/apprecalc-data';
const T = 'polar-rates';
function build(published, data = FIX) {
  const root = mkdtempSync(join(tmpdir(), 'apprecalc-build-'));
  execFileSync(process.execPath, ['scripts/build-apprecalc.mjs', '--out', join(root, 'precalculus')], { env: { ...process.env, APPRECALC_DATA: data, APPRECALC_PUBLISHED: published } });
  const files = [];
  const walk = d => { for (const n of readdirSync(d)) { const f = join(d, n); statSync(f).isDirectory() ? walk(f) : files.push(f); } };
  walk(root);
  return { root, files, html: files.filter(f => f.endsWith('.html')) };
}

test('a published unit builds every page kind, math rendered and graphs plotted, and the course rules pass', () => {
  const { root, files, html } = build('unit-3');
  const rel = files.map(f => f.slice(root.length + 1));
  for (const p of ['precalculus/index.html', 'precalculus/learn.html', 'precalculus/glossary.html', 'precalculus/units/unit-3.html', 'precalculus/unit-sheets/unit-3.html', `precalculus/lessons/${T}.html`, `precalculus/notes/${T}.html`, 'precalculus/practice.html', 'precalculus/exams.html', 'precalculus/frq.html', 'precalculus/justify.html', 'precalculus/formula-sheet.html', 'precalculus/unit-tests/unit-3.html', 'precalculus/assets/bank/unit-3.json', 'precalculus/assets/bank/unit-3-why.json', 'precalculus/assets/bank/index.json', 'precalculus/assets/pcalc-curriculum.js']) assert.ok(rel.includes(p), p);
  assert.ok(!rel.includes('precalculus/score-calculator.html'), 'no score calculator (spec section 1)');
  assert.ok(rel.every(r => !hasApToken(r.slice(5))));
  const fails = [];
  trademark({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  beta({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  assert.deepEqual(fails, []);
  const lesson = readFileSync(join(root, `precalculus/lessons/${T}.html`), 'utf8');
  assert.match(lesson, /<title>Rates of Change in Polar Functions — AP® Precalculus( Lesson)?( \| LevlPrep)?<\/title>/);
  assert.doesNotMatch(lesson, /"isAccessibleForFree": true/, 'Unit 3 lessons are Premium');
  assert.doesNotMatch(lesson, /noindex/);
  assert.doesNotMatch(lesson, /pcalc-beyond/, 'Unit 3 is on the exam');
  // Math is MathML at build time, with its TeX kept; no raw $ is left.
  assert.match(lesson, /<math class="pcalc-m"><semantics>/);
  assert.match(lesson, /<annotation encoding="application\/x-tex">\\frac\{f\(b\) - f\(a\)\}\{b - a\}<\/annotation>/);
  assert.doesNotMatch(lesson.replace(/<script[\s\S]*?<\/script>/g, ''), /\$[^<]*\\(frac|ln)/);
  // The graph stimulus is drawn from its spec, and its kind is labeled.
  assert.match(lesson, /class="pcalc-stim"[\s\S]*Graph[\s\S]*<svg class="pcalc-plot"[^>]*role="img" aria-label="Graph of f\(x\) = x squared/);
  // The question engine is loaded with the parser and the renderer before it.
  const srcs = [...lesson.matchAll(/<script src="([^"]+)"/g)].map(m => m[1].replace(/^.*assets\//, ''));
  assert.ok(srcs.indexOf('pcalc-expr.js') > -1 && srcs.indexOf('pcalc-expr.js') < srcs.indexOf('pcalc-math.js') && srcs.indexOf('pcalc-math.js') < srcs.indexOf('pcalc-questions.js'));
  const desc = lesson.match(/name="description" content="([^"]*)"/)[1];
  assert.doesNotMatch(desc, /\bAP\b|<math|\$/);
  // The bank: rendered math, the expr key's HTML, the exact numeric key's value, the calculator flag.
  const bank = JSON.parse(readFileSync(join(root, 'precalculus/assets/bank/unit-3.json'), 'utf8'));
  const by = n => bank.items.find(q => q.id === `pcalc-${T}-${n}`);
  assert.match(by(3).expr.answerHtml, /<math/); assert.equal(by(3).expr.answer, '((x+2)^2 - x^2)/2');
  assert.match(by(10).expr.answerHtml, /arcsin/, 'answerTex shows the single inverse trig function');
  assert.ok(Math.abs(by(11).numeric.value - 1 / 2) < 1e-15); assert.match(by(11).numeric.answerHtml, /<mfrac>/);
  assert.equal(by(6).calc, true); assert.equal(by(11).calc, undefined);
  const cur = readFileSync(join(root, 'precalculus/assets/pcalc-curriculum.js'), 'utf8');
  const CU = JSON.parse(cur.match(/window\.ApPrecalcCurriculum = (.*);/)[1]);
  assert.equal(CU.units.filter(u => u.part === 'course').length, 4);
  assert.deepEqual(CU.units.filter(u => u.beyond).map(u => u.id), ['unit-4']);
  assert.equal(CU.topics.filter(t => t.kind === 'concept').length, 58);
  assert.equal(CU.topics.length, 69);
  const order = CU.topics.map(t => t.id);
  assert.ok(order.indexOf('alg-functions') < order.indexOf('change-in-tandem'), 'the algebra you need comes first');
  assert.ok(CU.topics.find(t => t.id === 'alg-right-triangle').free, 'algebra lessons are free');
  assert.ok(CU.topics.find(t => t.id === 'change-in-tandem').free, 'Unit 1 is free');
  assert.ok(!CU.topics.find(t => t.id === 'sequences').free, 'Unit 2 is Premium');
  assert.equal(CU.topics.find(t => t.id === T).bank, undefined);
});

test('the free tier is Unit 1 and the algebra chapter, the same in the build and in premium.js', () => {
  assert.deepEqual(FREE_UNITS, ['unit-1']);
  const prem = readFileSync('assets/premium.js', 'utf8');
  const block = prem.slice(prem.indexOf('    apprecalc: {'), prem.indexOf('  };', prem.indexOf('    apprecalc: {')));
  assert.match(block, /freeChapters: \['unit-1'\]/);
  assert.match(block, /onSale: false/);
  assert.match(block, /\{ id: 'pcalc-2027', label: 'Through June 30, 2027', price: 25, until: '2027-06-30' \}/);
});

test('nothing published: no topic pages, every page noindex', () => {
  const { html } = build('');
  assert.ok(html.length > 5);
  assert.ok(!html.some(f => /\/(lessons|notes|units)\//.test(f)));
  for (const f of html) assert.match(readFileSync(f, 'utf8'), /<meta name="robots" content="noindex/, f);
});

test('the course home has its own headline, forest green and the unit-circle icon, not Calculus AB\'s', () => {
  const { root } = build('unit-3');
  const home = readFileSync(join(root, 'precalculus/index.html'), 'utf8');
  assert.match(home, /<h1 class="mast" id="r3Title">AP®<span>Precalculus<\/span><\/h1>/);
  assert.match(home, /<p class="deck">AP® Precalculus, <span>every function in motion\.<\/span><\/p>/);
  assert.doesNotMatch(home, /Calculus AB|derivative|integral|Limit Seeker|Chemistry|Psychology/);
  assert.match(home, /assets\/pcalc\.css/);
  assert.match(home, /data-cover="apprecalc"/);
  assert.match(home, /assets\/covers\/apprecalc\.svg/);
  assert.equal(IDENTITY.accent.ink, '#11592F');
  assert.equal(IDENTITY.firstRank, 'Function Explorer');
  const css = readFileSync('precalculus/assets/pcalc.css', 'utf8');
  assert.match(css, /body\.pcalc\{--ctint:#E3F3E8;--cink:#11592F;\}/);
  assert.match(css, /:root\[data-theme="dark"\] body\.pcalc\{--ctint:rgba\(80,200,130,0\.10\);--cink:#ACE4BF;\}/);
  const theme = readFileSync('assets/theme.css', 'utf8');
  assert.match(theme, /body\[data-course="apprecalc"\]\{--ctint:#E3F3E8;--cink:#11592F;\}/);
  assert.match(theme, /\[data-tint="apprecalc"\]\{--ctint:#E3F3E8;--cink:#11592F;\}/);
  assert.match(readFileSync('assets/hub-progress.js', 'utf8'), /apprecalc: \[\n\s+\{ min: 1,  title: 'Function Explorer' \}/);
  for (const f of ['assets/covers/apprecalc.svg', 'assets/covers/art/apprecalc.svg', 'assets/covers/thumb/apprecalc.svg']) assert.ok(existsSync(f), f);
});

/* WCAG contrast of the accent pairs (spec decision 8: at least 7:1 light and dark). */
const lum = h => { const c = [0, 2, 4].map(i => parseInt(h.slice(1 + i, 3 + i), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const over = (rgb, a, bg) => '#' + rgb.map((v, i) => Math.round(v * a + parseInt(bg.slice(1 + 2 * i, 3 + 2 * i), 16) * (1 - a)).toString(16).padStart(2, '0')).join('');
test('the accent holds 7:1 in light and dark, and its hue is apart from every other course', () => {
  const A = IDENTITY.accent;
  for (const [fg, bg] of [[A.ink, '#FFFFFF'], [A.ink, A.tint], [A.ink, '#F7F9FC'], ['#F7F9FC', A.ink]]) assert.ok(ratio(fg, bg) >= 7, `${fg} on ${bg}: ${ratio(fg, bg).toFixed(2)}`);
  const dt = [80, 200, 130];
  for (const bg of ['#0A1322', '#16243B']) {
    assert.ok(ratio(A.darkInk, bg) >= 7, `dark ink on ${bg}`);
    assert.ok(ratio(A.darkInk, over(dt, 0.10, bg)) >= 7, `dark ink on the tint over ${bg}`);
  }
  // Cover: the accent line and white title on the cover ground.
  assert.ok(ratio(A.soft, '#0B4A33') >= 7 && ratio('#FFFFFF', '#0B4A33') >= 7);
  const hue = h => { const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(1 + i, 3 + i), 16) / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; const H = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (H * 60 + 360) % 360; };
  const theme = readFileSync('assets/theme.css', 'utf8');
  const others = [...theme.matchAll(/^body\[data-course="([a-z]+)"\]\{--ctint:#[0-9A-F]{6};--cink:(#[0-9A-F]{6});\}/gm)].filter(m => m[1] !== 'apprecalc');
  assert.ok(others.length >= 9);
  for (const [, k, ink] of others) { const d = Math.abs(hue(ink) - hue(A.ink)); assert.ok(Math.min(d, 360 - d) >= 25, `${k} hue ${hue(ink).toFixed(0)} vs ${hue(A.ink).toFixed(0)}`); }
});

test('tools: ten pre-registered trainers, built only with a data file and a published topic, loading their own model and the plot helper', () => {
  const pages = JSON.parse(readFileSync(join(FIX, 'pages.json'), 'utf8'));
  assert.equal(pages.tools.length, 10);
  assert.deepEqual(pages.tools.map(t => t.slug).sort(), ['exp-log-lab', 'function-lab', 'polar-graphs', 'poly-rational', 'rate-of-change', 'regression-lab', 'sinusoid-builder', 'symbolic-steps', 'unit-circle', 'vectors-matrices']);
  assert.ok(pages.tools.every(t => t.studio === true && t.topic));
  assert.deepEqual(pages.tools.filter(t => !t.premium).map(t => t.slug).sort(), ['function-lab', 'rate-of-change', 'unit-circle'], 'three free trainers (spec section 6)');
  for (const t of pages.tools) for (const f of [`precalculus/assets/tools/${t.slug}.js`, `precalculus/assets/tools/math/${t.slug}.js`, `scripts/lib/apprecalc-tool-checks/${t.slug}.mjs`, `scripts/test/apprecalc-tool-${t.slug}.test.mjs`]) assert.ok(existsSync(f), f);
  const { root, files } = build('unit-3');
  assert.ok(!files.some(f => /\/tools\/[^/]+\.html$/.test(f)), 'no tool page without data');
  const cur = readFileSync(join(root, 'precalculus/assets/pcalc-curriculum.js'), 'utf8');
  const list = JSON.parse(cur.match(/window\.ApPrecalcToolList = (.*);/)[1]);
  assert.equal(list.length, 10);
  assert.ok(list.every(t => !t.live && t.arrives));
  const data = mkdtempSync(join(tmpdir(), 'apprecalc-data-'));
  cpSync(FIX, data, { recursive: true });
  mkdirSync(join(data, 'tools'), { recursive: true });
  writeFileSync(join(data, 'tools', 'polar-graphs.json'), JSON.stringify({ slug: 'polar-graphs', kind: 'simulator', topic: 'polar-curves', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'polar-curves' }] }));
  writeFileSync(join(data, 'tools', 'function-lab.json'), JSON.stringify({ slug: 'function-lab', kind: 'simulator', topic: 'transformations', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'transformations' }] }));
  const out = mkdtempSync(join(tmpdir(), 'apprecalc-build-'));
  execFileSync(process.execPath, ['scripts/build-apprecalc.mjs', '--out', join(out, 'precalculus')], { env: { ...process.env, APPRECALC_DATA: data, APPRECALC_PUBLISHED: 'unit-3' } });
  const page = readFileSync(join(out, 'precalculus/tools/polar-graphs.html'), 'utf8');
  const srcs = [...page.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  const at = f => srcs.findIndex(s => s.endsWith(f));
  assert.ok(at('pcalc-expr.js') > -1 && at('pcalc-expr.js') < at('tools/pcalc-tool-math.js'), 'the parser before the shared math');
  assert.ok(at('tools/pcalc-tool-math.js') < at('tools/math/polar-graphs.js'), 'shared math before the model');
  assert.ok(at('tools/pcalc-tools.js') > at('tools/pcalc-tool-math.js'));
  assert.ok(at('tools/pcalc-plot.js') > -1, 'plot helper loaded');
  assert.ok(at('tools/polar-graphs.js') > at('tools/pcalc-plot.js'));
  assert.ok(!existsSync(join(out, 'precalculus/tools/function-lab.html')), 'Unit 1 is not published');
});

test('trademark wording', () => {
  assert.deepEqual(trademarkProblems('An AP® Precalculus course. AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.'), []);
  assert.equal(trademarkProblems('AP Precalculus').length, 1);
  assert.equal(trademarkProblems('take two AP®s').length, 1);
  assert.equal(trademarkProblems("the AP®'s format").length, 1);
  assert.equal(trademarkProblems('ready for the AP® exam').length, 1, 'lowercase noun: use "AP® Precalculus exam"');
  assert.deepEqual(trademarkProblems('the AP&reg; Precalculus exam, a map, APA style'), []);
});

test('FRQ pages: the four types in exam order, 6 points, the calculator flag by type, the index, the teachers page and share links', () => {
  const { root, files } = build('unit-3');
  const rel = files.map(f => f.slice(root.length + 1));
  const TYPES = ['concepts', 'modeling', 'periodic', 'symbolic'];
  for (const t of TYPES) assert.ok(rel.includes(`precalculus/frq/frq-placeholder-${t}.html`), t);
  for (const p of ['precalculus/assets/frq/index.json', 'precalculus/teachers.html', 'precalculus/assets/summaries.json']) assert.ok(rel.includes(p), p);
  const index = JSON.parse(readFileSync(join(root, 'precalculus/assets/frq/index.json'), 'utf8'));
  assert.deepEqual(index.map(f => f.type), TYPES);
  assert.ok(index.every(f => f.points === 6 && typeof f.calc === 'boolean'));
  assert.deepEqual(index.filter(f => f.calc).map(f => f.type), ['concepts', 'modeling']);
  const one = JSON.parse(readFileSync(join(root, 'precalculus/assets/frq/frq-placeholder-periodic.json'), 'utf8'));
  assert.ok(one.stimulus.html.includes('<svg class="pcalc-plot"') && one.parts.every(p => p.rubric.length === p.points && p.sample));
  assert.equal(one.typeName, 'Q3: Modeling a Periodic Context');
  const page = readFileSync(join(root, 'precalculus/frq/frq-placeholder-periodic.html'), 'utf8');
  assert.match(page, /class="pcalc-lines"/, 'printable lined space');
  assert.match(page, /Part B: no calculator/);
  assert.match(page, /6 points/);
  assert.match(readFileSync(join(root, 'precalculus/frq/frq-placeholder-concepts.html'), 'utf8'), /Part A: graphing calculator allowed/);
  assert.match(page, /placeholder question/);
  assert.ok(!page.includes(one.parts[3].sample.slice(0, 50)), 'the sample answer is not in the page HTML');
  for (const p of ['precalculus/frq/frq-placeholder-symbolic.html', `precalculus/lessons/${T}.html`, `precalculus/notes/${T}.html`, 'precalculus/unit-sheets/unit-3.html']) {
    const h = readFileSync(join(root, p), 'utf8');
    const gc = h.match(/href="(https:\/\/classroom\.google\.com\/share\?url=[^"]+)"/);
    assert.ok(gc, `${p}: Share to Google Classroom`);
    const u = new URL(gc[1].replace(/&amp;/g, '&'));
    assert.equal(u.searchParams.get('url'), `https://levlprep.com/precalculus/${p.slice('precalculus/'.length)}`);
    assert.doesNotMatch(u.searchParams.get('title'), /\bAP\b/);
  }
  const teachers = readFileSync(join(root, 'precalculus/teachers.html'), 'utf8');
  assert.match(teachers, new RegExp(`practice\\.html\\?topic=${T}`));
  assert.match(teachers, /privacy\.html#schools/);
  assert.match(teachers, /Unit 4 is not on the exam/);
  assert.doesNotMatch(teachers, /BC-only/);
});

test('a TeX typo in a built topic stops the build', () => {
  const data = mkdtempSync(join(tmpdir(), 'apprecalc-data-'));
  cpSync(FIX, data, { recursive: true });
  const p = join(data, 'lessons', `${T}.json`);
  writeFileSync(p, readFileSync(p, 'utf8').replace('Over small nearby intervals', 'Over $\\\\frak{1}{2}$ small nearby intervals'));
  const out = mkdtempSync(join(tmpdir(), 'apprecalc-build-'));
  assert.throws(() => execFileSync(process.execPath, ['scripts/build-apprecalc.mjs', '--out', join(out, 'precalculus')], { env: { ...process.env, APPRECALC_DATA: data, APPRECALC_PUBLISHED: 'unit-3' }, stdio: 'pipe' }), /frak/);
});

test('the content check: the real precalculus/data passes, the fixture passes, calculus wording and Unit 4 FRQs fail', () => {
  const run = env => execFileSync(process.execPath, ['scripts/check-apprecalc-content.mjs', '--check'], { env: { ...process.env, ...env }, encoding: 'utf8' });
  assert.match(run({}), /0 failing/);
  // The fixture, published (its published.json is empty; a copy lists unit-3).
  const pub = data => writeFileSync(join(data, 'published.json'), JSON.stringify({ chapters: ['unit-3'] }));
  const ok = mkdtempSync(join(tmpdir(), 'apprecalc-data-'));
  cpSync(FIX, ok, { recursive: true }); pub(ok);
  assert.match(run({ APPRECALC_DATA: ok }), /1 topics, 15 items, 0 failing/);
  const data = mkdtempSync(join(tmpdir(), 'apprecalc-data-'));
  cpSync(FIX, data, { recursive: true }); pub(data);
  const q = join(data, 'questions', `${T}.json`);
  writeFileSync(q, readFileSync(q, 'utf8').replace('Concave down means the rate of change is decreasing.', 'The function is increasing at a decreasing rate.'));
  const f = join(data, 'frq', 'frq-placeholder-periodic.json');
  writeFileSync(f, readFileSync(f, 'utf8').replace('"calc": false', '"calc": true').replace('"unit-3"', '"unit-4"'));
  let out = '';
  try { run({ APPRECALC_DATA: data }); } catch (e) { out = e.stdout; }
  assert.match(out, /calculus wording: say "the rate of change is increasing \(or decreasing\)"/);
  assert.match(out, /a periodic question is Part B: calc false/);
  assert.match(out, /unit "unit-4" is beyond the exam; FRQs come from Units 1-3/);
});
