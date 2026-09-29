/* Figures for the meso notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Most drawings here use one layout, the "lined-up" (eclipsed) drawing of
   an X-CH(Y)-CH(Y)-X chain: the C2-C3 bond runs across the page, each end
   group X sits in the page below its carbon, and each Y sits above on a
   wedge or a hash with the H in the other slot. With both Y on wedges the
   vertical line through the middle of the C2-C3 bond is a mirror plane.
   Inverting one center is visibly "swap that wedge for a hash".

   Every drawing that carries an R/S label also records its atoms in CHECKS
   (z toward the reader for a wedge or a Fischer horizontal, away for a hash
   or a Fischer vertical). A script outside the site rebuilds each molecule
   in 3D and compares the CIP label RDKit assigns with the label drawn.
   Nothing on the site uses CHECKS.

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
/* A text line whose parts may be italic: a part starting with '*' is set in
   italic (for cis, trans, meso, anti, syn). */
function rich(x, y, parts, cls = 'fg-tag', anchor = 'middle') {
  const body = parts.map((p) => (p[0] === '*'
    ? `<tspan font-style="italic">${p.slice(1)}</tspan>` : p.replace(/&/g, '&amp;'))).join('');
  return `<text class="${cls}" x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}" font-size="${SIZE[cls] ?? 11}">${body}</text>`;
}
const rOf = (l) => (l === 'H' ? 12 : [...l].length <= 2 ? 15 : [...l].length === 3 ? 17 : 21);
const stereo = (kind, a, b, rTo, rFrom = 0) => (kind === 'w'
  ? wedge(a, b, { rFrom, rTo, width: 9 })
  : hash(a, b, { rFrom, rTo, width: 11, rungs: 5 }));
const plain = (a, b, rTo, rFrom = 0) => bond(a, b, { rFrom, rTo });
/* A dashed line: a mirror plane seen edge-on, or a line that fails to be one. */
const dashLine = (a, b, cls = 'fg-dash-hi') =>
  `<line class="${cls}" x1="${r2(a.x)}" y1="${r2(a.y)}" x2="${r2(b.x)}" y2="${r2(b.y)}"></line>`;
const dot = (p, r = 3.5) => `<circle class="fg-atom-hi" cx="${r2(p.x)}" cy="${r2(p.y)}" r="${r}"></circle>`;

/* ------------------------------------------------ the 3D check record --- */
export const CHECKS = [];
let CUR = null;
function molStart(name, extra = {}) { CUR = { name, atoms: [], bonds: [], claims: {}, ...extra }; CHECKS.push(CUR); }
function A(el, p, z = 0) { CUR.atoms.push({ el, x: r2(p.x), y: r2(p.y), z: r2(z) }); return CUR.atoms.length - 1; }
function B(i, j, o = 1) { CUR.bonds.push([i, j, o]); }
const claim = (i, s) => { CUR.claims[i] = s; };
const Z = { w: 26, h: -26, p: 0 };
/* A group label as atoms, with enough of the group that CIP ranks it right. */
function G(label, p, z) {
  switch (label) {
    case 'OH': return A('O', p, z);
    case 'Br': return A('Br', p, z);
    case 'Cl': return A('Cl', p, z);
    case 'H': return A('H', p, z);
    case 'CH₃': return A('C', p, z);
    case 'COOH': {
      const c = A('C', p, z);
      B(c, A('O', P(p.x + 8, p.y + 10), z), 2);
      B(c, A('O', P(p.x - 8, p.y + 10), z));
      return c;
    }
    default: throw new Error('no group ' + label);
  }
}

/* ---------------------------------------------- the lined-up drawing --- */
/* lined(cx, cy, o): the C2-C3 bond centred on (cx, cy), `half` either side.
   o.end: the end group (COOH, CH3), in the page below each carbon.
   o.L / o.R: { g: group label, k: 'w' | 'h', rs: 'R' | 'S', n: 'C2' | 'C3' }
   for the left and right carbons. The H takes the other kind of bond.
   o.plane: 'good' draws the mirror plane, 'bad' a dashed line that is not
   one, and nothing otherwise. */
