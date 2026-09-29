/* Figures for the ring-flips notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

/* Shared drawing helpers, copied from the builder. */
const CHAIR_V = [
  P(113.15, -18.21), P(56.57, -15.31), P(-56.57, -51.72),
  P(-113.15, 18.21), P(-56.58, 15.31), P(56.57, 51.72),
];
const CHAIR_EQ = [
  P(0.944, 0.329), P(0.613, -0.790), P(-0.994, 0.104),
  P(-0.944, -0.329), P(-0.613, 0.790), P(0.994, -0.104),
];
function chair(cx, cy, k = 1) {
  return CHAIR_V.map((v) => P(cx + v.x * k, cy + v.y * k));
}
const chairRing = (pts, cls) => pts.map((p, i) => bond(p, pts[(i + 1) % 6], { rFrom: 0, rTo: 0, cls })).join('');
/* Axial: straight up on the even carbons, straight down on the odd ones. */
const axialEnd = (pts, i, L = 34) => P(pts[i].x, pts[i].y + (i % 2 === 0 ? -L : L));
/* Equatorial: outward, and tilted the other way from that carbon's axial. */
const equatorialEnd = (pts, i, L = 32) => P(pts[i].x + CHAIR_EQ[i].x * L, pts[i].y + CHAIR_EQ[i].y * L);
const chairFlipped = (cx, cy, k = 1) => CHAIR_V.map((v) => P(cx + v.x * k, cy - v.y * k));
/* In the reflected ring every axial reverses: the even carbons now point down. */
const axialEndF = (pts, i, L = 34) => P(pts[i].x, pts[i].y + (i % 2 === 0 ? L : -L));
const equatorialEndF = (pts, i, L = 32) => P(pts[i].x + CHAIR_EQ[i].x * L, pts[i].y - CHAIR_EQ[i].y * L);

const FIGURES = [];

FIGURES.push({
  id: 'ring-flip-invariant',
  section: 'ring-flips',
  anchor: '<div class="notes-pitfall"><b>A ring flip is not a rotation of the drawing.</b> If you redraw a chair rotated on the page, up stays up and axial stays axial — nothing has happened. A genuine flip pushes the "up" end of the chair down and the "down" end up, which is why every axial/equatorial assignment reverses. The reliable test: after a correct flip, every substituent should have swapped axial/equatorial and kept its up/down face. If both changed, or neither did, the drawing is wrong.</div>',
  alt: 'Two cyclohexane chairs side by side. In the left chair the methyl-bearing carbon is the raised end and its methyl sits on a vertical bond pointing up, so it is axial. The right chair is the same ring reflected so that carbon is now the lowered end; the methyl sits on an outward bond that still angles upward, so it is equatorial and still on the upper face.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const K = 0.9, CY = 140, I = 2;          // I: the tracked carbon, the up-tip of the left chair

    // ---- left chair: the tracked carbon is the raised end, methyl axial-up ----
    const A = chair(200, CY, K);
    s += chairRing(A);
    for (const p of A) s += atom(p.x, p.y, '', { kind: 'point' });
    const aEnd = axialEnd(A, I, 36);
    s += bond(A[I], aEnd, { rFrom: 0, rTo: 17, cls: 'fg-bond-hi' });
    s += atom(aEnd.x, aEnd.y, 'CH₃', { kind: 'hi', r: 17, size: 10 });
    s += text(A[I].x - 26, A[I].y + 4, 'C1', { cls: 'fg-tag-warn', size: 10 });
    s += tag(200, 26, 'one chair');
    s += text(200, 252, 'C1 is the raised end of this ring', { cls: 'fg-sm', size: 9.5 });
    s += text(200, 274, 'AXIAL — and pointing up', { cls: 'fg-tag-warn', size: 11.5 });
    s += text(200, 294, 'crowded by two 1,3-diaxial hydrogens', { cls: 'fg-sm', size: 9.5 });

    // ---- right chair: the same ring reflected. C1 is now the lowered end ----
    const B = chairFlipped(562, CY, K);
    s += chairRing(B);
    for (const p of B) s += atom(p.x, p.y, '', { kind: 'point' });
    const bEnd = equatorialEndF(B, I, 34);
    s += bond(B[I], bEnd, { rFrom: 0, rTo: 17, cls: 'fg-bond-hi' });
    s += atom(bEnd.x, bEnd.y, 'CH₃', { kind: 'hi', r: 17, size: 10 });
    s += text(B[I].x + 26, B[I].y + 11, 'C1', { cls: 'fg-tag', size: 10, anchor: 'start' });
    // its axial bond now points DOWN, which is why the up bond is the outward one
    s += bond(B[I], axialEndF(B, I, 26), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
    s += text(B[I].x + 18, B[I].y + 30, 'axial now points down', { cls: 'fg-sm', size: 9, anchor: 'start' });
    s += tag(562, 26, 'the other chair');
    s += text(562, 252, 'C1 is now the lowered end', { cls: 'fg-sm', size: 9.5 });
    s += text(562, 274, 'EQUATORIAL — and still pointing up', { cls: 'fg-tag-good', size: 11.5 });
    s += text(562, 294, 'out in the open, crowded by nothing', { cls: 'fg-sm', size: 9.5 });

    // ---- the flip itself ----
    s += arrow(P(330, 112), P(430, 112));
    s += arrow(P(430, 150), P(330, 150), { muted: true });
    s += text(380, 96, 'flip', { cls: 'fg-tag', size: 11.5 });
    s += text(380, 176, '~10⁵ times a second', { cls: 'fg-sm', size: 9 });
    return s;
  },
  caption: 'One methyl group, one carbon, two chairs. Follow it: it was axial and became equatorial, and through the whole motion it never stopped pointing <b>up</b>. That is the invariant that makes the vocabulary work. Which face of the ring a group is on is a fact about the molecule and cannot change without breaking a bond; axial versus equatorial is a fact about the conformation, and it reverses roughly a hundred thousand times a second.',
  note: 'Look at what had to change for that to be true: the <b>ring</b> is redrawn with its ends swapped, so C1 goes from the raised end to the lowered one and its axial direction turns over with it. The methyl then stays on the upper face by moving onto the outward bond. AXIAL and EQUATORIAL swapped; UP stayed UP. If your redrawn chair changed both, or neither, you rotated the page instead of flipping the ring.',
});

export default FIGURES;
