/* Figures for the oxidation-states notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Most figures here are drawn as "cells", the pattern aldehyde-oxidation and
   hydrates-cyanohydrins use: one structure drawn inside a box at an offset.
   The notes page lays the cells out side by side; the lesson copy (id prefix
   l-) stacks the same cells at 340 wide, so the notes and the lesson show the
   same drawing. Text inside a cell is fg-lbl or fg-tag only, which is what a
   lesson figure may use.

   The carbon being counted is always drawn as a circled C with all four of
   its bonds shown, because the whole method is a count of those four bonds.
   Carbons that are not being counted are skeletal or written as CH3. */
import { atom, bond, arrow, lonePair, text, tag, label, rule, panel, P } from '../lib/ochem-figure.mjs';
import { sk } from '../lib/ochem-skeletal.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */

/* A cell: a panel with a title tag at the top and a one-line result tag at
   the bottom. `draw(Q)` receives a point maker already shifted to the cell's
   corner, so every cell is written in its own 0..cw coordinates. */
function cell(ox, oy, w, h, title, foot, draw, cw, footCls = 'fg-tag-good') {
  const dx = ox + (w - cw) / 2;
  const Q = (x, y) => P(dx + x, oy + y);
  let s = panel(ox, oy, w, h);
  s += tag(ox + w / 2, oy + 22, title);
  if (foot) s += text(ox + w / 2, oy + h - 14, foot, { cls: footCls, size: 11 });
  s += draw(Q);
  return s;
}
function grid(cells, cols, w, h, cw, gapX = 12, gapY = 14, x0 = 8, y0 = 8) {
  let s = '';
  cells.forEach(([title, foot, draw, footCls], i) => {
    const col = i % cols, row = Math.floor(i / cols);
    s += cell(x0 + col * (w + gapX), y0 + row * (h + gapY), w, h, title, foot, draw, cw, footCls);
  });
  return s;
}
const stackH = (n, h, gap = 14) => 8 + n * h + (n - 1) * gap + 8;

const T = (Q, x, y, s, o = {}) => { const p = Q(x, y); return text(p.x, p.y, s, { cls: 'fg-lbl', size: 13, ...o }); };
const Tg = (Q, x, y, s, o = {}) => T(Q, x, y, s, { cls: 'fg-tag', size: 11, ...o });

const rOf = (l) => (l.length >= 3 ? 19 : l.length === 2 ? 16 : 14);
const A = (p, l, o = {}) => atom(p.x, p.y, l, { r: rOf(l), ...o });

/* The counted carbon: a circled C with groups at screen angles (degrees,
   counterclockwise from east). A group with no label is a skeletal bond to
   an unlabelled carbon. The carbon is drawn last so bonds stop at its edge. */
function centre(c, groups) {
  let s = '';
  const ends = {};
  for (const g of groups) {
    const e = armEnd(c, g.deg, g.len || 48);
    s += bond(c, e, { rFrom: 16, rTo: g.l ? rOf(g.l) : 0, order: g.order || 1 });
    if (g.l) s += A(e, g.l, g.kind ? { kind: g.kind } : {});
    ends[g.key || g.l || `v${g.deg}`] = e;
  }
  s += A(c, 'C', { kind: 'warn' });
  return { s, ends };
}
/* A skeletal ethyl hanging off an end point: one more bond, bent. */
const ethyl = (from, deg) => { const v = armEnd(from, deg, 40); return sk(from, v); };

/* ======================================================================
   1. The bond trade: propan-2-ol and propanone.
   ====================================================================== */
const tradeCells = [
  ['PROPAN-2-OL', 'on that C: 1 bond to O, 1 bond to H', (Q) => {
    const m = centre(Q(120, 100), [
      { deg: 90, len: 46, l: 'OH' },
      { deg: 270, len: 46, l: 'H', kind: 'hi' },
      { deg: 180, len: 56, l: 'CH₃' },
      { deg: 0, len: 56, l: 'CH₃' },
    ]);
    return m.s + Tg(Q, 138, 150, 'this H goes', { cls: 'fg-tag-good', anchor: 'start' });
  }],
  ['PROPANONE', 'on that C: 2 bonds to O, no H', (Q) => {
    const m = centre(Q(120, 112), [
      { deg: 90, len: 50, l: 'O', order: 2 },
      { deg: 210, len: 54, l: 'CH₃' },
      { deg: 330, len: 54, l: 'CH₃' },
    ]);
    return m.s + Tg(Q, 134, 94, 'second bond to O', { cls: 'fg-tag-good', anchor: 'start' });
  }],
];

