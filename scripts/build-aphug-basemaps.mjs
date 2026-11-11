/* Base maps for AP® Human Geography (docs/aphug-architecture.md, "Maps").

   Reads Natural Earth's 1:110m Admin 0 countries (public domain) as the
   world-atlas npm package ships them (TopoJSON, version 2.0.2) and writes one
   small JSON file of SVG paths per base map under human-geography/figures/base/:
   the world and the world regions the course uses (REGIONS below; the list is
   ours, needs-author `regions`), projected with Equal Earth (an equal-area
   projection, so a choropleth's areas compare fairly), simplified at build
   time (Douglas-Peucker in pixels) and rounded to 0.1 px. Also writes
   `country-a.json`, an invented country with eight provinces for practice at
   the national and local scale (spec section 4: invented data on real or
   plainly invented outlines), and `metro.json`, an invented metropolitan area
   (a central city inside its city limit, eight suburban cities, the rural
   edge, a river, a rail line with stations, a ring highway and a radial
   highway) for Unit 6 maps at the local scale. Both invented bases give each
   area a short `code` for map labels (spec `labels: 'codes'`). Antarctica
   and the French Southern and Antarctic Lands are left off.

   countryA() and metroBase() need no atlas: `--invented` rewrites only those
   two files (or checks them with --check).

   The files are committed; nothing fetches the atlas at page or build time.
   To rebuild them (only when this script changes):

     cd /tmp && npm pack world-atlas@2.0.2 && tar xzf world-atlas-2.0.2.tgz
     node scripts/build-aphug-basemaps.mjs --atlas /tmp/package/countries-110m.json
     node scripts/build-aphug-basemaps.mjs --atlas <same> --check    exit 1 if stale

   Names: Natural Earth's short names, with the official short forms the
   accuracy rules ask for (NAMES; docs/aphug-research/accuracy-risks.md
   section 4). Borders are Natural Earth's de facto lines; the features whose
   status is disputed carry `disputed: true` so the content check and the
   border note can treat them (ApHugMap, hug-map.js). */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { countryA } from './aphug-country-a.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'human-geography', 'figures', 'base');
const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const INVENTED_ONLY = args.includes('--invented');
const ATLAS = args.includes('--atlas') ? args[args.indexOf('--atlas') + 1] : join(ROOT, 'node_modules', 'world-atlas', 'countries-110m.json');
const SOURCE = 'Natural Earth 1:110m Admin 0 countries, version 4.1.0 (public domain), via the world-atlas package 2.0.2';

export const NAMES = {
  'United States of America': 'United States', 'Dem. Rep. Congo': 'Democratic Republic of the Congo',
  'Dominican Rep.': 'Dominican Republic', 'Central African Rep.': 'Central African Republic',
  'Eq. Guinea': 'Equatorial Guinea', eSwatini: 'Eswatini', Macedonia: 'North Macedonia', Turkey: 'Türkiye',
  'Bosnia and Herz.': 'Bosnia and Herzegovina', 'Solomon Is.': 'Solomon Islands',
  'Falkland Is.': 'Falkland Islands (Islas Malvinas)', 'W. Sahara': 'Western Sahara', 'N. Cyprus': 'Northern Cyprus',
  'S. Sudan': 'South Sudan', Vietnam: 'Viet Nam',
};
// Natural Earth draws these as their own polygons (de facto control); their
// status is disputed or recognized by only some states (accuracy-risks.md section 4).
export const DISPUTED = ['Western Sahara', 'Northern Cyprus', 'Somaliland', 'Kosovo', 'Taiwan', 'Palestine', 'Falkland Islands (Islas Malvinas)'];
const DROP = ['Antarctica', 'Fr. S. Antarctic Lands'];

