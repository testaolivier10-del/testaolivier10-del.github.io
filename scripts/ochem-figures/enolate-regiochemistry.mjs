/* Figures for the enolate-regiochemistry notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Almost every figure is 2-methylcyclohexanone or one of its enolates, drawn
   skeletal, with the heteroatoms, the methyls and the hydrogens that matter
   drawn as labelled atoms. The ring is a regular hexagon with C1 at the top.
   Without `mirror`, C2 is the upper-right vertex and C6 the upper-left one;
   with `mirror` the drawing is flipped left to right, so C2 is upper left.
   A substituent's `deg` is given for the unmirrored drawing, counterclockwise
   from east, and is reflected automatically.

   Notes figures are up to 760 wide. Each lesson copy (id prefix l-) is 340
   wide or less, stacked, and uses fg-lbl / fg-tag text only. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble } from '../lib/ochem-skeletal.mjs';
import { armEnd, skDouble } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */

const rOf = (l) => (l === 'H' ? 11 : l.length >= 3 ? 17 : l.length === 2 ? 15 : 14);
const A = (p, l, o = {}) => atom(p.x, p.y, l, { r: rOf(l), ...o });
const chg = (x, y, s = '−') => text(x, y, s, { cls: 'fg-warn', size: 15 });
/* A lone pair at a paper angle (counterclockwise from east). */
const LP = (p, deg, d = 20) => lonePair(p.x, p.y, -deg, { dist: d });
const mid = (a, b, ox = 0, oy = 0) => P((a.x + b.x) / 2 + ox, (a.y + b.y) / 2 + oy);
const T = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-tag', size: 11, ...o });
const L = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-lbl', size: 13, ...o });
const eqmH = (x1, x2, y) => arrow(P(x1, y - 5), P(x2, y - 5), { size: 7 }) + arrow(P(x2, y + 5), P(x1, y + 5), { size: 7 });
const eqmV = (x, y1, y2) => arrow(P(x - 5, y1), P(x - 5, y2), { size: 7 }) + arrow(P(x + 5, y2), P(x + 5, y1), { size: 7 });
const resH = (x1, x2, y) => arrow(P(x1, y), P(x2, y), { size: 7 }) + arrow(P(x2, y), P(x1, y), { size: 7 });

/* A six-membered ring with C1 at the top.
   o.dbl: 'CO' (ketone), 'C1C6' or 'C1C2' (enolate or enamine C=C), 'none'.
   o.top: the atom on C1 ('O', 'N', …) or null; o.topCharge draws a minus.
   o.subs: [{ at: 2|6|…, deg, label, kind, style: 'wedge'|'hash', len, bondCls }]
   o.hi: ring-bond indices to draw fg-bond-hi (bond i joins C(i+1) to C(i+2)).
   o.loc: ring positions to number inside the ring.
   Returns { s, pts, top, sub } where sub[k] is the end point of subs[k]. */
function ring(c, o = {}) {
  const r = o.r ?? 34, m = o.mirror ? -1 : 1, k = r / 34;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + 60 * i) * Math.PI) / 180;
    return P(c.x + m * r * Math.cos(a), c.y + r * Math.sin(a));
  });
  const dbl = o.dbl || 'CO';
  const hi = o.hi || [];
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = pts[i], b = pts[(i + 1) % 6];
    const isD = (dbl === 'C1C2' && i === 0) || (dbl === 'C1C6' && i === 5);
    const cls = hi.includes(i) ? 'fg-bond-hi' : undefined;
    s += isD ? ringDouble(a, b, c, { cls, inset: 9 * k }) : bond(a, b, { rFrom: 0, rTo: 0, cls });
  }
  let top = null;
  if (o.top !== null) {
    const lab = o.top ?? 'O';
    top = P(pts[0].x, pts[0].y - (o.topLen ?? 44 * k));
    s += bond(pts[0], top, { rFrom: 0, rTo: rOf(lab), order: dbl === 'CO' ? 2 : 1 });
    s += A(top, lab, { kind: o.topKind });
    if (o.topCharge) s += chg(top.x - m * 19, top.y - 12);
  }
  const sub = [];
  for (const q of o.subs || []) {
    const from = pts[q.at - 1];
    const deg = m === 1 ? q.deg : 180 - q.deg;
    const len = q.len ?? (q.label === 'H' ? 32 * k : 44 * k);
    const end = armEnd(from, deg, len);
    const rt = rOf(q.label);
    if (q.style === 'wedge') s += wedge(from, end, { rFrom: 0, rTo: rt });
    else if (q.style === 'hash') s += hash(from, end, { rFrom: 0, rTo: rt });
    else s += bond(from, end, { rFrom: 0, rTo: rt, cls: q.bondCls });
    s += A(end, q.label, { kind: q.kind });
    sub.push(end);
  }
  for (const n of o.loc || []) {
    const p = pts[n - 1];
    const x = p.x + (c.x - p.x) * 0.42, y = p.y + (c.y - p.y) * 0.42;
    s += text(x, y + 4, String(n), { cls: 'fg-tag-mut', size: 11 });
  }
  return { s, pts, top, sub };
}

/* The O–minus of an enolate with three lone pairs, placed around the top
   oxygen of a ring drawn with top: 'O'. */
