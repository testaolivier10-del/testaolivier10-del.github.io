/* Figures for the skeletal-structures notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   This is the first topic where skeletal drawings are allowed: a carbon is a
   bare corner or line end, and hydrogens on carbon are left off. Where a
   figure fills in what a skeletal drawing hides, it writes the hidden atoms
   and lone pairs out beside the skeletal version, so the two can be compared.

   Notes figures lay their panels side by side. The lesson copies (ids that
   start with l-) stack the same panels vertically at 340 wide and use only
   fg-lbl and fg-tag text, so they stay readable on a phone. A few 340-wide
   figures serve both pages. */
import { atom, bond, wedge, hash, arrow, lonePair, text, tag, label, rule, panel, P } from '../lib/ochem-figure.mjs';
import { sk, polyPts, polyRing, benzene } from '../lib/ochem-skeletal.mjs';
import { skDouble } from '../lib/ochem-helpers.mjs';

const FIGURES = [];
const TOPIC = 'skeletal-structures';

/* ------------------------------------------------------------ helpers ---
   A small molecule drawer. `atoms` maps an id to {x, y, l (label), k (kind:
   'hi' | 'warn'), r (radius)}. An atom with no label is a skeletal corner:
   nothing is drawn there and bonds run right up to it. Bonds are
   [a, b, order, cls, inward]; a double bond between two corners with an
   `inward` point is drawn as one full line plus one inset line on that side.
   `lp` is [atom, angle, muted] (screen degrees: 0 east, 90 down). `charges`
   is [atom, sign, angle, dist]. `notes` is [atom, text, angle, dist, cls]. */
const rad = (a) => a.r ?? (!a.l ? 0 : a.l === 'H' ? 11 : a.l.length === 1 ? 14 : a.l.length === 2 ? 15 : 17);
const at = (p, deg, len) => P(p.x + Math.cos(deg * Math.PI / 180) * len, p.y + Math.sin(deg * Math.PI / 180) * len);
const f2 = (v) => Math.round(v * 100) / 100;

function mol(m) {
  const A = m.atoms;
  let s = '';
  for (const [a, b, order = 1, cls, inward] of m.bonds || []) {
    if (order === 2 && inward) { s += skDouble(A[a], A[b], inward); continue; }
    const rf = rad(A[a]) + (A[a].k ? 2 : 0), rt = rad(A[b]) + (A[b].k ? 2 : 0);
    s += bond(A[a], A[b], { order, cls, rFrom: rf, rTo: rt });
  }
  for (const [id, ang, muted] of m.lp || []) s += lonePair(A[id].x, A[id].y, ang, { muted: !!muted });
  for (const id of Object.keys(A)) {
    const a = A[id];
    if (a.l) s += atom(a.x, a.y, a.l, { kind: a.k, r: rad(a) });
  }
  for (const [id, sign, ang, dist = 26] of m.charges || []) {
    const p = at(A[id], ang, dist);
    s += text(p.x, p.y + 5, sign, { cls: sign.includes('+') ? 'fg-tag' : 'fg-tag-warn', size: 14 });
  }
  for (const [id, t, ang, dist = 24, cls = 'fg-tag-good'] of m.notes || []) {
    const p = at(A[id], ang, dist);
    s += text(p.x, p.y + 4, t, { cls, size: 11 });
  }
  return s;
}

/* Hydrogens on atom `id` at the given angles, named id + 'h' + index. */
function hs(atoms, bonds, id, angles, len = 38) {
  angles.forEach((ang, i) => {
    const k = `${id}h${i}`;
    atoms[k] = { ...at(atoms[id], ang, len), l: 'H' };
    bonds.push([id, k]);
  });
}

const title = (x, y, s) => text(x, y, s, { cls: 'fg-lbl', size: 13 });
const good = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-tag-good', size: 11, ...o });
const warn = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-tag-warn', size: 11, ...o });
const plain = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-tag', size: 11, ...o });
const small = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-sm', size: 10.5, ...o });
/* A group label next to a corner: 'CH₃', 'CH₂', 'CH', 'C'. */
const grp = (p, ang, s, dist = 24) => { const q = at(p, ang, dist); return good(q.x, q.y + 4, s); };
/* A tinted disc behind a corner, to point at it in a question. */
const mark = (p) => `<circle class="fg-atom-warn" cx="${f2(p.x)}" cy="${f2(p.y)}" r="7"></circle>`;
/* A zigzag of n corners, starting low (or high when up = false). */
const zz = (x0, y0, n, dx = 40, dy = 23, up = true) =>
  Array.from({ length: n }, (_, i) => P(x0 + i * dx, y0 + (i % 2 ? (up ? -dy : dy) : 0)));
const chain = (pts, cls) => pts.slice(1).map((p, i) => bond(pts[i], p, { rFrom: 0, rTo: 0, cls })).join('');

/* ============================================= one molecule, three ways === */

function butanolLewis(cx, cy) {
  const A = {}, B = [];
  [cx - 100, cx - 50, cx, cx + 50].forEach((x, i) => {
    A['C' + i] = { x, y: cy, l: 'C' };
    if (i) B.push(['C' + (i - 1), 'C' + i]);
  });
  hs(A, B, 'C0', [180, 270, 90]);
  for (const id of ['C1', 'C2', 'C3']) hs(A, B, id, [270, 90]);
  A.O = { x: cx + 96, y: cy, l: 'O' };
  B.push(['C3', 'O']);
  A.HO = { ...at(A.O, 270, 38), l: 'H' };
  B.push(['O', 'HO']);
  return mol({ atoms: A, bonds: B, lp: [['O', 0], ['O', 90]] });
}