// The world regions (ours, [verify] against the CED's regions figure: needs-author `regions`).
export const REGIONS = {
  'north-america': { title: 'North America', members: ['Canada', 'United States', 'Greenland'] },
  'latin-america': { title: 'Latin America and the Caribbean', members: ['Mexico', 'Guatemala', 'Belize', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama', 'Cuba', 'Haiti', 'Dominican Republic', 'Jamaica', 'Puerto Rico', 'Bahamas', 'Trinidad and Tobago', 'Colombia', 'Venezuela', 'Guyana', 'Suriname', 'Ecuador', 'Peru', 'Brazil', 'Bolivia', 'Paraguay', 'Chile', 'Argentina', 'Uruguay', 'Falkland Islands (Islas Malvinas)'] },
  europe: { title: 'Europe', members: ['Iceland', 'Norway', 'Sweden', 'Finland', 'Denmark', 'United Kingdom', 'Ireland', 'France', 'Spain', 'Portugal', 'Belgium', 'Netherlands', 'Luxembourg', 'Germany', 'Switzerland', 'Austria', 'Italy', 'Poland', 'Czechia', 'Slovakia', 'Hungary', 'Slovenia', 'Croatia', 'Bosnia and Herzegovina', 'Serbia', 'Montenegro', 'Kosovo', 'Albania', 'North Macedonia', 'Greece', 'Bulgaria', 'Romania', 'Moldova', 'Ukraine', 'Belarus', 'Lithuania', 'Latvia', 'Estonia'] },
  'russia-central-asia': { title: 'Russia and Central Asia', members: ['Russia', 'Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan'] },
  'north-africa-sw-asia': { title: 'North Africa and Southwest Asia', members: ['Morocco', 'Western Sahara', 'Algeria', 'Tunisia', 'Libya', 'Egypt', 'Sudan', 'Israel', 'Palestine', 'Lebanon', 'Jordan', 'Syria', 'Iraq', 'Iran', 'Türkiye', 'Cyprus', 'Northern Cyprus', 'Georgia', 'Armenia', 'Azerbaijan', 'Saudi Arabia', 'Yemen', 'Oman', 'United Arab Emirates', 'Qatar', 'Kuwait'] },
  'sub-saharan-africa': { title: 'Sub-Saharan Africa', members: ['Mauritania', 'Mali', 'Niger', 'Chad', 'South Sudan', 'Eritrea', 'Ethiopia', 'Djibouti', 'Somalia', 'Somaliland', 'Senegal', 'Gambia', 'Guinea-Bissau', 'Guinea', 'Sierra Leone', 'Liberia', "Côte d'Ivoire", 'Burkina Faso', 'Ghana', 'Togo', 'Benin', 'Nigeria', 'Cameroon', 'Central African Republic', 'Equatorial Guinea', 'Gabon', 'Congo', 'Democratic Republic of the Congo', 'Uganda', 'Kenya', 'Rwanda', 'Burundi', 'Tanzania', 'Angola', 'Zambia', 'Malawi', 'Mozambique', 'Zimbabwe', 'Botswana', 'Namibia', 'South Africa', 'Lesotho', 'Eswatini', 'Madagascar'] },
  'south-asia': { title: 'South Asia', members: ['India', 'Pakistan', 'Bangladesh', 'Nepal', 'Bhutan', 'Sri Lanka', 'Afghanistan'] },
  'east-asia': { title: 'East Asia', members: ['China', 'Taiwan', 'Mongolia', 'Japan', 'North Korea', 'South Korea'] },
  'southeast-asia': { title: 'Southeast Asia', members: ['Myanmar', 'Thailand', 'Laos', 'Cambodia', 'Viet Nam', 'Malaysia', 'Indonesia', 'Philippines', 'Brunei', 'Timor-Leste'] },
  oceania: { title: 'Australia and Oceania', members: ['Australia', 'New Zealand', 'Papua New Guinea', 'Fiji', 'Solomon Islands', 'Vanuatu', 'New Caledonia'] },
};

export const slug = n => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* Equal Earth (Šavrič, Patterson and Jenny 2018), lon/lat in degrees. */
const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, MM = Math.sqrt(3) / 2;
export function equalEarth(lon, lat) {
  const l = lon * Math.PI / 180, p = lat * Math.PI / 180, t = Math.asin(MM * Math.sin(p)), t2 = t * t, t6 = t2 * t2 * t2;
  return [l * Math.cos(t) / (MM * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))), t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))];
}

