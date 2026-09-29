/* Figures for the diastereomers notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   One molecule runs through the page: 3-bromobutan-2-ol,
   CH3-CH(OH)-CH(Br)-CH3, with stereocenters at C2 and C3. It is always drawn
   the same way, as a four-carbon zigzag with C2 raised and C3 lowered, OH
   straight up from C2 and Br straight down from C3. The only thing that
   changes from one stereoisomer to the next is whether each of those two
   bonds is a wedge or a hash, so inverting a center is visibly "swap that
   wedge for a hash". With this drawing, a wedge at C2 is R and a wedge at C3
   is R.

   Every drawing that carries an R/S label also records its atoms in CHECKS
   (with a z coordinate: toward the reader for a wedge or a Fischer
   horizontal, away for a hash or a Fischer vertical). A script outside the
   site reads CHECKS, rebuilds each molecule in 3D and compares the CIP label
   RDKit assigns with the label drawn. Nothing on the site uses CHECKS.

   Lesson copies (id prefix l-) are 340 wide or less, stacked, and use only
   fg-lbl and fg-tag text. */
import { atom, bond, wedge, hash, arrow, text, panel, rule, P } from '../lib/ochem-figure.mjs';
import { sk } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const r2 = (v) => Math.round(v * 100) / 100;
const rad = (d) => (d * Math.PI) / 180;
/* A point at math angle `deg` (0 east, 90 up) and distance `len` from c. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
const SIZE = { 'fg-lbl': 13, 'fg-sm': 10.5 };
const T = (x, y, s, cls = 'fg-tag', anchor = 'middle') =>
  text(x, y, s, { cls, size: SIZE[cls] ?? 11, anchor });
/* A text line whose parts may be italic: parts is a list of strings, and a
   string starting with '*' is set in italic (for cis, trans, syn, anti). */
function rich(x, y, parts, cls = 'fg-tag', anchor = 'middle') {
  const body = parts.map((p) => (p[0] === '*'
    ? `<tspan font-style="italic">${p.slice(1)}</tspan>` : p)).join('');
  return `<text class="${cls}" x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}" font-size="${SIZE[cls] ?? 11}">${body}</text>`;
}
const rOf = (l) => (l === 'H' ? 12 : [...l].length <= 2 ? 15 : [...l].length === 3 ? 17 : 21);
const stereo = (kind, a, b, rTo, rFrom = 0) => (kind === 'w'
  ? wedge(a, b, { rFrom, rTo, width: 9 })
  : hash(a, b, { rFrom, rTo, width: 11, rungs: 5 }));
/* An R or S beside a stereocenter. */
const rs = (p, s) => T(p.x, p.y, s, 'fg-tag-good');

/* ------------------------------------------------ the 3D check record --- */
export const CHECKS = [];
let CUR = null;
function molStart(name) { CUR = { name, atoms: [], bonds: [], claims: {} }; CHECKS.push(CUR); }
function A(el, p, z = 0) { CUR.atoms.push({ el, x: r2(p.x), y: r2(p.y), z: r2(z) }); return CUR.atoms.length - 1; }
function B(i, j, o = 1) { CUR.bonds.push([i, j, o]); }
const claim = (i, s) => { CUR.claims[i] = s; };
/* A group label as atoms: its first atom sits at p, the rest are hidden a
   little further out along `dir` (the unit vector away from the parent). */
function G(label, p, z, dir) {
  const off = (k) => P(p.x + dir.x * 14 * k, p.y + dir.y * 14 * k);
  switch (label) {
    case 'OH': case 'HO': return A('O', p, z);
    case 'Br': return A('Br', p, z);
    case 'H': return A('H', p, z);
    case 'CH₃': case 'C': return A('C', p, z);
    case 'CH₂OH': { const c = A('C', p, z); B(c, A('O', off(1), z * 1.3)); return c; }
    case 'CHO': { const c = A('C', p, z); B(c, A('O', off(1), z * 1.3), 2); return c; }
    default: throw new Error('no group ' + label);
  }
}
const unit = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1; return P(dx / L, dy / L); };

/* ------------------------------------------- 3-bromobutan-2-ol zigzag --- */
/* chain(x0, y0, o): C1 at (x0, y0), C2 raised, C3 on the baseline, C4
   raised. o.c2 and o.c3 are 'w' (wedge) or 'h' (hash); o.l2 and o.l3 are
   the R/S labels drawn beside C2 and C3; o.name is the line above. */