function butanolSkeletal(cx, cy) {
  const v = zz(cx - 80, cy + 11, 4, 40, 22);
  const O = P(cx + 80, cy + 11);
  let s = chain(v);
  s += bond(v[3], O, { rFrom: 0, rTo: 15 });
  s += atom(O.x, O.y, 'OH', { r: 15 });
  v.forEach((p, i) => { s += grp(p, i % 2 ? 270 : 90, i === 0 ? 'CH₃' : 'CH₂', i % 2 ? 18 : 24); });
  return s;
}

FIGURES.push({
  id: 'skeletal-notation',
  section: TOPIC,
  anchor: '<h3>Four rules for reading the drawing</h3>',
  viewBox: '0 0 760 232',
  alt: 'CH3CH2CH2CH2OH drawn three ways. Left, the full Lewis structure: four carbons in a row, each with its hydrogens drawn, then an oxygen with its H and two lone pairs. Middle, the condensed formula. Right, the skeletal structure: a zigzag of three lines ending in a fourth line to OH, with CH3 and CH2 written in small letters at the unlabeled end and corners.',
  build() {
    let s = '';
    s += tag(160, 34, 'FULL LEWIS');
    s += butanolLewis(160, 104);
    s += small(160, 184, '15 atom symbols, every bond drawn');
    s += rule(310, 24, 310, 214);
    s += tag(410, 34, 'CONDENSED');
    s += label(410, 110, 'CH₃CH₂CH₂CH₂OH', { size: 15 });
    s += small(410, 140, 'compact, but no bonds drawn');
    s += rule(510, 24, 510, 214);
    s += tag(630, 34, 'SKELETAL');
    s += butanolSkeletal(630, 104);
    s += small(630, 172, 'every corner and end is a carbon');
    s += small(630, 190, 'H on carbon: worked out, not drawn');
    s += good(630, 210, 'the O and its H are written');
    return s;
  },
  caption: 'The same molecule in three notations. The green CH₃ and CH₂ labels on the skeletal drawing are not part of the notation; they show what each corner and end stands for.',
});

FIGURES.push({
  id: 'l-notation',
  lessons: [TOPIC],
  viewBox: '0 0 340 440',
  alt: 'CH3CH2CH2CH2OH drawn three ways, stacked: the full Lewis structure with every H and the two lone pairs on O; the condensed formula; and the skeletal structure, a zigzag ending in OH, with CH3 and CH2 labels at the end and corners.',
  build() {
    let s = '';
    s += panel(10, 10, 320, 170);
    s += title(170, 32, 'full Lewis structure');
    s += butanolLewis(170, 100);
    s += plain(170, 172, '15 atom symbols, every bond drawn');
    s += panel(10, 190, 320, 80);
    s += title(170, 214, 'condensed formula');
    s += label(170, 250, 'CH₃CH₂CH₂CH₂OH', { size: 15 });
    s += panel(10, 280, 320, 150, { kind: 'hi' });
    s += title(170, 302, 'skeletal structure');
    s += butanolSkeletal(170, 354);
    s += plain(170, 418, 'every corner and end is a carbon');
    return s;
  },
  caption: 'One molecule, three drawings. The green labels show what the skeletal drawing leaves out.',
});

/* Rule 1 on its own: five lines, six carbons. */
FIGURES.push({
  id: 'l-count-ends',
  lessons: [TOPIC],
  viewBox: '0 0 340 150',
  alt: 'A zigzag of five lines. Its six carbons are numbered 1 to 6: carbons 1 and 6 are the two ends, and 2 to 5 are the corners.',
  build() {
    let s = '';
    const v = zz(60, 88, 6, 44, 26);
    s += chain(v);
    v.forEach((p, i) => {
      const end = i === 0 || i === 5;
      s += `<circle class="fg-atom-hi" cx="${f2(p.x)}" cy="${f2(p.y)}" r="${end ? 7 : 5}"></circle>`;
      const q = at(p, i % 2 ? 270 : 90, i % 2 ? 16 : 24);
      s += text(q.x, q.y + 4, String(i + 1), { cls: 'fg-lbl', size: 13 });
    });
    s += good(60, 136, 'end');
    s += good(280, 136, 'end');
    s += plain(170, 136, '5 lines, 6 carbons');
    return s;
  },
  caption: 'Four corners plus two ends: six carbons.',
});

/* Rule 2 on pentane: one line at an end, two at a corner. */
FIGURES.push({
  id: 'l-h-rule',
  lessons: [TOPIC],
  viewBox: '0 0 340 170',
  alt: 'Pentane as a zigzag of four lines. Each end is labeled CH3 and each of the three corners is labeled CH2.',
  build() {
    let s = '';
    const v = zz(70, 90, 5, 50, 28);
    s += chain(v);
    v.forEach((p, i) => { s += grp(p, i % 2 ? 270 : 90, i === 0 || i === 4 ? 'CH₃' : 'CH₂', i % 2 ? 18 : 24); });
    s += plain(170, 144, 'end: 1 line, so 3 H');
    s += plain(170, 162, 'corner: 2 lines, so 2 H');
    return s;
  },
  caption: 'Four minus the lines at each carbon gives its hydrogens.',
});

