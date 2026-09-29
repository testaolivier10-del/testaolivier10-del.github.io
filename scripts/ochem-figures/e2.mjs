/* Figures for the e2 notes page. Built by scripts/build-ochem-figures.mjs;
   see the header there. E2 has no lesson page (its interactive page is
   ochem/mechanisms/e2.html, which draws its own scenes), so every figure
   here is a notes figure and may be up to 760 wide. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { sk, polyPts, polyRing } from '../lib/ochem-skeletal.mjs';

const TOPIC = 'e2';
const mid = (a, b) => P((a.x + b.x) / 2, (a.y + b.y) / 2);
const lbl = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-lbl', size: 13, ...o });
const tg = (x, y, s, cls = 'fg-tag', o = {}) => text(x, y, s, { cls, size: 11, ...o });
const sm = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-sm', size: 10.5, ...o });
const r2 = (v) => Math.round(v * 100) / 100;
const pt = (p) => `${r2(p.x)} ${r2(p.y)}`;
const rad = (d) => (d * Math.PI) / 180;
/* Screen direction for a math angle: 0 is east, 90 is up. */
const dir = (deg) => ({ x: Math.cos(rad(deg)), y: -Math.sin(rad(deg)) });
const at = (c, deg, len) => P(c.x + dir(deg).x * len, c.y + dir(deg).y * len);
/* A labeled end atom on a bond from a center. */
const arm = (c, deg, len, lab, o = {}) => {
  const e = at(c, deg, len);
  const r = o.r ?? (lab.length > 2 ? 16 : lab.length > 1 ? 15 : 12);
  return bond(c, e, { rFrom: o.rFrom ?? 15, rTo: r, cls: o.cls }) +
    atom(e.x, e.y, lab, { r, kind: o.kind, size: o.size });
};

/* One orbital lobe (copied from orbitals.mjs): a teardrop pinched to a
   point at `c`, reaching `len` along screen angle `deg`. */
function lobe(c, deg, len, w, cls) {
  const d = dir(deg);
  const p = { x: -d.y, y: d.x };
  const add = (q, v, k) => P(q.x + v.x * k, q.y + v.y * k);
  const tip = add(c, d, len);
  const a1 = P(c.x + d.x * len * 0.32 + p.x * w * 0.62, c.y + d.y * len * 0.32 + p.y * w * 0.62);
  const a2 = add(tip, p, w * 0.95);
  const b2 = add(tip, p, -w * 0.95);
  const b1 = P(c.x + d.x * len * 0.32 - p.x * w * 0.62, c.y + d.y * len * 0.32 - p.y * w * 0.62);
  return `<path class="${cls}" d="M${pt(c)} C${pt(a1)} ${pt(a2)} ${pt(tip)} C${pt(b2)} ${pt(b1)} ${pt(c)} Z"></path>`;
}

/* The chair, taken from the one already drawn in axial-equatorial (the
   twelve-position figure), so a new drawing cannot disagree with the book's
   own reference. Offsets are relative to the ring center; axial is vertical
   and alternates, and each equatorial unit vector is the one that figure
   uses, which is parallel to the ring bond two carbons round and tilted
   OPPOSITE to that carbon's axial. */
const CHAIR_V = [
  P(113.15, -18.21), P(56.57, -15.31), P(-56.57, -51.72),
  P(-113.15, 18.21), P(-56.58, 15.31), P(56.57, 51.72),
];
const CHAIR_EQ = [
  P(0.944, 0.329), P(0.613, -0.790), P(-0.994, 0.104),
  P(-0.944, -0.329), P(-0.613, 0.790), P(0.994, -0.104),
];
const chair = (cx, cy, k = 1) => CHAIR_V.map((v) => P(cx + v.x * k, cy + v.y * k));
/* The other chair: the ring flipped. Mirroring the drawing top to bottom
   keeps every face (a group that was on the top face stays on it) and swaps
   axial for equatorial, which is what a ring flip does. */
const chairFlipped = (cx, cy, k = 1) => CHAIR_V.map((v) => P(cx + v.x * k, cy - v.y * k));
const chairRing = (pts, cls) => pts.map((p, i) => bond(p, pts[(i + 1) % 6], { rFrom: 0, rTo: 0, cls })).join('');
const axialEnd = (pts, i, L = 34) => P(pts[i].x, pts[i].y + (i % 2 === 0 ? -L : L));
const axialEndF = (pts, i, L = 34) => P(pts[i].x, pts[i].y + (i % 2 === 0 ? L : -L));
const equatorialEnd = (pts, i, L = 32) => P(pts[i].x + CHAIR_EQ[i].x * L, pts[i].y + CHAIR_EQ[i].y * L);
const equatorialEndF = (pts, i, L = 32) => P(pts[i].x + CHAIR_EQ[i].x * L, pts[i].y - CHAIR_EQ[i].y * L);

/* A Newman projection. Angles are degrees clockwise from straight up, which
   is how a student reads a dihedral off the page. Each group is
   [angle, label, highlight?]; a highlighted bond is drawn in the accent. */
