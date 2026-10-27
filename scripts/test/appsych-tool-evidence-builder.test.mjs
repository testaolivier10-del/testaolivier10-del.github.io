/* Evidence Builder: its model (psychology/assets/tools/math/evidence-builder.js) and
   its validator (scripts/lib/appsych-tool-checks/evidence-builder.mjs). OWNED BY
   THIS TOOL ONLY (builder T1). The frame and registration; the shipped data
   passing (300 drills per context and type, every key recomputed); the same
   seed giving the same problem; planted mistakes caught; and the scorer
   against the EBQ rubric: every slip the 2025 Chief Reader Reports name
   costs exactly the point the scoring guidelines say. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/appsych-tool-checks/_shared.mjs';
import { check, recheck, TYPES } from '../lib/appsych-tool-checks/evidence-builder.mjs';
import { ROOT, loadMap } from '../lib/appsych-build.mjs';

const { M, Stats, Grade, model: E } = runtime('evidence-builder');
const data = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'tools', 'evidence-builder.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);

test('evidence-builder: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  assert.ok(E && typeof E.generate === 'function' && !E.stub, 'ApPsychMath.evidenceBuilder is the real model');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'psychology', 'assets', 'tools', 'evidence-builder.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'evidence-builder');
  assert.ok(entry && entry.studio === true);
  assert.equal(entry.topic, 'research-methods');
  assert.equal(entry.premium, 'tools');
  const map = { topicById: id => id === 'research-methods' ? { id } : null, concepts: [] };
  assert.ok(check({ slug: 'nope', kind: 'simulator', topic: 'research-methods', intro: 'x', howItWorks: 'x', contexts: [] }, map).some(e => /slug/.test(e)));
});

test('evidence-builder: the shipped data passes (300 drills per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('evidence-builder: the same seed gives the same problem, for every type', () => {
  for (const c of data.contexts) for (const t of TYPES) {
    const a = E.generate(M.rng(4242), c, t), b = E.generate(M.rng(4242), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
  }
});

test('evidence-builder: the scorer follows the EBQ rubric, slip by slip', () => {
  const c = ctx('support-stress'), nums = E.sources(c, M.rng(3));
  const full = { claim: 'reduce', b: { src: 0, what: 'result', cite: true }, bc: 'sympathetic', c: { src: 2, what: 'result', cite: true }, cc: 'problem-focused' };
  const s7 = E.score(c, nums, full);
  assert.equal(s7.total, 7, JSON.stringify(s7.notes));
  const at = (b, part) => E.score(c, nums, { ...full, ...b })[part];
  assert.equal(at({ claim: 'topic' }, 'A'), 0, 'a topic sentence is not a claim');
  assert.equal(at({ claim: 'question' }, 'A'), 0, 'a question is not a claim');
  assert.equal(at({ claim: 'always' }, 'A'), 0, 'an oversimplified claim');
  assert.equal(at({ b: { src: 0, what: 'result', cite: false } }, 'Bi'), 0, 'uncited evidence loses B(i)');
  assert.equal(at({ b: { src: 0, what: 'result', cite: false } }, 'Bii'), 2, 'uncited evidence can still earn reasoning (scoring guidelines)');
  assert.equal(at({ b: { src: 0, what: 'detail', cite: true } }, 'Bi'), 0, 'a method detail is not evidence');
  assert.equal(at({ claim: 'body', c: { src: 1, what: 'result', cite: true } }, 'Ci'), 0, 'a source that does not support the claim');
  assert.equal(at({ c: { src: 0, what: 'result', cite: true } }, 'Ci'), 0, 'the B(i) source reused');
  assert.equal(at({ bc: 'r-stress' }, 'Bii'), 1, 'the prompt\'s own topic is restricted');
  assert.equal(at({ bc: 'r-assign' }, 'Bii'), 1, 'a research term is restricted');
  assert.equal(at({ bc: E.NONE }, 'Bii'), 1, 'reasoning with no concept is capped at 1');
  assert.equal(at({ bc: 'problem-focused' }, 'Bii'), 1, 'a concept that does not explain this source');
  assert.equal(at({ cc: 'sympathetic', c: { src: 0, what: 'result', cite: true } }, 'Cii'), 1, 'same source and concept as B');
  assert.equal(at({ bc: 'emotion-focused', b: { src: 2, what: 'result', cite: true }, cc: 'emotion-focused', c: { src: 1, what: 'result', cite: true } }, 'Cii'), 1, 'the B(ii) concept reused caps C(ii) at 1');
  for (const k of ['A', 'Bi', 'Bii', 'Ci', 'Cii']) assert.ok(E.score(c, nums, { ...full, claim: 'topic' }).notes[k], `a note for ${k}`);
});

test('evidence-builder: every number from ApPsychStats, and the written hints are psy-grade flags', () => {
  for (const c of data.contexts) for (let s = 1; s < 30; s++) {
    const nums = E.sources(c, M.rng(s));
    nums.forEach((nm, k) => {
      const src = c.sources[k];
      if (nm.kind === 'r') { assert.equal(nm.r, Stats.evaluate({ fn: 'r', args: [nm.points] })); assert.equal(Math.sign(nm.r), src.direction); }
      else { assert.ok(nm.means[src.hi] > nm.means[src.lo]); assert.equal(nm.diff, Stats.evaluate({ fn: 'sub', args: [nm.means[src.hi], nm.means[src.lo]] })); assert.ok(E.result(c, nums, k).includes(M.fixed(nm.means[src.hi], nm.dec))); }
    });
  }
  const c = ctx('rewards-motivation'), W = { write: { cite: true, concept: c.concepts.map(x => x.name.replace(/^the /, '')), restricted: c.restricted.map(x => x.name.replace(/^the /, '')) } };
  const f = t => Object.fromEntries(Grade.flags(W, t).map(x => [x.rule, x.ok]));
  assert.equal(f('According to Source 1, children drew less. This is the overjustification effect.').cite, true);
  assert.equal(f('Children drew less. This shows motivation.').restricted, false);
  assert.equal(f('Children drew less. This shows intrinsic motivation.').concept, true);
});

test('evidence-builder: planted mistakes are caught', () => {
  const run = (id, type, seed, plant, re) => {
    const c = ctx(id), p = E.generate(M.rng(seed), c, type);
    plant(p, c); const e = []; recheck(p, c, 'planted', e);
    assert.ok(e.some(x => re.test(x)), `${id} ${type}: ${e.join(' | ') || 'nothing caught'}`);
  };
  run('support-stress', 'full', 1, p => { p.given.c = p.given.b; }, /different sources/);
  run('sleep-thinking', 'full', 2, p => { p.given.cc = p.given.bc; }, /different concepts/);
  run('rewards-motivation', 'full', 3, p => { const s = p.steps.find(x => x.key === 'evB'); s.options[s.correct] = s.options[s.correct].replace(/^According to Source \d, /, ''); }, /B\(i\) key/);
  run('rewards-motivation', 'reasoning', 4, (p, c) => { const s = p.steps.find(x => x.key === 'conB'); s.options[s.correct] = 'Motivation'; }, /conB key/);
  run('support-stress', 'evidence', 5, p => { const s = p.steps.find(x => x.key === 'read'); if (s) s.cell.answer += 1; else p.given.claim = 'topic'; }, /read key|claim is defensible/);
});