FIGURES.push({
  id: 'bond-trade',
  section: 'oxidation-states',
  anchor: '',
  alt: 'Propan-2-ol, whose middle carbon carries one OH, one H and two methyl groups, is oxidized to propanone, whose middle carbon carries a C=O and two methyl groups. The reverse arrow is a reduction.',
  viewBox: '0 0 760 220',
  build() {
    let s = cell(8, 8, 290, 204, ...tradeCells[0].slice(0, 3), 240);
    s += cell(462, 8, 290, 204, ...tradeCells[1].slice(0, 3), 240);
    s += arrow(P(318, 100), P(442, 100));
    s += arrow(P(442, 122), P(318, 122));
    s += tag(380, 88, 'oxidation');
    s += tag(380, 144, 'reduction');
    return s;
  },
  caption: 'Compare the circled carbon&rsquo;s bonds to O and to H before and after. The highlighted H is the one that goes.',
});
FIGURES.push({
  id: 'l-bond-trade',
  lessons: ['oxidation-states'],
  alt: 'Propan-2-ol above, propanone below. An arrow down is labeled oxidation and an arrow up is labeled reduction.',
  viewBox: '0 0 340 496',
  build() {
    let s = cell(8, 8, 324, 204, ...tradeCells[0].slice(0, 3), 240);
    s += cell(8, 284, 324, 204, ...tradeCells[1].slice(0, 3), 240);
    s += arrow(P(152, 220), P(152, 276));
    s += arrow(P(188, 276), P(188, 220));
    s += tag(142, 252, 'oxidation', { anchor: 'end' });
    s += tag(198, 252, 'reduction', { anchor: 'start' });
    return s;
  },
  caption: 'Oxidation trades the middle carbon&rsquo;s C&ndash;H for a second bond to oxygen.',
});

/* ======================================================================
   2. Three additions to propene, scored on the two alkene carbons.
   ====================================================================== */
/* The two former alkene carbons, each with all four bonds drawn. `n1` and
   `n2` are the atoms the reagent added (highlighted), with their scores. */
function addition(Q, n1, n2) {
  const c1 = Q(80, 110), c2 = Q(156, 110);
  let s = bond(c1, c2, { rFrom: 16, rTo: 16 });
  const a = centre(c1, [
    { deg: 180, len: 44, l: 'H' },
    { deg: 90, len: 44, l: 'H' },
    { deg: 270, len: 46, l: n1, kind: 'hi' },
  ]);
  const b = centre(c2, [
    { deg: 90, len: 44, l: 'H' },
    { deg: 0, len: 54, l: 'CH₃' },
    { deg: 270, len: 46, l: n2, kind: 'hi' },
  ]);
  s += a.s + b.s;
  s += Tg(Q, 80, 196, n1 === 'H' ? '−1' : '+1', { cls: 'fg-tag-warn' });
  s += Tg(Q, 156, 196, n2 === 'H' ? '−1' : '+1', { cls: 'fg-tag-warn' });
  return s;
}
const addCells = [
  ['PROPENE + HBr', '−1 + 1 = 0: neither', (Q) => addition(Q, 'H', 'Br'), 'fg-tag-mut'],
  ['PROPENE + Br₂', '+1 + 1 = +2: oxidation', (Q) => addition(Q, 'Br', 'Br')],
  ['PROPENE + H₂', '−1 − 1 = −2: reduction', (Q) => addition(Q, 'H', 'H')],
];

