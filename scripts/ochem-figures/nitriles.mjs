/* Figures for the nitriles notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Nitriles sit in Carboxylic Acids & Derivatives, after skeletal structures,
   so carbon chains are drawn skeletally. The carbon that the cyanide brought
   is highlighted (fg-atom-hi) in every drawing, and a carbon added later by a
   Grignard reagent is drawn in the warning color, so the carbon count can be
   read straight off each figure.

   Most figures are 340 wide, stacked in cells, with only fg-lbl and fg-tag
   text, so the same drawing serves the notes page and a lesson step. The two
   wide summary figures (four destinations, the worked example) are notes
   only, and the three routes into a nitrile have a stacked lesson copy. */
import { atom, bond, arrow, curve, lonePair, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { sk } from '../lib/ochem-skeletal.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

const FIGURES = [];
const r2 = (v) => Math.round(v * 100) / 100;

/* ------------------------------------------------------------ helpers --- */

/* A labelled atom, with a disc sized to its label, and a bond that stops
   at the edge of each disc. An empty label is an unlabelled skeletal vertex. */
const rOf = (l) => (l === '' ? 0 : l.length >= 3 ? 19 : l.length === 2 ? 16 : 14);
const A = (p, l, o = {}) => atom(p.x, p.y, l, { r: rOf(l), ...o });
const B = (a, b, la, lb, o = {}) => bond(a, b, { rFrom: rOf(la), rTo: rOf(lb), ...o });
const charge = (x, y, s) => text(x, y, s, { cls: 'fg-warn', size: 15 });

/* A cell: a panel with a title tag at the top. `draw(Q)` gets a point maker
   already shifted to the cell's corner. */
function cell(ox, oy, w, h, title, draw, opts = {}) {
  const Q = (x, y) => P(ox + x, oy + y);
  let s = panel(ox, oy, w, h, opts.kind ? { kind: opts.kind } : {});
  if (title) s += tag(ox + w / 2, oy + 22, title);
  s += draw(Q);
  return s;
}

/* Orbital shapes, in the colors the Hybridization and Bonding pages use:
   a hybrid lobe is grey, a p orbital is drawn in its two phase colors. */
function ell(cx, cy, rx, ry, deg, cls, extra = '') {
  return `<ellipse class="${cls}" cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}" transform="rotate(${r2(-deg)} ${r2(cx)} ${r2(cy)})"${extra}></ellipse>`;
}
const dirOf = (deg) => ({ x: Math.cos((deg * Math.PI) / 180), y: -Math.sin((deg * Math.PI) / 180) });
function hybridLobe(c, deg, len = 56, w = 13) {
  const d = dirOf(deg);
  const big = P(c.x + d.x * len * 0.54, c.y + d.y * len * 0.54);
  return ell(big.x, big.y, len * 0.5, w, deg, 'fg-fill-mut fg-bond-soft', ' fill-opacity="0.24"');
}
function pOrb(c, deg, len = 44, w = 12) {
  const d = dirOf(deg);
  const a = P(c.x + d.x * len * 0.52, c.y + d.y * len * 0.52);
  const b = P(c.x - d.x * len * 0.52, c.y - d.y * len * 0.52);
  return ell(a.x, a.y, len * 0.5, w, deg, 'fg-orb') + ell(b.x, b.y, len * 0.5, w, deg, 'fg-orb-alt');
}
const cloud = (x1, y1, x2, y2) =>
  `<rect class="fg-dash-hi" x="${r2(x1)}" y="${r2(y1)}" width="${r2(x2 - x1)}" height="${r2(y2 - y1)}" rx="${r2(Math.min(20, (y2 - y1) / 2))}" fill="none"></rect>`;

/* A 180-degree angle arc drawn above point c. */
const straightArc = (c, r) =>
  `<path class="fg-dash-hi" d="M${r2(c.x - r)} ${r2(c.y)} A${r} ${r} 0 0 1 ${r2(c.x + r)} ${r2(c.y)}"></path>`;

/* A resonance arrow: one line with a head at each end. */
const resonance = (a, b) => {
  const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
  return arrow(m, a, { size: 7 }) + arrow(m, b, { size: 7 });
};

/* ------------------------------------------------ skeletal molecules ---
   Each takes the left end of the chain, o, and returns its ink. Bonds in a
   chain run 30 across and 18 up or down (a 120-degree zigzag). The group
   that holds the nitrile carbon, or the carbon it becomes, is highlighted. */
const STEP = { x: 30, y: 18 };
const UP = { x: STEP.x / Math.hypot(STEP.x, STEP.y), y: -STEP.y / Math.hypot(STEP.x, STEP.y) };
const chain3 = (o) => [o, P(o.x + 30, o.y - 18), P(o.x + 60, o.y)];
const chainInk = (v) => v.slice(1).map((p, i) => sk(v[i], p)).join('');

function propylBromide(o) {
  const v = chain3(o);
  const br = P(v[2].x + 32, v[2].y - 18);
  return chainInk(v) + bond(v[2], br, { rFrom: 0, rTo: 16 }) + A(br, 'Br');
}
/* Three chain carbons, then the nitrile carbon and N in one straight line,
   continuing the direction of the last bond (an sp carbon is linear). */
function butanenitrile(o) {
  const v = chain3(o);
  const c = P(v[2].x + UP.x * 34, v[2].y + UP.y * 34);
  const n = P(c.x + UP.x * 40, c.y + UP.y * 40);
  return chainInk(v) + bond(v[2], c, { rFrom: 0, rTo: 14 }) + B(c, n, 'C', 'N', { order: 3 }) +
    A(n, 'N') + A(c, 'C', { kind: 'hi' });
}
function butanamide(o) {
  const v = chain3(o);
  const c = P(v[2].x + 30, v[2].y - 18);
  const ox = P(c.x, c.y - 36), nh = P(c.x + 38, c.y + 22);
  return chainInk(v) + bond(v[2], c, { rFrom: 0, rTo: 14 }) +
    B(c, ox, 'C', 'O', { order: 2 }) + B(c, nh, 'C', 'NH₂') +
    A(ox, 'O') + A(nh, 'NH₂') + A(c, 'C', { kind: 'hi' });
}
function acetone(o) {
  const c = P(o.x + 30, o.y - 18);
  const ox = P(c.x, c.y - 36);
  return sk(o, c) + sk(c, P(o.x + 60, o.y)) + bond(c, ox, { rFrom: 0, rTo: 14, order: 2 }) + A(ox, 'O');
}
function cyanohydrin(o) {
  const c = P(o.x + 34, o.y - 10);
  const oh = P(c.x, c.y - 36);
  const cn = P(c.x + 36, c.y), n = P(c.x + 78, c.y);
  return sk(P(c.x - 32, c.y), c) + sk(c, P(c.x, c.y + 30)) +
    bond(c, oh, { rFrom: 0, rTo: 16 }) + A(oh, 'OH') +
    bond(c, cn, { rFrom: 0, rTo: 14 }) + B(cn, n, 'C', 'N', { order: 3 }) +
    A(n, 'N') + A(cn, 'C', { kind: 'hi' });
}

/* ===================================================================== 1
   The linear nitrile unit: every atom of acetonitrile on one line, the N
   lone pair in an sp orbital pointing outward, and the two pi bonds. */
FIGURES.push({
  id: 'nitrile-linear',
  section: 'nitriles',
  anchor: 'The C&equiv;N bond is 116 pm long.</p>',
  lessons: ['nitriles'],
  viewBox: '0 0 340 506',
  alt: 'Acetonitrile in three panels. Panel 1: H3C, C and N on one straight line, with a 180 degree arc at the nitrile carbon, a triple bond between C and N, delta plus on C and delta minus on N, and the nitrogen lone pair drawn inside a gray sp lobe that points away from the carbon. Panel 2: a side view of the first pi bond, a p orbital above and below both C and N, outlined as one cloud above and one below the axis. Panel 3: the view straight down the C≡N axis, with four lobes around the nitrogen: up and down for the first pi bond, left and right for the second, at right angles to each other.',
  build() {
    let s = '';
    s += cell(8, 8, 324, 176, 'ACETONITRILE, CH₃–C≡N', (Q) => {
      const h3c = Q(50, 94), c = Q(148, 94), n = Q(238, 94);
      let t = straightArc(c, 26);
      t += text(c.x, c.y - 36, '180°', { cls: 'fg-tag' });
      t += hybridLobe(n, 0, 58, 13);
      t += B(h3c, c, 'H₃C', 'C') + B(c, n, 'C', 'N', { order: 3 });
      t += A(h3c, 'H₃C') + A(c, 'C', { kind: 'hi' }) + A(n, 'N');
      t += lonePair(n.x, n.y, 0, { dist: 38 });
      t += text(c.x, c.y + 36, 'δ+', { cls: 'fg-tag-warn' });
      t += text(n.x, n.y + 36, 'δ−', { cls: 'fg-tag-warn' });
      t += tag(Q(162, 0).x, Q(0, 162).y, 'N lone pair: in an sp orbital, pointing out');
      return t;
    });
    s += cell(8, 192, 324, 150, 'THE FIRST π BOND, SEEN FROM THE SIDE', (Q) => {
      const h3c = Q(50, 88), c = Q(148, 88), n = Q(238, 88);
      let t = B(h3c, c, 'H₃C', 'C') + B(c, n, 'C', 'N', { cls: 'fg-bond-soft' });
      t += pOrb(c, 90, 44, 12) + pOrb(n, 90, 44, 12);
      t += cloud(c.x - 20, c.y - 54, n.x + 20, c.y - 17) + cloud(c.x - 20, c.y + 17, n.x + 20, c.y + 54);
      t += A(h3c, 'H₃C') + A(c, 'C', { kind: 'hi' }) + A(n, 'N');
      return t;
    });
    s += cell(8, 350, 324, 148, 'LOOKING STRAIGHT DOWN THE C≡N AXIS', (Q) => {
      const c = Q(130, 86);
      let t = pOrb(c, 90, 48, 12) + pOrb(c, 0, 48, 12);
      t += A(c, 'N');
      t += text(Q(158, 0).x, Q(0, 50).y, 'first π', { cls: 'fg-tag', anchor: 'start' });
      t += text(Q(186, 0).x, Q(0, 76).y, 'second π', { cls: 'fg-tag', anchor: 'start' });
      t += text(Q(186, 0).x, Q(0, 94).y, 'at 90° to it', { cls: 'fg-tag', anchor: 'start' });
      return t;
    });
    return s;
  },
  caption: 'Top: every atom on one line, the nitrogen lone pair pointing away from carbon. Middle and bottom: the two π bonds, at right angles to each other.',
});

/* ===================================================================== 2
   Why an alpha C–H is acidic: the carbanion's lone pair moves into the
   C≡N and the charge lands on nitrogen. */
FIGURES.push({
  id: 'nitrile-alpha-anion',
  section: 'nitriles',
  anchor: 'Enolate Chemistry</a> shows.</p>',
  viewBox: '0 0 340 262',
  alt: 'Two resonance structures of the anion made by removing a proton from acetonitrile. Top: H2C with a lone pair and a negative charge, single-bonded to C, triple-bonded to N. One curved arrow moves the carbon lone pair into the C–C bond; a second moves one pi bond of the C≡N onto nitrogen. A double-headed resonance arrow leads to the bottom structure: H2C=C=N with two lone pairs and the negative charge on nitrogen.',
  build() {
    return cell(8, 8, 324, 246, 'TAKE H⁺ FROM CH₃CN', (Q) => {
      const a = Q(54, 84), c = Q(152, 84), n = Q(250, 84);
      let t = B(a, c, 'H₂C', 'C') + B(c, n, 'C', 'N', { order: 3 });
      t += A(a, 'H₂C') + A(c, 'C', { kind: 'hi' }) + A(n, 'N');
      t += lonePair(a.x, a.y, 270, { dist: 26 });
      t += charge(a.x - 24, a.y - 20, '−');
      t += lonePair(n.x, n.y, 0, { dist: 22 });
      t += curve(P(a.x + 8, a.y - 30), P(a.x + 50, a.y - 6), { bow: -14, size: 7 });
      t += curve(P(c.x + 42, c.y - 9), P(n.x - 6, n.y - 18), { bow: -12, size: 7 });
      t += resonance(Q(152, 118), Q(152, 158));
      const a2 = Q(54, 194), c2 = Q(152, 194), n2 = Q(250, 194);
      t += B(a2, c2, 'H₂C', 'C', { order: 2 }) + B(c2, n2, 'C', 'N', { order: 2 });
      t += A(a2, 'H₂C') + A(c2, 'C', { kind: 'hi' }) + A(n2, 'N');
      t += lonePair(n2.x, n2.y, 300, { dist: 22 }) + lonePair(n2.x, n2.y, 60, { dist: 22 });
      t += charge(n2.x + 32, n2.y + 5, '−');
      t += tag(Q(162, 0).x, Q(0, 236).y, 'the negative charge now sits on nitrogen');
      return t;
    });
  },
  caption: 'Two drawings of one anion. The arrows start at the carbon lone pair and at one π bond of the C≡N.',
});

/* ===================================================================== 3
   Three ways in: SN2 on a primary halide, dehydrating a primary amide,
   and adding cyanide to a ketone. */
const ROUTES = [
  { left: propylBromide, lname: '1-bromopropane', rg: 'NaCN', sub: 'SN2 at a primary carbon', right: butanenitrile, rname: 'butanenitrile' },
  { left: butanamide, lname: 'butanamide', rg: 'SOCl₂ or P₂O₅', sub: 'removes H₂O', right: butanenitrile, rname: 'butanenitrile' },
  { left: acetone, lname: 'acetone', rg: 'HCN, a little NaCN', sub: 'cyanide adds to the C=O', right: cyanohydrin, rname: 'acetone cyanohydrin' },
];

FIGURES.push({
  id: 'nitrile-sources',
  section: 'nitriles',
  anchor: '<h3>Where nitriles come from</h3>',
  viewBox: '0 0 760 356',
  alt: 'Three rows. Row 1: 1-bromopropane with NaCN, by SN2 at a primary carbon, gives butanenitrile, whose nitrile carbon is highlighted. Row 2: butanamide with SOCl2 or P2O5, which removes water, gives butanenitrile; the amide carbon becomes the nitrile carbon. Row 3: acetone with HCN and a little NaCN gives acetone cyanohydrin, a carbon carrying an OH, two methyls and a C≡N.',
  build() {
    let s = '';
    ROUTES.forEach((r, i) => {
      const y = 84 + i * 112;
      s += r.left(P(56, y));
      s += tag(116, y + 34, r.lname, { cls: 'fg-tag-mut' });
      s += arrow(P(236, y - 8), P(392, y - 8));
      s += tag(314, y - 18, r.rg);
      s += tag(314, y + 10, r.sub, { cls: 'fg-tag-mut' });
      s += r.right(P(430, y));
      s += tag(604, y - 4, r.rname, { anchor: 'start' });
      if (i < 2) s += rule(24, y + 50, 736, y + 50);
    });
    return s;
  },
  caption: 'Three ways to make a nitrile. The highlighted carbon is the nitrile carbon in each product.',
});

FIGURES.push({
  id: 'l-nitrile-sources',
  lessons: ['nitriles'],
  viewBox: '0 0 340 698',
  alt: 'Three stacked panels. 1-bromopropane with NaCN, by SN2, gives butanenitrile. Butanamide with SOCl2 or P2O5, which removes water, gives butanenitrile. Acetone with HCN and a little NaCN gives acetone cyanohydrin. The nitrile carbon is highlighted in each product.',
  build() {
    let s = '';
    ROUTES.forEach((r, i) => {
      s += cell(8, 8 + i * 230, 324, 222, '', (Q) => {
        let t = r.left(Q(26, 66));
        t += tag(Q(248, 0).x, Q(0, 50).y, r.lname, { cls: 'fg-tag-mut' });
        t += arrow(Q(60, 90), Q(60, 124));
        t += tag(Q(76, 0).x, Q(0, 104).y, r.rg, { anchor: 'start' });
        t += tag(Q(76, 0).x, Q(0, 120).y, r.sub, { cls: 'fg-tag-mut', anchor: 'start' });
        t += r.right(Q(r.right === cyanohydrin ? 64 : 26, 196));
        t += tag(Q(248, 0).x, Q(0, 160).y, r.rname);
        return t;
      });
    });
    return s;
  },
  caption: 'The highlighted carbon is the nitrile carbon in each product.',
});

/* ===================================================================== 4
   The two hydride reagents: the same first step, then a fork. */
function hydrideStep(Q) {
  const r = Q(40, 78), c = Q(134, 78), n = Q(230, 78);
  let t = B(r, c, 'R', 'C') + B(c, n, 'C', 'N', { order: 3 });
  const h = Q(134, 146), al = Q(212, 146);
  t += bond(h, al, { rFrom: 12, rTo: 16 });
  t += A(r, 'R') + A(n, 'N') + A(c, 'C', { kind: 'hi' });
  t += atom(h.x, h.y, 'H', { r: 12 }) + A(al, 'Al');
  t += lonePair(n.x, n.y, 0, { dist: 22 });
  t += curve(Q(172, 140), Q(140, 97), { bow: 12, size: 7 });
  t += curve(Q(180, 70), Q(224, 60), { bow: -12, size: 7 });
  return t;
}
function imineAnionAl(Q) {
  const c = Q(134, 86), n = Q(228, 86);
  const r = armEnd(c, 120, 52), h = armEnd(c, 240, 46), al = armEnd(n, 300, 58);
  let t = B(c, r, 'C', 'R') + bond(c, h, { rFrom: 14, rTo: 12 }) + B(c, n, 'C', 'N', { order: 2 }) + B(n, al, 'N', 'Al');
  t += A(r, 'R') + atom(h.x, h.y, 'H', { r: 12 }) + A(al, 'Al') + A(n, 'N') + A(c, 'C', { kind: 'hi' });
  t += lonePair(n.x, n.y, 300, { dist: 22 });
  return t;
}
FIGURES.push({
  id: 'nitrile-two-reductions',
  section: 'nitriles',
  anchor: 'hydrolyzes it to the aldehyde.</p>',
  lessons: ['nitriles'],
  viewBox: '0 0 340 628',
  alt: 'Three panels. Panel 1: R–C≡N with an H–Al unit below the carbon; one curved arrow runs from the H–Al bond to the nitrile carbon, a second moves one pi bond of the C≡N onto nitrogen. Panel 2: the imine anion, with R and H on the old nitrile carbon, a C=N double bond, one lone pair on nitrogen, and aluminum bonded to the nitrogen. Panel 3, two columns. Left, DIBAL-H: it adds one hydride and stops; H3O+ then gives the aldehyde, R–CH=O. Right, LiAlH4: a second hydride adds, and water then gives the primary amine, R–CH2–NH2.',
  build() {
    let s = '';
    s += cell(8, 8, 324, 184, 'ONE HYDRIDE ADDS TO THE NITRILE CARBON', (Q) => {
      let t = hydrideStep(Q);
      t += tag(Q(162, 0).x, Q(0, 174).y, 'H–Al: the hydride from LiAlH₄ or DIBAL-H');
      return t;
    });
    s += cell(8, 200, 324, 184, 'AN IMINE ANION, HELD BY ALUMINUM', (Q) => {
      let t = imineAnionAl(Q);
      t += tag(Q(162, 0).x, Q(0, 174).y, 'metal on N: now a poor electrophile');
      return t;
    });
    s += cell(8, 392, 158, 228, 'DIBAL-H', (Q) => {
      let t = tag(Q(79, 0).x, Q(0, 44).y, 'cannot add again');
      t += arrow(Q(50, 56), Q(50, 96));
      t += tag(Q(62, 0).x, Q(0, 80).y, 'H₃O⁺', { anchor: 'start' });
      const c = Q(80, 160), o = Q(80, 124), r = armEnd(c, 210, 44), h = armEnd(c, 330, 40);
      t += B(c, o, 'C', 'O', { order: 2 }) + B(c, r, 'C', 'R') + bond(c, h, { rFrom: 14, rTo: 12 });
      t += A(o, 'O') + A(r, 'R') + atom(h.x, h.y, 'H', { r: 12 }) + A(c, 'C', { kind: 'hi' });
      t += tag(Q(79, 0).x, Q(0, 216).y, 'an aldehyde', { cls: 'fg-tag-good' });
      return t;
    });
    s += cell(174, 392, 158, 228, 'LiAlH₄', (Q) => {
      let t = tag(Q(79, 0).x, Q(0, 44).y, 'adds a second H⁻');
      t += arrow(Q(50, 56), Q(50, 96));
      t += tag(Q(62, 0).x, Q(0, 80).y, 'then H₂O', { anchor: 'start' });
      const r = Q(24, 160), c = Q(76, 160), n = Q(130, 160);
      t += B(r, c, 'R', 'CH₂') + B(c, n, 'CH₂', 'NH₂');
      t += A(r, 'R') + A(n, 'NH₂') + A(c, 'CH₂', { kind: 'hi' });
      t += tag(Q(79, 0).x, Q(0, 216).y, 'a primary amine', { cls: 'fg-tag-good' });
      return t;
    });
    return s;
  },
  caption: 'Both reagents make the same imine anion. What happens next depends on the reagent.',
});

/* ===================================================================== 5
   A Grignard adds once: the imine anion, then the ketone on workup. */
FIGURES.push({
  id: 'nitrile-stops-at-the-anion',
  section: 'nitriles',
  anchor: 'the imine hydrolyzes to a <b>ketone</b>.</p>',
  lessons: ['nitriles'],
  viewBox: '0 0 340 572',
  alt: 'Three panels. Panel 1: R–C≡N with CH3–Mg–Br below the carbon; one curved arrow runs from the C–Mg bond to the nitrile carbon, a second moves one pi bond of the C≡N onto nitrogen. Panel 2: the imine anion, with R and CH3 on the old nitrile carbon, a C=N double bond, two lone pairs and a negative charge on nitrogen, and MgBr+ beside it; no second CH3MgBr can attack it. Panel 3: after H3O+ workup, the imine with C=NH, which hydrolyzes to the ketone with C=O.',
  build() {
    let s = '';
    s += cell(8, 8, 324, 184, 'CH₃MgBr ADDS TO THE NITRILE CARBON', (Q) => {
      const r = Q(40, 78), c = Q(134, 78), n = Q(230, 78);
      let t = B(r, c, 'R', 'C') + B(c, n, 'C', 'N', { order: 3 });
      const me = Q(134, 146), mg = Q(206, 146), br = Q(272, 146);
      t += B(me, mg, 'CH₃', 'Mg') + B(mg, br, 'Mg', 'Br');
      t += A(r, 'R') + A(n, 'N') + A(c, 'C', { kind: 'hi' });
      t += A(me, 'CH₃', { kind: 'warn' }) + A(mg, 'Mg') + A(br, 'Br');
      t += lonePair(n.x, n.y, 0, { dist: 22 });
      t += curve(Q(170, 140), Q(140, 97), { bow: 12, size: 7 });
      t += curve(Q(180, 70), Q(224, 60), { bow: -12, size: 7 });
      t += tag(Q(162, 0).x, Q(0, 178).y, 'the CH₃ carbon bonds to the nitrile carbon');
      return t;
    });
    s += cell(8, 200, 324, 184, 'AN IMINE ANION: NOTHING LEFT TO ATTACK', (Q) => {
      const c = Q(134, 86), n = Q(228, 86);
      const r = armEnd(c, 120, 52), me = armEnd(c, 240, 52);
      let t = B(c, r, 'C', 'R') + B(c, me, 'C', 'CH₃') + B(c, n, 'C', 'N', { order: 2 });
      t += A(r, 'R') + A(me, 'CH₃', { kind: 'warn' }) + A(n, 'N') + A(c, 'C', { kind: 'hi' });
      t += lonePair(n.x, n.y, 300, { dist: 22 }) + lonePair(n.x, n.y, 60, { dist: 22 });
      t += charge(n.x + 32, n.y + 5, '−');
      t += tag(Q(290, 0).x, Q(0, 132).y, 'MgBr⁺');
      t += tag(Q(162, 0).x, Q(0, 174).y, 'an anion, not a carbonyl');
      return t;
    });
    s += cell(8, 392, 324, 172, 'H₃O⁺ WORKUP: AN IMINE, THEN THE KETONE', (Q) => {
      const c1 = Q(70, 92), c2 = Q(236, 92);
      const nh = armEnd(c1, 0, 52), o = armEnd(c2, 0, 50);
      let t = '';
      for (const [c, x] of [[c1, nh], [c2, o]]) {
        const r = armEnd(c, 120, 46), me = armEnd(c, 240, 46);
        t += B(c, r, 'C', 'R') + B(c, me, 'C', 'CH₃');
        t += A(r, 'R') + A(me, 'CH₃', { kind: 'warn' });
      }
      t += B(c1, nh, 'C', 'NH', { order: 2 }) + B(c2, o, 'C', 'O', { order: 2 });
      t += A(nh, 'NH') + A(o, 'O') + A(c1, 'C', { kind: 'hi' }) + A(c2, 'C', { kind: 'hi' });
      t += arrow(Q(152, 92), Q(188, 92));
      t += tag(Q(100, 0).x, Q(0, 160).y, 'an imine');
      t += tag(Q(280, 0).x, Q(0, 160).y, 'the ketone', { cls: 'fg-tag-good' });
      return t;
    });
    return s;
  },
  caption: 'The Grignard reagent adds once. The ketone forms only on workup, after the Grignard reagent is gone.',
});

/* ===================================================================== 6
   One nitrile, four products, with the nitrile carbon tracked. */
function fourProduct(x, ry, kind) {
  const e0 = P(x, ry - 9), e1 = P(x + 30, ry + 9), c = P(x + 60, ry - 9);
  let s = sk(e0, e1);
  if (kind === 'amine') {
    const nh = armEnd(c, 330, 50);
    return s + bond(e1, c, { rFrom: 0, rTo: 19 }) + B(c, nh, 'CH₂', 'NH₂') + A(nh, 'NH₂') + A(c, 'CH₂', { kind: 'hi' });
  }
  const o = armEnd(c, 90, 34);
  s += bond(e1, c, { rFrom: 0, rTo: 14 }) + B(c, o, 'C', 'O', { order: 2 }) + A(o, 'O');
  if (kind === 'acid') { const oh = armEnd(c, 330, 44); s += B(c, oh, 'C', 'OH') + A(oh, 'OH'); }
  if (kind === 'ald') { const h = armEnd(c, 330, 38); s += bond(c, h, { rFrom: 14, rTo: 12 }) + atom(h.x, h.y, 'H', { r: 12 }); }
  if (kind === 'ket') { const me = armEnd(c, 330, 48); s += B(c, me, 'C', 'CH₃') + A(me, 'CH₃', { kind: 'warn' }); }
  return s + A(c, 'C', { kind: 'hi' });
}
FIGURES.push({
  id: 'nitrile-four-ways',
  section: 'nitriles',
  anchor: '<h3>One carbon, four destinations</h3>',
  viewBox: '0 0 760 364',
  alt: 'Propanenitrile, drawn skeletally with its nitrile carbon highlighted, at the left, with four arrows. H3O+ or HO− with heat gives propanoic acid. LiAlH4, then water, gives propan-1-amine, where the nitrile carbon is now the CH2. DIBAL-H, one equivalent at −78 °C, then H3O+, gives propanal. CH3MgBr, then H3O+, gives butan-2-one, with the new CH3 in a second color. The highlighted carbon is present in all five structures.',
  build() {
    let s = panel(20, 128, 196, 110, { kind: 'warn' });
    const v = [P(52, 196), P(82, 178), P(112, 196)];
    const c = P(v[2].x + UP.x * 34, v[2].y + UP.y * 34);
    const n = P(c.x + UP.x * 40, c.y + UP.y * 40);
    s += chainInk(v) + bond(v[2], c, { rFrom: 0, rTo: 14 }) + B(c, n, 'C', 'N', { order: 3 }) + A(n, 'N') + A(c, 'C', { kind: 'hi' });
    s += tag(118, 226, 'propanenitrile');
    const rows = [
      { ry: 52, rg: 'H₃O⁺ or HO⁻, heat', kind: 'acid', name: 'propanoic acid' },
      { ry: 136, rg: 'LiAlH₄, then H₂O', kind: 'amine', name: 'propan-1-amine' },
      { ry: 220, rg: 'DIBAL-H, 1 equiv, −78 °C', kind: 'ald', name: 'propanal' },
      { ry: 304, rg: 'CH₃MgBr, then H₃O⁺', kind: 'ket', name: 'butan-2-one' },
    ];
    for (const r of rows) {
      s += arrow(P(226, 183), P(330, r.ry + 2));
      s += tag(340, r.ry + 6, r.rg, { anchor: 'start' });
      s += fourProduct(520, r.ry + 10, r.kind);
      s += tag(658, r.ry + 6, r.name, { anchor: 'start', cls: 'fg-tag-good' });
    }
    return s;
  },
  caption: 'Follow the highlighted carbon: it is the nitrile carbon, and every product keeps it. The one new carbon, the CH₃ drawn in the second color, came from the Grignard reagent.',
});

/* ===================================================================== 7
   The worked example: where each of pentan-2-one's five carbons came from. */
FIGURES.push({
  id: 'nitrile-pentanone-route',
  section: 'nitriles',
  anchor: 'pentan-2-one, CH<sub>3</sub>CH<sub>2</sub>CH<sub>2</sub>COCH<sub>3</sub>.</p>',
  viewBox: '0 0 760 222',
  alt: 'Three skeletal structures in a row. 1-bromopropane, three carbons, with NaCN gives butanenitrile, four carbons, whose nitrile carbon is highlighted. With CH3MgBr, then H3O+, butanenitrile gives pentan-2-one, five carbons: the three from 1-bromopropane, the highlighted carbonyl carbon that came from cyanide, and a CH3 in a second color that came from the Grignard reagent.',
  build() {
    let s = '';
    const y = 108;
    s += propylBromide(P(40, y));
    s += tag(96, y + 40, '1-bromopropane: 3 C', { cls: 'fg-tag-mut' });
    s += arrow(P(176, y - 10), P(258, y - 10));
    s += tag(217, y - 22, 'NaCN');
    s += butanenitrile(P(282, y));
    s += tag(346, y + 40, 'butanenitrile: 4 C', { cls: 'fg-tag-mut' });
    s += arrow(P(450, y - 10), P(560, y - 10));
    s += tag(505, y - 38, 'CH₃MgBr,');
    s += tag(505, y - 22, 'then H₃O⁺');
    const v = chain3(P(578, y));
    const c = P(v[2].x + 30, v[2].y - 18);
    const o = P(c.x, c.y - 36), me = P(c.x + 40, c.y + 24);
    s += chainInk(v) + bond(v[2], c, { rFrom: 0, rTo: 14 }) + B(c, o, 'C', 'O', { order: 2 }) + B(c, me, 'C', 'CH₃');
    s += A(o, 'O') + A(me, 'CH₃', { kind: 'warn' }) + A(c, 'C', { kind: 'hi' });
    s += tag(640, y + 40, 'pentan-2-one: 5 C', { cls: 'fg-tag-good' });
    s += rule(24, 172, 736, 172);
    s += atom(150, 198, '', { kind: 'hi', r: 8 }) + tag(164, 202, 'from cyanide', { anchor: 'start' });
    s += atom(330, 198, '', { kind: 'warn', r: 8 }) + tag(344, 202, 'from CH₃MgBr', { anchor: 'start' });
    s += sk(P(500, 202), P(520, 190)) + sk(P(520, 190), P(540, 202)) + tag(552, 202, 'from 1-bromopropane', { anchor: 'start' });
    return s;
  },
  caption: 'Where each carbon of pentan-2-one came from.',
});

export default FIGURES;
