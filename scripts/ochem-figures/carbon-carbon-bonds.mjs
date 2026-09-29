/* Figures for the carbon-carbon-bonds notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   This is a chapter-21 page, so every structure is skeletal: an unlabeled
   vertex is a carbon. The bond each reaction makes is drawn in the highlight
   color (fg-bond-hi); a bond that is about to form is dashed (fg-dash-hi).

   Most drawings are built as 340-wide blocks. A notes figure sets two or
   three of them side by side; the lesson copy (id prefix l-) stacks them.
   Lesson figures use only fg-lbl and fg-tag text. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, P } from '../lib/ochem-figure.mjs';
import { ringDouble, polyPts, locant, benzene } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];
const RAD = Math.PI / 180;
const r1 = (v) => Math.round(v * 10) / 10;
const mid = (a, b) => P(r1((a.x + b.x) / 2), r1((a.y + b.y) / 2));
/* A point `len` from p in screen degrees: 0 is east, 90 is straight down. */
const off = (p, deg, len) => P(r1(p.x + Math.cos(deg * RAD) * len), r1(p.y + Math.sin(deg * RAD) * len));
const dirOf = (a, b) => Math.atan2(b.y - a.y, b.x - a.x) / RAD;
const sk = (a, b, cls) => bond(a, b, { rFrom: 0, rTo: 0, cls: cls || 'fg-bond' });
/* A labeled group on a skeletal vertex: bond from the vertex, then the atom. */
function grp(p, deg, len, lbl, o = {}) {
  const q = off(p, deg, len);
  const r = o.r ?? 11;
  return bond(p, q, { rFrom: 0, rTo: r + 1, order: o.order || 1, cls: o.cls, gap: o.gap ?? 3.4 }) +
    atom(q.x, q.y, lbl, { r, kind: o.kind });
}
/* A bare skeletal methyl (a line end), optionally highlighted. */
const methyl = (p, deg, len = 24, cls) => sk(p, off(p, deg, len), cls);
/* A skeletal zigzag chain. Even indices on y0, odd ones shifted by dy. */
const chain = (x0, y0, n, dx = 28, dy = 16) =>
  Array.from({ length: n }, (_, i) => P(x0 + i * dx, y0 + (i % 2 ? dy : 0)));
const path = (pts, hi = []) => pts.slice(1).map((p, i) => sk(pts[i], p, hi.includes(i) ? 'fg-bond-hi' : '')).join('');
const down = (x, y1, y2) => arrow(P(x, y1), P(x, y2), { size: 8 });
const right = (y, x1, x2) => arrow(P(x1, y), P(x2, y), { size: 8 });

/* ================================================================ the ten ===
   Each reaction once, drawn as its product with the bond it made in color. */
function tenPanels() {
  return [
    { t: 'Grignard or RLi + carbonyl', r: 'cyclohexanone + CH₃MgBr, then H₃O⁺', n: '1-methylcyclohexan-1-ol',
      draw(cx, cy) {
        const v = polyPts(cx - 24, cy, 6, 21, 0);
        let s = v.map((p, i) => sk(p, v[(i + 1) % 6])).join('');
        s += grp(v[0], -40, 26, 'OH', { r: 13 });
        s += methyl(v[0], 40, 28, 'fg-bond-hi');
        return s;
      } },
    { t: 'Grignard + CO₂', r: 'CH₃CH₂MgBr + CO₂, then H₃O⁺', n: 'propanoic acid',
      draw(cx, cy) {
        const c = chain(cx - 40, cy + 8, 3, 28, -16);
        let s = path(c, [1]);
        s += grp(c[2], -90, 24, 'O', { order: 2 });
        s += grp(c[2], 30, 26, 'OH', { r: 13 });
        return s;
      } },
    { t: 'acetylide + alkyl halide', r: 'HC≡C⁻ Na⁺ + CH₃CH₂Br', n: 'but-1-yne',
      draw(cx, cy) {
        const h = P(cx - 66, cy), a = P(cx - 44, cy), b = P(cx - 14, cy), c = P(cx + 14, cy), d = P(cx + 38, cy - 14);
        let s = atom(h.x, h.y, 'H', { r: 9 });
        s += bond(h, a, { rFrom: 10, rTo: 0 });
        s += bond(a, b, { order: 3, rFrom: 0, rTo: 0, gap: 3 });
        s += sk(b, c, 'fg-bond-hi') + sk(c, d);
        return s;
      } },
    { t: 'cyanide + alkyl halide', r: 'CH₃CH₂Br + NaCN', n: 'propanenitrile',
      draw(cx, cy) {
        const a = P(cx - 50, cy + 8), b = P(cx - 26, cy - 6), c = P(cx + 4, cy - 6), nn = P(cx + 34, cy - 6);
        let s = sk(a, b) + sk(b, c, 'fg-bond-hi');
        s += bond(c, nn, { order: 3, rFrom: 0, rTo: 11, gap: 3 }) + atom(nn.x, nn.y, 'N', { r: 11 });
        return s;
      } },
    { t: 'aldol', r: '2 × acetaldehyde, NaOH', n: '3-hydroxybutanal',
      draw(cx, cy) {
        const c = chain(cx - 42, cy + 8, 4, 28, -16);
        let s = path(c, [1]);
        s += grp(c[1], -90, 22, 'OH', { r: 13 });
        s += grp(c[3], 30, 24, 'O', { order: 2 });
        return s;
      } },
    { t: 'Claisen', r: '2 × ethyl acetate, NaOEt', n: 'ethyl acetoacetate',
      draw(cx, cy) {
        const c = chain(cx - 58, cy + 10, 4, 28, -16);
        let s = path(c, [1]);
        s += grp(c[1], -90, 24, 'O', { order: 2 });
        s += grp(c[3], -90, 24, 'O', { order: 2 });
        s += grp(c[3], 30, 30, 'OEt', { r: 15 });
        return s;
      } },
    { t: 'Michael (conjugate) addition', r: 'malonate enolate + but-3-en-2-one', n: 'a 1,5-keto ester',
      draw(cx, cy) {
        const c = chain(cx - 30, cy + 2, 5, 26, -16);
        let s = path(c, [0]);
        s += grp(c[0], -140, 36, 'CO₂Et', { r: 19 });
        s += grp(c[0], 140, 36, 'CO₂Et', { r: 19 });
        s += grp(c[3], -90, 22, 'O', { order: 2 });
        return s;
      } },
    { t: 'Diels–Alder', r: 'butadiene + ethene, the simplest case', n: 'cyclohexene, two bonds at once',
      draw(cx, cy) {
        /* Top four corners came from the diene, the bottom edge from ethene.
           The two new sigma bonds join them; the new pi bond is on top. */
        const at = (deg) => off(P(cx, cy + 2), deg, 27);
        const c1 = at(180), c2 = at(240), c3 = at(300), c4 = at(0), d2 = at(60), d1 = at(120);
        const ctr = P(cx, cy + 2);
        return sk(c1, c2) + ringDouble(c2, c3, ctr, { inset: 6 }) + sk(c3, c4) + sk(c4, d2, 'fg-bond-hi') + sk(d2, d1) + sk(d1, c1, 'fg-bond-hi');
      } },
    { t: 'Friedel–Crafts acylation', r: 'benzene + CH₃COCl, AlCl₃', n: 'acetophenone',
      draw(cx, cy) {
        const { svg, pts } = benzene(cx - 30, cy + 4, 21, { rot: 0 });
        const k = off(pts[0], -30, 26);
        let s = svg + sk(pts[0], k, 'fg-bond-hi');
        s += grp(k, -90, 22, 'O', { order: 2 });
        s += methyl(k, 30, 26);
        return s;
      } },
    { t: 'Wittig', r: 'cyclohexanone + Ph₃P=CH₂', n: 'methylenecyclohexane',
      draw(cx, cy) {
        const v = polyPts(cx - 22, cy, 6, 21, 0);
        let s = v.map((p, i) => sk(p, v[(i + 1) % 6])).join('');
        const e = off(v[0], 0, 28);
        s += bond(v[0], e, { order: 2, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 3.4 });
        return s;
      } },
  ];
}

