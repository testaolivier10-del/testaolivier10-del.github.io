/* Figures for the functional-group-interconversion notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------------ D3 ---
   The map the section says it is describing. The prose states outright that
   interconversions are "a map with two axes" and then gives a
   twenty-five-row table, which is a list. A reader cannot tell from the
   table that ester, acid and amide are the same height, or that alkene,
   halide and alcohol are -- and that height is the whole diagnostic. */
FIGURES.push({
  id: 'fgi-two-axes',
  section: 'functional-group-interconversion',
  anchor: '<h3>The moves worth knowing cold</h3>',
  alt: 'Functional group interconversions drawn as a grid: an oxidation ladder down the left and substitution moves across each level',
  viewBox: '0 0 760 416',
  build() {
    let s = '';
    s += tag(140, 44, 'up and down: oxidation level');
    s += tag(470, 44, 'across: same level, no redox reagent anywhere');

    // The ladder itself: two arrows, because the reagents differ by direction.
    s += arrow(P(44, 338), P(44, 92));
    s += arrow(P(80, 92), P(80, 338));
    s += tag(44, 80, '[O]');
    s += tag(80, 80, '[H]');

    const levels = [
      { y: 96,  name: 'carboxylic acid' },
      { y: 174, name: 'aldehyde / ketone' },
      { y: 252, name: 'alcohol' },
      { y: 330, name: 'alkane' },
    ];
    for (const l of levels) s += label(96, l.y + 4, l.name, { anchor: 'start', size: 12 });
    s += rule(240, 76, 240, 352);
    s += rule(244, 135, 700, 135);
    s += rule(244, 213, 700, 213);
    s += rule(244, 291, 700, 291);

    // Acid level: the acyl ladder, every step a substitution.
    s += label(252, 100, 'RCO\u2082H', { anchor: 'start', size: 12 });
    s += arrow(P(304, 96), P(348, 96));
    s += text(326, 84, 'SOCl\u2082', { cls: 'fg-sm', size: 9 });
    s += label(358, 100, 'RCOCl', { anchor: 'start', size: 12 });
    s += arrow(P(410, 96), P(454, 96));
    s += text(432, 84, 'R\u2032OH', { cls: 'fg-sm', size: 9 });
    s += label(464, 100, 'RCO\u2082R\u2032', { anchor: 'start', size: 12 });
    s += arrow(P(524, 96), P(568, 96));
    s += text(546, 84, 'R\u2082NH', { cls: 'fg-sm', size: 9 });
    s += label(578, 100, 'RCONR\u2082', { anchor: 'start', size: 12 });

    // Carbonyl level: the acetal, which is a sideways move and a mask.
    s += label(252, 178, 'R\u2082C=O', { anchor: 'start', size: 12 });
    s += arrow(P(312, 168), P(400, 168));
    s += text(356, 158, 'HOCH\u2082CH\u2082OH, H\u207A', { cls: 'fg-sm', size: 9 });
    s += arrow(P(400, 186), P(312, 186), { muted: true });
    s += text(356, 200, 'H\u2083O\u207A', { cls: 'fg-sm', size: 9 });
    s += label(412, 178, 'cyclic acetal', { anchor: 'start', size: 12 });
    s += text(412, 200, 'a sideways move, and a mask', { cls: 'fg-sm', size: 9.5, anchor: 'start' });

    // Alcohol level: alkene, halide and alcohol are one height.
    s += label(252, 256, 'R\u2013OH', { anchor: 'start', size: 12 });
    s += arrow(P(300, 252), P(352, 252));
    s += text(330, 240, 'PBr\u2083 or SOCl\u2082', { cls: 'fg-sm', size: 9 });
    s += label(362, 256, 'R\u2013X', { anchor: 'start', size: 12 });
    s += arrow(P(408, 252), P(470, 252));
    s += text(439, 240, 'bulky base (E2)', { cls: 'fg-sm', size: 9 });
    s += label(480, 256, 'alkene', { anchor: 'start', size: 12 });
    /* Started at x=480 while it read "H3O+ or BH3"; naming hydroboration's
       second step makes it long enough to run off the canvas from there. */
    s += text(396, 278, 'and back: H\u2083O\u207A, or BH\u2083 then H\u2082O\u2082/HO\u207B', { cls: 'fg-sm', size: 9.5, anchor: 'start' });

    s += label(252, 334, 'R\u2013H', { anchor: 'start', size: 12 });
    s += text(500, 334, 'nothing sideways from here \u2014 the only way out is up', { cls: 'fg-sm', size: 9.5 });

    s += text(380, 374, 'up: PCC, DMP, Jones     \u2022     down: NaBH\u2084, LiAlH\u2084, H\u2082 / Pd', { cls: 'fg-sm', size: 10 });
    s += text(380, 400, 'Every interconversion is one move: up, down, or across.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The table, drawn as the map it is. Height is oxidation level and needs an oxidant or a reductant to change; width is everything else, and costs no redox reagent at all. Asking which direction a step moves tells you which shelf the reagent comes from before you have named it.',
  note: 'The rows are worth reading for what shares a height. Ester, acid chloride, amide and acid are all one level, so interconverting them is substitution and never reduction \u2014 and an alkene, an alkyl halide and an alcohol are also one level, which is why the standard trick for moving an OH along a chain is to eliminate and add back, with no oxidation state changing anywhere in the two steps.',
});

/* ------------------------------------------------------------------ D8 ---
   The section's signature trick, which is a three-structure transformation
   described in one sentence. "Eliminate, then add back with the opposite
   regiochemistry" is the kind of claim a reader agrees with and then cannot
   reproduce, because what decides the answer is which of two reagents comes
   second. */
FIGURES.push({
  id: 'move-the-group-along',
  section: 'functional-group-interconversion',
  anchor: 'Using acid-catalyzed hydration in step 2 would put the OH straight back where it started. The whole synthesis turns on choosing the anti-Markovnikov reagent, which is exactly the kind of pair the note above is about.</p>',
  alt: 'Propan-2-ol dehydrated to propene, then hydrated two ways: hydroboration gives propan-1-ol and acid gives propan-2-ol back',
  /* 660 wide: it sits inside a worked example, whose column is narrower. */
  viewBox: '0 0 660 330',
  build() {
    let s = '';
    s += tag(330, 26, 'the same alkene, two ways down');

    s += bond(P(44, 190), P(79, 168), { rFrom: 0, rTo: 0 });
    s += bond(P(79, 168), P(114, 190), { rFrom: 0, rTo: 0 });
    s += bond(P(79, 168), P(79, 124), { rFrom: 0, rTo: 15 });
    s += atom(79, 124, 'OH', { kind: 'hi' });
    s += text(79, 214, 'propan-2-ol', { cls: 'fg-sm' });

    s += arrow(P(146, 168), P(250, 168));
    s += text(198, 150, 'conc. H₂SO₄, heat (E1)', { cls: 'fg-sm' });

    s += bond(P(274, 190), P(309, 168), { rFrom: 0, rTo: 0, order: 2, gap: 3.5 });
    s += bond(P(309, 168), P(344, 190), { rFrom: 0, rTo: 0 });
    s += text(309, 214, 'propene', { cls: 'fg-sm' });

    // Upper branch: hydroboration moves the oxygen to the far carbon.
    s += arrow(P(376, 152), P(474, 110));
    s += text(436, 80, '1. BH₃   2. H₂O₂, HO⁻', { cls: 'fg-sm' });
    s += bond(P(500, 124), P(535, 102), { rFrom: 0, rTo: 0 });
    s += bond(P(535, 102), P(570, 124), { rFrom: 0, rTo: 0 });
    s += bond(P(570, 124), P(605, 102), { rFrom: 0, rTo: 15 });
    s += atom(605, 102, 'OH', { kind: 'hi' });
    s += text(528, 150, 'propan-1-ol', { cls: 'fg-sm' });
    s += text(556, 172, 'anti-Markovnikov — the OH moved', { cls: 'fg-tag-good' });

    // Lower branch: acid puts it straight back.
    s += arrow(P(376, 186), P(474, 230), { muted: true });
    s += text(424, 262, 'H₃O⁺', { cls: 'fg-sm' });
    s += bond(P(505, 244), P(540, 222), { rFrom: 0, rTo: 0 });
    s += bond(P(540, 222), P(575, 244), { rFrom: 0, rTo: 0 });
    s += bond(P(540, 222), P(540, 278), { rFrom: 0, rTo: 15 });
    s += atom(540, 278, 'OH', { kind: 'warn' });
    s += text(612, 222, 'propan-2-ol', { cls: 'fg-sm' });
    s += text(550, 314, 'Markovnikov — straight back to C2', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'The same alkene, two ways down. Eliminating is the easy half; the synthesis is decided entirely by which hydration reagent you pick afterwards.',
  note: 'Nothing is oxidized or reduced anywhere in this picture &mdash; alcohol and alkene sit on the same rung of the ladder &mdash; which is the tell that a "move the group along the chain" problem never needs a redox reagent. If you find yourself reaching for an oxidant, you have misread the question.',
});

export default FIGURES;
