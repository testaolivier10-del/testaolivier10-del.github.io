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
import { equalEarth, slug, NAMES, DISPUTED, REGIONS, countryA as makeCountryA, metroBase } from '../build-aphug-basemaps.mjs';

const base = n => JSON.parse(readFileSync(`human-geography/figures/base/${n}.json`, 'utf8'));
const world = base('world'), countryA = base('country-a'), metro = base('metro');
const L = 'A placeholder map for the renderer tests';

test('the base maps: the world, every region, Country A; small; official short names; disputed places flagged', () => {
  const files = readdirSync('human-geography/figures/base').filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).sort();
  assert.deepEqual(files, ['country-a', 'metro', 'world', ...Object.keys(REGIONS)].sort());
  for (const f of files) {
    const b = base(f);
    assert.ok(b.width > 0 && b.height > 0 && b.features.length > 0, f);
    assert.ok(readFileSync(`human-geography/figures/base/${f}.json`).length < 90 * 1024, `${f} stays small`);
    assert.ok(b.features.every(x => x.station ? Array.isArray(x.c) && x.d == null : x.line ? /^M[\d.\s LZMCS-]+$/.test(x.d) : /^M[\d.\s LZM-]+$/.test(x.d)), `${f}: plain path data`);
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

test('the invented bases are what the script writes (no atlas needed), each area with a short code', () => {
  assert.equal(JSON.stringify(makeCountryA()), JSON.stringify(countryA));
  assert.equal(JSON.stringify(metroBase()), JSON.stringify(metro));
  for (const b of [countryA, metro]) {
    const codes = b.features.filter(f => !f.line && !f.station && !f.context).map(f => f.code);
    assert.ok(codes.every(c => /^[A-Z]{2}$/.test(c)), b.id);
    assert.equal(new Set(codes).size, codes.length, `${b.id}: codes are unique`);
  }
});

test('the metro base: a central city inside its limit, eight suburbs, a rural fringe, river, rail, stations, highways, all in the legend', () => {
  assert.ok(metro.invented);
  assert.match(M.note(metro), /invented metropolitan area/);
  const areas = metro.features.filter(f => !f.line && !f.station);
  assert.equal(areas.filter(f => !f.context && !f.limit).length, 8, 'eight suburban cities');
  assert.equal(areas.filter(f => f.limit).map(f => f.id).join(), 'central-city');
  assert.deepEqual([...new Set(metro.features.filter(f => f.line).map(f => f.line))].sort(), ['highway', 'rail', 'river']);
  assert.ok(metro.features.filter(f => f.station).length >= 4);
  const spec = { base: 'metro', render: 'choropleth', label: 'Share of commuters who take the train, by city', invented: true, legendTitle: 'Rail commuters (percent)', classes: ['Under 10', '10-25', 'Over 25'], values: { 'central-city': 2, northfield: 0, millbrook: 1 }, labels: 'codes' };
  assert.deepEqual([...M.check(spec, metro)], []);
  const svg = M.svg(spec, metro);
  assert.match(svg, /fill-rule="evenodd"/, 'the rural fringe has the built-up area cut out');
  assert.match(svg, /stroke-dasharray/, 'the rail line is dashed');
  assert.doesNotMatch(svg, /<text/);
  const lg = M.legendHtml(spec, metro);
  for (const w of ['Central city limit', 'River', 'Highway', 'Rail line', 'Rail station', '<b>CC</b> Central City', '<b>NF</b> Northfield']) assert.ok(lg.includes(w), w);
  assert.equal(M.overlay(spec, metro).filter(o => o.kind === 'label').length, 9, 'the central city and eight suburbs labeled');
  assert.ok(M.check({ ...spec, values: { rail: 1 } }, metro).some(p => /not an area/.test(p)));
  assert.ok(M.check({ base: 'metro', render: 'reference', label: L, marks: [{ at: 'station-3', text: 'X' }] }, metro).length === 0, 'marks can point at a station');
});

test('province labels on Country A: codes with a key, or names; overlapping names are refused', () => {
  const spec = { base: 'country-a', render: 'reference', label: L, labels: 'codes' };
  assert.deepEqual([...M.check(spec, countryA)], []);
  assert.equal(M.overlay(spec, countryA).filter(o => o.kind === 'label').length, 8);
  assert.match(M.legendHtml(spec, countryA), /<b>CR<\/b> Capital Region/);
  const some = { ...spec, labelOnly: ['capital', 'coast'] };
  assert.equal(M.overlay(some, countryA).map(o => o.text).join(), 'CR,SC');
  assert.doesNotMatch(M.legendHtml(some, countryA), /Northern Hills/, 'the key lists only the codes shown');
  assert.ok(M.check({ ...spec, labels: 'names' }, countryA).some(p => /would overlap at 360 px/.test(p)), 'all eight full names do not fit at 360 px');
  assert.ok(M.check({ ...spec, labels: 'codes' }, world).some(p => /no area codes/.test(p)));
});

test('a flow map: arrows from the data, wider for larger values, a legend of sample widths in the map units', () => {
  const spec = { base: 'world', render: 'flow', label: 'Invented migration flows between four countries', invented: true, legendTitle: 'Migrants a year (invented)', flows: { unit: 'thousand migrants a year', items: [{ from: 'mexico', to: 'united-states', value: 1200 }, { from: 'india', to: 'united-arab-emirates', value: 400 }, { from: 'united-states', to: 'mexico', value: 100 }] } };
  assert.deepEqual([...M.check(spec, world)], []);
  const svg = M.svg(spec, world);
  const widths = [...svg.matchAll(/stroke="#9C3A12"[^>]*stroke-width="([\d.]+)"/g)].map(m => +m[1]);
  assert.equal(widths.length, 3);
  assert.deepEqual(widths, [...widths].sort((a, b) => b - a), 'widest drawn first');
  assert.ok(widths[0] > 2.5 * widths[2] && widths[1] > widths[2], 'width grows with the value');
  assert.equal((svg.match(/Z" fill="#9C3A12"/g) || []).length, 3, 'one head per arrow');
  // Opposite flows between the same pair bend to opposite sides.
  const ctl = [...svg.matchAll(/Q([\d.]+) ([\d.]+)/g)].map(m => [+m[1], +m[2]]);
  assert.notDeepEqual(ctl[0], ctl[2]);
  const lg = M.legendHtml(spec, world);
  assert.match(lg, /arrow width shows the value/);
  assert.match(lg, /1,000</, 'thousands separators in the legend');
  const has = (sp, re) => assert.ok(M.check(sp, world).some(p => re.test(p)), `${re}: ${M.check(sp, world).join(' | ')}`);
  has({ ...spec, flows: { ...spec.flows, unit: '' } }, /names its unit/);
  has({ ...spec, flows: { unit: 'x', items: [] } }, /1 to 12 arrows/);
  has({ ...spec, flows: { unit: 'x', items: [{ from: 'atlantis', to: 'mexico', value: 1 }] } }, /flow from "atlantis"/);
  has({ ...spec, flows: { unit: 'x', items: [{ from: 'mexico', to: 'mexico', value: 1 }] } }, /from one place to another/);
  has({ ...spec, flows: { unit: 'x', items: [{ from: 'mexico', to: 'japan', value: 0 }] } }, /more than 0/);
});

test('graduated symbol legends print thousands separators', () => {
  const spec = { base: 'world', render: 'symbol', label: L, invented: true, symbols: { unit: 'people', items: [{ at: 'china', value: 20000 }], legend: [5000, 20000] } };
  const lg = M.legendHtml(spec, world);
  assert.match(lg, />20,000</);
  assert.match(lg, />5,000</);
  assert.equal(M.num(1234567.5), '1,234,567.5');
  assert.equal(M.num(999), '999');
});