function lined(cx, cy, o) {
  const half = o.half ?? 35;
  const cL = P(cx - half, cy), cR = P(cx + half, cy);
  let s = sk(cL, cR);
  molStart(o.check || 'lined');
  const iL = A('C', cL), iR = A('C', cR);
  B(iL, iR);
  const side = (c, iC, sgn, d) => {
    /* sgn -1 for the left carbon, +1 for the right: the right carbon's
       angles are the left carbon's reflected through the vertical. */
    const ang = (a) => (sgn < 0 ? a : 180 - a);
    const endP = at(c, ang(240), 48), gP = at(c, ang(110), 46), hP = at(c, ang(165), 40);
    s += plain(c, endP, rOf(o.end)) + atom(endP.x, endP.y, o.end, { r: rOf(o.end) });
    const hk = d.k === 'w' ? 'h' : 'w';
    s += stereo(d.k, c, gP, rOf(d.g)) + atom(gP.x, gP.y, d.g, { r: rOf(d.g), kind: d.hi === false ? 'plain' : 'hi' });
    s += stereo(hk, c, hP, 12) + atom(hP.x, hP.y, 'H', { r: 12 });
    const rsP = at(c, ang(300), 25);
    s += T(rsP.x, rsP.y + 4, d.rs, 'fg-tag-good');
    if (d.n) { const nP = at(c, ang(42), 21); s += T(nP.x, nP.y + 2, d.n, 'fg-tag'); }
    B(iC, G(o.end, endP, 0));
    B(iC, G(d.g, gP, Z[d.k]));
    B(iC, A('H', hP, Z[hk]));
    claim(iC, d.rs);
  };
  side(cL, iL, -1, o.L);
  side(cR, iR, +1, o.R);
  if (o.plane === 'good') {
    s += dashLine(P(cx, cy - 74), P(cx, cy + 66));
    s += T(cx, cy - 82, 'mirror plane', 'fg-tag-good');
  } else if (o.plane === 'bad') {
    s += dashLine(P(cx, cy - 74), P(cx, cy + 66), 'fg-dash');
    s += T(cx, cy - 82, 'not a mirror plane', 'fg-tag-warn');
  }
  return s;
}

/* Tartaric acid in the lined-up drawing. With OH on a wedge, the left
   carbon is S and the right carbon is R; on a hash, the reverse. The left
   carbon is called C3 so that the meso form reads (2R,3S). */
const TART = {
  RR:   { L: { g: 'OH', k: 'h', rs: 'R', n: 'C3' }, R: { g: 'OH', k: 'w', rs: 'R', n: 'C2' } },
  SS:   { L: { g: 'OH', k: 'w', rs: 'S', n: 'C3' }, R: { g: 'OH', k: 'h', rs: 'S', n: 'C2' } },
  meso: { L: { g: 'OH', k: 'w', rs: 'S', n: 'C3' }, R: { g: 'OH', k: 'w', rs: 'R', n: 'C2' } },
  meso2: { L: { g: 'OH', k: 'h', rs: 'R', n: 'C3' }, R: { g: 'OH', k: 'h', rs: 'S', n: 'C2' } },
};
const tart = (cx, cy, key, extra = {}) => lined(cx, cy, { end: 'COOH', ...TART[key], check: `tartaric ${key}`, ...extra });

/* ======================================================= tartaric-three ===
   The three stereoisomers of tartaric acid, in the same drawing. */
FIGURES.push({
  id: 'tartaric-three',
  section: 'meso',
  anchor: 'on wedges or hashes.</p>',
  viewBox: '0 0 760 300',
  alt: 'The three stereoisomers of tartaric acid, each drawn with the C2–C3 bond across the page, both COOH groups in the page below, and the two OH groups above on wedges or hashes. Left, (2R,3R): one OH on a hash and one on a wedge. Middle, (2S,3S): the same with every wedge and hash swapped; the two are mirror images, enantiomers, with specific rotations of +12 and −12 degrees. Right, meso-tartaric acid, (2R,3S): both OH groups on wedges, and a dashed vertical mirror plane through the middle of the C2–C3 bond reflects one half onto the other. Its specific rotation is zero.',
  build() {
    let s = '';
    s += T(130, 24, '(2R,3R)', 'fg-lbl');
    s += tart(130, 130, 'RR');
    s += T(130, 246, '[α] = +12°', 'fg-tag');
    s += T(380, 24, '(2S,3S)', 'fg-lbl');
    s += tart(380, 130, 'SS');
    s += T(380, 246, '[α] = −12°', 'fg-tag');
    s += T(255, 270, 'mirror images: a pair of enantiomers', 'fg-tag-warn');
    s += rule(505, 20, 505, 286);
    s += rich(632, 24, ['*meso', ', (2R,3S)'], 'fg-lbl');
    s += tart(632, 130, 'meso', { plane: 'good' });
    s += T(632, 246, '[α] = 0', 'fg-tag');
    s += T(632, 270, 'its own mirror image: achiral', 'fg-tag-good');
    return s;
  },
  caption: 'Compare the two OH bonds in each drawing. A wedge and a hash give a chiral molecule. Two wedges give the molecule with a mirror plane.',
});

/* The lesson copy: the meso form alone. */
FIGURES.push({
  id: 'l-tartaric-meso',
  lessons: ['meso'],
  viewBox: '0 0 340 250',
  alt: 'meso-Tartaric acid drawn with the C2–C3 bond across the page, both COOH groups below in the page and both OH groups above on wedges, with H on hashes. C3 on the left is S and C2 on the right is R. A dashed vertical mirror plane through the middle of the C2–C3 bond reflects the left half onto the right half.',
  build() {
    let s = rich(170, 22, ['*meso', '-tartaric acid, (2R,3S)'], 'fg-lbl');
    s += tart(170, 126, 'meso', { plane: 'good' });
    s += T(170, 234, 'OH onto OH, H onto H, COOH onto COOH', 'fg-tag');
    return s;
  },
  caption: 'Fold the drawing along the dashed line: every group lands on an identical group.',
});

