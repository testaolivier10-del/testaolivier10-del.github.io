/* Figures for the axial-equatorial notes page (and its lesson). Built by
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

const FIGURES = [];

/* ---------------------------------------------------------------- ch5.4 ---
   cis/trans on a ring, and the up-is-not-axial confusion, in one picture. */
FIGURES.push({
  id: 'cis-trans-on-rings',
  section: 'axial-equatorial',
  anchor: '<p class="step-body">That is a statement about the molecule, not about the drawing or the conformation. Getting from one face to the other would mean breaking a bond and remaking it, so cis stays cis for the life of the compound — which is why a cis and a trans ring are two different substances that can be bottled separately, while two chairs of the same compound cannot. (The general machinery for describing arrangements in space, and the rest of the names, belongs to <a class="chapter-ref" href="/ochem/learn.html#m-stereochemistry">Stereochemistry</a>; the up/down reading is all this chapter needs.)</p>',
  alt: 'Flat hexagons showing cis and trans 1,2-dimethylcyclohexane with wedge and hash bonds, and a chair of the cis isomer in which one up methyl is axial and the other up methyl is equatorial',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const hex = (cx, cy, r) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = (90 - i * 60) * Math.PI / 180;
        v.push(P(cx + r * Math.cos(a), cy - r * Math.sin(a)));
      }
      return v;
    };
    const drawHex = (cx, cy, kind) => {
      const v = hex(cx, cy, 46);
      let g = v.map((p, i) => bond(p, v[(i + 1) % 6], { rFrom: 0, rTo: 0 })).join('');
      for (const p of v) g += atom(p.x, p.y, '', { kind: 'point' });
      const t1 = P(v[0].x, v[0].y - 32);
      const t2 = P(v[1].x + 28, v[1].y - 16);
      g += wedge(v[0], t1, { rFrom: 0, rTo: 16 });
      g += (kind === 'cis' ? wedge : hash)(v[1], t2, { rFrom: 0, rTo: 16 });
      g += atom(t1.x, t1.y, 'CH₃', { r: 16, size: 9.5 });
      g += atom(t2.x, t2.y, 'CH₃', { r: 16, size: 9.5 });
      g += text(v[0].x - 22, v[0].y + 2, 'C1', { cls: 'fg-sm', size: 9 });
      g += text(v[1].x + 4, v[1].y + 20, 'C2', { cls: 'fg-sm', size: 9 });
      return g;
    };
    s += tag(240, 32, 'THE FLAT DRAWING SAYS WHICH FACE');
    s += drawHex(118, 152, 'trans');
    s += text(118, 238, 'trans — one wedge, one hash', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(118, 256, 'opposite faces: one up, one down', { cls: 'fg-sm', size: 9.5 });
    s += drawHex(330, 152, 'cis');
    s += text(330, 238, 'cis — two wedges', { cls: 'fg-tag-good', size: 10.5 });
    s += text(330, 256, 'same face: both up', { cls: 'fg-sm', size: 9.5 });
    s += text(244, 300, 'A face cannot change without breaking a bond, so this label is permanent.', { cls: 'fg-sm', size: 10 });
    s += rule(472, 54, 472, 300);

    s += tag(618, 32, 'THE CHAIR SAYS AXIAL OR EQUATORIAL');
    const pts = chair(600, 160, 0.72);
    s += chairRing(pts);
    for (const p of pts) s += atom(p.x, p.y, '', { kind: 'point' });
    // C1 = the carbon whose axial points DOWN, so its up bond is equatorial;
    // C2 = its neighbor, whose axial points UP. Both groups end up on the
    // same face, which is what makes the drawing cis.
    const eqUp = equatorialEnd(pts, 1, 34);
    s += bond(pts[1], eqUp, { rFrom: 0, rTo: 16 });
    s += atom(eqUp.x, eqUp.y, 'CH₃', { r: 16, size: 9 });
    const axUp = axialEnd(pts, 2, 36);
    s += bond(pts[2], axUp, { rFrom: 0, rTo: 16 });
    s += atom(axUp.x, axUp.y, 'CH₃', { r: 16, size: 9 });
    s += text(pts[1].x + 6, pts[1].y + 20, 'C1', { cls: 'fg-sm', size: 9 });
    s += text(pts[2].x + 20, pts[2].y + 14, 'C2', { cls: 'fg-sm', size: 9 });
    s += text(618, 250, 'the same cis compound, in one chair', { cls: 'fg-sm', size: 10 });
    s += text(618, 270, 'C1: up and EQUATORIAL', { cls: 'fg-tag', size: 10.5 });
    s += text(618, 286, 'C2: up and AXIAL', { cls: 'fg-tag', size: 10.5 });
    s += text(618, 308, 'both still up, so still cis', { cls: 'fg-tag-good', size: 10.5 });
    return s;
  },
  caption: 'Two different questions about the same two methyl groups. <b>Cis or trans</b> is answered by the flat drawing and is a fact about the compound: same face or opposite faces, fixed for good. <b>Axial or equatorial</b> is answered only by a chair and is a fact about the conformation, which reverses on every flip.',
  note: 'The chair on the right is the whole of the "up is not axial" trap in one picture. Both methyls are up — that is what makes the compound cis — and one of them is axial while the other is equatorial. Flip that ring and the two labels swap over; both groups are still up, and the compound is still cis.',
});

export default FIGURES;
