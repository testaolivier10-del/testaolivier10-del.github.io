/* Figures for the organolithium-reagents notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 35 ---
   Why one reaction stops at the ketone and the other does not. Both go
   through a tetrahedral intermediate; the difference is entirely whether
   that intermediate can collapse in the flask. */
FIGURES.push({
  id: 'dianion-stops',
  section: 'organolithium-reagents',
  anchor: '<h3>Deprotonation as the goal</h3>',
  viewBox: '0 0 760 320',
  alt: 'The tetrahedral intermediate from an ester, with curved arrows showing the alkoxide pushing back down and the OR group leaving, beside the dianion from a carboxylate where the same two arrows are drawn struck through because they would expel an oxide dianion',
  build() {
    let s = '';
    const col = (ox, title, charges, verdict, kind, out) => {
      s += panel(ox, 42, 330, 172, { kind });
      s += tag(ox + 165, 32, title);
      const c = P(ox + 165, 112);
      s += atom(c.x, c.y, 'C', { kind: kind === 'warn' ? 'warn' : 'hi' });
      s += atom(c.x, c.y - 48, 'O', { });
      s += atom(c.x - 58, c.y + 30, 'O', { });
      s += atom(c.x + 58, c.y + 30, 'R', { });
      s += atom(c.x, c.y + 54, 'R\u2032', { kind: 'hi' });
      s += bond(c, P(c.x, c.y - 48));
      s += bond(c, P(c.x - 58, c.y + 30));
      s += bond(c, P(c.x + 58, c.y + 30));
      s += bond(c, P(c.x, c.y + 54));
      s += text(c.x + 22, c.y - 52, charges[0], { cls: 'fg-lbl', size: 13 });
      s += text(c.x - 80, c.y + 26, charges[1], { cls: 'fg-lbl', size: 13 });
      s += text(c.x + 34, c.y + 62, 'from RLi', { cls: 'fg-sm', size: 9.5 });
      s += text(ox + 165, 202, verdict, { cls: kind === 'warn' ? 'fg-tag' : 'fg-tag-good', size: 11 });
      s += text(ox + 165, 236, out, { cls: 'fg-sm', size: 10.5 });
    };
    col(24,  'from an ester',      ['−', 'R'], 'collapses in the flask', 'warn',
        'the ketone forms, and is attacked again');
    col(406, 'from a carboxylate', ['−', '−'], 'cannot collapse — two charges', null,
        'the ketone appears only on workup');

    /* The arrows are the argument. Drawn once on the left, where they are
       what happens, and again on the right struck through, where they are
       what would have to happen and cannot. A static pair of structures left
       the reader to supply the collapse from memory. */
    s += curve(P(165, 72), P(180, 96), { bow: 16 });
    s += curve(P(166, 134), P(108, 166), { bow: -16 });

    s += curve(P(547, 72), P(562, 96), { bow: 16, muted: true });
    s += curve(P(548, 134), P(490, 166), { bow: -16, muted: true });
    s += bond(P(542, 96), P(570, 68), { rFrom: 0, rTo: 0 });
    s += bond(P(506, 134), P(542, 162), { rFrom: 0, rTo: 0 });

    s += rule(34, 248, 726, 248);
    s += text(380, 274, 'Nothing protects the ketone in the second case. There is no ketone to protect', { cls: 'fg-lbl', size: 12 });
    s += text(380, 296, 'until the reagent has already been used up.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Why RLi takes a carboxylic acid to a ketone and stops, while a Grignard takes an ester past one. Both add to a carbonyl and both give a tetrahedral intermediate. The ester’s has an alkoxide to expel, so it collapses at once; the carboxylate’s is a dianion, and expelling anything from it would mean pushing charge onto an already charged center.',
  note: 'Two equivalents of RLi are needed here, and they do different jobs: the first is spent taking the acidic O–H proton, and only the second adds. The organolithium is doing something a Grignard cannot, which is attacking a carbonyl that already carries a full negative charge.',
});

/* ---------------------------------------------------------------- C4 ---
   The acetylide does an S_N2, and three bank items test it, and nothing in
   the chapter draws a backside attack. The second panel is the limit: the
   same reagent on a secondary halide is a base. */
FIGURES.push({
  id: 'acetylide-substitutes-or-eliminates',
  section: 'organolithium-reagents',
  anchor: 'With a secondary or tertiary halide the acetylide is basic enough that E2 wins and you get an alkene instead of the coupled product. Primary or methyl only.</div>',
  viewBox: '0 0 700 466',
  alt: 'An acetylide attacking bromoethane from the side opposite bromine to give pent-2-yne, and the same acetylide instead removing a beta hydrogen from 2-bromopropane to give propene by E2',
  build() {
    let s = '';
    const acetylide = (x, y) => {
      let t = '';
      t += bond(P(x, y), P(x + 48, y), { rFrom: 17, rTo: 15 });
      t += bond(P(x + 48, y), P(x + 96, y), { order: 3, gap: 3.6, rFrom: 15, rTo: 15 });
      t += atom(x, y, 'CH₃', { r: 17 });
      t += atom(x + 48, y, 'C');
      t += atom(x + 96, y, 'C', { kind: 'hi' });
      t += text(x + 116, y - 12, '⊖', { cls: 'fg-lbl', size: 13 });
      t += lonePair(x + 96, y, 60);
      return t;
    };

    /* Substitution. */
    s += panel(24, 44, 652, 170);
    s += acetylide(80, 110);
    s += bond(P(300, 110), P(300, 158), { rFrom: 16, rTo: 17 });
    s += bond(P(300, 110), P(356, 110), { rFrom: 16, rTo: 15 });
    s += atom(300, 158, 'CH₃', { r: 17 });
    s += atom(356, 110, 'Br', { kind: 'warn' });
    s += atom(300, 110, 'CH₂', { kind: 'warn', r: 17 });
    s += curve(P(192, 124), P(278, 116), { bow: 22 });
    s += curve(P(334, 118), P(374, 140), { bow: -18 });
    s += arrow(P(420, 110), P(470, 110));
    s += label(566, 106, 'CH₃C≡C–CH₂CH₃');
    s += tag(566, 140, 'pent-2-yne, the product you wanted');
    s += text(130, 190, 'primary halide: substitution', { cls: 'fg-tag-good', size: 11 });

    /* Elimination. */
    s += panel(24, 232, 652, 170);
    s += acetylide(80, 298);
    s += bond(P(300, 300), P(352, 274), { rFrom: 16, rTo: 15 });
    s += bond(P(300, 300), P(300, 352), { rFrom: 16, rTo: 17 });
    s += bond(P(300, 300), P(248, 274), { rFrom: 16, rTo: 17 });
    s += bond(P(248, 274), P(206, 252), { rFrom: 17, rTo: 15 });
    s += atom(352, 274, 'Br', { kind: 'warn' });
    s += atom(300, 352, 'CH₃', { r: 17 });
    s += atom(248, 274, 'CH₂', { r: 17 });
    s += atom(206, 252, 'H', { kind: 'warn' });
    s += atom(300, 300, 'C', { kind: 'warn' });
    s += curve(P(192, 292), P(194, 266), { bow: -20 });
    s += curve(P(222, 258), P(268, 280), { bow: -20 });
    s += curve(P(322, 286), P(376, 250), { bow: 20 });
    s += arrow(P(420, 300), P(470, 300));
    s += label(552, 296, 'CH₃CH=CH₂  +  CH₃C≡CH');
    s += tag(552, 330, 'propene, and your alkyne back');
    s += text(130, 378, 'secondary halide: elimination', { cls: 'fg-tag-warn', size: 11 });

    s += rule(20, 420, 680, 420);
    s += label(350, 444, 'What the halide is decides which of the two roles the acetylide plays.');
    return s;
  },
  caption: 'An acetylide is a nucleophile and a strong base in the same molecule, and the halide decides which one it gets to be. On a primary carbon the backside is open and substitution wins; on a secondary carbon it is crowded, so the reagent takes a &beta; hydrogen instead and you isolate an alkene.',
  note: 'Notice where the arrow starts in each panel. In the top one it leaves the carbanion and arrives at <i>carbon</i>, opposite the leaving group; in the bottom one it leaves the same carbanion and arrives at a <b>hydrogen</b> two bonds away from the halide. Same reagent, same lone pair, different target &mdash; which is the whole of the substitution-versus-elimination question, met again with a carbon base.',
});

export default FIGURES;