/* The lesson's counting step: all four R/S combinations. */
FIGURES.push({
  id: 'l-tartaric-four',
  lessons: ['meso'],
  viewBox: '0 0 340 470',
  alt: 'Four drawings of tartaric acid in the same layout, in a two-by-two grid. Top left (2R,3R): the OH on C3 is on a hash and the OH on C2 on a wedge. Top right (2S,3S): the OH on C3 is on a wedge and the OH on C2 on a hash. Bottom left (2R,3S): both OH groups on wedges. Bottom right (2S,3R): both OH groups on hashes.',
  build() {
    let s = '';
    const d = { half: 26 };
    s += T(85, 22, '(2R,3R)', 'fg-lbl') + tart(85, 124, 'RR', d);
    s += T(255, 22, '(2S,3S)', 'fg-lbl') + tart(255, 124, 'SS', d);
    s += rule(10, 236, 330, 236);
    s += T(85, 258, '(2R,3S)', 'fg-lbl') + tart(85, 360, 'meso', d);
    s += T(255, 258, '(2S,3R)', 'fg-lbl') + tart(255, 360, 'meso2', d);
    return s;
  },
  caption: 'Every combination of R and S at the two carbons, each drawn the same way.',
});

/* ================================================== meso-conformations ===
   meso-Tartaric acid in its zigzag (anti) conformation, where there is no
   mirror plane but there is a center of symmetry, and after a half turn
   about C2-C3, where the plane shows. */
function zigzagMeso(x0, y0) {
  const c1 = P(x0, y0), c2 = P(x0 + 46, y0 - 27), c3 = P(x0 + 92, y0), c4 = P(x0 + 138, y0 - 27);
  let s = plain(c2, c1, 21) + atom(c1.x, c1.y, 'COOH', { r: 21 });
  s += sk(c2, c3);
  s += plain(c3, c4, 21) + atom(c4.x, c4.y, 'COOH', { r: 21 });
  const oh2 = P(c2.x, c2.y - 44), oh3 = P(c3.x, c3.y + 44);
  s += stereo('w', c2, oh2, 15) + atom(oh2.x, oh2.y, 'OH', { r: 15, kind: 'hi' });
  s += stereo('h', c3, oh3, 15) + atom(oh3.x, oh3.y, 'OH', { r: 15, kind: 'hi' });
  s += T(c2.x + 14, c2.y + 22, 'S', 'fg-tag-good');
  s += T(c3.x - 14, c3.y - 12, 'R', 'fg-tag-good');
  s += T(c2.x - 16, c2.y - 6, 'C3', 'fg-tag', 'end');
  s += T(c3.x + 16, c3.y + 16, 'C2', 'fg-tag', 'start');
  const mid = P((c2.x + c3.x) / 2, (c2.y + c3.y) / 2);
  s += dot(mid);
  molStart('meso-tartaric zigzag');
  const i2 = A('C', c2), i3 = A('C', c3);
  B(i2, i3);
  B(i2, G('COOH', c1, 0)); B(i3, G('COOH', c4, 0));
  B(i2, A('O', oh2, 26)); B(i2, A('H', P(c2.x, c2.y - 12), -26));
  B(i3, A('O', oh3, -26)); B(i3, A('H', P(c3.x, c3.y + 12), 26));
  claim(i2, 'S'); claim(i3, 'R');
  return { s, mid };
}
FIGURES.push({
  id: 'meso-conformations',
  section: 'meso',
  anchor: 'turn the molecule until its two halves line up.</p>',
  viewBox: '0 0 760 280',
  alt: 'meso-Tartaric acid in two conformations. Left: the zigzag conformation, with C3 raised and C2 lowered, the OH on C3 on a wedge pointing up and the OH on C2 on a hash pointing down. No mirror plane cuts it, but a dot at the middle of the C2–C3 bond is a center of symmetry. An arrow labeled "turn C2 half a turn about the C2–C3 bond" leads to the right: the lined-up conformation, with both OH groups on wedges above and both COOH groups below, and a dashed mirror plane through the middle of the C2–C3 bond. Both drawings are labeled C3 S and C2 R.',
  build() {
    let s = '';
    s += T(150, 24, 'zigzag: no mirror plane in view', 'fg-tag-warn');
    const z = zigzagMeso(80, 150);
    s += z.s;
    s += T(z.mid.x + 8, z.mid.y + 56, 'center of symmetry', 'fg-tag');
    s += dashLine(P(z.mid.x + 2, z.mid.y + 5), P(z.mid.x + 6, z.mid.y + 44), 'fg-dash');
    s += arrow(P(292, 128), P(430, 128));
    s += T(361, 110, 'turn C2 half a turn', 'fg-tag');
    s += T(361, 150, 'about the C2–C3 bond', 'fg-tag');
    s += T(592, 24, 'lined up: the mirror plane shows', 'fg-tag-good');
    s += tart(592, 140, 'meso', { plane: 'good' });
    s += T(380, 268, 'the same molecule, (2R,3S), in two conformations', 'fg-tag');
    return s;
  },
  caption: 'Follow the OH on C2: on a hash below the chain at the left, on a wedge above it at the right. Nothing else about C2 has changed.',
});
FIGURES.push({
  id: 'l-meso-conformations',
  lessons: ['meso'],
  viewBox: '0 0 340 470',
  alt: 'meso-Tartaric acid in two conformations, stacked. Top: the zigzag conformation, with the OH on C3 on a wedge pointing up and the OH on C2 on a hash pointing down; no mirror plane, but a dot at the middle of the C2–C3 bond marks a center of symmetry. An arrow down, labeled "turn C2 half a turn", leads to the lined-up conformation: both OH groups on wedges above, both COOH groups below, and a dashed mirror plane through the middle of the C2–C3 bond.',
  build() {
    let s = '';
    s += T(170, 20, 'zigzag: no mirror plane in view', 'fg-tag-warn');
    const z = zigzagMeso(101, 110);
    s += z.s;
    s += T(170, 190, 'the dot is a center of symmetry', 'fg-tag');
    s += arrow(P(170, 204), P(170, 250));
    s += T(182, 226, 'turn C2 half a turn', 'fg-tag', 'start');
    s += T(170, 282, 'lined up: the mirror plane shows', 'fg-tag-good');
    s += tart(170, 380, 'meso', { plane: 'good' });
    return s;
  },
  caption: 'One molecule, two conformations. Only the lined-up one shows the plane.',
});

