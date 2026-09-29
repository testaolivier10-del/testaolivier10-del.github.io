/* Figures for the nitriles notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 56 ---
   Four reagents, four products, one starting material. Drawn as a hub so the
   carbon count can be written on each spoke, since the count is the thing
   students get wrong rather than the reagents. */
FIGURES.push({
  id: 'nitrile-four-ways',
  section: 'nitriles',
  anchor: '<h3>One carbon, four destinations</h3>',
  viewBox: '0 0 760 300',
  alt: 'A nitrile at the left with four labeled arrows to a carboxylic acid, a primary amine, an aldehyde and a ketone',
  build() {
    let s = '';
    s += panel(24, 116, 180, 62, { kind: 'warn' });
    s += text(114, 142, 'R\u2013C\u2261N', { cls: 'fg-lbl', size: 15 });
    s += text(114, 164, 'three bonds to N', { cls: 'fg-sm', size: 10 });

    const rows = [
      { y: 44,  rgt: 'H\u2083O\u207a or HO\u207b, heat',        prod: 'R\u2013COOH',                 note: 'via the amide \u00b7 same carbons' },
      { y: 108, rgt: 'LiAlH\u2084, then H\u2082O',              prod: 'R\u2013CH\u2082NH\u2082',   note: 'the CN carbon becomes the CH\u2082' },
      { y: 172, rgt: 'DIBAL-H, 1 eq, \u221278 \u00b0C',        prod: 'R\u2013CHO',                   note: 'stops at an imine anion' },
      { y: 236, rgt: "R\u2032MgX, then H\u2083O\u207a",        prod: "R\u2013CO\u2013R\u2032",    note: 'adds R\u2032 \u00b7 one addition only' },
    ];
    for (const r of rows) {
      s += arrow(P(216, 147), P(392, r.y + 6));
      s += text(400, r.y - 4, r.rgt, { cls: 'fg-tag', size: 11, anchor: 'start' });
      s += text(400, r.y + 16, r.prod, { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
      s += text(560, r.y + 16, r.note, { cls: 'fg-sm', size: 10, anchor: 'start' });
    }
    return s;
  },
  caption: 'One starting material, four destinations \u2014 only three of them a step off the rung, since hydrolysis to the acid is a sideways move. The carbon skeleton is the thing to watch. Only the Grignard row changes the carbon count, because only there does a new group arrive; the other three rearrange what the nitrile carbon already had.',
  note: 'The two reductions differ for a structural reason rather than a stoichiometric one. DIBAL-H adds a single hydride and the product of that addition is a metalated imine anion, which is not an electrophile, so nothing further can attack it however long you wait — the aldehyde appears only when water hydrolyzes it on workup. LiAlH\u2084 is not stopped by anything, so rationing it to one equivalent does not give you an aldehyde; it gives you a mixture. The reagent is crippled, not rationed.',
});

/* ---------------------------------------------------------------- 172 ---
   The nitrile’s "adds once and stops" argument turns on the intermediate
   being an anion rather than a carbonyl, and that species was never drawn. */
FIGURES.push({
  id: 'nitrile-stops-at-the-anion',
  section: 'nitriles',
  anchor: 'a nitrile never generates a carbonyl until the Grignard is gone.</p>',
  viewBox: '0 0 760 310',
  alt: 'A methyl Grignard adding once to a nitrile to give a metalated imine anion, which no second equivalent can attack, and the ketone that appears only on aqueous workup',
  build() {
    let s = '';
    const r1 = P(60, 140), c1 = P(124, 140), n1 = P(188, 140);
    s += bond(r1, c1); s += bond(c1, n1, { order: 3 });
    s += atom(r1.x, r1.y, 'R'); s += atom(n1.x, n1.y, 'N'); s += lonePair(n1.x, n1.y, 0);
    s += atom(c1.x, c1.y, 'C', { kind: 'hi' });
    s += text(124, 62, 'CH₃–MgBr', { cls: 'fg-lbl', size: 13 });
    s += curve(P(124, 76), P(124, 120), { bow: 22 });
    s += curve(P(156, 122), P(176, 120), { bow: -16 });
    s += tag(124, 196, 'the Grignard adds once');

    s += arrow(P(240, 140), P(300, 140));

    const c2 = P(390, 140), n2 = P(450, 140);
    s += bond(c2, n2, { order: 2 });
    s += bond(c2, P(334, 166)); s += bond(c2, P(334, 114));
    s += atom(334, 166, 'R'); s += atom(334, 114, 'CH₃');
    s += atom(n2.x, n2.y, 'N', { kind: 'warn' }); s += lonePair(n2.x, n2.y, 300);
    s += text(476, 132, '−', { cls: 'fg-hi', size: 15 });
    s += atom(c2.x, c2.y, 'C', { kind: 'hi' });
    s += text(462, 184, 'MgBr⁺', { cls: 'fg-sm', size: 10.5 });
    s += tag(390, 220, 'an anion — nothing here to attack');

    s += arrow(P(512, 140), P(568, 140));
    s += text(540, 124, 'H₃O⁺', { cls: 'fg-tag', size: 11 });

    const c3 = P(630, 140);
    s += bond(c3, P(630, 94), { order: 2 });
    s += bond(c3, P(586, 168)); s += bond(c3, P(674, 168));
    s += atom(630, 94, 'O'); s += lonePair(630, 94, 200);
    s += atom(586, 168, 'R'); s += atom(674, 168, 'CH₃');
    s += atom(c3.x, c3.y, 'C', { kind: 'hi' });
    s += tag(630, 220, 'the ketone');

    s += rule(24, 244, 726, 244);
    s += text(24, 270, 'An ester expels alkoxide and hands the Grignard a ketone, so it adds twice.', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(24, 294, 'A nitrile hands it an anion instead, and the reaction simply stops there.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'One addition, and then nothing. The Grignard’s carbon adds to the nitrile carbon and the pi electrons go onto nitrogen, giving a metalated imine — an <b>anion</b>, not a carbonyl. There is no electrophile left in the flask, so a second equivalent has nothing to do, however much of it is present.',
  note: 'This is the whole reason a nitrile gives a ketone where an ester gives a tertiary alcohol. The ester expels alkoxide half-way through and produces a ketone while the Grignard is still there, so the ketone is attacked in turn. The nitrile produces no carbonyl at all until water is added at the end, by which time the organometallic is gone.',
});

export default FIGURES;
