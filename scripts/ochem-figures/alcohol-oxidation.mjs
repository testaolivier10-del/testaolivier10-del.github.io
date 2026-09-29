/* Figures for the alcohol-oxidation notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure is drawn as "cells", the pattern aldehyde-oxidation uses: one
   structure or one mechanism step inside a box at an offset. The notes page
   lays the cells out two or three across; the lesson copy (id prefix l-)
   stacks the same cells at 340 wide, so notes and lesson show the same
   drawing. Text inside a cell is fg-lbl or fg-tag only. */
import { atom, bond, arrow, curve, lonePair, text, tag, panel, P } from '../lib/ochem-figure.mjs';
import { sk, ringDouble, polyPts } from '../lib/ochem-skeletal.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */

const CW = 244;
function cell(ox, oy, w, h, title, foot, draw, opts = {}) {
  const dx = ox + (w - (opts.cw || CW)) / 2;
  const Q = (x, y) => P(dx + x, oy + y);
  let s = panel(ox, oy, w, h, opts.kind ? { kind: opts.kind } : {});
  s += tag(ox + w / 2, oy + 22, title);
  if (foot) s += text(ox + w / 2, oy + h - 14, foot, { cls: opts.footCls || 'fg-tag-good', size: 11 });
  s += draw(Q);
  return s;
}

/* cells: [title, foot, draw, footCls?] */
function gridFigure(cells, cols, w, h, gapX = 16, gapY = 16, x0 = 8, y0 = 8, kinds = [], cw = CW) {
  let s = '';
  cells.forEach(([title, foot, draw, footCls], i) => {
    const col = i % cols, row = Math.floor(i / cols);
    s += cell(x0 + col * (w + gapX), y0 + row * (h + gapY), w, h, title, foot, draw, { kind: kinds[i] || null, cw, footCls });
  });
  return s;
}
const stackH = (n, h, gap = 14) => 8 + n * h + (n - 1) * gap + 8;

const T = (Q, x, y, s, o = {}) => { const p = Q(x, y); return text(p.x, p.y, s, { cls: 'fg-lbl', size: 13, ...o }); };
const Tg = (Q, x, y, s, o = {}) => T(Q, x, y, s, { cls: 'fg-tag', size: 11, ...o });

const A = (p, l, o = {}) => atom(p.x, p.y, l, o);
const rOf = (l) => (l.length >= 5 ? 23 : l.length >= 3 ? 19 : l.length === 2 ? 16 : 14);
const B = (a, b, la, lb, o = {}) => bond(a, b, { rFrom: la ? rOf(la) : 0, rTo: lb ? rOf(lb) : 0, ...o });

/* A labeled carbon with groups at screen angles (counterclockwise from
   east). A group with no label is a bare skeletal vertex. The carbon is drawn
   last so bonds stop at its edge. */
function centre(c, groups, ckind = 'warn') {
  let s = '';
  const ends = {};
  for (const g of groups) {
    const e = armEnd(c, g.deg, g.len || 48);
    s += bond(c, e, { rFrom: 16, rTo: g.l ? rOf(g.l) : 0, order: g.order || 1, cls: g.cls });
    if (g.l) s += A(e, g.l, { r: rOf(g.l), kind: g.kind });
    ends[g.key || g.l || `v${g.deg}`] = e;
  }
  s += A(c, 'C', { kind: ckind });
  return { s, ends };
}

/* Chromic acid, H2CrO4, centred on cr: two Cr=O and two Cr-OH. */
function chromicAcid(cr) {
  const oUp = armEnd(cr, 90, 44), oDn = armEnd(cr, 270, 44);
  const oh1 = armEnd(cr, 30, 46), oh2 = armEnd(cr, 330, 46);
  let s = bond(cr, oUp, { rFrom: 16, rTo: 14, order: 2 }) + bond(cr, oDn, { rFrom: 16, rTo: 14, order: 2 });
  s += bond(cr, oh1, { rFrom: 16, rTo: 16 }) + bond(cr, oh2, { rFrom: 16, rTo: 16 });
  s += A(oUp, 'O', { r: 14 }) + A(oDn, 'O', { r: 14 }) + A(oh1, 'OH', { r: 16 }) + A(oh2, 'OH', { r: 16 });
  s += A(cr, 'Cr', { kind: 'warn' });
  return { s, oUp };
}

/* ======================================================================
   2. The chromate ester mechanism, on a primary alcohol, and where a
      tertiary alcohol gets stuck.
   ====================================================================== */