function chain(x0, y0, o) {
  const dx = o.dx ?? 42, dy = o.dy ?? 25, L = o.L ?? 40;
  const c = [P(x0, y0), P(x0 + dx, y0 - dy), P(x0 + 2 * dx, y0), P(x0 + 3 * dx, y0 - dy)];
  const oh = P(c[1].x, c[1].y - L), br = P(c[2].x, c[2].y + L);
  let s = sk(c[0], c[1]) + sk(c[1], c[2]) + sk(c[2], c[3]);
  s += stereo(o.c2, c[1], oh, 15) + stereo(o.c3, c[2], br, 15);
  s += atom(oh.x, oh.y, 'OH', { r: 15, kind: o.k2 });
  s += atom(br.x, br.y, 'Br', { r: 15, kind: o.k3 });
  s += rs(P(c[1].x, c[1].y + 22), o.l2);
  s += rs(P(c[2].x, c[2].y - 10), o.l3);
  if (o.name) s += T(x0 + 1.5 * dx, oh.y - 24, o.name, o.nameCls || 'fg-tag');
  /* check record */
  molStart(`3-bromobutan-2-ol ${o.name || ''} [${o.c2}${o.c3}]`);
  const ids = c.map((p) => A('C', p));
  B(ids[0], ids[1]); B(ids[1], ids[2]); B(ids[2], ids[3]);
  const z2 = o.c2 === 'w' ? 26 : -26, z3 = o.c3 === 'w' ? 26 : -26;
  B(ids[1], A('O', oh, z2)); B(ids[1], A('H', P(oh.x, oh.y + 12), -z2));
  B(ids[2], A('Br', br, z3)); B(ids[2], A('H', P(br.x, br.y - 12), -z3));
  claim(ids[1], o.l2); claim(ids[2], o.l3);
  return { s, c, oh, br };
}
/* The four stereoisomers, by wedge/hash at C2 and C3. */
const ISO = {
  RR: { c2: 'w', c3: 'w', l2: 'R', l3: 'R', name: '(2R,3R)' },
  SS: { c2: 'h', c3: 'h', l2: 'S', l3: 'S', name: '(2S,3S)' },
  RS: { c2: 'w', c3: 'h', l2: 'R', l3: 'S', name: '(2R,3S)' },
  SR: { c2: 'h', c3: 'w', l2: 'S', l3: 'R', name: '(2S,3R)' },
};

/* ================================================================ 1 ===
   The first pair: (2R,3R) and (2R,3S). Same C2, different C3. */
function firstPair(stacked) {
  let s = '';
  if (!stacked) {
    s += chain(70, 120, { ...ISO.RR, k3: 'hi' }).s;
    s += chain(450, 120, { ...ISO.RS, k3: 'hi' }).s;
    s += T(345, 96, 'C2 the same (R in both)', 'fg-tag');
    s += T(345, 122, 'C3 opposite (R, then S)', 'fg-tag-warn');
    s += T(345, 196, 'not mirror images, not the same molecule', 'fg-tag');
    return s;
  }
  s += chain(107, 104, { ...ISO.RR, k3: 'hi' }).s;
  s += T(170, 188, 'C2 the same: R in both', 'fg-tag');
  s += T(170, 208, 'C3 opposite: R here, S below', 'fg-tag-warn');
  s += chain(107, 308, { ...ISO.RS, k3: 'hi' }).s;
  return s;
}
FIGURES.push({
  id: 'diast-first-pair',
  section: 'diastereomers',
  anchor: '<h3>The definition</h3>',
  viewBox: '0 0 700 220',
  alt: 'Two stereoisomers of 3-bromobutan-2-ol drawn as the same zigzag. In (2R,3R) the OH on C2 and the Br on C3 are both on wedges. In (2R,3S) the OH is on a wedge and the Br is on a hash. C2 is R in both; C3 is R in the first and S in the second.',
  build: () => firstPair(false),
  caption: 'The skeleton and the OH wedge are identical. Only the Br bond differs: a wedge on the left, a hash on the right.',
});
FIGURES.push({
  id: 'l-first-pair',
  lessons: ['diastereomers'],
  viewBox: '0 0 340 372',
  alt: 'Two stereoisomers of 3-bromobutan-2-ol, stacked. In (2R,3R) the OH and Br are both on wedges; in (2R,3S) the OH is on a wedge and the Br on a hash. C2 is R in both; C3 differs.',
  build: () => firstPair(true),
  caption: 'Same skeleton, same OH wedge. Only the Br bond changes, from a wedge to a hash.',
});

/* ================================================================ 2 ===
   All four stereoisomers in a grid, with the relationships drawn. */
function grid(lesson) {
  let s = '';
  if (!lesson) {
    const xs = [60, 450], ys = [120, 330];
    s += chain(xs[0], ys[0], ISO.RR).s;
    s += chain(xs[1], ys[0], ISO.SS).s;
    s += chain(xs[0], ys[1], ISO.RS).s;
    s += chain(xs[1], ys[1], ISO.SR).s;
    const mx = 380;
    for (const y of [ys[0] - 20, ys[1] - 20]) {
      s += `<line class="fg-dash-hi" x1="250" y1="${y}" x2="${mx + 130 - 20}" y2="${y}"></line>`;
    }
    s += T(mx - 10, ys[0] - 30, 'ENANTIOMERS', 'fg-tag-good');
    s += T(mx - 10, ys[0] - 2, 'both centers inverted', 'fg-sm');
    s += T(mx - 10, ys[1] - 30, 'ENANTIOMERS', 'fg-tag-good');
    s += T(mx - 10, ys[1] - 2, 'both centers inverted', 'fg-sm');
    /* columns and diagonals */
    s += `<line class="fg-dash" x1="123" y1="178" x2="123" y2="232"></line>`;
    s += `<line class="fg-dash" x1="513" y1="178" x2="513" y2="232"></line>`;
    s += `<line class="fg-dash" x1="200" y1="176" x2="440" y2="236"></line>`;
    s += `<line class="fg-dash" x1="200" y1="236" x2="440" y2="176"></line>`;
    s += panel(250, 188, 140, 36, { kind: 'warn' });
    s += T(320, 211, 'DIASTEREOMERS', 'fg-tag-warn');
    s += T(116, 210, 'one center', 'fg-sm', 'end');
    s += T(116, 223, 'inverted', 'fg-sm', 'end');
    s += T(522, 210, 'one center', 'fg-sm', 'start');
    s += T(522, 223, 'inverted', 'fg-sm', 'start');
    return s;
  }
  /* lesson: two columns of 170, the same four molecules, tighter */
  const d = { dx: 32, dy: 20, L: 34 };
  s += chain(22, 88, { ...ISO.RR, ...d }).s;
  s += chain(192, 88, { ...ISO.SS, ...d }).s;
  s += chain(22, 268, { ...ISO.RS, ...d }).s;
  s += chain(192, 268, { ...ISO.SR, ...d }).s;
  s += `<line class="fg-dash-hi" x1="150" y1="80" x2="190" y2="80"></line>`;
  s += `<line class="fg-dash-hi" x1="150" y1="260" x2="190" y2="260"></line>`;
  s += T(170, 164, 'across a row: enantiomers', 'fg-tag-good');
  s += T(170, 184, 'down or diagonal: diastereomers', 'fg-tag-warn');
  return s;
}
FIGURES.push({
  id: 'four-stereoisomers',
  section: 'diastereomers',
  anchor: '<h3>Two stereocenters, four stereoisomers</h3>',
  viewBox: '0 0 700 400',
  alt: 'The four stereoisomers of 3-bromobutan-2-ol in a two-by-two grid, all drawn on the same zigzag. Top row: (2R,3R) with OH and Br on wedges, and (2S,3S) with both on hashes; they are enantiomers. Bottom row: (2R,3S) with OH on a wedge and Br on a hash, and (2S,3R) with OH on a hash and Br on a wedge; they are enantiomers. Every vertical and diagonal pairing inverts one center only and is a pair of diastereomers.',
  build: () => grid(false),
  caption: 'Across each row every wedge has become a hash, so both centers are inverted. Down a column or along a diagonal, only one bond has changed.',
});
FIGURES.push({
  id: 'l-four-stereoisomers',
  lessons: ['diastereomers'],
  viewBox: '0 0 340 330',
  alt: 'The four stereoisomers of 3-bromobutan-2-ol in a two-by-two grid: (2R,3R) and (2S,3S) on top, (2R,3S) and (2S,3R) below. Each row is an enantiomeric pair; every vertical or diagonal pairing is a pair of diastereomers.',
  build: () => grid(true),
  caption: 'Across a row, both bonds change. Down a column or along a diagonal, only one does.',
});

