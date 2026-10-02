/* Figures for the electrocyclic-sigmatropic notes page and its lesson.
   Built by scripts/build-ochem-figures.mjs; see the header there.

   Every figure is 360 wide with its panels stacked, so one drawing serves
   both the notes page and the lesson step. Orbital phases use the course's
   two orbital colors (fg-orb and fg-orb-alt) and never a +/- sign, the way
   Conjugated systems draws them. Rings are flat-bottomed hexagons whose six
   corners keep the same atoms before and after, so an atom can be followed
   by position. */
import { atom, bond, wedge, hash, arrow, curve, text, tag, rule, P } from '../lib/ochem-figure.mjs';
import { polyPts, ringDouble } from '../lib/ochem-skeletal.mjs';
import { lobeE } from '../lib/ochem-helpers.mjs';

const FIGURES = [];
const r1 = (v) => Math.round(v * 10) / 10;
const RAD = Math.PI / 180;
const off = (p, deg, len) => P(r1(p.x + Math.cos(deg * RAD) * len), r1(p.y - Math.sin(deg * RAD) * len));
const mid = (a, b) => P(r1((a.x + b.x) / 2), r1((a.y + b.y) / 2));
const sk = (a, b, cls) => bond(a, b, { rFrom: 0, rTo: 0, cls: cls || 'fg-bond' });
const dot = (p) => `<circle class="fg-atom" cx="${r1(p.x)}" cy="${r1(p.y)}" r="3.5"></circle>`;
const A = 'fg-orb', B = 'fg-orb-alt';

/* A p orbital standing up through (x, y): `top` is the class of the upper
   lobe; `k` scales it (a bigger coefficient, a bigger lobe). */
function pUp(x, y, top, k = 1) {
  const rx = r1(9 * k), ry = r1(16 * k);
  return lobeE(x, r1(y - 2 - ry), rx, ry, top) + lobeE(x, r1(y + 2 + ry), rx, ry, top === A ? B : A);
}
/* A p orbital lying flat through (x, y): `right` is the class of the lobe
   on the right. */
function pFlat(x, y, right) {
  return lobeE(r1(x + 16), y, 14, 9, right) + lobeE(r1(x - 16), y, 14, 9, right === A ? B : A);
}

/* =====================================================================
   1. Turning the ends. Each row: two end carbons with their p orbitals and
   the way each one turns, then the same two ends after a quarter turn, with
   matching lobes facing. */
function turnRow(y, con) {
  let s = '';
  const L = P(70, y + 78), R = P(170, y + 78);
  s += text(180, y + 18, con ? 'Conrotatory: both ends turn the same way' : 'Disrotatory: the ends turn opposite ways', { cls: 'fg-lbl', size: 12.5 });
  s += `<path class="fg-bond-soft" fill="none" stroke-dasharray="4 4" d="M${L.x} ${L.y} C ${L.x} ${y + 140} ${R.x} ${y + 140} ${R.x} ${R.y}"></path>`;
  s += text(120, y + 136, 'rest of the chain', { cls: 'fg-tag-mut', size: 10 });
  s += pUp(L.x, L.y, A) + pUp(R.x, R.y, con ? B : A);
  s += dot(L) + dot(R);
  // left end: clockwise over the top; right end: clockwise (con) or counter (dis)
  s += curve(P(L.x - 30, y + 44), P(L.x + 30, y + 44), { bow: -16, size: 7 });
  s += con ? curve(P(R.x - 30, y + 44), P(R.x + 30, y + 44), { bow: -16, size: 7 })
           : curve(P(R.x + 30, y + 44), P(R.x - 30, y + 44), { bow: 16, size: 7 });
  s += arrow(P(200, y + 78), P(220, y + 78), { size: 7 });
  // after: the facing lobes match, so they overlap into the new sigma bond
  const L2 = P(256, y + 78), R2 = P(316, y + 78);
  s += pFlat(L2.x, L2.y, A) + pFlat(R2.x, R2.y, B);
  s += dot(L2) + dot(R2);
  s += text(286, y + 112, 'same color meets', { cls: 'fg-tag-good', size: 10.5 });
  s += text(286, y + 126, 'the new σ bond', { cls: 'fg-tag-good', size: 10.5 });
  return s;
}