function newman(cx, cy, r, front, back) {
  const pos = (a, R) => P(cx + R * Math.sin(rad(a)), cy - R * Math.cos(rad(a)));
  let s = '';
  for (const [a, lab, hi] of back) {
    const p1 = pos(a, r), p2 = pos(a, r + 21), p3 = pos(a, r + 36);
    s += `<line class="${hi ? 'fg-bond-hi' : 'fg-bond-soft'}" x1="${r2(p1.x)}" y1="${r2(p1.y)}" x2="${r2(p2.x)}" y2="${r2(p2.y)}"></line>`;
    s += text(p3.x, p3.y + 4.5, lab, { cls: hi ? 'fg-tag-good' : 'fg-lbl', size: 12 });
  }
  s += `<circle class="fg-atom" cx="${cx}" cy="${cy}" r="${r}"></circle>`;
  for (const [a, lab, hi] of front) {
    const p2 = pos(a, r), p3 = pos(a, r + 14);
    s += `<line class="${hi ? 'fg-bond-hi' : 'fg-bond'}" x1="${cx}" y1="${cy}" x2="${r2(p2.x)}" y2="${r2(p2.y)}"></line>`;
    s += text(p3.x, p3.y + 4.5, lab, { cls: hi ? 'fg-tag-warn' : 'fg-lbl', size: 12 });
  }
  s += `<circle class="fg-lp-mut" cx="${cx}" cy="${cy}" r="4.5"></circle>`;
  return s;
}

const FIGURES = [];

/* ------------------------------------------------------------------------
   1. The mechanism on a real molecule: ethoxide and 2-bromopropane. The
   beta H points up and the Br points down, the anti-periplanar arrangement
   the next section explains, so the flat drawing is honest. */