/* ===================================================== halves-must-match ===
   Opposite descriptors are not enough: the halves have to be identical. */
const DIBROMO = { end: 'CH₃', L: { g: 'Br', k: 'w', rs: 'R', n: 'C2' }, R: { g: 'Br', k: 'w', rs: 'S', n: 'C3' } };
const BROMOCHLORO = { end: 'CH₃', L: { g: 'Br', k: 'w', rs: 'R', n: 'C2' }, R: { g: 'Cl', k: 'w', rs: 'S', n: 'C3' } };
FIGURES.push({
  id: 'halves-must-match',
  section: 'meso',
  anchor: 'the descriptors alone can mislead you.</p>',
  viewBox: '0 0 760 290',
  alt: 'Two molecules in the same lined-up drawing, both (2R,3S). Left: 2,3-dibromobutane, with a Br on a wedge on each carbon and a methyl below each; a dashed vertical mirror plane through the middle of the C2–C3 bond reflects Br onto Br, so it is meso. Right: 2-bromo-3-chlorobutane, with Br on a wedge on C2 and Cl on a wedge on C3; the same dashed line would reflect Br onto Cl, so it is not a mirror plane and the molecule is chiral.',
  build() {
    let s = '';
    s += T(190, 24, '(2R,3S)-2,3-dibromobutane', 'fg-lbl');
    s += lined(190, 136, { ...DIBROMO, plane: 'good', check: 'meso-2,3-dibromobutane' });
    s += rich(190, 250, ['Br onto Br: ', '*meso'], 'fg-tag-good');
    s += rule(380, 20, 380, 276);
    s += T(570, 24, '(2R,3S)-2-bromo-3-chlorobutane', 'fg-lbl');
    s += lined(570, 136, { ...BROMOCHLORO, plane: 'bad', check: '2-bromo-3-chlorobutane' });
    s += T(570, 250, 'Br onto Cl: chiral', 'fg-tag-warn');
    s += T(570, 272, 'its enantiomer is (2S,3R)', 'fg-tag');
    return s;
  },
  caption: 'Both drawings carry R at C2 and S at C3. Check what the dashed line would swap on each side.',
});
FIGURES.push({
  id: 'l-halves-must-match',
  lessons: ['meso'],
  viewBox: '0 0 340 500',
  alt: 'Two molecules stacked, both (2R,3S) and drawn the same way. Top: 2,3-dibromobutane, with Br on a wedge on each carbon; a dashed mirror plane reflects Br onto Br, so it is meso. Bottom: 2-bromo-3-chlorobutane, with Br on C2 and Cl on C3; the same line would reflect Br onto Cl, so it is not a mirror plane and the molecule is chiral.',
  build() {
    let s = '';
    s += T(170, 20, '(2R,3S)-2,3-dibromobutane', 'fg-lbl');
    s += lined(170, 126, { ...DIBROMO, plane: 'good', check: 'l meso-dibromo' });
    s += rich(170, 234, ['Br onto Br: ', '*meso'], 'fg-tag-good');
    s += rule(10, 250, 330, 250);
    s += T(170, 274, '(2R,3S)-2-bromo-3-chlorobutane', 'fg-lbl');
    s += lined(170, 380, { ...BROMOCHLORO, plane: 'bad', check: 'l bromochloro' });
    s += T(170, 488, 'Br onto Cl: chiral', 'fg-tag-warn');
    return s;
  },
  caption: 'Same descriptors, same drawing. Only the top one has identical halves.',
});

/* ========================================================= Fischer ===
   The lined-up drawing stood on end, then flattened into a Fischer cross. */
/* A vertical two-center chain with every horizontal group on a wedge and
   every vertical bond going back: the 3D drawing a Fischer cross stands for. */