/* The starting molecule for the lesson's click step. */
FIGURES.push({
  id: 'l-flip-start',
  lessons: ['diastereomers'],
  viewBox: '0 0 340 170',
  alt: '(2R,3R)-3-bromobutan-2-ol: the zigzag with OH on a wedge at C2 and Br on a wedge at C3, with C2 and C3 labeled.',
  build() {
    const r = chain(107, 104, { ...ISO.RR, name: '(2R,3R)-3-bromobutan-2-ol' });
    let s = r.s;
    s += T(r.c[1].x - 30, r.c[1].y - 6, 'C2', 'fg-tag-mut', 'end');
    s += T(r.c[2].x + 30, r.c[2].y + 16, 'C3', 'fg-tag-mut', 'start');
    return s;
  },
  caption: 'Two stereocenters: C2 carries the OH and C3 carries the Br.',
});

/* ================================================================ 3 ===
   Newman projections down C2-C3, methyls anti in both: OH and Br end up
   anti in (2R,3S) and gauche in (2R,3R). */
function newman(c, o) {
  const R = 30, L = 62;
  let s = '';
  const back = o.back, front = o.front; // {deg: label}
  molStart(`newman ${o.name}`);
  const cF = A('C', c, 20), cB = A('C', c, -20); B(cF, cB);
  for (const [deg, l] of Object.entries(back)) {
    const a = at(c, +deg, R), e = at(c, +deg, L);
    s += bond(a, e, { rFrom: 0, rTo: rOf(l) });
    B(cB, G(l, e, -45, unit(c, e)));
  }
  s += `<circle class="fg-bond" cx="${r2(c.x)}" cy="${r2(c.y)}" r="${R}" fill="none"></circle>`;
  for (const [deg, l] of Object.entries(front)) {
    const e = at(c, +deg, L);
    s += bond(c, e, { rFrom: 0, rTo: rOf(l) });
    B(cF, G(l, e, 45, unit(c, e)));
  }
  let atoms = '';
  for (const [deg, l] of [...Object.entries(back), ...Object.entries(front)]) {
    const e = at(c, +deg, L);
    atoms += atom(e.x, e.y, l, { r: rOf(l), kind: l === 'OH' || l === 'Br' ? 'hi' : undefined });
  }
  claim(cF, o.l2); claim(cB, o.l3);
  return s + atoms;
}
const NEWMAN = {
  RS: { name: '(2R,3S)', l2: 'R', l3: 'S', front: { 90: 'CH₃', 210: 'OH', 330: 'H' }, back: { 270: 'CH₃', 30: 'Br', 150: 'H' } },
  RR: { name: '(2R,3R)', l2: 'R', l3: 'R', front: { 90: 'CH₃', 210: 'OH', 330: 'H' }, back: { 270: 'CH₃', 150: 'Br', 30: 'H' } },
};
function newmanFig(stacked) {
  let s = '';
  const put = (c, key, verdict, cls) => {
    const d = NEWMAN[key];
    s += T(c.x, c.y - 92, d.name, 'fg-tag');
    s += newman(c, d);
    s += T(c.x, c.y + 104, verdict, cls);
  };
  if (!stacked) {
    put(P(190, 130), 'RS', 'OH and Br anti: 180° apart', 'fg-tag-good');
    put(P(510, 130), 'RR', 'OH and Br gauche: 60° apart', 'fg-tag-warn');
    s += T(350, 262, 'In both, the two methyls are anti. Front carbon: C2. Back carbon (circle): C3.', 'fg-sm');
    return s;
  }
  put(P(170, 124), 'RS', 'OH and Br anti: 180° apart', 'fg-tag-good');
  put(P(170, 382), 'RR', 'OH and Br gauche: 60° apart', 'fg-tag-warn');
  return s;
}
FIGURES.push({
  id: 'diast-newman',
  section: 'diastereomers',
  anchor: '<h3>Why diastereomers have different physical properties</h3>',
  viewBox: '0 0 700 276',
  alt: 'Newman projections looking down the C2 to C3 bond of two stereoisomers of 3-bromobutan-2-ol, each with the two methyl groups anti. In (2R,3S) the OH on the front carbon and the Br on the back carbon are anti, 180 degrees apart. In (2R,3R) they are gauche, 60 degrees apart.',
  build: () => newmanFig(false),
  caption: 'Both molecules are in the same conformation, with the two methyls anti. The OH and the Br still end up in different places relative to each other.',
});
FIGURES.push({
  id: 'l-diast-newman',
  lessons: ['diastereomers'],
  viewBox: '0 0 340 500',
  alt: 'Newman projections down the C2 to C3 bond of (2R,3S)- and (2R,3R)-3-bromobutan-2-ol, stacked, each with the methyls anti. OH and Br are anti in the first and gauche in the second.',
  build: () => newmanFig(true),
  caption: 'Front carbon C2, back carbon C3, methyls anti in both. The OH to Br distance still differs.',
});