const enolateO = (o, m = 1) => LP(o, 90) + LP(o, 90 + m * 70) + LP(o, 90 - m * 70) + chg(o.x - m * 22, o.y - 14);
const ketoneO = (o) => LP(o, 150) + LP(o, 30);

/* ======================================================================
   1. The two alpha carbons of 2-methylcyclohexanone and their hydrogens.
   ====================================================================== */
FIGURES.push({
  id: 'alpha-sites',
  section: 'enolate-regiochemistry',
  anchor: '<h3>Two &alpha; carbons, two enolates</h3>',
  lessons: ['enolate-regiochemistry'],
  alt: '2-Methylcyclohexanone drawn skeletally with its ring numbered. C1 carries the C=O. C6, on the left, carries two highlighted hydrogens with nothing next to them. C2, on the right, carries the methyl group and one hydrogen.',
  viewBox: '0 0 340 250',
  build() {
    const c = P(170, 140);
    const f = ring(c, {
      loc: [1, 2, 3, 4, 5, 6],
      subs: [
        { at: 2, deg: -5, label: 'CH₃' },
        { at: 2, deg: 70, label: 'H', kind: 'warn' },
        { at: 6, deg: 190, label: 'H', kind: 'hi' },
        { at: 6, deg: 115, label: 'H', kind: 'hi' },
      ],
    });
    let s = L(170, 22, '2-methylcyclohexanone');
    s += f.s;
    s += T(66, 186, 'C6: two H,', { cls: 'fg-tag-good' });
    s += T(66, 202, 'nothing near them', { cls: 'fg-tag-good' });
    s += T(276, 186, 'C2: one H,', { cls: 'fg-tag-warn' });
    s += T(276, 202, 'next to the CH₃', { cls: 'fg-tag-warn' });
    s += T(170, 238, 'C1 is the carbonyl carbon; C2 and C6 are α');
    return s;
  },
  caption: 'Both carbons next to C1 are α carbons. C6 has two hydrogens in the open; C2 has one, beside the methyl.',
});

/* ======================================================================
   2. The two enolates, with the carbons on each C=C highlighted.
   ====================================================================== */
function enolatePair(ketC, kinC, thdC, r, arrows) {
  let s = '';
  const k = r / 34;
  const ket = ring(ketC, { r, loc: [1, 2, 6], subs: [{ at: 2, deg: 30, label: 'CH₃' }] });
  s += ket.s;
  // kinetic: C1=C6. Carbons on the C=C: C2 (on C1) and C5 (on C6).
  const kin = ring(kinC, { r, dbl: 'C1C6', topCharge: false, hi: [0, 4], subs: [{ at: 2, deg: 30, label: 'CH₃' }] });
  s += kin.s + enolateO(kin.top);
  // thermodynamic: C1=C2. Carbons on it: C6 (on C1), C3 and CH3 (on C2).
  const thd = ring(thdC, { r, dbl: 'C1C2', hi: [5, 1], subs: [{ at: 2, deg: 30, label: 'CH₃', bondCls: 'fg-bond-hi', kind: 'hi' }] });
  s += thd.s + enolateO(thd.top);
  s += arrows(ket, kin, thd, k);
  return s;
}

FIGURES.push({
  id: 'two-enolates-drawn',
  section: 'enolate-regiochemistry',
  anchor: 'That conflict is settled by conditions, not by the ketone.</p>',
  alt: '2-Methylcyclohexanone at the top. An arrow labelled LDA, minus 78 degrees, leads down-left to the kinetic enolate, with its C=C between C1 and C6 and two carbons attached to that C=C, highlighted. An arrow labelled NaOEt in ethanol leads down-right to the thermodynamic enolate, with its C=C between C1 and C2 and three carbons attached, one of them the methyl.',
  viewBox: '0 0 760 380',
  build() {
    return enolatePair(P(380, 110), P(170, 280), P(590, 280), 34, (ket, kin, thd) => {
      let s = '';
      s += arrow(P(318, 150), P(236, 206)) + T(262, 164, 'take H from C6', { anchor: 'end' });
      s += arrow(P(442, 150), P(524, 206)) + T(498, 164, 'take H from C2', { anchor: 'start' });
      s += L(170, 348, 'kinetic enolate: C1=C6', { cls: 'fg-tag-good', size: 11 });
      s += T(170, 366, 'two carbons on the C=C (disubstituted)');
      s += L(590, 348, 'thermodynamic enolate: C1=C2', { cls: 'fg-tag-warn', size: 11 });
      s += T(590, 366, 'three carbons on the C=C (trisubstituted)');
      s += T(380, 180, '2-methylcyclohexanone');
      return s;
    });
  },
  caption: 'The highlighted bonds join the C=C to the carbons it carries. Count them: two for the enolate from C6, three for the enolate from C2.',
});