FIGURES.push({
  id: 'addition-tallies',
  section: 'oxidation-states',
  anchor: '',
  alt: 'Three products of adding a reagent to propene, with the two former alkene carbons drawn in full. With HBr, one carbon gains H (minus 1) and the other gains Br (plus 1), total 0. With Br2, both gain Br, total plus 2. With H2, both gain H, total minus 2.',
  viewBox: '0 0 760 246',
  build() { return grid(addCells, 3, 240, 230, 236); },
  caption: 'The highlighted atoms are the ones the reagent added, and each carries its score. Add the two scores to get the verdict.',
});
FIGURES.push({
  id: 'l-addition-tallies',
  lessons: ['oxidation-states'],
  alt: 'Three stacked panels: propene plus HBr scores minus 1 plus 1, neither; propene plus Br2 scores plus 1 plus 1, oxidation; propene plus H2 scores minus 1 minus 1, reduction.',
  viewBox: `0 0 340 ${stackH(3, 230)}`,
  build() { return grid(addCells, 1, 324, 230, 236, 0, 14); },
  caption: 'Add the scores of the two highlighted atoms.',
});

/* ======================================================================
   3. Scoring the four bonds: ethanol and acetaldehyde.
   ====================================================================== */
const countCells = [
  ['ETHANOL', '0 − 1 − 1 + 1 = −1', (Q) => {
    const m = centre(Q(120, 110), [
      { deg: 180, len: 58, l: 'CH₃' },
      { deg: 90, len: 46, l: 'H' },
      { deg: 270, len: 46, l: 'H' },
      { deg: 0, len: 56, l: 'OH' },
    ]);
    let s = m.s;
    s += Tg(Q, 30, 114, '0', { cls: 'fg-tag-warn' });
    s += Tg(Q, 150, 68, '−1', { cls: 'fg-tag-warn' });
    s += Tg(Q, 150, 160, '−1', { cls: 'fg-tag-warn' });
    s += Tg(Q, 210, 114, '+1', { cls: 'fg-tag-warn' });
    return s;
  }],
  ['ACETALDEHYDE', '0 − 1 + 2 = +1', (Q) => {
    const m = centre(Q(120, 122), [
      { deg: 90, len: 50, l: 'O', order: 2 },
      { deg: 210, len: 56, l: 'CH₃' },
      { deg: 330, len: 52, l: 'H' },
    ]);
    let s = m.s;
    s += Tg(Q, 26, 154, '0', { cls: 'fg-tag-warn' });
    s += Tg(Q, 196, 154, '−1', { cls: 'fg-tag-warn' });
    s += Tg(Q, 134, 102, '+2 (two bonds)', { cls: 'fg-tag-warn', anchor: 'start' });
    return s;
  }],
];

FIGURES.push({
  id: 'count-carbon',
  section: 'oxidation-states',
  anchor: '',
  alt: 'The CH2 carbon of ethanol with its four bonds scored: 0 for the bond to CH3, minus 1 for each of two bonds to H, plus 1 for the bond to OH, total minus 1. The CHO carbon of acetaldehyde: 0 for CH3, minus 1 for H, plus 2 for the double bond to O, total plus 1.',
  viewBox: '0 0 760 226',
  build() { return grid(countCells, 2, 366, 210, 240); },
  caption: 'Each bond on the circled carbon carries its score, and the sum is under each drawing.',
});
FIGURES.push({
  id: 'l-count-carbon',
  lessons: ['oxidation-states'],
  alt: 'Two stacked panels: the ethanol carbon scores 0, minus 1, minus 1 and plus 1, total minus 1; the acetaldehyde carbon scores 0, minus 1 and plus 2, total plus 1.',
  viewBox: `0 0 340 ${stackH(2, 210)}`,
  build() { return grid(countCells, 1, 324, 210, 240, 0, 14); },
  caption: 'Score each bond on the circled carbon, then add.',
});

/* ======================================================================
   4. The ladder, with the width of each rung drawn in.
   ====================================================================== */
const RUNGS = [
  { n: '4', ex: 'CO₂', ox: '+4', fam: ['CO₂ · CCl₄'] },
  { n: '3', ex: 'HCO₂H', ox: '+2', fam: ['carboxylic acid · ester · amide', 'acid chloride · nitrile'] },
  { n: '2', ex: 'CH₂O', ox: '0', fam: ['aldehyde · ketone · acetal · imine'] },
  { n: '1', ex: 'CH₃OH', ox: '−2', fam: ['alcohol · ether · alkyl halide · amine'], hi: true },
  { n: '0', ex: 'CH₄', ox: '−4', fam: ['alkane'] },
];