/* ================================================================ 4 ===
   but-2-ene: no stereocenter, two diastereomers, different dipoles. */
function butene(cx, cy, trans) {
  const c2 = P(cx - 26, cy), c3 = P(cx + 26, cy);
  const m1 = P(cx - 66, cy + 22), m2 = P(cx + 66, trans ? cy - 22 : cy + 22);
  const h1 = P(cx - 66, cy - 22), h2 = P(cx + 66, trans ? cy + 22 : cy - 22);
  let g = bond(c2, c3, { order: 2, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 4 });
  g += bond(c2, m1, { rFrom: 0, rTo: 17 }) + bond(c3, m2, { rFrom: 0, rTo: 17 });
  g += bond(c2, h1, { rFrom: 0, rTo: 12 }) + bond(c3, h2, { rFrom: 0, rTo: 12 });
  g += atom(m1.x, m1.y, 'CH₃', { r: 17 }) + atom(m2.x, m2.y, 'CH₃', { r: 17 });
  g += atom(h1.x, h1.y, 'H', { r: 12 }) + atom(h2.x, h2.y, 'H', { r: 12 });
  return g;
}
/* The two C-CH3 bond dipoles redrawn from one origin, so their sum can be
   read off. Each points from the methyl toward the alkene carbon. */
function dipoles(o, trans) {
  let g = arrow(o, P(o.x + 30, o.y - 20), { size: 7 });
  g += arrow(o, P(o.x - 30, trans ? o.y + 20 : o.y - 20), { size: 7 });
  if (!trans) g += arrow(o, P(o.x, o.y - 28), { muted: true, size: 7 });
  return g;
}
function buteneFig(stacked) {
  let s = '';
  const one = (cx, top, trans, lesson) => {
    const h = lesson ? 214 : 250;
    s += panel(cx - 162, top, 324, h, { kind: 'hi' });
    s += rich(cx, top + 22, [trans ? '*trans' : '*cis', '-but-2-ene'], 'fg-tag');
    s += butene(cx, top + 84, trans);
    s += T(cx, top + 136, 'no stereocenter', 'fg-tag-mut');
    s += dipoles(P(cx, top + 182), trans);
    if (lesson) {
      s += T(cx, top + 206, trans ? 'dipoles cancel: μ = 0' : 'dipoles add: μ = 0.33 D', 'fg-tag-good');
      return;
    }
    s += T(cx, top + 208, trans ? 'the two C–CH₃ dipoles are exactly opposed' : 'the two C–CH₃ dipoles share an upward part', 'fg-sm');
    s += T(cx, top + 228, trans ? 'μ = 0' : 'μ = 0.33 D', 'fg-tag-good');
    s += T(cx, top + 244, trans ? 'bp 0.9 °C' : 'bp 3.7 °C', 'fg-sm');
  };
  if (!stacked) { one(190, 10, false); one(530, 10, true); return s; }
  one(170, 6, false, true); one(170, 232, true, true);
  return s;
}
FIGURES.push({
  id: 'cis-trans-are-diastereomers',
  section: 'diastereomers',
  anchor: '<h3>Diastereomers with no stereocenter</h3>',
  viewBox: '0 0 720 270',
  alt: 'cis-but-2-ene with both methyls below the double bond, and trans-but-2-ene with one methyl above and one below. Neither has a stereocenter. Below each, the two carbon-methyl bond dipoles are drawn from one point: in the cis isomer they share an upward component and add to 0.33 debye; in the trans isomer they point exactly opposite ways and cancel to zero. Boiling points 3.7 and 0.9 degrees Celsius.',
  build: () => buteneFig(false),
  caption: 'The arrows under each molecule are its two C–CH₃ bond dipoles, redrawn from one point so their sum can be read off.',
});
FIGURES.push({
  id: 'l-butene',
  lessons: ['diastereomers'],
  viewBox: '0 0 340 452',
  alt: 'cis-but-2-ene, methyls on the same side, whose two bond dipoles add to 0.33 debye; trans-but-2-ene, methyls on opposite sides, whose two bond dipoles cancel exactly to zero. Neither has a stereocenter.',
  build: () => buteneFig(true),
  caption: 'Each pair of arrows is the molecule’s two C–CH₃ bond dipoles, drawn from one point.',
});

