/* The page half of the AI grader (assets/course/frq-grader.js): off until
   launch, shared by all six AP® courses, beside the self-score and never in
   place of it, escaping everything the model wrote. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBrowser } from './harness.mjs';

const SRC = readFileSync('assets/course/frq-grader.js', 'utf8');
const COURSES = { bio: ['apbio', 'bio'], chem: ['apchem', 'chem'], physics: ['apphys', 'phys'], calculus: ['apcalc', 'calc'], statistics: ['apstat', 'stat'], 'environmental-science': ['apenv', 'env'] };

test('the student-facing flag ships OFF (docs/frq-grader.md, launch rule)', () => {
  assert.match(SRC, /^\s*var ENABLED = false;/m);
});

test('off: mount() renders nothing; the owner\'s try switch turns it on for his browser only', () => {
  const b = createBrowser();
  b.load('assets/course/frq-grader.js');
  const G = b.window.LevlFrqGrader;
  assert.equal(G.enabled(), false);
  assert.equal(G.mount({}, { f: { parts: [] } }), false);
  b.localStorage.setItem('levlprep_frq_grader_try', '1');
  assert.equal(G.enabled(), true);
});

test('it calls only the site\'s Worker, with the session token, at /frq/grade', () => {
  assert.match(SRC, /var ENDPOINT = 'https:\/\/api\.levlprep\.com'; \/\/ site-config:API_URL/);
  assert.match(SRC, /fetch\(ENDPOINT \+ '\/frq\/grade'/);
  assert.match(SRC, /Authorization: 'Bearer ' \+ t/);
  // It sends the course, the question id and the answers: never a rubric or a score.
  assert.match(SRC, /post\(\{ course: course, id: f\.id, answers: answers \}\)/);
});

test('everything the model wrote is escaped before it reaches the page', () => {
  const html = SRC.slice(SRC.indexOf('function resultHtml'), SRC.indexOf('function mount'));
  for (const field of ['pt.quote', 'pt.reason', 'g.summary', 'p.label']) {
    assert.ok(html.includes(`esc(${field})`), `${field} is escaped`);
    assert.ok(!new RegExp(`\\+ ${field.replace('.', '\\.')} \\+`).test(html), `${field} is never inserted raw`);
  }
});

test('labelled as an estimate, the backup named, the self-score kept and the student free to disagree', () => {
  assert.match(SRC, /AI estimate: /);
  assert.match(SRC, /It is an estimate, not an official score\./);
  assert.match(SRC, /Graded by the backup grader, which is less accurate/);
  assert.match(SRC, /Copy these marks to my self-score/);
  assert.match(SRC, /Disagree with a mark\?/);
  assert.match(SRC, /The score you save is your own\./);
  // Every failure the Worker reports opens the rubric (selfScore), never a dead end.
  assert.ok(SRC.includes("selfScore('The AI grader isn’t available right now"));
  // Phone: 44px targets, full-width button on small screens, never printed.
  assert.match(SRC, /min-height:44px/);
  assert.match(SRC, /@media \(max-width:480px\)/);
  assert.match(SRC, /@media print\{\.fg-box\{display:none;\}\}/);
});

for (const [dir, [key, px]] of Object.entries(COURSES)) {
  test(`${dir}: the FRQ page mounts the shared grader beside the self-score`, () => {
    const s = readFileSync(`${dir}/assets/pages/frq.js`, 'utf8');
    assert.match(s, /s\.src = BASE \+ '\.\.\/assets\/course\/frq-grader\.js';/);
    assert.ok(s.includes(`'<div class="${px}-fq-ai"></div>'`), 'a slot under the self-score button');
    assert.ok(s.includes(`course: '${key}', f: f,`), `course key ${key}`);
    assert.ok(s.includes(`app.querySelectorAll('.${px}-fq-answer')`), 'reads the textareas');
    assert.match(s, /reveal: function\(\)\{ if\(box\.hidden\) revealBtn\.click\(\); return box; \}/);
    // The self-score is untouched: its reveal button and save remain.
    assert.match(s, /data-act="reveal">Show the rubric and score yourself</);
    assert.match(s, /data-act="save">Save my score</);
    // The checkboxes the grader fills are the kit's own.
    const kit = readFileSync(`${dir}/assets/pages/frq-kit.js`, 'utf8');
    assert.ok(kit.includes(`data-part="' + i + '" data-k="' + k + '"`));
  });
}
