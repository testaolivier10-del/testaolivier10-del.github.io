/* Figures for the carboxylic-acids notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- 165 ---
   The dimer. The prose asserts an eight-membered ring held by two hydrogen
   bonds at once and then explains a boiling point with it; that is a specific
   2D arrangement and the section had no picture of it. */
FIGURES.push({
  id: 'acid-dimer',
  section: 'carboxylic-acids',
  anchor: 'which is why the measured molecular weight of acetic acid vapor comes out close to double.</p>',
  viewBox: '0 0 760 360',
  alt: 'Two acetic acid molecules facing each other, each O-H hydrogen reaching across to the other molecule’s carbonyl oxygen, closing an eight-membered ring held by two hydrogen bonds',
  build() {
    let s = '';
    const meL = P(180, 180), cL = P(256, 180), o1L = P(330, 130), o2L = P(330, 230);
    const meR = P(580, 180), cR = P(504, 180), o1R = P(430, 230), o2R = P(430, 130);
    const hL = P(380, 244), hR = P(380, 116);

    s += bond(cL, o1L, { order: 2 });
    s += bond(cL, o2L);
    s += bond(cL, meL);
    s += bond(cR, o1R, { order: 2 });
    s += bond(cR, o2R);
    s += bond(cR, meR);
    s += bond(o2L, hL, { rTo: 10, cls: 'fg-bond' });
    s += bond(o2R, hR, { rTo: 10, cls: 'fg-bond' });
    // the two hydrogen bonds, drawn dashed
    s += bond(hL, o1R, { rFrom: 10, cls: 'fg-dash-hi' });
    s += bond(hR, o1L, { rFrom: 10, cls: 'fg-dash-hi' });

    s += atom(meL.x, meL.y, 'CH₃');
    s += atom(meR.x, meR.y, 'CH₃');
    s += atom(cL.x, cL.y, 'C', { kind: 'hi' });
    s += atom(cR.x, cR.y, 'C', { kind: 'hi' });
    s += atom(o1L.x, o1L.y, 'O'); s += lonePair(o1L.x, o1L.y, 250); s += lonePair(o1L.x, o1L.y, 190);
    s += atom(o1R.x, o1R.y, 'O'); s += lonePair(o1R.x, o1R.y, 110); s += lonePair(o1R.x, o1R.y, 170);
    s += atom(o2L.x, o2L.y, 'O'); s += lonePair(o2L.x, o2L.y, 110); s += lonePair(o2L.x, o2L.y, 300);
    s += atom(o2R.x, o2R.y, 'O'); s += lonePair(o2R.x, o2R.y, 250); s += lonePair(o2R.x, o2R.y, 70);
    s += atom(hL.x, hL.y, 'H', { r: 10 });
    s += atom(hR.x, hR.y, 'H', { r: 10 });

    s += tag(380, 92, 'hydrogen bond');
    s += tag(380, 276, 'hydrogen bond');

    s += rule(24, 296, 726, 296);
    s += text(24, 320, 'acetic acid · 60 g/mol · bp 118 °C', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(24, 342, 'acetone · 58 g/mol · bp 56 °C', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(700, 320, 'costs TWO hydrogen bonds', { cls: 'fg-lbl', size: 13, anchor: 'end' });
    s += text(700, 342, 'not one — hence the 62 °C', { cls: 'fg-sm', size: 10.5, anchor: 'end' });
    return s;
  },
  caption: 'Two carboxylic acids lock together through two hydrogen bonds at once, closing an eight-membered ring: each molecule donates its O–H to the other’s carbonyl oxygen. Breaking a dimer apart costs two hydrogen bonds rather than one, which is why acetic acid at 60 g/mol boils at 118 °C while acetone at 58 g/mol boils at 56 °C.',
  note: 'The pairing survives into the vapor, which is why a molecular-weight measurement on acetic acid vapor reads close to 120 rather than 60 — one of the older pieces of evidence that the dimer is a real species and not a way of drawing the liquid.',
});

/* ---------------------------------------------------------------- 166 ---
   The section asserts twice that the neutral acid’s OH donates into its own
   carbonyl, and draws only the anion. The claim that carries the second half
   of the section is the one with no picture. */
FIGURES.push({
  id: 'acid-donation-vs-ketone',
  section: 'carboxylic-acids',
  anchor: 'A carboxylic acid is therefore noticeably <i>less</i> reactive toward nucleophilic attack than a ketone.</p>',
  viewBox: '0 0 760 330',
  alt: 'Acetic acid with a curved arrow from the hydroxyl oxygen into the carbonyl and the resulting charge-separated contributor, beside acetone which has no lone-pair donor',
  build() {
    let s = '';
    s += tag(150, 44, 'acetic acid');
    const c1 = P(150, 140), o1 = P(150, 84), o2 = P(206, 174), h1 = P(252, 192), m1 = P(94, 174);
    s += bond(c1, o1, { order: 2 }); s += bond(c1, o2); s += bond(c1, m1);
    s += bond(o2, h1, { rTo: 10 });
    s += atom(m1.x, m1.y, 'CH₃');
    s += atom(o1.x, o1.y, 'O'); s += lonePair(o1.x, o1.y, 200);
    s += atom(o2.x, o2.y, 'O'); s += lonePair(o2.x, o2.y, 40); s += lonePair(o2.x, o2.y, 130);
    s += atom(h1.x, h1.y, 'H', { r: 10 });
    s += atom(c1.x, c1.y, 'C', { kind: 'hi' });
    s += curve(P(222, 190), P(182, 160), { bow: 24 });
    s += curve(P(168, 116), P(172, 94), { bow: 16 });

    s += arrow(P(266, 140), P(324, 140), { muted: true });
    s += text(295, 126, 'resonance', { cls: 'fg-tag', size: 10.5 });

    s += tag(404, 44, 'the contributor that matters');
    const c2 = P(404, 140), o3 = P(404, 84), o4 = P(460, 174), h2 = P(506, 192), m2 = P(348, 174);
    s += bond(c2, o3); s += bond(c2, o4, { order: 2 }); s += bond(c2, m2);
    s += bond(o4, h2, { rTo: 10 });
    s += atom(m2.x, m2.y, 'CH₃');
    s += atom(o3.x, o3.y, 'O', { kind: 'warn' }); s += text(430, 76, '−', { cls: 'fg-hi', size: 15 });
    s += atom(o4.x, o4.y, 'O', { kind: 'warn' }); s += text(486, 168, '+', { cls: 'fg-warn', size: 15 });
    s += atom(h2.x, h2.y, 'H', { r: 10 });
    s += atom(c2.x, c2.y, 'C', { kind: 'hi' });
    s += text(404, 214, 'carbon is no longer δ+', { cls: 'fg-sm', size: 10 });

    s += rule(536, 44, 536, 250);
    s += tag(616, 44, 'acetone');
    const c3 = P(616, 140), o5 = P(616, 84), m3 = P(560, 174), m4 = P(672, 174);
    s += bond(c3, o5, { order: 2 }); s += bond(c3, m3); s += bond(c3, m4);
    s += atom(m3.x, m3.y, 'CH₃'); s += atom(m4.x, m4.y, 'CH₃');
    s += atom(o5.x, o5.y, 'O'); s += lonePair(o5.x, o5.y, 200); s += lonePair(o5.x, o5.y, 340);
    s += atom(c3.x, c3.y, 'C', { kind: 'warn' });
    s += text(616, 214, 'no lone-pair donor', { cls: 'fg-sm', size: 10 });

    s += rule(24, 274, 726, 274);
    s += text(24, 300, 'The donation is happening in the NEUTRAL acid, before anything is removed.', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(24, 322, 'It cancels part of the carbonyl carbon’s δ+, so the acid is the worse electrophile.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'The same lone pair, doing its other job. In the carboxylate this donation spreads a negative charge; here, in the neutral acid, it pushes electron density onto a carbon that was supposed to be electrophilic. Acetone has only alkyl groups attached and no lone pair to give, which is why its carbonyl is the hungrier of the two.',
  note: 'This is the half of the section students skip, because "the O–H is very acidic" and "the C=O is very electrophilic" sound like the same claim about a very polar molecule. They are opposite claims, and the drawing is why: the donation that makes the anion stable is the donation that makes the carbonyl dull.',
});

/* ---------------------------------------------------------------- 167 ---
   Beta-keto acid decarboxylation. The section makes the ring size the whole
   argument -- "one carbon closer or further and the ring the proton would
   have to close is the wrong size" -- and then draws nothing, so the reader
   has to build a six-membered transition state in their head from prose. It
   also names an enol as the immediate product, which is exactly the kind of
   intermediate a scheme drops if it is not drawn. */
FIGURES.push({
  id: 'beta-keto-decarboxylation',
  section: 'carboxylic-acids',
  anchor: 'A malonic acid, with two carboxyls on one carbon, does the same thing for the same reason, one of its carboxyls playing the part of the ketone.</p>',
  viewBox: '0 0 760 356',
  alt: 'A beta-keto acid drawn inside a six-membered cyclic transition state with three curved arrows, giving an enol plus carbon dioxide, and the enol tautomerizing to the ketone',
  build() {
    let s = '';
    // ---- panel 1: the cyclic transition state -------------------------
    const cK = P(107, 192), cA = P(152, 218), cC = P(197, 192);
    const oH = P(197, 140), h = P(152, 114), oK = P(107, 140);
    const me = P(62, 218), oC = P(242, 218);
    s += tag(152, 62, 'the six-membered ring, closing');
    s += bond(cK, oK, { order: 2 });
    s += bond(cK, cA); s += bond(cA, cC); s += bond(cC, oH);
    s += bond(oH, h, { rTo: 10 });
    s += bond(cC, oC, { order: 2 });
    s += bond(cK, me);
    s += `<line class="fg-dash-hi" x1="${145.2}" y1="${121.5}" x2="${115.8}" y2="${138.5}"></line>`;
    s += atom(me.x, me.y, 'CH₃'); s += atom(oC.x, oC.y, 'O');
    s += atom(oK.x, oK.y, 'O'); s += lonePair(oK.x, oK.y, 200);
    s += atom(oH.x, oH.y, 'O'); s += lonePair(oH.x, oH.y, 20);
    s += atom(h.x, h.y, 'H', { r: 10 });
    s += atom(cK.x, cK.y, 'C', { kind: 'hi' });
    s += atom(cA.x, cA.y, 'C', { kind: 'warn' });
    s += atom(cC.x, cC.y, 'C', { kind: 'hi' });
    // 1: ketone O grabs the proton. 2: the O-H pair becomes CO2's second pi
    // bond. 3: the C-C bond to the carboxyl becomes the enol's pi bond.
    s += curve(P(90, 124), P(140, 108), { bow: -14 });
    s += curve(P(172, 124), P(191, 167), { bow: 20 });
    s += curve(P(172, 202), P(132, 202), { bow: 22 });
    s += text(152, 262, '3-oxobutanoic acid', { cls: 'fg-sm', size: 10 });

    s += arrow(P(285, 168), P(335, 168), { muted: true });
    s += text(310, 152, 'warm', { cls: 'fg-tag', size: 10.5 });
    s += text(310, 192, '− CO₂', { cls: 'fg-tag-warn', size: 10.5 });

    // ---- panel 2: the enol ---------------------------------------------
    const c2 = P(410, 168), oh2 = P(410, 122), me2 = P(364, 194), ch2 = P(456, 194);
    s += bond(c2, oh2); s += bond(c2, me2); s += bond(c2, ch2, { order: 2 });
    s += atom(oh2.x, oh2.y, 'OH'); s += atom(me2.x, me2.y, 'CH₃');
    s += atom(ch2.x, ch2.y, 'CH₂'); s += atom(c2.x, c2.y, 'C', { kind: 'hi' });
    s += tag(410, 62, 'the immediate product is an enol');
    s += text(410, 262, 'C=C and an O–H, not a ketone yet', { cls: 'fg-sm', size: 10 });

    s += arrow(P(500, 168), P(550, 168), { muted: true });
    s += text(525, 152, 'tautomerize', { cls: 'fg-tag', size: 10.5 });

    // ---- panel 3: the ketone -------------------------------------------
    const c3 = P(620, 168), o3 = P(620, 122), me3 = P(574, 194), me4 = P(666, 194);
    s += bond(c3, o3, { order: 2 }); s += bond(c3, me3); s += bond(c3, me4);
    s += atom(o3.x, o3.y, 'O'); s += lonePair(o3.x, o3.y, 200);
    s += atom(me3.x, me3.y, 'CH₃'); s += atom(me4.x, me4.y, 'CH₃');
    s += atom(c3.x, c3.y, 'C', { kind: 'hi' });
    s += tag(620, 62, 'what you isolate');
    s += text(620, 262, 'acetone', { cls: 'fg-sm', size: 10 });

    s += rule(24, 288, 726, 288);
    s += text(24, 314, 'Count the ring: ketone O, ketone C, alpha C, carboxyl C, carboxyl O, and the moving H.', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(24, 338, 'One carbon nearer and that ring is five-membered, one further and it is seven — neither closes.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'Three arrows going round one ring, all at once. The ketone oxygen reaches over and takes the carboxyl proton; the O–H electrons become the second pi bond of the departing CO₂; and the C–C bond that held the carboxyl on becomes the pi bond of an enol. Nothing else in the molecule has to move, which is why gentle warming is enough.',
  note: 'The enol is a real intermediate and not a bookkeeping device — the ring cannot deliver a ketone directly, because the proton it moved went onto the ketone oxygen. Tautomerization afterwards is fast and one-way, so what you isolate is the ketone, but a mechanism drawn straight from the ring to acetone has skipped a step a grader will look for. This is also the last step of the malonic and acetoacetic ester syntheses, where the same ring closes on a carboxyl or a ketone that was installed for exactly this purpose.',
});

export default FIGURES;
