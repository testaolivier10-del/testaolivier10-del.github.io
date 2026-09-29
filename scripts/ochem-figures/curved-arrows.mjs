/* Figures for the curved-arrows notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- 103 ---
   The four arrow-pushing patterns. The notes had shown two of them (a
   protonation and an SN2) and the practice bank was already testing a
   hydride shift and a lone departure, so a student met two patterns in
   prose and four in the questions. All four, drawn on real molecules with
   the charges worked out, is the whole vocabulary on one page. */
FIGURES.push({
  id: 'arrow-patterns',
  section: 'curved-arrows',
  anchor: '<h3>The four patterns, and that is the whole list</h3>',
  alt: 'Four arrow-pushing patterns drawn on real molecules: nucleophilic attack on a carbocation, loss of bromide from a tertiary bromide, proton transfer from HCl to hydroxide, and a 1,2-hydride shift',
  viewBox: '0 0 760 430',
  build() {
    let s = '';

    // ---- 1. Nucleophilic attack, one arrow, because the target has room ----
    s += tag(190, 42, '1 \u00b7 NUCLEOPHILIC ATTACK');
    s += atom(96, 116, 'HO\u207b', { kind: 'hi', size: 10.5 });
    for (const ang of [-150, -90, 150]) s += lonePair(96, 116, ang, { dist: 24 });
    s += atom(266, 116, 'C\u207a', { kind: 'warn', size: 11 });
    s += text(266, 148, '(CH\u2083)\u2083C\u207a', { cls: 'fg-sm', size: 9.5 });
    s += curve(P(120, 100), P(248, 108), { bow: -26 });
    s += text(190, 174, 'one arrow is the whole step:', { cls: 'fg-sm', size: 10 });
    s += text(190, 190, 'the carbon has an empty orbital,', { cls: 'fg-sm', size: 10 });
    s += text(190, 206, 'so nothing has to break', { cls: 'fg-sm', size: 10 });

    s += rule(380, 34, 380, 396);

    // ---- 2. Loss of a leaving group, one arrow, no attacker at all ----
    s += tag(560, 42, '2 \u00b7 LOSS OF A LEAVING GROUP');
    s += atom(492, 116, 'C', { size: 11 });
    s += text(492, 148, '(CH\u2083)\u2083C', { cls: 'fg-sm', size: 9.5 });
    s += atom(614, 116, 'Br', { size: 11 });
    s += bond(P(492, 116), P(614, 116));
    s += curve(P(553, 116), P(614, 96), { bow: -20 });
    s += text(560, 174, 'tail on the C\u2013Br bond, head on Br:', { cls: 'fg-sm', size: 10 });
    s += text(560, 190, 'carbon keeps three bonds and goes +1,', { cls: 'fg-sm', size: 10 });
    s += text(560, 206, 'bromine keeps the pair and goes \u22121', { cls: 'fg-sm', size: 10 });

    s += rule(34, 226, 726, 226);

    // ---- 3. Proton transfer, two arrows, always ----
    s += tag(190, 258, '3 \u00b7 PROTON TRANSFER');
    s += atom(86, 330, 'HO\u207b', { kind: 'hi', size: 10.5 });
    for (const ang of [-150, -90, 150]) s += lonePair(86, 330, ang, { dist: 24 });
    s += atom(212, 330, 'H', { size: 11 });
    s += atom(310, 330, 'Cl', { size: 11 });
    s += bond(P(212, 330), P(310, 330));
    s += curve(P(110, 314), P(196, 318), { bow: -22 });
    s += curve(P(261, 330), P(310, 310), { bow: -18 });
    s += text(190, 380, 'arrow 1 makes the new O\u2013H bond;', { cls: 'fg-sm', size: 10 });
    s += text(190, 396, 'arrow 2 breaks the old H\u2013Cl bond', { cls: 'fg-sm', size: 10 });

    // ---- 4. Rearrangement: a sigma bond is a legal electron source ----
    s += tag(560, 258, '4 \u00b7 1,2-HYDRIDE SHIFT');
    s += atom(492, 330, 'C', { size: 11 });
    s += atom(492, 282, 'H', { size: 10.5 });
    s += bond(P(492, 330), P(492, 282));
    s += atom(614, 330, 'C\u207a', { kind: 'warn', size: 11 });
    s += bond(P(492, 330), P(614, 330));
    s += curve(P(492, 306), P(600, 314), { bow: -30 });
    s += text(560, 380, 'the C\u2013H pair moves onto the cation;', { cls: 'fg-sm', size: 10 });
    s += text(560, 396, 'the + ends up where it came from', { cls: 'fg-sm', size: 10 });

    s += rule(34, 408, 726, 408);
    s += text(380, 424, 'Every mechanism in the course is these four, in some order.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The complete vocabulary. Two of these need a partner arrow and two do not, and the difference is only ever whether the destination already has a full valence shell.',
  note: 'Pattern 2 is the one to practice deliberately. It is the only pattern where nothing attacks anything &mdash; a bond just breaks, with both electrons going to one side &mdash; and because there is no attacker to point at, students often refuse to draw it and then cannot start an S<sub>N</sub>1 or an E1. The test is the same as always: name the pair the tail stands on. Here it is the C&ndash;Br bonding pair, which is a perfectly ordinary place for an arrow to begin.',
});

export default FIGURES;
