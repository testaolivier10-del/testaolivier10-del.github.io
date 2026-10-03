/* The AP® Biology generator against the test map (scripts/test/fixtures/apbio-map-stub.json):
   with a unit published it writes every page kind, and the pages pass the
   course's own site rules (trademark, Beta, Report a problem); with nothing
   published every page is noindex; no output path carries the token "ap". */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import trademark from '../site-rules/apbio-trademark.mjs';
import beta from '../site-rules/apbio-beta-and-report.mjs';
import { trademarkProblems, hasApToken } from '../lib/apbio-build.mjs';

function build(published) {
  const root = mkdtempSync(join(tmpdir(), 'apbio-build-'));
  execFileSync(process.execPath, ['scripts/build-apbio.mjs', '--out', join(root, 'bio')], { env: { ...process.env, APBIO_MAP_STUB: '1', APBIO_PUBLISHED: published } });
  const files = [];
  const walk = d => { for (const n of readdirSync(d)) { const f = join(d, n); statSync(f).isDirectory() ? walk(f) : files.push(f); } };
  walk(root);
  return { root, files, html: files.filter(f => f.endsWith('.html')) };
}

test('a published unit builds every page kind, and the course rules pass', () => {
  const { root, files, html } = build('unit-1,skills-stats');
  const rel = files.map(f => f.slice(root.length + 1));
  for (const p of ['bio/index.html', 'bio/learn.html', 'bio/glossary.html', 'bio/units/unit-1.html', 'bio/unit-sheets/unit-1.html', 'bio/lessons/water-hydrogen-bonding.html', 'bio/notes/water-hydrogen-bonding.html', 'bio/practice.html', 'bio/assets/bank/unit-1.json', 'bio/assets/bank/unit-1-why.json', 'bio/assets/bank/index.json', 'bio/assets/bio-curriculum.js']) assert.ok(rel.includes(p), p);
  assert.ok(rel.every(r => !hasApToken(r.slice(4))));
  const fails = [];
  trademark({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  beta({ ROOT: root, fail: m => fails.push(m), htmlFiles: html });
  assert.deepEqual(fails, []);
  const lesson = readFileSync(join(root, 'bio/lessons/water-hydrogen-bonding.html'), 'utf8');
  assert.match(lesson, /<title>Structure of Water and Hydrogen Bonding — AP® Biology( Lesson)?( \| LevlPrep)?<\/title>/);
  assert.match(lesson, /"isAccessibleForFree": true/, 'Unit 1 lessons are free');
  assert.doesNotMatch(lesson, /noindex/);
  const desc = lesson.match(/name="description" content="([^"]*)"/)[1];
  assert.doesNotMatch(desc, /\bAP\b/);
});

test('nothing published: no topic pages, every page noindex', () => {
  const { html } = build('');
  assert.ok(html.length > 5);
  assert.ok(!html.some(f => /\/(lessons|notes|units)\//.test(f)));
  for (const f of html) assert.match(readFileSync(f, 'utf8'), /<meta name="robots" content="noindex/, f);
});

test('trademark wording', () => {
  assert.deepEqual(trademarkProblems('An AP® Biology course. AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.'), []);
  assert.equal(trademarkProblems('AP Biology').length, 1);
  assert.equal(trademarkProblems('take two AP®s').length, 1);
  assert.equal(trademarkProblems("the AP®'s format").length, 1);
  assert.equal(trademarkProblems('ready for the AP® exam').length, 1, 'lowercase noun: use "AP® Biology exam"');
  assert.deepEqual(trademarkProblems('the AP&reg; Biology exam, a map, APA style'), []);
});
