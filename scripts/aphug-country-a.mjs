/* Redraws Country A (human-geography/figures/base/country-a.json) as a believable
   country instead of eight straight-edged blocks (owner, 2026-11-10: "it's just
   like blocks"). Same eight provinces, same ids, names, codes, label centers and
   neighbors; only the lines change, and a `scenery` layer is added (sea, a
   neighbor's border, a lake, rivers, hills, forest) that hug-map.js
   draws around and over the provinces.

   Rules that keep every existing map and question true:
   - every border is still a ring of straight segments (M/L/Z), so the point tests
     in the tools' math keep working;
   - the outer border only ever moves outward, so every dot and symbol that was
     inside the country still is;
   - inner borders move a little; no authored dot, symbol or flow end changed
     province when this was drawn (checked over human-geography/data, 2026-11-10).

   Used by scripts/build-aphug-basemaps.mjs (countryA), which writes the file:
     node scripts/build-aphug-basemaps.mjs --invented */

export function countryA(){
  // The corners the provinces have always met at.
  const V = {
    a: [60, 40], b: [250, 20], c: [470, 30], d: [520, 110], e: [560, 230], f: [540, 340], g: [300, 370], h: [160, 360],
    i: [200, 290], j: [50, 260], k: [70, 140], l: [300, 120], m: [180, 160], n: [400, 150], o: [430, 260], p: [320, 270], q: [260, 200]
  };
  const PROV = [
    { id: 'north', name: 'Northern Hills', code: 'NH', ring: 'a b l m k', c: [172.8, 89.4] },
    { id: 'northeast', name: 'Lake District', code: 'LD', ring: 'b c d n l', c: [385.2, 79.4] },
    { id: 'east', name: 'Eastern Plains', code: 'EP', ring: 'd e o n', c: [478.7, 187.7] },
    { id: 'capital', name: 'Capital Region', code: 'CR', ring: 'l n o p q', c: [345.3, 200.5] },
    { id: 'west', name: 'Western Uplands', code: 'WU', ring: 'k m q i j', c: [145.3, 216] },
    { id: 'central', name: 'Central Valley', code: 'CV', ring: 'm l q', c: [246.7, 160] },
    { id: 'south', name: 'Southern Forest', code: 'SF', ring: 'i q p g h', c: [251.9, 302.4] },
    { id: 'coast', name: 'South Coast', code: 'SC', ring: 'p o e f g', c: [431.7, 304.4] }
  ];
  // The sea lies to the south and east: these outer edges are coast.
  const COAST = new Set(['d e', 'e f', 'f g', 'g h', 'h i', 'i j'].map(key));

  function key(s){ const [x, y] = Array.isArray(s) ? s : s.split(' '); return x < y ? x + ' ' + y : y + ' ' + x; }
  function rng(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const r1 = v => Math.round(v * 10) / 10;

  // How many provinces use each edge: 1 = the country's outer border.
  const uses = {};
  PROV.forEach(p => { const r = p.ring.split(' '); r.forEach((v, i) => { const k = key([v, r[(i + 1) % r.length]]); uses[k] = (uses[k] || 0) + 1; }); });
  const CENTER = [300, 200];

  /* One wandering line per edge, shared by both sides. Midpoint displacement:
     each pass halves every segment and pushes the new point sideways by a random
     share of the segment's length. Outer edges are pushed away from the country's
     middle only. */
  const LINES = {};
  Object.keys(uses).forEach((k, n) => {
    const [x, y] = k.split(' '), A = V[x], B = V[y], rand = rng(9173 + n * 7919);
    const outer = uses[k] === 1, coast = COAST.has(k);
    let pts = [A, B];
    const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    const nx = -(B[1] - A[1]), ny = B[0] - A[0], nl = Math.hypot(nx, ny);
    const outSign = ((mid[0] - CENTER[0]) * nx + (mid[1] - CENTER[1]) * ny) >= 0 ? 1 : -1;
    const rough = coast ? 0.12 : outer ? 0.09 : 0.07;
    for(let pass = 0; pass < 4; pass++){
      const next = [];
      for(let i = 0; i < pts.length - 1; i++){
        const P = pts[i], Q = pts[i + 1], len = Math.hypot(Q[0] - P[0], Q[1] - P[1]);
        let t = (rand() * 2 - 1) * rough * len;
        if(outer) t = Math.abs(t) * outSign * (pass === 0 ? 1 : (rand() < 0.75 ? 1 : 0.15));
        next.push(P, [(P[0] + Q[0]) / 2 + nx / nl * t, (P[1] + Q[1]) / 2 + ny / nl * t]);
      }
      next.push(pts[pts.length - 1]);
      pts = next;
    }
    LINES[k] = { from: x, pts: pts.map(p => [r1(p[0]), r1(p[1])]) };
  });
  function edge(x, y){ const L = LINES[key([x, y])]; return L.from === x ? L.pts : L.pts.slice().reverse(); }
  function ringPts(ring){ const r = ring.split(' '); let out = []; r.forEach((v, i) => { out = out.concat(edge(v, r[(i + 1) % r.length]).slice(0, -1)); }); return out; }
  const dOf = pts => 'M' + pts.map(p => p[0] + ' ' + p[1]).join('L') + 'Z';

  const features = PROV.map(p => ({ id: p.id, name: p.name, code: p.code, d: dOf(ringPts(p.ring)), c: p.c }));

  /* Scenery. The sea meets the neighbors' coasts where the country's own coast
     ends (corners d and j) and runs off the map. */
  const coastRun = [].concat(edge('d', 'e').slice(0, -1), edge('e', 'f').slice(0, -1), edge('f', 'g').slice(0, -1), edge('g', 'h').slice(0, -1), edge('h', 'i').slice(0, -1), edge('i', 'j'));
  const sea = dOf([[600, 78], [566, 92]].concat(coastRun, [[22, 286], [0, 300], [0, 400], [600, 400]]));
  const smooth = pts => { // a soft curve through points (scenery only; never used for point tests)
    let d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for(let i = 1; i < pts.length - 1; i++){ const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; d += 'Q' + pts[i][0] + ' ' + pts[i][1] + ' ' + r1(mx) + ' ' + r1(my); }
    const z = pts[pts.length - 1]; return d + 'L' + z[0] + ' ' + z[1];
  };
  const scenery = {
    sea,
    // Where two neighboring countries meet, north of the Northern Hills.
    borders: ['M250 20L262 0', 'M60 40L0 22'],
    lake: 'M386 112C388 101 408 97 424 100C438 103 442 113 434 120C422 128 396 127 388 120Z',
    // Each river keeps clear of the provinces' label centers.
    rivers: [
      smooth([[118, 58], [150, 100], [200, 138], [232, 172], [262, 190], [300, 198], [332, 222], [366, 250], [388, 292], [396, 330], [404, 372]]),
      smooth([[410, 122], [404, 144], [392, 172], [378, 208], [366, 250]]),
      smooth([[96, 178], [150, 188], [190, 222], [214, 262], [226, 316], [232, 376]])
    ],
    // Small marks that say what the land is like; drawn on reference maps only.
    hills: [[110, 78], [150, 110], [196, 62], [226, 104], [92, 118], [98, 176], [134, 248], [84, 232], [172, 196]],
    trees: [[214, 318], [246, 336], [270, 300], [196, 340], [282, 344], [236, 280]]
  };
  return { id: 'country-a', title: 'Country A (invented)', width: 600, height: 400, projection: { name: 'none' }, invented: true,
    source: 'Invented outline for practice', features, scenery };
}