/* The five-bond slip: the corner IS the carbon. Shared with the lesson. */
FIGURES.push({
  id: 'skeletal-five-bond-slip',
  section: TOPIC,
  lessons: [TOPIC],
  anchor: '<div class="notes-pitfall">',
  viewBox: '0 0 340 266',
  alt: 'Two copies of a three-carbon zigzag with the middle corner written out. Top, written correctly as CH2: two lines plus two H make four bonds. Bottom, written wrongly as CH3: two lines plus three H make five bonds.',
  build() {
    let s = '';
    const row = (y, lbl, kind) => {
      const A = { a: { x: 100, y: y + 28, l: '' }, m: { x: 170, y, l: lbl, k: kind }, b: { x: 240, y: y + 28, l: '' } };
      return mol({ atoms: A, bonds: [['a', 'm'], ['m', 'b']] });
    };
    s += plain(170, 26, 'WRITTEN OUT CORRECTLY');
    s += row(62, 'CH₂', 'hi');
    s += good(170, 118, '2 lines + 2 H = 4 bonds ✓');
    s += rule(20, 138, 320, 138);
    s += plain(170, 160, 'THE FIVE-BOND SLIP');
    s += row(196, 'CH₃', 'warn');
    s += warn(170, 252, '2 lines + 3 H = 5 bonds ✗');
    return s;
  },
  caption: 'Compare the bond totals under the two rows.',
});

/* ======================================== double and triple bonds ======= */

function propene(cx, cy) {
  const v = [P(cx - 50, cy + 14), P(cx, cy - 14), P(cx + 50, cy + 14)];
  let s = sk(v[0], v[1]) + skDouble(v[1], v[2], P(cx - 6, cy + 40));
  s += grp(v[0], 90, 'CH₃') + grp(v[1], 270, 'CH', 18) + grp(v[2], 90, 'CH₂');
  return s;
}
function butyne(cx, cy) {
  const v = [P(cx - 75, cy), P(cx - 25, cy), P(cx + 25, cy), P(cx + 75, cy)];
  let s = sk(v[0], v[1]) + bond(v[1], v[2], { order: 3, rFrom: 0, rTo: 0 }) + sk(v[2], v[3]);
  s += grp(v[0], 90, 'CH₃', 26) + grp(v[1], 90, 'C', 26) + grp(v[2], 90, 'C', 26) + grp(v[3], 90, 'CH₃', 26);
  return s;
}
function butyneEnd(cx, cy) {
  const v0 = P(cx - 60, cy + 12), v1 = P(cx - 20, cy - 11);
  const v2 = at(v1, 30, 46), v3 = at(v2, 30, 46);
  let s = sk(v0, v1) + sk(v1, v2) + bond(v2, v3, { order: 3, rFrom: 0, rTo: 0 });
  s += grp(v0, 90, 'CH₃') + grp(v1, 270, 'CH₂', 18) + grp(v2, 300, 'C', 20) + grp(v3, 0, 'CH', 22);
  return s;
}
const MULTI = [
  { t: 'A DOUBLE BOND', draw: propene, f: 'CH₃–CH=CH₂', a: 'middle C: 2 + 1 = 3 bonds, so 1 H' },
  { t: 'A TRIPLE BOND IN THE CHAIN', draw: butyne, f: 'CH₃–C≡C–CH₃', a: 'each C of C≡C: 3 + 1 = 4 bonds, no H' },
  { t: 'A TRIPLE BOND AT THE END', draw: butyneEnd, f: 'CH₃–CH₂–C≡CH', a: 'end C: 3 bonds, so 1 H' },
];

FIGURES.push({
  id: 'skeletal-multiple-bonds',
  section: TOPIC,
  anchor: '<h3>Four rules for reading the drawing</h3>',
  viewBox: '0 0 760 222',
  alt: 'Three skeletal drawings with the hydrogen count written at each carbon. CH3–CH=CH2: CH3, CH, CH2. CH3–C≡C–CH3, drawn as one straight line: CH3, C, C, CH3. CH3–CH2–C≡CH, a zigzag that turns into a straight line at the triple bond: CH3, CH2, C, CH.',
  build() {
    let s = '';
    MULTI.forEach((m, i) => {
      const cx = 127 + i * 253;
      if (i) s += rule(cx - 126, 24, cx - 126, 210);
      s += tag(cx, 30, m.t);
      s += m.draw(cx, 100);
      s += label(cx, 182, m.f);
      s += small(cx, 204, m.a);
    });
    return s;
  },
  caption: 'The green labels give each carbon with its hydrogens. In the middle and right drawings, find the straight run through the triple bond.',
});

FIGURES.push({
  id: 'l-multiple',
  lessons: [TOPIC],
  viewBox: '0 0 340 550',
  alt: 'Three stacked skeletal drawings with the hydrogen count at each carbon: CH3–CH=CH2 (CH3, CH, CH2); CH3–C≡C–CH3 drawn straight (CH3, C, C, CH3); CH3–CH2–C≡CH (CH3, CH2, C, CH).',
  build() {
    let s = '';
    MULTI.forEach((m, i) => {
      const y = 10 + i * 180;
      s += panel(10, y, 320, 170);
      s += plain(170, y + 22, m.t);
      s += m.draw(170, y + 72);
      s += label(170, y + 136, m.f);
      s += plain(170, y + 157, m.a);
    });
    return s;
  },
  caption: 'A double bond is two of carbon’s four bonds, and a triple bond is three.',
});

/* =============================================== charged atoms ========= */

/* Each drawer takes (cx, cy, filled). `filled` writes the charged atom's
   symbol, lone pairs and charge in full; otherwise it is drawn skeletally. */
