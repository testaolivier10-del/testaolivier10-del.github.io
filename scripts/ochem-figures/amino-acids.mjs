/* Figures for the amino-acids notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 10 ---
   Charge against pH. The notes give three species and two pKa values and
   expect the reader to assemble the picture; the picture is a number line,
   and drawing it makes the pI visibly the midpoint rather than a formula to
   memorize. */
FIGURES.push({
  id: 'zwitterion-ladder',
  section: 'amino-acids',
  anchor: '<h3>Stereochemistry: one carbon, one answer, two exceptions</h3>',
  viewBox: '0 0 760 310',
  alt: 'Glycine net charge plotted against pH, showing the cation below pKa 2.34, the zwitterion between, and the anion above pKa 9.60, with pI at 5.97',
  build() {
    let s = '';
    const x = (pH) => 70 + (pH / 14) * 620;
    s += rule(70, 196, 690, 196);
    for (let pH = 0; pH <= 14; pH += 2) {
      s += rule(x(pH), 196, x(pH), 203);
      s += text(x(pH), 218, String(pH), { cls: 'fg-sm', size: 10 });
    }
    s += text(380, 240, 'pH', { cls: 'fg-tag', size: 11 });

    const zones = [
      { a: 0,    b: 2.34, label: 'cation',     charge: '+1', kind: 'warn' },
      { a: 2.34, b: 9.60, label: 'zwitterion', charge: '0',  kind: 'hi'   },
      { a: 9.60, b: 14,   label: 'anion',      charge: '−1', kind: 'warn' },
    ];
    for (const z of zones) {
      const x1 = x(z.a), x2 = x(z.b);
      s += bar(x1, 128, x2 - x1, 52, { kind: z.kind === 'hi' ? 'hi' : 'warn', opacity: 0.32 });
      s += text((x1 + x2) / 2, 150, z.label, { cls: 'fg-lbl', size: 12 });
      s += text((x1 + x2) / 2, 168, 'net ' + z.charge, { cls: 'fg-sm', size: 10 });
    }

    for (const [pH, name] of [[2.34, 'pKₐ₁ 2.34'], [9.60, 'pKₐ₂ 9.60']]) {
      s += rule(x(pH), 104, x(pH), 196);
      s += text(x(pH), 96, name, { cls: 'fg-tag', size: 10.5 });
    }
    s += rule(x(5.97), 62, x(5.97), 128);
    s += text(x(5.97), 54, 'pI 5.97', { cls: 'fg-tag-good', size: 11 });
    s += text(x(5.97), 38, '½(2.34 + 9.60)', { cls: 'fg-sm', size: 10 });

    s += text(150, 272, 'below pI: cation → cathode', { cls: 'fg-sm', size: 10.5 });
    s += text(380, 272, 'at pI: no net charge, no migration', { cls: 'fg-tag-good', size: 10.5 });
    s += text(620, 272, 'above pI: anion → anode', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Glycine’s net charge against pH. The two pKa values are the only boundaries there are, so the molecule has exactly three states, and the isoelectric point sits at their midpoint because that is where the cation and anion populations are equal.',
  note: 'Reading the electrophoresis direction takes two inversions and they do not cancel: first compare the pH with the pI to get the sign, then remember that opposite charges attract. Getting one of the two backwards produces a confident wrong answer.',
});

/* ---------------------------------------------------------------- B2 ---
   An amino acid, drawn. The section spent its length on zwitterions, pI
   and electrophoresis without a single structure on the page, so the one
   thing a reader could not do was picture the molecule the argument is
   about. Three structures and two protons is the whole of it. */
FIGURES.push({
  id: 'amino-acid-charge-states',
  section: 'amino-acids',
  anchor: 'Sketching that three-species ladder is how nearly every amino acid question is solved.</div>',
  viewBox: '0 0 700 300',
  alt: 'Alanine at three pH values: the cation with COOH and NH3+, the zwitterion with carboxylate and ammonium, and the anion with carboxylate and a neutral amine',
  build() {
    let s = '';
    // One alanine, three times. Only the two ends change; the alpha carbon
    // and its methyl are the same atoms throughout, which is the point.
    const form = (cx, left, right, leftKind, rightKind) => {
      const c = P(cx, 120);
      let t = bond(P(cx - 58, 120), c, { rFrom: 20, rTo: 15 });
      t += bond(c, P(cx + 58, 120), { rFrom: 15, rTo: 20 });
      t += bond(c, P(cx, 172), { rFrom: 15, rTo: 17 });
      t += atom(cx - 58, 120, left, { r: 20, kind: leftKind });
      t += atom(cx, 120, 'CH');
      t += atom(cx + 58, 120, right, { r: 20, kind: rightKind });
      t += atom(cx, 172, 'CH₃', { r: 17 });
      return t;
    };
    s += panel(262, 48, 176, 164, { kind: 'hi' });
    s += form(128, 'HOOC', 'NH₃⁺', null, 'warn');
    s += form(350, '⁻OOC', 'NH₃⁺', 'hi', 'warn');
    s += form(572, '⁻OOC', 'NH₂', 'hi', null);
    s += tag(128, 32, 'pH 1 · net +1');
    s += tag(350, 32, 'pH 6 · net 0 · zwitterion');
    s += tag(572, 32, 'pH 11 · net −1');

    // Each arrow moves exactly one proton, which is why there are three
    // species and not four.
    s += arrow(P(212, 112), P(262, 112));
    s += arrow(P(262, 130), P(212, 130), { muted: true });
    s += tag(237, 98, 'pKa 2.34');
    s += arrow(P(434, 112), P(488, 112));
    s += arrow(P(488, 130), P(434, 130), { muted: true });
    s += tag(461, 98, 'pKa 9.69');

    s += rule(26, 232, 674, 232);
    s += label(350, 256, 'The carboxyl gives up its proton first; the ammonium keeps its own the longest.');
    s += text(350, 280, 'Two protons, three species — and the middle one is the neutral form.', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'Alanine at three pH values, with the charged groups on tinted discs. The middle structure is the one to internalize: the neutral form of an amino acid is not the form with two neutral groups, it is the form carrying two opposite charges at once.',
  note: 'Each arrow moves one proton and changes the net charge by exactly one, which is why an amino acid with a side chain that cannot ionize has three states and no more. Counting the states before reaching for a formula is what keeps a pI question from going wrong.',
});

/* ---------------------------------------------------------------- B3 ---
   L against D, drawn, because the rule the section now states is a rule
   about a picture and cannot be checked without one. */
FIGURES.push({
  id: 'l-and-d-alanine',
  section: 'amino-acids',
  anchor: 'reading CO–R–N clockwise gives L.</p>',
  viewBox: '0 0 700 310',
  alt: 'Two Fischer projections of alanine side by side, carboxyl at the top and methyl at the bottom, with the amino group on the left in L-alanine and on the right in D-alanine',
  build() {
    let s = '';
    const fischer = (cx, aminoLeft) => {
      const c = P(cx, 140);
      let t = bond(P(cx, 80), c, { rFrom: 20, rTo: 0 });
      t += bond(c, P(cx, 200), { rFrom: 0, rTo: 17 });
      t += bond(c, P(cx - 60, 140), { rFrom: 0, rTo: aminoLeft ? 17 : 15 });
      t += bond(c, P(cx + 60, 140), { rFrom: 0, rTo: aminoLeft ? 15 : 17 });
      t += atom(cx, 80, 'COOH', { r: 20 });
      t += atom(cx, 200, 'CH₃', { r: 17 });
      t += atom(cx - 60, 140, aminoLeft ? 'H₂N' : 'H', { r: aminoLeft ? 17 : 15, kind: aminoLeft ? 'hi' : null });
      t += atom(cx + 60, 140, aminoLeft ? 'H' : 'NH₂', { r: aminoLeft ? 15 : 17, kind: aminoLeft ? null : 'hi' });
      return t;
    };
    s += panel(40, 44, 300, 200, { kind: 'hi' });
    s += panel(360, 44, 300, 200);
    s += fischer(190, true);
    s += fischer(510, false);
    s += tag(190, 32, 'L-alanine — what biology uses');
    s += tag(510, 32, 'D-alanine — the mirror image');

    s += rule(50, 252, 650, 252);
    s += tag(190, 274, 'amino group on the left');
    s += tag(510, 274, 'amino group on the right');
    s += label(350, 298, 'Carboxyl up, side chain down, amino group left — that is all of the L assignment.');
    return s;
  },
  caption: 'The whole of the D/L assignment for an amino acid. Put the carboxyl at the top of a Fischer projection and the side chain at the bottom, then look at one bond: the amino group on the left is <b>L</b>, on the right is <b>D</b>. Nothing else in the drawing is consulted.',
  note: 'D/L is not R/S, and nothing here computes a CIP priority. That is why cysteine can be L like every other protein amino acid and still be assigned R — sulfur outranks the carboxyl carbon, so the priority order changes while the drawing does not.',
});

export default FIGURES;
