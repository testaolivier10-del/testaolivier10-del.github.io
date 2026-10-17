/* AP® Biology justification trainer and free unit practice tests
   (scripts/lib/apbio-exams.mjs, apbio-entry.mjs; docs/apbio-spec.md decision 29). */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { loadMap, loadCourse, trademarkProblems } from '../lib/apbio-build.mjs';
import { loadJustify, checkJustify, FREE_JUSTIFY, JUSTIFY_SKILLS } from '../lib/apbio-exams.mjs';
import { orderingProblems } from '../check-apbio-content.mjs';

const map = loadMap();
const C = loadCourse(undefined, { map });

test('every prompt passes the checker, four per unit, every skill used', () => {
  const ps = loadJustify(C.data, map);
  assert.deepEqual(checkJustify(ps, { map, trademarkProblems, orderingProblems }), []);
  for (const u of map.chapters.filter(c => c.part === 'course')) assert.ok(ps.filter(p => p.unit === u.id).length >= 4, u.id);
  for (const k of Object.keys(JUSTIFY_SKILLS)) assert.ok(ps.some(p => p.skill === k), k);
});

test('the checker refuses purpose wording and a missing task verb', () => {
  const t = map.topics.find(x => x.chapter === 'unit-3');
  const p = { id: 'u3-x-y', unit: 'unit-3', topic: t.id, practice: '6.E', skill: 'mechanism', title: 'A test prompt here', prompt: 'Explain why the enzyme slows down at a low pH value.', checklist: ['A checklist line that is long enough', 'Another checklist line long enough'],
    earns: { answer: 'The enzyme wants to keep its shape, so it slows down at low pH values in the test.', why: 'A why that is long enough to pass the length rule here.' }, misses: { answer: 'It slows.', why: 'A why that is long enough to pass the length rule here.' } };
  const e = checkJustify([p], { map });
  assert.ok(e.some(x => /task verb/.test(x)));
  assert.ok(e.some(x => /purpose/.test(x)));
});

test('served data: published prompts only, the first few free; unit tests reuse bank items', () => {
  const j = JSON.parse(readFileSync('bio/assets/justify.json', 'utf8'));
  assert.equal(j.prompts.filter(p => p.free).length, Math.min(FREE_JUSTIFY, j.prompts.length));
  assert.ok(j.prompts.every(p => C.published.has(p.unit)));
  const bank = new Set(Object.values(C.questions).flatMap(q => q.items.map(i => i.id)));
  for (const u of map.chapters.filter(c => c.part === 'course' && C.published.has(c.id))) {
    const html = readFileSync(`bio/unit-tests/${u.id}.html`, 'utf8');
    const data = JSON.parse(html.match(/<script type="application\/json" id="bio-page-data">([\s\S]*?)<\/script>/)[1]);
    assert.equal(data.check.length, 12, u.id);
    for (const q of data.check) assert.ok(bank.has(q.id), q.id);
    assert.doesNotMatch(html, /noindex/);
  }
  assert.ok(existsSync('bio/justify.html'));
});