FIGURES.push({
  id: 'l-two-enolates',
  lessons: ['enolate-regiochemistry'],
  alt: '2-Methylcyclohexanone at the top, with arrows down to its two enolates: the kinetic enolate, C1=C6 with two carbons on the C=C, and the thermodynamic enolate, C1=C2 with three carbons on the C=C.',
  viewBox: '0 0 340 360',
  build() {
    return enolatePair(P(170, 104), P(82, 262), P(250, 262), 28, () => {
      let s = '';
      s += arrow(P(132, 150), P(98, 190));
      s += arrow(P(208, 150), P(236, 190));
      s += L(70, 330, 'kinetic', { cls: 'fg-tag-good', size: 11 });
      s += T(70, 348, '2 C on the C=C');
      s += L(262, 330, 'thermodynamic', { cls: 'fg-tag-warn', size: 11 });
      s += T(262, 348, '3 C on the C=C');
      s += T(62, 150, 'from C6') + T(282, 150, 'from C2');
      return s;
    });
  },
  caption: 'Highlighted: the bonds from each C=C to the carbons it carries.',
});

/* ======================================================================
   3. LDA takes the C6 hydrogen: curved arrows, then the products.
   ====================================================================== */
/* Diisopropylamide nitrogen at n, isopropyls drawn to its left.
   Returns the ink; `h` adds an N–H bond to the right instead of a charge. */
function amide(n, { h = false, lp = true } = {}) {
  let s = '';
  const up = armEnd(n, 145, 36), dn = armEnd(n, 215, 36);
  s += bond(n, up, { rFrom: 14, rTo: 0 }) + bond(n, dn, { rFrom: 14, rTo: 0 });
  s += bond(up, armEnd(up, 90, 28), { rFrom: 0, rTo: 0 }) + bond(up, armEnd(up, 190, 28), { rFrom: 0, rTo: 0 });
  s += bond(dn, armEnd(dn, 270, 28), { rFrom: 0, rTo: 0 }) + bond(dn, armEnd(dn, 170, 28), { rFrom: 0, rTo: 0 });
  s += A(n, 'N');
  if (h) {
    const hp = armEnd(n, 0, 32);
    s += bond(n, hp, { rFrom: 14, rTo: 11 }) + A(hp, 'H');
    if (lp) s += LP(n, 90, 19);
  } else {
    if (lp) s += LP(n, 0, 19) + LP(n, 90, 19);
    s += chg(n.x + 6, n.y + 30);
  }
  return s;
}

function ldaReactants(ox, oy) {
  const n = P(ox + 78, oy + 128);
  const c = P(ox + 214, oy + 128);
  const f = ring(c, {
    loc: [1, 2],
    subs: [
      { at: 2, deg: 30, label: 'CH₃' },
      { at: 6, deg: 170, label: 'H', kind: 'hi', len: 36 },
      { at: 6, deg: 240, label: 'H' },
    ],
  });
  let s = amide(n) + T(8, n.y + 62, 'LDA (Li⁺ not shown)', { anchor: 'start' });
  s += T(f.pts[5].x + 13, f.pts[5].y + 12, '6', { cls: 'fg-tag-mut' });
  s += f.s + ketoneO(f.top);
  const h = f.sub[1], c6 = f.pts[5], c1 = f.pts[0];
  // 1. N lone pair -> the C6 hydrogen
  s += curve(P(n.x + 24, n.y - 6), P(h.x - 12, h.y - 6), { bow: 16, size: 7 });
  // 2. C6–H bond -> C1–C6 bond (becomes the C=C)
  const bm = mid(c6, h), rm = mid(c6, c1);
  s += curve(P(bm.x - 3, bm.y - 6), P(rm.x - 6, rm.y - 7), { bow: -12, size: 7 });
  // 3. C=O pi -> O
  s += curve(P(c1.x + 8, c1.y - 20), P(f.top.x + 15, f.top.y + 8), { bow: 10, size: 7 });
  return s;
}

function ldaProducts(ox, oy, gap = 170) {
  const c = P(ox + 84, oy + 128);
  const f = ring(c, { loc: [1, 2, 6], dbl: 'C1C6', subs: [{ at: 2, deg: 30, label: 'CH₃' }] });
  let s = f.s + enolateO(f.top);
  s += T(f.top.x + 30, f.top.y + 4, 'Li⁺', { anchor: 'start' });
  s += T(c.x, c.y + 64, 'lithium enolate (C1=C6)', { cls: 'fg-tag-good' });
  const n = P(ox + 84 + gap + 34, oy + 120);
  s += text(ox + 84 + gap - 50, oy + 124, '+', { cls: 'fg-lbl', size: 16 });
  s += amide(n, { h: true });
  s += T(n.x - 12, n.y + 62, '(i-Pr)₂NH, pKa about 36');
  return s;
}

FIGURES.push({
  id: 'lda-deprotonation',
  section: 'enolate-regiochemistry',
  anchor: '<h3>The kinetic enolate: get there first and stay there</h3>',
  alt: 'Curved-arrow mechanism. The nitrogen of LDA, carrying two isopropyl groups, uses its lone pair to take a highlighted hydrogen from C6 of 2-methylcyclohexanone. The C6–H bond electrons move into the C1–C6 bond, and the C=O pi electrons move onto oxygen. Products: the lithium enolate with its C=C between C1 and C6, and diisopropylamine, pKa about 36.',
  viewBox: '0 0 760 230',
  build() {
    let s = ldaReactants(0, 0);
    s += arrow(P(318, 128), P(376, 128));
    s += ldaProducts(372, 0, 170);
    return s;
  },
  caption: 'Three arrows: the nitrogen takes the C6 hydrogen, the C–H electrons become the new C=C, and the C=O electrons move onto oxygen.',
});

