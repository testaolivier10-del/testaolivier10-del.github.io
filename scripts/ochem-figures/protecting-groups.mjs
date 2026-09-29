/* Figures for the protecting-groups notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------------ D4 ---
   What orthogonal actually means. The section defines it in a sentence and
   the sentence is not the hard part -- the hard part is believing that a
   reagent can remove one mask from a molecule and leave the other sitting
   there. That is a two-by-two claim, and a two-by-two claim wants a grid. */
FIGURES.push({
  id: 'orthogonal-grid',
  section: 'protecting-groups',
  anchor: '<h3>Orthogonality</h3>',
  alt: 'A grid crossing two protecting groups with two deprotection conditions, showing each condition removes one group and leaves the other',
  viewBox: '0 0 760 316',
  build() {
    let s = '';
    s += tag(380, 26, 'one molecule, two masks, two unrelated keys');

    s += panel(96, 40, 232, 62, { kind: 'hi' });
    s += label(212, 66, 'silyl ether', { size: 12.5 });
    s += text(212, 86, 'put on with TBSCl, imidazole', { cls: 'fg-sm', size: 9.5 });
    s += panel(432, 40, 232, 62, { kind: 'hi' });
    s += label(548, 66, 'cyclic acetal', { size: 12.5 });
    s += text(548, 86, 'put on with HOCH\u2082CH\u2082OH, H\u207A', { cls: 'fg-sm', size: 9.5 });
    s += rule(328, 78, 432, 78);
    s += text(380, 70, 'same molecule', { cls: 'fg-sm', size: 9 });

    s += rule(30, 124, 730, 124);
    s += rule(30, 192, 730, 192);
    s += rule(30, 260, 730, 260);
    s += rule(380, 124, 380, 260);

    s += label(30, 158, 'TBAF', { anchor: 'start', size: 12.5 });
    s += text(30, 174, 'fluoride', { cls: 'fg-sm', anchor: 'start', size: 9.5 });
    s += label(30, 226, 'H\u2083O\u207A', { anchor: 'start', size: 12.5 });
    s += text(30, 242, 'dilute, mild', { cls: 'fg-sm', anchor: 'start', size: 9.5 });

    s += text(212, 154, 'comes off \u2014 the O\u2013H is back', { cls: 'fg-tag-good', size: 11 });
    s += text(212, 174, 'Si\u2013F is exceptionally strong', { cls: 'fg-sm', size: 9.5 });
    s += text(548, 154, 'untouched', { cls: 'fg-tag-mut', size: 11 });
    s += text(548, 174, 'fluoride has nothing to do here', { cls: 'fg-sm', size: 9.5 });

    s += text(212, 222, 'survives if the acid is mild', { cls: 'fg-tag-mut', size: 11 });
    s += text(212, 242, 'harsher acid takes it off', { cls: 'fg-sm', size: 9.5 });
    s += text(548, 222, 'comes off \u2014 the C=O is back', { cls: 'fg-tag-good', size: 11 });
    s += text(548, 242, 'an equilibrium; water reverses it', { cls: 'fg-sm', size: 9.5 });

    s += text(380, 292, 'Each key spares the other mask (keep the acid mild), so they come off in either order.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Orthogonality is this grid having two blanks in it. The fluoride row is selective outright: fluoride has nothing to do with an acetal. The acid row is selective by degree: an acetal hydrolyzes under milder acid than a TBS ether needs, so with the acid kept mild and brief the silyl ether survives, and the molecule can carry both masks at once and be unmasked in whichever order the route needs.',
  note: 'The diagonal is what makes protecting groups plannable rather than a gamble. It also sets the trap the section warns about: because the acetal answers to aqueous acid, it cannot be carried through any later step that needs aqueous acid for its own reasons. And note that the silyl ether in the bottom-left cell is the bulky TBS one \u2014 a trimethylsilyl ether is small enough that mild aqueous acid takes it off too, and the grid would lose its blank. Even TBS only tolerates mild acid: acetic acid in aqueous THF, or HCl in methanol, is a standard way of removing it. Even TBS only tolerates mild acid: acetic acid in aqueous THF, or HCl in methanol, is a standard way of removing it.',
});

/* ------------------------------------------------------------------ D9 ---
   What the two masks actually are. The section describes both in words and
   the page contains no structure at all, so a reader finishes it able to
   recite "silyl ether" and "acetal" without being able to draw either. */
FIGURES.push({
  id: 'two-masks-drawn',
  section: 'protecting-groups',
  anchor: '<td>NaOH, H₂O, then H₃O⁺</td></tr>\n</tbody>\n</table>\n</div>',
  alt: 'An alcohol converted to a silyl ether and back with fluoride, and a ketone converted to a cyclic acetal and back with aqueous acid',
  viewBox: '0 0 700 350',
  build() {
    let s = '';
    s += tag(350, 26, 'what the two masks actually are');

    // Top row: the alcohol, and the proton that is the whole problem.
    s += bond(P(56, 106), P(104, 106), { rFrom: 14, rTo: 13 });
    s += bond(P(104, 106), P(150, 106), { rFrom: 13, rTo: 13 });
    s += atom(56, 106, 'R', { r: 14 });
    s += atom(104, 106, 'O', { r: 13 });
    s += atom(150, 106, 'H', { kind: 'warn', r: 13 });
    s += text(26, 150, 'pKₐ ≈ 16 — the proton that destroys a Grignard', { cls: 'fg-sm', anchor: 'start' });

    s += arrow(P(200, 96), P(370, 96));
    s += text(285, 80, 'TBSCl, imidazole', { cls: 'fg-sm' });
    s += arrow(P(370, 118), P(200, 118), { muted: true });
    s += text(285, 136, 'TBAF (F⁻)', { cls: 'fg-sm' });

    s += bond(P(410, 106), P(456, 106), { rFrom: 14, rTo: 13 });
    s += bond(P(456, 106), P(502, 106), { rFrom: 13, rTo: 16 });
    s += bond(P(502, 106), P(502, 66), { rFrom: 16, rTo: 17 });
    s += bond(P(502, 106), P(502, 146), { rFrom: 16, rTo: 17 });
    s += bond(P(502, 106), P(570, 106), { rFrom: 16, rTo: 32 });
    s += atom(410, 106, 'R', { r: 14 });
    s += atom(456, 106, 'O', { r: 13 });
    s += atom(502, 106, 'Si', { kind: 'hi' });
    s += atom(502, 66, 'CH₃', { r: 17 });
    s += atom(502, 146, 'CH₃', { r: 17 });
    s += atom(570, 106, 'C(CH₃)₃', { r: 32 });
    s += text(556, 180, 'no acidic proton left', { cls: 'fg-tag-good' });

    s += rule(26, 200, 674, 200);

    // Bottom row: the ketone, and the acetal that hides its electrophilic carbon.
    s += bond(P(52, 286), P(92, 264), { rFrom: 0, rTo: 0 });
    s += bond(P(92, 264), P(132, 286), { rFrom: 0, rTo: 0 });
    s += bond(P(92, 264), P(92, 222), { rFrom: 0, rTo: 15, order: 2 });
    s += atom(92, 222, 'O');
    s += text(122, 250, 'δ+', { cls: 'fg-lbl' });
    s += text(92, 314, 'electrophilic carbon', { cls: 'fg-sm' });

    s += arrow(P(190, 254), P(360, 254));
    s += text(275, 238, 'HOCH₂CH₂OH, H⁺, −H₂O', { cls: 'fg-sm' });
    s += arrow(P(360, 276), P(190, 276), { muted: true });
    s += text(275, 294, 'H₃O⁺', { cls: 'fg-sm' });

    // The 1,3-dioxolane, drawn as a real five-membered ring.
    const cxr = 462, cyr = 272, rr = 28;
    const pv = [];
    for (let i = 0; i < 5; i++) {
      const a = (-90 + i * 72) * Math.PI / 180;
      pv.push(P(cxr + Math.cos(a) * rr, cyr + Math.sin(a) * rr));
    }
    // pv[0] is the acetal carbon at the top; pv[1] and pv[4] are the oxygens.
    s += bond(pv[0], pv[1], { rFrom: 0, rTo: 13 });
    s += bond(pv[1], pv[2], { rFrom: 13, rTo: 0 });
    s += bond(pv[2], pv[3], { rFrom: 0, rTo: 0 });
    s += bond(pv[3], pv[4], { rFrom: 0, rTo: 13 });
    s += bond(pv[4], pv[0], { rFrom: 13, rTo: 0 });
    s += atom(pv[1].x, pv[1].y, 'O', { r: 13 });
    s += atom(pv[4].x, pv[4].y, 'O', { r: 13 });
    s += bond(pv[0], P(cxr - 42, cyr - 50), { rFrom: 0, rTo: 14 });
    s += bond(pv[0], P(cxr + 42, cyr - 50), { rFrom: 0, rTo: 14 });
    s += atom(cxr - 42, cyr - 50, 'R', { r: 14 });
    s += atom(cxr + 42, cyr - 50, 'R', { r: 14 });
    s += text(600, 266, 'two single bonds to O,', { cls: 'fg-tag-good' });
    s += text(600, 284, 'no π system to attack', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'What the two masks actually are. Both replace a reactive feature with two ordinary single bonds, and both put it back unchanged when the key arrives.',
  note: 'Count the bonds at the protected atom in each case: nothing has been oxidized or reduced, which is why a protection&ndash;deprotection pair costs you steps but never costs you an oxidation level. Note too that the bulk drawn on the silicon is doing work &mdash; the <i>tert</i>-butyl group is what makes a TBS ether survive mild aqueous acid, where a plain trimethylsilyl ether would not.',
});

export default FIGURES;