FIGURES.push({
  id: 'oxidation-ladder',
  section: 'oxidation-states',
  anchor: '',
  alt: 'The carbon oxidation ladder. Each rung lists the number of bonds from carbon to O, N or halogen (0 to 4), the one-carbon example and its oxidation state (CH4 minus 4, CH3OH minus 2, CH2O 0, HCO2H plus 2, CO2 plus 4), and the families that share the rung.',
  viewBox: '0 0 760 384',
  build() {
    let s = '';
    s += tag(112, 40, 'bonds to O, N, X');
    s += tag(234, 40, 'one-carbon case');
    s += tag(352, 40, 'oxidation state');
    s += tag(420, 40, 'everything that shares the rung', { anchor: 'start' });
    s += rule(70, 52, 740, 52);
    RUNGS.forEach((r, i) => {
      const y = 84 + i * 56;
      if (r.hi) s += panel(80, y - 24, 660, 48, { kind: 'hi' });
      s += label(112, y + 4, r.n);
      s += label(234, y + 4, r.ex);
      s += label(352, y + 4, r.ox);
      r.fam.forEach((f, j) => {
        const fy = r.fam.length === 1 ? y + 4 : y - 5 + j * 18;
        s += text(420, fy, f, { cls: 'fg-lbl', size: 13, anchor: 'start' });
      });
      if (r.n === '3') s += tag(352, y + 20, 'RCO₂H: +3', { cls: 'fg-tag-mut' });
      if (i < RUNGS.length - 1) s += rule(70, y + 28, 740, y + 28);
    });
    s += arrow(P(40, 310), P(40, 70));
    s += tag(40, 334, 'up =', { cls: 'fg-tag' });
    s += tag(40, 348, 'oxidation', { cls: 'fg-tag' });
    s += rule(70, 346, 740, 346);
    s += text(405, 372, 'Along a rung: no oxidant or reductant.   Up one rung: a two-electron oxidation.', { cls: 'fg-lbl', size: 13 });
    return s;
  },
  caption: 'Each row is one rung, and X stands for a halogen. The highlighted rung holds both the alcohol and the alkyl halide.',
});
FIGURES.push({
  id: 'l-oxidation-ladder',
  lessons: ['oxidation-states'],
  alt: 'The carbon oxidation ladder, top to bottom: CO2 plus 4, HCO2H plus 2, CH2O 0, CH3OH minus 2, CH4 minus 4, each with its count of bonds to O, N or halogen and the families that share the rung.',
  viewBox: '0 0 340 372',
  build() {
    let s = '';
    s += tag(170, 22, 'up a rung = a two-electron oxidation');
    let y = 36;
    RUNGS.forEach((r, i) => {
      const hgt = 38 + r.fam.length * 18;
      if (r.hi) s += panel(30, y + 2, 304, hgt - 4, { kind: 'hi' });
      s += label(40, y + 22, r.ex, { anchor: 'start' });
      s += label(140, y + 22, r.ox, { anchor: 'middle' });
      s += tag(326, y + 22, `${r.n} bond${r.n === '1' ? '' : 's'} to O, N, X`, { anchor: 'end' });
      r.fam.forEach((f, j) => { s += tag(40, y + 42 + j * 18, f, { anchor: 'start', cls: 'fg-tag-mut' }); });
      y += hgt;
      if (i < RUNGS.length - 1) s += rule(30, y, 334, y);
    });
    s += arrow(P(14, y - 8), P(14, 44));
    s += rule(30, y, 334, y);
    s += tag(40, y + 24, 'In RCO₂H the acid carbon is +3, not +2.', { anchor: 'start', cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Every family on a rung has the same number of bonds to O, N or a halogen (X).',
});

/* ======================================================================
   5. How far each alcohol can climb: count the H on the carbinol carbon.
   ====================================================================== */
const MOL = {
  prim: (c) => {
    const m = centre(c, [
      { deg: 0, len: 50, l: 'OH' },
      { deg: 90, len: 44, l: 'H', kind: 'hi' },
      { deg: 270, len: 44, l: 'H', kind: 'hi' },
      { deg: 180, len: 46 },
    ]);
    return m.s + ethyl(m.ends.v180, 210);
  },
  sec: (c) => centre(c, [
    { deg: 90, len: 46, l: 'OH' },
    { deg: 270, len: 44, l: 'H', kind: 'hi' },
    { deg: 180, len: 46 },
    { deg: 0, len: 46 },
  ]).s,
  tert: (c) => centre(c, [
    { deg: 90, len: 46, l: 'OH' },
    { deg: 270, len: 46 },
    { deg: 180, len: 46 },
    { deg: 0, len: 46 },
  ]).s,
  ald: (c) => {
    const m = centre(c, [
      { deg: 90, len: 48, l: 'O', order: 2 },
      { deg: 330, len: 46, l: 'H', kind: 'hi' },
      { deg: 210, len: 46 },
    ]);
    return m.s + ethyl(m.ends.v210, 150);
  },
  acid: (c) => {
    const m = centre(c, [
      { deg: 90, len: 48, l: 'O', order: 2 },
      { deg: 330, len: 50, l: 'OH' },
      { deg: 210, len: 46 },
    ]);
    return m.s + ethyl(m.ends.v210, 150);
  },
  ket: (c) => centre(c, [
    { deg: 90, len: 48, l: 'O', order: 2 },
    { deg: 210, len: 46 },
    { deg: 330, len: 46 },
  ]).s,
};

FIGURES.push({
  id: 'carbinol-climb',
  section: 'oxidation-states',
  anchor: '',
  alt: 'Three rows. Propan-1-ol, with two H on the carbinol carbon, is oxidized to propanal and then to propanoic acid. Propan-2-ol, with one H, is oxidized to propanone. 2-Methylpropan-2-ol, with no H on the carbinol carbon, does not react.',
  viewBox: '0 0 760 640',
  build() {
    let s = '';
    const rows = [
      { t: 'PRIMARY: PROPAN-1-OL, TWO H', mols: [['prim', 'propan-1-ol'], ['ald', 'propanal'], ['acid', 'propanoic acid']] },
      { t: 'SECONDARY: PROPAN-2-OL, ONE H', mols: [['sec', 'propan-2-ol'], ['ket', 'propanone']] },
      { t: 'TERTIARY: 2-METHYLPROPAN-2-OL, NO H', mols: [['tert', '2-methylpropan-2-ol']] },
    ];
    const xs = [130, 390, 630];
    rows.forEach((r, i) => {
      const oy = 8 + i * 212;
      s += panel(8, oy, 744, 200);
      s += tag(380, oy + 22, r.t);
      const cy = oy + 112;
      r.mols.forEach(([k, name], j) => {
        s += MOL[k](P(xs[j], cy));
        s += tag(xs[j], oy + 188, name, { cls: 'fg-tag-mut' });
        if (j > 0) {
          s += arrow(P(xs[j - 1] + 84, cy), P(xs[j] - 96, cy));
          s += tag((xs[j - 1] + xs[j]) / 2 - 6, cy - 12, 'oxidize');
        }
      });
      if (r.mols.length === 1) {
        s += arrow(P(xs[0] + 84, cy), P(xs[1] - 96, cy), { muted: true });
        s += tag((xs[0] + xs[1]) / 2 - 6, cy - 12, 'oxidize', { cls: 'fg-tag-mut' });
        s += tag(xs[1] + 10, cy + 4, 'no reaction: no H to remove', { cls: 'fg-tag-warn', anchor: 'start' });
      }
    });
    return s;
  },
  caption: 'Count the highlighted hydrogens on each circled carbinol carbon, then follow the arrows.',
});

const climbCells = [
  ['PROPAN-1-OL (PRIMARY)', 'two H: aldehyde, then acid', (Q) => MOL.prim(Q(130, 96))],
  ['PROPAN-2-OL (SECONDARY)', 'one H: ketone', (Q) => MOL.sec(Q(120, 96))],
  ['2-METHYLPROPAN-2-OL (TERTIARY)', 'no H: no oxidation', (Q) => MOL.tert(Q(120, 96)), 'fg-tag-warn'],
];
FIGURES.push({
  id: 'l-carbinol-climb',
  lessons: ['oxidation-states'],
  alt: 'Three stacked panels: propan-1-ol with two H on the carbinol carbon, propan-2-ol with one, and 2-methylpropan-2-ol with none.',
  viewBox: `0 0 340 ${stackH(3, 196)}`,
  build() { return grid(climbCells, 1, 324, 196, 240, 0, 14); },
  caption: 'Count the highlighted H on each circled carbinol carbon.',
});

export default FIGURES;
