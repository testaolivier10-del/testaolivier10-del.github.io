/* ApHugMap (human-geography/assets/hug-map.js) and the base maps
   (human-geography/figures/base/, scripts/build-aphug-basemaps.mjs): every
   rendering is drawn from its data spec and refuses what it cannot draw
   legibly at 360 px; the legend and the marks are HTML, never text inside the
   picture; every real-outline map carries the border note; a disputed place
   gets no value without a reason; the base files hold the world and the
   course's regions, with the official short names. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { HugMap as M } from '../lib/aphug-mathlib.mjs';
import { equalEarth, slug, NAMES, DISPUTED, REGIONS } from '../build-aphug-basemaps.mjs';

const base = n => JSON.parse(readFileSync(`human-geography/figures/base/${n}.json`, 'utf8'));
const world = base('world'), countryA = base('country-a');
const L = 'A placeholder map for the renderer tests';

test('the base maps: the world, every region, Country A; small; official short names; disputed places flagged', () => {
  const files = readdirSync('human-geography/figures/base').filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).sort();
  assert.deepEqual(files, ['country-a', 'world', ...Object.keys(REGIONS)].sort());
  for (const f of files) {
    const b = base(f);
    assert.ok(b.width > 0 && b.height > 0 && b.features.length > 0, f);
    assert.ok(readFileSync(`human-geography/figures/base/${f}.json`).length < 90 * 1024, `${f} stays small`);
    assert.ok(b.features.every(x => /^M[\d.\s LZM-]+$/.test(x.d)), `${f}: plain path data`);
  }
  const names = new Set(world.features.map(f => f.name));
  for (const n of ['Türkiye', 'Eswatini', 'North Macedonia', 'Czechia', 'Viet Nam', "Côte d'Ivoire", 'Falkland Islands (Islas Malvinas)']) assert.ok(names.has(n), n);
  for (const n of ['Turkey', 'eSwatini', 'Macedonia', 'Antarctica']) assert.ok(!names.has(n), `${n} is not drawn`);
  for (const n of DISPUTED) assert.equal(world.features.find(f => f.name === n).disputed, true, n);
  assert.equal(world.source.includes('Natural Earth'), true);
  assert.equal(NAMES['Turkey'], 'Türkiye');
  assert.equal(slug("Côte d'Ivoire"), 'cote-d-ivoire');
  assert.ok(countryA.invented && countryA.features.length === 8);
  // Equal Earth: the equator maps to y = 0, the poles to the top and bottom.
  assert.deepEqual(equalEarth(0, 0), [0, 0]);
  assert.ok(Math.abs(equalEarth(180, 0)[0] - 2.7066) < 1e-3);
  const [x, y] = M.project(world, [0, 0]);
  assert.ok(x > 450 && x < 550 && y > 0 && y < world.height, 'the browser projection matches the build');
});

test('a choropleth: classes light to dark, no data hatched, a legend with its title, the border note', () => {
  const spec = { base: 'world', render: 'choropleth', label: L, invented: true, legendTitle: 'Invented measure (units)', classes: ['Low', 'Middle', 'High'], values: { brazil: 0, india: 1, china: 2 } };
  assert.deepEqual([...M.check(spec, world)], []);
  const svg = M.svg(spec, world);
  assert.match(svg, /^<\?xml/);
  assert.match(svg, /role="img" aria-label="A placeholder map/);
  for (const c of M.PALETTE[3]) assert.ok(svg.includes(`fill="${c}"`), c);
  assert.match(svg, /fill="url\(#nd\)"/, 'countries with no value are hatched');
  assert.doesNotMatch(svg, /<text/, 'no text inside the picture');
  const lg = M.legendHtml(spec, world);
  assert.match(lg, /<p class="hug-lg-title">Invented measure \(units\)<\/p>/);
  assert.equal((lg.match(/<li>/g) || []).length, 4, 'three classes and "No data"');
  assert.match(M.note(world), /de facto lines/);
  assert.match(M.note(countryA), /invented country/);
});

test('dot, graduated symbol, isoline and reference maps draw from their data', () => {
  const dot = M.svg({ base: 'world', render: 'dot', label: L, invented: true, dots: { each: '1 dot = 1 million', points: [[0, 0], [10, 10], [20, 20]] } }, world);
  assert.equal((dot.match(/<circle/g) || []).length, 3);
  const symSpec = { base: 'world', render: 'symbol', label: L, invented: true, symbols: { unit: 'tonnes', items: [{ at: 'china', value: 40 }, { at: 'brazil', value: 10 }] } };
  const sym = M.svg(symSpec, world);
  const r = [...sym.matchAll(/<circle[^>]* r="([\d.]+)"/g)].map(m => +m[1]);
  assert.ok(Math.abs(r[0] / r[1] - 2) < 0.05, 'circle AREA is proportional to the value: 40 is twice the radius of 10');
  assert.match(M.legendHtml(symSpec, world), /circle area shows the value/);
  const iso = { base: 'world', render: 'isoline', label: L, invented: true, isolines: { unit: 'days', lines: [{ value: 10, points: [[-100, 50], [0, 50], [100, 50]] }, { value: 20, points: [[-100, 20], [0, 20], [100, 20]] }] } };
  assert.equal((M.svg(iso, world).match(/<polyline/g) || []).length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(M.overlay(iso, world).map(o => [o.kind, o.text]))), [['iso', '10'], ['iso', '20']], 'each line labeled with its value, in HTML');
  const ref = { base: 'world', render: 'reference', label: L, focus: ['japan'], marks: [{ at: 'japan', text: 'A' }] };
  assert.deepEqual([...M.check(ref, world)], []);
  assert.match(M.svg(ref, world), /fill="#1D6B8C"/, 'the focus country in the accent');
  const o = M.overlay(ref, world)[0];
  assert.ok(o.x > 80 && o.x < 95 && o.y > 20 && o.y < 45, `Japan's mark at ${o.x}%, ${o.y}%`);
});

test('the check refuses what cannot be drawn or read: no label, no source year, a disputed value, crowded or long marks, bad classes', () => {
  const ok = { base: 'world', render: 'choropleth', label: L, invented: true, legendTitle: 'Measure', classes: ['A', 'B'], values: { brazil: 1 } };
  const has = (spec, re) => assert.ok(M.check(spec, world).some(p => re.test(p)), `${re}: ${M.check(spec, world).join(' | ')}`);
  has({ ...ok, label: 'short' }, /label of 20\+ characters/);
  has({ ...ok, invented: undefined }, /dated source line/);
  has({ ...ok, invented: undefined, source: 'UN World Population Prospects' }, /has no year/);
  assert.deepEqual([...M.check({ ...ok, invented: undefined, source: 'UN WPP 2024 (2024 estimates)' }, world)], []);
  has({ ...ok, values: { taiwan: 1 } }, /Taiwan is disputed/);
  assert.deepEqual([...M.check({ ...ok, values: { taiwan: 1 }, disputedOk: 'the source reports it separately' }, world)], []);
  has({ ...ok, values: { brazil: 5 } }, /has class 5/);
  has({ ...ok, classes: ['only one'] }, /2 to 6 classes/);
  has({ ...ok, values: { atlantis: 1 } }, /no feature "atlantis"/);
  has({ ...ok, render: 'pie' }, /render must be one of/);
  const marks = { base: 'world', render: 'reference', label: L };
  has({ ...marks, marks: [{ at: 'germany', text: 'A' }, { at: 'poland', text: 'B' }] }, /would overlap at 360 px/);
  has({ ...marks, marks: [{ at: 'brazil', text: 'Brazil' }] }, /longer than 3 characters/);
  assert.deepEqual([...M.check({ ...marks, marks: [{ at: 'brazil', text: 'A' }, { at: 'japan', text: 'B' }] }, world)], []);
  has({ base: 'world', render: 'isoline', label: L, invented: true, isolines: { unit: 'x', lines: [{ value: 1, points: [[0, 0]] }] } }, /at least two lines/);
  assert.ok(M.check({ base: 'nowhere', render: 'reference', label: L }, undefined).some(p => /unknown base/.test(p)));
});