const esterCells = [
  ['THE ALCOHOL O ATTACKS Cr', 'then H⁺ moves and H₂O leaves Cr', (Q) => {
    const c = Q(62, 116);
    const m = centre(c, [
      { deg: 180, len: 42, l: 'R' },
      { deg: 90, len: 42, l: 'H' },
      { deg: 250, len: 42, l: 'H' },
    ]);
    let s = m.s;
    const o = Q(112, 116), h = Q(112, 158);
    s += bond(c, o, { rFrom: 16, rTo: 16 }) + B(o, h, 'O', 'H');
    s += A(o, 'O', { kind: 'hi' }) + A(h, 'H', { r: 14 });
    s += lonePair(o.x, o.y, 300, { dist: 21 }) + lonePair(o.x, o.y, 225, { dist: 21 });
    const ca = chromicAcid(Q(182, 116));
    s += ca.s;
    const cr = Q(182, 116), oUp = ca.oUp;
    // the O lone pair attacks Cr; a Cr=O pi bond moves onto its O
    s += curve(P(o.x + 14, o.y - 18), P(cr.x - 17, cr.y - 5), { bow: -14, size: 7 });
    s += curve(P(cr.x - 6, cr.y - 24), P(oUp.x - 15, oUp.y + 6), { bow: -10, size: 7 });
    return s;
  }],
  ['WATER TAKES THE H AS Cr LEAVES', 'Cr gains two electrons: Cr(VI) → Cr(IV)', (Q) => {
    const c = Q(84, 124);
    const m = centre(c, [
      { deg: 90, len: 50, l: 'H', kind: 'hi', key: 'Hhi' },
      { deg: 150, len: 44, l: 'R' },
      { deg: 235, len: 44, l: 'H' },
    ]);
    let s = m.s;
    const o = Q(130, 124), cr = Q(194, 124);
    s += bond(c, o, { rFrom: 16, rTo: 14 }) + bond(o, cr, { rFrom: 14, rTo: 28 });
    s += A(o, 'O', { r: 14 }) + A(cr, 'CrO₂OH', { r: 28, kind: 'warn' });
    const w = Q(164, 58);
    s += A(w, 'H₂O', { r: 19 });
    s += lonePair(w.x, w.y, 180, { dist: 24 });
    const h = m.ends.Hhi;
    // water's lone pair takes the H; the C-H pair becomes the new C=O pi
    // bond; the O-Cr pair leaves with chromium
    s += curve(P(w.x - 28, w.y + 4), P(h.x + 15, h.y - 2), { bow: 10, size: 7 });
    s += curve(P(c.x + 5, c.y - 30), P(c.x + 30, c.y - 6), { bow: -10, size: 7 });
    s += curve(P(o.x + 22, o.y + 4), P(cr.x - 12, cr.y + 22), { bow: 12, size: 7 });
    return s;
  }],
  ['THE ALDEHYDE', '+ H₃O⁺ + a Cr(IV) species', (Q) => {
    const c = Q(110, 112);
    const m = centre(c, [
      { deg: 180, len: 46, l: 'R' },
      { deg: 90, len: 50, l: 'O', order: 2 },
      { deg: 0, len: 46, l: 'H' },
    ]);
    const o = m.ends.O;
    return m.s + lonePair(o.x, o.y, 225, { dist: 21 }) + lonePair(o.x, o.y, 315, { dist: 21 });
  }],
  ['A TERTIARY ESTER STOPS HERE', 'no H on C: water has nothing to take', (Q) => {
    const c = Q(84, 110);
    const m = centre(c, [
      { deg: 90, len: 46, l: 'CH₃' },
      { deg: 170, len: 48, l: 'CH₃' },
      { deg: 250, len: 42, l: 'CH₃' },
    ]);
    let s = m.s;
    const o = Q(130, 110), cr = Q(194, 110);
    s += bond(c, o, { rFrom: 16, rTo: 14 }) + bond(o, cr, { rFrom: 14, rTo: 28 });
    s += A(o, 'O', { r: 14 }) + A(cr, 'CrO₂OH', { r: 28, kind: 'warn' });
    return s;
  }, 'fg-tag-warn'],
];