function cation(cx, cy, filled) {
  const A = { c: { x: cx, y: cy, l: filled ? 'C' : '', k: filled ? 'hi' : undefined } };
  const B = [];
  [270, 150, 30].forEach((ang, i) => { A['e' + i] = { ...at(A.c, ang, 36), l: '' }; B.push(['c', 'e' + i]); });
  return mol({ atoms: A, bonds: B, charges: [['c', '+', 330, filled ? 26 : 16]] });
}
function carbanion(cx, cy, filled) {
  const A = { c: { x: cx, y: cy, l: filled ? 'C' : '', k: filled ? 'hi' : undefined } };
  const B = [];
  [270, 150, 30].forEach((ang, i) => { A['e' + i] = { ...at(A.c, ang, 36), l: '' }; B.push(['c', 'e' + i]); });
  return mol({ atoms: A, bonds: B, lp: filled ? [['c', 90]] : [], charges: [['c', '−', 330, filled ? 26 : 16]] });
}
function alkoxide(cx, cy, filled, chain2 = false) {
  const A = chain2 ? {
    a: { x: cx - 44, y: cy + 11, l: '' },
    b: { x: cx - 6, y: cy - 11, l: '' },
    o: { x: cx + 32, y: cy + 11, l: 'O', k: filled ? 'hi' : undefined },
  } : {
    b: { x: cx - 24, y: cy - 11, l: '' },
    o: { x: cx + 14, y: cy + 11, l: 'O', k: filled ? 'hi' : undefined },
  };
  const m = { atoms: A, bonds: chain2 ? [['a', 'b'], ['b', 'o']] : [['b', 'o']] };
  if (filled) { m.lp = [['o', 300], ['o', 30], ['o', 120]]; m.charges = [['o', '−', 345, 33]]; }
  else m.charges = [['o', '−', 315, 22]];
  return mol(m);
}
function ammonium(cx, cy, filled) {
  const A = { n: { x: cx, y: cy, l: 'N', k: filled ? 'hi' : undefined } };
  const B = [];
  [0, 90, 180, 270].forEach((ang, i) => { A['e' + i] = { ...at(A.n, ang, 40), l: '' }; B.push(['n', 'e' + i]); });
  return mol({ atoms: A, bonds: B, charges: [['n', '+', 315, filled ? 27 : 24]] });
}
const CHARGED = [
  { t: 'carbocation', draw: cation, tags: ['3 bonds, no H', 'no lone pair'] },
  { t: 'carbanion', draw: carbanion, tags: ['3 bonds, no H', 'one lone pair'] },
  { t: 'O⁻ with one line', draw: (x, y, f) => alkoxide(x, y, f), tags: ['1 bond, no H', 'three lone pairs'] },
  { t: 'N⁺ with four lines', draw: ammonium, tags: ['4 bonds, no H', 'no lone pair'] },
];

FIGURES.push({
  id: 'skeletal-charged-atoms',
  section: TOPIC,
  anchor: '<h3>Charged atoms: what a + or a &minus; does to the hidden half</h3>',
  viewBox: '0 0 760 300',
  alt: 'Four charged atoms, each drawn skeletally on top and filled in below. Carbocation: a carbon with three lines and a plus; filled in, no H and no lone pair. Carbanion: a carbon with three lines and a minus; filled in, one lone pair and no H. Methoxide, a single line ending in an oxygen with a minus; filled in, three lone pairs. A nitrogen with four lines and a plus; filled in, no H and no lone pair.',
  build() {
    let s = '';
    CHARGED.forEach((c, i) => {
      const x = 10 + i * 186, cx = x + 89;
      s += panel(x, 10, 178, 280);
      s += title(cx, 34, c.t);
      s += plain(x + 8, 62, 'drawn', { anchor: 'start' });
      s += c.draw(cx, 96, false);
      s += rule(x + 14, 140, x + 164, 140);
      s += plain(x + 8, 160, 'filled in', { anchor: 'start' });
      s += c.draw(cx, 196, true);
      c.tags.forEach((t, j) => { s += good(cx, 256 + j * 17, t); });
    });
    return s;
  },
  caption: 'Compare each filled-in atom with its neutral form: a neutral carbon has no lone pair, a neutral oxygen two, and a neutral nitrogen one.',
});

FIGURES.push({
  id: 'l-charged',
  lessons: [TOPIC],
  viewBox: '0 0 340 650',
  alt: 'Four stacked rows, each a charged atom drawn skeletally on the left and filled in on the right. Carbocation: no H, no lone pair. Carbanion: one lone pair, no H. Oxygen with one line and a minus: three lone pairs. Nitrogen with four lines and a plus: no H, no lone pair.',
  build() {
    let s = '';
    CHARGED.forEach((c, i) => {
      const y = 10 + i * 160;
      s += panel(10, y, 320, 150);
      s += title(170, y + 22, c.t);
      s += c.draw(86, y + 74, false);
      s += arrow(P(150, y + 74), P(186, y + 74));
      s += c.draw(246, y + 74, true);
      s += good(170, y + 136, c.tags.join(', '));
    });
    return s;
  },
  caption: 'Left, as drawn; right, with the hidden hydrogens and lone pairs filled in.',
});

/* Acetate, as drawn and filled in. */
function acetate(cx, cy, filled) {
  const A = {
    c1: { x: cx - 48, y: cy + 14, l: filled ? 'H₃C' : '' },
    c2: { x: cx, y: cy - 12, l: filled ? 'C' : '' },
    ot: { x: cx, y: cy - 58, l: 'O' },
    om: { x: cx + 46, y: cy + 14, l: 'O' },
  };
  const m = { atoms: A, bonds: [['c1', 'c2'], ['c2', 'ot', 2], ['c2', 'om']] };
  if (filled) {
    m.lp = [['ot', 210], ['ot', 330], ['om', 300], ['om', 30], ['om', 120]];
    m.charges = [['om', '−', 347, 34]];
  } else {
    m.charges = [['om', '−', 315, 22]];
  }
  return mol(m);
}

