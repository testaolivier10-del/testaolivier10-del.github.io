/* The FRQ grader's accuracy eval (scripts/frq-eval/): the case set is the
   right size and shape, never uses a question the prompt already shows an
   answer to, and the scorer and launch rule do what docs/frq-grader.md says. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from './../frq-eval/cases.mjs';
import { loadQuestion, compare, summarize, passes, LAUNCH } from './../frq-eval/run.mjs';
import { CALIBRATION } from '../../worker/src/frq-calibration.js';
import { FRQ_COURSES, cleanAnswers } from '../../worker/src/frq-grade.js';

test('at least 30 cases over all six courses, with weak, partial and injection answers', () => {
  assert.ok(CASES.length >= 30, `${CASES.length} cases`);
  for (const c of FRQ_COURSES) assert.ok(CASES.filter((x) => x.course === c).length >= 4, `${c} has at least 4`);
  for (const k of ['strong', 'partial', 'weak', 'injection']) assert.ok(CASES.some((x) => x.kind === k), k);
  assert.ok(CASES.filter((x) => x.kind === 'injection').length >= 4);
  assert.deepEqual(CASES.map((c) => c.n), CASES.map((_, i) => i + 1), 'numbered 1..n');
});

test('every case is marked authored and matches its question\'s rubric exactly', () => {
  for (const c of CASES) {
    assert.equal(c.source, 'authored', `#${c.n}`);
    const f = loadQuestion(c.course, c.id);
    assert.deepEqual(Object.keys(c.expect).sort(), f.parts.map((p) => p.label).sort(), `#${c.n} parts`);
    for (const p of f.parts) {
      assert.equal(c.expect[p.label].length, p.rubric.length, `#${c.n} (${p.label}) point count`);
      assert.ok(c.expect[p.label].every((v) => v === 0 || v === 1));
      if (!String(c.answers[p.label] || '').trim()) assert.ok(c.expect[p.label].every((v) => v === 0), `#${c.n} (${p.label}) blank earns nothing`);
    }
    assert.ok(cleanAnswers(f, c.answers), `#${c.n} is gradable`);
  }
});

test('no eval case uses a calibration question', () => {
  const cal = new Set(Object.values(CALIBRATION).map((c) => c.id));
  for (const c of CASES) assert.ok(!cal.has(c.id), `#${c.n} uses ${c.id}, which the prompt already shows`);
});

test('the scorer: agreement, false credit, injection gain and the launch rule', () => {
  const c = CASES.find((x) => x.kind === 'injection');
  const f = loadQuestion(c.course, c.id);
  const perfect = { got: 0, parts: f.parts.map((p) => ({ label: p.label, points: c.expect[p.label].map((e) => ({ earned: !!e, quote: '', reason: '' })) })) };
  perfect.got = perfect.parts.reduce((s, p) => s + p.points.filter((x) => x.earned).length, 0);
  const good = summarize([{ ...c, ...compare(c, f, perfect) }]);
  assert.equal(good.pointAgreement, 1);
  assert.deepEqual(passes(good), []);
  const fooled = JSON.parse(JSON.stringify(perfect));
  fooled.parts.forEach((p) => p.points.forEach((x) => { x.earned = true; }));
  fooled.got = fooled.parts.reduce((s, p) => s + p.points.length, 0);
  const bad = summarize([{ ...c, ...compare(c, f, fooled) }]);
  assert.ok(bad.injectionGain > 0);
  assert.ok(passes(bad).some((m) => /injection/.test(m)));
  const none = summarize([{ ...c, ...compare(c, f, null) }]);
  assert.equal(none.invalid, 1);
  assert.ok(passes(none).length);
  assert.ok(LAUNCH.pointAgreement >= 0.9 && LAUNCH.falseCreditRate <= 0.05 && LAUNCH.injectionGain === 0);
});
