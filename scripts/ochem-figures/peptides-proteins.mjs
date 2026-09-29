/* Figures for the peptides-proteins notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 11 ---
   One resonance structure, three consequences. The notes list them; the
   drawing puts the arrow that causes all three next to the properties it
   causes, which is the only way the list stops looking like three facts. */
FIGURES.push({
  id: 'amide-planarity',
  section: 'peptides-proteins',
  anchor: '<h3>Four levels of structure</h3>',
  viewBox: '0 0 760 320',
  alt: 'Amide resonance pushing the nitrogen lone pair into the carbonyl, with the resulting planar unit and its three consequences',
  build() {
    let s = '';
    const draw = (ox, dbl) => {
      const c = P(ox + 70, 112), o = P(ox + 70, 58), nAt = P(ox + 128, 142), ca = P(ox + 12, 142);
      let t = '';
      t += atom(ca.x, ca.y, 'Cα', { });
      t += atom(c.x, c.y, 'C', { kind: 'hi' });
      t += atom(o.x, o.y, 'O', { });
      t += atom(nAt.x, nAt.y, 'N', { kind: 'hi' });
      t += bond(ca, c);
      t += bond(c, o, { order: dbl ? 1 : 2 });
      t += bond(c, nAt, { order: dbl ? 2 : 1 });
      if (dbl) {
        t += text(o.x + 26, o.y - 4, '−', { cls: 'fg-lbl', size: 13 });
        t += text(nAt.x + 24, nAt.y - 12, '+', { cls: 'fg-lbl', size: 13 });
      } else {
        t += lonePair(nAt.x, nAt.y, 20);
      }
      return t;
    };
    s += draw(30, false);
    s += draw(400, true);
    s += curve(P(190, 136), P(130, 84), { bow: 26 });
    s += arrow(P(250, 112), P(330, 112));
    s += text(290, 100, 'resonance', { cls: 'fg-tag', size: 10.5 });
    s += text(160, 188, 'the lone pair is donated', { cls: 'fg-sm', size: 10 });
    s += text(530, 188, 'C–N is partly double', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(34, 214, 726, 214);
    const cons = [
      ['planar and rigid', 'six atoms in one plane; no free rotation'],
      ['nitrogen is not basic', 'that lone pair is already spent'],
      ['least reactive acyl derivative', 'hydrolysis wants hot acid or an enzyme'],
    ];
    cons.forEach((c, i) => {
      const cx = 150 + i * 230;
      s += text(cx, 246, c[0], { cls: 'fg-lbl', size: 12 });
      s += text(cx, 266, c[1], { cls: 'fg-sm', size: 10 });
    });
    s += text(380, 298, 'Three separate exam questions, one cause.', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'The second resonance structure of an amide, and what follows from it. Pushing the nitrogen lone pair into the carbonyl gives the C–N bond partial double-bond character, and planarity, low basicity and low reactivity all fall out of that one move.',
  note: 'The basicity consequence is the one that inverts against intuition. A lone pair on nitrogen looks like a base, and here it is the reason the nitrogen is not one — delocalization makes a lone pair less available, not more.',
});

/* ---------------------------------------------------------------- B4 ---
   One amide, actually made. The section's only figure drew a generic amide
   with no side chains and no N–H; a reader was told that Gly-Ala and
   Ala-Gly are different compounds without ever seeing why the order is a
   structural statement. */
FIGURES.push({
  id: 'peptide-bond-formed',
  section: 'peptides-proteins',
  anchor: 'it is the same linkage as any amide, with the same consequences.</p>',
  viewBox: '0 0 700 430',
  alt: 'Alanine and serine condensing to the dipeptide Ala-Ser, with the serine nitrogen attacking the alanine carboxyl, loss of water, and the resulting amide shaded and labeled the peptide bond',
  build() {
    let s = '';
    // An amino acid, condensed: amine, alpha carbon, carboxyl, side chain
    // hanging below the alpha carbon where it belongs.
    const aa = (x, y, side, sideR) => {
      let t = bond(P(x, y), P(x + 60, y), { rFrom: 17, rTo: 15 });
      t += bond(P(x + 60, y), P(x + 126, y), { rFrom: 15, rTo: 20 });
      t += bond(P(x + 60, y), P(x + 60, y + 52), { rFrom: 15, rTo: sideR });
      t += atom(x, y, 'H₂N', { r: 17 });
      t += atom(x + 60, y, 'CH');
      t += atom(x + 126, y, 'COOH', { r: 20 });
      t += atom(x + 60, y + 52, side, { r: sideR });
      return t;
    };
    s += aa(70, 100, 'CH₃', 17);
    s += aa(300, 100, 'CH₂OH', 20);
    s += text(130, 190, 'alanine', { cls: 'fg-tag' });
    s += text(360, 190, 'serine', { cls: 'fg-tag' });
    // The bond that is about to be made, as the one arrow that makes it.
    s += curve(P(286, 86), P(216, 86), { bow: 18 });
    s += tag(251, 56, 'N attacks C');

    s += arrow(P(530, 200), P(530, 244));
    s += tag(572, 226, '− H₂O');

    /* the dipeptide, with the new amide shaded */
    s += bar(234, 214, 102, 96, { kind: 'hi', opacity: 0.22 });
    const y2 = 286;
    s += bond(P(142, y2), P(202, y2), { rFrom: 17, rTo: 15 });
    s += bond(P(202, y2), P(258, y2), { rFrom: 15, rTo: 15 });
    s += bond(P(258, y2), P(258, 238), { rFrom: 15, rTo: 15, order: 2 });
    s += bond(P(258, y2), P(314, y2), { rFrom: 15, rTo: 17 });
    s += bond(P(314, y2), P(374, y2), { rFrom: 17, rTo: 15 });
    s += bond(P(374, y2), P(440, y2), { rFrom: 15, rTo: 20 });
    s += bond(P(202, y2), P(202, 334), { rFrom: 15, rTo: 17 });
    s += bond(P(374, y2), P(374, 334), { rFrom: 15, rTo: 20 });
    s += atom(142, y2, 'H₂N', { r: 17 });
    s += atom(202, y2, 'CH');
    s += atom(258, y2, 'C', { kind: 'hi' });
    s += atom(258, 238, 'O');
    s += atom(314, y2, 'NH', { r: 17, kind: 'hi' });
    s += atom(374, y2, 'CH');
    s += atom(440, y2, 'COOH', { r: 20 });
    s += atom(202, 334, 'CH₃', { r: 17 });
    s += atom(374, 334, 'CH₂OH', { r: 20 });
    s += tag(142, 246, 'N-terminus');
    s += tag(440, 246, 'C-terminus');
    s += tag(285, 330, 'peptide bond');
    s += text(350, 380, 'Ala-Ser, written N to C', { cls: 'fg-tag-good', size: 11 });

    s += rule(26, 398, 674, 398);
    s += label(350, 420, 'Alanine gave the carboxyl, so alanine is the N-terminal residue.');
    return s;
  },
  caption: 'One amide, made the ordinary way. Alanine supplies the carboxyl and serine supplies the amine, so alanine ends up at the N-terminus and the name reads <b>Ala-Ser</b>. Swapping which molecule supplies which group gives Ser-Ala — a different compound, not a different name for this one.',
  note: 'Count the groups left over. The dipeptide still has a free amine at one end and a free carboxyl at the other, which is exactly why the uncontrolled reaction does not stop at a dipeptide, and why a deliberate synthesis has to cap one end of each partner before it starts.',
});

/* ---------------------------------------------------------------- B5 ---
   The two secondary structures, which are three-dimensional objects the
   section names twice and never draws. Both are one interaction arranged
   two ways, and that is only visible side by side. */
FIGURES.push({
  id: 'helix-and-sheet',
  section: 'peptides-proteins',
  anchor: '<b>Quaternary</b> — how two or more separate folded chains assemble. Hemoglobin\'s four subunits are the standard example; not every protein has this level.</li>',
  viewBox: '0 0 680 350',
  alt: 'An alpha helix drawn as a coil with dashed hydrogen bonds running parallel to its axis and side chains projecting outward, beside two antiparallel beta strands with four dashed hydrogen bonds running between them',
  build() {
    let s = '';
    s += panel(24, 52, 308, 220);
    s += panel(348, 52, 308, 220);
    s += tag(178, 38, 'α-helix');
    s += tag(502, 38, 'β-pleated sheet');

    /* The helix as its projection. The cosine term is what makes it read as
       a coil rather than a sine wave: it lifts the near half of each turn
       and drops the far half, which is what a spring looks like on paper. */
    const cx = 150, y0 = 74, span = 176, amp = 46, lift = 14;
    let d = '';
    for (let i = 0; i <= 180; i++) {
      const t = (i / 180) * 6 * Math.PI;
      const x = cx + amp * Math.sin(t), y = y0 + (i / 180) * span - lift * Math.cos(t);
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    s += `<path class="fg-bond" d="${d.trim()}"></path>`;
    // Hydrogen bonds run PARALLEL to the axis, which is the whole geometric
    // claim: the two partners are one turn - four residues - apart.
    for (const [a, b] of [[118, 177], [177, 236]]) {
      s += `<line class="fg-dash-hi" x1="${cx - amp}" y1="${a}" x2="${cx - amp}" y2="${b}"></line>`;
    }
    for (const [a, b] of [[89, 148], [148, 207]]) {
      s += `<line class="fg-dash-hi" x1="${cx + amp}" y1="${a}" x2="${cx + amp}" y2="${b}"></line>`;
    }
    // Side chains, as sticks leaving the coil: they take no part in either
    // pattern, which is why any sequence can form either.
    for (const y of [104, 163, 222]) s += bond(P(cx + amp, y), P(cx + amp + 28, y), { rFrom: 0, rTo: 0 });
    s += tag(108, 292, 'H-bonds run i to i+4');
    s += tag(252, 292, 'side chains point out');

    /* Two antiparallel strands, drawn as the pleats they are named for. */
    const strand = (x1, x2, yMid, down) => {
      let t = '', up = down;
      for (let x = x1; x < x2; x += 30) {
        t += `<line class="fg-bond" x1="${x}" y1="${yMid + (up ? 10 : -10)}" x2="${x + 30}" y2="${yMid + (up ? -10 : 10)}"></line>`;
        up = !up;
      }
      return t;
    };
    s += strand(372, 612, 110, true);
    s += strand(372, 612, 200, false);
    s += arrow(P(612, 100), P(640, 100));
    s += arrow(P(372, 210), P(344, 210));
    for (const x of [402, 462, 522, 582]) {
      s += `<line class="fg-dash-hi" x1="${x}" y1="128" x2="${x}" y2="182"></line>`;
    }
    s += tag(502, 292, 'H-bonds run between strands');

    s += rule(26, 312, 654, 312);
    s += label(340, 336, 'Both are one interaction: a backbone N–H to a backbone C=O.');
    return s;
  },
  caption: 'The two standard secondary structures, side by side. Each dashed line is a hydrogen bond from a backbone N–H to a backbone C=O. In a helix the two partners are four residues apart on the same chain, so the bonds run along the axis; in a sheet they are on neighboring strands, so the bonds run across.',
  note: 'Notice what is dashed and what is solid. Nothing holding either shape together is a covalent bond, which is why heat unfolds a protein without breaking a single bond in the chain — and why the side chains, which take no part in either pattern, are free to decide the fold at the next level up.',
});

export default FIGURES;