function decode(topo) {
  const { scale: [kx, ky], translate: [dx, dy] } = topo.transform;
  const arcs = topo.arcs.map(a => { let x = 0, y = 0; return a.map(([px, py]) => [(x += px) * kx + dx, (y += py) * ky + dy]); });
  const arc = i => i < 0 ? arcs[~i].slice().reverse() : arcs[i];
  // A ring that crosses the antimeridian (Fiji, eastern Russia) has points at
  // both +180 and -180: its western points are clamped to +180, so no stroke
  // runs across the whole map.
  const ring = r => {
    const pts = r.flatMap((i, k) => { const a = arc(i); return k ? a.slice(1) : a; });
    const lons = pts.map(p => p[0]);
    if (Math.max(...lons) - Math.min(...lons) <= 180) return pts;
    return pts.map(([lo, la]) => [lo < 0 ? 180 : lo, la]);
  };
  return topo.objects.countries.geometries.map(g => ({
    name: g.properties.name,
    polys: g.type === 'Polygon' ? [g.arcs.map(ring)] : g.type === 'MultiPolygon' ? g.arcs.map(p => p.map(ring)) : [],
  }));
}

/* A closed ring is split at the point farthest from its start, so both
   halves have a real chord to measure against. */
function dpRing(pts, tol) {
  if (pts.length < 5) return pts;
  let far = 1, fd = 0;
  for (let i = 1; i < pts.length - 1; i++) { const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]); if (d > fd) { fd = d; far = i; } }
  return dp(pts.slice(0, far + 1), tol).concat(dp(pts.slice(far), tol).slice(1));
}
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let md = 0, mi = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], L = Math.hypot(bx - ax, by - ay) || 1e-9;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / L; if (d > md) { md = d; mi = i; } }
    if (md > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const area = r => r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
function centroid(r) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length], f = p[0] * q[1] - q[0] * p[1]; a += f; cx += (p[0] + q[0]) * f; cy += (p[1] + q[1]) * f; }
  return a ? [cx / (3 * a), cy / (3 * a)] : r[0];
}
const r1 = v => Math.round(v * 10) / 10;