FIGURES.push({
  id: 'the-ten-drawn-once',
  section: 'carbon-carbon-bonds',
  anchor: '<!-- fig:the-ten-drawn-once:start -->',
  alt: 'Ten panels, one per reaction, each showing the product in skeletal form with the new carbon-carbon bond in color: 1-methylcyclohexan-1-ol, propanoic acid, but-1-yne, propanenitrile, 3-hydroxybutanal, ethyl acetoacetate, the malonate Michael adduct, cyclohexene with its two new bonds, acetophenone and methylenecyclohexane.',
  viewBox: '0 0 700 856',
  build() {
    let s = '';
    const PW = 334, PH = 156;
    const cols = [10, 356];
    const rows = [10, 174, 338, 502, 666];
    tenPanels().forEach((pn, i) => {
      const x = cols[i % 2], y = rows[Math.floor(i / 2)];
      const cx = x + PW / 2;
      s += panel(x, y, PW, PH);
      s += tag(cx, y + 20, pn.t);
      s += text(cx, y + 38, pn.r, { cls: 'fg-sm' });
      s += pn.draw(cx, y + 90);
      s += text(cx, y + 146, pn.n, { cls: 'fg-tag-good' });
    });
    s += tag(350, 846, 'in color: the bond the reaction made', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'One example of each reaction, drawn as its product. Find the colored bond first, then the functional group next to it.',
  note: 'The Wittig panel colors the whole C=C, because the reaction makes both of its bonds. The Diels&ndash;Alder panel has two colored bonds, because it makes two.',
});

/* ======================================================= counting a target ===
   1-phenylpropan-1-ol: six carbons from benzene, three in the chain, and the
   two bonds a count points at. Used in the notes and the lesson. */
FIGURES.push({
  id: 'count-phenylpropanol',
  section: 'carbon-carbon-bonds',
  lessons: ['carbon-carbon-bonds'],
  anchor: '<!-- fig:count-phenylpropanol:start -->',
  alt: '1-Phenylpropan-1-ol in skeletal form: a benzene ring bonded to a three-carbon chain whose first carbon carries OH. The ring is labeled six carbons from benzene and the chain three carbons. Bond a, between the ring and the first chain carbon, is highlighted. Bond b, between the first and second chain carbons, is dashed.',
  viewBox: '0 0 340 214',
  build() {
    let s = '';
    const { svg, pts } = benzene(92, 110, 30, { rot: 0 });
    s += svg;
    const c1 = off(pts[0], -30, 30), c2 = off(c1, 30, 30), c3 = off(c2, -30, 30);
    s += sk(pts[0], c1, 'fg-bond-hi');
    s += sk(c1, c2, 'fg-dash-hi');
    s += sk(c2, c3);
    s += grp(c1, -90, 26, 'OH', { r: 13 });
    s += tag(mid(pts[0], c1).x - 4, mid(pts[0], c1).y + 22, 'a', { cls: 'fg-tag-good' });
    s += tag(mid(c1, c2).x + 4, mid(c1, c2).y + 24, 'b', { cls: 'fg-tag-warn' });
    s += tag(92, 170, '6 C from benzene');
    s += tag(220, 170, '3 C in the chain');
    s += tag(92, 196, 'a: joins ring to chain', { cls: 'fg-tag-mut' });
    s += tag(250, 196, 'b: inside the chain', { cls: 'fg-tag-mut' });
    s += tag(170, 22, '1-phenylpropan-1-ol, 9 carbons');
    return s;
  },
  caption: 'Count the carbons in each piece, then find the bond that joins the pieces.',
});

/* The lesson's counting question: diphenylmethanol, three pieces. */
FIGURES.push({
  id: 'l-diphenylmethanol',
  lessons: ['carbon-carbon-bonds'],
  alt: 'Diphenylmethanol in skeletal form: two benzene rings, each bonded to one central carbon that also carries OH and H.',
  viewBox: '0 0 340 170',
  build() {
    let s = '';
    const c = P(170, 104);
    const L = benzene(92, 122, 28, { rot: 0 });
    const R = benzene(248, 122, 28, { rot: 0 });
    s += L.svg + R.svg;
    s += sk(L.pts[0], c) + sk(c, R.pts[3]);
    s += grp(c, -90, 28, 'OH', { r: 13 });
    s += tag(170, 22, 'diphenylmethanol');
    return s;
  },
  caption: 'Count the carbons in each ring and the one between them.',
});

/* ================================================ same count, other skeleton ===
   Butan-1-ol and 2-methylpropan-2-ol: four carbons each, joined differently. */
FIGURES.push({
  id: 'same-count-skeletons',
  section: 'carbon-carbon-bonds',
  lessons: ['carbon-carbon-bonds'],
  anchor: '<!-- fig:same-count-skeletons:start -->',
  alt: 'Left: butan-1-ol, an unbranched chain of four carbons with OH on the end carbon. Right: 2-methylpropan-2-ol, a central carbon carrying OH and three methyl groups. Both are labeled four carbons.',
  viewBox: '0 0 340 178',
  build() {
    let s = '';
    const c = chain(24, 98, 4, 28, -16);
    s += path(c) + grp(c[3], -30, 26, 'OH', { r: 13 });
    s += tag(78, 146, 'butan-1-ol');
    s += tag(78, 164, 'unbranched chain', { cls: 'fg-tag-good' });
    const m = P(252, 96);
    s += methyl(m, 180, 28) + methyl(m, 0, 28) + methyl(m, 90, 28);
    s += grp(m, -90, 26, 'OH', { r: 13 });
    s += tag(252, 146, '2-methylpropan-2-ol');
    s += tag(252, 164, 'branched', { cls: 'fg-tag-good' });
    s += tag(170, 22, 'four carbons each, joined differently', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Same count, different skeleton: turning one into the other means changing a C–C bond.',
});

/* ==================================================== one-carbon extensions ===
   From 1-bromobutane: the new carbon, and the bond to it, in color. */
/* A five-carbon product drawn left to right, C5 ... C1, with C1 the new
   carbon. `fg` draws the group on C1. Returns the ink. */
function fiveChain(x0, y0, fg, dx = 26, dy = 15) {
  const c = chain(x0, y0, 5, dx, -dy); // c[4] is C1
  let s = path(c, [3]);
  const C1 = c[4], C2 = c[3];
  if (fg === 'CN') {
    const nn = off(C1, dirOf(C2, C1), 26);
    s += bond(C1, nn, { order: 3, rFrom: 0, rTo: 11, gap: 3 }) + atom(nn.x, nn.y, 'N', { r: 11 });
  } else if (fg === 'CO2H') {
    s += grp(C1, 90, 22, 'O', { order: 2 });
    s += grp(C1, -30, 24, 'OH', { r: 13 });
  } else if (fg === 'NH2') {
    s += grp(C1, -30, 24, 'NH₂', { r: 14 });
  } else if (fg === 'OH') {
    s += grp(C1, -30, 24, 'OH', { r: 13 });
  }
  return s;
}
function bromobutane(x0, y0) {
  const c = chain(x0, y0, 4, 26, -15);
  return path(c) + grp(c[3], -30, 24, 'Br', { r: 12 });
}

FIGURES.push({
  id: 'one-carbon-extensions',
  section: 'carbon-carbon-bonds',
  anchor: '<!-- fig:one-carbon-extensions:start -->',
  alt: '1-Bromobutane at the left, with three arrows. NaCN gives pentanenitrile, which H3O+ and heat turn into pentanoic acid and LiAlH4 then water turns into pentan-1-amine. Mg then CO2 then H3O+ gives pentanoic acid. Mg then formaldehyde then H3O+ gives pentan-1-ol. In every product the fifth carbon and its bond to the chain are in color.',
  viewBox: '0 0 720 356',
  build() {
    let s = '';
    s += bromobutane(20, 206);
    s += tag(66, 242, '1-bromobutane, 4 C');
    // a rail from the start, then one arrow per route
    s += `<line class="fg-arrow" x1="142" y1="190" x2="164" y2="190"></line>`;
    s += `<line class="fg-arrow" x1="164" y1="84" x2="164" y2="300"></line>`;
    s += right(84, 164, 270) + right(190, 164, 270) + right(300, 164, 270);
    s += tag(218, 74, 'NaCN');
    s += tag(218, 180, 'Mg, then CO₂,');
    s += tag(218, 208, 'then H₃O⁺');
    s += tag(218, 290, 'Mg, then HCHO,');
    s += tag(218, 318, 'then H₃O⁺');
    // middle column
    s += fiveChain(290, 92, 'CN');
    s += tag(352, 126, 'pentanenitrile');
    s += fiveChain(290, 198, 'CO2H');
    s += tag(352, 250, 'pentanoic acid', { cls: 'fg-tag-good' });
    s += fiveChain(290, 308, 'OH');
    s += tag(352, 342, 'pentan-1-ol', { cls: 'fg-tag-good' });
    // the nitrile goes on
    s += arrow(P(446, 70), P(520, 46), { size: 8 });
    s += arrow(P(446, 96), P(520, 132), { size: 8 });
    s += tag(468, 44, 'H₃O⁺, heat', { anchor: 'end' });
    s += tag(486, 140, 'LiAlH₄,', { anchor: 'end' });
    s += tag(486, 156, 'then H₂O', { anchor: 'end' });
    s += fiveChain(544, 50, 'CO2H');
    s += tag(606, 102, 'pentanoic acid', { cls: 'fg-tag-good' });
    s += fiveChain(544, 156, 'NH2');
    s += tag(606, 190, 'pentan-1-amine', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Each arrow adds one carbon to 1-bromobutane. The new carbon is always the one carrying the functional group, and the reagent decides which group that is.',
});

FIGURES.push({
  id: 'l-one-carbon',
  lessons: ['carbon-carbon-bonds'],
  alt: '1-Bromobutane at the top. Below it, four rows, each with the reagents on the left and the five-carbon product on the right, new bond in color: NaCN then H3O+ and heat gives pentanoic acid; NaCN then LiAlH4 gives pentan-1-amine; Mg then CO2 then H3O+ gives pentanoic acid; Mg then formaldehyde then H3O+ gives pentan-1-ol.',
  viewBox: '0 0 340 410',
  build() {
    let s = '';
    s += bromobutane(126, 58);
    s += tag(170, 96, 'start: 1-bromobutane, 4 C');
    s += rule(10, 110, 330, 110);
    const rows = [
      ['NaCN, then', 'H₃O⁺, heat', 'CO2H', 'pentanoic acid'],
      ['NaCN, then', 'LiAlH₄, then H₂O', 'NH2', 'pentan-1-amine'],
      ['Mg, then CO₂,', 'then H₃O⁺', 'CO2H', 'pentanoic acid'],
      ['Mg, then HCHO,', 'then H₃O⁺', 'OH', 'pentan-1-ol'],
    ];
    rows.forEach(([l1, l2, fg, nm], i) => {
      const y = 150 + i * 78;
      s += tag(12, y - 14, l1, { anchor: 'start' });
      s += tag(12, y + 2, l2, { anchor: 'start' });
      s += tag(12, y + 22, nm, { anchor: 'start', cls: 'fg-tag-good' });
      s += fiveChain(196, y, fg, 24, 14);
    });
    return s;
  },
  caption: 'The colored bond joins the added carbon to the chain. The reagent decides what that carbon becomes.',
});

/* ================================================ three sites on a carbonyl ===
   Pentan-3-one, and the same methyl group landing on the carbonyl carbon,
   the alpha carbon, and (in the enone) the beta carbon. The chain is
   C1 (beta) C2 (alpha) C3 (C=O) C4 C5, drawn with C1, C3, C5 on the top line. */
const siteChain = (x0, y0, dx = 28) => chain(x0, y0, 5, dx, 16);

function siteReact(o, kind) {
  const c = siteChain(o.x, o.y);
  let s = '';
  const O = off(c[2], -90, 28);
  if (kind === 'beta') s += bond(c[0], c[1], { order: 2, rFrom: 0, rTo: 0, gap: 3.4 }) + path(c.slice(1));
  else s += path(c);
  s += bond(c[2], O, { order: 2, rFrom: 0, rTo: 12, gap: 3.4 }) + atom(O.x, O.y, 'O', { r: 11 });
  // the C=O pi electrons move onto O (not for the enolate, whose C=O stays put)
  if (kind !== 'alpha') s += curve(off(mid(c[2], O), 0, 5), off(O, -20, 13), { bow: 10, size: 7 });

  if (kind === 'carbonyl') {
    const me = P(c[2].x, c[2].y + 66), mg = P(c[2].x + 58, c[2].y + 66);
    s += bond(me, mg, { rFrom: 16, rTo: 19 }) + atom(me.x, me.y, 'H₃C', { r: 16 }) + atom(mg.x, mg.y, 'MgBr', { r: 19 });
    s += curve(P(mid(me, mg).x, me.y - 4), P(c[2].x + 2, c[2].y + 7), { bow: 16 });
  } else if (kind === 'alpha') {
    // the enolate, drawn with its charge on the alpha carbon
    s += lonePair(c[1].x, c[1].y, 90, { dist: 10 });
    s += tag(c[1].x - 14, c[1].y + 8, '−', { cls: 'fg-tag-warn' });
    const me = P(c[1].x, c[1].y + 54), io = P(c[1].x + 54, c[1].y + 54);
    s += bond(me, io, { rFrom: 16, rTo: 11 }) + atom(me.x, me.y, 'H₃C', { r: 16 }) + atom(io.x, io.y, 'I', { r: 11 });
    s += curve(P(c[1].x + 3, c[1].y + 14), P(me.x + 3, me.y - 17), { bow: -6, size: 7 });
    s += curve(P(mid(me, io).x, me.y + 4), P(io.x - 4, io.y + 12), { bow: 10, size: 7 });
    s += tag(c[1].x + 15, c[1].y + 16, 'α', { cls: 'fg-tag-good' });
  } else {
    const me = P(c[0].x - 22, c[0].y + 70), cu = P(c[0].x + 30, c[0].y + 70), me2 = P(c[0].x + 82, c[0].y + 70);
    s += bond(me, cu, { rFrom: 16, rTo: 15 }) + bond(cu, me2, { rFrom: 15, rTo: 16 });
    s += atom(me.x, me.y, 'H₃C', { r: 16 }) + atom(cu.x, cu.y, 'Cu⁻', { r: 15 }) + atom(me2.x, me2.y, 'CH₃', { r: 16 });
    s += tag(me2.x + 22, me2.y + 4, 'Li⁺', { anchor: 'start' });
    s += curve(P(mid(me, cu).x, me.y - 4), P(c[0].x - 2, c[0].y + 7), { bow: 14 });
    s += curve(off(mid(c[0], c[1]), -120, 5), off(mid(c[1], c[2]), -60, 5), { bow: -14, size: 7 });
    s += tag(c[0].x - 14, c[0].y - 8, 'β', { cls: 'fg-tag-good' });
  }
  return s;
}

function siteProduct(o, kind, dx = 28) {
  const c = siteChain(o.x, o.y, dx);
  let s = path(c);
  if (kind === 'carbonyl') {
    s += grp(c[2], -90, 26, 'OH', { r: 13 });
    s += methyl(c[2], 90, 30, 'fg-bond-hi');
  } else if (kind === 'alpha') {
    s += grp(c[2], -90, 28, 'O', { order: 2 });
    s += methyl(c[1], 90, 28, 'fg-bond-hi');
  } else {
    s += grp(c[2], -90, 28, 'O', { order: 2 });
    s += methyl(c[0], 150, 28, 'fg-bond-hi');
  }
  return s;
}

const SITES = {
  carbonyl: { title: 'at the C=O carbon', start: 'pentan-3-one + CH₃MgBr', step: 'then H₃O⁺', prod: '3-methylpentan-3-ol' },
  alpha: { title: 'at the α carbon', start: 'its enolate (LDA) + CH₃I', step: '', prod: '2-methylpentan-3-one' },
  beta: { title: 'at the β carbon', start: 'pent-1-en-3-one + (CH₃)₂CuLi', step: 'then H₃O⁺', prod: 'hexan-3-one' },
};

FIGURES.push({
  id: 'carbonyl-three-sites',
  section: 'carbon-carbon-bonds',
  anchor: '<!-- fig:carbonyl-three-sites:start -->',
  alt: 'Three columns, each adding a methyl to a five-carbon ketone. Left: CH3MgBr adds to the carbonyl carbon of pentan-3-one; after H3O+ the product is 3-methylpentan-3-ol. Middle: the enolate of pentan-3-one, with its lone pair on the alpha carbon, attacks CH3I; the product is 2-methylpentan-3-one. Right: lithium dimethylcuprate adds to the beta carbon of pent-1-en-3-one, with arrows pushing the C=C and C=O electrons toward oxygen; after H3O+ the product is hexan-3-one. The new methyl bond is in color in each product.',
  viewBox: '0 0 750 330',
  build() {
    let s = '';
    ['carbonyl', 'alpha', 'beta'].forEach((k, i) => {
      const x = 8 + i * 248, S = SITES[k];
      s += panel(x, 6, 238, 318);
      s += tag(x + 119, 28, S.title);
      s += siteReact(P(x + 64, 84), k);
      s += tag(x + 119, 186, S.start, { cls: 'fg-tag-mut' });
      s += down(x + 119, 196, 222);
      if (S.step) s += tag(x + 130, 214, S.step, { anchor: 'start', cls: 'fg-tag-mut' });
      s += siteProduct(P(x + 64, 262), k);
      s += tag(x + 119, 314, S.prod, { cls: 'fg-tag-good' });
    });
    return s;
  },
  caption: 'Follow the methyl group from each reagent to its colored bond in the product.',
});

FIGURES.push({
  id: 'l-carbonyl-three-sites',
  lessons: ['carbon-carbon-bonds'],
  alt: 'Three rows. Top: CH3MgBr adds to the carbonyl carbon of pentan-3-one, giving 3-methylpentan-3-ol. Middle: the enolate of pentan-3-one attacks CH3I from its alpha carbon, giving 2-methylpentan-3-one. Bottom: lithium dimethylcuprate adds to the beta carbon of pent-1-en-3-one, giving hexan-3-one. The new methyl bond is in color in each product.',
  viewBox: '0 0 340 560',
  build() {
    let s = '';
    ['carbonyl', 'alpha', 'beta'].forEach((k, i) => {
      const y = i * 186, S = SITES[k];
      if (i) s += rule(10, y - 4, 330, y - 4);
      s += tag(170, y + 18, S.title);
      s += siteReact(P(k === 'beta' ? 46 : 16, y + 70), k);
      s += tag(k === 'beta' ? 108 : 78, y + 176, S.start, { cls: 'fg-tag-mut' });
      s += right(y + 90, 180, 208);
      if (S.step) s += tag(204, y + 74, S.step, { cls: 'fg-tag-mut' });
      s += siteProduct(P(238, y + 90), k, 22);
      s += tag(334, y + 150, S.prod, { anchor: 'end', cls: 'fg-tag-good' });
    });
    return s;
  },
  caption: 'Same methyl, three carbons. The new bond is in color.',
});

/* ============================================================ ring closures ===
   A chain drawn curled, so the bond that will close the ring is the dashed
   bottom edge, then the ring it makes. Positions k = 0..n-1 run from the
   attacking alpha carbon (lower left), up over the top, to the attacked
   carbonyl carbon (lower right). */
const CLOSE = {
  a14: { n: 5, aldol: true, title: '1,4-diketone → five-membered ring', start: 'hexane-2,5-dione', prod: '3-methylcyclopent-2-en-1-one', count: 'ring: α + atoms 1 to 4 = 5 atoms' },
  a15: { n: 6, aldol: true, title: '1,5-diketone → six-membered ring', start: 'heptane-2,6-dione', prod: '3-methylcyclohex-2-en-1-one', count: 'ring: α + atoms 1 to 5 = 6 atoms' },
  d16: { n: 5, aldol: false, title: '1,6-diester → five-membered ring', start: 'diethyl hexanedioate', prod: 'cyclic β-keto ester', count: 'ring: atoms 2 to 6 = 5 atoms' },
  d17: { n: 6, aldol: false, title: '1,7-diester → six-membered ring', start: 'diethyl heptanedioate', prod: 'cyclic β-keto ester', count: 'ring: atoms 2 to 7 = 6 atoms' },
};
function ringK(c, n) {
  if (n === 5) { const v = polyPts(c.x, c.y, 5, 36, 90); return [v[2], v[1], v[0], v[4], v[3]]; }
  const v = polyPts(c.x, c.y, 6, 36, 0);
  return [v[4], v[3], v[2], v[1], v[0], v[5]];
}
const outD = (p, c) => dirOf(c, p);
/* A number just inside the ring at vertex p. */
const inNum = (p, c, t, cls = 'fg-tag-mut', d = 15) => { const q = off(p, dirOf(p, c), d); return tag(q.x, q.y + 4, t, { cls }); };

function closePanel(ox, oy, key) {
  const K = CLOSE[key], n = K.n;
  let s = '';
  s += tag(ox + 170, oy + 18, K.title);
  // the curled chain
  const c1 = P(ox + 78, oy + 92), A = ringK(c1, n);
  for (let i = 0; i < n - 1; i++) s += sk(A[i], A[i + 1]);
  s += sk(A[0], A[n - 1], 'fg-dash-hi');
  const last = A[n - 1], od = outD(last, c1);
  if (K.aldol) {
    s += grp(A[1], outD(A[1], c1), 24, 'O', { order: 2 });
    s += grp(last, od - 38, 24, 'O', { order: 2 });
    s += methyl(last, od + 38, 24);
    s += inNum(A[0], c1, 'α', 'fg-tag-good', 20);
    for (let i = 1; i < n; i++) s += inNum(A[i], c1, String(i), 'fg-tag-mut', i === n - 1 ? 20 : 15);
  } else {
    s += grp(A[0], outD(A[0], c1), 32, 'CO₂Et', { r: 20 });
    s += grp(last, od - 40, 24, 'O', { order: 2 });
    s += grp(last, od + 40, 28, 'OEt', { r: 15 });
    for (let i = 0; i < n; i++) s += inNum(A[i], c1, String(i + 2), i === 0 ? 'fg-tag-good' : 'fg-tag-mut', i === 0 || i === n - 1 ? 20 : 15);
    const e = off(A[0], outD(A[0], c1), 32);
    s += tag(e.x - 26, e.y - 14, '1', { cls: 'fg-tag-mut' });
  }
  // the arrow
  s += right(oy + 92, ox + 142, ox + 186);
  if (K.aldol) {
    s += tag(ox + 164, oy + 82, 'NaOH', { cls: 'fg-tag-mut' });
    s += tag(ox + 164, oy + 112, 'heat', { cls: 'fg-tag-mut' });
  } else {
    s += tag(ox + 164, oy + 82, 'NaOEt', { cls: 'fg-tag-mut' });
    s += tag(ox + 164, oy + 112, 'then H₃O⁺', { cls: 'fg-tag-mut' });
  }
  // the ring
  const c2 = P(ox + 262, oy + 92), B = ringK(c2, n), bl = B[n - 1], bd = outD(bl, c2);
  for (let i = 0; i < n - 1; i++) s += sk(B[i], B[i + 1]);
  if (K.aldol) {
    s += ringDouble(B[0], bl, c2, { cls: 'fg-bond-hi' });
    s += grp(B[1], outD(B[1], c2), 24, 'O', { order: 2 });
    s += methyl(bl, bd, 24);
    s += inNum(B[0], c2, 'α', 'fg-tag-good', 20);
    for (let i = 1; i < n; i++) s += inNum(B[i], c2, String(i), 'fg-tag-mut', i === n - 1 ? 20 : 15);
  } else {
    s += sk(B[0], bl, 'fg-bond-hi');
    s += grp(B[0], outD(B[0], c2), 32, 'CO₂Et', { r: 20 });
    s += grp(bl, bd, 24, 'O', { order: 2 });
    for (let i = 0; i < n; i++) s += inNum(B[i], c2, String(i + 2), i === 0 ? 'fg-tag-good' : 'fg-tag-mut', i === 0 || i === n - 1 ? 20 : 15);
  }
  s += tag(ox + 78, oy + 186, K.start);
  s += K.aldol ? tag(ox + 336, oy + 186, K.prod, { anchor: 'end' }) : tag(ox + 262, oy + 186, K.prod);
  s += tag(ox + 170, oy + 206, K.count, { cls: 'fg-tag-good' });
  return s;
}

FIGURES.push({
  id: 'ring-closures',
  section: 'carbon-carbon-bonds',
  anchor: '<!-- fig:ring-closures:start -->',
  alt: 'Four chains drawn curled, each closing to a ring through a dashed bond. Top left: hexane-2,5-dione, carbonyl carbons numbered 1 and 4; its end alpha carbon attacks carbonyl 4 and, with NaOH and heat, it gives 3-methylcyclopent-2-en-1-one, a five-membered ring of the alpha carbon plus atoms 1 to 4. Top right: heptane-2,6-dione, carbonyls 1 and 5, gives 3-methylcyclohex-2-en-1-one, a six-membered ring. Bottom left: diethyl hexanedioate, ester carbons 1 and 6; the alpha carbon 2 attacks ester carbon 6 and, with NaOEt then acid, it gives ethyl 2-oxocyclopentane-1-carboxylate, a five-membered ring of atoms 2 to 6. Bottom right: diethyl heptanedioate, ester carbons 1 and 7, gives the six-membered ring of atoms 2 to 7.',
  viewBox: '0 0 700 440',
  build() {
    let s = '';
    s += panel(4, 4, 342, 214) + closePanel(5, 6, 'a14');
    s += panel(354, 4, 342, 214) + closePanel(355, 6, 'a15');
    s += panel(4, 224, 342, 214) + closePanel(5, 226, 'd16');
    s += panel(354, 224, 342, 214) + closePanel(355, 226, 'd17');
    return s;
  },
  caption: 'The numbers count from one C=O carbon to the other; they are not the IUPAC locants of the ring. The dashed bond is the one that closes the ring. Top row: intramolecular aldol, then loss of water. Bottom row: Dieckmann.',
});

FIGURES.push({
  id: 'l-aldol-rings',
  lessons: ['carbon-carbon-bonds'],
  alt: 'Top: hexane-2,5-dione drawn curled, carbonyl carbons numbered 1 and 4, closes through its end alpha carbon to 3-methylcyclopent-2-en-1-one, a five-membered ring. Bottom: heptane-2,6-dione, carbonyls 1 and 5, closes to 3-methylcyclohex-2-en-1-one, a six-membered ring.',
  viewBox: '0 0 340 424',
  build() {
    return closePanel(0, 0, 'a14') + rule(10, 212, 330, 212) + closePanel(0, 214, 'a15');
  },
  caption: 'The dashed bond closes the ring. The numbers are not IUPAC locants.',
});

FIGURES.push({
  id: 'l-dieckmann-rings',
  lessons: ['carbon-carbon-bonds'],
  alt: 'Top: diethyl hexanedioate drawn curled, ester carbons numbered 1 and 6; alpha carbon 2 attacks ester carbon 6 and closes a five-membered ring of atoms 2 to 6, a cyclic beta-keto ester. Bottom: diethyl heptanedioate, ester carbons 1 and 7, closes a six-membered ring of atoms 2 to 7.',
  viewBox: '0 0 340 424',
  build() {
    return closePanel(0, 0, 'd16') + rule(10, 212, 330, 212) + closePanel(0, 214, 'd17');
  },
  caption: 'The dashed bond closes the ring. Atom 1 stays outside it, as the ester.',
});

/* ================================================= Diels-Alder stereochemistry ===
   Adapted from the Diels-Alder page's drawings: the diene is the top four
   corners of a flat-topped hexagon, the dienophile the bottom edge. */
function hexFlat(cx, cy, r = 40) {
  const at = (deg) => P(r1(cx + Math.cos(deg * RAD) * r), r1(cy + Math.sin(deg * RAD) * r));
  return { c1: at(180), c2: at(240), c3: at(300), c4: at(0), d2: at(60), d1: at(120), ctr: P(cx, cy) };
}
const OUT = { d2: 60, d1: 120 };
function sub(p, deg, lbl, o = {}) {
  const len = o.len ?? 40, r = o.r ?? 16;
  const at = off(p, deg, len);
  const b = o.kind === 'wedge' ? wedge(p, at, { rFrom: 0, rTo: r, width: 8 })
    : o.kind === 'hash' ? hash(p, at, { rFrom: 0, rTo: r, width: 9, rungs: 5 })
    : bond(p, at, { rFrom: 0, rTo: r });
  return b + atom(at.x, at.y, lbl, { r });
}
function daRow(ox, oy, cis, stacked) {
  let s = '';
  const a = P(ox + 64, oy + 60), b = P(ox + 108, oy + 60);
  s += bond(a, b, { order: 2, rFrom: 0, rTo: 0 });
  s += sub(a, 120, 'CO₂Me', { len: 36, r: 23 });
  s += sub(b, cis ? 60 : -60, 'CO₂Me', { len: 36, r: 23 });
  s += sub(a, -120, 'H', { len: 26, r: 9 });
  s += sub(b, cis ? -60 : 60, 'H', { len: 26, r: 9 });
  s += tag(ox + 86, oy + 136, cis ? 'dimethyl maleate' : 'dimethyl fumarate');
  s += tag(ox + 86, oy + 154, cis ? 'esters cis' : 'esters trans', { cls: 'fg-tag-mut' });
  if (stacked) {
    s += down(ox + 86, oy + 166, oy + 196);
    s += tag(ox + 100, oy + 186, '+ butadiene', { anchor: 'start', cls: 'fg-tag-mut' });
  } else {
    s += right(oy + 80, ox + 172, ox + 206);
    s += tag(ox + 189, oy + 70, '+ butadiene', { cls: 'fg-tag-mut' });
  }
  const Q = stacked ? hexFlat(ox + 86, oy + 232, 34) : hexFlat(ox + 282, oy + 60, 34);
  s += sk(Q.c1, Q.c2) + ringDouble(Q.c2, Q.c3, Q.ctr, { inset: 7 }) + sk(Q.c3, Q.c4);
  s += sk(Q.c4, Q.d2, 'fg-bond-hi') + sk(Q.d2, Q.d1) + sk(Q.d1, Q.c1, 'fg-bond-hi');
  s += sub(Q.d1, OUT.d1, 'CO₂Me', { len: 38, r: 23, kind: 'wedge' });
  s += sub(Q.d2, OUT.d2, 'CO₂Me', { len: 38, r: 23, kind: cis ? 'wedge' : 'hash' });
  s += tag(stacked ? ox + 86 : ox + 282, stacked ? oy + 334 : oy + 150, cis ? 'cis on the ring' : 'trans on the ring', { cls: 'fg-tag-good' });
  return s;
}
/* The endo adduct of cyclopentadiene and maleic anhydride, drawn as the
   bicyclic cage, from the Diels-Alder page. */
function endoAdduct(o, k) {
  const q = (dx, dy) => P(r1(o.x + dx * k), r1(o.y + dy * k));
  const n = { n1: q(-50, 0), n2: q(-22, 30), n3: q(22, 30), n4: q(50, 0), n5: q(22, -12), n6: q(-22, -12), n7: q(0, -46) };
  const bold = (x) => x.replace(/<line /g, '<line style="stroke-width:4.5" ');
  let s = '';
  s += bold(sk(n.n1, n.n2, 'fg-bond-hi') + sk(n.n2, n.n3) + sk(n.n3, n.n4, 'fg-bond-hi'));
  s += sk(n.n4, n.n5) + ringDouble(n.n5, n.n6, P(o.x, o.y + 10 * k)) + sk(n.n6, n.n1);
  s += sk(n.n1, n.n7) + sk(n.n7, n.n4);
  s += tag(n.n7.x, n.n7.y - 12, 'CH₂ bridge', { cls: 'fg-tag-mut' });
  s += sub(n.n2, 185, 'H', { len: 26, r: 9 }) + sub(n.n3, -5, 'H', { len: 26, r: 9 });
  const ca = P(n.n2.x + 4, n.n2.y + 40), cb = P(n.n3.x - 4, n.n3.y + 40), ob = P(o.x, n.n2.y + 70);
  s += sk(n.n2, ca) + sk(n.n3, cb);
  s += bond(ca, ob, { rFrom: 0, rTo: 12 }) + bond(cb, ob, { rFrom: 0, rTo: 12 }) + atom(ob.x, ob.y, 'O', { r: 12 });
  const oa = off(ca, 200, 28), oc = off(cb, -20, 28);
  s += bond(ca, oa, { order: 2, rFrom: 0, rTo: 12 }) + atom(oa.x, oa.y, 'O', { r: 12 });
  s += bond(cb, oc, { order: 2, rFrom: 0, rTo: 12 }) + atom(oc.x, oc.y, 'O', { r: 12 });
  return s;
}

FIGURES.push({
  id: 'da-stereo',
  section: 'carbon-carbon-bonds',
  anchor: '<!-- fig:da-stereo:start -->',
  alt: 'Top left: dimethyl maleate, with its two CO2Me groups on the same side of the C=C, reacts with a diene to give a cyclohexene whose two CO2Me groups are both on wedges, cis on the ring. Top right: dimethyl fumarate, CO2Me groups on opposite sides, gives the ring with one CO2Me wedged and one hashed, trans on the ring. Bottom: the endo adduct of cyclopentadiene and maleic anhydride, a bicyclic cage with a CH2 bridge on top; the anhydride ring hangs down, on the side away from the CH2 bridge, and the two new bonds are in color.',
  viewBox: '0 0 760 420',
  build() {
    let s = '';
    s += daRow(0, 4, true, false);
    s += rule(376, 16, 376, 160);
    s += daRow(380, 4, false, false);
    s += rule(20, 180, 740, 180);
    s += endoAdduct(P(250, 280), 1.6);
    s += tag(470, 250, 'cyclopentadiene + maleic anhydride', { anchor: 'start' });
    s += tag(470, 274, 'endo adduct, the major product', { anchor: 'start', cls: 'fg-tag-good' });
    s += tag(470, 298, 'the anhydride points away', { anchor: 'start', cls: 'fg-tag-good' });
    s += tag(470, 316, 'from the CH₂ bridge', { anchor: 'start', cls: 'fg-tag-good' });
    s += tag(470, 348, 'bold bonds are at the front', { anchor: 'start', cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Top: follow the two CO₂Me groups from the C=C into the ring. Bottom: find the CH₂ bridge, then see which way the anhydride ring points. The new bonds are in color.',
});

FIGURES.push({
  id: 'l-da-stereo',
  lessons: ['carbon-carbon-bonds'],
  alt: 'Left column: dimethyl maleate, esters cis across the C=C, reacts with butadiene to give a cyclohexene with both CO2Me groups on wedges, cis on the ring. Right column: dimethyl fumarate, esters trans, gives the ring with one CO2Me on a wedge and one hashed, trans on the ring.',
  viewBox: '0 0 340 344',
  build() {
    return daRow(-6, 0, true, true) + daRow(164, 0, false, true);
  },
  caption: 'Follow the two CO₂Me groups from the C=C into the ring. The new bonds are in color.',
});

export default FIGURES;