FIGURES.push({
  id: 'chromate-ester',
  section: 'alcohol-oxidation',
  anchor: '<h3>How chromium(VI) removes the hydrogen</h3>',
  alt: 'The chromium(VI) oxidation of a primary alcohol in four panels. First, a lone pair on the alcohol oxygen of R–CH2–OH attacks the chromium of chromic acid, H2CrO4, while a Cr=O pi bond moves onto its oxygen; a proton then moves and water leaves the chromium. Second, in the chromate ester R–CH2–O–CrO2OH, a water molecule takes one hydrogen from the carbon, the C–H electrons become the new C=O bond, and the O–Cr electrons leave with chromium. Third, the product is the aldehyde R–CHO, with H3O+ and a chromium(IV) species. Fourth, the chromate ester of a tertiary alcohol, (CH3)3C–O–CrO2OH, has no hydrogen on the carbon, so the second step cannot happen.',
  viewBox: '0 0 760 440',
  build() { return gridFigure(esterCells, 2, 364, 204, 16, 16, 8, 8, ['hi', 0, 'good', 'warn']); },
  caption: 'Follow the highlighted hydrogen in the second panel, then look for one in the fourth.',
});
FIGURES.push({
  id: 'l-chromate-ester',
  lessons: ['alcohol-oxidation'],
  alt: 'Four stacked panels: the alcohol oxygen attacks the chromium of H2CrO4; in the chromate ester, water takes the hydrogen on carbon as chromium leaves with the O–Cr electrons; the aldehyde results; a tertiary chromate ester has no hydrogen on carbon and stops.',
  viewBox: `0 0 340 ${stackH(4, 204)}`,
  build() { return gridFigure(esterCells, 1, 324, 204, 0, 14, 8, 8, ['hi', 0, 'good', 'warn']); },
  caption: 'Water takes the highlighted hydrogen. A tertiary ester has none.',
});

/* ======================================================================
   3. Water decides: no hydrate in a dry flask; a hydrate, and a second
      oxidation, in water.
   ====================================================================== */
const waterCells = [
  ['DRY SOLVENT: PCC', 'no water, no hydrate: it stops', (Q) => {
    let s = Tg(Q, 120, 52, 'R–CH₂OH → R–CHO');
    const c = Q(116, 120);
    const m = centre(c, [
      { deg: 180, len: 46, l: 'R' },
      { deg: 90, len: 44, l: 'O', order: 2 },
      { deg: 0, len: 46, l: 'H' },
    ]);
    return s + m.s;
  }],
  ['IN WATER: THE HYDRATE', 'an H and an OH on one carbon', (Q) => {
    let s = Tg(Q, 120, 48, 'R–CHO + H₂O ⇌');
    const c = Q(114, 114);
    const m = centre(c, [
      { deg: 180, len: 46, l: 'R' },
      { deg: 90, len: 40, l: 'OH' },
      { deg: 270, len: 38, l: 'H', kind: 'hi' },
      { deg: 0, len: 50, l: 'OH', kind: 'hi' },
    ]);
    return s + m.s;
  }],
  ['OXIDIZED A SECOND TIME', 'the carboxylic acid', (Q) => {
    let s = Tg(Q, 120, 52, 'the same two steps');
    const c = Q(112, 120);
    const m = centre(c, [
      { deg: 180, len: 46, l: 'R' },
      { deg: 90, len: 44, l: 'O', order: 2 },
      { deg: 0, len: 48, l: 'OH', kind: 'hi' },
    ]);
    return s + m.s;
  }],
];

FIGURES.push({
  id: 'chromium-water',
  section: 'alcohol-oxidation',
  anchor: '<h3>Why water decides where a chromium oxidation stops</h3>',
  alt: 'Three panels. First, in a dry solvent with PCC, R–CH2OH gives the aldehyde R–CHO and stops. Second, in water, the aldehyde adds water to give its hydrate, a carbon holding R, a hydrogen and two OH groups, with one H and one OH highlighted. Third, the hydrate is oxidized by the same two steps to the carboxylic acid R–COOH.',
  viewBox: '0 0 760 220',
  build() { return gridFigure(waterCells, 3, 240, 204, 12, 16, 8, 8, [0, 'hi', 'good']); },
  caption: 'The middle panel exists only when there is water in the flask.',
});
FIGURES.push({
  id: 'l-chromium-water',
  lessons: ['alcohol-oxidation'],
  alt: 'Three stacked panels: with PCC in a dry solvent the aldehyde forms and stops; in water the aldehyde forms its hydrate, with an H and an OH on one carbon; the hydrate is oxidized again to the carboxylic acid.',
  viewBox: `0 0 340 ${stackH(3, 204)}`,
  build() { return gridFigure(waterCells, 1, 324, 204, 0, 14, 8, 8, [0, 'hi', 'good']); },
  caption: 'The hydrate in the middle panel forms only in water.',
});