function bowtie(cx, cy, rights, labels) {
  let s = '';
  const top = P(cx, cy - 88), c2 = P(cx, cy - 34), c3 = P(cx, cy + 34), bot = P(cx, cy + 88);
  s += stereo('h', c2, top, 21) + atom(top.x, top.y, 'COOH', { r: 21 });
  s += sk(c2, c3);
  s += stereo('h', c3, bot, 21) + atom(bot.x, bot.y, 'COOH', { r: 21 });
  molStart('bowtie', {});
  const i2 = A('C', c2), i3 = A('C', c3);
  B(i2, i3);
  B(i2, G('COOH', top, -26)); B(i3, G('COOH', bot, -26));
  [[c2, i2], [c3, i3]].forEach(([c, ic], k) => {
    const right = rights[k];
    const oh = P(c.x + (right ? 50 : -50), c.y), h = P(c.x + (right ? -46 : 46), c.y);
    s += stereo('w', c, oh, 15) + atom(oh.x, oh.y, 'OH', { r: 15, kind: 'hi' });
    s += stereo('w', c, h, 12) + atom(h.x, h.y, 'H', { r: 12 });
    B(ic, A('O', oh, 26)); B(ic, A('H', h, 26));
    s += T(c.x + 10, c.y + (k === 0 ? 24 : -14), labels[k], 'fg-tag-good', 'start');
    claim(ic, labels[k]);
  });
  return s;
}
function fischer(cx, cy, rights, labels, check) {
  let s = '';
  const top = P(cx, cy - 88), bot = P(cx, cy + 88);
  s += bond(top, bot, { rFrom: 21, rTo: 21 });
  s += atom(top.x, top.y, 'COOH', { r: 21 });
  s += atom(bot.x, bot.y, 'COOH', { r: 21 });
  molStart(check, { fischer: true });
  const cs = [P(cx, cy - 34), P(cx, cy + 34)];
  const ic = cs.map((c) => A('C', c));
  B(ic[0], ic[1]);
  B(ic[0], G('COOH', top, 0)); B(ic[1], G('COOH', bot, 0));
  cs.forEach((c, k) => {
    const right = rights[k];
    const oh = P(cx + (right ? 56 : -56), c.y), h = P(cx + (right ? -52 : 52), c.y);
    s += bond(oh, h, { rFrom: 15, rTo: 12 });
    s += atom(oh.x, oh.y, 'OH', { r: 15, kind: 'hi' });
    s += atom(h.x, h.y, 'H', { r: 12 });
    s += atom(c.x, c.y, '', { kind: 'point' });
    B(ic[k], A('O', oh, 0)); B(ic[k], A('H', h, 0));
    s += T(cx + 10, c.y + (k === 0 ? -8 : 20), labels[k], 'fg-tag-good', 'start');
    claim(ic[k], labels[k]);
  });
  return s;
}
FIGURES.push({
  id: 'meso-in-a-fischer-projection',
  section: 'meso',
  anchor: 'the mirror plane becomes a horizontal line across the middle of the cross.</p>',
  viewBox: '0 0 760 330',
  alt: 'Three drawings of tartaric acid with the chain running down the page. Left: meso-tartaric acid in 3D, with both vertical bonds to COOH on hashes going back and every horizontal bond on a wedge coming forward; both OH groups are on the right. Middle: the same molecule as a Fischer projection, a cross at each carbon with both OH on the right, and a dashed horizontal mirror line between C2 and C3; C2 is R and C3 is S. Right: (2R,3R)-tartaric acid as a Fischer projection, with the upper OH on the right and the lower OH on the left; the same horizontal line would put OH onto H, so there is no mirror plane.',
  build() {
    let s = '';
    s += T(120, 22, 'in 3D', 'fg-tag');
    s += bowtie(120, 150, [true, true], ['R', 'S']);
    s += T(120, 268, 'horizontal: toward you', 'fg-tag');
    s += T(120, 286, 'vertical: away from you', 'fg-tag');
    s += arrow(P(196, 150), P(262, 150));
    s += T(229, 136, 'flatten', 'fg-tag');
    s += rich(372, 22, ['*meso', ' as a Fischer projection'], 'fg-tag');
    s += fischer(372, 150, [true, true], ['R', 'S'], 'fischer meso');
    s += dashLine(P(300, 150), P(444, 150));
    s += T(452, 154, 'mirror', 'fg-tag-good', 'start');
    s += rich(372, 286, ['*meso', ', (2R,3S)'], 'fg-tag-good');
    s += rule(520, 20, 520, 300);
    s += T(640, 22, '(2R,3R) as a Fischer projection', 'fg-tag');
    s += fischer(640, 150, [true, false], ['R', 'R'], 'fischer RR');
    s += dashLine(P(568, 150), P(712, 150), 'fg-dash');
    s += T(640, 268, 'the line would put OH onto H', 'fg-tag-warn');
    s += T(640, 286, 'no mirror plane: chiral', 'fg-tag-warn');
    return s;
  },
  caption: 'In the middle cross, fold the top half down onto the bottom half. Try the same fold on the right-hand cross.',
});