FIGURES.push({
  id: 'e2-three-arrows',
  section: TOPIC,
  anchor: '<!-- fig:e2-three-arrows:start -->',
  alt: 'Ethoxide and 2-bromopropane. Arrow 1 runs from a lone pair on the ethoxide oxygen to a hydrogen on a CH3 carbon, the beta carbon. Arrow 2 runs from that C–H bond to the bond between the beta carbon and the alpha carbon, where the pi bond forms. Arrow 3 runs from the C–Br bond on the alpha carbon to the bromine. The products are propene, ethanol and bromide ion.',
  viewBox: '0 0 760 340',
  build() {
    let s = panel(0, 0, 486, 340);
    s += tg(243, 26, '1 · one step, three curved arrows');
    // ethoxide
    const O = P(142, 84);
    s += text(110, 89, 'CH₃CH₂', { cls: 'fg-lbl', size: 13, anchor: 'end' });
    s += bond(P(114, 84), O, { rFrom: 0, rTo: 15 });
    s += atom(O.x, O.y, 'O', { kind: 'hi' });
    s += lonePair(O.x, O.y, -95, { dist: 23 });
    s += lonePair(O.x, O.y, 95, { dist: 23 });
    s += lonePair(O.x, O.y, 8, { dist: 23 });
    s += text(162, 66, '−', { cls: 'fg-warn', size: 16 });
    // the substrate
    const Cb = P(252, 184), Ca = P(352, 184), H = P(252, 112), Br = P(352, 262);
    s += bond(Cb, Ca);
    s += bond(Cb, H, { rTo: 12, cls: 'fg-bond-hi' });
    s += atom(H.x, H.y, 'H', { r: 12, kind: 'hi' });
    s += arm(Cb, 200, 60, 'H');
    s += arm(Cb, 245, 60, 'H');
    s += bond(Ca, Br, { rTo: 16, cls: 'fg-bond-hi' });
    s += atom(Br.x, Br.y, 'Br', { kind: 'warn' });
    s += arm(Ca, 40, 66, 'CH₃');
    s += arm(Ca, -10, 62, 'H');
    s += atom(Cb.x, Cb.y, 'C') + atom(Ca.x, Ca.y, 'C');
    s += tg(274, 216, 'β');
    s += tg(330, 216, 'α');
    // the three arrows
    s += curve(P(168, 82), P(238, 106), { bow: -22 });
    s += curve(mid(Cb, H), mid(Cb, Ca), { bow: -18 });
    s += curve(P(358, 214), P(368, 244), { bow: -12 });
    s += tg(200, 60, '1', 'fg-tag-good');
    s += tg(298, 138, '2', 'fg-tag-good');
    s += tg(388, 238, '3', 'fg-tag-good');
    s += text(24, 292, '1 · the base takes the β-hydrogen', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(24, 310, '2 · the C–H pair becomes the π bond', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(24, 328, '3 · Br leaves with the C–Br pair', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += tg(460, 300, 'all at once,', 'fg-tag-warn', { anchor: 'end' });
    s += tg(460, 318, 'no intermediate', 'fg-tag-warn', { anchor: 'end' });
    // products
    s += arrow(P(492, 170), P(516, 170));
    s += panel(520, 0, 240, 340, { kind: 'good' });
    s += tg(640, 26, '2 · the products');
    const A = P(566, 150), B = P(636, 150), M = P(700, 186);
    s += bond(A, B, { order: 2, rFrom: 17, rTo: 15 });
    s += bond(B, M, { rFrom: 15, rTo: 16 });
    s += atom(A.x, A.y, 'H₂C', { r: 17 }) + atom(B.x, B.y, 'CH', { r: 15 }) + atom(M.x, M.y, 'CH₃', { r: 16 });
    s += tg(620, 226, 'propene', 'fg-tag-good');
    s += lbl(640, 272, '+ CH₃CH₂OH');
    s += lbl(640, 306, '+ Br⁻');
    return s;
  },
  caption: 'The three arrows of E2 drawn on 2-bromopropane. The β-hydrogen (up) and the bromine (down) point in opposite directions, the arrangement the next section explains.',
});

/* ------------------------------------------------------------------------
   2. 2-Bromobutane down the C2–C3 bond, C2 in front, at the three dihedral
   angles that matter. */
FIGURES.push({
  id: 'e2-dihedral',
  section: TOPIC,
  anchor: '<!-- fig:e2-dihedral:start -->',
  alt: 'Three Newman projections of 2-bromobutane looking down the C2–C3 bond, C2 in front with Br at the top. In the first a hydrogen on C3 points straight down, 180 degrees from Br: anti-periplanar, E2 can happen. In the second the hydrogens on C3 sit 60 degrees from Br and the CH3 is opposite it: gauche, no E2 from here. In the third a hydrogen on C3 sits directly behind Br, 0 degrees: syn-periplanar, possible but slower because the molecule is eclipsed.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const front = [[0, 'Br', true], [120, 'CH₃'], [240, 'H']];
    const P3 = [
      { x: 0, title: '1 · anti, 180°', back: [[180, 'H', true], [60, 'H'], [300, 'CH₃']],
        v1: 'E2 can happen', c1: 'fg-tag-good', v2: 'the two bonds are anti-periplanar', kind: 'good' },
      { x: 256, title: '2 · gauche, 60°', back: [[60, 'H'], [300, 'H'], [180, 'CH₃']],
        v1: 'no E2 from here', c1: 'fg-tag-warn', v2: 'turn C3 first', kind: 'warn' },
      { x: 512, title: '3 · syn, 0°', back: [[18, 'H', true], [138, 'CH₃'], [258, 'H']],
        v1: 'possible, but slower', c1: 'fg-tag-mut', v2: 'the molecule must be eclipsed', kind: null },
    ];
    for (const p of P3) {
      s += panel(p.x + 4, 4, 240, 292, p.kind ? { kind: p.kind } : {});
      s += tg(p.x + 124, 28, p.title);
      s += newman(p.x + 124, 142, 42, front, p.back);
      s += tg(p.x + 124, 256, p.v1, p.c1);
      s += sm(p.x + 124, 276, p.v2);
    }
    return s;
  },
  caption: 'Looking down the C2&ndash;C3 bond of 2-bromobutane, C2 in front. Each panel turns the back carbon, C3; the C&ndash;Br bond and any hydrogen that can leave with it are shaded.',
});

/* ------------------------------------------------------------------------
   3. Why 180°: the C–H bonding pair and the C–Br antibonding lobe point the
   same way, then become the two p orbitals of the pi bond. */
FIGURES.push({
  id: 'e2-orbitals',
  section: TOPIC,
  anchor: '<!-- fig:e2-orbitals:start -->',
  alt: 'Left: 2-bromopropane side-on, with the C–H bond on the beta carbon pointing up and the C–Br bond on the alpha carbon pointing down. The C–H bonding orbital is shaded along the C–H bond, and the large lobe of the empty C–Br antibonding orbital points up from the alpha carbon, parallel to it. An arrow shows the C–H pair moving across into that lobe. Right: propene, with a p orbital standing up and down on each carbon of the double bond, side by side, forming the pi bond.',
  viewBox: '0 0 760 300',
  build() {
    let s = panel(0, 0, 372, 300);
    s += tg(186, 26, '1 · H and Br anti: the orbitals line up');
    const Cb = P(128, 176), Ca = P(248, 176);
    // the C–H bonding orbital, shaded along the bond, drawn first
    s += `<ellipse class="fg-orb" cx="${Cb.x}" cy="${Cb.y - 46}" rx="15" ry="40"></ellipse>`;
    // the big lobe of the empty C–Br sigma*, pointing away from Br
    s += lobe(Ca, 90, 78, 17, 'fg-orb-alt');
    s += bond(Cb, Ca);
    const H = P(128, 92), Br = P(248, 258);
    s += bond(Cb, H, { rTo: 12, cls: 'fg-bond-hi' }) + atom(H.x, H.y, 'H', { r: 12, kind: 'hi' });
    s += bond(Ca, Br, { rTo: 16, cls: 'fg-bond-hi' }) + atom(Br.x, Br.y, 'Br', { kind: 'warn' });
    s += wedge(Cb, at(Cb, 215, 50), { rTo: 12, width: 9 }) + atom(at(Cb, 215, 50).x, at(Cb, 215, 50).y, 'H', { r: 12 });
    s += hash(Cb, at(Cb, 245, 52), { rTo: 12, width: 11, rungs: 4 }) + atom(at(Cb, 245, 52).x, at(Cb, 245, 52).y, 'H', { r: 12 });
    s += wedge(Ca, at(Ca, -25, 56), { rTo: 16, width: 9 }) + atom(at(Ca, -25, 56).x, at(Ca, -25, 56).y, 'CH₃', { r: 16 });
    s += hash(Ca, at(Ca, 5, 50), { rTo: 12, width: 11, rungs: 4 }) + atom(at(Ca, 5, 50).x, at(Ca, 5, 50).y, 'H', { r: 12 });
    s += atom(Cb.x, Cb.y, 'C') + atom(Ca.x, Ca.y, 'C');
    s += curve(P(146, 112), P(232, 118), { bow: -26 });
    s += text(104, 128, 'C–H pair', { cls: 'fg-tag-good', size: 11, anchor: 'end' });
    s += text(274, 104, 'empty C–Br', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(274, 120, 'antibonding lobe', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += tg(150, 222, 'β');
    s += tg(226, 222, 'α');

    s += arrow(P(378, 150), P(400, 150));
    s += panel(404, 0, 356, 300, { kind: 'good' });
    s += tg(582, 26, '2 · they become the π bond');
    const A = P(530, 160), B = P(640, 160);
    for (const c of [A, B]) {
      s += lobe(c, 90, 62, 15, 'fg-orb');
      s += lobe(c, 270, 62, 15, 'fg-orb-alt');
    }
    s += bond(A, B);
    s += arm(A, 150, 58, 'H', { r: 12 });
    s += arm(A, 210, 58, 'H', { r: 12 });
    s += arm(B, 30, 62, 'CH₃', { r: 16 });
    s += arm(B, -30, 58, 'H', { r: 12 });
    s += atom(A.x, A.y, 'C') + atom(B.x, B.y, 'C');
    s += tg(585, 262, 'two parallel p orbitals', 'fg-tag-good');
    s += sm(585, 282, 'propene, side-on');
    return s;
  },
  caption: 'Left: 2-bromopropane side-on, with the two bonds that break drawn in the plane of the page. Right: the product, propene, with its π bond shown as the two p orbitals it is made from.',
});

/* ------------------------------------------------------------------------
   4. The ring version of the rule, on chlorocyclohexane. */
FIGURES.push({
  id: 'e2-chair-rule',
  section: TOPIC,
  anchor: '<!-- fig:e2-chair-rule:start -->',
  alt: 'Two chairs of chlorocyclohexane. Left: chlorine axial, pointing up from C1; the axial hydrogens on C2 and C6 point down, each anti-periplanar to the C–Cl bond, so E2 can happen. Right: chlorine equatorial; the bonds anti to C–Cl are ring C–C bonds, and the axial hydrogens on C2 and C6 are only 60 degrees from it, so this chair cannot eliminate.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const K = 0.9;
    // left: Cl axial (index 0 is C1, axial up); neighbors 1 and 5 axial down
    s += panel(4, 4, 372, 292, { kind: 'good' });
    s += tg(190, 28, '1 · Cl axial');
    const A = chair(190, 134, K);
    s += chairRing(A);
    const clA = axialEnd(A, 0, 40);
    s += bond(A[0], clA, { rFrom: 0, rTo: 15, cls: 'fg-bond-hi' }) + atom(clA.x, clA.y, 'Cl', { kind: 'warn' });
    {
      const h5 = axialEnd(A, 5, 38);
      s += bond(A[5], h5, { rFrom: 0, rTo: 11, cls: 'fg-bond-hi' }) + atom(h5.x, h5.y, 'H', { r: 11, kind: 'hi' });
      const h1 = axialEnd(A, 1, 26);
      s += bond(A[1], h1, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
      s += text(h1.x - 12, h1.y + 2, 'H', { cls: 'fg-tag-good', size: 12 });
    }
    s += text(A[0].x + 16, A[0].y + 16, 'C1', { cls: 'fg-tag-mut', size: 11, anchor: 'start' });
    s += text(A[1].x + 12, A[1].y - 8, 'C2', { cls: 'fg-tag-mut', size: 11, anchor: 'start' });
    s += text(A[5].x - 14, A[5].y + 10, 'C6', { cls: 'fg-tag-mut', size: 11, anchor: 'end' });
    s += tg(190, 256, 'axial H on C2 and C6: anti to C–Cl', 'fg-tag-good');
    s += sm(190, 276, 'E2 can happen from this chair');

    // right: Cl equatorial
    s += panel(384, 4, 372, 292, { kind: 'warn' });
    s += tg(570, 28, '2 · Cl equatorial');
    const B = chair(570, 134, K);
    s += chairRing(B);
    const clB = equatorialEnd(B, 0, 40);
    s += bond(B[0], clB, { rFrom: 0, rTo: 15, cls: 'fg-bond-hi' }) + atom(clB.x, clB.y, 'Cl', { kind: 'warn' });
    {
      const h5 = axialEnd(B, 5, 38);
      s += bond(B[5], h5, { rFrom: 0, rTo: 11, cls: 'fg-bond-soft' }) + atom(h5.x, h5.y, 'H', { r: 11 });
      const h1 = axialEnd(B, 1, 26);
      s += bond(B[1], h1, { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
      s += text(h1.x - 12, h1.y + 2, 'H', { cls: 'fg-lbl', size: 12 });
    }
    const hB = axialEnd(B, 0, 34);
    s += bond(B[0], hB, { rFrom: 0, rTo: 11 }) + atom(hB.x, hB.y, 'H', { r: 11 });
    s += text(B[0].x - 4, B[0].y + 22, 'C1', { cls: 'fg-tag-mut', size: 11, anchor: 'start' });
    s += text(B[1].x + 12, B[1].y - 8, 'C2', { cls: 'fg-tag-mut', size: 11, anchor: 'start' });
    s += text(B[5].x - 14, B[5].y + 10, 'C6', { cls: 'fg-tag-mut', size: 11, anchor: 'end' });
    s += tg(570, 256, 'only ring C–C bonds are anti to C–Cl', 'fg-tag-warn');
    s += sm(570, 276, 'no E2 from this chair');
    return s;
  },
  caption: 'The two chairs of chlorocyclohexane, with the C&ndash;Cl bond and the axial hydrogens on its neighbors C2 and C6 drawn in.',
});

/* ------------------------------------------------------------------------
   5. 2-Bromo-2-methylbutane: its two kinds of beta-H and the alkene each
   base makes. Substrate drawn with every carbon labeled, so its
   hydrogens can be counted; products skeletal. */

FIGURES.push({
  id: 'zaitsev-hofmann',
  section: TOPIC,
  anchor: '<!-- fig:zaitsev-hofmann:start -->',
  alt: '2-Bromo-2-methylbutane drawn with every carbon labeled. C2 carries the bromine and is the alpha carbon. Its three neighbors are beta carbons: C1 and the methyl branch, each a CH3 on the outside of the molecule, and C3, a CH2 tucked between C2 and C4. With ethoxide, a small base, the hydrogen comes mostly from C3, giving 2-methylbut-2-ene, a trisubstituted alkene, about 70 percent. With tert-butoxide, a bulky base, it comes mostly from a CH3, giving 2-methylbut-1-ene, a disubstituted alkene, about 72 percent.',
  viewBox: '0 0 760 420',
  build() {
    let s = panel(0, 0, 760, 196);
    s += tg(380, 24, '2-bromo-2-methylbutane');
    const C1 = P(262, 104), C2 = P(342, 104), C3 = P(422, 104), C4 = P(502, 104), Cm = P(342, 46), Br = P(342, 160);
    s += bond(C1, C2, { rFrom: 17, rTo: 15 }) + bond(C2, C3, { rFrom: 15, rTo: 17 }) + bond(C3, C4, { rFrom: 17, rTo: 17 });
    s += bond(C2, Cm, { rFrom: 15, rTo: 17 }) + bond(C2, Br, { rFrom: 15, rTo: 16, cls: 'fg-bond-hi' });
    s += atom(C1.x, C1.y, 'H₃C', { r: 17 }) + atom(C2.x, C2.y, 'C', { kind: 'hi' }) + atom(C3.x, C3.y, 'CH₂', { r: 17, kind: 'hi' });
    s += atom(C4.x, C4.y, 'CH₃', { r: 17 }) + atom(Cm.x, Cm.y, 'CH₃', { r: 17 });
    s += atom(Br.x, Br.y, 'Br', { kind: 'warn' });
    s += tg(262, 138, 'β · C1');
    s += tg(376, 50, 'β', 'fg-tag', { anchor: 'start' });
    s += tg(322, 132, 'α', 'fg-tag', { anchor: 'end' });
    s += tg(422, 138, 'β · C3');
    s += tg(502, 138, 'C4', 'fg-tag-mut');
    s += tg(226, 98, 'CH₃ hydrogens:', 'fg-tag-good', { anchor: 'end' });
    s += tg(226, 114, 'on the outside', 'fg-tag-good', { anchor: 'end' });
    s += tg(540, 98, 'CH₂ hydrogens: tucked', 'fg-tag-warn', { anchor: 'start' });
    s += tg(540, 114, 'between C2 and C4', 'fg-tag-warn', { anchor: 'start' });

    s += arrow(P(250, 200), P(190, 226));
    s += arrow(P(510, 200), P(570, 226));

    // left: small base, H from C3
    s += panel(0, 232, 372, 188, { kind: 'good' });
    s += tg(186, 254, 'small base: CH₃CH₂O⁻ takes an H from C3');
    {
      const a = P(126, 336), b = P(166, 312), c = P(206, 336), d = P(246, 312), m = P(166, 272);
      s += sk(a, b, true) + sk(b, m, true) + bond(b, c, { order: 2, rFrom: 0, rTo: 0, gap: 3.4 }) + sk(c, d, true);
      s += tg(186, 368, '2-methylbut-2-ene · about 70%', 'fg-tag-good');
      s += sm(186, 388, '3 carbons on the C=C: trisubstituted');
      s += sm(186, 406, 'the Zaitsev product');
    }
    // right: bulky base, H from a CH3
    s += panel(388, 232, 372, 188, { kind: 'hi' });
    s += tg(574, 254, 'bulky base: (CH₃)₃CO⁻ takes an H from a CH₃');
    {
      const a = P(514, 336), b = P(554, 312), c = P(594, 336), d = P(634, 312), m = P(554, 272);
      s += bond(a, b, { order: 2, rFrom: 0, rTo: 0, gap: 3.4 }) + sk(b, m, true) + sk(b, c, true) + sk(c, d);
      s += tg(574, 368, '2-methylbut-1-ene · about 72%', 'fg-tag-good');
      s += sm(574, 388, '2 carbons on the C=C: disubstituted');
      s += sm(574, 406, 'the Hofmann product');
    }
    return s;
  },
  caption: 'The substrate with its α carbon and its three β carbons marked, and the major alkene each base gives. In the products, the bonds from the C=C to the carbons attached to it are shaded.',
});

/* ------------------------------------------------------------------------
   6. How substituted an alkene is: count the carbons on the C=C. */
FIGURES.push({
  id: 'alkene-substitution',
  section: TOPIC,
  anchor: '<!-- fig:alkene-substitution:start -->',
  alt: 'Four skeletal alkenes with the bonds from the double bond to attached carbons shaded. Propene has one attached carbon: monosubstituted. (E)-But-2-ene has two, one on each end: disubstituted. 2-Methylbut-2-ene has three: trisubstituted. 2,3-Dimethylbut-2-ene has four and no hydrogen on the double bond: tetrasubstituted.',
  viewBox: '0 0 760 210',
  build() {
    let s = '';
    const cols = [
      { x: 95, name: 'propene', n: '1 carbon', t: 'monosubstituted' },
      { x: 285, name: '(E)-but-2-ene', n: '2 carbons', t: 'disubstituted' },
      { x: 475, name: '2-methylbut-2-ene', n: '3 carbons', t: 'trisubstituted' },
      { x: 665, name: '2,3-dimethylbut-2-ene', n: '4 carbons', t: 'tetrasubstituted' },
    ];
    cols.forEach((c, i) => {
      s += panel(c.x - 88, 4, 176, 202);
      const L = P(c.x - 20, 96), R = P(c.x + 20, 96);
      s += bond(L, R, { order: 2, rFrom: 0, rTo: 0, gap: 3.4 });
      // substituents: angles from each alkene carbon
      const subs = [
        [[], [-30]],
        [[210], [30]],
        [[150, 210], [-30]],
        [[150, 210], [30, -30]],
      ][i];
      for (const a of subs[0]) s += sk(L, at(L, a, 40), true);
      for (const a of subs[1]) s += sk(R, at(R, a, 40), true);
      s += tg(c.x, 158, c.n, 'fg-tag-good');
      s += tg(c.x, 176, c.t);
      s += sm(c.x, 196, c.name);
    });
    return s;
  },
  caption: 'Count the carbons bonded to the two alkene carbons (shaded bonds). Hydrogens on the C=C are not drawn and do not count.',
});

/* ------------------------------------------------------------------------
   7. Stereospecific: two diastereomers, two alkene geometries. */
FIGURES.push({
  id: 'stereospecific-pair',
  section: TOPIC,
  anchor: '<!-- fig:stereospecific-pair:start -->',
  alt: 'Two Newman projections of 1-bromo-1,2-diphenylpropane looking down the C1–C2 bond, C1 in front, each turned so the bromine on C1 is anti to the hydrogen on C2. In the (1S,2R) diastereomer the back phenyl sits upper left and the methyl upper right; the alkene produced has the two phenyl groups on opposite sides, the E isomer. In the (1S,2S) diastereomer the back phenyl and methyl are swapped, and the alkene has both phenyls on the same side, the Z isomer.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const alkene = (cx, cy, leftUp, rightUp, leftDown, rightDown) => {
      const a = P(cx - 34, cy), b = P(cx + 34, cy);
      let g = bond(a, b, { rFrom: 15, rTo: 15, order: 2, gap: 4.6 });
      const put = (c, deg, lab) => {
        const e = at(c, deg, 44);
        const r = lab.length > 2 ? 17 : lab.length > 1 ? 16 : 13;
        return bond(c, e, { rFrom: 15, rTo: r }) + atom(e.x, e.y, lab, { r, size: lab.length > 2 ? 10 : 11.5 });
      };
      g += put(a, 130, leftUp) + put(a, 230, leftDown);
      g += put(b, 50, rightUp) + put(b, 310, rightDown);
      g += atom(a.x, a.y, 'C') + atom(b.x, b.y, 'C');
      return g;
    };
    const half = (ox, title, backUpLeft, backUpRight, alk, verdict, note) => {
      let g = panel(ox + 4, 4, 372, 292);
      g += tg(ox + 190, 28, title);
      g += newman(ox + 88, 150, 42,
        [[0, 'Br', true], [120, 'Ph'], [240, 'H']],
        [[180, 'H', true], [60, backUpRight], [300, backUpLeft]]);
      g += sm(ox + 88, 262, 'C1 in front, C2 behind');
      g += arrow(P(ox + 150, 150), P(ox + 188, 150), { muted: true });
      g += alk;
      g += tg(ox + 282, 244, verdict, 'fg-tag-good');
      g += sm(ox + 282, 262, note);
      return g;
    };
    // Diastereomer 1: back phenyl upper LEFT, methyl upper RIGHT. The front
    // phenyl (lower right) ends up cis to the upper-right methyl, so the two
    // phenyls finish on opposite sides: E.
    s += half(0, '(1S,2R), or its mirror image', 'Ph', 'CH₃',
      alkene(282, 150, 'Ph', 'CH₃', 'H', 'Ph'), '(E)-1,2-diphenylprop-1-ene', 'the two Ph on opposite sides');
    // Diastereomer 2: the two back groups swapped: Z.
    s += half(380, '(1S,2S), or its mirror image', 'CH₃', 'Ph',
      alkene(662, 150, 'Ph', 'Ph', 'H', 'CH₃'), '(Z)-1,2-diphenylprop-1-ene', 'the two Ph on the same side');
    return s;
  },
  caption: 'Each diastereomer, turned so that the bromine and the β-hydrogen are anti (shaded bonds), and the alkene it gives.',
});

/* ------------------------------------------------------------------------
   8. Neomenthyl and menthyl chloride: which chair can eliminate. */
FIGURES.push({
  id: 'menthyl-two-chairs',
  section: TOPIC,
  anchor: '<!-- fig:menthyl-two-chairs:start -->',
  alt: 'Three cyclohexane chairs. Neomenthyl chloride, favored chair: chlorine axial on C1, with an axial hydrogen on each neighboring carbon, C2 and C6, anti to it. Menthyl chloride, favored chair: chlorine, isopropyl and methyl all equatorial, so nothing is anti to the chlorine. Menthyl chloride after a ring flip: all three groups axial; C2 now holds the isopropyl in its axial position, so only C6 has an axial hydrogen anti to the chlorine.',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    /* Ring indices, chosen so that every bond this figure has to draw lands
       in open space: C1 is the right-hand vertex, C2 the bottom tip (which
       carries the isopropyl), C5 the top tip (the methyl) and C6 the middle
       carbon whose only job is one axial hydrogen. */
    const C1 = 0, C2 = 5, C5 = 2, C6 = 1;
    const K = 0.62, CY = 150;
    const put = (a, b, lab, o = {}) =>
      bond(a, b, { rFrom: 0, rTo: o.r ?? 15, cls: o.cls }) +
      atom(b.x, b.y, lab, { r: o.r ?? 15, size: o.size ?? 11, kind: o.kind });
    const loc = (p, dx, dy, t) => text(p.x + dx, p.y + dy, t, { cls: 'fg-tag-mut', size: 11 });

    // ---- 1. neomenthyl: Cl axial, an axial H on each neighbor ----
    s += panel(4, 4, 244, 312, { kind: 'good' });
    const A = chair(126, CY, K);
    s += chairRing(A);
    s += put(A[C1], axialEnd(A, C1, 34), 'Cl', { r: 14, kind: 'warn', cls: 'fg-bond-hi' });
    s += put(A[C2], axialEnd(A, C2, 32), 'H', { r: 11, size: 11, kind: 'hi', cls: 'fg-bond-hi' });
    const aH6 = axialEnd(A, C6, 22);
    s += bond(A[C6], aH6, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += text(aH6.x - 12, aH6.y + 2, 'H', { cls: 'fg-tag-good', size: 12 });
    s += put(A[C2], equatorialEnd(A, C2, 34), 'iPr', { r: 15, size: 10 });
    s += put(A[C5], equatorialEnd(A, C5, 30), 'CH₃', { r: 15, size: 9.5 });
    s += loc(A[C1], 20, 14, 'C1') + loc(A[C2], -18, 12, 'C2') + loc(A[C6], -4, -10, 'C6');
    s += tg(126, 30, '1 · neomenthyl chloride');
    s += tg(126, 262, 'axial H on both neighbors', 'fg-tag-good');
    s += sm(126, 282, 'reacts from its favored chair');

    // ---- 2. menthyl, favored chair: everything equatorial ----
    s += panel(258, 4, 244, 312, { kind: 'warn' });
    const B = chair(380, CY, K);
    s += chairRing(B);
    s += put(B[C1], equatorialEnd(B, C1, 34), 'Cl', { r: 14, kind: 'warn' });
    s += put(B[C2], equatorialEnd(B, C2, 34), 'iPr', { r: 15, size: 10 });
    s += put(B[C5], equatorialEnd(B, C5, 30), 'CH₃', { r: 15, size: 9.5 });
    s += loc(B[C1], -2, 24, 'C1') + loc(B[C2], -18, 12, 'C2') + loc(B[C6], -4, -10, 'C6');
    s += tg(380, 30, '2 · menthyl chloride');
    s += tg(380, 262, 'Cl equatorial: nothing anti', 'fg-tag-warn');
    s += sm(380, 282, 'this chair cannot react');

    // ---- 3. menthyl, flipped: triaxial ----
    s += panel(512, 4, 244, 312, { kind: 'hi' });
    const C = chairFlipped(634, CY, K);
    s += chairRing(C);
    s += put(C[C1], axialEndF(C, C1, 34), 'Cl', { r: 14, kind: 'warn', cls: 'fg-bond-hi' });
    s += put(C[C2], axialEndF(C, C2, 32), 'iPr', { r: 15, size: 10 });
    s += put(C[C5], axialEndF(C, C5, 32), 'CH₃', { r: 15, size: 9.5 });
    const cH6 = axialEndF(C, C6, 22);
    s += bond(C[C6], cH6, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += text(cH6.x - 12, cH6.y + 4, 'H', { cls: 'fg-tag-good', size: 12 });
    s += loc(C[C1], 20, -12, 'C1') + loc(C[C2], 20, 8, 'C2') + loc(C[C6], -4, 18, 'C6');
    s += tg(634, 30, '3 · menthyl, ring flipped');
    s += tg(634, 262, 'only C6 has an axial H', 'fg-tag-good');
    s += sm(634, 282, 'three axial groups: strained');
    return s;
  },
  caption: 'Shaded bonds: the C&ndash;Cl bond and each hydrogen anti-periplanar to it. iPr is an isopropyl group.',
});

/* ------------------------------------------------------------------------
   9. The alkenes the two chlorides give. */
function mentheneRing(cx, cy, dblTo) {
  // C1 top, then C2 upper right, C3, C4 bottom, C5 lower left, C6 upper left
  const v = polyPts(cx, cy, 6, 40, 90);
  const Cn = { 1: v[0], 2: v[5], 3: v[4], 4: v[3], 5: v[2], 6: v[1] };
  let s = '';
  const edges = [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1]];
  for (const [i, j] of edges) {
    const isD = (i === 1 && j === dblTo) || (j === 1 && i === dblTo);
    s += sk(Cn[i], Cn[j], false);
    if (isD) {
      // inset second line toward the ring centre
      const a = Cn[i], b = Cn[j];
      const k = 0.2, ins = 0.14;
      const A = P(a.x + (b.x - a.x) * k + (cx - a.x) * ins, a.y + (b.y - a.y) * k + (cy - a.y) * ins);
      const B = P(b.x + (a.x - b.x) * k + (cx - b.x) * ins, b.y + (a.y - b.y) * k + (cy - b.y) * ins);
      s += sk(A, B, false);
    }
  }
  // isopropyl on C2 (outward, up-right), methyl on C5 (outward, down-left)
  const ip = at(Cn[2], 30, 40);
  s += sk(Cn[2], ip) + sk(ip, at(ip, 90, 38)) + sk(ip, at(ip, -30, 38));
  s += sk(Cn[5], at(Cn[5], 210, 40));
  s += text(Cn[1].x, Cn[1].y - 10, 'C1', { cls: 'fg-tag-mut', size: 11 });
  s += text(Cn[2].x - 16, Cn[2].y + 18, 'C2', { cls: 'fg-tag-mut', size: 11 });
  s += text(Cn[6].x + 16, Cn[6].y + 18, 'C6', { cls: 'fg-tag-mut', size: 11 });
  return s;
}

FIGURES.push({
  id: 'menthene-products',
  section: TOPIC,
  anchor: '<!-- fig:menthene-products:start -->',
  alt: 'Two skeletal cyclohexenes, each with an isopropyl group on C2 and a methyl on C5. Left: the double bond between C1 and C2, a trisubstituted alkene, the major product from neomenthyl chloride. Right: the double bond between C1 and C6, a disubstituted alkene, the only product from menthyl chloride.',
  viewBox: '0 0 760 230',
  build() {
    let s = panel(4, 4, 372, 222, { kind: 'good' });
    s += tg(190, 28, 'C=C between C1 and C2');
    s += mentheneRing(180, 112, 2);
    s += tg(190, 190, 'trisubstituted: the Zaitsev alkene', 'fg-tag-good');
    s += sm(190, 210, 'the major product from neomenthyl chloride');
    s += panel(384, 4, 372, 222, { kind: 'hi' });
    s += tg(570, 28, 'C=C between C1 and C6');
    s += mentheneRing(560, 112, 6);
    s += tg(570, 190, 'disubstituted: the less substituted alkene');
    s += sm(570, 210, 'the only product from menthyl chloride');
    return s;
  },
  caption: 'The two alkenes, drawn flat, with the ring numbered as in the chairs above.',
});

export default FIGURES;