FIGURES.push({
  id: 'l-lda-deprotonation',
  lessons: ['enolate-regiochemistry'],
  alt: 'LDA takes a hydrogen from C6 of 2-methylcyclohexanone, shown with three curved arrows; below, the lithium enolate with its C=C between C1 and C6, plus diisopropylamine.',
  viewBox: '0 0 340 440',
  build() {
    let s = ldaReactants(4, 0);
    s += arrow(P(170, 214), P(170, 250));
    s += ldaProducts(-26, 222, 150);
    return s;
  },
  caption: 'The nitrogen takes the C6 hydrogen; those C–H electrons become the C=C.',
});

/* ======================================================================
   4. Free ketone carries a proton from one enolate to the other.
   ====================================================================== */
function shuttleRow(x1, x2, y, r, reactants) {
  let s = '';
  const k = r / 34;
  if (reactants) {
    // kinetic enolate, mirrored so C6 faces right
    const e = ring(P(x1, y), { r, mirror: true, dbl: 'C1C6', subs: [{ at: 2, deg: 30, label: 'CH₃' }] });
    // free ketone, mirrored so C2 faces left
    const q = ring(P(x2, y), { r, mirror: true, subs: [{ at: 2, deg: 50, label: 'CH₃' }, { at: 2, deg: -20, label: 'H', kind: 'hi' }] });
    s += e.s + enolateO(e.top, -1) + q.s + ketoneO(q.top);
    const h = q.sub[1];
    // O lone pair back down into C1–O
    s += curve(P(e.top.x + 16, e.top.y + 6), P(e.top.x + 5, e.pts[0].y - 12 * k), { bow: -9, size: 7 });
    // C1=C6 pi -> the H on the ketone's C2
    const pm = mid(e.pts[0], e.pts[5]);
    s += curve(P(pm.x + 6, pm.y - 4), P(h.x - 9, h.y - 8), { bow: -14 * k, size: 7 });
    // C2–H bond -> C1–C2 of the ketone
    const bm = mid(q.pts[1], h), rm = mid(q.pts[1], q.pts[0]);
    s += curve(P(bm.x + 2, bm.y - 5), P(rm.x - 5, rm.y - 5), { bow: 10, size: 7 });
    // ketone C=O pi -> O
    s += curve(P(q.pts[0].x + 8, q.pts[0].y - 18 * k), P(q.top.x + 14, q.top.y + 9), { bow: 9, size: 7 });
  } else {
    const q = ring(P(x1, y), { r, mirror: true, subs: [{ at: 2, deg: 30, label: 'CH₃' }, { at: 6, deg: 170, label: 'H', kind: 'hi' }] });
    const e = ring(P(x2, y), { r, mirror: true, dbl: 'C1C2', subs: [{ at: 2, deg: 50, label: 'CH₃' }] });
    s += q.s + ketoneO(q.top) + e.s + enolateO(e.top, -1);
  }
  return s;
}