FIGURES.push({
  id: 'skeletal-acetate',
  section: TOPIC,
  anchor: '<span class="k">Worked example &mdash; every atom of skeletal acetate</span>',
  viewBox: '0 0 760 232',
  alt: 'Acetate drawn skeletally on the left: a line from a bare end to a corner, a double bond up to O, and a single bond down to O with a minus. On the right, filled in: H3C on the left carbon, C with no H in the middle, two lone pairs on the double-bonded O, and three lone pairs and a minus on the single-bonded O.',
  build() {
    let s = '';
    s += tag(200, 28, 'AS DRAWN');
    s += acetate(200, 134, false);
    s += rule(380, 20, 380, 220);
    s += tag(560, 28, 'FILLED IN');
    const cx = 540, cy = 134;
    s += acetate(cx, cy, true);
    s += good(cx - 48, cy + 50, '3 H');
    s += good(cx + 18, cy - 20, 'C: 4 bonds, no H', { anchor: 'start' });
    s += good(cx + 34, cy - 54, 'O: 2 lone pairs', { anchor: 'start' });
    s += good(cx + 46, cy + 62, 'O⁻: 3 lone pairs');
    return s;
  },
  caption: 'Every lone pair in the right-hand drawing is one that the left-hand drawing leaves out.',
});

/* ============================================ reading one back ========= */

FIGURES.push({
  id: 'skeletal-h-count',
  section: TOPIC,
  lessons: [TOPIC],
  anchor: 'they were subtracted.</p>',
  viewBox: '0 0 340 240',
  alt: 'A five-carbon zigzag with OH on the second carbon. Under each carbon, its bond count (1, 3, 2, 2, 1) and what it is (CH3, CH, CH2, CH2, CH3).',
  build() {
    let s = '';
    const v = zz(80, 140, 5, 50, 29);
    s += chain(v);
    const O = P(v[1].x, 64);
    s += bond(v[1], O, { rFrom: 0, rTo: 17 });
    s += atom(O.x, O.y, 'OH', { kind: 'hi' });
    s += plain(14, 182, 'bonds', { anchor: 'start' });
    s += plain(14, 202, 'carbon', { anchor: 'start' });
    ['1', '3', '2', '2', '1'].forEach((b, i) => { s += plain(v[i].x, 182, b); });
    ['CH₃', 'CH', 'CH₂', 'CH₂', 'CH₃'].forEach((g, i) => { s += good(v[i].x + (i === 0 ? 4 : 0), 202, g); });
    s += label(170, 230, 'CH₃CH(OH)CH₂CH₂CH₃');
    return s;
  },
  caption: 'Read each column from top to bottom: the bonds at that carbon, then what the carbon is.',
});

/* 2-methylbutane, methylcyclohexane and 2-methylbut-2-ene. */
function branched(cx, cy, opts = {}) {
  const v = [P(cx - 60, cy + 12), P(cx - 20, cy - 11), P(cx + 20, cy + 12), P(cx + 60, cy - 11)];
  const tip = P(cx - 20, cy - 57);
  let s = sk(v[0], v[1]) + sk(v[2], v[3]) + sk(v[1], tip);
  s += opts.alkene ? skDouble(v[1], v[2], P(cx - 12, cy + 34)) : sk(v[1], v[2]);
  if (opts.labels !== false) {
    s += grp(v[0], 90, 'CH₃') + grp(v[1], 210, opts.alkene ? 'C' : 'CH', 24);
    s += grp(v[2], 90, opts.alkene ? 'CH' : 'CH₂') + grp(v[3], 270, 'CH₃', 18) + grp(tip, 270, 'CH₃', 16);
  }
  return { s, v, tip };
}
function methylRing(cx, cy, r, labels = true) {
  const pts = polyPts(cx, cy, 6, r, 90);
  const tip = P(cx, cy - r - 42);
  let s = polyRing(pts) + sk(pts[0], tip);
  if (labels) {
    s += grp(pts[0], 210, 'CH', 24) + grp(tip, 270, 'CH₃', 16);
    for (let i = 1; i < 6; i++) {
      const q = at(P(cx, cy), -(90 + i * 60), r + 20);
      s += good(q.x, q.y + 4, 'CH₂');
    }
  }
  return { s, pts, tip };
}

FIGURES.push({
  id: 'skeletal-three-more',
  section: TOPIC,
  anchor: '<span class="k">Three more, in the same three steps</span>',
  viewBox: '0 0 760 262',
  alt: 'Three skeletal drawings with what each carbon is written beside it. A four-carbon zigzag with a branch up from the second corner: CH3, CH, CH2, CH3, and CH3 on the branch. A hexagon with a line up from its top corner: that corner is CH, the other five are CH2, and the line end is CH3. The branched chain again with a double bond between the second and third carbons: CH3, C, CH, CH3, and CH3 on the branch.',
  build() {
    let s = '';
    s += tag(127, 26, 'A BRANCHED CHAIN');
    s += branched(127, 148).s;
    s += label(127, 232, '(CH₃)₂CHCH₂CH₃');
    s += small(127, 250, 'C₅H₁₂');
    s += rule(253, 20, 253, 250);
    s += tag(380, 26, 'A RING WITH A BRANCH');
    s += methylRing(380, 150, 36).s;
    s += label(380, 232, 'C₆H₁₁–CH₃');
    s += small(380, 250, 'C₇H₁₄');
    s += rule(507, 20, 507, 250);
    s += tag(633, 26, 'A DOUBLE BOND');
    s += branched(633, 148, { alkene: true }).s;
    s += label(633, 232, '(CH₃)₂C=CHCH₃');
    s += small(633, 250, 'C₅H₁₀');
    return s;
  },
  caption: 'The three molecules of the example, with each carbon labeled by its hydrogens.',
});