/* ============================================================== rings ===
   cis-1,2-dimethylcyclohexane: the flat ring with its mirror plane, and the
   two chairs as mirror images. The chair is the one cis-trans-ez draws
   (from the axial-equatorial twelve-position figure), with the same up and
   down tags, so the two pages cannot disagree. */
const CHAIR_V = [
  P(113.15, -18.21), P(56.57, -15.31), P(-56.57, -51.72),
  P(-113.15, 18.21), P(-56.58, 15.31), P(56.57, 51.72),
];
const CHAIR_EQ = [
  P(0.944, 0.329), P(0.613, -0.790), P(-0.994, 0.104),
  P(-0.944, -0.329), P(-0.613, 0.790), P(0.994, -0.104),
];
const chairPts = (cx, cy, k) => CHAIR_V.map((v) => P(cx + v.x * k, cy + v.y * k));
/* Axial is straight up on even carbons and straight down on odd ones. */
const axialEnd = (pts, i, L) => P(pts[i].x, pts[i].y + (i % 2 === 0 ? -L : L));
const equatorialEnd = (pts, i, L) => P(pts[i].x + CHAIR_EQ[i].x * L, pts[i].y + CHAIR_EQ[i].y * L);
/* The cis compound in one chair: C1 (carbon 0) axial and up, C2 (carbon 5)
   equatorial and up, exactly as cis-trans-ez's CIS12. `mirror` reflects
   the whole drawing left to right about x = mx; the reflection of C1 is then
   named C2 and the reflection of C2 named C1, because the mirror image is
   the flipped chair with the molecule turned around. */
function cisChair(cx, cy, k, L, mirror, mx, showFace = true) {
  let pts = chairPts(cx, cy, k);
  let e1 = axialEnd(pts, 0, L), e2 = equatorialEnd(pts, 5, L);
  const m = (p) => (mirror ? P(2 * mx - p.x, p.y) : p);
  pts = pts.map(m); e1 = m(e1); e2 = m(e2);
  let s = pts.map((p, i) => bond(p, pts[(i + 1) % 6], { rFrom: 0, rTo: 0 })).join('');
  const meth = (c, e) => bond(c, e, { rFrom: 0, rTo: 17, cls: 'fg-bond-hi' }) + atom(e.x, e.y, 'CH₃', { r: 17, kind: 'hi' });
  s += meth(pts[0], e1) + meth(pts[5], e2);
  const up = (e, c) => {
    if (!showFace) return '';
    const right = e.x >= c.x;
    return T(e.x + (right ? 21 : -21), e.y + 4, 'up', 'fg-tag-good', right ? 'start' : 'end');
  };
  s += up(e1, pts[0]) + up(e2, pts[5]);
  const n0 = mirror ? 'C2' : 'C1', n5 = mirror ? 'C1' : 'C2';
  const lab = (p, name, dx, dy, a) => T(p.x + (mirror ? -dx : dx), p.y + dy, name, 'fg-tag', mirror ? (a === 'end' ? 'start' : a === 'start' ? 'end' : a) : a);
  s += lab(pts[0], n0, -20, 16, 'end');
  s += lab(pts[5], n5, -10, 18, 'end');
  return { s, pts };
}
/* The flat ring: hexagon with methyls on wedges at C1 and C2, and the
   mirror plane through the middle of the C1-C2 bond and of the C4-C5 bond. */
