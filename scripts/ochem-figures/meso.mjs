/* Figures for the meso notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

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
const chairRing = (pts, cls) => pts.map((p, i) => bond(p, pts[(i + 1) % 6], { rFrom: 0, rTo: 0, cls })).join('');
/* Axial: straight up on the even carbons, straight down on the odd ones. */
const axialEnd = (pts, i, L = 34) => P(pts[i].x, pts[i].y + (i % 2 === 0 ? -L : L));
/* Equatorial: outward, and tilted the other way from that carbon's axial. */
const equatorialEnd = (pts, i, L = 32) => P(pts[i].x + CHAIR_EQ[i].x * L, pts[i].y + CHAIR_EQ[i].y * L);

/* A stereocenter on a vertical chain, drawn the way this chapter's tartaric
   acid figure draws them: the chain runs up and down in the plane of the
   page, and the other two groups sit on a wedge and a hash at `deg` and
   180-deg. `left` is the group on the wedge. */
function chainCentre(c, deg, wedgeLabel, hashLabel) {
  const w = armEnd(c, deg, 46), h = armEnd(c, 180 - deg, 46);
  let g = wedge(c, w, { rFrom: 15, rTo: 15, width: 10 });
  g += hash(c, h, { rFrom: 15, rTo: 13, width: 13, rungs: 4 });
  g += atom(w.x, w.y, wedgeLabel, { r: 15, size: 10, kind: 'hi' });
  g += atom(h.x, h.y, hashLabel, { r: 13, size: 11 });
  g += atom(c.x, c.y, 'C', { r: 15 });
  return g;
}



/* ---------------------------------------------------------------- ch6.8 ---
   The bromine result, drawn. This is the fix for the one outright chemistry
   error a review found in the chapter, and the reason it survived is that
   the two cases were only ever written down in words. */