/* ================================================================ 5 ===
   1,2-dimethylcyclohexane, cis and trans, as flat rings with R/S. The ring
   has a vertex at the top; C1 is the upper-right vertex and C2 the one
   below it. */
function ringPair(cx, cy, o) {
  const r = o.r ?? 40;
  const pts = [90, 30, 330, 270, 210, 150].map((d) => at(P(cx, cy), d, r));
  // pts[1] = C1 (30 deg), pts[2] = C2 (330 deg)
  let s = pts.map((p, i) => sk(p, pts[(i + 1) % 6])).join('');
  molStart(`${o.sub} ring ${o.name}`);
  const ids = pts.map((p) => A('C', p));
  ids.forEach((id, i) => B(id, ids[(i + 1) % 6]));
  const put = (i, deg, kind, label) => {
    const e = at(pts[i], deg, 38 + rOf(label) - 15);
    s += stereo(kind, pts[i], e, rOf(label));
    s += atom(e.x, e.y, label, { r: rOf(label), kind: o.kind });
    const z = kind === 'w' ? 26 : -26;
    B(ids[i], G(label, e, z, unit(pts[i], e)));
    B(ids[i], A('H', at(pts[i], deg, 20), -z));
  };
  put(1, 30, o.k1, o.sub);
  put(2, 330, o.k2, o.sub);
  const t1 = at(P(cx, cy), 30, r * 0.42), t2 = at(P(cx, cy), 330, r * 0.42);
  s += rs(P(t1.x, t1.y + 4), o.l1);
  s += rs(P(t2.x, t2.y + 8), o.l2);
  claim(ids[1], o.l1); claim(ids[2], o.l2);
  return s;
}
const DMC = {
  cis: { sub: 'CH₃', k1: 'w', k2: 'w', l1: 'R', l2: 'S', name: '(1R,2S)' },
  trans: { sub: 'CH₃', k1: 'w', k2: 'h', l1: 'R', l2: 'R', name: '(1R,2R)' },
};
function dmcFig(stacked) {
  let s = '';
  const one = (cx, cy, key) => {
    const d = DMC[key];
    s += rich(cx, cy - 74, [key === 'cis' ? '*cis' : '*trans', '-1,2-dimethylcyclohexane'], 'fg-tag');
    s += T(cx, cy - 56, d.name, 'fg-tag-good');
    s += ringPair(cx - 20, cy + 6, d);
    s += T(cx, cy + 80, key === 'cis' ? 'both methyls on wedges: same face' : 'one wedge, one hash: opposite faces', 'fg-tag');
  };
  if (!stacked) {
    one(190, 96, 'cis'); one(530, 96, 'trans');
    s += T(530, 196, 'its mirror image is (1S,2S)', 'fg-tag-mut');
    return s;
  }
  one(170, 92, 'cis'); one(170, 292, 'trans');
  s += T(170, 392, 'its mirror image is (1S,2S)', 'fg-tag-mut');
  return s;
}
FIGURES.push({
  id: 'ring-diastereomers',
  section: 'diastereomers',
  anchor: '<h3>Diastereomers with no stereocenter</h3>',
  viewBox: '0 0 720 210',
  alt: 'cis-1,2-dimethylcyclohexane, drawn as a flat hexagon with both methyls on wedges, is (1R,2S). trans-1,2-dimethylcyclohexane, with one methyl on a wedge and one on a hash, is (1R,2R); its mirror image is (1S,2S).',
  build: () => dmcFig(false),
  caption: 'C1 keeps the same configuration, R, in both drawings. Only C2 changes, from S in the cis isomer to R in the trans isomer.',
});
FIGURES.push({
  id: 'l-ring-diastereomers',
  lessons: ['diastereomers'],
  viewBox: '0 0 340 404',
  alt: 'cis-1,2-dimethylcyclohexane with both methyls on wedges, (1R,2S), stacked above trans-1,2-dimethylcyclohexane with one wedge and one hash, (1R,2R). The mirror image of the trans isomer is (1S,2S).',
  build: () => dmcFig(true),
  caption: 'C1 is R in both. C2 is S in the cis isomer and R in the trans isomer.',
});

/* ================================================================ 6 ===
   3-methylpent-2-ene: C3 carries no hydrogen, so cis and trans have
   nothing to refer to. */
FIGURES.push({
  id: 'trisubstituted-alkene',
  section: 'diastereomers',
  anchor: 'Two warnings about the words',
  viewBox: '0 0 720 200',
  alt: 'The two stereoisomers of 3-methylpent-2-ene. C2 carries a methyl and a hydrogen; C3 carries a methyl and an ethyl group and no hydrogen. In the Z isomer the C2 methyl and the ethyl are on the same side; in the E isomer they are on opposite sides. Either methyl could be called cis or trans to the other groups, so the words give no single answer.',
  build() {
    let s = '';
    const one = (cx, z) => {
      const cy = 100;
      const c2 = P(cx - 26, cy), c3 = P(cx + 26, cy);
      const m2 = P(cx - 70, cy + 26), h2 = P(cx - 70, cy - 26);
      const et = P(cx + 78, z ? cy + 28 : cy - 28), m3 = P(cx + 70, z ? cy - 26 : cy + 26);
      s += bond(c2, c3, { order: 2, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 4 });
      s += bond(c2, m2, { rFrom: 0, rTo: 17 }) + bond(c2, h2, { rFrom: 0, rTo: 12 });
      s += bond(c3, et, { rFrom: 0, rTo: 25 }) + bond(c3, m3, { rFrom: 0, rTo: 17 });
      s += atom(m2.x, m2.y, 'CH₃', { r: 17 }) + atom(h2.x, h2.y, 'H', { r: 12 });
      s += atom(et.x, et.y, 'CH₂CH₃', { r: 25, kind: 'hi' }) + atom(m3.x, m3.y, 'CH₃', { r: 17 });
      s += T(c2.x, cy + 22, 'C2', 'fg-tag-mut');
      s += T(c3.x, cy + (z ? -14 : 22), 'C3', 'fg-tag-mut');
      s += T(cx, 30, z ? '(Z)-3-methylpent-2-ene' : '(E)-3-methylpent-2-ene', 'fg-tag');
    };
    one(170, true);
    one(550, false);
    s += T(360, 86, 'C3 has no H.', 'fg-tag-warn');
    s += T(360, 106, 'Its two groups are CH₃ and CH₂CH₃,', 'fg-sm');
    s += T(360, 122, 'so “cis” has nothing to point to.', 'fg-sm');
    s += T(360, 180, 'Two diastereomers, named with E and Z instead', 'fg-tag');
    return s;
  },
  caption: 'Both molecules have a methyl on each alkene carbon, so each one is “cis” by one pairing of groups and “trans” by another.',
});