function flatRing(cx, cy, r) {
  const v = [];
  for (let i = 0; i < 6; i++) v.push(at(P(cx, cy), 90 - i * 60, r));
  let s = v.map((p, i) => sk(p, v[(i + 1) % 6])).join('');
  molStart('cis-1,2-dimethylcyclohexane flat');
  const ids = v.map((p) => A('C', p));
  ids.forEach((id, i) => B(id, ids[(i + 1) % 6]));
  const put = (i, name, rs, nOff, rsOff) => {
    const c = v[i], out = at(c, 90 - i * 60, 44);
    s += wedge(c, out, { rFrom: 0, rTo: 17, width: 9 }) + atom(out.x, out.y, 'CH₃', { r: 17, kind: 'hi' });
    s += T(c.x + nOff.x, c.y + nOff.y, name, 'fg-tag', nOff.a);
    s += T(c.x + rsOff.x, c.y + rsOff.y, rs, 'fg-tag-good', 'middle');
    B(ids[i], A('C', out, 26));
    B(ids[i], A('H', P(c.x - 6, c.y), -26));
    claim(ids[i], rs);
  };
  put(1, 'C1', 'R', { x: -10, y: -4, a: 'end' }, { x: 2, y: -14 });
  put(2, 'C2', 'S', { x: -10, y: 12, a: 'end' }, { x: 2, y: 24 });
  s += dashLine(P(cx - r - 26, cy), P(cx + r + 64, cy));
  return s;
}
FIGURES.push({
  id: 'cis-ring-mirror',
  section: 'meso',
  anchor: '<h3>Meso compounds in rings</h3>',
  viewBox: '0 0 760 330',
  alt: 'cis-1,2-Dimethylcyclohexane three ways. Left: a flat hexagon with a methyl on a wedge at C1 and at C2, so both methyls are on the top face; C1 is R and C2 is S, and a dashed horizontal mirror plane passes through the middle of the C1–C2 bond and the middle of the opposite bond. Right: the compound in two chair conformations on either side of a dashed vertical mirror. In the left chair the C1 methyl is axial and up and the C2 methyl is equatorial and up. The right chair is its exact mirror image, and it is also the chair the ring flips into: C1 equatorial and up, C2 axial and up. Ring-flip arrows join the two chairs.',
  build() {
    let s = '';
    s += T(130, 24, 'flat ring: both methyls on wedges', 'fg-tag');
    s += flatRing(110, 140, 46);
    s += T(206, 134, 'mirror plane', 'fg-tag-good', 'start');
    s += rich(130, 250, ['*meso', ', (1R,2S)'], 'fg-tag-good');
    s += rule(280, 20, 280, 316);
    s += T(520, 24, 'the two chairs', 'fg-tag');
    const mx = 520;
    const a = cisChair(404, 136, 0.62, 34, false, mx);
    const b = cisChair(404, 136, 0.62, 34, true, mx);
    s += a.s + b.s;
    s += dashLine(P(mx, 44), P(mx, 206));
    s += T(mx, 222, 'mirror', 'fg-tag-good');
    s += T(404, 242, 'C1: axial, up', 'fg-tag');
    s += T(404, 260, 'C2: equatorial, up', 'fg-tag');
    s += T(636, 242, 'C1: equatorial, up', 'fg-tag');
    s += T(636, 260, 'C2: axial, up', 'fg-tag');
    s += arrow(P(470, 290), P(570, 290));
    s += arrow(P(570, 304), P(470, 304), { muted: true });
    s += T(462, 300, 'ring flip', 'fg-tag', 'end');
    s += T(578, 300, '~10⁵ times a second', 'fg-tag', 'start');
    return s;
  },
  caption: 'Left: the plane swaps C1 with C2 and one methyl wedge with the other. Right: read the tags under each chair, then compare the two drawings across the dashed line.',
});
FIGURES.push({
  id: 'l-cis-ring-mirror',
  lessons: ['meso'],
  viewBox: '0 0 340 470',
  alt: 'cis-1,2-Dimethylcyclohexane, stacked. Top: a flat hexagon with a methyl on a wedge at C1 and at C2; C1 is R and C2 is S, and a dashed horizontal mirror plane passes through the middle of the C1–C2 bond. Bottom: the two chair conformations side by side on either side of a dashed vertical mirror, joined by ring-flip arrows. Left chair: C1 axial, C2 equatorial. Right chair, its mirror image: C1 equatorial, C2 axial. Both methyls point up in both chairs.',
  build() {
    let s = '';
    s += T(170, 20, 'flat ring: both methyls on wedges', 'fg-tag');
    s += flatRing(140, 124, 44);
    s += T(262, 118, 'mirror', 'fg-tag-good', 'start');
    s += rich(170, 224, ['*meso', ', (1R,2S)'], 'fg-tag-good');
    s += rule(10, 240, 330, 240);
    s += T(170, 262, 'the two chairs, both methyls up', 'fg-tag');
    const mx = 170;
    const a = cisChair(88, 346, 0.44, 28, false, mx, false);
    const b = cisChair(88, 346, 0.44, 28, true, mx, false);
    s += a.s + b.s;
    s += dashLine(P(mx, 280), P(mx, 400));
    s += T(85, 414, 'C1 axial', 'fg-tag');
    s += T(85, 430, 'C2 equatorial', 'fg-tag');
    s += T(255, 414, 'C1 equatorial', 'fg-tag');
    s += T(255, 430, 'C2 axial', 'fg-tag');
    s += arrow(P(130, 448), P(210, 448));
    s += arrow(P(210, 460), P(130, 460), { muted: true });
    s += T(170, 442, 'ring flip', 'fg-tag');
    return s;
  },
  caption: 'Each chair is the mirror image of the other, and the flip turns one into the other.',
});

/* ================================================= bromine outcomes ===
   Anti addition of Br2 to the two 2-butenes. Each row: the alkene, flat in
   the page; the product as it forms, with the first Br on the front face
   (wedge) and the second on the back face (hash), every other group where
   the alkene had it; then the product after C3 turns half a turn about the
   C2-C3 bond, which brings both Br to the front. */
function alkene(cx, cy, trans) {
  const c2 = P(cx - 24, cy), c3 = P(cx + 24, cy);
  const m1 = at(c2, 150, 44), h1 = at(c2, 210, 40);
  const m2 = at(c3, trans ? 330 : 30, 44), h2 = at(c3, trans ? 30 : 330, 40);
  let g = bond(c2, c3, { order: 2, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 4 });
  g += plain(c2, m1, 17) + atom(m1.x, m1.y, 'CH₃', { r: 17 });
  g += plain(c3, m2, 17) + atom(m2.x, m2.y, 'CH₃', { r: 17 });
  g += plain(c2, h1, 12) + atom(h1.x, h1.y, 'H', { r: 12 });
  g += plain(c3, h2, 12) + atom(h2.x, h2.y, 'H', { r: 12 });
  return g;
}
/* The addition product with C2 on the left. `m3` is the angle of C3's
   methyl, `br3` the kind of bond to C3's Br and `br3deg` its direction. */
