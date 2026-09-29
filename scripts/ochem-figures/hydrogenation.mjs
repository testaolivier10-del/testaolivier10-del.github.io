/* Figures for the hydrogenation notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------------ C4 ---
   One alkyne, three sets of conditions, three different answers - two of
   which are stereoisomers. The prose can say "opposite geometries"; only a
   drawing says which two atoms ended up on which side. */
FIGURES.push({
  id: 'alkyne-three-ways',
  section: 'hydrogenation',
  anchor: '<h3>Heats of hydrogenation, as a measuring tool</h3>',
  alt: 'An internal alkyne reduced three ways: Lindlar to the cis alkene, sodium in ammonia to the trans alkene, and excess hydrogen over palladium on carbon to the alkane',
  viewBox: '0 0 760 390',
  build() {
    let s = '';
    // The starting alkyne, on the left, level with the middle branch.
    s += tag(150, 152, 'one internal alkyne');
    const a1 = P(126, 196), a2 = P(192, 196);
    s += bond(P(66, 196), a1, { rTo: 0 });
    s += bond(a1, a2, { order: 3, rFrom: 0, rTo: 0, gap: 4.5 });
    s += bond(a2, P(258, 196), { rFrom: 0 });
    s += atom(66, 196, 'R');
    s += atom(258, 196, 'R\u2032', { size: 11 });

    /* A bus and three stubs rather than a fan. Fanned out from one point the
       upper and lower arrows cut diagonally across the band the branch
       captions occupy, and two of the captions were struck through by a line
       and one product's H sat on top of another. Kept to x = 300..384,
       nothing the branches say has an arrow through it. */
    s += bond(P(276, 196), P(300, 196), { rFrom: 0, rTo: 0, cls: 'fg-arrow' });
    s += bond(P(300, 96), P(300, 296), { rFrom: 0, rTo: 0, cls: 'fg-arrow' });
    s += arrow(P(300, 96), P(384, 96));
    s += arrow(P(300, 196), P(384, 196));
    s += arrow(P(300, 296), P(384, 296));

    /* An alkene with both R groups up (cis) or one up and one down (trans).
       The two hydrogens are drawn as well, because the claim is about where
       the NEW bonds went, not only about where the R groups sit. */
    const alkene = (cx, cy, trans) => {
      const c1 = P(cx - 30, cy), c2 = P(cx + 30, cy);
      let g = '';
      g += bond(c1, c2, { order: 2, rFrom: 0, rTo: 0 });
      g += bond(c1, P(cx - 68, cy - 28), { rFrom: 0, rTo: 14 });
      g += bond(c1, P(cx - 68, cy + 28), { rFrom: 0, rTo: 13, cls: 'fg-bond-hi' });
      g += bond(c2, P(cx + 68, cy - 28), { rFrom: 0, rTo: trans ? 13 : 14, cls: trans ? 'fg-bond-hi' : 'fg-bond' });
      g += bond(c2, P(cx + 68, cy + 28), { rFrom: 0, rTo: trans ? 14 : 13, cls: trans ? 'fg-bond' : 'fg-bond-hi' });
      g += atom(cx - 68, cy - 28, 'R', { r: 14 });
      g += atom(cx - 68, cy + 28, 'H', { kind: 'hi', r: 13, size: 11 });
      g += atom(cx + 68, cy - 28, trans ? 'H' : 'R\u2032', { kind: trans ? 'hi' : 'plain', r: trans ? 13 : 14, size: 11 });
      g += atom(cx + 68, cy + 28, trans ? 'R\u2032' : 'H', { kind: trans ? 'plain' : 'hi', r: trans ? 14 : 13, size: 11 });
      return g;
    };

    // Branch 1: poisoned surface, syn delivery, cis product.
    s += text(500, 44, 'H\u2082, Lindlar \u2014 Pd/CaCO\u2083, Pb, quinoline', { cls: 'fg-lbl', size: 11.5 });
    s += alkene(500, 96, false);
    s += text(500, 146, 'both new H arrive on one face \u2014 syn addition on a surface', { cls: 'fg-sm', size: 10 });
    s += text(638, 68, 'cis (Z)', { cls: 'fg-tag-good', size: 11 });

    // Branch 2: dissolving metal, no surface, trans product.
    s += alkene(500, 196, true);
    s += text(500, 254, 'Na in NH\u2083(l) \u2014 no surface, radical anion route', { cls: 'fg-lbl', size: 11.5 });
    s += text(638, 168, 'trans (E)', { cls: 'fg-tag-good', size: 11 });

    // Branch 3: straight past the alkene.
    s += text(500, 286, 'H\u2082 in excess, Pd/C \u2014 nothing stops it', { cls: 'fg-lbl', size: 11.5 });
    s += label(500, 318, 'R\u2013CH\u2082\u2013CH\u2082\u2013R\u2032', { size: 14 });
    s += text(638, 318, 'alkane', { cls: 'fg-tag-warn', size: 11 });

    s += rule(30, 332, 700, 332);
    s += text(356, 354, 'The alkyne does not choose. The conditions do \u2014', { cls: 'fg-lbl', size: 12 });
    s += text(356, 376, 'and two of these choices are stereoisomers.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The same internal alkyne, three sets of conditions. Lindlar and sodium in ammonia both stop at the alkene and hand you <b>opposite geometries</b>; ordinary Pd/C does not stop at the alkene at all.',
  note: 'The split comes from where the hydrogens are delivered. Lindlar is a deliberately poisoned surface, and an alkene lying against a surface can only be reached from the face touching it, so both hydrogens arrive on that face and the product is cis. Sodium in ammonia never uses a surface: it adds an electron, then a proton, twice over, and the geometry is fixed at the <i>vinyl anion</i> formed by the second electron transfer, which is configurationally stable and sits with its two R groups apart. The radical before it inverts far too fast to decide anything. Same two hydrogens, same alkyne, opposite answers.',
});

/* ------------------------------------------------------------------ R5 ---
   Why hydrogenation is syn. The reason is physical rather than electronic -
   an alkene lying on a surface has one reachable face - and no figure in the
   section showed the surface at all. */
FIGURES.push({
  id: 'syn-on-surface',
  section: 'hydrogenation',
  anchor: 'Hydrogenation is therefore a <b>syn addition</b>: the two new C–H bonds form on the same face.</p>',
  alt: 'Three frames showing an alkene adsorbed face down on a palladium surface, both hydrogens delivered from that surface, and the syn product; below, 1,2-dimethylcyclohexene hydrogenated to cis-1,2-dimethylcyclohexane',
  viewBox: '0 0 760 500',
  build() {
    let s = '';
    s += text(60, 28, 'WHY SYN', { cls: 'fg-tag', size: 11 });

    /* The surface is the same object in the first two frames, so it is one
       function: a filled bar with the metal label under it. */
    const surface = (x, w, label) => bar(x, 176, w, 12, { kind: 'mut', r: 4 }) +
      text(x + w / 2, 206, label, { cls: 'fg-sm', size: 10 });

    // ---- Frame 1: adsorption ----
    s += panel(14, 44, 236, 186);
    s += tag(132, 62, 'adsorption');
    {
      const C1 = P(108, 128), C2 = P(158, 128);
      s += bond(C1, C2, { order: 2, gap: 5, rFrom: 14, rTo: 14 });
      s += bond(C1, P(84, 92), { rFrom: 14, rTo: 13 });
      s += bond(C2, P(182, 92), { rFrom: 14, rTo: 13 });
      s += atom(C1.x, C1.y, 'C', { r: 14 });
      s += atom(C2.x, C2.y, 'C', { r: 14 });
      s += atom(84, 92, 'R', { r: 13 });
      s += atom(182, 92, 'R', { r: 13 });
      s += atom(110, 162, 'H', { kind: 'hi', r: 12 });
      s += atom(156, 162, 'H', { kind: 'hi', r: 12 });
      s += surface(30, 204, 'metal surface (Pd)');
      s += text(132, 222, 'H–H splits here; the alkene lies flat', { cls: 'fg-sm', size: 9.5 });
    }
    // ---- Frame 2: delivery ----
    s += panel(258, 44, 236, 186);
    s += tag(376, 62, 'delivery');
    {
      const C1 = P(352, 128), C2 = P(402, 128);
      s += bond(C1, C2, { rFrom: 14, rTo: 14 });
      s += bond(C1, P(328, 92), { rFrom: 14, rTo: 13 });
      s += bond(C2, P(426, 92), { rFrom: 14, rTo: 13 });
      s += atom(C1.x, C1.y, 'C', { r: 14 });
      s += atom(C2.x, C2.y, 'C', { r: 14 });
      s += atom(328, 92, 'R', { r: 13 });
      s += atom(426, 92, 'R', { r: 13 });
      s += arrow(P(352, 160), P(352, 146), { size: 6 });
      s += arrow(P(402, 160), P(402, 146), { size: 6 });
      s += surface(274, 204, 'both H come off the metal');
      s += text(376, 222, 'there is no other side available', { cls: 'fg-sm', size: 10 });
    }
    // ---- Frame 3: the product ----
    s += panel(502, 44, 244, 186);
    s += tag(624, 62, 'SYN addition');
    {
      const C1 = P(600, 132), C2 = P(650, 132);
      s += bond(C1, C2, { rFrom: 14, rTo: 14 });
      s += hash(C1, P(576, 96), { rFrom: 14, rTo: 13 });
      s += hash(C2, P(674, 96), { rFrom: 14, rTo: 13 });
      s += wedge(C1, P(576, 170), { rFrom: 14, rTo: 12 });
      s += wedge(C2, P(674, 170), { rFrom: 14, rTo: 12 });
      s += atom(C1.x, C1.y, 'C', { r: 14 });
      s += atom(C2.x, C2.y, 'C', { r: 14 });
      s += atom(576, 96, 'R', { r: 13 });
      s += atom(674, 96, 'R', { r: 13 });
      s += atom(576, 170, 'H', { kind: 'hi', r: 12 });
      s += atom(674, 170, 'H', { kind: 'hi', r: 12 });
      s += text(624, 206, 'both new H on one face,', { cls: 'fg-tag-good', size: 11 });
      s += text(624, 222, 'both R groups left on the other', { cls: 'fg-sm', size: 10 });
    }

    s += rule(30, 248, 730, 248);
    s += text(58, 274, 'ON A RING', { cls: 'fg-tag', size: 11 });

    /* A hexagon from its center, vertex 0 at the top right, so the C1-C2 edge
       that carries the two methyls is the top edge in both drawings. */
    const hex = (cx, cy, r) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = ((60 * i - 120) * Math.PI) / 180;
        v.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      return v;
    };
    {
      const v = hex(150, 352, 44);
      let ring = '';
      for (let i = 0; i < 6; i++) ring += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      s += ring;
      s += ringDouble(v[0], v[1], P(150, 352));
      s += bond(v[0], P(v[0].x - 22, v[0].y - 32), { rFrom: 0, rTo: 16 });
      s += bond(v[1], P(v[1].x + 22, v[1].y - 32), { rFrom: 0, rTo: 16 });
      s += atom(v[0].x - 22, v[0].y - 32, 'CH₃', { r: 16, size: 9.5 });
      s += atom(v[1].x + 22, v[1].y - 32, 'CH₃', { r: 16, size: 9.5 });
      s += text(150, 424, '1,2-dimethylcyclohexene', { cls: 'fg-lbl', size: 11.5 });
    }
    s += arrow(P(240, 352), P(360, 352));
    s += text(300, 338, 'H₂, Pd/C', { cls: 'fg-sm', size: 10 });
    {
      const v = hex(450, 352, 44);
      let ring = '';
      for (let i = 0; i < 6; i++) ring += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      s += ring;
      s += wedge(v[0], P(v[0].x, v[0].y - 40), { rFrom: 0, rTo: 16 });
      s += wedge(v[1], P(v[1].x, v[1].y - 40), { rFrom: 0, rTo: 16 });
      s += hash(v[0], P(v[0].x - 36, v[0].y - 20), { rFrom: 0, rTo: 12 });
      s += hash(v[1], P(v[1].x + 36, v[1].y - 20), { rFrom: 0, rTo: 12 });
      s += atom(v[0].x, v[0].y - 40, 'CH₃', { r: 16, size: 9.5 });
      s += atom(v[1].x, v[1].y - 40, 'CH₃', { r: 16, size: 9.5 });
      s += atom(v[0].x - 36, v[0].y - 20, 'H', { kind: 'hi', r: 12 });
      s += atom(v[1].x + 36, v[1].y - 20, 'H', { kind: 'hi', r: 12 });
      s += text(450, 424, 'cis-1,2-dimethylcyclohexane', { cls: 'fg-lbl', size: 11.5 });
    }
    s += text(636, 320, 'both H arrived on the', { cls: 'fg-sm', size: 10 });
    s += text(636, 336, 'bottom face, so both', { cls: 'fg-sm', size: 10 });
    s += text(636, 352, 'methyls are left on top', { cls: 'fg-sm', size: 10 });
    s += text(636, 378, 'cis here is meso — achiral', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(30, 440, 730, 440);
    s += text(380, 462, 'Syn fixes which side, not which enantiomer: the alkene can lie down either way up.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The mechanism in one picture. Hydrogenation is syn for a physical reason rather than an electronic one &mdash; an alkene lying on a surface has only one reachable face, and both hydrogens come off that surface.',
  note: 'The ring makes it visible, which is why it is always the exam case: a cyclohexene cannot rotate its two halves relative to each other, so &ldquo;both H on the same face&rdquo; shows up directly as &ldquo;both methyls cis&rdquo;. On an open-chain alkene the same thing happens, but the result is stated as a relative relationship instead — one diastereomer, formed as a racemate because half the molecules adsorb with the other face down.',
});

export default FIGURES;