/* ================================================================ 7 ===
   Epimers: D-glucose, D-mannose and D-galactose as Fischer projections,
   with R or S written beside every stereocenter. */
function fischer(x, y0, rows, o = {}) {
  const dy = o.dy ?? 44, arm = o.arm ?? 44;
  const ys = rows.map((_, i) => y0 + i * dy);
  let s = '';
  /* A Fischer projection has no single 3D shape (every crossing has its
     own verticals going back), so it is recorded flat and flagged; the
     checker sets the z of each stereocenter's four neighbours in turn. */
  molStart(`fischer ${o.name}`);
  CUR.fischer = true;
  const ids = [];
  rows.forEach((it, i) => {
    const p = P(x, ys[i]);
    if (it.c) ids.push(G(it.c, p, 0, P(0, i === 0 ? -1 : 1)));
    else ids.push(A('C', p, 0));
  });
  for (let i = 0; i < rows.length - 1; i++) {
    const a = rows[i], b = rows[i + 1];
    s += bond(P(x, ys[i]), P(x, ys[i + 1]), { rFrom: a.c ? rOf(a.c) : 0, rTo: b.c ? rOf(b.c) : 0 });
    B(ids[i], ids[i + 1]);
  }
  rows.forEach((it, i) => {
    const y = ys[i];
    if (it.c) { s += atom(x, y, it.c, { r: rOf(it.c) }); return; }
    const lp = P(x - arm, y), rp = P(x + arm, y);
    s += bond(P(x, y), lp, { rFrom: 0, rTo: rOf(it.l) }) + bond(P(x, y), rp, { rFrom: 0, rTo: rOf(it.r) });
    s += atom(lp.x, lp.y, it.l, { r: rOf(it.l), kind: it.hi && it.l !== 'H' ? 'hi' : undefined });
    s += atom(rp.x, rp.y, it.r, { r: rOf(it.r), kind: it.hi && it.r !== 'H' ? 'hi' : undefined });
    B(ids[i], G(it.l, lp, 0, P(-1, 0)));
    B(ids[i], G(it.r, rp, 0, P(1, 0)));
    s += rs(P(x + arm + 28, y + 4), it.rs);
    if (o.nums) s += T(x - arm - 26, y + 4, 'C' + (i + 1), 'fg-tag-mut');
    claim(ids[i], it.rs);
  });
  return { s, ys };
}
const SUGAR = {
  glucose: [['H', 'OH', 'R'], ['HO', 'H', 'S'], ['H', 'OH', 'R'], ['H', 'OH', 'R']],
  mannose: [['HO', 'H', 'S'], ['HO', 'H', 'S'], ['H', 'OH', 'R'], ['H', 'OH', 'R']],
  galactose: [['H', 'OH', 'R'], ['HO', 'H', 'S'], ['HO', 'H', 'S'], ['H', 'OH', 'R']],
};
const sugarRows = (key, hiRow) => [
  { c: 'CHO' },
  ...SUGAR[key].map(([l, r, s], i) => ({ l, r, rs: s, hi: i + 2 === hiRow })),
  { c: 'CH₂OH' },
];
FIGURES.push({
  id: 'epimers-fischer',
  section: 'diastereomers',
  anchor: '<h3>Epimers and anomers</h3>',
  viewBox: '0 0 720 346',
  alt: 'Fischer projections of D-mannose, D-glucose and D-galactose, each with CHO at the top, CH2OH at the bottom and R or S written beside each of C2 to C5. D-glucose is 2R,3S,4R,5R. D-mannose differs only at C2, which is S with its OH on the left. D-galactose differs only at C4, which is S with its OH on the left.',
  build() {
    let s = '';
    const y0 = 60, dy = 44;
    /* bands behind the row that differs from glucose */
    s += panel(22, y0 + dy - 20, 190, 40, { kind: 'warn' });
    s += panel(508, y0 + 3 * dy - 20, 190, 40, { kind: 'warn' });
    s += T(110, 28, 'D-mannose', 'fg-tag');
    s += fischer(110, y0, sugarRows('mannose', 2), { name: 'mannose' }).s;
    s += T(360, 28, 'D-glucose', 'fg-tag');
    s += fischer(360, y0, sugarRows('glucose', 0), { name: 'glucose', nums: true }).s;
    s += T(610, 28, 'D-galactose', 'fg-tag');
    s += fischer(610, y0, sugarRows('galactose', 4), { name: 'galactose' }).s;
    s += T(110, 334, 'C2 epimer of glucose', 'fg-tag-warn');
    s += T(610, 334, 'C4 epimer of glucose', 'fg-tag-warn');
    return s;
  },
  caption: 'Read each shaded row against the same row of glucose in the middle. Every other row matches.',
});

