/* Figures for the diene-addition notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- B2 ---
   The section's central surprise is that one flask gives two compounds and
   the ratio flips with temperature. Prose can give the four numbers; it
   cannot put the two products side by side so the reader sees that the
   difference between them is which end of one cation bromide landed on. */
FIGURES.push({
  id: 'diene-capture',
  section: 'diene-addition',
  anchor: '<h3>Why the 1,2-product forms faster</h3>',
  alt: 'The allylic cation from protonating buta-1,3-diene, bromide capturing at C2 or C4 to give 3-bromobut-1-ene or 1-bromobut-2-ene, with the 80:20 and 15:85 ratios at minus 80 and 40 degrees Celsius',
  viewBox: '0 0 760 366',
  build() {
    let s = '';
    // ---- the one intermediate ----
    s += tag(180, 44, 'one allylic cation, two electrophilic ends');
    const c = [P(60, 110), P(140, 110), P(220, 110), P(300, 110)];
    s += bond(c[0], c[1]);
    s += bond(c[1], c[2]);
    s += bond(c[2], c[3]);
    // Partial double-bond character drawn as a dashed line parallel to each
    // of the two delocalized bonds: the charge is shared, so neither bond is
    // honestly a single bond and neither is honestly a double one.
    s += bond(P(140, 96), P(220, 96), { cls: 'fg-dash', rFrom: 14, rTo: 14 });
    s += bond(P(220, 96), P(300, 96), { cls: 'fg-dash', rFrom: 14, rTo: 14 });
    s += atom(c[0].x, c[0].y, 'CH\u2083');
    s += atom(c[1].x, c[1].y, 'CH', { kind: 'warn' });
    s += atom(c[2].x, c[2].y, 'CH');
    s += atom(c[3].x, c[3].y, 'CH\u2082', { kind: 'warn' });
    s += text(140, 76, '\u03b4+', { cls: 'fg-lbl', size: 13 });
    s += text(300, 76, '\u03b4+', { cls: 'fg-lbl', size: 13 });
    ['C1', 'C2', 'C3', 'C4'].forEach((t, i) => s += text(c[i].x, 142, t, { cls: 'fg-sm', size: 10 }));
    s += text(140, 162, 'secondary form:', { cls: 'fg-sm', size: 9.5 });
    s += text(140, 176, 'most of the charge', { cls: 'fg-tag-good', size: 10 });
    s += text(300, 162, 'primary form:', { cls: 'fg-sm', size: 9.5 });
    s += text(300, 176, 'much less', { cls: 'fg-tag', size: 10 });

    // ---- the two captures ----
    s += arrow(P(350, 122), P(430, 92));
    // The lower arrow stops short of the product's bromine, which its head was
    // otherwise landing on top of.
    s += arrow(P(350, 140), P(416, 206));
    s += text(386, 84, 'Br\u207b at C2', { cls: 'fg-tag', size: 10 });
    s += text(350, 216, 'Br\u207b at C4', { cls: 'fg-tag', size: 10, anchor: 'start' });

    // 1,2-product: 3-bromobut-1-ene, CH2=CH-CHBr-CH3
    s += tag(560, 46, '1,2-addition');
    const p = [P(470, 96), P(506, 74), P(542, 96), P(578, 74)];
    s += bond(p[0], p[1], { order: 2, rFrom: 0, rTo: 0 });
    s += bond(p[1], p[2], { rFrom: 0, rTo: 0 });
    s += bond(p[2], p[3], { rFrom: 0, rTo: 0 });
    s += bond(p[2], P(542, 136), { rFrom: 0, rTo: 15 });
    s += atom(542, 136, 'Br');
    s += text(560, 164, '3-bromobut-1-ene', { cls: 'fg-lbl', size: 12 });
    s += text(560, 182, 'monosubstituted terminal alkene', { cls: 'fg-sm', size: 10 });

    // 1,4-product: 1-bromobut-2-ene, BrCH2-CH=CH-CH3
    s += tag(560, 214, '1,4-addition');
    const q = [P(470, 264), P(506, 242), P(542, 264), P(578, 242)];
    s += bond(q[0], q[1], { rFrom: 0, rTo: 0 });
    s += bond(q[1], q[2], { order: 2, rFrom: 0, rTo: 0 });
    s += bond(q[2], q[3], { rFrom: 0, rTo: 0 });
    s += bond(q[0], P(434, 242), { rFrom: 0, rTo: 15 });
    s += atom(434, 242, 'Br');
    s += text(560, 300, '1-bromobut-2-ene', { cls: 'fg-lbl', size: 12 });
    s += text(560, 318, 'disubstituted internal alkene', { cls: 'fg-sm', size: 10 });

    // ---- the ratio, twice ----
    s += tag(196, 214, 'same flask, two temperatures');
    const barW = 240, bx = 110;
    const ratio = (y, temp, pct12) => {
      const w1 = barW * pct12 / 100;
      let t = '';
      t += label(24, y + 4, temp, { anchor: 'start', size: 12 });
      t += bar(bx, y - 9, w1, 18, { kind: 'hi', opacity: 0.34 });
      t += bar(bx + w1, y - 9, barW - w1, 18, { kind: 'warn', opacity: 0.34 });
      /* A label wider than the segment it belongs to is drawn just above the
         bar instead of inside it. Centred on its own segment either way, so
         which share it names stays unambiguous — written inside, the two
         minority figures spilled onto the neighboring color and read as
         labels for it. */
      const put = (cxSeg, segW, txt) => {
        const wide = txt.length * 10.5 * 0.62;
        return text(cxSeg, wide <= segW - 8 ? y + 4 : y - 15, txt, { cls: 'fg-sm', size: 10 });
      };
      t += put(bx + w1 / 2, w1, `${pct12}% 1,2`);
      t += put(bx + w1 + (barW - w1) / 2, barW - w1, `${100 - pct12}% 1,4`);
      return t;
    };
    s += ratio(250, '\u221280 \u00b0C', 80);
    s += ratio(290, '40 \u00b0C', 15);
    s += text(196, 324, 'Same cation \u2014 only the temperature differs.', { cls: 'fg-sm', size: 10 });
    s += text(560, 336, 'Product names are numbered from their own chain,', { cls: 'fg-sm', size: 9.5 });
    s += text(560, 350, 'so C1 of a name is not C1 of the cation above.', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'One protonation, one cation, and then a choice. Bromide can land on C2 or on C4 \u2014 the two carbons the resonance forms put the charge on \u2014 and the two landings give compounds that differ in where the bromine sits and where the surviving double bond ended up.',
  note: 'Note what is <b>not</b> different between the two products: the bromine came from the same bromide and the hydrogen went to C1 in both cases. The double bond looks as though it moved, and it did not; the cation never had a double bond in one fixed place to begin with. The temperature rows are the finding \u2014 the mechanism is identical at both, which is exactly why the next section is about conditions rather than about arrows.',
});

/* ----------------------------------------------------------------- B2a ---
   The section's existing figure starts at the allylic cation and ends at the
   two products, which leaves the mechanism itself undrawn: the proton is
   never seen arriving, the two resonance forms are described in words and
   never drawn beside each other, and bromide's attack is a straight reaction
   arrow rather than a pair of electrons leaving a lone pair. This is the
   arrows. */
FIGURES.push({
  id: 'diene-protonation-arrows',
  section: 'diene-addition',
  anchor: 'pick the end whose cation has the better <i>major</i> resonance form.</p>',
  alt: 'Buta-1,3-diene attacking H-Br with a curved arrow from the C1-C2 pi bond to the hydrogen and a second arrow from the H-Br bond onto bromine. The resulting allylic cation is drawn as two resonance structures, positive on C2 in one and on C4 in the other, with a bromide ion below sending a curved arrow from a lone pair to each of those two carbons.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';

    // ---- step 1: the pi bond takes the proton ----
    s += tag(175, 56, 'step 1 — the π bond takes the proton');
    const c1 = P(115, 120), c2 = P(165, 90), c3 = P(215, 120), c4 = P(265, 90);
    s += bond(c1, c2, { order: 2, rFrom: 0, rTo: 0 });
    s += bond(c2, c3, { rFrom: 0, rTo: 0 });
    s += bond(c3, c4, { order: 2, rFrom: 0, rTo: 0 });
    for (const q of [c1, c2, c3, c4]) s += atom(q.x, q.y, '', { kind: 'point' });
    s += text(108, 140, 'C1', { cls: 'fg-sm', size: 9.5 });
    s += text(165, 76, 'C2', { cls: 'fg-sm', size: 9.5 });
    s += text(215, 140, 'C3', { cls: 'fg-sm', size: 9.5 });
    s += text(274, 76, 'C4', { cls: 'fg-sm', size: 9.5 });

    const H = P(90, 176), Br = P(38, 176);
    s += bond(H, Br);
    s += atom(H.x, H.y, 'H');
    s += atom(Br.x, Br.y, 'Br');
    for (const a of [120, 180, 240]) s += lonePair(Br.x, Br.y, a);
    s += curve(P(138, 106), P(93, 160), { bow: 22 });
    s += curve(P(64, 176), P(46, 157), { bow: 14 });
    s += text(175, 212, 'the charge lands on C2, next to C3=C4', { cls: 'fg-sm', size: 10 });

    s += arrow(P(310, 120), P(368, 120));

    // ---- step 2: the same cation, drawn both ways ----
    s += tag(528, 56, 'step 2 — one cation, two forms');
    const A = [P(385, 120), P(423, 94), P(461, 120), P(499, 94)];
    s += bond(A[0], A[1], { rFrom: 0, rTo: 0 });
    s += bond(A[1], A[2], { rFrom: 0, rTo: 0 });
    s += bond(A[2], A[3], { order: 2, rFrom: 0, rTo: 0 });
    for (const q of A) s += atom(q.x, q.y, '', { kind: 'point' });
    s += text(423, 74, 'C2', { cls: 'fg-sm', size: 9.5 });
    s += text(423, 88, '+', { cls: 'fg-lbl', size: 15 });

    s += text(528, 116, '↔', { cls: 'fg-lbl', size: 18 });

    const B = [P(557, 120), P(595, 94), P(633, 120), P(671, 94)];
    s += bond(B[0], B[1], { rFrom: 0, rTo: 0 });
    s += bond(B[1], B[2], { order: 2, rFrom: 0, rTo: 0 });
    s += bond(B[2], B[3], { rFrom: 0, rTo: 0 });
    for (const q of B) s += atom(q.x, q.y, '', { kind: 'point' });
    s += text(671, 74, 'C4', { cls: 'fg-sm', size: 9.5 });
    s += text(671, 88, '+', { cls: 'fg-lbl', size: 15 });

    // ---- step 3: bromide arrives, from a lone pair, at either end ----
    s += atom(528, 196, 'Br⁻');
    for (const a of [0, 90, 180, 270]) s += lonePair(528, 196, a);
    s += curve(P(506, 190), P(437, 104), { bow: 24 });
    s += curve(P(550, 190), P(657, 104), { bow: -24 });
    s += text(528, 232, 'one bromide, two carbons to land on', { cls: 'fg-sm', size: 10 });

    s += rule(30, 248, 706, 248);
    s += text(375, 272, 'Both arrows leave one bromide and land on one cation — only the carbon differs.', { cls: 'fg-lbl', size: 12 });
    s += text(375, 290, 'C2 gives 3-bromobut-1-ene; C4 gives 1-bromobut-2-ene.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The mechanism with its arrows drawn. The diene’s terminal π bond reaches for the proton and the H–Br bond collapses onto bromine, which leaves a cation whose charge is genuinely shared between C2 and C4 — the two structures on the right are one species, not two. Bromide then arrives from a lone pair at whichever of those carbons it lands on.',
  note: 'Two habits this figure is trying to build. An arrow starts where the electrons <b>are</b>: on the π bond, on the H–Br bond, on a bromide lone pair — never on a positive charge and never on the hydrogen itself. And the double-headed arrow between the two cation structures means they are one thing drawn twice; a student who treats them as two intermediates in equilibrium will look for a step that converts one into the other, and there is none.',
});

/* ----------------------------------------------------------------- B2b ---
   The section names Br2 as its second electrophile and asserts a bromonium
   ion that "opens to an allylic cation" — a step with two arrows in it, a
   choice of which end opens, and two dibromides at the end of it, none of
   which was drawn. A hard bank item rests on it. */
FIGURES.push({
  id: 'bromonium-diene',
  section: 'diene-addition',
  anchor: 'Cold conditions favor the 1,2-product and warm conditions the 1,4-product, for exactly the reasons below.</p>',
  alt: 'Three stages. Buta-1,3-diene attacks bromine with a curved arrow from the C1-C2 pi bond and a second arrow releasing bromide. The bromonium ion that results bridges C1 and C2, and a curved arrow breaks its C2 to bromine bond. The allylic cation left over carries bromine on C1 and partial positive charge on C2 and C4. Below, the two products: 3,4-dibromobut-1-ene from capture at C2 and 1,4-dibromobut-2-ene from capture at C4.',
  viewBox: '0 0 760 470',
  build() {
    let s = '';

    // ---- stage 1: the pi bond reaches for Br2 ----
    s += tag(118, 56, 'Br₂ meets buta-1,3-diene');
    const a1 = P(58, 130), a2 = P(100, 104), a3 = P(142, 130), a4 = P(184, 104);
    s += bond(a1, a2, { order: 2, rFrom: 0, rTo: 0 });
    s += bond(a2, a3, { rFrom: 0, rTo: 0 });
    s += bond(a3, a4, { order: 2, rFrom: 0, rTo: 0 });
    for (const q of [a1, a2, a3, a4]) s += atom(q.x, q.y, '', { kind: 'point' });
    s += text(48, 148, 'C1', { cls: 'fg-sm', size: 9.5 });
    s += text(194, 92, 'C4', { cls: 'fg-sm', size: 9.5 });
    const B1 = P(66, 192), B2 = P(118, 192);
    s += bond(B1, B2);
    s += atom(B1.x, B1.y, 'Br');
    s += atom(B2.x, B2.y, 'Br');
    for (const ang of [180, 240]) s += lonePair(B1.x, B1.y, ang);
    for (const ang of [0, 60, 300]) s += lonePair(B2.x, B2.y, ang);
    s += curve(P(78, 120), P(70, 176), { bow: 18 });
    s += curve(P(92, 192), P(140, 206), { bow: -16 });
    s += text(118, 234, 'the π bond attacks Br₂', { cls: 'fg-sm', size: 10 });
    s += text(118, 250, 'and bromide leaves', { cls: 'fg-sm', size: 10 });

    s += arrow(P(216, 140), P(268, 140));

    // ---- stage 2: the bromonium ion, and which end opens ----
    s += tag(372, 56, 'a bromonium ion across C1–C2');
    const b1 = P(314, 140), b2 = P(356, 114), b3 = P(398, 140), b4 = P(440, 114);
    s += bond(b1, b2, { rFrom: 0, rTo: 0 });
    s += bond(b2, b3, { rFrom: 0, rTo: 0 });
    s += bond(b3, b4, { order: 2, rFrom: 0, rTo: 0 });
    for (const q of [b1, b2, b3, b4]) s += atom(q.x, q.y, '', { kind: 'point' });
    const Bp = P(335, 76);
    s += bond(b1, Bp, { rFrom: 0, rTo: 16 });
    s += bond(b2, Bp, { rFrom: 0, rTo: 16 });
    s += atom(Bp.x, Bp.y, 'Br', { kind: 'warn' });
    s += text(358, 68, '+', { cls: 'fg-lbl', size: 15 });
    s += text(304, 158, 'C1', { cls: 'fg-sm', size: 9.5 });
    s += text(450, 102, 'C4', { cls: 'fg-sm', size: 9.5 });
    s += curve(P(350, 104), P(326, 86), { bow: 14 });
    s += text(372, 200, 'it opens at C2 — the end', { cls: 'fg-sm', size: 10 });
    s += text(372, 216, 'whose cation is allylic', { cls: 'fg-sm', size: 10 });

    s += arrow(P(478, 140), P(508, 140));

    // ---- stage 3: the allylic cation, with bromine already on C1 ----
    s += tag(600, 56, 'one cation, two δ+ ends');
    const g1 = P(530, 130), g2 = P(586, 130), g3 = P(634, 130), g4 = P(682, 130);
    s += bond(g1, g2, { rFrom: 19, rTo: 15 });
    s += bond(g2, g3);
    s += bond(g3, g4);
    s += bond(P(586, 114), P(634, 114), { cls: 'fg-dash', rFrom: 13, rTo: 13 });
    s += bond(P(634, 114), P(682, 114), { cls: 'fg-dash', rFrom: 13, rTo: 13 });
    s += atom(g1.x, g1.y, 'CH₂Br', { r: 19, size: 9.5 });
    s += atom(g2.x, g2.y, 'CH');
    s += atom(g3.x, g3.y, 'CH');
    s += atom(g4.x, g4.y, 'CH₂');
    s += text(586, 100, 'δ+', { cls: 'fg-lbl', size: 13 });
    s += text(682, 100, 'δ+', { cls: 'fg-lbl', size: 13 });
    s += text(530, 160, 'C1', { cls: 'fg-sm', size: 9.5 });
    s += text(586, 160, 'C2', { cls: 'fg-sm', size: 9.5 });
    s += text(682, 160, 'C4', { cls: 'fg-sm', size: 9.5 });
    s += text(600, 200, 'Br is fixed on C1; the charge', { cls: 'fg-sm', size: 10 });
    s += text(600, 216, 'is shared between C2 and C4', { cls: 'fg-sm', size: 10 });

    // ---- the two products ----
    s += rule(30, 262, 710, 262);
    s += tag(370, 288, 'bromide then lands on C2 or on C4');

    const p1 = P(150, 340), p2 = P(190, 316), p3 = P(230, 340), p4 = P(270, 316);
    s += bond(p1, p2, { rFrom: 0, rTo: 0 });
    s += bond(p2, p3, { rFrom: 0, rTo: 0 });
    s += bond(p3, p4, { order: 2, rFrom: 0, rTo: 0 });
    for (const q of [p1, p2, p3, p4]) s += atom(q.x, q.y, '', { kind: 'point' });
    s += bond(p1, P(120, 364), { rFrom: 0, rTo: 15 });
    s += atom(120, 364, 'Br');
    s += bond(p2, P(190, 282), { rFrom: 0, rTo: 15 });
    s += atom(190, 282, 'Br');
    s += text(200, 400, '3,4-dibromobut-1-ene', { cls: 'fg-lbl', size: 12 });
    s += text(200, 418, 'from 1,2-addition — favored cold', { cls: 'fg-sm', size: 10 });

    const q1 = P(480, 340), q2 = P(520, 316), q3 = P(560, 340), q4 = P(600, 316);
    s += bond(q1, q2, { rFrom: 0, rTo: 0 });
    s += bond(q2, q3, { order: 2, rFrom: 0, rTo: 0 });
    s += bond(q3, q4, { rFrom: 0, rTo: 0 });
    for (const q of [q1, q2, q3, q4]) s += atom(q.x, q.y, '', { kind: 'point' });
    s += bond(q1, P(450, 364), { rFrom: 0, rTo: 15 });
    s += atom(450, 364, 'Br');
    s += bond(q4, P(630, 292), { rFrom: 0, rTo: 15 });
    s += atom(630, 292, 'Br');
    s += text(540, 400, '1,4-dibromobut-2-ene', { cls: 'fg-lbl', size: 12 });
    s += text(540, 418, 'from 1,4-addition — favored warm', { cls: 'fg-sm', size: 10 });

    s += rule(30, 434, 710, 434);
    s += text(370, 456, 'Same cation, same two ends — bromine has simply replaced the proton.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Bromine taking the same route the proton took. The diene’s π bond attacks one bromine and displaces the other as bromide, which leaves a three-membered bromonium ion bridging C1 and C2. That ring then opens — at C2, not C1 — and what is left is an allylic cation with a bromine already parked on C1.',
  note: 'Why the ring opens at C2 is the whole reason this case behaves like the HBr one. Breaking the C1–Br bond would leave a bare primary cation on C1, insulated from C3=C4 by an sp³ carbon. Breaking the C2–Br bond leaves the charge next door to that double bond, so it delocalizes to C4 — and from there the story is identical: bromide lands at C2 or at C4, and the temperature decides which of the two you isolate.',
});

export default FIGURES;