FIGURES.push({
  id: 'proton-shuttle',
  section: 'enolate-regiochemistry',
  anchor: '<h3>The thermodynamic enolate: let it equilibrate</h3>',
  alt: 'Curved-arrow mechanism for a proton hand-over. Left: the kinetic enolate (C1=C6) and a molecule of free 2-methylcyclohexanone whose C2 hydrogen is highlighted. The enolate C=C takes that hydrogen; the ketone’s C2–H electrons become a new C=C and its C=O electrons move onto oxygen. Equilibrium arrows lead to the right: the first molecule is now the ketone, with the hydrogen on C6, and the second is the thermodynamic enolate, C1=C2.',
  viewBox: '0 0 760 250',
  build() {
    let s = shuttleRow(96, 262, 130, 34, true);
    s += eqmH(360, 410, 130);
    s += shuttleRow(500, 666, 130, 34, false);
    s += T(96, 222, 'kinetic enolate', { cls: 'fg-tag-good' }) + T(262, 222, 'free ketone');
    s += T(500, 222, 'ketone again') + T(666, 222, 'thermodynamic enolate', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'The highlighted hydrogen moves from C2 of the free ketone to C6 of the enolate. Each molecule swaps roles, and the enolate pool shifts one step toward the C1=C2 enolate.',
});

FIGURES.push({
  id: 'l-proton-shuttle',
  lessons: ['enolate-regiochemistry'],
  alt: 'Top: the kinetic enolate takes the highlighted C2 hydrogen of a free ketone, with curved arrows. Equilibrium arrows lead down to the ketone (hydrogen now on C6) and the thermodynamic enolate.',
  viewBox: '0 0 340 440',
  build() {
    let s = shuttleRow(78, 238, 118, 30, true);
    s += T(78, 196, 'kinetic enolate', { cls: 'fg-tag-good' }) + T(238, 196, 'free ketone');
    s += eqmV(170, 212, 250);
    s += shuttleRow(88, 250, 330, 30, false);
    s += T(88, 412, 'ketone again') + T(250, 412, 'thermodynamic', { cls: 'fg-tag-warn' });
    s += T(250, 428, 'enolate', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'The highlighted hydrogen moves from the free ketone’s C2 to the enolate’s C6.',
});

/* ======================================================================
   5. Alkylation: each enolate with CH3–I, and the product.
   ====================================================================== */
function alkylRow(y, kinetic) {
  let s = '';
  // enolate, drawn so the nucleophilic carbon faces right
  const e = kinetic
    ? ring(P(110, y), { mirror: true, dbl: 'C1C6', loc: [1, 2, 6], subs: [{ at: 2, deg: 30, label: 'CH₃' }] })
    : ring(P(110, y), { dbl: 'C1C2', loc: [1, 2, 6], subs: [{ at: 2, deg: 40, label: 'CH₃' }] });
  s += e.s + enolateO(e.top, kinetic ? -1 : 1);
  const nuc = kinetic ? e.pts[5] : e.pts[1];
  const me = armEnd(nuc, -28, 62), io = armEnd(me, -28, 56);
  s += bond(me, io, { rFrom: 17, rTo: 14 }) + A(me, 'CH₃') + A(io, 'I');
  // O lone pair -> C1–O ; C=C pi -> CH3 ; C–I -> I
  const m = kinetic ? -1 : 1;
  s += curve(P(e.top.x - m * 16, e.top.y + 6), P(e.top.x - m * 5, e.pts[0].y - 12), { bow: m * 9, size: 7 });
  const pm = mid(e.pts[0], nuc);
  s += curve(P(pm.x + 2, pm.y + 7), P(me.x - 16, me.y + 6), { bow: 22, size: 7 });
  const bm = mid(me, io);
  s += curve(P(bm.x + 2, bm.y - 6), P(io.x - 4, io.y - 16), { bow: -12, size: 7 });
  s += arrow(P(318, y), P(378, y));
  // product
  const p = kinetic
    ? ring(P(470, y), { mirror: true, loc: [1, 2, 6], subs: [{ at: 2, deg: 30, label: 'CH₃' }, { at: 6, deg: 165, label: 'CH₃', kind: 'hi', bondCls: 'fg-bond-hi' }] })
    : ring(P(470, y), { loc: [1, 2, 6], subs: [{ at: 2, deg: 65, label: 'CH₃' }, { at: 2, deg: -10, label: 'CH₃', kind: 'hi', bondCls: 'fg-bond-hi' }] });
  s += p.s;
  s += T(590, y + 26, '+ I⁻', { anchor: 'start' });
  s += L(470, y + 70, kinetic ? '2,6-dimethylcyclohexanone' : '2,2-dimethylcyclohexanone', { size: 12.5 });
  s += T(590, y - 30, kinetic ? 'new C–C bond at C6' : 'new C–C bond at C2', { cls: kinetic ? 'fg-tag-good' : 'fg-tag-warn', anchor: 'start' });
  if (!kinetic) s += T(590, y - 12, 'C2 now bonded to four C', { cls: 'fg-tag-warn', anchor: 'start' });
  s += T(110, y + 70, kinetic ? 'kinetic enolate' : 'thermodynamic enolate', { cls: kinetic ? 'fg-tag-good' : 'fg-tag-warn' });
  return s;
}

FIGURES.push({
  id: 'alkylation-products',
  section: 'enolate-regiochemistry',
  anchor: '<span class="k">Worked example &mdash; one ketone, two products</span>',
  alt: 'Two rows of curved-arrow mechanisms. Top: the kinetic enolate’s C6 attacks the carbon of CH3–I and iodide leaves, giving 2,6-dimethylcyclohexanone with the new methyl on C6 highlighted. Bottom: the thermodynamic enolate’s C2 attacks CH3–I, giving 2,2-dimethylcyclohexanone, where C2 now carries two methyls.',
  viewBox: '0 0 760 380',
  build() {
    let s = alkylRow(100, true);
    s += rule(20, 196, 740, 196);
    s += alkylRow(292, false);
    return s;
  },
  caption: 'The new methyl, highlighted, goes to the carbon at the far end of the C=C from the oxygen. The oxygen’s electrons rebuild the C=O.',
});

/* Lesson copy: no curved arrows, enolate → product per row. */
function alkylRowSmall(y, kinetic) {
  let s = '';
  const r = 26;
  const e = kinetic
    ? ring(P(68, y), { r, mirror: true, dbl: 'C1C6', subs: [{ at: 2, deg: 30, label: 'CH₃' }] })
    : ring(P(68, y), { r, dbl: 'C1C2', subs: [{ at: 2, deg: 40, label: 'CH₃' }] });
  s += e.s + chg(e.top.x + (kinetic ? 19 : -19), e.top.y - 12);
  s += arrow(P(132, y), P(190, y)) + T(161, y - 10, 'CH₃I');
  const p = kinetic
    ? ring(P(250, y), { r, mirror: true, subs: [{ at: 2, deg: 30, label: 'CH₃' }, { at: 6, deg: 165, label: 'CH₃', kind: 'hi', bondCls: 'fg-bond-hi' }] })
    : ring(P(250, y), { r, subs: [{ at: 2, deg: 65, label: 'CH₃' }, { at: 2, deg: -10, label: 'CH₃', kind: 'hi', bondCls: 'fg-bond-hi' }] });
  s += p.s;
  s += T(68, y + 56, kinetic ? 'kinetic enolate' : 'thermodynamic', { cls: kinetic ? 'fg-tag-good' : 'fg-tag-warn' });
  s += T(250, y + 56, kinetic ? '2,6-dimethyl-' : '2,2-dimethyl-');
  s += T(250, y + 72, 'cyclohexanone');
  return s;
}

FIGURES.push({
  id: 'l-alkylation-products',
  lessons: ['enolate-regiochemistry'],
  alt: 'Top: the kinetic enolate with CH3I gives 2,6-dimethylcyclohexanone. Bottom: the thermodynamic enolate with CH3I gives 2,2-dimethylcyclohexanone. The new methyl is highlighted in each product.',
  viewBox: '0 0 340 330',
  build() {
    return alkylRowSmall(90, true) + alkylRowSmall(250, false);
  },
  caption: 'The new methyl, highlighted, lands where the enolate’s C=C was.',
});

/* ======================================================================
   6. Two branch points: the allylic cation, and the deprotonation.
   ====================================================================== */
function dieneRow(cx, y, w, names) {
  let s = '';
  // allylic cation, two contributors: C1 (the CH3 end) at left, C4 at right
  const cat = (x0, plusAt) => {
    const p = zig(x0, y, 4, 30, 18);
    let g = '';
    for (let i = 0; i < 3; i++) {
      const isD = plusAt === 1 ? i === 2 : i === 1;
      g += isD ? skDouble(p[i], p[i + 1], P((p[i].x + p[i + 1].x) / 2, y + 30)) : sk(p[i], p[i + 1]);
    }
    const q = p[plusAt];
    g += text(q.x, q.y - 10, '+', { cls: 'fg-warn', size: 15 });
    return g;
  };
  s += cat(cx - 112, 1) + resH(cx - 12, cx + 12, y - 8) + cat(cx + 22, 3);
  s += T(cx, y + 34, 'allylic cation: + at C2 and at C4');
  const lx = cx - w / 2 + 40, rx = cx + w / 2 - 130;
  s += arrow(P(cx - 50, y + 44), P(lx + 56, y + 76));
  s += arrow(P(cx + 50, y + 44), P(rx + 34, y + 76));
  const py = y + 110;
  // 3-bromobut-1-ene: CH2=CH–CH(Br)–CH3
  const a = zig(lx, py, 4, 30, 18);
  s += skDouble(a[0], a[1], P(a[0].x + 15, py + 22)) + sk(a[1], a[2]) + sk(a[2], a[3]);
  const br1 = P(a[2].x, a[2].y + 38);
  s += bond(a[2], br1, { rFrom: 0, rTo: 15, cls: 'fg-bond-hi' }) + A(br1, 'Br', { kind: 'hi' });
  // 1-bromobut-2-ene: CH3–CH=CH–CH2Br
  const b = zig(rx, py, 4, 30, 18);
  s += sk(b[0], b[1]) + skDouble(b[1], b[2], P(b[1].x + 15, py + 22)) + sk(b[2], b[3]);
  const br2 = P(b[3].x + 32, b[3].y + 18);
  s += bond(b[3], br2, { rFrom: 0, rTo: 15, cls: 'fg-bond-hi' }) + A(br2, 'Br', { kind: 'hi' });
  const ly = py + 68;
  s += T(lx + 45, ly, names[0]) + T(lx + 45, ly + 16, 'Br⁻ at C2, cold', { cls: 'fg-tag-good' });
  s += T(rx + 50, ly, names[1]) + T(rx + 50, ly + 16, 'Br⁻ at C4, warm', { cls: 'fg-tag-warn' });
  return s;
}

function ketoneRow(cx, y, dx, r, conds) {
  const ket = ring(P(cx, y), { r, subs: [{ at: 2, deg: 30, label: 'CH₃' }] });
  const kin = ring(P(cx - dx, y + 92), { r, dbl: 'C1C6', subs: [{ at: 2, deg: 30, label: 'CH₃' }] });
  const thd = ring(P(cx + dx, y + 92), { r, dbl: 'C1C2', subs: [{ at: 2, deg: 30, label: 'CH₃' }] });
  let s = ket.s + kin.s + thd.s;
  s += chg(kin.top.x - 18, kin.top.y - 12) + chg(thd.top.x - 18, thd.top.y - 12);
  const ax = Math.min(120, dx * 0.55);
  s += arrow(P(cx - 44, y + 26), P(cx - 44 - ax, y + 26 + ax * 0.4));
  s += arrow(P(cx + 44, y + 26), P(cx + 44 + ax, y + 26 + ax * 0.4));
  s += T(cx - 56, y + 16, conds[0], { cls: 'fg-tag-good', anchor: 'end' });
  s += T(cx + 56, y + 16, conds[1], { cls: 'fg-tag-warn', anchor: 'start' });
  return s;
}

FIGURES.push({
  id: 'branch-points',
  section: 'enolate-regiochemistry',
  anchor: '<h3>The same switch, one step earlier</h3>',
  alt: 'Two rows. Top row, from the conjugation chapter: the allylic cation from buta-1,3-diene and HBr, drawn as its two contributors, with bromide adding at C2 when cold to give 3-bromobut-1-ene, or at C4 when warm to give 1-bromobut-2-ene. These are the two final products. Bottom row: 2-methylcyclohexanone with LDA at minus 78 degrees giving the kinetic enolate, or with NaOEt at room temperature giving the thermodynamic enolate. These are two intermediates, and the electrophile comes afterwards.',
  viewBox: '0 0 760 536',
  build() {
    let s = '';
    s += panel(8, 8, 744, 268, {});
    s += tag(24, 30, 'BRANCH POINT: THE CATION (1,2- vs 1,4-addition)', { anchor: 'start' });
    s += dieneRow(380, 80, 700, ['3-bromobut-1-ene (1,2)', '1-bromobut-2-ene (1,4)']);
    s += T(380, 254, 'two final products', { cls: 'fg-tag-mut' });
    s += panel(8, 288, 744, 240, {});
    s += tag(24, 310, 'BRANCH POINT: THE DEPROTONATION', { anchor: 'start' });
    s += ketoneRow(380, 356, 230, 26, ['LDA, −78 °C', 'NaOEt, rt']);
    s += T(150, 512, 'kinetic enolate (C1=C6)', { cls: 'fg-tag-good' });
    s += T(610, 512, 'thermodynamic enolate (C1=C2)', { cls: 'fg-tag-warn' });
    s += T(380, 476, 'two intermediates;', { cls: 'fg-tag-mut' });
    s += T(380, 492, 'the electrophile comes next', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Top: the conjugation chapter’s branch point ends in two products. Bottom: this section’s branch point ends in two enolates, and the choice is made before any electrophile is added.',
});

FIGURES.push({
  id: 'l-branch-points',
  lessons: ['enolate-regiochemistry'],
  alt: 'Top: the allylic cation from buta-1,3-diene and HBr gives 3-bromobut-1-ene when cold or 1-bromobut-2-ene when warm, two final products. Bottom: 2-methylcyclohexanone gives the kinetic enolate with LDA at minus 78 degrees or the thermodynamic enolate with NaOEt, two intermediates.',
  viewBox: '0 0 340 610',
  build() {
    let s = '';
    s += panel(4, 4, 332, 292, {});
    s += tag(170, 24, 'BRANCH POINT: THE CATION');
    s += dieneRow(170, 72, 300, ['1,2-product', '1,4-product']);
    s += T(170, 286, 'two final products', { cls: 'fg-tag-mut' });
    s += panel(4, 302, 332, 302, {});
    s += tag(170, 322, 'BRANCH POINT: THE DEPROTONATION');
    const r = 24;
    const ket = ring(P(170, 402), { r, subs: [{ at: 2, deg: 30, label: 'CH₃' }] });
    const kin = ring(P(82, 532), { r, dbl: 'C1C6', subs: [{ at: 2, deg: 30, label: 'CH₃' }] });
    const thd = ring(P(252, 532), { r, dbl: 'C1C2', subs: [{ at: 2, deg: 30, label: 'CH₃' }] });
    s += ket.s + kin.s + thd.s;
    s += chg(kin.top.x - 18, kin.top.y - 12) + chg(thd.top.x + 18, thd.top.y - 12);
    s += arrow(P(140, 432), P(104, 460)) + arrow(P(200, 432), P(236, 460));
    s += T(76, 428, 'LDA, −78 °C', { cls: 'fg-tag-good' }) + T(270, 428, 'NaOEt', { cls: 'fg-tag-warn' });
    s += T(82, 578, 'kinetic', { cls: 'fg-tag-good' }) + T(252, 578, 'thermodynamic', { cls: 'fg-tag-warn' });
    s += T(170, 596, 'two intermediates', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Top: two final products. Bottom: two enolates, chosen before the electrophile is added.',
});

/* ======================================================================
   7. Which way the enamine's C=C points.
   ====================================================================== */
function enamine(c, r, favored) {
  const k = r / 34;
  const f = ring(c, {
    r, top: 'N', topLen: 40 * k, dbl: favored ? 'C1C6' : 'C1C2', loc: [1, 2, 6],
    subs: [favored
      ? { at: 2, deg: 20, label: 'CH₃', style: 'hash' }
      : { at: 2, deg: 42, label: 'CH₃', kind: 'warn' }],
  });
  let s = f.s;
  // pyrrolidine: a pentagon standing on the nitrogen
  const n = f.top, R5 = 25 * k;
  const cc = P(n.x, n.y - R5);
  const v = [0, 1, 2, 3, 4].map((i) => {
    const a = ((90 + 72 * i) * Math.PI) / 180;
    return P(cc.x + R5 * Math.cos(a), cc.y + R5 * Math.sin(a));
  });
  s += bond(v[0], v[1], { rFrom: 14, rTo: 0 }) + bond(v[1], v[2], { rFrom: 0, rTo: 0 }) + bond(v[2], v[3], { rFrom: 0, rTo: 0 }) +
       bond(v[3], v[4], { rFrom: 0, rTo: 0 }) + bond(v[4], v[0], { rFrom: 0, rTo: 14 });
  s += A(n, 'N') + LP(n, 190, 19);
  if (!favored) {
    const me = f.sub[0], ch2 = v[4];
    s += `<line class="fg-dash-hi" x1="${me.x - 8}" y1="${me.y - 12}" x2="${ch2.x + 6}" y2="${ch2.y + 4}"></line>`;
  }
  return { s, f, v };
}

function enamineCell(ox, oy, w, r, favored, lines) {
  const c = P(ox + w / 2, oy + 160 * (r / 34) + 22);
  let s = panel(ox, oy, w, (lines.length * 16) + 250 * (r / 34) + 10, { kind: favored ? 'good' : 'warn' });
  s += T(ox + w / 2, oy + 20, favored ? 'FORMS: C1=C6' : 'AVOIDED: C1=C2', { cls: favored ? 'fg-tag-good' : 'fg-tag-warn' });
  const e = enamine(c, r, favored);
  s += e.s;
  if (!favored) s += T(e.f.sub[0].x + 4, e.v[4].y - 14, 'clash', { cls: 'fg-tag-warn' });
  const y0 = c.y + r + 34;
  lines.forEach((t, i) => { s += T(ox + w / 2, y0 + i * 16, t); });
  return s;
}

FIGURES.push({
  id: 'enamine-direction',
  section: 'enolate-regiochemistry',
  anchor: '<h3>The third option: don&#39;t use an enolate</h3>',
  alt: 'Two possible pyrrolidine enamines of 2-methylcyclohexanone. Left, the one that forms: the C=C runs from C1 to C6, and the methyl on C2 is drawn with a hashed bond, turned out of the plane. Right, the one that is avoided: the C=C runs from C1 to C2, the methyl lies in the same plane as the pyrrolidine ring, and a dashed line marks where the methyl and the ring CH2 next to nitrogen collide.',
  viewBox: '0 0 760 300',
  build() {
    let s = enamineCell(20, 8, 350, 34, true, ['C2 is sp³: its CH₃ turns out of the plane', 'N lone pair lines up with the C=C']);
    s += enamineCell(390, 8, 350, 34, false, ['CH₃ and the ring CH₂ share one plane', 'N twists; its lone pair falls out of line']);
    return s;
  },
  caption: 'The dashed line marks the clash that the C1=C6 enamine avoids. On the left, C2 is no longer part of the C=C, so its methyl can turn away.',
});

FIGURES.push({
  id: 'l-enamine-direction',
  lessons: ['enolate-regiochemistry'],
  alt: 'Two stacked pyrrolidine enamines of 2-methylcyclohexanone. Top, the one that forms, C1=C6, methyl on C2 turned out of the plane. Bottom, the one avoided, C1=C2, with a dashed line marking the clash between the methyl and the ring CH2 beside nitrogen.',
  viewBox: '0 0 340 560',
  build() {
    let s = enamineCell(4, 4, 332, 30, true, ['C2 is sp³: its CH₃ turns away', 'N lone pair lines up with the C=C']);
    s += enamineCell(4, 286, 332, 30, false, ['CH₃ and ring CH₂ in one plane', 'N twists out of line']);
    return s;
  },
  caption: 'The dashed line marks the clash the C1=C6 enamine avoids.',
});

/* ======================================================================
   8. C- versus O-alkylation of an enolate.
   ====================================================================== */
FIGURES.push({
  id: 'c-vs-o',
  section: 'enolate-regiochemistry',
  anchor: '<h3>Why the halide goes to carbon</h3>',
  alt: 'The lithium enolate of cyclohexanone in the middle with CH3I. An arrow to the left, labelled attack through carbon, gives 2-methylcyclohexanone, with the new C–C bond highlighted and the C=O kept. An arrow to the right, labelled attack through oxygen, gives 1-methoxycyclohexene, an enol ether, with the new O–C bond highlighted and a C=C instead of the C=O.',
  viewBox: '0 0 760 240',
  build() {
    let s = '';
    const e = ring(P(380, 130), { dbl: 'C1C2' });
    s += e.s + enolateO(e.top);
    s += T(e.top.x + 30, e.top.y + 4, 'Li⁺', { anchor: 'start' });
    s += T(380, 204, 'lithium enolate + CH₃I');
    s += arrow(P(318, 130), P(250, 130)) + T(284, 118, 'through C', { cls: 'fg-tag-good' });
    s += arrow(P(442, 130), P(510, 130)) + T(476, 118, 'through O', { cls: 'fg-tag-warn' });
    const c = ring(P(150, 130), { subs: [{ at: 2, deg: 30, label: 'CH₃', kind: 'hi', bondCls: 'fg-bond-hi' }] });
    s += c.s;
    s += L(150, 204, '2-methylcyclohexanone', { size: 12.5 });
    s += T(150, 222, 'C=O kept (the usual product)', { cls: 'fg-tag-good' });
    const o = ring(P(610, 130), { dbl: 'C1C2' });
    const me = P(o.top.x + 40, o.top.y - 20);
    s += o.s + bond(o.top, me, { rFrom: 14, rTo: 17, cls: 'fg-bond-hi' }) + A(me, 'CH₃', { kind: 'hi' });
    s += LP(o.top, 140) + LP(o.top, 215);
    s += L(610, 204, '1-methoxycyclohexene', { size: 12.5 });
    s += T(610, 222, 'enol ether: C=C instead of C=O', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'The highlighted bond is the one each path makes. Only the carbon path keeps the C=O.',
});

export default FIGURES;