/* ================================================================ 8 ===
   Anomers: alpha- and beta-D-glucopyranose as flat rings seen from above,
   with R or S at each ring stereocenter. The ring is placed as a Haworth
   projection looks from above: ring O at the top right, C1 at the right,
   numbering clockwise; an "up" group in the Haworth is a wedge here. */
function glcRing(cx, cy, anomer) {
  const r = 46;
  const pos = { O: at(P(cx, cy), 60, r), 1: at(P(cx, cy), 0, r), 2: at(P(cx, cy), 300, r),
    3: at(P(cx, cy), 240, r), 4: at(P(cx, cy), 180, r), 5: at(P(cx, cy), 120, r) };
  const order = ['O', '1', '2', '3', '4', '5'];
  let s = '';
  molStart(`glucopyranose ${anomer}`);
  const ids = {};
  for (const k of order) ids[k] = A(k === 'O' ? 'O' : 'C', pos[k]);
  order.forEach((k, i) => {
    const k2 = order[(i + 1) % 6];
    s += bond(pos[k], pos[k2], { rFrom: k === 'O' ? 13 : 0, rTo: k2 === 'O' ? 13 : 0 });
    B(ids[k], ids[k2]);
  });
  const subs = {
    1: ['OH', anomer === 'b' ? 'w' : 'h', anomer === 'b' ? 'R' : 'S', 0],
    2: ['OH', 'h', 'R', 300],
    3: ['OH', 'w', 'S', 240],
    4: ['OH', 'h', 'S', 180],
    5: ['CH₂OH', 'w', 'R', 120],
  };
  let atoms = '';
  for (const [k, [l, kind, lab, deg]] of Object.entries(subs)) {
    const e = at(pos[k], deg, 22 + rOf(l));
    s += stereo(kind, pos[k], e, rOf(l));
    atoms += atom(e.x, e.y, l, { r: rOf(l), kind: k === '1' ? 'hi' : undefined });
    const z = kind === 'w' ? 26 : -26;
    B(ids[k], G(l, e, z, unit(pos[k], e)));
    B(ids[k], A('H', at(pos[k], deg, 16), -z));
    claim(ids[k], lab);
    const t = at(P(cx, cy), deg, r * 0.55);
    s += rs(P(t.x, t.y + 4), lab);
  }
  s += atoms + atom(pos.O.x, pos.O.y, 'O', { r: 13 });
  return s;
}
function anomerFig(stacked) {
  let s = '';
  const one = (cx, cy, a) => {
    s += rich(cx, cy - 92, [a === 'b' ? 'β' : 'α', '-D-glucopyranose'], 'fg-tag');
    s += glcRing(cx, cy, a);
    s += T(cx, cy + 98, a === 'b' ? 'C1: OH on a wedge, R' : 'C1: OH on a hash, S', 'fg-tag-warn');
  };
  if (!stacked) { one(200, 118, 'a'); one(520, 118, 'b'); return s; }
  one(170, 112, 'a'); one(170, 342, 'b');
  return s;
}
FIGURES.push({
  id: 'anomers-ring',
  section: 'diastereomers',
  anchor: '<h3>Epimers and anomers</h3>',
  viewBox: '0 0 720 230',
  alt: 'alpha- and beta-D-glucopyranose drawn as flat six-membered rings seen from above, ring oxygen at the top right and C1 at the right. C2 to C5 are the same in both: C2 R with OH on a hash, C3 S with OH on a wedge, C4 S with OH on a hash, C5 R with CH2OH on a wedge. At C1 the OH is on a hash in alpha (S) and on a wedge in beta (R).',
  build: () => anomerFig(false),
  caption: 'Four of the five ring stereocenters match. Only C1, the carbon bonded to two oxygens, differs.',
});

/* ================================================================ 9 ===
   Syn and anti addition to cyclohexene, shown on a tilted ring so the two
   faces can be seen, and the products drawn flat with R/S. */