/* ======================================================================
   4. The worked example: four substrates, one reagent each.
   ====================================================================== */
const CW4 = 340;
/* 2-methylbutan-1-ol, or its aldehyde or acid, with C1 at the left.
   head: 'OH' | 'CHO' | 'COOH'. */
function methylbutyl(Q, x, head) {
  const c1 = Q(x + 30, 100), c2 = Q(x + 58, 118), me = Q(x + 58, 152), c3 = Q(x + 86, 100), c4 = Q(x + 114, 118);
  let s = sk(c1, c2) + sk(c2, me) + sk(c2, c3) + sk(c3, c4);
  if (head === 'OH') {
    const oh = Q(x + 2, 118);
    s += bond(c1, oh, { rFrom: 0, rTo: 16 }) + A(oh, 'OH', { r: 16 });
  } else {
    const o = Q(x + 30, 62);
    s += bond(c1, o, { rFrom: 0, rTo: 14, order: 2 }) + A(o, 'O', { r: 14, kind: 'hi' });
    const lab = head === 'CHO' ? 'H' : 'OH';
    const e = Q(x + 2, 118);
    s += bond(c1, e, { rFrom: 0, rTo: rOf(lab) }) + A(e, lab, { r: rOf(lab), kind: head === 'COOH' ? 'hi' : undefined });
  }
  return s;
}
function cyclohexyl(Q, cx, ketone) {
  const c = Q(cx, 124);
  const pts = polyPts(c.x, c.y, 6, 26, 90);
  let s = pts.map((p, i) => sk(p, pts[(i + 1) % 6])).join('');
  const top = pts[0];
  const o = P(top.x, top.y - 38);
  s += bond(top, o, { rFrom: 0, rTo: ketone ? 14 : 16, order: ketone ? 2 : 1 });
  s += A(o, ketone ? 'O' : 'OH', { r: ketone ? 14 : 16, kind: ketone ? 'hi' : undefined });
  return s;
}
const substrateCells = [
  ['(a) 2-METHYLBUTAN-1-OL + PCC', '2-methylbutanal', (Q) =>
    methylbutyl(Q, 14, 'OH') + arrow(Q(152, 112), Q(194, 112), { size: 7 }) + methylbutyl(Q, 210, 'CHO')],
  ['(b) THE SAME ALCOHOL + CrO₃, H₂SO₄, H₂O', '2-methylbutanoic acid', (Q) =>
    methylbutyl(Q, 14, 'OH') + arrow(Q(152, 112), Q(194, 112), { size: 7 }) + methylbutyl(Q, 210, 'COOH')],
  ['(c) CYCLOHEXANOL + JONES', 'cyclohexanone', (Q) =>
    cyclohexyl(Q, 90, false) + arrow(Q(146, 124), Q(196, 124), { size: 7 }) + cyclohexyl(Q, 252, true)],
  ['(d) 2-METHYLBUTAN-2-OL + JONES, EXCESS', 'no reaction', (Q) => {
    const c2 = Q(92, 118);
    const c1 = armEnd(c2, 210, 32), me = armEnd(c2, 270, 32), c3 = armEnd(c2, 330, 32), c4 = armEnd(c3, 30, 32);
    const oh = armEnd(c2, 90, 36);
    let s = sk(c2, c1) + sk(c2, me) + sk(c2, c3) + sk(c3, c4);
    s += bond(c2, oh, { rFrom: 0, rTo: 16 }) + A(oh, 'OH', { r: 16 });
    s += arrow(Q(172, 112), Q(222, 112), { size: 7, muted: true });
    s += Tg(Q, 272, 116, 'unchanged', { cls: 'fg-tag-warn' });
    return s;
  }, 'fg-tag-warn'],
];

FIGURES.push({
  id: 'four-substrates',
  section: 'alcohol-oxidation',
  anchor: '<span class="k">Worked example — four substrates, one reagent each</span>',
  alt: 'Four panels in skeletal form. (a) 2-Methylbutan-1-ol with PCC gives 2-methylbutanal, with the new C=O highlighted. (b) The same alcohol with CrO3, H2SO4 and water gives 2-methylbutanoic acid. (c) Cyclohexanol with Jones reagent gives cyclohexanone. (d) 2-Methylbutan-2-ol with excess Jones reagent is unchanged.',
  viewBox: '0 0 760 440',
  build() { return gridFigure(substrateCells, 2, 364, 204, 16, 16, 8, 8, [0, 0, 0, 'warn'], CW4); },
  caption: 'Compare (a) with (b): same alcohol, and only the water differs.',
});

