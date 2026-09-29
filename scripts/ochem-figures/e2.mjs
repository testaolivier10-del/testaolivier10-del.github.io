/* Figures for the e2 notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

/* The chair, taken from the one already drawn in axial-equatorial (the
   twelve-position figure), so a new drawing cannot disagree with the book's
   own reference. Offsets are relative to the ring center; axial is vertical
   and alternates, and each equatorial unit vector is the one that figure
   uses, which is parallel to the ring bond two carbons round and tilted
   OPPOSITE to that carbon's axial. Getting that tilt backwards is the
   classic bad chair, so it is measured here rather than re-derived. */
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

const chairFlipped = (cx, cy, k = 1) => CHAIR_V.map((v) => P(cx + v.x * k, cy - v.y * k));

const chairRing = (pts, cls) => pts.map((p, i) => bond(p, pts[(i + 1) % 6], { rFrom: 0, rTo: 0, cls })).join('');

const axialEnd = (pts, i, L = 34) => P(pts[i].x, pts[i].y + (i % 2 === 0 ? -L : L));

const axialEndF = (pts, i, L = 34) => P(pts[i].x, pts[i].y + (i % 2 === 0 ? L : -L));

const equatorialEnd = (pts, i, L = 32) => P(pts[i].x + CHAIR_EQ[i].x * L, pts[i].y + CHAIR_EQ[i].y * L);

/* The single dot that makes a species a radical. */
const dot = (x, y) => `<circle class="fg-lp" cx="${x}" cy="${y}" r="3.4"></circle>`;

/* A Newman projection. Angles are degrees clockwise from straight up, which
   is how a student reads a dihedral off the page. */
function newman(cx, cy, r, front, back, opts = {}) {
  const at = (a, R) => P(cx + R * Math.sin(a * Math.PI / 180), cy - R * Math.cos(a * Math.PI / 180));
  let s = '';
  // back spokes first, so the front circle and dot sit on top of them
  for (const [a, lab] of back) {
    const p1 = at(a, r), p2 = at(a, r + 21), p3 = at(a, r + 34);
    s += `<line class="fg-bond-soft" x1="${p1.x.toFixed(2)}" y1="${p1.y.toFixed(2)}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}"></line>`;
    s += text(p3.x, p3.y + 3.5, lab, { cls: 'fg-lbl', size: lab.length > 1 ? 9.5 : 11 });
  }
  s += `<circle class="fg-atom" cx="${cx}" cy="${cy}" r="${r}"></circle>`;
  for (const [a, lab] of front) {
    const p2 = at(a, r), p3 = at(a, r + 13);
    s += `<line class="fg-bond" x1="${cx}" y1="${cy}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}"></line>`;
    s += text(p3.x, p3.y + 3.5, lab, { cls: 'fg-lbl', size: lab.length > 1 ? 9.5 : 11 });
  }
  s += `<circle class="fg-lp-mut" cx="${cx}" cy="${cy}" r="4.5"></circle>`;
  return s;
}


const FIGURES = [];

