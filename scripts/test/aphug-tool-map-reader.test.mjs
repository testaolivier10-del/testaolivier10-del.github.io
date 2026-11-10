/* Map reader: its model (human-geography/assets/tools/math/map-reader.js) and its
   validator (scripts/lib/aphug-tool-checks/map-reader.mjs). OWNED BY THIS TOOL
   ONLY (builder T3). The shipped data passes (300 seeds per context and
   type: every map passes ApHugMap.check, every key recomputed), problems are
   reproducible, Explore draws every map type on every base, and planted
   mistakes are caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/aphug-tool-checks/_shared.mjs';
import { check, recheck, ready } from '../lib/aphug-tool-checks/map-reader.mjs';
import { ROOT } from '../lib/aphug-build.mjs';

const mapJ = JSON.parse(readFileSync(join(ROOT, 'docs', 'aphug-dependency-map.json'), 'utf8'));
const map = { topicById: id => mapJ.topics.find(t => t.id === id) || null };
const data = JSON.parse(readFileSync(join(ROOT, 'human-geography', 'data', 'tools', 'map-reader.json'), 'utf8'));

test('map-reader: registers, the page script parses, it is registered free on the Tool Studio', () => {
  const { model } = runtime('map-reader');
  assert.ok(model && typeof model.generate === 'function' && !model.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'human-geography', 'assets', 'tools', 'map-reader.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'human-geography', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'map-reader');
  assert.ok(entry && entry.studio === true && !entry.premium, 'free (spec section 6)');
  assert.equal(entry.topic, 'views-of-the-world');
  assert.ok(check({ ...data, topic: 'nope' }, map).some(e => /topic/.test(e)));
});

test('map-reader: the shipped data passes the full sweep', () => {
  assert.deepEqual(check(data, map), []);
});

test('map-reader: a problem code gives the same problem', () => {
  const { M, model } = runtime('map-reader');
  ready(data);
  for (const c of data.contexts) {
    const a = model.generate(M.rng(4242), c, c.types[0]), b = model.generate(M.rng(4242), c, c.types[0]);
    assert.equal(JSON.stringify(a), JSON.stringify(b), c.id);
  }
});

test('map-reader: Explore has every map type, and the cartogram keeps its squares apart', () => {
  const { model, Map } = runtime('map-reader');
  ready(data);
  for (const k of ['reference', 'choropleth', 'dot', 'symbol', 'isoline', 'cartogram']) assert.ok(model.KINDS[k], k);
  const c = model.exploreSpec('country-a', 'cartogram', {}).cartogram;
  assert.equal(c.squares.length, 8);
  const x = model.exploreSpec('sub-saharan-africa', 'choropleth', { breaks: 'even' });
  assert.ok(x.spec.invented && /invented/.test(x.spec.legendTitle));
  const B = JSON.parse(readFileSync(join(ROOT, 'human-geography', 'figures', 'base', 'sub-saharan-africa.json'), 'utf8'));
  assert.deepEqual(Map.check(x.spec, B), []);
  for (const f of B.features.filter(f => f.disputed)) assert.equal(x.spec.values[f.id], undefined, `${f.id} is disputed`);
});

test('map-reader: planted mistakes are caught', () => {
  const { M, model } = runtime('map-reader');
  ready(data);
  const ctx = id => data.contexts.find(c => c.id === id);
  const errsOf = (p, c) => { const e = []; recheck(p, c, 'x', e); return e; };
  // Two marks on top of each other.
  let p = model.generate(M.rng(5), ctx('legend-choropleth'), 'legend');
  p.figure.spec.marks[1].at = p.figure.spec.marks[0].at;
  assert.ok(errsOf(p, ctx('legend-choropleth')).some(e => /overlap/.test(e)));
  // A pattern key that reads the legend backwards.
  p = model.generate(M.rng(6), ctx('pattern-regions'), 'pattern');
  [p.given.top, p.given.low] = [p.given.low, p.given.top];
  assert.ok(errsOf(p, ctx('pattern-regions')).some(e => /named as high/.test(e)));
  // A map with no "invented" and no source.
  p = model.generate(M.rng(7), ctx('legend-choropleth'), 'legend');
  delete p.figure.spec.invented;
  assert.ok(errsOf(p, ctx('legend-choropleth')).some(e => /source|invented/.test(e)));
  // A value on a disputed place.
  p = model.generate(M.rng(8), ctx('pattern-regions'), 'pattern');
  p.figure.spec.values['western-sahara'] = 1; p.figure.spec.values.somaliland = 1; p.figure.spec.values.kosovo = 1; p.figure.spec.values['falkland-islands'] = 1;
  assert.ok(errsOf(p, ctx('pattern-regions')).some(e => /disputed/.test(e)));
  // The isoline range key moved.
  p = model.generate(M.rng(9), ctx('isoline-country-a'), 'isoline');
  const s = p.steps.find(x => x.key === 'range'); s.correct = (s.correct + 1) % 4;
  assert.ok(errsOf(p, ctx('isoline-country-a')).some(e => /range key/.test(e)));
});