/* ======================================================================
   5. When no reagent on the list is selective: a primary and a secondary
      alcohol in one molecule.
   ====================================================================== */
const CW5 = 300;
function diol(Q, oxidized) {
  const cc = Q(160, 112);
  const pts = polyPts(cc.x, cc.y, 6, 30, 0);   // vertex 0 at the right, 3 at the left
  let s = pts.map((p, i) => sk(p, pts[(i + 1) % 6])).join('');
  const right = pts[0], left = pts[3];
  const cL = armEnd(left, 180, 42);           // the CH2OH (or CHO) carbon
  s += bond(left, cL, { rFrom: 0, rTo: 16 });
  if (!oxidized) {
    // secondary carbinol carbon on the ring, drawn with its H
    const oh = armEnd(right, 30, 42), h = armEnd(right, 330, 36);
    s += bond(right, oh, { rFrom: 16, rTo: 16 }) + bond(right, h, { rFrom: 16, rTo: 14 });
    s += A(oh, 'OH', { r: 16 }) + A(h, 'H', { r: 14, kind: 'hi' });
    s += A(right, 'C', { kind: 'warn' });
    const m = centre(cL, [
      { deg: 180, len: 44, l: 'OH' },
      { deg: 90, len: 36, l: 'H', kind: 'hi' },
      { deg: 270, len: 36, l: 'H', kind: 'hi' },
    ]);
    s += m.s;
    s += Tg(Q, 60, 184, '1°: two H');
    s += Tg(Q, 236, 176, '2°: one H');
  } else {
    const o = armEnd(right, 0, 40);
    s += bond(right, o, { rFrom: 0, rTo: 14, order: 2 }) + A(o, 'O', { r: 14, kind: 'hi' });
    const m = centre(cL, [
      { deg: 120, len: 42, l: 'O', order: 2, kind: 'hi' },
      { deg: 240, len: 38, l: 'H' },
    ]);
    s += m.s;
    s += Tg(Q, 60, 184, 'aldehyde', { cls: 'fg-tag-warn' });
    s += Tg(Q, 236, 164, 'ketone', { cls: 'fg-tag-warn' });
  }
  return s;
}
const diolCells = [
  ['4-(HYDROXYMETHYL)CYCLOHEXAN-1-OL', 'a primary and a secondary alcohol', (Q) => diol(Q, false)],
  ['AFTER PCC', 'both carbinol carbons oxidized', (Q) => diol(Q, true), 'fg-tag-warn'],
];
FIGURES.push({
  id: 'diol-choice',
  section: 'alcohol-oxidation',
  anchor: '<span class="k">Worked example — a primary and a secondary alcohol in one molecule</span>',
  alt: 'Two panels. First, 4-(hydroxymethyl)cyclohexan-1-ol: a cyclohexane ring with an OH and one highlighted hydrogen on the right-hand ring carbon, the secondary carbinol carbon, and a CH2OH group on the left-hand ring carbon, whose carbon holds two highlighted hydrogens, the primary carbinol carbon. Second, after PCC: the ring carbon is now a ketone C=O and the CH2OH has become an aldehyde, CHO.',
  viewBox: '0 0 760 246',
  build() { return gridFigure(diolCells, 2, 364, 230, 16, 16, 8, 8, [0, 'warn'], CW5); },
  caption: 'Each carbinol carbon has at least one hydrogen, so PCC oxidizes both.',
});
FIGURES.push({
  id: 'l-diol-choice',
  lessons: ['alcohol-oxidation'],
  alt: 'Two stacked panels: 4-(hydroxymethyl)cyclohexan-1-ol, with a primary carbinol carbon holding two hydrogens and a secondary one holding one; and the product of PCC, in which both have been oxidized, to an aldehyde and a ketone.',
  viewBox: `0 0 340 ${stackH(2, 230)}`,
  build() { return gridFigure(diolCells, 1, 324, 230, 0, 14, 8, 8, [0, 'warn'], CW5); },
  caption: 'PCC oxidizes both carbinol carbons.',
});

export default FIGURES;