FIGURES.push({
  id: 'bromine-cis-trans-outcomes',
  section: 'meso',
  anchor: '<h3>Why meso compounds matter in reactions</h3>',
  alt: 'Two rows. cis-2-butene plus bromine, adding anti, gives 2,3-dibromobutane with the two bromines on wedges pointing opposite ways - the chiral (2S,3S) form, accompanied by an equal amount of (2R,3R). trans-2-butene plus bromine gives the mirror-symmetric arrangement, the achiral meso form.',
  viewBox: '0 0 760 560',
  build() {
    let s = '';
    const alkene = (cx, cy, trans) => {
      const c2 = P(cx - 24, cy), c3 = P(cx + 24, cy);
      const m1 = P(cx - 62, cy + 22), m2 = P(cx + 62, trans ? cy - 22 : cy + 22);
      const h1 = P(cx - 62, cy - 22), h2 = P(cx + 62, trans ? cy + 22 : cy - 22);
      let g = bond(c2, c3, { order: 2, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 4 });
      g += bond(c2, m1, { rFrom: 0, rTo: 17 }) + bond(c3, m2, { rFrom: 0, rTo: 17 });
      g += bond(c2, h1, { rFrom: 0, rTo: 11 }) + bond(c3, h2, { rFrom: 0, rTo: 11 });
      g += atom(m1.x, m1.y, 'CH₃', { r: 17, size: 10 });
      g += atom(m2.x, m2.y, 'CH₃', { r: 17, size: 10 });
      g += atom(h1.x, h1.y, 'H', { r: 11 });
      g += atom(h2.x, h2.y, 'H', { r: 11 });
      g += atom(c2.x, c2.y, '', { kind: 'point' });
      g += atom(c3.x, c3.y, '', { kind: 'point' });
      return g;
    };
    /* The product: CH3 on top, two stereocenters, CH3 underneath. `bottomDeg`
       is where the lower center's bromine points, and it is the only thing
       that differs between the two rows. */
    const product = (cx, cy, bottomDeg, topTag, botTag) => {
      const top = P(cx, cy - 38), bot = P(cx, cy + 38);
      let g = bond(P(cx, cy - 82), top, { rFrom: 17, rTo: 15 });
      g += bond(top, bot, { rFrom: 15, rTo: 15 });
      g += bond(bot, P(cx, cy + 82), { rFrom: 15, rTo: 17 });
      g += atom(cx, cy - 82, 'CH₃', { r: 17, size: 10 });
      g += atom(cx, cy + 82, 'CH₃', { r: 17, size: 10 });
      g += chainCentre(top, 155, 'Br', 'H');
      g += chainCentre(bot, bottomDeg, 'Br', 'H');
      g += text(cx + 22, cy - 34, topTag, { cls: 'fg-tag-good', size: 12, anchor: 'start' });
      g += text(cx + 22, cy + 42, botTag, { cls: 'fg-tag-good', size: 12, anchor: 'start' });
      return g;
    };

    // ---------------- row 1: cis ----------------
    s += tag(70, 40, 'CIS', { anchor: 'start' });
    s += alkene(140, 150, false);
    s += text(140, 232, 'cis-2-butene', { cls: 'fg-tag', size: 11 });
    s += arrow(P(236, 150), P(330, 150));
    s += text(283, 132, 'Br₂', { cls: 'fg-tag-good', size: 11 });
    s += text(283, 172, 'anti addition', { cls: 'fg-sm', size: 9.5 });
    s += product(420, 150, 25, 'S', 'S');
    s += text(420, 262, '(2S,3S) — and (2R,3R) in exactly equal amount', { cls: 'fg-tag-good', size: 10.5 });
    s += panel(536, 78, 200, 144, { kind: 'warn' });
    s += text(636, 112, 'RACEMIC', { cls: 'fg-tag-warn', size: 12 });
    s += text(636, 138, 'two chiral compounds,', { cls: 'fg-sm', size: 10 });
    s += text(636, 156, '50:50, so α = 0', { cls: 'fg-sm', size: 10 });
    s += text(636, 184, 'separable in principle', { cls: 'fg-sm', size: 10 });
    s += text(636, 202, 'by resolution', { cls: 'fg-sm', size: 10 });

    s += rule(24, 292, 736, 292);

    // ---------------- row 2: trans ----------------
    s += tag(70, 326, 'TRANS', { anchor: 'start' });
    s += alkene(140, 420, true);
    s += text(140, 502, 'trans-2-butene', { cls: 'fg-tag', size: 11 });
    s += arrow(P(236, 420), P(330, 420));
    s += text(283, 402, 'Br₂', { cls: 'fg-tag-good', size: 11 });
    s += text(283, 442, 'anti addition', { cls: 'fg-sm', size: 9.5 });
    s += product(420, 420, 205, 'S', 'R');
    s += text(420, 532, 'one compound, with a mirror plane across the middle', { cls: 'fg-tag-good', size: 10.5 });
    s += panel(536, 348, 200, 144, { kind: 'hi' });
    s += text(636, 382, 'MESO', { cls: 'fg-tag-good', size: 12 });
    s += text(636, 408, 'one achiral compound,', { cls: 'fg-sm', size: 10 });
    s += text(636, 426, 'so α = 0', { cls: 'fg-sm', size: 10 });
    s += text(636, 454, 'nothing to separate —', { cls: 'fg-sm', size: 10 });
    s += text(636, 472, 'it has no enantiomer', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Same reagent, same mechanism, same <b>anti</b> stereochemistry — and opposite answers, because the alkene geometry decides which face each methyl ends up on. The <i>cis</i> alkene gives the chiral pair; the <i>trans</i> alkene gives meso. Both flasks read zero on a polarimeter, and for completely different reasons: one holds two compounds that cancel, the other holds one compound that never rotated anything.',
  note: 'Check the drawn products rather than trusting the label. In the lower product the two halves reflect through a horizontal plane — Br on a wedge to the left at both centers, H hashed to the right at both — so it is superimposable on its mirror image and has to be meso, and the descriptors come out opposite, S above and R below. In the upper product the lower center is turned over, the descriptors match, and no plane exists.',
});

/* ---------------------------------------------------------------- ch6.9 ---
   The two chairs of cis-1,2-dimethylcyclohexane, which the section calls the
   most subtle idea in the chapter and then asks the reader to imagine. */
FIGURES.push({
  id: 'cis-dimethyl-two-chairs',
  section: 'meso',
  anchor: '<h3>Meso compounds in rings</h3>',
  alt: 'Two chair conformations of cis-1,2-dimethylcyclohexane. In the first, C1 carries an axial methyl pointing up and C2 an equatorial methyl; the ring flip gives the second, in which C1 is equatorial and C2 axial. Both methyls stay on the upper face in both chairs, and the two chairs are mirror images of each other.',
  viewBox: '0 0 760 340',
  build() {
    let s = '';
    const flipPts = (cx, cy, k) => CHAIR_V.map((v) => P(cx + v.x * k, cy - v.y * k));
    const axUpFlip = (pts, i, L) => P(pts[i].x, pts[i].y - L);
    const eqFlip = (pts, i, L) => P(pts[i].x + CHAIR_EQ[i].x * L, pts[i].y - CHAIR_EQ[i].y * L);

    const methyl = (from, to) => bond(from, to, { rFrom: 0, rTo: 17 }) + atom(to.x, to.y, 'CH₃', { r: 17, size: 10 });

    // left chair: axial-up methyl on carbon 2, equatorial methyl on carbon 1
    const A = chair(180, 150, 0.78);
    s += chairRing(A);
    for (const p of A) s += atom(p.x, p.y, '', { kind: 'point' });
    s += methyl(A[2], axialEnd(A, 2, 40));
    s += methyl(A[1], equatorialEnd(A, 1, 38));
    s += text(A[2].x - 20, A[2].y + 16, 'C2', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    s += text(A[1].x + 8, A[1].y + 22, 'C1', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(180, 244, 'C2 axial · C1 equatorial', { cls: 'fg-tag', size: 11 });

    // right chair: the ring flip. Same two carbons, faces unchanged.
    const B = flipPts(580, 150, 0.78);
    s += chairRing(B);
    for (const p of B) s += atom(p.x, p.y, '', { kind: 'point' });
    s += methyl(B[1], axUpFlip(B, 1, 40));
    s += methyl(B[2], eqFlip(B, 2, 38));
    s += text(B[2].x + 4, B[2].y - 14, 'C2', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(B[1].x + 10, B[1].y + 6, 'C1', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(580, 244, 'C1 axial · C2 equatorial', { cls: 'fg-tag', size: 11 });

    s += arrow(P(320, 140), P(440, 140));
    s += arrow(P(440, 162), P(320, 162));
    s += text(380, 120, 'ring flip', { cls: 'fg-tag-good', size: 11 });
    s += text(380, 186, 'about 100,000 times', { cls: 'fg-sm', size: 9.5 });
    s += text(380, 202, 'a second', { cls: 'fg-sm', size: 9.5 });

    s += tag(380, 36, 'BOTH METHYLS STAY ON THE UPPER FACE — THAT IS WHAT MAKES IT CIS');
    s += rule(24, 268, 736, 268);
    s += text(380, 294, 'Each chair on its own is chiral — neither has a mirror plane. But each is the MIRROR IMAGE of the other,', { cls: 'fg-sm', size: 10 });
    s += text(380, 314, 'and they trade places far faster than anything could tell them apart, so what you can bottle is achiral.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'The subtlest claim in the chapter, drawn. A ring flip cannot move a group from one face to the other — it only swaps axial for equatorial — so both methyls are still up after the flip and the compound is still <i>cis</i>. What has changed is that the two chairs are reflections of each other, and a molecule that spends half its life as each is achiral on any timescale you can observe.',
  note: 'This is why the rule is written as “chirality is assessed over all accessible conformations” rather than “look at the drawing”. Freeze either chair and you have a chiral object; let it flip, roughly 10<sup>5</sup> times a second at room temperature, and the time-averaged molecule has a mirror plane. The flat hexagon drawing, with both methyls on wedges, shows that plane directly.',
});

/* --------------------------------------------------------------- ch6.10 ---
   A meso compound as a Fischer projection, which both this section and the
   Fischer section point at and neither draws. */
FIGURES.push({
  id: 'meso-in-a-fischer-projection',
  section: 'meso',
  anchor: 'A Fischer projection makes this especially easy, because the plane is usually just a horizontal line across the middle of the drawing.</p>',
  alt: 'Two Fischer projections of tartaric acid side by side. In the meso form both OH groups are on the right and both H on the left, so a horizontal line through the middle reflects the top half onto the bottom. In the (2R,3R) form one OH is on the right and one on the left, and no such line exists.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const fischer = (cx, cy, rights) => {
      let g = '';
      const top = P(cx, cy - 86), bot = P(cx, cy + 86);
      g += bond(top, bot, { rFrom: 16, rTo: 16 });
      g += atom(top.x, top.y, 'COOH', { r: 24, size: 9.5 });
      g += atom(bot.x, bot.y, 'COOH', { r: 24, size: 9.5 });
      [-40, 40].forEach((dy, i) => {
        const c = P(cx, cy + dy);
        const right = rights[i];
        const oh = P(cx + (right ? 64 : -64), c.y);
        const h = P(cx + (right ? -64 : 64), c.y);
        g += bond(oh, h, { rFrom: 18, rTo: 13 });
        g += atom(oh.x, oh.y, 'OH', { r: 18, size: 10.5, kind: 'hi' });
        g += atom(h.x, h.y, 'H', { r: 13, size: 11 });
        g += atom(c.x, c.y, '', { kind: 'point' });
      });
      return g;
    };
    s += panel(24, 44, 340, 224, { kind: 'hi' });
    s += fischer(194, 152, [true, true]);
    s += `<line class="fg-dash-hi" x1="60" y1="152" x2="328" y2="152"></line>`;
    s += text(336, 144, 'mirror', { cls: 'fg-tag-good', size: 9.5, anchor: 'end' });
    s += text(194, 34, 'both OH on the same side', { cls: 'fg-tag', size: 11 });
    s += text(194, 292, 'MESO — the line reflects the top half onto the bottom', { cls: 'fg-tag-good', size: 10.5 });
    s += text(194, 312, 'one achiral compound, [α] = 0', { cls: 'fg-sm', size: 10 });

    s += panel(396, 44, 340, 224, { kind: 'warn' });
    s += fischer(566, 152, [true, false]);
    s += `<line class="fg-dash-hi" x1="432" y1="152" x2="700" y2="152"></line>`;
    s += text(708, 144, 'not a mirror', { cls: 'fg-tag-warn', size: 9.5, anchor: 'end' });
    s += text(566, 34, 'OH on opposite sides', { cls: 'fg-tag', size: 11 });
    s += text(566, 292, 'CHIRAL — reflecting sends OH onto H', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(566, 312, '(2R,3R), with (2S,3S) as its enantiomer', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'The fastest meso test there is, once you can read the notation. In a Fischer projection every horizontal bond points at you and every vertical bond away, so the two halves of a drawing like this really are in the same conformation as each other — which is exactly the condition under which an internal mirror plane shows up as a line on the page.',
  note: 'The left projection is <i>meso</i>-tartaric acid: reflect it through the dashed line and OH lands on OH, H on H, COOH on COOH. The right one is (2R,3R): the same reflection sends OH onto H, so it is not a symmetry of the molecule, and no other one exists. Fischer projections are covered properly in the next section; this is the one use of them worth borrowing early.',
});

export default FIGURES;