FIGURES.push({
  id: 'menthyl-two-chairs',
  section: 'e2',
  anchor: '<p>In menthyl chloride the favored chair has everything equatorial, including chlorine. To eliminate at all the ring must flip into a strained triaxial chair, which is why it is slow; and in that chair only one neighboring carbon carries an axial hydrogen, the one giving the less substituted alkene. Geometry overrides the usual product preference completely.</p>',
  alt: 'Three cyclohexane chairs. In neomenthyl chloride the favored chair has chlorine axial and an axial hydrogen on each neighboring carbon. In menthyl chloride the favored chair has chlorine, the isopropyl group and the methyl all equatorial, so no elimination is possible. Its ring-flipped chair puts all three axial, and only one neighboring carbon still has an axial hydrogen.',
  viewBox: '0 0 760 372',
  build() {
    let s = '';
    /* Ring indices, chosen so that every bond this figure has to draw lands
       in open space: C1 is the right-hand vertex, C2 the bottom tip (which
       carries the isopropyl), C5 the top tip (the methyl) and C6 the middle
       carbon whose only job is one axial hydrogen. */
    const C1 = 0, C2 = 5, C5 = 2, C6 = 1;
    const K = 0.62, CY = 150;
    const dot = (pts) => pts.map((p) => atom(p.x, p.y, '', { kind: 'point' })).join('');
    const put = (a, b, lab, o = {}) =>
      bond(a, b, { rFrom: 0, rTo: o.r ?? 15, cls: o.cls }) +
      atom(b.x, b.y, lab, { r: o.r ?? 15, size: o.size ?? 11, kind: o.kind });

    // ---- 1. neomenthyl: Cl axial, an axial H on each neighbor ----
    const A = chair(128, CY, K);
    s += chairRing(A) + dot(A);
    s += put(A[C1], axialEnd(A, C1, 34), 'Cl', { r: 14, kind: 'warn', cls: 'fg-bond-hi' });
    s += put(A[C2], axialEnd(A, C2, 30), 'H', { r: 11, size: 10, kind: 'hi', cls: 'fg-bond-hi' });
    const aH6 = axialEnd(A, C6, 20);
    s += bond(A[C6], aH6, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += text(aH6.x - 11, aH6.y + 4, 'H', { cls: 'fg-tag-good', size: 11 });
    s += put(A[C2], equatorialEnd(A, C2, 32), 'iPr', { r: 15, size: 10 });
    s += put(A[C5], equatorialEnd(A, C5, 28), 'CH₃', { r: 15, size: 9.5 });
    s += tag(128, 44, 'NEOMENTHYL — Cl ALREADY AXIAL');
    s += text(128, 252, 'axial H on BOTH neighbors', { cls: 'fg-tag-good', size: 10.5 });
    s += text(128, 270, 'fast, and free to pick the', { cls: 'fg-sm', size: 9.5 });
    s += text(128, 286, 'more substituted alkene', { cls: 'fg-sm', size: 9.5 });

    s += rule(256, 60, 256, 300);

    // ---- 2. menthyl, favored chair: everything equatorial ----
    const B = chair(384, CY, K);
    s += chairRing(B) + dot(B);
    s += put(B[C1], equatorialEnd(B, C1, 32), 'Cl', { r: 14, kind: 'warn' });
    s += put(B[C2], equatorialEnd(B, C2, 32), 'iPr', { r: 15, size: 10 });
    s += put(B[C5], equatorialEnd(B, C5, 28), 'CH₃', { r: 15, size: 9.5 });
    s += tag(384, 44, 'MENTHYL — ALL THREE EQUATORIAL');
    s += text(384, 252, 'Cl is equatorial, so NOTHING', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(384, 270, 'is anti-periplanar to it.', { cls: 'fg-sm', size: 9.5 });
    s += text(384, 286, 'This chair cannot react at all.', { cls: 'fg-sm', size: 9.5 });

    s += rule(512, 60, 512, 300);

    // ---- 3. menthyl, flipped: triaxial ----
    const C = chairFlipped(640, CY, K);
    s += chairRing(C) + dot(C);
    s += put(C[C1], axialEndF(C, C1, 34), 'Cl', { r: 14, kind: 'warn', cls: 'fg-bond-hi' });
    s += put(C[C2], axialEndF(C, C2, 30), 'iPr', { r: 15, size: 10 });
    s += put(C[C5], axialEndF(C, C5, 30), 'CH₃', { r: 15, size: 9.5 });
    const cH6 = axialEndF(C, C6, 20);
    s += bond(C[C6], cH6, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += text(cH6.x - 11, cH6.y + 2, 'H', { cls: 'fg-tag-good', size: 11 });
    s += tag(640, 44, 'MENTHYL, FLIPPED — AND STRAINED');
    s += text(640, 252, 'now Cl is axial — but C2\u2019s axial', { cls: 'fg-sm', size: 9.5 });
    s += text(640, 270, 'slot is taken by the iPr,', { cls: 'fg-sm', size: 9.5 });
    s += text(640, 286, 'so there is only ONE axial H', { cls: 'fg-tag-warn', size: 10.5 });

    s += rule(60, 316, 700, 316);
    s += text(380, 342, 'Two diastereomers, a 200-fold rate difference — and the slower one gives the LESS substituted alkene,', { cls: 'fg-sm', size: 9.5 });
    s += text(380, 362, 'because the only hydrogen it can reach is the one Zaitsev would not have chosen.', { cls: 'fg-tag-warn', size: 10.5 });
    return s;
  },
  caption: 'The two chairs the worked example asks you to build, built. Everything in this comparison follows from one rule — the hydrogen and the chlorine must both be <b>axial</b> — applied to rings that differ only in which face the chlorine sits on. Neomenthyl already satisfies it; menthyl has to pay for a ring flip first, which is where its two-hundred-fold slower rate comes from.',
  note: 'The second half is the part worth remembering. In the flipped menthyl chair, the isopropyl group is occupying the axial position on one of the two neighboring carbons, so that carbon has no axial hydrogen left to give up. The only axial hydrogen available is on the plain CH₂ on the other side — and eliminating there gives the less substituted alkene. Geometry outranks Zaitsev, every time.',
});

FIGURES.push({
  id: 'stereospecific-pair',
  section: 'e2',
  anchor: 'the reverse is not true.</p></div>',
  alt: 'Two Newman projections of 1-bromo-1,2-diphenylpropane, each with the bromine on the front carbon anti to the hydrogen on the back carbon. In the first the back phenyl sits upper left and the methyl upper right, and the alkene produced has the two phenyl groups on opposite sides, the E isomer. In the second the back phenyl and methyl are swapped and the alkene produced has both phenyls on the same side, the Z isomer.',
  viewBox: '0 0 760 400',
  build() {
    let s = '';
    const alkene = (cx, cy, leftUp, rightUp, leftDown, rightDown) => {
      const a = P(cx - 34, cy), b = P(cx + 34, cy);
      let g = bond(a, b, { rFrom: 15, rTo: 15, order: 2, gap: 4.6 });
      const put = (c, deg, lab) => {
        const e = armEnd(c, deg, 42);
        const r = lab.length > 2 ? 17 : lab.length > 1 ? 16 : 13;
        return bond(c, e, { rFrom: 15, rTo: r }) + atom(e.x, e.y, lab, { r, size: lab.length > 2 ? 10 : 11.5 });
      };
      g += put(a, 130, leftUp) + put(a, 230, leftDown);
      g += put(b, 50, rightUp) + put(b, 310, rightDown);
      g += atom(a.x, a.y, 'C') + atom(b.x, b.y, 'C');
      return g;
    };

    const panel = (ox, title, backUpLeft, backUpRight, alk, verdict, vcls) => {
      let g = tag(ox + 190, 40, title);
      g += newman(ox + 80, 150, 44,
        [[0, 'Br'], [120, 'Ph'], [240, 'H']],
        [[180, 'H'], [60, backUpRight], [300, backUpLeft]]);
      g += text(ox + 80, 252, 'Br anti to the β-H', { cls: 'fg-sm', size: 9.5 });
      g += text(ox + 80, 268, 'nothing else reacts', { cls: 'fg-sm', size: 9.5 });
      g += arrow(P(ox + 136, 150), P(ox + 176, 150), { muted: true });
      g += alk;
      g += text(ox + 256, 252, verdict, { cls: vcls, size: 11 });
      return g;
    };

    // Diastereomer 1: back phenyl upper-LEFT, methyl upper-RIGHT.
    // The front phenyl (lower right) ends up cis to whatever is upper right,
    // so the two phenyls finish on opposite sides: E.
    s += panel(16, '(1S,2R) AND ITS MIRROR IMAGE', 'Ph', 'CH₃',
      alkene(272, 150, 'Ph', 'CH₃', 'H', 'Ph'),
      '(E)-1,2-diphenylprop-1-ene', 'fg-tag-good');
    s += text(272, 268, 'the two Ph end up trans', { cls: 'fg-sm', size: 9.5 });

    s += rule(392, 60, 392, 300);

    // Diastereomer 2: the two back groups swapped.
    s += panel(404, '(1S,2S) AND ITS MIRROR IMAGE', 'CH₃', 'Ph',
      alkene(660, 150, 'Ph', 'Ph', 'H', 'CH₃'),
      '(Z)-1,2-diphenylprop-1-ene', 'fg-tag-good');
    s += text(660, 268, 'the two Ph end up cis', { cls: 'fg-sm', size: 9.5 });

    s += rule(60, 318, 700, 318);
    s += text(380, 344, 'Same reagent, same mechanism, same rate — two different alkenes, decided by which diastereomer went in.', { cls: 'fg-sm', size: 9.5 });
    s += text(380, 370, 'Only ONE conformation of each can react, so only one geometry is reachable from each.', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(380, 392, 'That is what stereospecific means, and the best evidence that E2 is one concerted step.', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'Why the geometric requirement has a visible consequence. Rotate each diastereomer until the bromine and the β-hydrogen are anti — that is the only conformation that can eliminate — then flatten the picture: the two groups that sat on the <i>right</i> of the Newman, front and back, finish on the same side of the new double bond, and so do the two on the left. Different starting diastereomer, different arrangement across that bond.',
  note: 'This is the experiment that rules out a stepwise alternative. If the C–H broke first, or the C–Br broke first, the intermediate could rotate and both diastereomers would give the same mixture. They do not, so nothing rotates between the two events — the three arrows really are simultaneous.',
});

export default FIGURES;
