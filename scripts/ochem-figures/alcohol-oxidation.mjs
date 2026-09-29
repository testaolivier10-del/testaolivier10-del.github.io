/* Figures for the alcohol-oxidation notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------------ C2 ---
   The section's central claim is that one variable - water - decides between
   an aldehyde and a carboxylic acid, and the reason is a structure that never
   appears in the product. Prose has to describe the hydrate; drawing it makes
   "it is an alcohol again" something the reader can check rather than accept. */
FIGURES.push({
  id: 'chromium-water',
  section: 'alcohol-oxidation',
  anchor: '<h3>The reagents worth knowing</h3>',
  alt: 'Anhydrous oxidation of a primary alcohol stopping at the aldehyde, against aqueous oxidation running through the hydrate on to the carboxylic acid',
  viewBox: '0 0 760 362',
  build() {
    let s = '';
    // ---- Anhydrous ----
    s += tag(118, 50, 'ANHYDROUS \u2014 PCC, Swern, DMP');
    s += panel(30, 62, 670, 96);
    s += label(76, 116, 'R\u2013CH\u2082OH', { size: 13 });
    s += arrow(P(126, 112), P(200, 112));
    s += text(163, 98, '[O]', { cls: 'fg-sm', size: 10 });
    s += text(163, 132, 'no water', { cls: 'fg-sm', size: 9.5 });
    s += label(238, 116, 'R\u2013CHO', { size: 13 });
    s += arrow(P(280, 112), P(324, 112), { muted: true });
    s += text(340, 116, 'no water, so no hydrate \u2014 nothing left to grip', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(596, 140, 'stops at the aldehyde', { cls: 'fg-tag-good', size: 11 });

    // ---- Aqueous ----
    s += tag(122, 176, 'AQUEOUS \u2014 Jones, CrO\u2083/H\u2082SO\u2084');
    s += panel(30, 188, 670, 118);
    s += label(76, 240, 'R\u2013CH\u2082OH', { size: 13 });
    s += arrow(P(126, 236), P(192, 236));
    s += text(159, 222, '[O]', { cls: 'fg-sm', size: 10 });
    s += label(226, 240, 'R\u2013CHO', { size: 13 });
    s += arrow(P(264, 236), P(320, 236));
    s += text(292, 222, '+ H\u2082O', { cls: 'fg-sm', size: 9.5 });

    /* The hydrate, drawn out. The point of drawing it rather than naming it
       is that this carbon has an OH and an H on it, which is the definition
       of something a Cr(VI) reagent oxidizes - so the second oxidation needs
       no new explanation at all. */
    const c = P(400, 236);
    const oh1 = P(400, 198), oh2 = P(400, 274), r = P(352, 236), h = P(448, 236);
    s += bond(c, oh1, { rTo: 16 });
    s += bond(c, oh2, { rTo: 16 });
    s += bond(c, r, { rTo: 14 });
    s += bond(c, h, { rTo: 13, cls: 'fg-bond-hi' });
    s += atom(oh1.x, oh1.y, 'OH', { r: 16, size: 10.5 });
    s += atom(oh2.x, oh2.y, 'OH', { r: 16, size: 10.5 });
    s += atom(r.x, r.y, 'R', { r: 14 });
    s += atom(h.x, h.y, 'H', { kind: 'warn', r: 13, size: 11 });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += text(400, 300, 'the hydrate: an OH and an H on one carbon \u2014 an alcohol again', { cls: 'fg-tag-good', size: 10.5 });

    s += arrow(P(474, 236), P(534, 236));
    s += text(504, 222, '[O] again', { cls: 'fg-sm', size: 9.5 });
    s += label(578, 240, 'R\u2013CO\u2082H', { size: 13 });
    // Under the product rather than beside it: beside it, the name of the
    // thing this whole panel is about sat past the right-hand edge.
    s += text(578, 264, 'carboxylic acid', { cls: 'fg-tag-good', size: 11 });

    s += text(356, 330, 'Same oxidant, same substrate, same carbinol C\u2013H.', { cls: 'fg-lbl', size: 12 });
    s += text(356, 352, 'The water is the entire difference.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Why a chromium oxidation stops in one flask and not in the other. Both runs make the aldehyde first; only in water does that aldehyde turn back into something carrying an OH and a hydrogen on the same carbon &mdash; which is exactly what the oxidant attacked the first time.',
  note: 'The hydrate is never isolated and never appears in the answer, which is why this step is so easy to miss, and it is the reason the rule is about water rather than about strength. Using less Jones reagent or a shorter reaction time does not reliably stop the oxidation at the aldehyde, because the hydrate forms as fast as the aldehyde does. The Swern and DMP reach the same aldehyde by a route with no water anywhere in it.',
});

/* ------------------------------------------------------------------ R2 ---
   Where "the carbinol C-H" goes. The section names the chromate ester and
   never draws it, so the 1/2/3 alcohol rule reads as a rule rather than as
   the consequence of an elimination that needs a hydrogen to take. */
FIGURES.push({
  id: 'chromate-ester',
  section: 'alcohol-oxidation',
  anchor: 'the gem-diol formed by water adding across the C=O.</p>',
  alt: 'A chromium oxidation in three panels: the alcohol oxygen attacking chromic acid to form a chromate ester, an E2-like collapse in which a base removes the carbinol hydrogen while chromium leaves, and the aldehyde product with chromium reduced from six to three',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    // ---- Panel 1: the chromate ester forms ----
    s += tag(132, 34, 'STEP 1 — the chromate ester forms');
    s += panel(14, 44, 236, 226);
    {
      const C = P(96, 158), O = P(152, 158), H = P(196, 186), Cr = P(190, 96);
      s += bond(C, O, { rFrom: 22, rTo: 15 });
      s += bond(O, H, { rFrom: 15, rTo: 12 });
      s += atom(C.x, C.y, 'RCH₂', { r: 22, size: 9.5 });
      s += atom(O.x, O.y, 'O', { kind: 'hi' });
      s += atom(H.x, H.y, 'H', { r: 12 });
      s += lonePair(O.x, O.y, 200);
      s += lonePair(O.x, O.y, 285);
      s += atom(Cr.x, Cr.y, 'H₂CrO₄', { kind: 'warn', r: 22, size: 9 });
      s += text(132, 66, 'chromic acid — CrO₃ in water', { cls: 'fg-sm' });
      s += curve(P(160, 138), P(180, 118), { bow: 10 });
      s += text(132, 216, 'the alcohol oxygen attacks chromium', { cls: 'fg-sm', size: 10 });
      s += text(132, 232, 'and water leaves from the metal', { cls: 'fg-sm', size: 10 });
      s += text(132, 254, 'gives R–CH₂–O–CrO₂–OH', { cls: 'fg-tag', size: 10.5 });
    }
    // ---- Panel 2: the E2-like collapse ----
    s += tag(380, 34, 'STEP 2 — an E2-like collapse');
    s += panel(258, 44, 244, 226);
    {
      const C = P(348, 152), H = P(348, 104), O = P(404, 152), Cr = P(452, 116), R = P(304, 192);
      s += bond(C, H, { rFrom: 15, rTo: 13, cls: 'fg-bond-hi' });
      s += bond(C, O, { rFrom: 15, rTo: 14 });
      s += bond(O, Cr, { rFrom: 14, rTo: 22 });
      s += bond(C, R, { rFrom: 15, rTo: 13 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(H.x, H.y, 'H', { kind: 'warn', r: 13 });
      s += atom(O.x, O.y, 'O', { r: 14 });
      s += atom(Cr.x, Cr.y, 'CrO₂OH', { kind: 'warn', r: 22, size: 9 });
      s += atom(R.x, R.y, 'R', { r: 13 });
      s += atom(292, 104, 'B:', { r: 14, size: 10.5 });
      s += curve(P(306, 100), P(332, 100), { bow: -10 });
      s += curve(P(348, 128), P(376, 148), { bow: 12 });
      s += curve(P(428, 134), P(452, 94), { bow: 16 });
      s += text(380, 222, 'the base takes the hydrogen on the C', { cls: 'fg-sm', size: 10 });
      s += text(380, 238, 'while chromium leaves from the O —', { cls: 'fg-sm', size: 10 });
      s += text(380, 254, 'two bonds break at once, as in an E2', { cls: 'fg-sm', size: 10 });
    }
    // ---- Panel 3: the product ----
    s += tag(624, 34, 'THE PRODUCT');
    s += panel(510, 44, 236, 226);
    {
      const C = P(600, 152), O = P(600, 104), H = P(560, 190), R = P(644, 190);
      s += bond(C, O, { order: 2, gap: 5, rFrom: 15, rTo: 14 });
      s += bond(C, H, { rFrom: 15, rTo: 12 });
      s += bond(C, R, { rFrom: 15, rTo: 13 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(O.x, O.y, 'O', { r: 14 });
      s += atom(H.x, H.y, 'H', { r: 12 });
      s += atom(R.x, R.y, 'R', { r: 13 });
      s += text(624, 224, 'an aldehyde — R–CHO', { cls: 'fg-tag-good', size: 11 });
      s += text(624, 244, 'Cr(VI) → Cr(III)', { cls: 'fg-lbl', size: 12 });
      s += text(624, 260, 'orange → green', { cls: 'fg-sm', size: 10 });
    }
    s += rule(30, 286, 730, 286);
    s += text(380, 304, 'The reaction needs a hydrogen ON the carbinol carbon, because step 2 takes it.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 322, 'That is the whole 1°/2°/3° rule.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Where &ldquo;the carbinol C&ndash;H&rdquo; actually goes. The alcohol first hangs itself on chromium, and then the collapse is an elimination: a base removes the hydrogen on the carbon while chromium leaves from the oxygen, and the electrons between them become the second C&ndash;O bond.',
  note: 'The chromium electrophile is drawn as H₂CrO₄ because that is what CrO₃ becomes the moment it meets the aqueous acid of a Jones oxidation, and it is the OH on chromium that leaves as water when the ester forms; CrO₃ itself has no OH to lose. PCC and PDC reach the same chromate ester in dry solvent by a different first step, and everything after that is identical. Reading step 2 as an E2 explains two things at once. A tertiary alcohol forms the chromate ester perfectly well — it just has no hydrogen for the base to take, so the ester sits there and nothing happens; the reaction fails at the <i>second</i> step, not the first. (E2-<i>like</i> is the claim: a C–H and a C–O break in the same step. Unlike a real E2 there is no anti-periplanar requirement to satisfy, so do not go looking for one.) And the chromium is reduced by two here, Cr(VI) to Cr(IV) and on to Cr(III) through further steps, which is the other half of the trade: the carbon went up two, so something had to come down.',
});

/* ------------------------------------------------------------------ R3 ---
   The section's whole content on one named molecule, drawn skeletally: one
   substrate, two destinations, and the reagents sorted by which they reach. */
FIGURES.push({
  id: 'one-alcohol-two-destinations',
  section: 'alcohol-oxidation',
  anchor: 'it tells them apart by position (allylic/benzylic) rather than by class.</p>',
  alt: 'Skeletal 2-methylbutan-1-ol with two arrows: anhydrous oxidants give 2-methylbutanal, aqueous oxidants give 2-methylbutanoic acid',
  viewBox: '0 0 760 340',
  build() {
    let s = '';
    /* The skeleton is the same four carbons three times, so it is drawn once
       and shifted: only the group on C1 changes. */
    const chain = (x, y, head) => {
      let g = '';
      const c1 = P(x + 36, y - 20), c2 = P(x + 72, y + 2), me = P(x + 72, y + 44),
            c3 = P(x + 108, y - 20), c4 = P(x + 144, y + 2);
      g += bond(c1, c2, { rFrom: 0, rTo: 0 });
      if (head === 'OH') {
        g += bond(c2, me, { rFrom: 0, rTo: 0 });
        g += bond(c2, c3, { rFrom: 0, rTo: 0 });
        g += bond(c3, c4, { rFrom: 0, rTo: 0 });
      } else {
        /* The drawn head carbon is C1 here, so the branch sits on the next
           vertex and the chain is one vertex shorter: still five carbons. */
        g += bond(c1, P(x + 36, y - 52), { rFrom: 0, rTo: 0 });
        g += bond(c2, c3, { rFrom: 0, rTo: 0 });
      }
      if (head === 'OH') {
        g += bond(P(x, y + 2), c1, { rFrom: 18, rTo: 0 });
        g += atom(x, y + 2, 'HO', { r: 18, size: 10.5 });
      } else if (head === 'CHO') {
        g += bond(P(x, y + 2), c1, { rFrom: 14, rTo: 0 });
        g += bond(P(x, y + 2), P(x - 4, y - 40), { order: 2, gap: 4, rFrom: 14, rTo: 14 });
        g += atom(x, y + 2, 'C', { r: 14 });
        g += atom(x - 4, y - 40, 'O', { r: 14 });
        g += atom(x - 34, y + 24, 'H', { r: 12 });
        g += bond(P(x, y + 2), P(x - 34, y + 24), { rFrom: 14, rTo: 12 });
      } else {
        g += bond(P(x, y + 2), c1, { rFrom: 14, rTo: 0 });
        g += bond(P(x, y + 2), P(x - 4, y - 40), { order: 2, gap: 4, rFrom: 14, rTo: 14 });
        g += atom(x, y + 2, 'C', { r: 14 });
        g += atom(x - 4, y - 40, 'O', { r: 14 });
        g += bond(P(x, y + 2), P(x - 40, y + 26), { rFrom: 14, rTo: 18 });
        g += atom(x - 40, y + 26, 'OH', { r: 18, size: 10.5 });
      }
      return g;
    };

    s += tag(150, 40, 'START');
    s += panel(14, 52, 244, 220);
    s += chain(70, 150, 'OH');
    s += text(136, 246, '2-methylbutan-1-ol', { cls: 'fg-lbl', size: 12 });

    s += arrow(P(266, 130), P(400, 104));
    s += text(336, 92, '[O], no water', { cls: 'fg-sm', size: 10 });
    s += arrow(P(266, 196), P(400, 232));
    s += text(336, 258, '[O], in water', { cls: 'fg-sm', size: 10 });

    s += tag(590, 40, 'PCC, PDC, Swern or DMP');
    s += panel(410, 52, 336, 96);
    s += chain(482, 108, 'CHO');
    s += text(676, 130, '2-methylbutanal', { cls: 'fg-tag-good', size: 11 });

    s += tag(590, 176, 'Jones, CrO₃/H₂SO₄ or hot KMnO₄');
    s += panel(410, 188, 336, 96);
    s += chain(486, 244, 'CO2H');
    s += text(676, 266, '2-methylbutanoic acid', { cls: 'fg-tag-good', size: 11 });

    s += rule(30, 300, 730, 300);
    s += text(380, 324, 'One substrate, two destinations. The reagent list only ever answers: does it stop at the first?', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The section on one molecule. Every reagent in the list lands on one of these two products, and which one it lands on is decided by whether there is water in the flask &mdash; not by how strong it is.',
  note: 'Draw the substrate once and ask the two questions in order. The carbinol carbon here carries two hydrogens, so two rungs are available: that sets the ceiling. Then read the reagent for water, which says whether the reaction climbs one rung or both. A secondary alcohol would put a single product in both boxes, and a tertiary one would put nothing in either.',
});

export default FIGURES;
