/* Figures for the bonding notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- F8 ---
   A triple bond's two pi bonds, drawn perpendicular. The notes say "a
   triple bond is not three of the same thing" and the acetonitrile figure
   labels "1 sigma + 2 pi" without drawing the second overlap, which is
   exactly the thing a reader cannot picture. */
FIGURES.push({
  id: 'triple-bond-two-pi',
  section: 'bonding',
  anchor: '<h3>Bond length and strength</h3>',
  viewBox: '0 0 760 280',
  alt: 'A carbon-carbon triple bond drawn in three panels: the sigma bond along the axis, the first pi bond from p orbitals above and below the axis, and the second pi bond from p orbitals in front of and behind it, perpendicular to the first.',
  build() {
    let s = '';
    const lobe = (cx, cy, rx, ry, cls) =>
      `<ellipse class="${cls}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill-opacity="0.18"></ellipse>`;
    const panels = [
      { x: 14,  title: 'the σ bond', sub: 'head-on, along the axis' },
      { x: 262, title: 'the first π', sub: 'p orbitals above and below' },
      { x: 510, title: 'the second π', sub: 'p orbitals in front and behind' },
    ];
    panels.forEach((p, i) => {
      s += panel(p.x, 16, 236, 200);
      const cx = p.x + 118;
      s += text(cx, 40, p.title, { cls: 'fg-lbl', size: 12.5 });
      const A = P(cx - 44, 124), B = P(cx + 44, 124);
      if (i === 0) {
        s += lobe(cx, 124, 46, 18, 'fg-orb');
        s += bond(A, B);
      } else if (i === 1) {
        s += lobe(cx, 96, 44, 20, 'fg-orb');
        s += lobe(cx, 152, 44, 20, 'fg-orb');
        s += bond(A, B, { cls: 'fg-bond-soft' });
      } else {
        // perpendicular: drawn as two lobes offset on the other diagonal, so
        // the reader sees a different pair of lobes in a different place.
        s += lobe(cx - 24, 100, 28, 24, 'fg-orb');
        s += lobe(cx + 24, 148, 28, 24, 'fg-orb');
        s += text(cx - 76, 96, 'front', { cls: 'fg-sm', size: 9.5 });
        s += text(cx + 76, 152, 'behind', { cls: 'fg-sm', size: 9.5 });
        s += bond(A, B, { cls: 'fg-bond-soft' });
      }
      s += atom(A.x, A.y, 'C'); s += atom(B.x, B.y, 'C');
      s += text(cx, 190, p.sub, { cls: 'fg-sm', size: 10.5 });
    });
    s += rule(14, 234, 746, 234);
    s += text(380, 254, 'Three bonds, three different overlaps.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 274, 'Only the sigma holds the carbons end-on, and the two pi bonds sit at right angles.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'A triple bond taken apart. One sigma, made head-on along the axis, plus two pi bonds made sideways from two perpendicular pairs of p orbitals. Drawing them separately is the point: a triple bond is not three copies of the same thing, and the increments in the strength table (64 kcal/mol for the first pi, 53 for the second) are measuring three different overlaps.',
  note: 'The right angle between the two pi bonds is forced. Each sp carbon has exactly two leftover p orbitals, and those two are perpendicular to each other and to the bond axis — so the second pi bond has nowhere else to go. It also explains why nothing can rotate: turning one carbon would break both pi bonds at once.',
});

/* --------------------------------------------------------------- F11 ---
   Where cis/trans comes from, drawn. The section makes the claim in prose
   and points forward; a reader who has not met alkene naming still needs to
   see that the two drawings are different substances. */
FIGURES.push({
  id: 'locked-rotation-cis-trans',
  section: 'bonding',
  anchor: '<h3>Bond strength is not the same as reactivity</h3>',
  viewBox: '0 0 760 250',
  alt: 'The two forms of 2-butene drawn side by side as condensed structures: cis, with both methyl groups on the same side of the locked double bond, and trans, with one on each side. A note says the single bond of butane by contrast rotates freely, so it has no such pair.',
  build() {
    let s = '';
    const alkene = (cx, cy, sameSide) => {
      const A = P(cx - 40, cy), B = P(cx + 40, cy);
      let g = bond(A, B, { order: 2, rFrom: 15, rTo: 15 });
      const m1 = P(cx - 84, cy - 42);
      const m2 = sameSide ? P(cx + 84, cy - 42) : P(cx + 84, cy + 42);
      const h1 = P(cx - 84, cy + 42);
      const h2 = sameSide ? P(cx + 84, cy + 42) : P(cx + 84, cy - 42);
      g += bond(A, m1, { rFrom: 15, rTo: 20 }) + atom(m1.x, m1.y, 'CH₃', { kind: 'hi', r: 20 });
      g += bond(B, m2, { rFrom: 15, rTo: 20 }) + atom(m2.x, m2.y, 'CH₃', { kind: 'hi', r: 20 });
      g += bond(A, h1, { rFrom: 15, rTo: 12 }) + atom(h1.x, h1.y, 'H', { r: 12 });
      g += bond(B, h2, { rFrom: 15, rTo: 12 }) + atom(h2.x, h2.y, 'H', { r: 12 });
      g += atom(A.x, A.y, 'C') + atom(B.x, B.y, 'C');
      return g;
    };
    s += panel(14, 16, 352, 176);
    s += text(190, 40, 'cis-2-butene', { cls: 'fg-lbl', size: 12.5 });
    s += alkene(190, 112, true);
    s += text(190, 182, 'both methyls on the same side', { cls: 'fg-tag-good', size: 11 });

    s += panel(394, 16, 352, 176);
    s += text(570, 40, 'trans-2-butene', { cls: 'fg-lbl', size: 12.5 });
    s += alkene(570, 112, false);
    s += text(570, 182, 'one methyl on each side', { cls: 'fg-tag-good', size: 11 });

    s += rule(14, 208, 746, 208);
    s += text(380, 228, 'Two different substances, not two drawings of one.', { cls: 'fg-lbl', size: 11.5 });
    s += text(380, 248, 'They have different boiling points and different dipoles. Butane, on a single bond, spins freely and has no such pair.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'What a locked double bond buys. Because the pi bond stops the two carbons twisting past each other, the methyl groups cannot swap sides, and the two arrangements are separate compounds that can be bottled apart. Put the same four carbons on a single bond, as in butane, and the two ends spin freely millions of times a second — there is nothing to separate.',
  note: 'This is the first place in the course where a drawing carries information that a formula does not: both structures here are C₄H₈, and both are “CH₃CH=CHCH₃” written out. The Cis/trans and E/Z section of <a class="chapter-ref" href="/ochem/learn.html#m-stereochemistry">Stereochemistry</a> gives the pair their systematic names and the rule for when cis/trans applies at all.',
});

export default FIGURES;