/* Two counting traps: an O at a bend, and the H of an O–H. */
FIGURES.push({
  id: 'skeletal-traps',
  section: TOPIC,
  anchor: '<div class="notes-pitfall">Two traps',
  viewBox: '0 0 760 216',
  alt: 'Left: a zigzag of five lines with an O at the third position; the five carbons are numbered 1 to 5 and the O is marked as not a carbon. Right: a three-carbon zigzag ending in O, with a line from the O to a written H; the three carbons are numbered and the H is marked as a written hydrogen, not a carbon.',
  build() {
    let s = '';
    s += tag(190, 28, 'AN O AT A BEND');
    const a = zz(80, 118, 6, 44, 24);
    const A = {};
    a.forEach((p, i) => { A['v' + i] = { ...p, l: i === 2 ? 'O' : '', k: i === 2 ? 'warn' : undefined }; });
    s += mol({ atoms: A, bonds: [0, 1, 2, 3, 4].map((i) => ['v' + i, 'v' + (i + 1)]) });
    let n = 1;
    a.forEach((p, i) => {
      if (i === 2) return;
      const q = at(p, i % 2 ? 270 : 90, i % 2 ? 16 : 24);
      s += text(q.x, q.y + 4, String(n++), { cls: 'fg-lbl', size: 13 });
    });
    s += warn(a[2].x, a[2].y + 34, 'not a carbon');
    s += small(190, 196, '5 lines, 5 carbons: one bend is the O');
    s += rule(380, 20, 380, 206);
    s += tag(570, 28, 'AN H ON O');
    const b = zz(480, 118, 4, 44, 24);
    const B = { v0: { ...b[0], l: '' }, v1: { ...b[1], l: '' }, v2: { ...b[2], l: '' }, o: { ...b[3], l: 'O' }, h: { x: b[3].x + 44, y: 118, l: 'H', k: 'warn' } };
    s += mol({ atoms: B, bonds: [['v0', 'v1'], ['v1', 'v2'], ['v2', 'o'], ['o', 'h']] });
    [0, 1, 2].forEach((i) => {
      const q = at(b[i], i % 2 ? 270 : 90, i % 2 ? 16 : 24);
      s += text(q.x, q.y + 4, String(i + 1), { cls: 'fg-lbl', size: 13 });
    });
    s += warn(b[3].x + 44, 152, 'a written H');
    s += small(570, 196, '3 carbons: the H is an atom, not a chain end');
    return s;
  },
  caption: 'On the left, the numbers skip the O; on the right, they stop before the written H.',
});

/* ===================================== one molecule, several drawings === */

const BASE = [P(-68, 10), P(-34, -10), P(0, 10), P(34, -10), P(68, 10)];
function drawVariant(cx, cy, tf, ohAt, ohDir) {
  const v = BASE.map((p) => { const q = tf(p); return P(cx + q.x, cy + q.y); });
  const d = tf(ohDir);
  const O = P(v[ohAt].x + d.x, v[ohAt].y + d.y);
  let s = chain(v);
  s += bond(v[ohAt], O, { rFrom: 0, rTo: 15 });
  s += atom(O.x, O.y, 'OH', { r: 15 });
  return s;
}
const SAME = [
  { t: 'AS FIRST DRAWN', tf: (p) => p, oh: 1, dir: P(0, -38), ok: true, n: 'OH on carbon 2 of 5' },
  { t: 'MIRRORED', tf: (p) => P(-p.x, p.y), oh: 1, dir: P(0, -38), ok: true, n: 'OH on carbon 2 of 5' },
  { t: 'TURNED UPRIGHT', tf: (p) => P(-p.y, p.x), oh: 1, dir: P(0, -38), ok: true, n: 'OH on carbon 2 of 5' },
  { t: 'OH MOVED', tf: (p) => P(p.x, -p.y), oh: 2, dir: P(0, -38), ok: false, n: 'OH on carbon 3 of 5' },
];

FIGURES.push({
  id: 'skeletal-same-molecule',
  section: TOPIC,
  anchor: '<h3>One molecule, several drawings</h3>',
  viewBox: '0 0 760 262',
  alt: 'Four skeletal drawings of five-carbon chains with an OH. The first three are the same compound drawn differently: as first drawn, mirrored left to right, and turned upright; each has the OH on the second carbon from an end. The fourth has the OH on the middle carbon and is a different compound.',
  build() {
    let s = '';
    SAME.forEach((m, i) => {
      const x = 10 + i * 186, cx = x + 89;
      s += panel(x, 10, 178, 242, m.ok ? {} : { kind: 'warn' });
      s += plain(cx, 34, m.t);
      s += drawVariant(cx, i === 2 ? 130 : 124, m.tf, m.oh, m.dir);
      s += (m.ok ? good : warn)(cx, 222, m.ok ? 'same compound' : 'different compound');
      s += plain(cx, 240, m.n, { cls: 'fg-sm', size: 10.5 });
    });
    return s;
  },
  caption: 'Compare what each OH is joined to, not where it sits on the page.',
});

