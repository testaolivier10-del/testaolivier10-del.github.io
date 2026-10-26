/* The AP® Physics 1 generator against the real map and the placeholder
   sample in scripts/test/fixtures/apphys-data (one Unit 1 topic and four FRQs,
   never in physics/data): with Unit 1 published it writes every page kind, and
   the pages pass the course's own site rules (trademark, Beta, Report a
   problem); with nothing published every page is noindex; no output path
   carries the token "ap"; the four FRQ types are in the FRQ data; a tool is
   built only when its data file exists and its topic is published. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import trademark from '../site-rules/apphys-trademark.mjs';
import beta from '../site-rules/apphys-beta-and-report.mjs';
import { trademarkProblems, hasApToken } from '../lib/apphys-build.mjs';

const FIX = 'scripts/test/fixtures/apphys-data';
const T = 'motion-quantities';
function build(published) {
  const root = mkdtempSync(join(tmpdir(), 'apphys-build-'));
  execFileSync(process.execPath, ['scripts/build-apphys.mjs', '--out', join(root, 'physics')], { env: { ...process.env, APPHYS_DATA: FIX, APPHYS_PUBLISHED: published } });
  const files = [];
  const walk = d => { for (const n of readdirSync(d)) { const f = join(d, n); statSync(f).isDirectory() ? walk(f) : files.push(f); } };
  walk(root);
  return { root, files, html: files.filter(f => f.endsWith('.html')) };
}

test('a published unit builds every page kind, and the course rules pass', () => {
  const { root, files, html } = build('unit-1,skills-math');
  const rel = files.map(f => f.slice(root.length + 1));
  for (const p of ['physics/index.html', 'physics/learn.html', 'physics/glossary.html', 'physics/units/unit-1.html', 'physics/unit-sheets/unit-1.html', `physics/lessons/${T}.html`, `physics/notes/${T}.html`, 'physics/practice.html', 'physics/exams.html', 'physics/frq.html', 'physics/assets/bank/unit-1.json', 'physics/assets/bank/unit-1-why.json', 'physics/assets/bank/index.json', 'physics/assets/phys-curriculum.js']) assert.ok(rel.includes(p), p);
  assert.ok(rel.every(r => !hasApToken(r.slice(5))));
  const fails = [];
  trademark({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  beta({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  assert.deepEqual(fails, []);
  const lesson = readFileSync(join(root, `physics/lessons/${T}.html`), 'utf8');
  assert.match(lesson, /<title>Displacement, Velocity and Acceleration — AP® Physics 1( Lesson)?( \| LevlPrep)?<\/title>/);
  assert.match(lesson, /"isAccessibleForFree": true/, 'Unit 1 lessons are free');
  assert.doesNotMatch(lesson, /noindex/);
  assert.match(lesson, /class="phys-stim"[\s\S]*Diagram/, 'a scene-diagram stimulus is labeled');
  assert.doesNotMatch(lesson, /periodic-table/, 'no periodic table in physics');
  const desc = lesson.match(/name="description" content="([^"]*)"/)[1];
  assert.doesNotMatch(desc, /\bAP\b/);
  const cur = readFileSync(join(root, 'physics/assets/phys-curriculum.js'), 'utf8');
  const CU = JSON.parse(cur.match(/window\.ApPhysCurriculum = (.*);/)[1]);
  assert.equal(CU.units.filter(u => u.part === 'course').length, 8);
  const order = CU.topics.map(t => t.id);
  assert.ok(order.indexOf('math-symbols') < order.indexOf(T), 'the math you need comes first');
  assert.ok(CU.topics.find(t => t.id === 'math-units').free, 'math lessons are free');
});

test('nothing published: no topic pages, every page noindex', () => {
  const { html } = build('');
  assert.ok(html.length > 5);
  assert.ok(!html.some(f => /\/(lessons|notes|units)\//.test(f)));
  for (const f of html) assert.match(readFileSync(f, 'utf8'), /<meta name="robots" content="noindex/, f);
});

test('the course home has its own headline and the amber pendulum, not Chemistry\'s', () => {
  const { root } = build('unit-1');
  const home = readFileSync(join(root, 'physics/index.html'), 'utf8');
  assert.match(home, /<h1 id="chTitle">AP&reg; Physics 1, <span>one force at a time\.<\/span><\/h1>/);
  assert.doesNotMatch(home, /Chemistry|Biology|particle|Mole Counter/);
  assert.match(home, /assets\/phys\.css/);
  assert.match(home, /data-cover="apphys"/);
  assert.match(home, /assets\/covers\/apphys\.svg/);
  const css = readFileSync('physics/assets/phys.css', 'utf8');
  assert.match(css, /body\.phys\{--ctint:#FBEED5;--cink:#734200;\}/);
  assert.match(readFileSync('assets/theme.css', 'utf8'), /body\[data-course="apphys"\]\{--ctint:#FBEED5;--cink:#734200;\}/);
});

test('tools: pre-registered, built only with a data file and a published topic, loading their own model', () => {
  const pages = JSON.parse(readFileSync(join(FIX, 'pages.json'), 'utf8'));
  assert.equal(pages.tools.length, 11);
  assert.deepEqual(pages.tools.map(t => t.slug).sort(), ['collision-lab', 'energy-bar-charts', 'fluids-tank', 'free-body-diagrams', 'lab-design', 'motion-graphs', 'oscillator-lab', 'projectile-lab', 'rotation-lab', 'scaling-drills', 'torque-balance']);
  assert.ok(pages.tools.every(t => t.studio === true && t.topic));
  // No data file yet: nothing built, the curriculum lists each as arriving with its unit.
  const { root, files } = build('unit-1,skills-math');
  assert.ok(!files.some(f => /\/tools\/[^/]+\.html$/.test(f)), 'no tool page without data');
  const cur = readFileSync(join(root, 'physics/assets/phys-curriculum.js'), 'utf8');
  const list = JSON.parse(cur.match(/window\.ApPhysToolList = (.*);/)[1]);
  assert.equal(list.length, 11);
  assert.ok(list.every(t => !t.live && t.arrives));
  // A data file whose topic is published: built, and the page loads the shared
  // math, the tool's own model file, the framework and the scene helpers.
  const data = mkdtempSync(join(tmpdir(), 'apphys-data-'));
  cpSync(FIX, data, { recursive: true });
  mkdirSync(join(data, 'tools'), { recursive: true });
  writeFileSync(join(data, 'tools', 'motion-graphs.json'), JSON.stringify({ slug: 'motion-graphs', kind: 'simulator', topic: 'motion-representations', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'motion-quantities' }] }));
  writeFileSync(join(data, 'tools', 'projectile-lab.json'), JSON.stringify({ slug: 'projectile-lab', kind: 'simulator', topic: 'motion-2d', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'motion-2d' }] }));
  const out = mkdtempSync(join(tmpdir(), 'apphys-build-'));
  execFileSync(process.execPath, ['scripts/build-apphys.mjs', '--out', join(out, 'physics')], { env: { ...process.env, APPHYS_DATA: data, APPHYS_PUBLISHED: 'unit-1,skills-math' } });
  // motion-representations (1.3) is in Unit 1, which is published, but it has
  // no lesson yet: the tool is live once its context topic's chapter is out.
  const page = readFileSync(join(out, 'physics/tools/motion-graphs.html'), 'utf8');
  const srcs = [...page.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  const at = f => srcs.findIndex(s => s.endsWith(f));
  assert.ok(at('tools/phys-tool-math.js') > -1 && at('tools/math/motion-graphs.js') === -1 || at('tools/phys-tool-math.js') < at('tools/math/motion-graphs.js'), 'shared math before the model');
  assert.ok(at('tools/phys-tools.js') > at('tools/phys-tool-math.js'));
  assert.ok(at('tools/phys-scene.js') > -1, 'scene helpers loaded');
  // projectile-lab's topic (1.5) is in Unit 1 too; both are built. A tool
  // whose topic is in an unpublished unit is not.
  writeFileSync(join(data, 'tools', 'collision-lab.json'), JSON.stringify({ slug: 'collision-lab', kind: 'simulator', topic: 'collisions', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'collisions' }] }));
  const out2 = mkdtempSync(join(tmpdir(), 'apphys-build-'));
  execFileSync(process.execPath, ['scripts/build-apphys.mjs', '--out', join(out2, 'physics')], { env: { ...process.env, APPHYS_DATA: data, APPHYS_PUBLISHED: 'unit-1,skills-math' } });
  assert.ok(existsSync(join(out2, 'physics/tools/projectile-lab.html')));
  assert.ok(!existsSync(join(out2, 'physics/tools/collision-lab.html')), 'Unit 4 is not published');
});

test('trademark wording', () => {
  assert.deepEqual(trademarkProblems('An AP® Physics 1 course. AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.'), []);
  assert.equal(trademarkProblems('AP Physics 1').length, 1);
  assert.equal(trademarkProblems('take two AP®s').length, 1);
  assert.equal(trademarkProblems("the AP®'s format").length, 1);
  assert.equal(trademarkProblems('ready for the AP® exam').length, 1, 'lowercase noun: use "AP® Physics 1 exam"');
  assert.deepEqual(trademarkProblems('the AP&reg; Physics 1 exam, a map, APA style'), []);
});

test('FRQ pages: the four types in exam order (mr 10, tbr 12, lab 10, qqt 8), drawing and graph space, the index, the teachers page and share links', () => {
  const { root, files } = build('unit-1');
  const rel = files.map(f => f.slice(root.length + 1));
  for (const t of ['mr', 'tbr', 'lab', 'qqt']) assert.ok(rel.includes(`physics/frq/frq-placeholder-${t}.html`), t);
  for (const p of ['physics/assets/frq/index.json', 'physics/teachers.html', 'physics/assets/summaries.json']) assert.ok(rel.includes(p), p);
  const index = JSON.parse(readFileSync(join(root, 'physics/assets/frq/index.json'), 'utf8'));
  assert.deepEqual(index.map(f => [f.type, f.points]), [['mr', 10], ['tbr', 12], ['lab', 10], ['qqt', 8]]);
  const one = JSON.parse(readFileSync(join(root, 'physics/assets/frq/frq-placeholder-tbr.json'), 'utf8'));
  assert.ok(one.stimulus.html.length > 0 && one.parts.every(p => p.rubric.length === p.points && p.sample));
  assert.equal(one.typeName, 'Translation Between Representations');
  assert.deepEqual(one.drawSpec.kind, 'fbd');
  assert.equal(one.parts[0].space, 'draw');
  const page = readFileSync(join(root, 'physics/frq/frq-placeholder-tbr.html'), 'utf8');
  assert.match(page, /class="phys-lines"/, 'printable lined space');
  assert.match(page, /class="phys-frq-draw phys-frq-fbd" role="img" aria-label="A dot that stands for the cart/, 'a drawing box for the FBD part');
  assert.match(page, /class="phys-frq-grid"/, 'a graph grid for the graph part');
  assert.match(page, /placeholder question/);
  assert.ok(!page.includes(one.parts[3].sample.slice(0, 60)), 'the sample answer is not in the page HTML');
  for (const p of ['physics/frq/frq-placeholder-qqt.html', `physics/lessons/${T}.html`, `physics/notes/${T}.html`, 'physics/unit-sheets/unit-1.html']) {
    const h = readFileSync(join(root, p), 'utf8');
    const gc = h.match(/href="(https:\/\/classroom\.google\.com\/share\?url=[^"]+)"/);
    assert.ok(gc, `${p}: Share to Google Classroom`);
    const u = new URL(gc[1].replace(/&amp;/g, '&'));
    assert.equal(u.searchParams.get('url'), `https://levlprep.com/physics/${p.slice('physics/'.length)}`);
    assert.doesNotMatch(u.searchParams.get('title'), /\bAP\b/);
  }
  const teachers = readFileSync(join(root, 'physics/teachers.html'), 'utf8');
  assert.match(teachers, new RegExp(`practice\\.html\\?topic=${T}`));
  assert.match(teachers, /privacy\.html#schools/);
});

test('the real physics/data passes the content check, and the fixture sample passes it too', () => {
  const run = env => execFileSync(process.execPath, ['scripts/check-apphys-content.mjs', '--check'], { env: { ...process.env, ...env }, encoding: 'utf8' });
  assert.match(run({}), /0 failing/);
  assert.match(run({ APPHYS_DATA: FIX }), /1 topics, 15 items, 0 failing/);
});
