/* Figures for the carbocations notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* polyPts and polyRing come from lib/ochem-skeletal.mjs. */

FIGURES.push({
  id: 'carbocation-anatomy',
  section: 'carbocations',
  anchor: 'one lobe above it and one below.</p>',
  alt: 'A tetrahedral sp3 carbon bearing a bromine flattens, as bromide leaves, into a trigonal planar sp2 carbocation drawn twice: seen from above with three bonds 120 degrees apart, and seen edge-on with an empty p orbital lobe above the plane and another below it',
  viewBox: '0 0 760 374',
  build() {
    let s = '';
    s += tag(180, 34, 'MAKING A CARBOCATION FLATTENS THE CARBON');

    /* ---- left: the sp3 parent ---- */
    const a = P(116, 158);
    s += bond(a, armEnd(a, 160, 46), { rTo: 0 });
    s += bond(a, armEnd(a, 20, 46), { rTo: 0 });
    s += wedge(a, armEnd(a, 270, 46), { rTo: 0, width: 9 });
    s += hash(a, armEnd(a, 90, 50), { rTo: 15, width: 11, rungs: 4 });
    s += atom(a.x, a.y, 'C');
    s += atom(a.x, a.y - 50, 'Br', { kind: 'warn', size: 10.5 });
    for (const p of [armEnd(a, 160, 46), armEnd(a, 20, 46), armEnd(a, 270, 46)]) s += atom(p.x, p.y, '', { kind: 'point' });
    s += text(116, 256, 'sp³ · four bonds', { cls: 'fg-sm', size: 10 });
    s += text(116, 274, 'tetrahedral, 109.5°', { cls: 'fg-sm', size: 10 });

    s += arrow(P(192, 158), P(248, 158), { muted: true });
    s += text(220, 142, '− Br⁻', { cls: 'fg-sm', size: 10 });

    /* ---- middle: the cation from above ---- */
    const b = P(348, 166);
    for (const deg of [90, 210, 330]) {
      s += bond(b, armEnd(b, deg, 48), { rTo: 0 });
      const e = armEnd(b, deg, 48);
      s += atom(e.x, e.y, '', { kind: 'point' });
    }
    s += atom(b.x, b.y, 'C', { kind: 'warn' });
    s += text(b.x + 26, b.y - 16, '+', { cls: 'fg-tag-warn', size: 17 });
    s += text(348, 216, '120°', { cls: 'fg-hi', size: 11 });
    s += text(348, 256, 'sp² · three bonds', { cls: 'fg-sm', size: 10 });
    s += text(348, 274, 'trigonal planar, from above', { cls: 'fg-sm', size: 10 });

    s += rule(452, 56, 452, 290);

    /* ---- right: the same cation edge-on, with the empty p orbital ---- */
    const c = P(604, 166);
    s += lobeE(c.x, c.y - 44, 20, 34);
    s += lobeE(c.x, c.y + 44, 20, 34);
    s += bond(c, P(c.x - 58, c.y), { rTo: 0 });
    s += bond(c, P(c.x + 58, c.y), { rTo: 0 });
    s += atom(c.x - 58, c.y, '', { kind: 'point' });
    s += atom(c.x + 58, c.y, '', { kind: 'point' });
    s += atom(c.x, c.y, 'C', { kind: 'warn' });
    s += text(c.x + 24, c.y + 30, '+', { cls: 'fg-tag-warn', size: 17 });
    s += `<line class="fg-dash" x1="510" y1="166" x2="700" y2="166"></line>`;
    s += text(700, 152, 'the plane', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    s += text(604, 84, 'EMPTY p ORBITAL', { cls: 'fg-tag', size: 11 });
    s += text(604, 256, 'the third group points at you', { cls: 'fg-sm', size: 10 });
    s += text(604, 274, 'nothing sits above or below', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(50, 302, 710, 302);
    s += text(380, 330, 'Formal charge on that carbon:  4 valence − (0 lone-pair electrons + 3 bonds)  =  +1', { cls: 'fg-lbl', size: 11.5 });
    s += text(380, 354, 'Six electrons, and a pair of dots there would make it a carbanion instead.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'What the words <b>sp², trigonal planar, empty p orbital</b> actually look like. Losing the leaving group takes a bonding pair away from a tetrahedral carbon, and the three groups that remain flatten out into a plane — which leaves the fourth orbital unhybridized, unoccupied, and standing at right angles to them with a lobe on each side.',
  note: 'The edge-on view is the one that matters later. There is nothing above the plane and nothing below it, so the two faces of the cation are indistinguishable — which is why a carbon that was a stereocenter before it ionized has no handedness left at all once it has.',
});

FIGURES.push({
  id: 'hyperconjugation-overlap',
  section: 'carbocations',
  anchor: 'which is why a quaternary neighbor helps too.</p>',
  alt: 'On the left, a carbon-hydrogen bond on the carbon next to a carbocation is drawn parallel to the empty p orbital, with the region between them marked as sigma to p overlap. On the right, a bar chart counts the aligned carbon-hydrogen bonds available to the methyl, ethyl, isopropyl and tert-butyl cations: zero, three, six and nine.',
  viewBox: '0 0 760 366',
  build() {
    let s = '';
    s += tag(196, 34, 'ONE ALIGNED BOND, LENDING ITS PAIR');

    /* ---- left: the overlap itself ---- */
    const cp = P(300, 190);       // the cationic carbon
    const cn = P(196, 190);       // its neighbor
    s += lobeE(cp.x, cp.y - 40, 19, 32);
    s += lobeE(cp.x, cp.y + 40, 19, 32);
    s += lobeE(cn.x, cn.y - 32, 15, 28, 'fg-orb-alt');
    s += `<ellipse class="fg-orb-node" cx="248" cy="150" rx="60" ry="42"></ellipse>`;
    s += bond(cn, cp, {});
    s += bond(cn, P(cn.x, cn.y - 58), { rTo: 13 });
    s += bond(cn, P(cn.x - 46, cn.y + 30), { rTo: 0 });
    s += atom(cn.x - 46, cn.y + 30, '', { kind: 'point' });
    s += atom(cn.x, cn.y - 58, 'H', { r: 13, size: 11 });
    s += atom(cn.x, cn.y, 'C');
    s += atom(cp.x, cp.y, 'C', { kind: 'warn' });
    s += text(cp.x + 24, cp.y + 26, '+', { cls: 'fg-tag-warn', size: 17 });
    s += text(248, 100, 'σ → p overlap', { cls: 'fg-tag', size: 11 });
    s += text(248, 272, 'the pair is shared between two places at once', { cls: 'fg-sm', size: 10 });
    s += text(248, 292, 'so the charge is less concentrated', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(396, 56, 396, 300);

    /* ---- right: how many such bonds each cation has ---- */
    s += tag(578, 34, 'HOW MANY ARE ON OFFER');
    const ROWS = [
      ['methyl   CH₃⁺', 0],
      ['1°   CH₃CH₂⁺', 3],
      ['2°   (CH₃)₂CH⁺', 6],
      ['3°   (CH₃)₃C⁺', 9],
    ];
    ROWS.forEach(([name, n], i) => {
      const y = 92 + i * 52;
      s += text(428, y + 4, name, { cls: 'fg-lbl', size: 11.5, anchor: 'start' });
      if (n === 0) s += text(576, y + 4, 'none', { cls: 'fg-sm', size: 10, anchor: 'start' });
      else s += bar(570, y - 9, n * 13, 16, { kind: 'hi' });
      s += text(706, y + 4, String(n), { cls: n === 0 ? 'fg-tag-warn' : 'fg-tag-good', size: 12, anchor: 'end' });
    });
    s += text(578, 298, 'each bar is one aligned C–H bond', { cls: 'fg-sm', size: 10 });

    s += rule(50, 320, 710, 320);
    s += text(380, 348, 'More alkyl groups means more bonds able to donate — that is all the ordering is.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'Hyperconjugation, drawn rather than named. A C&ndash;H bond on the neighboring carbon that happens to lie parallel to the empty p orbital can let its electron pair spill partway in &mdash; not a new bond, just a pair with two places to be. C&ndash;C bonds do the same, which is why a neighbor with no hydrogens on it still helps.',
  note: 'The count on the right is the whole ordering in one column. It also warns you off the commonest misreading: what is being counted is bonds on the carbons <i>attached to the charge</i>, not carbons anywhere in the molecule. A large primary cation has three of these and is still a primary cation.',
});

FIGURES.push({
  id: 'cation-stability-ladder',
  section: 'carbocations',
  anchor: 'The million-fold figure is best taken as "tertiary goes and methyl does not" with a scale bar on it.</p>',
  alt: 'An energy ladder of carbocations, least stable at the top: vinyl and aryl, then methyl, then primary alkyl, then secondary alkyl alongside primary allylic, then tertiary alkyl alongside primary benzylic, and at the bottom a cation with an oxygen or nitrogen on the charged carbon.',
  viewBox: '0 0 760 408',
  build() {
    let s = '';
    s += tag(380, 34, 'THE LADDER, READ BY WHAT SITS ON THE CHARGED CARBON');
    s += arrow(P(60, 330), P(60, 52), { muted: true });
    s += text(72, 50, 'less stable', { cls: 'fg-tag-warn', size: 10.5, anchor: 'start' });
    s += text(72, 330, 'more stable', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });

    const RUNGS = [
      [66, 'vinyl  ·  aryl', 'no overlap is possible', 'fg-bond-soft', 'fg-tag-warn'],
      [114, 'methyl', 'nothing to donate', 'fg-bond-soft', 'fg-tag-warn'],
      [162, '1° alkyl', '3 aligned C–H bonds', 'fg-bond', 'fg-sm'],
      [210, '2° alkyl   ≈   1° allylic', '6 C–H, or two carbons share it', 'fg-bond', 'fg-sm'],
      [258, '3° alkyl   ≈   1° benzylic', '9 C–H, or four carbons share it', 'fg-bond-hi', 'fg-tag-good'],
      [306, 'O or N on the charged carbon', 'a full octet everywhere', 'fg-bond-hi', 'fg-tag-good'],
    ];
    for (const [y, name, note, bcls, ncls] of RUNGS) {
      s += bond(P(104, y), P(240, y), { rFrom: 0, rTo: 0, cls: bcls });
      s += text(252, y + 4, name, { cls: 'fg-lbl', size: 11.5, anchor: 'start' });
      s += text(704, y + 4, note, { cls: ncls, size: 10.5, anchor: 'end' });
    }
    s += `<line class="fg-dash-hi" x1="86" y1="114" x2="86" y2="258"></line>`;
    s += text(94, 190, '10⁶', { cls: 'fg-hi', size: 11, anchor: 'start' });

    s += rule(50, 340, 710, 340);
    s += text(380, 366, 'The dashed span is the standard solvolysis comparison: about a millionfold, methyl to 3°.', { cls: 'fg-sm', size: 10 });
    s += text(380, 384, 'And methyl and primary do not really ionize at all, which is what that number is saying.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Six rungs and two rules. Going down the alkyl series, each extra group adds three more bonds that can donate into the empty orbital. Going below that series, <b>resonance</b> takes over and does something hyperconjugation cannot: it moves the charge onto other atoms outright, which is why a formally primary benzylic cation sits on the same rung as a tertiary alkyl one.',
  note: 'The top two rungs are the ones worth learning as exclusions rather than as a ranking. A vinyl or aryl cation is not merely poor; it does not form, so a mechanism that needs one is the wrong mechanism. Everything from the third rung down is a real intermediate that a real reaction passes through.',
});

FIGURES.push({
  id: 'resonance-beats-substitution',
  section: 'carbocations',
  anchor: 'Seeing a heteroatom beside a would-be cation should change your answer.</p>',
  alt: 'Three stabilized cations side by side: an allylic cation with a half positive charge on each end carbon, a benzylic cation with a quarter of the charge on the exocyclic carbon and on three ring carbons, and a methoxymethyl cation redrawn with a curved arrow from an oxygen lone pair giving a carbon-oxygen double bond and the positive charge on oxygen.',
  viewBox: '0 0 760 380',
  build() {
    let s = '';
    /* A partial bond: a dashed line running parallel to a drawn sigma bond. */
    const par = (a, b, off) => {
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
      const px = (-dy / L) * off, py = (dx / L) * off;
      return bond(P(a.x + px, a.y + py), P(b.x + px, b.y + py), { rFrom: 10, rTo: 10, cls: 'fg-dash-hi' });
    };

    /* ---- 1. allylic ---- */
    s += tag(140, 40, 'ALLYLIC');
    const a1 = P(86, 168), a2 = P(140, 138), a3 = P(194, 168);
    s += bond(a1, a2, { rFrom: 0, rTo: 0 });
    s += bond(a2, a3, { rFrom: 0, rTo: 0 });
    s += par(a1, a2, -9);
    s += par(a2, a3, -9);
    for (const p of [a1, a2, a3]) s += atom(p.x, p.y, '', { kind: 'point' });
    s += text(a1.x - 16, a1.y + 4, '½+', { cls: 'fg-warn', size: 12, anchor: 'end' });
    s += text(a3.x + 16, a3.y + 4, '½+', { cls: 'fg-warn', size: 12, anchor: 'start' });
    s += text(140, 252, 'two carbons share it', { cls: 'fg-sm', size: 10 });
    s += text(140, 272, 'a 1° allylic ≈ a 2° alkyl', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(248, 56, 248, 296);

    /* ---- 2. benzylic ---- */
    s += tag(392, 40, 'BENZYLIC');
    const R = polyPts(378, 168, 6, 42, 90);   // vertices at 90,150,210,270,330,30
    const ctr = P(378, 168);
    s += polyRing(R, 'fg-bond');
    /* The hybrid, not a Kekule structure: the ring pi system is drawn as one
       dashed circle, so no ring bond is asserted to be double or single and
       the ipso carbon is not given a fourth sigma bond. */
    s += `<circle class="fg-dash-hi" cx="${ctr.x}" cy="${ctr.y}" r="24"></circle>`;
    const exo = P(R[5].x + 40, R[5].y - 24);
    s += bond(R[5], exo, { rFrom: 0, rTo: 0 });
    s += par(R[5], exo, -9);
    for (const p of [...R, exo]) s += atom(p.x, p.y, '', { kind: 'point' });
    s += text(exo.x + 14, exo.y - 2, '¼+', { cls: 'fg-warn', size: 11, anchor: 'start' });
    s += text(R[0].x, R[0].y - 14, '¼+', { cls: 'fg-warn', size: 11 });
    s += text(R[4].x + 6, R[4].y + 24, '¼+', { cls: 'fg-warn', size: 11 });
    s += text(R[2].x - 16, R[2].y - 4, '¼+', { cls: 'fg-warn', size: 11, anchor: 'end' });
    s += text(392, 252, 'four carbons share it', { cls: 'fg-sm', size: 10 });
    s += text(392, 272, 'a 1° benzylic ≈ a 3° alkyl', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(512, 56, 512, 296);

    /* ---- 3. the heteroatom case, drawn as two structures ---- */
    s += tag(636, 40, 'OXYGEN NEXT DOOR');
    const m1 = P(556, 122), o1 = P(618, 122), k1 = P(682, 122);
    s += bond(m1, o1, { rFrom: 18, rTo: 15 });
    s += bond(o1, k1, { rFrom: 15, rTo: 18 });
    s += atom(m1.x, m1.y, 'CH₃', { r: 18, size: 10 });
    s += atom(o1.x, o1.y, 'O', {});
    s += atom(k1.x, k1.y, 'CH₂', { r: 18, size: 10, kind: 'warn' });
    s += text(k1.x + 22, k1.y - 14, '+', { cls: 'fg-tag-warn', size: 15 });
    for (const ang of [90, 270]) s += lonePair(o1.x, o1.y, ang, { dist: 22 });
    s += curve(P(o1.x + 6, o1.y + 22), P(k1.x - 6, k1.y + 16), { bow: 18, size: 7 });
    s += arrow(P(618, 172), P(618, 200), { muted: true });
    const m2 = P(556, 228), o2 = P(618, 228), k2 = P(682, 228);
    s += bond(m2, o2, { rFrom: 18, rTo: 15 });
    s += bond(o2, k2, { rFrom: 15, rTo: 18, order: 2 });
    s += atom(m2.x, m2.y, 'CH₃', { r: 18, size: 10 });
    s += atom(o2.x, o2.y, 'O', { kind: 'warn' });
    s += atom(k2.x, k2.y, 'CH₂', { r: 18, size: 10 });
    s += text(o2.x + 20, o2.y - 14, '+', { cls: 'fg-tag-warn', size: 15 });
    s += lonePair(o2.x, o2.y, 250, { dist: 22 });
    s += text(636, 272, 'an oxocarbenium ion', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(50, 314, 710, 314);
    s += text(380, 340, 'Hyperconjugation lends the charge out; resonance hands it over.', { cls: 'fg-lbl', size: 11.5 });
    s += text(380, 364, 'So an adjacent π system or heteroatom outranks any amount of alkyl substitution.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Three cations that beat the alkyl series, and the reason is the same each time: the charge stops being on one atom. The allylic and benzylic hybrids are drawn with dashed partial bonds and fractional charges, which is what "delocalized" means in a picture. The oxygen case is drawn as two structures because the second one is the point &mdash; <b>every atom in it has an octet</b>.',
  note: 'The oxygen pays for the privilege: a positively charged oxygen is not a comfortable thing. It is still the better structure, because a complete octet on every atom beats six electrons on a carbon by more than an electronegative atom minds carrying a charge. The nitrogen version, an iminium ion, is better still for exactly the same reason and one step further along it.',
});

FIGURES.push({
  id: 'vinyl-aryl-orthogonal',
  section: 'carbocations',
  anchor: 'it is why aromatic rings are substituted by an entirely different chemistry in <a class="chapter-ref" href="/ochem/learn.html#m-aromatic-chemistry">Aromatic Chemistry</a>.</p>',
  alt: 'Two cations that cannot form. On the left a vinyl cation, whose empty p orbital is drawn end-on as a circle at right angles to the pi cloud of the neighboring double bond. On the right a benzene ring drawn edge-on with its pi cloud above and below the plane, and the empty sp2 orbital of the ring carbon pointing sideways within the plane.',
  viewBox: '0 0 760 356',
  build() {
    let s = '';

    /* ---- left: the vinyl cation ---- */
    s += tag(178, 40, 'VINYL CATION');
    const v1 = P(112, 176), v2 = P(216, 176), vr = P(312, 176);
    s += lobeE((v1.x + v2.x) / 2, 142, 46, 17);
    s += lobeE((v1.x + v2.x) / 2, 210, 46, 17);
    s += bond(v1, v2, { order: 2, gap: 5 });
    s += bond(v2, vr, { rTo: 18 });
    s += atom(vr.x, vr.y, 'CH₃', { r: 18, size: 10 });
    s += bond(v1, P(v1.x - 44, v1.y - 26), { rTo: 13 });
    s += bond(v1, P(v1.x - 44, v1.y + 26), { rTo: 13 });
    s += atom(v1.x - 44, v1.y - 26, 'H', { r: 13, size: 11 });
    s += atom(v1.x - 44, v1.y + 26, 'H', { r: 13, size: 11 });
    s += atom(v1.x, v1.y, 'C');
    s += `<circle class="fg-orb-alt" cx="216" cy="176" r="28" fill-opacity="0.18"></circle>`;
    s += atom(v2.x, v2.y, 'C', { kind: 'warn' });
    s += text(v2.x + 24, v2.y + 30, '+', { cls: 'fg-tag-warn', size: 16 });
    s += text(178, 106, 'π cloud — above and below', { cls: 'fg-tag', size: 11 });
    s += text(216, 252, 'empty p orbital, seen end-on:', { cls: 'fg-sm', size: 10 });
    s += text(216, 270, 'it points at you, so it misses the π', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(178, 296, 'and the charge sits on a linear sp carbon', { cls: 'fg-sm', size: 10 });

    s += rule(376, 56, 376, 312);

    /* ---- right: the aryl cation, edge-on ---- */
    s += tag(560, 40, 'ARYL CATION — THE RING SEEN EDGE-ON');
    s += lobeE(556, 142, 76, 19);
    s += lobeE(556, 210, 76, 19);
    s += bond(P(486, 176), P(626, 176), { rFrom: 0, rTo: 0, cls: 'fg-bond' });
    s += atom(486, 176, '', { kind: 'point' });
    s += lobeE(700, 176, 26, 15, 'fg-orb-alt');
    s += atom(650, 176, 'C', { kind: 'warn' });
    s += text(650, 148, '+', { cls: 'fg-tag-warn', size: 16 });
    s += `<path class="fg-dash" d="M676 152 L690 152 L690 166"></path>`;
    s += text(676, 132, '90°', { cls: 'fg-hi', size: 11 });
    s += text(556, 106, 'π cloud — above and below', { cls: 'fg-tag', size: 11 });
    s += text(560, 252, 'the empty orbital is an sp² hybrid', { cls: 'fg-sm', size: 10 });
    s += text(560, 270, 'lying IN the ring plane', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(560, 296, 'so the six π electrons never reach it', { cls: 'fg-sm', size: 10 });

    s += rule(50, 328, 710, 328);
    s += text(380, 350, 'Both failures are about direction, not about how much delocalization is nearby.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'Why the two most promising-looking neighbors are useless. Overlap needs orbitals that point the same way, and in both of these the empty orbital is at right angles to the &pi; system beside it. A benzene ring is the most delocalized thing in the course and it can do nothing for a positive charge on one of its own carbons.',
  note: 'Watch the hybridization too, because it changes between the two. The vinyl cation relaxes to <b>sp</b> and linear, putting the charge on the carbon with the most s character in the course. The aryl cation cannot relax at all: the ring holds it at <b>sp²</b>, with the empty hybrid aimed outward. Different geometries, the same verdict — vinyl and aryl halides do not ionize.',
});

FIGURES.push({
  id: 'one-two-shifts-drawn',
  section: 'carbocations',
  anchor: 'bond and the head on the cationic carbon, and the charge takes care of itself.</p>',
  alt: 'Two rearrangements drawn with their arrows. In the first, a hydride on the neighboring carbon of the isobutyl cation migrates with its bonding pair to give the tert-butyl cation. In the second, a methyl group on the quaternary carbon of the neopentyl cation migrates the same way to give the 2-methylbutan-2-yl cation.',
  viewBox: '0 0 760 456',
  build() {
    let s = '';

    const row = (y0, isH) => {
      let g = '';
      g += tag(40, y0 - 98, isH ? '1,2-HYDRIDE SHIFT' : '1,2-METHYL SHIFT', { anchor: 'start' });

      /* the primary cation, with the group that is about to move drawn on top */
      const c2 = P(170, y0);
      const c1 = armEnd(c2, 180, 54);
      const mig = armEnd(c2, 90, 50);
      for (const deg of [300, 240]) {
        const e = armEnd(c2, deg, 50);
        g += bond(c2, e, { rFrom: 15, rTo: 0 });
        g += atom(e.x, e.y, '', { kind: 'point' });
      }
      g += bond(c2, c1, { rFrom: 15, rTo: 0 });
      g += atom(c1.x, c1.y, '', { kind: 'point' });
      g += bond(c2, mig, { rFrom: 15, rTo: isH ? 13 : 17, cls: 'fg-bond-hi' });
      g += atom(c2.x, c2.y, 'C');
      g += atom(mig.x, mig.y, isH ? 'H' : 'CH₃', { kind: 'hi', r: isH ? 13 : 17, size: isH ? 11 : 10 });
      g += text(c1.x, y0 - 24, '+', { cls: 'fg-tag-warn', size: 17 });
      g += text(c1.x, y0 + 36, '1°', { cls: 'fg-tag-warn', size: 11 });
      g += curve(P(c2.x - 12, y0 - 30), P(c1.x + 12, y0 - 14), { bow: -18, size: 7 });
      g += text(160, y0 + 76, isH ? 'the arrow starts on the C–H bond' : 'the arrow starts on the C–CH₃ bond', { cls: 'fg-sm', size: 10 });

      g += arrow(P(272, y0), P(328, y0), { muted: true });

      /* the tertiary cation it becomes */
      const p2 = P(410, y0);
      for (const deg of [300, 240]) {
        const e = armEnd(p2, deg, 50);
        g += bond(p2, e, { rFrom: 15, rTo: 0 });
        g += atom(e.x, e.y, '', { kind: 'point' });
      }
      /* The group lands on the carbon that WAS the cation — the arm at 180 —
         and the charge is left behind on the carbon it came from. */
      const home = armEnd(p2, 180, 50);
      g += bond(p2, home, { rFrom: 15, rTo: 0 });
      g += atom(home.x, home.y, '', { kind: 'point' });
      const land = armEnd(home, 135, 46);
      g += bond(home, land, { rFrom: 0, rTo: isH ? 13 : 17, cls: 'fg-bond-hi' });
      g += atom(p2.x, p2.y, 'C', { kind: 'warn' });
      g += atom(land.x, land.y, isH ? 'H' : 'CH₃', { kind: 'hi', r: isH ? 13 : 17, size: isH ? 11 : 10 });
      g += text(p2.x + 24, y0 - 20, '+', { cls: 'fg-tag-warn', size: 17 });
      g += text(p2.x, y0 + 36, '3°', { cls: 'fg-tag-good', size: 11 });

      const R = 724;
      g += text(R, y0 - 46, isH ? 'isobutyl → tert-butyl' : 'neopentyl → 2-methylbutan-2-yl', { cls: 'fg-tag', size: 11, anchor: 'end' });
      g += text(R, y0 - 18, isH ? 'an H moves with its two electrons' : 'a CH₃ moves with its two electrons', { cls: 'fg-sm', size: 10, anchor: 'end' });
      g += text(R, y0 + 8, 'the charge moves the other way', { cls: 'fg-sm', size: 10, anchor: 'end' });
      g += text(R, y0 + 38, '1° → 3°, so it happens', { cls: 'fg-tag-good', size: 10.5, anchor: 'end' });
      return g;
    };

    s += row(152, true);
    s += rule(40, 248, 720, 248);
    s += row(350, false);
    return s;
  },
  caption: 'The two shifts that matter, drawn with the arrow in the right place. What migrates is a <b>bond and the pair inside it</b>, so the tail goes on the C&ndash;H or C&ndash;CH₃ bond &mdash; never on the atom, and never on the positive carbon. The group lands on the cation; the charge ends up on the carbon the group just left.',
  note: 'Both of these are the same move with a different passenger, and both are famous precisely because the starting cation is primary. Neopentyl substrates in particular are notorious: there is no hydrogen at all on the neighboring carbon, so a student hunting only for hydride shifts finds none and reports an unrearranged product that never forms.',
});

FIGURES.push({
  id: 'ring-expansion-drawn',
  section: 'carbocations',
  anchor: '<p><b>Step 3.</b> The result is the <b>cyclopentyl cation</b>. Water attacks it, a second water removes the proton, and the product is cyclopentanol.</p>',
  alt: 'Chloromethyl cyclobutane ionizing to a primary cation on the exocyclic carbon, then a ring carbon-carbon bond migrating to that carbon with a curved arrow, which enlarges the four-membered ring to a five-membered one and leaves a secondary cyclopentyl cation.',
  viewBox: '0 0 760 346',
  build() {
    let s = '';

    /* ---- 1. ionization ---- */
    s += tag(130, 44, 'CHLORIDE LEAVES');
    const sq1 = polyPts(120, 186, 4, 38, 45);
    s += polyRing(sq1, 'fg-bond');
    for (const p of sq1) s += atom(p.x, p.y, '', { kind: 'point' });
    const e1 = P(sq1[0].x + 30, sq1[0].y - 30);
    s += bond(sq1[0], e1, { rFrom: 0, rTo: 0 });
    s += atom(e1.x, e1.y, '', { kind: 'point' });
    const cl = P(e1.x + 34, e1.y - 16);
    s += bond(e1, cl, { rFrom: 0, rTo: 15 });
    s += atom(cl.x, cl.y, 'Cl', { kind: 'warn', size: 10.5 });
    s += curve(P(e1.x + 18, e1.y - 12), P(cl.x - 6, cl.y - 20), { bow: -22, size: 7 });
    s += text(120, 264, 'a four-membered ring', { cls: 'fg-sm', size: 10 });
    s += text(120, 282, 'and a primary CH₂', { cls: 'fg-sm', size: 10 });

    s += arrow(P(252, 186), P(304, 186), { muted: true });

    /* ---- 2. the primary cation and the migrating ring bond ---- */
    s += tag(390, 44, 'A RING BOND MIGRATES');
    const sq2 = polyPts(380, 186, 4, 38, 45);
    s += polyRing(sq2, 'fg-bond');
    s += bond(sq2[0], sq2[3], { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    for (const p of sq2) s += atom(p.x, p.y, '', { kind: 'point' });
    const e2 = P(sq2[0].x + 30, sq2[0].y - 30);
    s += bond(sq2[0], e2, { rFrom: 0, rTo: 0 });
    s += atom(e2.x, e2.y, '', { kind: 'point' });
    s += text(e2.x + 16, e2.y - 8, '+', { cls: 'fg-tag-warn', size: 17 });
    s += text(e2.x + 34, e2.y + 10, '1°', { cls: 'fg-tag-warn', size: 11 });
    s += curve(P(sq2[0].x + 8, sq2[0].y + 24), P(e2.x - 4, e2.y + 16), { bow: -34, size: 7 });
    s += text(390, 264, 'the highlighted C–C bond moves', { cls: 'fg-sm', size: 10 });
    s += text(390, 282, 'to the CH₂, carrying its carbon along', { cls: 'fg-sm', size: 10 });

    s += arrow(P(500, 186), P(552, 186), { muted: true });

    /* ---- 3. the cyclopentyl cation ---- */
    s += tag(644, 44, 'FIVE-MEMBERED, AND 2°');
    const pg = polyPts(644, 188, 5, 44, 90);
    s += polyRing(pg, 'fg-bond');
    for (const p of pg) s += atom(p.x, p.y, '', { kind: 'point' });
    s += text(pg[0].x, pg[0].y - 18, '+', { cls: 'fg-tag-warn', size: 17 });
    s += text(644, 264, 'cyclopentyl cation', { cls: 'fg-tag-good', size: 10.5 });
    s += text(644, 282, 'secondary, and nearly strain-free', { cls: 'fg-sm', size: 10 });

    s += rule(50, 304, 710, 304);
    s += text(380, 330, 'Two things improve at once: 1° becomes 2°, and a strained four-membered ring becomes an unstrained five.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Ring expansion, which is a 1,2-alkyl shift whose migrating group happens to be part of a ring. The bond that moves is a ring C&ndash;C bond on the carbon next to the charge; when its far end lands on the cation, that carbon has left the ring and joined the chain, so the ring grows by one and the charge stays behind.',
  note: 'Drawn as two steps for bookkeeping, and slightly false as physics: a free primary cation has no lifetime worth speaking of, so the ring bond is already on its way as the chloride leaves. That is exactly why this primary substrate reacts at all. The practical rule: whenever a rearrangement would also relieve ring strain, check it before you check for a hydride.',
});

export default FIGURES;