/* Drawn angle against real angle. */
FIGURES.push({
  id: 'skeletal-angles',
  section: TOPIC,
  anchor: 'get their own notation.</p>',
  viewBox: '0 0 760 220',
  alt: 'Left: three carbons of a zigzag, with the angle at the middle corner marked 120 degrees, as drawn on paper. Right: the same three carbons with the two hydrogens on the middle carbon drawn, one on a solid wedge toward the viewer and one on a dashed bond away, and the C–C–C angle drawn and marked at about 109.5 degrees.',
  build() {
    let s = '';
    s += tag(190, 28, 'ON PAPER');
    const m = P(190, 96), l = P(130, 131), r = P(250, 131);
    s += sk(l, m) + sk(m, r);
    const p1 = at(m, 30.26, 22), p2 = at(m, 149.74, 22);
    s += `<path class="fg-bond-soft" fill="none" d="M${f2(p1.x)} ${f2(p1.y)} A22 22 0 0 1 ${f2(p2.x)} ${f2(p2.y)}"></path>`;
    s += label(190, 140, '120°');
    s += small(190, 184, 'drawn at 120° to spread the chain evenly');
    s += rule(380, 20, 380, 206);
    s += tag(570, 28, 'IN THE MOLECULE');
    const m2 = P(570, 108), l2 = at(m2, 144.75, 70), r2 = at(m2, 35.25, 70);
    s += sk(l2, m2) + sk(m2, r2);
    const q1 = at(m2, 35.25, 22), q2 = at(m2, 144.75, 22);
    s += `<path class="fg-bond-soft" fill="none" d="M${f2(q1.x)} ${f2(q1.y)} A22 22 0 0 1 ${f2(q2.x)} ${f2(q2.y)}"></path>`;
    s += label(570, 154, '109.5°');
    const h1 = at(m2, 230, 40), h2 = at(m2, 310, 40);
    s += wedge(m2, h1, { rFrom: 0, rTo: 11, width: 8 }) + atom(h1.x, h1.y, 'H', { r: 11 });
    s += hash(m2, h2, { rFrom: 0, rTo: 11, width: 9, rungs: 4 }) + atom(h2.x, h2.y, 'H', { r: 11 });
    s += small(570, 184, 'real C–C–C angle: about 109.5°');
    s += small(570, 202, 'wedge: toward you · dash: away from you');
    return s;
  },
  caption: 'Left, the angle as chemists draw it; right, the angle the carbon actually holds.',
});

/* ============================== condensed formula to skeletal drawing === */

FIGURES.push({
  id: 'skeletal-condensed-pairs',
  section: TOPIC,
  anchor: '<h3>Reading the condensed form</h3>',
  viewBox: '0 0 760 224',
  alt: 'Three condensed formulas, each with its skeletal drawing below. CH3CH(OH)CH3: a two-line V with OH up from the middle corner. (CH3)2CHCH2OH: a corner carrying two highlighted methyl lines, then a CH2 corner and an OH. (CH3)3COH: a central carbon with three highlighted methyl lines and a fourth line to OH.',
  build() {
    let s = '';
    // CH3CH(OH)CH3
    s += label(127, 36, 'CH₃CH(OH)CH₃', { size: 15 });
    const a = [P(80, 150), P(127, 123), P(174, 150)];
    s += chain(a) + bond(a[1], P(127, 80), { rFrom: 0, rTo: 15 }) + atom(127, 80, 'OH', { r: 15 });
    s += good(127, 200, 'the OH is on the middle carbon');
    s += rule(253, 20, 253, 210);
    // (CH3)2CHCH2OH
    s += label(380, 36, '(CH₃)₂CHCH₂OH', { size: 15 });
    const me1 = P(320, 150), ch = P(360, 127), ch2 = P(400, 150), O = P(440, 127), me2 = P(360, 81);
    s += sk(me1, ch, true) + sk(me2, ch, true) + sk(ch, ch2);
    s += bond(ch2, O, { rFrom: 0, rTo: 15 }) + atom(O.x, O.y, 'OH', { r: 15 });
    s += good(380, 200, '(CH₃)₂CH–: two CH₃ on one CH');
    s += rule(507, 20, 507, 210);
    // (CH3)3COH
    s += label(633, 36, '(CH₃)₃COH', { size: 15 });
    const c = P(620, 130);
    s += sk(c, P(620, 92), true) + sk(c, P(582, 130), true) + sk(c, P(620, 168), true);
    s += bond(c, P(664, 130), { rFrom: 0, rTo: 15 }) + atom(664, 130, 'OH', { r: 15 });
    s += good(633, 200, '(CH₃)₃C–: three CH₃, no H');
    return s;
  },
  caption: 'Each condensed formula above its skeletal drawing. The highlighted lines are the bracketed CH₃ groups.',
});

/* ===================================================== rings ============ */

function bareHex(cx, cy, r) { return polyRing(polyPts(cx, cy, 6, r, 90)); }
function benzeneTwo(cx1, cx2, cy, r) {
  let s = benzene(cx1, cy, r).svg;
  s += polyRing(polyPts(cx2, cy, 6, r, 90));
  s += `<circle class="fg-bond" cx="${cx2}" cy="${cy}" r="${f2(r * 0.6)}" fill="none"></circle>`;
  return s;
}

FIGURES.push({
  id: 'skeletal-rings',
  section: TOPIC,
  anchor: '<h3>Rings, and why they are the clearest case for the notation</h3>',
  viewBox: '0 0 760 230',
  alt: 'Left: a bare hexagon, cyclohexane, C6H12, with two H on each corner. Right: benzene, C6H6, drawn two ways: a hexagon with three alternating double bonds, and a hexagon with a circle inside.',
  build() {
    let s = '';
    s += tag(190, 28, 'A BARE HEXAGON');
    s += bareHex(190, 112, 46);
    s += good(190, 190, 'two H on each corner: C₆H₁₂');
    s += label(190, 212, 'cyclohexane');
    s += rule(380, 20, 380, 216);
    s += tag(570, 28, 'BENZENE, TWO WAYS');
    s += benzeneTwo(505, 635, 112, 46);
    s += good(570, 190, 'one H on each corner: C₆H₆');
    s += label(570, 212, 'benzene');
    return s;
  },
  caption: 'On the left, one ring with nothing added; on the right, one molecule in its two usual drawings.',
});

