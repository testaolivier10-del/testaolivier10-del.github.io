/* The AP® Chemistry generator against the real map and the placeholder
   sample in scripts/test/fixtures/apchem-data (one Unit 1 topic and two FRQs,
   never in chem/data): with Unit 1 published it writes every page kind, and
   the pages pass the course's own site rules (trademark, Beta, Report a
   problem); with nothing published every page is noindex; no output path
   carries the token "ap"; the real Section II split is in the FRQ data. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import trademark from '../site-rules/apchem-trademark.mjs';
import beta from '../site-rules/apchem-beta-and-report.mjs';
import { trademarkProblems, hasApToken } from '../lib/apchem-build.mjs';

const FIX = 'scripts/test/fixtures/apchem-data';
const T = 'moles-molar-mass';
function build(published) {
  const root = mkdtempSync(join(tmpdir(), 'apchem-build-'));
  execFileSync(process.execPath, ['scripts/build-apchem.mjs', '--out', join(root, 'chem')], { env: { ...process.env, APCHEM_DATA: FIX, APCHEM_PUBLISHED: published } });
  const files = [];
  const walk = d => { for (const n of readdirSync(d)) { const f = join(d, n); statSync(f).isDirectory() ? walk(f) : files.push(f); } };
  walk(root);
  return { root, files, html: files.filter(f => f.endsWith('.html')) };
}

test('a published unit builds every page kind, and the course rules pass', () => {
  const { root, files, html } = build('unit-1,skills-math');
  const rel = files.map(f => f.slice(root.length + 1));
  for (const p of ['chem/index.html', 'chem/learn.html', 'chem/glossary.html', 'chem/units/unit-1.html', 'chem/unit-sheets/unit-1.html', `chem/lessons/${T}.html`, `chem/notes/${T}.html`, 'chem/practice.html', 'chem/exams.html', 'chem/frq.html', 'chem/assets/bank/unit-1.json', 'chem/assets/bank/unit-1-why.json', 'chem/assets/bank/index.json', 'chem/assets/chem-curriculum.js']) assert.ok(rel.includes(p), p);
  assert.ok(rel.every(r => !hasApToken(r.slice(5))));
  const fails = [];
  trademark({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  beta({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  assert.deepEqual(fails, []);
  const lesson = readFileSync(join(root, `chem/lessons/${T}.html`), 'utf8');
  assert.match(lesson, /<title>Moles and Molar Mass — AP® Chemistry( Lesson)?( \| LevlPrep)?<\/title>/);
  assert.match(lesson, /"isAccessibleForFree": true/, 'Unit 1 lessons are free');
  assert.doesNotMatch(lesson, /noindex/);
  assert.match(lesson, /class="chem-stim"[\s\S]*Particle view/, 'a particle-diagram stimulus is labelled');
  const desc = lesson.match(/name="description" content="([^"]*)"/)[1];
  assert.doesNotMatch(desc, /\bAP\b/);
  const cur = readFileSync(join(root, 'chem/assets/chem-curriculum.js'), 'utf8');
  const CU = JSON.parse(cur.match(/window\.ApChemCurriculum = (.*);/)[1]);
  assert.equal(CU.units.filter(u => u.part === 'course').length, 9);
  const order = CU.topics.map(t => t.id);
  assert.ok(order.indexOf('math-sig-figs') < order.indexOf(T), 'the math refresher comes first');
  assert.ok(CU.topics.find(t => t.id === 'math-units').free, 'math lessons are free');
});

test('nothing published: no topic pages, every page noindex', () => {
  const { html } = build('');
  assert.ok(html.length > 5);
  assert.ok(!html.some(f => /\/(lessons|notes|units)\//.test(f)));
  for (const f of html) assert.match(readFileSync(f, 'utf8'), /<meta name="robots" content="noindex/, f);
});

test('the course home has its own headline and the cobalt flask, not Biology\'s', () => {
  const { root } = build('unit-1');
  const home = readFileSync(join(root, 'chem/index.html'), 'utf8');
  assert.match(home, /<h1>AP&reg; Chemistry, one particle at a time\.<\/h1>/);
  assert.doesNotMatch(home, /Biology|osmosis|Water Watcher/);
  assert.match(home, /assets\/chem\.css/);
});

test('trademark wording', () => {
  assert.deepEqual(trademarkProblems('An AP® Chemistry course. AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.'), []);
  assert.equal(trademarkProblems('AP Chemistry').length, 1);
  assert.equal(trademarkProblems('take two AP®s').length, 1);
  assert.equal(trademarkProblems("the AP®'s format").length, 1);
  assert.equal(trademarkProblems('ready for the AP® exam').length, 1, 'lowercase noun: use "AP® Chemistry exam"');
  assert.deepEqual(trademarkProblems('the AP&reg; Chemistry exam, a map, APA style'), []);
});

test('FRQ pages: long (10 points) and short (4 points), the index, the teachers page and share links', () => {
  const { root, files } = build('unit-1');
  const rel = files.map(f => f.slice(root.length + 1));
  for (const p of ['chem/frq/frq-placeholder-long.html', 'chem/frq/frq-placeholder-short.html', 'chem/assets/frq/index.json', 'chem/teachers.html', 'chem/assets/summaries.json']) assert.ok(rel.includes(p), p);
  const index = JSON.parse(readFileSync(join(root, 'chem/assets/frq/index.json'), 'utf8'));
  assert.deepEqual(index.map(f => [f.type, f.points]).sort(), [['long', 10], ['short', 4]]);
  const one = JSON.parse(readFileSync(join(root, 'chem/assets/frq/frq-placeholder-long.json'), 'utf8'));
  assert.ok(one.stimulus.html.length > 0 && one.parts.every(p => p.rubric.length === p.points && p.sample));
  const page = readFileSync(join(root, 'chem/frq/frq-placeholder-long.html'), 'utf8');
  assert.match(page, /class="chem-lines"/, 'printable lined space');
  assert.match(page, /placeholder question/);
  assert.ok(!page.includes(one.parts[3].sample.slice(0, 60)), 'the sample answer is not in the page HTML');
  for (const p of ['chem/frq/frq-placeholder-short.html', `chem/lessons/${T}.html`, `chem/notes/${T}.html`, 'chem/unit-sheets/unit-1.html']) {
    const h = readFileSync(join(root, p), 'utf8');
    const gc = h.match(/href="(https:\/\/classroom\.google\.com\/share\?url=[^"]+)"/);
    assert.ok(gc, `${p}: Share to Google Classroom`);
    const u = new URL(gc[1].replace(/&amp;/g, '&'));
    assert.equal(u.searchParams.get('url'), `https://levlprep.com/chem/${p.slice(5)}`);
    assert.doesNotMatch(u.searchParams.get('title'), /\bAP\b/);
  }
  const teachers = readFileSync(join(root, 'chem/teachers.html'), 'utf8');
  assert.match(teachers, new RegExp(`practice\\.html\\?topic=${T}`));
  assert.match(teachers, /privacy\.html#schools/);
});

test('the real chem/data passes the content check, and the fixture sample passes it too', () => {
  const run = env => execFileSync(process.execPath, ['scripts/check-apchem-content.mjs', '--check'], { env: { ...process.env, ...env }, encoding: 'utf8' });
  assert.match(run({}), /0 failing/);
  assert.match(run({ APCHEM_DATA: FIX }), /1 topics, 15 items, 0 failing/);
});
