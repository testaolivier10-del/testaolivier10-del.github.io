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
  execFileSync(process.execPath, ['scripts/build-apbio.mjs', '--out', join(root, 'bio')], { env: { ...process.env, APBIO_PUBLISHED: published } });
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

test('FRQ pages, the FRQ index, the teachers page and share links', () => {
  const { root, files } = build('unit-1');
  const rel = files.map(f => f.slice(root.length + 1));
  for (const p of ['bio/frq/frq-buried-side-chain.html', 'bio/assets/frq/index.json', 'bio/assets/frq/frq-buried-side-chain.json', 'bio/teachers.html', 'bio/assets/summaries.json']) assert.ok(rel.includes(p), p);
  const index = JSON.parse(readFileSync(join(root, 'bio/assets/frq/index.json'), 'utf8'));
  assert.ok(index.some(f => f.id === 'frq-buried-side-chain' && f.points === 4));
  const one = JSON.parse(readFileSync(join(root, 'bio/assets/frq/frq-buried-side-chain.json'), 'utf8'));
  assert.ok(one.stimulus.html.length > 0 && one.parts.every(p => p.rubric.length === p.points && p.sample));
  const page = readFileSync(join(root, 'bio/frq/frq-buried-side-chain.html'), 'utf8');
  assert.match(page, /class="bio-lines"/, 'printable lined space');
  assert.ok(!page.includes(one.parts[0].sample.replace(/<[^>]+>/g, '').slice(0, 60)), 'the sample answer is not in the page HTML');
  for (const p of ['bio/frq/frq-buried-side-chain.html', 'bio/lessons/water-hydrogen-bonding.html', 'bio/notes/water-hydrogen-bonding.html', 'bio/unit-sheets/unit-1.html']) {
    const h = readFileSync(join(root, p), 'utf8');
    const gc = h.match(/href="(https:\/\/classroom\.google\.com\/share\?url=[^"]+)"/);
    assert.ok(gc, `${p}: Share to Google Classroom`);
    const u = new URL(gc[1].replace(/&amp;/g, '&'));
    assert.equal(u.searchParams.get('url'), `https://levlprep.com/bio/${p.slice(4)}`);
    assert.doesNotMatch(u.searchParams.get('title'), /\bAP\b/);
    assert.match(h, /data-copy="https:\/\/levlprep\.com\/bio\//);
  }
  const teachers = readFileSync(join(root, 'bio/teachers.html'), 'utf8');
  assert.match(teachers, /practice\.html\?topic=water-hydrogen-bonding/);
  assert.match(teachers, /hello@levlprep\.com/);
  assert.match(teachers, /privacy\.html#schools/);
  assert.doesNotMatch(teachers, /pages\/teachers\.js/, 'generated, not an app');
});
