/* Figures for the amine-reactions notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- 193 ---
   Four reaction types in the amine-reactions section and not one curved arrow
   anywhere in it. This is the acylation, which is also the section's thesis:
   the product nitrogen is switched off. */
FIGURES.push({
  id: 'amine-acylation-mechanism',
  section: 'amine-reactions',
  anchor: 'so it is no longer nucleophilic and no longer basic.</p>',
  viewBox: '0 0 760 430',
  alt: 'Ethylamine attacking acetyl chloride, the tetrahedral intermediate collapsing to expel chloride, deprotonation by triethylamine, and the amide product whose nitrogen lone pair is delocalized',
  build() {
    let s = '';
    /* 1 - the nitrogen attacks */
    let c = P(150, 124), o = P(150, 78), me = P(102, 156), x = P(198, 156);
    s += bond(c, o, { order: 2 }); s += bond(c, me); s += bond(c, x);
    s += atom(o.x, o.y, 'O'); s += lonePair(o.x, o.y, 200); s += lonePair(o.x, o.y, 340);
    s += atom(me.x, me.y, 'CH₃'); s += atom(x.x, x.y, 'Cl', { kind: 'warn' });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += atom(276, 84, 'EtNH₂', { kind: 'hi', r: 22 });
    s += lonePair(276, 84, 200, { dist: 28 });
    s += curve(P(248, 100), P(172, 112), { bow: 22 });
    s += curve(P(134, 104), P(132, 82), { bow: 14 });
    s += tag(160, 206, '1 · the lone pair adds');

    s += arrow(P(320, 124), P(372, 124));

    /* 2 - tetrahedral intermediate, chloride leaves */
    c = P(560, 124);
    s += bond(c, P(516, 84)); s += bond(c, P(608, 88)); s += bond(c, P(514, 166)); s += bond(c, P(606, 166));
    s += atom(516, 84, 'O⁻', { kind: 'warn' });
    s += lonePair(516, 84, 200, { dist: 20 });
    s += atom(608, 88, 'NH₂Et', { kind: 'hi' });
    s += text(646, 74, '⊕', { cls: 'fg-warn', size: 12 });
    s += atom(514, 166, 'CH₃'); s += atom(606, 166, 'Cl', { kind: 'warn' });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += curve(P(494, 70), P(534, 100), { bow: 18 });
    s += curve(P(588, 150), P(614, 184), { bow: -16 });
    s += tag(560, 206, '2 · kick the pair back down, chloride goes');

    s += rule(24, 230, 736, 230);

    /* 3 - deprotonation */
    c = P(150, 318); o = P(150, 272); me = P(102, 350); x = P(198, 350);
    s += bond(c, o, { order: 2 }); s += bond(c, me); s += bond(c, x);
    s += atom(o.x, o.y, 'O'); s += lonePair(o.x, o.y, 200);
    s += atom(me.x, me.y, 'CH₃');
    s += atom(x.x, x.y, 'NH₂Et', { kind: 'warn' });
    s += text(236, 336, '⊕', { cls: 'fg-warn', size: 12 });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += text(268, 290, 'Et₃N', { cls: 'fg-lbl', size: 12.5 });
    s += curve(P(252, 302), P(218, 334), { bow: 16 });
    s += text(60, 274, 'Cl⁻', { cls: 'fg-sm', size: 10.5 });
    s += tag(160, 400, '3 · a base takes the proton');

    s += arrow(P(320, 318), P(372, 318));

    /* 4 - the amide, switched off */
    c = P(540, 318); o = P(540, 272); me = P(492, 350); x = P(588, 350);
    s += bond(c, o, { order: 2 }); s += bond(c, me); s += bond(c, x);
    s += atom(o.x, o.y, 'O'); s += lonePair(o.x, o.y, 200); s += lonePair(o.x, o.y, 340);
    s += atom(me.x, me.y, 'CH₃');
    s += atom(x.x, x.y, 'NHEt', { kind: 'hi' });
    s += lonePair(x.x, x.y, 55);
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += curve(P(606, 372), P(570, 344), { bow: 20 });
    s += curve(P(524, 298), P(522, 276), { bow: 14 });
    s += tag(540, 400, '4 · and the pair goes straight into the carbonyl');
    s += text(636, 306, 'no lone pair', { cls: 'fg-tag-warn', size: 10.5, anchor: 'start' });
    s += text(636, 322, 'left to attack', { cls: 'fg-tag-warn', size: 10.5, anchor: 'start' });
    s += text(636, 338, 'anything: it', { cls: 'fg-tag-warn', size: 10.5, anchor: 'start' });
    s += text(636, 354, 'cannot go twice', { cls: 'fg-tag-warn', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'Addition then elimination &mdash; the acyl substitution pattern from the carboxylic acid derivatives chapter, unchanged &mdash; and then the reason this one self-terminates. The nitrogen that attacked in panel 1 is, by panel 4, delocalized into the very carbonyl it attacked.',
  note: 'Panel 2 is the step students most often skip. Chloride does not leave <i>as</i> the nitrogen arrives; the carbon goes tetrahedral first and the alkoxide then pushes the pair back down to expel it. That is why acyl substitution is addition&ndash;elimination and not S<sub>N</sub>2, and why an sp² carbon can be substituted at all. Panel 3 is also why a base is in the flask: without it that proton ends up on the next molecule of amine, and half your starting material sits out the reaction as its ammonium salt.',
});

/* ---------------------------------------------------------------- 194 ---
   Imine formation is named in three sections and drawn in none, although the
   hemiaminal is asked about in the practice bank. */
FIGURES.push({
  id: 'imine-formation',
  section: 'amine-reactions',
  anchor: 'so it loses an α C–H instead and gives an <b>enamine</b>.</p>',
  viewBox: '0 0 760 570',
  alt: 'The full imine formation sequence: attack, proton transfer to the hemiaminal, protonation of its OH, loss of water to the iminium ion, and deprotonation to the imine, with the enamine branch drawn below',
  build() {
    let s = '';
    const carbonyl = (cx, cy) => {
      let g = '';
      g += bond(P(cx, cy), P(cx, cy - 46), { order: 2 });
      g += bond(P(cx, cy), P(cx - 48, cy + 32));
      g += bond(P(cx, cy), P(cx + 48, cy + 32));
      g += atom(cx, cy - 46, 'O'); g += lonePair(cx, cy - 46, 200); g += lonePair(cx, cy - 46, 340);
      g += atom(cx - 48, cy + 32, 'R'); g += atom(cx + 48, cy + 32, 'R');
      g += atom(cx, cy, 'C', { kind: 'hi' });
      return g;
    };

    /* 1 - attack */
    s += carbonyl(120, 120);
    s += atom(244, 80, 'H₂NR′', { kind: 'hi', r: 22 });
    s += lonePair(244, 80, 200, { dist: 28 });
    s += curve(P(218, 96), P(142, 108), { bow: 22 });
    s += curve(P(104, 100), P(102, 78), { bow: 14 });
    s += tag(140, 196, '1 · the amine adds');

    /* 2 - zwitterion */
    s += bond(P(410, 124), P(366, 84)); s += bond(P(410, 124), P(458, 86));
    s += bond(P(410, 124), P(364, 166)); s += bond(P(410, 124), P(456, 166));
    s += atom(366, 84, 'O⁻', { kind: 'warn' }); s += lonePair(366, 84, 200, { dist: 20 });
    s += atom(458, 86, 'NH₂R′', { kind: 'hi' }); s += text(496, 72, '⊕', { cls: 'fg-warn', size: 12 });
    s += atom(364, 166, 'R'); s += atom(456, 166, 'R');
    s += atom(410, 124, 'C', { kind: 'hi' });
    s += curve(P(348, 70), P(444, 66), { bow: -26 });
    s += tag(410, 196, '2 · a proton moves across');

    /* 3 - the hemiaminal */
    s += bond(P(646, 124), P(602, 84)); s += bond(P(646, 124), P(694, 86));
    s += bond(P(646, 124), P(600, 166)); s += bond(P(646, 124), P(692, 166));
    s += atom(602, 84, 'OH'); s += atom(694, 86, 'NHR′', { kind: 'hi' });
    s += atom(600, 166, 'R'); s += atom(692, 166, 'R');
    s += atom(646, 124, 'C', { kind: 'hi' });
    s += tag(646, 196, '3 · HEMIAMINAL — rarely isolable');

    s += rule(24, 220, 736, 220);

    /* 4 - protonate the OH */
    s += bond(P(140, 324), P(96, 284)); s += bond(P(140, 324), P(188, 286));
    s += bond(P(140, 324), P(94, 366)); s += bond(P(140, 324), P(186, 366));
    s += atom(96, 284, 'OH₂', { kind: 'warn' }); s += text(66, 270, '⊕', { cls: 'fg-warn', size: 12 });
    s += atom(188, 286, 'NHR′', { kind: 'hi' }); s += lonePair(188, 286, 20, { dist: 20 });
    s += atom(94, 366, 'R'); s += atom(186, 366, 'R');
    s += atom(140, 324, 'C', { kind: 'hi' });
    s += curve(P(206, 306), P(162, 310), { bow: 16 });
    s += curve(P(122, 306), P(104, 300), { bow: 14 });
    s += tag(140, 400, '4 · H⁺ turns the OH into water');

    /* 5 - the iminium */
    s += bond(P(410, 324), P(410, 278), { order: 2 });
    s += bond(P(410, 324), P(362, 356)); s += bond(P(410, 324), P(458, 356));
    s += atom(410, 278, 'NHR′', { kind: 'warn' }); s += text(448, 264, '⊕', { cls: 'fg-warn', size: 12 });
    s += atom(362, 356, 'R'); s += atom(458, 356, 'R');
    s += atom(410, 324, 'C', { kind: 'hi' });
    s += text(312, 276, 'base', { cls: 'fg-tag', size: 10.5 });
    s += curve(P(330, 286), P(380, 272), { bow: 16 });
    s += tag(410, 400, '5 · IMINIUM ION, water gone');

    /* 6 - the imine */
    s += bond(P(646, 324), P(646, 278), { order: 2 });
    s += bond(P(646, 324), P(598, 356)); s += bond(P(646, 324), P(694, 356));
    s += atom(646, 278, 'NR′', { kind: 'hi' }); s += lonePair(646, 278, 340, { dist: 20 });
    s += atom(598, 356, 'R'); s += atom(694, 356, 'R');
    s += atom(646, 324, 'C', { kind: 'hi' });
    s += tag(646, 400, '6 · the IMINE');

    s += rule(24, 424, 736, 424);

    /* the enamine branch */
    s += text(24, 452, 'Branch — if the amine is SECONDARY, the iminium has no N–H to lose,', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(24, 474, 'so the base takes an α C–H instead and the C=C ends up outside the nitrogen:', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += bond(P(500, 512), P(560, 486), { order: 2 });
    s += bond(P(560, 486), P(620, 512));
    s += atom(500, 512, 'C', { kind: 'hi' }); s += atom(560, 486, 'C');
    s += atom(620, 512, 'NR′₂', { kind: 'hi' }); s += lonePair(620, 512, 20, { dist: 20 });
    s += text(560, 548, 'an ENAMINE — nucleophilic at the far carbon', { cls: 'fg-tag-good', size: 11 });
    s += text(210, 512, 'iminium + base', { cls: 'fg-sm', size: 10.5 });
    s += arrow(P(300, 512), P(460, 512), { muted: true });
    return s;
  },
  caption: 'Every step here is reversible, which is why imine formation is run at pH 4&ndash;5 and not at either extreme. Too basic and there is no acid to protonate the OH in panel 4, so the hemiaminal never dehydrates. Too acidic and the amine in panel 1 is protonated, has no lone pair, and never attacks at all.',
  note: 'Three later reactions are this sequence stopped at different points. Reductive amination reduces the panel-5 iminium before it can lose its proton. Enamine chemistry stops at the branch. And running the whole thing backwards with water is imine hydrolysis, which is how an imine used as a protecting group comes off. Note also where the new C&ndash;N bond is: on the old carbonyl carbon, every time.',
});

export default FIGURES;