/* One base: lon/lat box in, features (projected, fitted to `width`) out. */
function makeBase(id, title, countries, { width, box, members, tol = 0.45 }) {
  const P = ([lon, lat]) => equalEarth(lon, lat);
  const corners = [];
  for (let i = 0; i <= 20; i++) for (const [lo, la] of [[box[0] + (box[2] - box[0]) * i / 20, box[1]], [box[0] + (box[2] - box[0]) * i / 20, box[3]], [box[0], box[1] + (box[3] - box[1]) * i / 20], [box[2], box[1] + (box[3] - box[1]) * i / 20]]) corners.push(P([lo, la]));
  const xs = corners.map(c => c[0]), ys = corners.map(c => c[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const k = width / (x1 - x0), height = Math.round((y1 - y0) * k);
  const proj = { name: 'equal-earth', k: +k.toFixed(4), x0: +x0.toFixed(6), y1: +y1.toFixed(6) };
  const toPx = ([lon, lat]) => { const [x, y] = P([lon, lat]); return [(x - x0) * k, (y1 - y) * k]; };
  const features = [];
  for (const c of countries) {
    const inBox = c.polys.some(p => p[0].some(([lo, la]) => lo >= box[0] && lo <= box[2] && la >= box[1] && la <= box[3]));
    if (!inBox) continue;
    let best = null, bestA = 0; const parts = [];
    for (const poly of c.polys) for (const [ri, raw] of poly.entries()) {
      const px = dpRing(raw.map(toPx), tol);
      if (px.length < 4) continue;
      const a = Math.abs(area(px));
      if (a < 0.6) continue;
      // Skip rings wholly outside the view (a region crops the world).
      if (px.every(([x]) => x < -40) || px.every(([x]) => x > width + 40) || px.every(([, y]) => y < -40) || px.every(([, y]) => y > height + 40)) continue;
      if (ri === 0 && a > bestA) { bestA = a; best = px; }
      parts.push('M' + px.map(p => `${r1(p[0])} ${r1(p[1])}`).join('L') + 'Z');
    }
    if (!parts.length) continue;
    const f = { id: c.id, name: c.name, d: parts.join('') };
    if (best) f.c = centroid(best).map(r1);
    if (c.region) f.r = c.region;
    if (members && !members.includes(c.name)) f.context = true;
    if (c.disputed) f.disputed = true;
    features.push(f);
  }
  return { id, title, width, height, projection: proj, box, source: SOURCE, features };
}

/* Country A: invented, eight provinces on a 600 x 400 plane (no projection),
   drawn with wandering borders, a coast, rivers and a lake by
   scripts/aphug-country-a.mjs. */
export { countryA };

/* The metro: an invented metropolitan area on a 600 x 420 plane (no
   projection). Eight suburban cities are wedges between the central city's
   limit and the edge of the built-up area; outside it, the rural fringe (a
   context area, drawn grey). Lines (`line`: river, rail, highway) and rail
   stations (`station`) are features too, so marks can point at them; the
   central city carries `limit: true` (its city limit is drawn bold). */
export function metroBase() {
  const C = [300, 215], ang = k => (-112.5 + 45 * k) * Math.PI / 180;
  // Radii per direction (N, NE, E, SE, S, SW, W, NW from the top), uneven on purpose.
  const RI = [80, 92, 86, 78, 84, 90, 82, 88], RO = [190, 205, 250, 215, 185, 200, 245, 210];
  const pt = (r, k) => [r1(C[0] + r * Math.cos(ang(k))), r1(C[1] + 0.82 * r * Math.sin(ang(k)))];
  const inner = RI.map((r, k) => pt(r, k)), outer = RO.map((r, k) => pt(r, k));
  const SUB = [
    ['northfield', 'Northfield', 'NF'], ['lakeview', 'Lakeview', 'LV'], ['eastgate', 'Eastgate', 'EG'], ['millbrook', 'Millbrook', 'MB'],
    ['southport', 'Southport', 'SP'], ['ashford', 'Ashford', 'AF'], ['westhill', 'Westhill', 'WH'], ['fairview', 'Fairview', 'FV'],
  ];
  const ring = pts => 'M' + pts.map(p => p.join(' ')).join('L') + 'Z';
  const features = [];
  // The rural fringe: the frame minus the built-up area (even-odd fill).
  features.push({ id: 'rural', name: 'Rural fringe', code: 'RF', context: true, evenodd: true, d: 'M0 0L600 0L600 420L0 420Z' + ring(outer), c: [40, 30] });
  features.push({ id: 'central-city', name: 'Central City', code: 'CC', limit: true, d: ring(inner), c: centroid(inner).map(r1) });
  SUB.forEach(([id, name, code], k) => {
    const pts = [inner[k], outer[k], outer[(k + 1) % 8], inner[(k + 1) % 8]];
    features.push({ id, name, code, d: ring(pts), c: centroid(pts).map(r1) });
  });
  const line = (id, name, kind, pts, curve) => features.push({ id, name, line: kind, d: curve || ('M' + pts.map(p => p.join(' ')).join('L')), c: pts[Math.floor(pts.length / 2)] });
  line('river', 'River', 'river', [[0, 262], [150, 250], [300, 242], [450, 205], [600, 214]], 'M0 262C90 268 160 236 230 246S360 252 420 214S540 200 600 214');
  line('rail', 'Rail line', 'rail', [[90, 60], [190, 120], [300, 215], [400, 290], [520, 380]]);
  line('ring-road', 'Ring highway', 'highway', [[300, 100]], ring([[300, 98], [415, 135], [445, 215], [410, 300], [300, 330], [190, 300], [155, 215], [190, 132]]));
  line('highway-west', 'Western highway', 'highway', [[0, 190], [80, 196], [155, 215]]);
  [[190, 120], [245, 167], [300, 215], [355, 256], [400, 290], [470, 342]].forEach((c, i) => features.push({ id: `station-${i + 1}`, name: `Station ${i + 1}`, station: true, c }));
  return { id: 'metro', title: 'An invented metropolitan area', width: 600, height: 420, projection: { name: 'none' }, invented: true, note: 'An invented metropolitan area for practice.', source: 'Invented metropolitan area for practice', features };
}

function writeOut(files) {
  let stale = 0;
  mkdirSync(OUT, { recursive: true });
  for (const [f, data] of Object.entries(files)) {
    const out = JSON.stringify(data) + '\n', p = join(OUT, f);
    if (CHECK) { if (!existsSync(p) || readFileSync(p, 'utf8') !== out) { console.error(`stale: human-geography/figures/base/${f}`); stale++; } }
    else { writeFileSync(p, out); console.log(`${f}: ${data.features.length} features, ${(out.length / 1024).toFixed(1)} KB`); }
  }
  if (stale) process.exit(1);
}

function run() {
  if (INVENTED_ONLY) return writeOut({ 'country-a.json': countryA(), 'metro.json': metroBase() });
  if (!existsSync(ATLAS)) { console.error(`build-aphug-basemaps: no atlas at ${ATLAS} (see the header for how to get world-atlas 2.0.2)`); process.exit(2); }
  const topo = JSON.parse(readFileSync(ATLAS, 'utf8'));
  const regionOf = new Map(Object.entries(REGIONS).flatMap(([r, v]) => v.members.map(m => [m, r])));
  const countries = decode(topo).filter(c => !DROP.includes(c.name)).map(c => {
    const name = NAMES[c.name] || c.name;
    return { ...c, name, id: slug(name), region: regionOf.get(name), disputed: DISPUTED.includes(name) || undefined };
  });
  const missing = countries.filter(c => !c.region).map(c => c.name);
  if (missing.length) { console.error(`build-aphug-basemaps: no region for ${missing.join(', ')}`); process.exit(1); }
  for (const [r, v] of Object.entries(REGIONS)) for (const m of v.members) if (!countries.some(c => c.name === m)) { console.error(`build-aphug-basemaps: region ${r} names unknown country ${m}`); process.exit(1); }
  const BOX = {
    world: [-180, -58, 180, 84],
    'north-america': [-170, 14, -50, 84], 'latin-america': [-118, -56, -33, 33], europe: [-25, 34, 45, 72],
    'russia-central-asia': [26, 34, 180, 78], 'north-africa-sw-asia': [-18, 8, 64, 44], 'sub-saharan-africa': [-18, -36, 52, 25],
    'south-asia': [59, 5, 98, 39], 'east-asia': [72, 17, 147, 55], 'southeast-asia': [91, -12, 142, 29], oceania: [110, -48, 180, 0],
  };
  const files = { 'world.json': makeBase('world', 'World', countries, { width: 1000, box: BOX.world, tol: 0.6 }) };
  for (const [r, v] of Object.entries(REGIONS)) files[`${r}.json`] = makeBase(r, v.title, countries, { width: 600, box: BOX[r], members: v.members, tol: 0.5 });
  files['country-a.json'] = countryA();
  files['metro.json'] = metroBase();
  writeOut(files);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) run();