FIGURES.push({
  id: 'l-rings',
  lessons: [TOPIC],
  viewBox: '0 0 340 390',
  alt: 'Two stacked panels. A bare hexagon: cyclohexane, C6H12, two H on each corner. Benzene, C6H6, drawn with three alternating double bonds and with a circle inside the hexagon.',
  build() {
    let s = '';
    s += panel(10, 10, 320, 180);
    s += title(170, 32, 'a bare hexagon: cyclohexane');
    s += bareHex(170, 100, 42);
    s += good(170, 172, 'two H on each corner: C₆H₁₂');
    s += panel(10, 200, 320, 180);
    s += title(170, 222, 'benzene, two ways');
    s += benzeneTwo(110, 230, 290, 42);
    s += good(170, 362, 'one H on each corner: C₆H₆');
    return s;
  },
  caption: 'A ring corner is read like any other corner.',
});

/* ================================================= question figures ===== */

FIGURES.push({
  id: 'l-q-branch',
  lessons: [TOPIC],
  viewBox: '0 0 340 150',
  alt: 'A four-carbon zigzag with a line up from the second corner. That corner is highlighted with a question mark.',
  build() {
    const { s, v } = branched(170, 110, { labels: false });
    return s + mark(v[1]) + warn(v[1].x - 22, v[1].y - 8, '?', { size: 14 });
  },
  caption: 'How many hydrogens are on the highlighted carbon?',
});

FIGURES.push({
  id: 'l-q-alkene',
  lessons: [TOPIC],
  viewBox: '0 0 340 150',
  alt: 'A four-carbon zigzag with a line up from the second corner and a double bond from the second corner to the third. The second corner is highlighted with a question mark.',
  build() {
    const { s, v } = branched(170, 110, { labels: false, alkene: true });
    return s + mark(v[1]) + warn(v[1].x - 22, v[1].y - 8, '?', { size: 14 });
  },
  caption: 'How many hydrogens are on the highlighted carbon?',
});

FIGURES.push({
  id: 'l-hetero',
  lessons: [TOPIC],
  viewBox: '0 0 340 170',
  alt: 'CH3CH2CH2OH drawn skeletally: a zigzag ending in an OH label. The two lone pairs on the O are shown faintly, labeled not drawn but there.',
  build() {
    let s = '';
    const v = zz(60, 108, 4, 50, 28);
    const A = { v0: { ...v[0], l: '' }, v1: { ...v[1], l: '' }, v2: { ...v[2], l: '' }, o: { ...v[3], l: 'OH', k: 'hi' } };
    s += mol({ atoms: A, bonds: [['v0', 'v1'], ['v1', 'v2'], ['v2', 'o']], lp: [['o', 250, true], ['o', 330, true]] });
    s += plain(190, 34, 'lone pairs: left off, but there');
    s += good(v[3].x + 10, 150, 'H on O: written');
    s += plain(110, 150, 'H on C: left off');
    return s;
  },
  caption: 'The O and its H are written. The lone pairs are usually left off.',
});

FIGURES.push({
  id: 'l-q-count',
  lessons: [TOPIC],
  viewBox: '0 0 340 130',
  alt: 'A skeletal drawing: HO at the left end, a zigzag of three carbons, and NH2 at the right end.',
  build() {
    const A = {
      o: { x: 58, y: 88, l: 'HO' }, v1: { x: 108, y: 60, l: '' }, v2: { x: 158, y: 88, l: '' },
      v3: { x: 208, y: 60, l: '' }, n: { x: 258, y: 88, l: 'NH₂' },
    };
    return mol({ atoms: A, bonds: [['o', 'v1'], ['v1', 'v2'], ['v2', 'v3'], ['v3', 'n']] });
  },
  caption: 'How many hydrogens does this molecule have in all?',
});

FIGURES.push({
  id: 'l-q-alkoxide',
  lessons: [TOPIC],
  viewBox: '0 0 340 120',
  alt: 'A skeletal drawing: a two-carbon zigzag ending at an O with a minus charge.',
  build() {
    return alkoxide(170, 64, false, true);
  },
  caption: 'How many H and how many lone pairs does the oxygen carry?',
});

FIGURES.push({
  id: 'l-q-ring',
  lessons: [TOPIC],
  viewBox: '0 0 340 170',
  alt: 'A hexagon with one line drawn up from its top corner.',
  build() {
    return methylRing(170, 110, 38, false).s;
  },
  caption: 'What is the molecular formula?',
});

FIGURES.push({
  id: 'l-q-slip',
  lessons: [TOPIC],
  viewBox: '0 0 340 192',
  alt: 'A student’s redraw of a chain: a four-carbon zigzag whose second carbon has a line up to a branch and a line down to OH. The student has written CH at that carbon.',
  build() {
    const A = {
      v0: { x: 90, y: 104, l: '' }, v1: { x: 140, y: 76, l: 'CH', k: 'warn' }, v2: { x: 190, y: 104, l: '' },
      v3: { x: 240, y: 76, l: '' }, t: { x: 140, y: 24, l: '' }, o: { x: 140, y: 140, l: 'OH' },
    };
    return mol({ atoms: A, bonds: [['v0', 'v1'], ['v1', 'v2'], ['v2', 'v3'], ['v1', 't'], ['v1', 'o']] }) +
      plain(170, 180, 'the student’s redraw');
  },
  caption: 'What is wrong with the label on the carbon that carries the OH?',
});

export default FIGURES;