function dibromide(cx, cy, o) {
  const c2 = P(cx - 30, cy), c3 = P(cx + 30, cy);
  let s = sk(c2, c3);
  const m1 = at(c2, 150, 44), h1 = at(c2, 210, 40), b1 = at(c2, 285, 44);
  const m2 = at(c3, o.m3, 44), h2 = at(c3, o.m3 === 30 ? 330 : 30, 40), b2 = at(c3, o.br3deg, 44);
  s += plain(c2, m1, 17) + atom(m1.x, m1.y, 'CH₃', { r: 17 });
  s += plain(c2, h1, 12) + atom(h1.x, h1.y, 'H', { r: 12 });
  s += stereo('w', c2, b1, 15) + atom(b1.x, b1.y, 'Br', { r: 15, kind: 'hi' });
  s += plain(c3, m2, 17) + atom(m2.x, m2.y, 'CH₃', { r: 17 });
  s += plain(c3, h2, 12) + atom(h2.x, h2.y, 'H', { r: 12 });
  s += stereo(o.br3, c3, b2, 15) + atom(b2.x, b2.y, 'Br', { r: 15, kind: 'hi' });
  if (o.rs) {
    s += T(c2.x + 6, c2.y - 12, o.rs[0], 'fg-tag-good');
    s += T(c3.x - 6, c3.y - 12, o.rs[1], 'fg-tag-good');
    molStart(o.check);
    const i2 = A('C', c2), i3 = A('C', c3);
    B(i2, i3);
    B(i2, A('C', m1)); B(i2, A('H', h1)); B(i2, A('Br', b1, 26));
    B(i3, A('C', m2)); B(i3, A('H', h2)); B(i3, A('Br', b2, Z[o.br3]));
    claim(i2, o.rs[0]); claim(i3, o.rs[1]);
  }
  if (o.plane) {
    s += dashLine(P(cx, cy - 64), P(cx, cy + 62));
    s += T(cx, cy + 76, 'mirror plane', 'fg-tag-good');
  }
  return s;
}
function brRow(y, trans) {
  let s = '';
  const m3 = trans ? 330 : 30;
  s += alkene(92, y, trans);
  s += rich(92, y + 62, trans ? ['*trans', '-but-2-ene'] : ['*cis', '-but-2-ene'], 'fg-tag');
  s += arrow(P(178, y), P(252, y));
  s += T(215, y - 12, 'Br₂', 'fg-tag');
  s += T(215, y + 22, 'anti', 'fg-tag');
  s += dibromide(340, y, { m3, br3: 'h', br3deg: 110 });
  s += T(340, y + 76, 'as it forms', 'fg-tag');
  s += arrow(P(428, y), P(500, y));
  s += T(464, y - 12, 'turn C3', 'fg-tag');
  s += T(464, y + 22, 'half a turn', 'fg-tag');
  const turned = trans
    ? { m3: 30, br3: 'w', br3deg: 255, rs: ['R', 'S'], plane: true, check: 'Br2 trans turned' }
    : { m3: 330, br3: 'w', br3deg: 255, rs: ['R', 'R'], check: 'Br2 cis turned' };
  s += dibromide(592, y, turned);
  return s;
}
FIGURES.push({
  id: 'bromine-cis-trans-outcomes',
  section: 'meso',
  anchor: 'on but-2-ene that one fact decides the product.</p>',
  viewBox: '0 0 760 470',
  alt: 'Two rows. Top row: trans-but-2-ene, flat in the page, adds Br2 anti. As the product forms, the Br on C2 is on a wedge (front face) and the Br on C3 on a hash (back face), with every other group where the alkene had it. Turning C3 half a turn about the C2–C3 bond brings its Br to a wedge and its methyl up beside the C2 methyl; a dashed mirror plane then cuts the C2–C3 bond in half, and the carbons are labeled R and S: meso-2,3-dibromobutane. Bottom row: cis-but-2-ene gives the same kind of product, but after the same turn the C3 methyl points down while the C2 methyl points up, both carbons are R, and there is no mirror plane: (2R,3R), formed together with an equal amount of its enantiomer (2S,3S).',
  build() {
    let s = '';
    s += rich(20, 24, ['*trans', ' alkene'], 'fg-tag-good', 'start');
    s += brRow(116, true);
    s += rich(592, 210, ['one achiral product, ', '*meso'], 'fg-tag-good');
    s += rule(20, 228, 740, 228);
    s += rich(20, 254, ['*cis', ' alkene'], 'fg-tag-warn', 'start');
    s += brRow(346, false);
    s += T(592, 418, '(2R,3R), and (2S,3S) in equal amount:', 'fg-tag-warn');
    s += T(592, 436, 'a racemic mixture', 'fg-tag-warn');
    return s;
  },
  caption: 'In each row, compare the two methyls in the last drawing. On the same side, a mirror plane runs between them. On opposite sides, there is none.',
});

export default FIGURES;