FIGURES.push({
  id: 'ec-rotation',
  section: 'electrocyclic-sigmatropic',
  lessons: ['electrocyclic-sigmatropic'],
  anchor: 'like a pair of doors swinging toward each other.</li>',
  alt: 'Two rows. Top, conrotatory: the two end carbons of a chain each carry an upright p orbital; on the left end the upper lobe is one color, on the right end the upper lobe is the other color. Curved arrows show both ends turning clockwise. After a quarter turn, each end points a lobe at the other, and the two facing lobes are the same color, labeled as the new sigma bond. Bottom, disrotatory: both upper lobes are the same color; the left end turns clockwise and the right end counterclockwise, and again the two facing lobes match.',
  viewBox: '0 0 360 330',
  build() {
    let s = turnRow(0, true);
    s += rule(16, 162, 344, 162);
    s += turnRow(166, false);
    return s;
  },
  caption: 'The two colors are the two phases of a p orbital. A bond forms only where lobes of the same color meet, so the colors at the two ends decide which way the ends must turn.',
});

/* =====================================================================
   2. The HOMO of each polyene, with lobes sized by the orbital
   coefficients (Hückel): the end lobes are what the rule reads. */
function homoRow(y, coeffs, title, verdict, good) {
  let s = text(180, y + 18, title, { cls: 'fg-lbl', size: 12.5 });
  const n = coeffs.length, step = n === 4 ? 70 : 52;
  const x0 = 180 - (step * (n - 1)) / 2, cy = y + 80;
  s += bond(P(x0, cy), P(x0 + step * (n - 1), cy), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
  coeffs.forEach((c, i) => {
    const x = r1(x0 + step * i);
    s += pUp(x, cy, c > 0 ? A : B, 0.55 + Math.abs(c) * 0.9);
    s += dot(P(x, cy));
    if (i === 0 || i === n - 1) s += `<circle class="fg-orb-node" cx="${x}" cy="${r1(cy - 22)}" r="17" fill="none" stroke-dasharray="3 3"></circle>`;
    s += text(x, cy + 54, `C${i + 1}`, { cls: 'fg-tag-mut', size: 10 });
  });
  s += text(180, y + 152, verdict, { cls: good, size: 11 });
  return s;
}

FIGURES.push({
  id: 'ec-homo-ends',
  section: 'electrocyclic-sigmatropic',
  lessons: ['electrocyclic-sigmatropic'],
  anchor: 'brings the two top lobes together.</li>',
  alt: 'Two rows of p orbitals. Top: the HOMO of buta-1,3-diene, four orbitals; the upper lobes of C1 and C2 are one color and those of C3 and C4 the other, so the circled end lobes, on C1 and C4, differ: conrotatory. Bottom: the HOMO of hexa-1,3,5-triene, six orbitals; the upper lobes run two of one color, two of the other, two of the first, so the circled end lobes, on C1 and C6, match: disrotatory. End lobes are drawn larger, as in the real orbitals.',
  viewBox: '0 0 360 340',
  build() {
    let s = homoRow(0, [0.60, 0.37, -0.37, -0.60], 'Buta-1,3-diene HOMO (4 π electrons)', 'top end lobes differ → conrotatory with heat', 'fg-tag');
    s += rule(16, 168, 344, 168);
    s += homoRow(170, [0.52, 0.23, -0.42, -0.42, 0.23, 0.52], 'Hexa-1,3,5-triene HOMO (6 π electrons)', 'top end lobes match → disrotatory with heat', 'fg-tag-good');
    return s;
  },
  caption: 'Only the circled end lobes matter. Light moves an electron into the next orbital up, whose end lobes are arranged the other way, so each answer flips.',
});

/* =====================================================================
   3. Following the methyls. A flat-bottomed hexagon: corner 4 (lower left)
   and corner 5 (lower right) are the two ends that bond. */
function hex(cx, cy, r = 32) { return polyPts(cx, cy, 6, r, 0); }
function triene(cx, cy) {
  const v = hex(cx, cy), c = P(cx, cy);
  let s = '';
  s += ringDouble(v[4], v[3], c, { inset: 6 }) + sk(v[3], v[2]) + ringDouble(v[2], v[1], c, { inset: 6 });
  s += sk(v[1], v[0]) + ringDouble(v[0], v[5], c, { inset: 6 });
  s += sk(v[4], v[5], 'fg-dash');
  s += bond(v[4], off(v[4], 240, 30), { rFrom: 0, rTo: 15 }) + atom(off(v[4], 240, 30).x, off(v[4], 240, 30).y, 'CH₃', { r: 15 });
  s += bond(v[5], off(v[5], 300, 30), { rFrom: 0, rTo: 15 }) + atom(off(v[5], 300, 30).x, off(v[5], 300, 30).y, 'CH₃', { r: 15 });
  return s;
}
function diene(cx, cy, cis) {
  const v = hex(cx, cy), c = P(cx, cy);
  let s = '';
  s += sk(v[4], v[3]) + ringDouble(v[3], v[2], c, { inset: 6 }) + sk(v[2], v[1]);
  s += ringDouble(v[1], v[0], c, { inset: 6 }) + sk(v[0], v[5]) + sk(v[4], v[5], 'fg-bond-hi');
  const m1 = off(v[4], 240, 32), m2 = off(v[5], 300, 32);
  s += wedge(v[4], m1, { rFrom: 0, rTo: 15, width: 9 }) + atom(m1.x, m1.y, 'CH₃', { r: 15 });
  s += (cis ? wedge(v[5], m2, { rFrom: 0, rTo: 15, width: 9 }) : hash(v[5], m2, { rFrom: 0, rTo: 15, width: 10, rungs: 5 }))
     + atom(m2.x, m2.y, 'CH₃', { r: 15 });
  return s;
}

FIGURES.push({
  id: 'ec-triene-stereo',
  section: 'electrocyclic-sigmatropic',
  lessons: ['electrocyclic-sigmatropic'],
  anchor: 'and the product is <i>trans</i>.</p>',
  alt: 'Left: (2E,4Z,6E)-octa-2,4,6-triene drawn curled into a U on five corners of a hexagon, with a dashed line across the open bottom where the new bond will form; both end carbons carry a methyl pointing outward. An upper arrow labeled heat, disrotatory, leads to 5,6-dimethylcyclohexa-1,3-diene with both methyls on wedges: cis. A lower arrow labeled light, conrotatory, leads to the same ring with one methyl on a wedge and one on a hashed bond: trans. The new bond is in color.',
  viewBox: '0 0 360 320',
  build() {
    let s = triene(66, 150);
    s += text(66, 236, 'both methyls out', { cls: 'fg-tag-mut', size: 10.5 });
    s += text(66, 252, '(2E,4Z,6E)-octatriene', { cls: 'fg-tag', size: 10.5 });
    s += arrow(P(124, 130), P(204, 84), { size: 8 });
    s += text(150, 84, 'heat', { cls: 'fg-tag', size: 11 }) + text(150, 98, 'dis', { cls: 'fg-tag-mut', size: 10 });
    s += arrow(P(124, 172), P(204, 222), { size: 8 });
    s += text(150, 222, 'light', { cls: 'fg-tag', size: 11 }) + text(150, 236, 'con', { cls: 'fg-tag-mut', size: 10 });
    s += diene(272, 62, true);
    s += text(272, 138, 'cis', { cls: 'fg-tag-good', size: 11.5 });
    s += diene(272, 222, false);
    s += text(272, 298, 'trans', { cls: 'fg-tag', size: 11.5 });
    return s;
  },
  caption: 'Same triene, same ring; only the rotation differs. The bond in color is the new σ bond between the two end carbons.',
});

/* =====================================================================
   4. The [3,3] shift, twice. Corners 4 and 5 (the bottom edge) hold the
   bond that breaks; corners 2 and 1 (the top edge) the bond that forms.
   The small numbers count out from each end of the breaking bond. */
function num(v, i, cx, cy, t) {
  const p = v[i], dx = p.x - cx, dy = p.y - cy, l = Math.hypot(dx, dy) || 1;
  return text(r1(p.x - (dx / l) * 13), r1(p.y - (dy / l) * 13 + 4), t, { cls: 'fg-tag-mut', size: 10 });
}
function shift(cx, cy, oxygen, after) {
  const v = hex(cx, cy, 42), c = P(cx, cy);
  let s = '';
  const at4 = oxygen ? 13 : 0;
  if (!after) {
    s += ringDouble(v[2], v[3], c, { inset: 6 }) + bond(v[3], v[4], { rFrom: 0, rTo: at4 });
    s += bond(v[4], v[5], { rFrom: at4, rTo: 0, cls: 'fg-bond-hi' });
    s += sk(v[5], v[0]) + ringDouble(v[0], v[1], c, { inset: 6 });
    s += sk(v[1], v[2], 'fg-dash-hi');
    s += curve(off(mid(v[0], v[1]), 30, 7), off(mid(v[1], v[2]), 90, 7), { bow: 14, size: 7 });
    s += curve(off(mid(v[2], v[3]), 150, 7), off(mid(v[3], v[4]), 210, 7), { bow: 14, size: 7 });
    s += curve(off(mid(v[4], v[5]), 270, 7), off(mid(v[5], v[0]), 330, 7), { bow: 14, size: 7 });
  } else {
    s += sk(v[1], v[2], 'fg-bond-hi') + sk(v[2], v[3]);
    s += oxygen ? bond(v[3], v[4], { order: 2, rFrom: 0, rTo: at4 }) : ringDouble(v[3], v[4], c, { inset: 6 });
    s += ringDouble(v[5], v[0], c, { inset: 6 }) + sk(v[0], v[1]);
  }
  if (oxygen) s += atom(v[4].x, v[4].y, 'O', { r: 13 });
  else {
    const m = off(v[4], 240, 30);
    s += bond(v[4], m, { rFrom: 0, rTo: 15 }) + atom(m.x, m.y, 'CH₃', { r: 15 });
  }
  if (!after) {
    s += num(v, 4, cx, cy, '1') + num(v, 3, cx, cy, '2') + num(v, 2, cx, cy, '3');
    s += num(v, 5, cx, cy, '1′') + num(v, 0, cx, cy, '2′') + num(v, 1, cx, cy, '3′');
  }
  return s;
}
function shiftRow(y, oxygen) {
  let s = text(180, y + 16, oxygen ? 'Claisen rearrangement' : 'Cope rearrangement', { cls: 'fg-lbl', size: 13 });
  s += shift(86, y + 86, oxygen, false);
  s += arrow(P(150, y + 86), P(206, y + 86), { size: 8 });
  s += text(178, y + 76, 'heat', { cls: 'fg-tag-mut', size: 10.5 });
  s += shift(272, y + 86, oxygen, true);
  s += text(86, y + 172, oxygen ? 'allyl vinyl ether' : '3-methylhexa-1,5-diene', { cls: 'fg-tag', size: 10.5 });
  s += text(272, y + 172, oxygen ? 'pent-4-enal' : 'hepta-1,5-diene', { cls: 'fg-tag', size: 10.5 });
  return s;
}

FIGURES.push({
  id: 'sig-cope-claisen',
  section: 'electrocyclic-sigmatropic',
  lessons: ['electrocyclic-sigmatropic'],
  anchor: 'has its own name: the <b>Cope rearrangement</b>.</p>',
  alt: 'Two rows, each drawn on the six corners of a hexagon. Top, Cope rearrangement: 3-methylhexa-1,5-diene with the bond across the bottom, between the atoms numbered 1 and 1-prime, in color as the bond that breaks, and a dashed bond across the top, between the atoms numbered 3 and 3-prime, as the bond that forms. Three curved arrows run round the ring. The product, hepta-1,5-diene, has the new bond across the top and the two double bonds moved one place each. Bottom, Claisen rearrangement: allyl vinyl ether, with an oxygen at the lower-left corner, gives pent-4-enal, in which that oxygen is now double-bonded to carbon.',
  viewBox: '0 0 360 372',
  build() {
    let s = shiftRow(0, false);
    s += rule(16, 184, 344, 184);
    s += shiftRow(186, true);
    return s;
  },
  caption: 'Left: the bond in color breaks and the dashed bond forms, numbered 1 to 3 out from each end of the breaking bond. Right: the new bond is in color. No atom is added or lost.',
});

/* =====================================================================
   5. The chair transition state of the Cope rearrangement of
   3-methylhexa-1,5-diene, with the methyl equatorial. Chair geometry is
   the chapter's own (Cyclohexanes). */
const CHAIR_V = [
  P(113.15, -18.21), P(56.57, -15.31), P(-56.57, -51.72),
  P(-113.15, 18.21), P(-56.58, 15.31), P(56.57, 51.72),
];
const CHAIR_EQ = [
  P(0.944, 0.329), P(0.613, -0.790), P(-0.994, 0.104),
  P(-0.944, -0.329), P(-0.613, 0.790), P(0.994, -0.104),
];

FIGURES.push({
  id: 'sig-chair-ts',
  section: 'electrocyclic-sigmatropic',
  lessons: ['electrocyclic-sigmatropic'],
  anchor: 'so the main product is (<i>E</i>)-hepta-1,5-diene.</p>',
  alt: 'A cyclohexane-shaped chair made of the six atoms of the Cope rearrangement, C1 to C6. Two of its bonds are dashed: the C3 to C4 bond that is breaking and the C1 to C6 bond that is forming. C3 carries a methyl in the equatorial position, pointing out from the ring, and a hydrogen in the axial position, pointing straight up. A note says the equatorial methyl leads to the E double bond.',
  viewBox: '0 0 360 230',
  build() {
    const k = 0.95, cx = 190, cy = 112;
    const v = CHAIR_V.map((p) => P(r1(cx + p.x * k), r1(cy + p.y * k)));
    // C3 = v2, C4 = v1, C5 = v0, C6 = v5, C1 = v4, C2 = v3
    let s = '';
    s += sk(v[2], v[1], 'fg-dash') + sk(v[1], v[0]) + sk(v[0], v[5]);
    s += sk(v[5], v[4], 'fg-dash-hi') + sk(v[4], v[3]) + sk(v[3], v[2]);
    const eq = P(r1(v[2].x + CHAIR_EQ[2].x * 40), r1(v[2].y + CHAIR_EQ[2].y * 40));
    s += bond(v[2], eq, { rFrom: 0, rTo: 15, cls: 'fg-bond-hi' }) + atom(eq.x, eq.y, 'CH₃', { r: 15 });
    const ax = P(v[2].x, r1(v[2].y - 30));
    s += bond(v[2], ax, { rFrom: 0, rTo: 9 }) + atom(ax.x, ax.y, 'H', { r: 9 });
    const lbl = [['C5', 0, 18, 6], ['C4', 1, 8, 18], ['C3', 2, 16, 14], ['C2', 3, -20, 4], ['C1', 4, -6, 20], ['C6', 5, 6, 20]];
    for (const [t, i, dx, dy] of lbl) s += text(r1(v[i].x + dx), r1(v[i].y + dy), t, { cls: 'fg-tag-mut', size: 10 });
    s += text(104, 214, 'dashed: breaking (C3–C4) and forming (C1–C6)', { cls: 'fg-tag-mut', size: 10, anchor: 'start' });
    s += text(14, 176, 'methyl equatorial', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(14, 192, '→ the (E) alkene', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    return s;
  },
  caption: 'The six atoms sit in a chair, like cyclohexane. The methyl on C3 takes the equatorial position, pointing out from the ring; that choice makes the new C2=C3 double bond <i>E</i>.',
});

export default FIGURES;