const TILT = { bR: [42, -30], R: [84, 0], fR: [42, 30], fL: [-42, 30], L: [-84, 0], bL: [-42, -30] };
function tiltedRing(cx, cy) {
  const k = ['bR', 'R', 'fR', 'fL', 'L', 'bL'];
  const p = Object.fromEntries(k.map((q) => [q, P(cx + TILT[q][0], cy + TILT[q][1])]));
  let s = '';
  k.forEach((q, i) => {
    const q2 = k[(i + 1) % 6];
    if (q === 'fR') s += bond(p.fR, p.fL, { order: 2, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 3 });
    else s += bond(p[q], p[q2], { rFrom: 0, rTo: 0 });
  });
  return { s, p };
}
function diolFlat(cx, cy, k1, k2, l1, l2, name) {
  /* flat-topped hexagon; C1 bottom right, C2 bottom left (the front edge of
     the tilted ring, seen from above) */
  const r = 36;
  const pts = [0, 60, 120, 180, 240, 300].map((d) => at(P(cx, cy), d, r));
  let s = pts.map((q, i) => sk(q, pts[(i + 1) % 6])).join('');
  molStart(`cyclohexane-1,2-diol ${name}`);
  const ids = pts.map((q) => A('C', q));
  ids.forEach((id, i) => B(id, ids[(i + 1) % 6]));
  const put = (i, deg, kind, lab) => {
    const e = at(pts[i], deg, 36);
    s += stereo(kind, pts[i], e, 15) + atom(e.x, e.y, 'OH', { r: 15, kind: 'hi' });
    const z = kind === 'w' ? 26 : -26;
    B(ids[i], A('O', e, z)); B(ids[i], A('H', at(pts[i], deg, 18), -z));
    claim(ids[i], lab);
    const t = at(P(cx, cy), deg, r * 0.5);
    s += rs(P(t.x, t.y + 2), lab);
  };
  put(5, 300, k1, l1); // C1
  put(4, 240, k2, l2); // C2
  return s;
}
function synAntiFig() {
  let s = '';
  const row = (y, syn) => {
    const { s: ring, p } = tiltedRing(120, y);
    s += ring;
    /* where the two OH groups arrive from */
    const a1 = P(p.fL.x, p.fL.y - 58), a2 = syn ? P(p.fR.x, p.fR.y - 58) : P(p.fR.x, p.fR.y + 58);
    s += arrow(a1, P(p.fL.x, p.fL.y - 8), { size: 7 });
    s += arrow(a2, P(p.fR.x, p.fR.y + (syn ? -8 : 8)), { size: 7 });
    s += T(a1.x, a1.y - 6, 'OH', 'fg-lbl');
    s += T(a2.x, a2.y + (syn ? -6 : 16), 'OH', 'fg-lbl');
    s += T(120, y - 50, syn ? 'syn: both from the top face' : 'anti: one from each face', 'fg-tag');
    s += arrow(P(230, y), P(300, y));
    if (syn) {
      s += diolFlat(390, y - 4, 'w', 'w', 'R', 'S', 'cis');
      s += rich(390, y + 70, ['*cis', '-cyclohexane-1,2-diol, (1R,2S)'], 'fg-tag');
      s += T(590, y - 8, 'one compound', 'fg-tag-good');
      s += T(590, y + 10, '(it is achiral: see the next section)', 'fg-sm');
    } else {
      s += diolFlat(390, y - 4, 'w', 'h', 'R', 'R', 'trans RR');
      s += diolFlat(600, y - 4, 'h', 'w', 'S', 'S', 'trans SS');
      s += T(495, y - 4, '+', 'fg-warn');
      s += rich(495, y + 70, ['*trans', '-cyclohexane-1,2-diol: (1R,2R) and (1S,2S), 50:50'], 'fg-tag');
    }
  };
  row(96, true);
  s += rule(20, 190, 700, 190);
  row(282, false);
  return s;
}
FIGURES.push({
  id: 'syn-anti-addition',
  section: 'diastereomers',
  anchor: '<h3>Absolute and relative configuration</h3>',
  viewBox: '0 0 720 370',
  alt: 'Cyclohexene drawn as a tilted ring so its top and bottom faces show, with the C=C at the front edge. Top row, syn addition: both OH groups arrive from the top face, giving cis-cyclohexane-1,2-diol with both OH on wedges, (1R,2S), a single compound. Bottom row, anti addition: one OH arrives from the top and one from the bottom, giving trans-cyclohexane-1,2-diol with one OH on a wedge and one on a hash, formed as an equal mixture of (1R,2R) and (1S,2S).',
  build: synAntiFig,
  caption: 'In the flat drawings the top face of the tilted ring is the face toward you, so an OH that arrived from the top sits on a wedge.',
});

/* =============================================================== 10 ===
   Erythro and threo on a Fischer projection, and the same two compounds
   as zigzags, where the relationship reads the other way round. */
function erythroThreo() {
  let s = '';
  const col = (cx, key) => {
    const ery = key === 'RS';
    s += T(cx, 26, ery ? 'erythro: (2R,3S)' : 'threo: (2R,3R)', 'fg-tag');
    s += fischer(cx, 60, [
      { c: 'CH₃' },
      { l: 'HO', r: 'H', rs: 'R', hi: true },
      ery ? { l: 'Br', r: 'H', rs: 'S', hi: true } : { l: 'H', r: 'Br', rs: 'R', hi: true },
      { c: 'CH₃' },
    ], { name: ery ? 'erythro' : 'threo', dy: 46 }).s;
    s += T(cx, 226, ery ? 'OH and Br on the same side' : 'OH and Br on opposite sides', 'fg-tag-good');
    s += rule(cx - 150, 246, cx + 150, 246);
    s += chain(cx - 63, 338, ISO[key]).s;
    s += T(cx, 414, ery ? 'zigzag: one wedge, one hash (anti)' : 'zigzag: both wedges (syn)', 'fg-tag-warn');
  };
  col(190, 'RS');
  col(530, 'RR');
  return s;
}
FIGURES.push({
  id: 'erythro-threo',
  section: 'diastereomers',
  anchor: '<h3>Absolute and relative configuration</h3>',
  viewBox: '0 0 720 430',
  alt: 'Two stereoisomers of 3-bromobutan-2-ol, each drawn twice. Left, (2R,3S): as a Fischer projection the OH and Br are both on the left, so it is erythro; as a zigzag the OH is on a wedge and the Br on a hash, so it is anti. Right, (2R,3R): as a Fischer projection the OH is on the left and the Br on the right, so it is threo; as a zigzag both are on wedges, so it is syn. R or S is written beside each stereocenter.',
  build: erythroThreo,
  caption: 'Each column is one compound drawn two ways, and the R/S labels match within a column. The same-side relationship in the Fischer projection becomes opposite sides in the zigzag, and the reverse.',
});

export default FIGURES;
