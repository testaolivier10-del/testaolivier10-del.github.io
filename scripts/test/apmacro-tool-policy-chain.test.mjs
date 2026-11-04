/* Policy Chain Builder: its model (macroeconomics/assets/tools/math/policy-chain.js)
   and its validator (scripts/lib/apmacro-tool-checks/policy-chain.mjs). OWNED BY
   THIS TOOL ONLY (builder T2). The shipped data passes; a seed gives the same
   problem twice; every chain names every link in order with its graph agreeing;
   the builder and the writing hints work; planted mistakes are caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmacro-tool-checks/_shared.mjs';
import { check, recheck, chains } from '../lib/apmacro-tool-checks/policy-chain.mjs';
import { ROOT } from '../lib/apmacro-build.mjs';

const MAPJ = JSON.parse(readFileSync(join(ROOT, 'docs', 'apmacro-dependency-map.json'), 'utf8'));
const map = { topicById: id => MAPJ.topics.find(t => t.id === id) || null };
const data = JSON.parse(readFileSync(join(ROOT, 'macroeconomics', 'data', 'tools', 'policy-chain.json'), 'utf8'));
const { M, model, Grade } = runtime('policy-chain');
const ctx = id => data.contexts.find(c => c.id === id);

test('policy-chain: registered, the page script parses, pages.json entry', () => {
  assert.ok(model && !model.stub && typeof model.generate === 'function');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'macroeconomics', 'assets', 'tools', 'policy-chain.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'macroeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'policy-chain');
  assert.ok(entry && entry.studio === true && entry.premium === 'tools');
  assert.equal(entry.topic, 'policy-short-run');
  const fx = JSON.parse(readFileSync(join(ROOT, 'scripts', 'test', 'fixtures', 'apmacro-data', 'pages.json'), 'utf8')).tools.find(t => t.slug === 'policy-chain');
  assert.deepEqual(fx, entry, 'the fixture copy matches');
});

test('policy-chain: the shipped data passes the validator (300 problems per context)', () => {
  assert.deepEqual(check(data, map), []);
});

test('policy-chain: a seed gives the same problem twice', () => {
  for (const c of data.contexts) {
    const a = model.generate(M.rng(9001), c), b = model.generate(M.rng(9001), c);
    assert.deepEqual(a, b, c.id);
  }
});

test('policy-chain: every link in order, the way the readers score it', () => {
  const errs = []; chains(model, errs); assert.deepEqual(errs, []);
  const mon = model.chain('monetary', 'ample', -1).links.map(l => l.say);
  assert.match(mon[0], /raises the IORB rate/);
  assert.match(mon[3], /Investment .* fall/);
  assert.match(mon[4], /AD shifts left/);
  const sa = model.chain('selfadjust', 'gap', -1).links.map(l => l.id);
  assert.deepEqual([...sa], ['gap', 'wages', 'sras', 'back']);
  const open = model.chain('open', 'rates', 1).links;
  assert.match(open[3].say, /appreciates/); assert.match(open[4].say, /net exports fall/); assert.match(open[5].say, /AD shifts left/);
});

test('policy-chain: each step offers the skipped link and the wrong way, each explained', () => {
  for (let i = 1; i <= 50; i++) {
    const p = model.generate(M.rng(i), ctx('monetary'));
    const s = p.steps[0];
    assert.ok(s.why.some(x => /^Not yet/.test(x)), 'a skipped-link option');
    assert.ok(s.why.some(x => /wrong direction/.test(x)), 'a wrong-way option');
    assert.equal(new Set(s.options).size, s.options.length);
  }
});

test('policy-chain: the sentence builder (ApMacroGrade.specific) and the writing hints (ApMacroGrade.flags)', () => {
  const ch = model.chain('fiscal', 'tax', 1), b = model.builder(ch, M.rng(3)), picks = {};
  for (const k of Object.keys(b.slots)) picks[k] = b.slots[k].correct;
  assert.equal(Grade.specific(b, picks).correct, true);
  const k0 = Object.keys(b.slots)[0];
  const r = Grade.specific(b, { ...picks, [k0]: (b.slots[k0].correct + 1) % b.slots[k0].options.length });
  assert.equal(r.correct, false); assert.equal(r.notes.length, 1);
  const W = model.write(ch);
  const vague = Grade.flags(W, 'Taxes affect the economy.');
  assert.ok(vague.some(f => f.rule === 'directional' && !f.ok));
  assert.ok(vague.some(f => f.rule === 'mechanism' && !f.ok));
  const good = 'Taxes are cut, so disposable income rises, which leads to more consumption; AD increases and real output and the price level rise.';
  assert.ok(Grade.flags(W, good).every(f => f.ok));
  assert.deepEqual([...model.covered(ch, good)], [true, true, true, true]);
  assert.deepEqual([...model.covered(ch, 'Taxes are cut so AD rises')], [true, false, true, false]);
});

test('policy-chain: the validator catches planted mistakes', () => {
  const bad = (mutate, c) => { const p = model.generate(M.rng(12), ctx(c)); mutate(p); const errs = []; recheck(p, ctx(c), 'x', errs); return errs; };
  // A skipped link: the step after next keyed as next.
  assert.ok(bad(p => { p.steps[0].options[p.steps[0].correct] = p.steps[1].options[p.steps[1].correct]; }, 'monetary').length);
  // A link keyed the wrong way.
  assert.ok(bad(p => { const s = p.steps[p.steps.length - 2]; s.options[s.correct] = s.options[s.correct].replace(/right/, 'left').replace(/left(?=.*left)/, 'right'); s.options[s.correct] = /right/.test(s.options[s.correct]) ? s.options[s.correct].replace('right', 'left') : s.options[s.correct].replace('left', 'right'); }, 'fiscal').length);
  // Self-adjustment through AD.
  assert.ok(bad(p => { p.steps[1].options[p.steps[1].correct] = 'AD shifts right.'; }, 'selfadjust').length);
  // A step dropped (a skipped link).
  assert.ok(bad(p => { p.steps.splice(1, 1); }, 'crowding').length);
  assert.ok(check({ ...data, slug: 'nope' }, map).some(e => /slug/.test(e)));
});
